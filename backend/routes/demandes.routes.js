import { Router } from 'express'
import {
  listDemandes,
  listMesDemandes,
  addDemande,
  envoyerVerification,
  valider,
  refuser,
  removeDemande,
  confirmerDemande,
} from '../controllers/demandes.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Route publique : lien cliqué depuis l'email de vérification, pas d'authentification.
router.get('/confirmer', confirmerDemande)

router.get('/', requireAuth, requireRole('admin'), listDemandes)
// "Mes demandes" — le collaborateur connecté consulte ses propres demandes.
router.get('/mes-demandes', requireAuth, requireRole('collaborateur'), listMesDemandes)
router.post('/', requireAuth, requireRole('admin', 'collaborateur'), addDemande)
router.patch('/:id/envoyer', requireAuth, requireRole('admin'), envoyerVerification)
router.patch('/:id/valider', requireAuth, requireRole('admin'), valider)
router.patch('/:id/refuser', requireAuth, requireRole('admin'), refuser)
router.delete('/:id', requireAuth, requireRole('admin'), removeDemande)

export default router