import { Context } from "hono";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/User";
import { z } from "zod";

// Validate registration data for normal users
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  role: z.enum([UserRole.B2B_CUSTOMER, UserRole.B2C_CUSTOMER]),
  // B2B specific fields
  companyName: z.string().optional(),
  businessType: z.string().optional(),
  taxId: z.string().optional(),
});

// Admin registration schema - allows creating an admin user
const adminRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  adminSecretKey: z.string(),  // Secret key to authorize admin creation
});

// Regular user registration
export const register = async (c: Context) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return c.json({ success: false, message: "Email already in use" }, 400);
    }
    
    // Create new user
    const user = new User(validatedData);
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, errors: error.errors }, 400);
    }
    console.error("Registration error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Admin registration - using a secret key
export const registerAdmin = async (c: Context) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validatedData = adminRegisterSchema.parse(body);
    
    // Verify admin secret key
    const adminSecretKey = process.env.ADMIN_SECRET_KEY as string;
    if (!adminSecretKey || validatedData.adminSecretKey !== adminSecretKey) {
      return c.json({ success: false, message: "Invalid admin secret key" }, 401);
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return c.json({ success: false, message: "Email already in use" }, 400);
    }
    
    // Create new admin user
    const user = new User({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      role: UserRole.ADMIN
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, errors: error.errors }, 400);
    }
    console.error("Admin registration error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Additional function for admins to create other admins
export const registerUserByAdmin = async (c: Context) => {
  try {
    // Only admins can use this endpoint (middleware will handle this check)
    const body = await c.req.json();
    
    // Allow admin to specify any role
    const validatedData = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().min(10),
      role: z.enum([UserRole.ADMIN, UserRole.B2B_CUSTOMER, UserRole.B2C_CUSTOMER]),
      companyName: z.string().optional(),
      businessType: z.string().optional(),
      taxId: z.string().optional(),
    }).parse(body);
    
    // Check if user exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return c.json({ success: false, message: "Email already in use" }, 400);
    }
    
    // Create new user with specified role
    const user = new User(validatedData);
    await user.save();
    
    return c.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, errors: error.errors }, 400);
    }
    console.error("Admin user creation error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Login for all users
export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validatedData = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(body);
    
    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }
    
    // Check password
    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, errors: error.errors }, 400);
    }
    console.error("Login error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

export const getCurrentUser = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    
    return c.json({ success: true, user });
  } catch (error) {
    console.error("Get current user error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};