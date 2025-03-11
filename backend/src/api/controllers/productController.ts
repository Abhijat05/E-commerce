import { Context } from "hono";
import Product from "../models/Product";
import Category from "../models/Category";
import { z } from "zod";
import { UserRole } from "../models/User";

// Schema for product creation/update
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  sku: z.string().min(1),
  basePrice: z.number().positive(),
  b2bPrice: z.number().positive(),
  discountPercentage: z.number().min(0).max(100).optional(),
  category: z.string(),
  images: z.array(z.string()).optional(), // Make images optional
  stock: z.number().int().min(0),
  b2bMinimumOrder: z.number().int().min(1).optional(),
  features: z.array(
    z.object({
      name: z.string(),
      value: z.string()
    })
  ).optional()
});

// Get all products with optional filtering
export const getProducts = async (c: Context) => {
  try {
    const { category, search, sort, limit = "10", page = "1", minPrice, maxPrice } = c.req.query();
    
    const query: any = {};
    
    // Apply filters if provided
    if (category) {
      // Find the category and all its subcategories
      const categoryObj = await Category.findById(category);
      if (categoryObj) {
        // Get all subcategories
        const subcategories = await Category.find({ 
          $or: [
            { _id: category },
            { 'ancestors._id': category }
          ]
        });
        
        const categoryIds = subcategories.map(cat => cat._id);
        query.category = { $in: categoryIds };
      }
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Price range
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }
    
    // Pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    
    // Determine sort order
    let sortOption = {};
    if (sort === "price-asc") {
      sortOption = { basePrice: 1 };
    } else if (sort === "price-desc") {
      sortOption = { basePrice: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 }; // Default sort
    }
    
    // Get products
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limitInt);
      
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    return c.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        pages: Math.ceil(total / limitInt)
      }
    });
    
  } catch (error) {
    console.error("Get products error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Get single product by ID
export const getProductById = async (c: Context) => {
  try {
    const { id } = c.req.param();
    
    const product = await Product.findById(id).populate('category', 'name');
    
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    
    return c.json({ success: true, product });
  } catch (error) {
    console.error("Get product error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Create new product (Admin only)
export const createProduct = async (c: Context) => {
  try {
    // Double-check if user is admin (although middleware should have already checked)
    const userRole = c.get("userRole");
    if (userRole !== UserRole.ADMIN) {
      return c.json({ success: false, message: "Unauthorized" }, 403);
    }
    
    const body = await c.req.json();
    console.log("Received product data:", body); // Log the received data
    
    // Validate input
    try {
      const validatedData = productSchema.parse(body);
      console.log("Validated data:", validatedData); // Log the validated data
      
      // Check if category exists
      const categoryExists = await Category.findById(validatedData.category);
      if (!categoryExists) {
        return c.json({ success: false, message: "Category not found" }, 400);
      }
      console.log("Category found:", categoryExists); // Log the found category
      
      // Check if SKU exists
      const skuExists = await Product.findOne({ sku: validatedData.sku });
      if (skuExists) {
        return c.json({ success: false, message: "SKU already exists" }, 400);
      }
      
      // Create product
      const product = new Product(validatedData);
      await product.save();
      
      return c.json({ success: true, product }, 201);
    } catch (validationError) {
      console.error("Validation error:", validationError);
      if (validationError instanceof z.ZodError) {
        return c.json({ success: false, errors: validationError.errors }, 400);
      }
      throw validationError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Create product error:", error);
    // Return more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return c.json({ success: false, message: errorMessage }, 500);
  }
};

// Update product (Admin only)
export const updateProduct = async (c: Context) => {
  try {
    // Double-check if user is admin
    const userRole = c.get("userRole");
    if (userRole !== UserRole.ADMIN) {
      return c.json({ success: false, message: "Unauthorized" }, 403);
    }
    
    const { id } = c.req.param();
    const body = await c.req.json();
    
    // Validate input
    const validatedData = productSchema.parse(body);
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    
    // Check if category exists
    const categoryExists = await Category.findById(validatedData.category);
    if (!categoryExists) {
      return c.json({ success: false, message: "Category not found" }, 400);
    }
    
    // Check if SKU exists (if changed)
    if (validatedData.sku !== product.sku) {
      const skuExists = await Product.findOne({ sku: validatedData.sku });
      if (skuExists) {
        return c.json({ success: false, message: "SKU already exists" }, 400);
      }
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...validatedData, updatedAt: Date.now() },
      { new: true }
    ).populate('category', 'name');
    
    return c.json({ success: true, product: updatedProduct });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, errors: error.errors }, 400);
    }
    console.error("Update product error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Delete product (Admin only)
export const deleteProduct = async (c: Context) => {
  try {
    // Double-check if user is admin
    const userRole = c.get("userRole");
    if (userRole !== UserRole.ADMIN) {
      return c.json({ success: false, message: "Unauthorized" }, 403);
    }
    
    const { id } = c.req.param();
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    
    // Delete product
    await Product.findByIdAndDelete(id);
    
    return c.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};