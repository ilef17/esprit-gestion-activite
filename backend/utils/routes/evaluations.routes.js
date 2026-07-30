import { Router } from 'express'
import { listScores, calculerScores, calculerTout, getGrille } from '../controllers/evaluations.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), listScores)
router.get('/grille', requireAuth, requireRole('admin'), getGrille)
router.post('/calculer', requireAuth, requireRole('admin'), calculerScores)
router.post('/calculer-tout', requireAuth, requireRole('admin'), calculerTout)

export default router