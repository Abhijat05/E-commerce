import { Context } from 'hono'
import Product from './../models/Product'

// Get all products
export const getProducts = async (c: Context) => {
  try {
    const products = await Product.find({})
    return c.json(products)
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Get single product
export const getProductById = async (c: Context) => {
  try {
    const product = await Product.findById(c.req.param('id'))
    
    if (product) {
      return c.json(product)
    } else {
      c.status(404)
      return c.json({ message: 'Product not found' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}