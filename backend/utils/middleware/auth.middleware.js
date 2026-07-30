import { verifyToken } from '../utils/jwt.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non authentifié.' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = verifyToken(token)
    req.user = decoded // { id, role }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé.' })
    }
    next()
  }
}
