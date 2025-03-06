import * as dotenv from 'dotenv'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import mongoose from 'mongoose'
import productRoutes from './routes/product-routes'
import userRoutes from './routes/user-routes'
import orderRoutes from './routes/order-routes'

dotenv.config()

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    return conn;
  } catch (error: any) { // Use 'any' type to handle the error message property
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

// Routes
app.route('/api/products', productRoutes)
app.route('/api/users', userRoutes)
app.route('/api/orders', orderRoutes)

// Root route
app.get('/', (c) => {
  return c.json({ message: 'E-commerce API is running...' })
})

// Start server
const port = process.env.PORT || 3000

// Connect to the database, then start the server
connectDB().then(() => {
  serve({
    fetch: app.fetch,
    port: Number(port),
  })
  console.log(`Server is running on port ${port}`)
}).catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})