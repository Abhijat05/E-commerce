import { Hono } from "hono";
import { authenticate, isB2CCustomer } from "../middlewares/authMiddleware";
import { createOrder, getOrderById, getUserOrders } from "../controllers/orderController";
import { getProducts } from "../controllers/productController";

const app = new Hono();

// All B2C routes require B2C customer authentication
app.use("/*", authenticate, isB2CCustomer);

// B2C specific product routes
app.get("/products", getProducts); // Will show retail pricing

// B2C order management routes
app.post("/orders", createOrder); // Create B2C order
app.get("/orders", getUserOrders); // Get B2C customer orders
app.get("/orders/:id", getOrderById); // Get specific B2C order

// B2C customer profile routes
app.get("/profile", (c) => c.json({ message: "B2C customer profile" }));

export default app;