import { Hono } from 'hono'
import { getProducts, getProductById } from '../controllers/product-controller'

const router = new Hono()

router.get('/', getProducts)
router.get('/:id', getProductById)

export default router