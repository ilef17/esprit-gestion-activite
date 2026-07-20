import { Router } from 'express'
import { listScores, calculerScores, getGrille } from '../controllers/evaluations.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), listScores)
router.get('/grille', requireAuth, requireRole('admin'), getGrille)
router.post('/calculer', requireAuth, requireRole('admin'), calculerScores)

export default router