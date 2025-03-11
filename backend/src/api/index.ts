import { Hono } from "hono";
import authRoutes from "./../api/routes/authRoutes";
import userRoutes from "./../api/routes/userRoutes";
import productRoutes from "./../api/routes/productRoutes";
import b2bRoutes from "./../api/routes/b2bRoutes";
import b2cRoutes from "./../api/routes/b2cRoutes";
import adminRoutes from "./../api/routes/adminRoutes";
import categoryRoutes from "./routes/categoryRoutes";

const app = new Hono();

// Health check route
app.get("/", (c) => c.json({ status: "API is running" }));

// Mount all routes
app.route("/auth", authRoutes);
app.route("/users", userRoutes);
app.route("/products", productRoutes);
app.route("/b2b", b2bRoutes);
app.route("/b2c", b2cRoutes);
app.route("/admin", adminRoutes);
app.route("/category", categoryRoutes)

export default app;