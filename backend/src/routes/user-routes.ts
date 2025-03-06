import { Hono } from 'hono'
import { authUser, registerUser, getUserProfile, updateUserProfile, getUsers, deleteUser, getUserById, updateUser } from '../controllers/user-controller'
import { authMiddleware, adminMiddleware } from '../middleware/auth-middleware'

const router = new Hono()

// Public routes
router.post('/login', authUser)
router.post('/register', registerUser)

// Protected routes
router.get('/profile', authMiddleware, getUserProfile)
router.put('/profile', authMiddleware, updateUserProfile)

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getUsers)
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser)
router.get('/:id', authMiddleware, adminMiddleware, getUserById)
router.put('/:id', authMiddleware, adminMiddleware, updateUser)

export default router