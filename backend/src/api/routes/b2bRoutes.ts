import { Hono } from "hono";
import { authenticate, isB2BCustomer } from "../middlewares/authMiddleware";
import { createOrder, getOrderById, getUserOrders } from "../controllers/orderController";
import { getProducts } from "../controllers/productController";

const app = new Hono();

// All B2B routes require B2B customer authentication
app.use("/*", authenticate, isB2BCustomer);

// B2B specific product routes
app.get("/products", getProducts); // Will show B2B pricing

// B2B order management routes
app.post("/orders", createOrder); // Create B2B order
app.get("/orders", getUserOrders); // Get B2B customer orders
app.get("/orders/:id", getOrderById); // Get specific B2B order

// B2B customer profile routes
app.get("/profile", (c) => c.json({ message: "B2B customer profile" }));

export default app;