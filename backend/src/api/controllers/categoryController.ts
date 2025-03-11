import { Context } from "hono";
import Category from "../models/Category"; // Adjust the import based on your project structure

export const createCategory = async (c: Context) => {
  try {
    const { name } = await c.req.json();

    // Check if category already exists
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return c.json({ success: false, message: "Category already exists" }, 400);
    }

    // Create new category
    const category = new Category({ name });
    await category.save();

    return c.json({ success: true, category }, 201);
  } catch (error) {
    console.error("Create category error:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
};