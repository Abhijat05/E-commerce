import { Context } from 'hono'
import Order from '../models/Order'

// Create new order
export const createOrder = async (c: Context) => {
  try {
    const body = await c.req.json()
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = body

    if (orderItems && orderItems.length === 0) {
      c.status(400)
      return c.json({ message: 'No order items' })
    } else {
      const order = await Order.create({
        orderItems,
        user: c.get('user')._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      })

      c.status(201)
      return c.json(order)
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}