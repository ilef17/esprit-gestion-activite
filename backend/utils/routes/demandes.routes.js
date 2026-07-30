import { Router } from 'express'
import {
  listDemandes,
  listMesDemandes,
  addDemande,
  updateStatut,
  removeDemande,
} from '../controllers/demandes.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), listDemandes)
// "Activités hors-équipe" — le collaborateur connecté consulte les siennes.
router.get('/mes-demandes', requireAuth, requireRole('collaborateur'), listMesDemandes)
router.post('/', requireAuth, requireRole('admin', 'collaborateur'), addDemande)
// Le collaborateur fait évoluer le statut de sa propre activité (à faire / en cours / faite).
router.patch('/:id', requireAuth, requireRole('collaborateur'), updateStatut)
router.delete('/:id', requireAuth, requireRole('admin'), removeDemande)

export default router