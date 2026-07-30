import { Router } from 'express'
import { login, signup, forgotPassword, verifyResetCode, resetPassword } from '../controllers/auth.controller.js'

const router = Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/forgot-password', forgotPassword)
router.post('/verify-reset-code', verifyResetCode)
router.post('/reset-password', resetPassword)

export default router