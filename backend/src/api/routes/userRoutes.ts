import { Hono } from "hono";
import { authenticate } from "../middlewares/authMiddleware";
import { getCurrentUser } from "../controllers/authController";

const app = new Hono();

// Protected user routes
app.use("/*", authenticate);
app.get("/me", getCurrentUser);

export default app;