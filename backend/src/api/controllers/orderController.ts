import { Context } from "hono";
import Order, { OrderStatus, PaymentStatus } from "../models/Order";
import Product from "../models/Product";
import User, { UserRole } from "../models/User";
import { z } from "zod";

// Validate order creation
const orderItemSchema = z.object({
  product: z.string(),
  quantity: z.number().int().positive()
});

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(10)
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  paymentMethod: z.string().min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  notes: z.string().optional()
});

// Create new order
export const createOrder = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    
    // Validate input
    const validatedData = orderSchema.parse(body);
    
    // Get user to determine B2B or B2C
    const user = await User.findById(userId);
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    
    const orderType = user.role === UserRole.B2B_CUSTOMER ? "B2B" : "B2C";
    
    // Process items and calculate totals
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of validatedData.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return c.json({ success: false, message: `Product not found: ${item.product}` }, 400);
      }
      
      // Check stock availability
      if (product.stock < item.quantity) {
        return c.json({ 
          success: false, 
          message: `Not enough stock for ${product.name}. Available: ${product.stock}`
        }, 400);
      }
      
      // For B2B orders, check minimum order quantity
      if (orderType === "B2B" && item.quantity < product.b2bMinimumOrder) {
        return c.json({ 
          success: false, 
          message: `Minimum order quantity for ${product.name} is ${product.b2bMinimumOrder}`
        }, 400);
      }
      
      // Calculate price based on customer type
      const price = orderType === "B2B" ? product.b2bPrice : product.basePrice;
      const itemTotal = price * item.quantity;
      
      // Add to subtotal
      subtotal += itemTotal;
      
      // Create order item with product snapshot
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: price,
        productSnapshot: {
          name: product.name,
          sku: product.sku,
          image: product.images[0]
        }
      });
      
      // Update product stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity }
      });
    }
    
    // Calculate tax and shipping (simplified)
    const taxRate = 0.1; // 10% tax
    const tax = subtotal * taxRate;
    
    // Shipping cost calculation (simplified)
    let shippingCost = 5; // Base shipping
    if (subtotal > 100) shippingCost = 0; // Free shipping over $100
    
    // Calculate total
    const total = subtotal + tax + shippingCost;
    
    // Create order
    const order = new Order({
      user: userId,
      orderType,
      items: orderItems,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: validatedData.paymentMethod,
      shippingAddress: validatedData.shippingAddress,
      billingAddress: validatedData.billingAddress,
      subtotal,
      tax,
      shippingCost,
      discount: 0, // No discount in this example
      total,
      notes: validatedData.notes
    });
    
    await order.save();
    
    return c.json({
      success: true,
      order: {
        id: order._id,
        total: order.total,
        status: order.status
      }
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, errors: error.errors }, 400);
    }
    console.error("Create order error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Get orders for current user
export const getUserOrders = async (c: Context) => {
  try {
    const userId = c.get("userId");
    
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images');
    
    return c.json({ success: true, orders });
  } catch (error) {
    console.error("Get user orders error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Get order by ID
export const getOrderById = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const userRole = c.get("userRole");
    const { id } = c.req.param();
    
    const order = await Order.findById(id)
      .populate('items.product', 'name images basePrice b2bPrice')
      .populate('user', 'firstName lastName email');
    
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }
    
    // Only allow admin or the order owner to view the order
    if (userRole !== UserRole.ADMIN && order.user._id.toString() !== userId) {
      return c.json({ success: false, message: "Unauthorized" }, 403);
    }
    
    return c.json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (c: Context) => {
  try {
    // Verify admin role
    const userRole = c.get("userRole");
    if (userRole !== UserRole.ADMIN) {
      return c.json({ success: false, message: "Unauthorized" }, 403);
    }
    
    const { id } = c.req.param();
    const { status } = await c.req.json();
    
    // Validate status is valid
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return c.json({ success: false, message: "Invalid status" }, 400);
    }
    
    const order = await Order.findById(id);
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }
    
    // Update the order status
    order.status = status as OrderStatus;
    order.updatedAt = new Date();
    await order.save();
    
    return c.json({ success: true, order });
  } catch (error) {
    console.error("Update order status error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};