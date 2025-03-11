import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import routes from "./../src/api/index";

// Load environment variables
dotenv.config();

// Create Hono app
const app = new Hono();

// Apply middleware
app.use(cors());

// Mount API routes
app.route("/api", routes);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Connect to database before starting server
connectDB().then(() => {
  // Start server
  const port = process.env.PORT || 3001;
  console.log(`Server is running on port ${port}`);
  
  serve({
    fetch: app.fetch,
    port: Number(port),
  });
});