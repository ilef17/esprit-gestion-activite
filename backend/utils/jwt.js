import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function signToken(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d', ...options })
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}