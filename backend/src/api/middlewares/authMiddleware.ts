import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { UserRole } from "../models/User"; // Adjust the import based on your project structure

export const authenticate = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, message: "Auth token required" }, 401);
    }

    const token = authHeader.split(" ")[1];
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // Set the entire user object
    c.set("user", decoded);
    
    // Also set the role for convenience
    c.set("userRole", decoded.role);
    
    // Log for debugging
    console.log("Authenticated user:", decoded);
    
    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ success: false, message: "Invalid token" }, 401);
  }
};

export const isAdmin = async (c: Context, next: Next) => {
  try {
    const user = c.get("user");
    console.log("Checking admin access for user:", user);
    
    if (!user || user.role !== UserRole.ADMIN) {
      return c.json({ success: false, message: "Unauthorized" }, 403);
    }
    
    await next();
  } catch (error) {
    console.error("Admin check error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};

// Verify user is B2B customer
export const isB2BCustomer = async (c: Context, next: Next) => {
  const userRole = c.get("userRole");
  
  if (userRole !== UserRole.B2B_CUSTOMER) {
    return c.json({ success: false, message: "B2B customer access required" }, 403);
  }
  
  await next();
};

// Verify user is B2C customer
export const isB2CCustomer = async (c: Context, next: Next) => {
  const userRole = c.get("userRole");
  
  if (userRole !== UserRole.B2C_CUSTOMER) {
    return c.json({ success: false, message: "B2C customer access required" }, 403);
  }
  
  await next();
};

// Check if user has B2B or admin access
export const hasB2BAccess = async (c: Context, next: Next) => {
  const userRole = c.get("userRole");
  
  if (userRole !== UserRole.B2B_CUSTOMER && userRole !== UserRole.ADMIN) {
    return c.json({ success: false, message: "Access restricted to B2B customers and admins" }, 403);
  }
  
  await next();
};

// Check if user has B2C or admin access
export const hasB2CAccess = async (c: Context, next: Next) => {
  const userRole = c.get("userRole");
  
  if (userRole !== UserRole.B2C_CUSTOMER && userRole !== UserRole.ADMIN) {
    return c.json({ success: false, message: "Access restricted to B2C customers and admins" }, 403);
  }
  
  await next();
};