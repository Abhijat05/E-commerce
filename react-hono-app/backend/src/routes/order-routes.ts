import { Hono } from 'hono'
import { createOrder } from './../controllers/order-controller'
import { authMiddleware } from '../middleware/auth-middleware'

const router = new Hono()

router.post('/', authMiddleware, createOrder)

export default router