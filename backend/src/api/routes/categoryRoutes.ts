import { Hono } from "hono";
import { authenticate, isAdmin } from "../middlewares/authMiddleware";
import { createCategory } from "../controllers/categoryController";

const app = new Hono();

// Admin-only route for creating a category
app.post("/", authenticate, isAdmin, createCategory);

export default app;