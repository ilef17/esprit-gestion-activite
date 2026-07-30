import { Router } from 'express'
import { listRapports, addRapport, removeRapport, telechargerRapport } from '../controllers/rapports.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), listRapports)
router.post('/', requireAuth, requireRole('admin'), addRapport)
router.get('/:id/fichier', requireAuth, requireRole('admin'), telechargerRapport)
router.delete('/:id', requireAuth, requireRole('admin'), removeRapport)

export default router