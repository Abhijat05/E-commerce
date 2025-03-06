import { Context, Next } from 'hono'
import * as jwt from 'jsonwebtoken'
import User from '../models/User'

interface JwtPayload {
  id: string;
}

export const authMiddleware = async (c: Context, next: Next) => {
  let token

  if (c.req.header('Authorization')?.startsWith('Bearer')) {
    try {
      token = c.req.header('Authorization')?.split(' ')[1]

      const decoded = jwt.verify(token || '', process.env.JWT_SECRET || 'somesecretkey') as JwtPayload

      // Add user to context
      c.set('user', await User.findById(decoded.id).select('-password'))
      
      await next()
    } catch (error) {
      c.status(401)
      return c.json({ message: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    c.status(401)
    return c.json({ message: 'Not authorized, no token' })
  }
}

export const adminMiddleware = async (c: Context, next: Next) => {
  if (c.get('user') && c.get('user').isAdmin) {
    await next()
  } else {
    c.status(401)
    return c.json({ message: 'Not authorized as an admin' })
  }
}