import { Hono } from "hono";
import { authenticate, isAdmin } from "../middlewares/authMiddleware";
import { updateOrderStatus } from "../controllers/orderController";
import { registerUserByAdmin } from "../controllers/authController";

const app = new Hono();

// All admin routes require admin authentication
app.use("/*", authenticate, isAdmin);
app.post("/users/register", registerUserByAdmin);
app.get("/users", async (c) => {
  // Get all users (admin dashboard)
  return c.json({ message: "Admin users dashboard" });
});

// Order management routes
app.put("/orders/:id/status", updateOrderStatus);
app.get("/orders", async (c) => {
  // Get all orders (admin dashboard)
  return c.json({ message: "Admin orders dashboard" });
});

// Dashboard analytics
app.get("/dashboard", async (c) => {
  return c.json({ message: "Admin dashboard analytics" });
});

export default app;