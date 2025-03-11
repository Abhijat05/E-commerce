import { Hono } from "hono";
import { login, register, registerAdmin } from "../controllers/authController";

const app = new Hono();

// Public auth routes
app.post("/register", register);
app.post("/login", login);
app.post("/register-admin", registerAdmin);

export default app;