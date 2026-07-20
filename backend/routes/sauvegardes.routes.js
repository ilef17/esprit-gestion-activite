import { Router } from 'express'
import {
  listSauvegardes,
  creerSauvegardeManuelle,
  telechargerSauvegarde,
  verifierIntegriteSauvegarde,
  removeSauvegarde,
} from '../controllers/sauvegardes.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), listSauvegardes)
router.post('/', requireAuth, requireRole('admin'), creerSauvegardeManuelle)
router.get('/:id/fichier', requireAuth, requireRole('admin'), telechargerSauvegarde)
router.get('/:id/verifier', requireAuth, requireRole('admin'), verifierIntegriteSauvegarde)
router.delete('/:id', requireAuth, requireRole('admin'), removeSauvegarde)

export default router
