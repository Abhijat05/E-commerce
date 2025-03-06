import { Context } from 'hono'
import User from '../models/User'
import * as jwt from 'jsonwebtoken'

// Generate JWT Token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'somesecretkey', {
    expiresIn: '30d',
  })
}

// Auth user & get token
export const authUser = async (c: Context) => {
  try {
    const body = await c.req.json()
    const { email, password } = body

    const user = await User.findOne({ email })

    if (!user) {
      c.status(401)
      return c.json({ message: 'Invalid email or password' })
    }
    
    // Assuming you have a method to check password in your User model
    const isPasswordMatch = await user.matchPassword(password)
    
    if (isPasswordMatch) {
      return c.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id.toString()),
      })
    } else {
      c.status(401)
      return c.json({ message: 'Invalid email or password' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Register a new user
export const registerUser = async (c: Context) => {
  try {
    const body = await c.req.json()
    const { name, email, password } = body

    const userExists = await User.findOne({ email })

    if (userExists) {
      c.status(400)
      return c.json({ message: 'User already exists' })
    }

    const user = await User.create({
      name,
      email,
      password,
    })

    if (user) {
      c.status(201)
      return c.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id.toString()),
      })
      console.log('User created')
    } else {
      c.status(400)
      return c.json({ message: 'Invalid user data' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Get user profile
export const getUserProfile = async (c: Context) => {
  try {
    const user = c.get('user')
    if (user) {
      return c.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      })
    } else {
      c.status(404)
      return c.json({ message: 'User not found' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Update user profile
export const updateUserProfile = async (c: Context) => {
  try {
    const user = await User.findById(c.get('user')._id)
    
    if (user) {
      const body = await c.req.json()
      
      user.name = body.name || user.name
      user.email = body.email || user.email
      
      if (body.password) {
        user.password = body.password
      }
      
      const updatedUser = await user.save()
      
      return c.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id.toString()),
      })
    } else {
      c.status(404)
      return c.json({ message: 'User not found' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Get all users (admin only)
export const getUsers = async (c: Context) => {
  try {
    const users = await User.find({})
    return c.json(users)
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Delete user (admin only)
export const deleteUser = async (c: Context) => {
  try {
    const user = await User.findById(c.req.param('id'))
    
    if (user) {
      await user.deleteOne()
      return c.json({ message: 'User removed' })
    } else {
      c.status(404)
      return c.json({ message: 'User not found' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Get user by ID (admin only)
export const getUserById = async (c: Context) => {
  try {
    const user = await User.findById(c.req.param('id')).select('-password')
    
    if (user) {
      return c.json(user)
    } else {
      c.status(404)
      return c.json({ message: 'User not found' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}

// Update user (admin only)
export const updateUser = async (c: Context) => {
  try {
    const user = await User.findById(c.req.param('id'))
    
    if (user) {
      const body = await c.req.json()
      
      user.name = body.name || user.name
      user.email = body.email || user.email
      user.isAdmin = body.isAdmin !== undefined ? body.isAdmin : user.isAdmin
      
      const updatedUser = await user.save()
      
      return c.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      })
    } else {
      c.status(404)
      return c.json({ message: 'User not found' })
    }
  } catch (error) {
    c.status(500)
    return c.json({ message: 'Server Error' })
  }
}