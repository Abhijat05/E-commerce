import { Hono } from "hono";
import { authenticate, isAdmin } from "../middlewares/authMiddleware";
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from "../controllers/productController";

const app = new Hono();

// Public routes for product browsing
app.get("/", getProducts);
app.get("/:id", getProductById);

// Admin-only routes for product management
app.post("/", authenticate, isAdmin, createProduct);
app.put("/:id", authenticate, isAdmin, updateProduct);
app.delete("/:id", authenticate, isAdmin, deleteProduct);

export default app;