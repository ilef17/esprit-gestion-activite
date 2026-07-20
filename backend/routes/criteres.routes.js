import { Router } from 'express'
import { listCriteres, addCritere, editCritere, removeCritere } from '../controllers/criteres.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), listCriteres)
router.post('/', requireAuth, requireRole('admin'), addCritere)
router.put('/:id', requireAuth, requireRole('admin'), editCritere)
router.delete('/:id', requireAuth, requireRole('admin'), removeCritere)

export default router
