import { Router } from 'express'
import {
  listProfesseurs,
  getProfesseurDetail,
  createExpertiseForProfesseur,
  getMonActivite,
  createMyExpertise,
  createMyEncadrement,
  createMyActivite,
  removeExpertise,
  removeMyEncadrement,
  removeMyActivite,
} from '../controllers/Activiteecole.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Vue globale de tous les professeurs — accessible à l'admin ET au collaborateur
// (le collaborateur peut consulter l'activité école de tous ses collègues, en lecture
// seule ; seul l'admin peut ajouter une expertise pour un professeur autre que lui-même).
router.get('/professeurs', requireAuth, requireRole('admin', 'collaborateur'), listProfesseurs)
router.get('/professeurs/:id', requireAuth, requireRole('admin', 'collaborateur'), getProfesseurDetail)
router.post('/professeurs/:id/expertises', requireAuth, requireRole('admin'), createExpertiseForProfesseur)

// Collaborateur (professeur) — son propre espace : il peut tout ajouter pour lui-même
router.get('/moi', requireAuth, requireRole('collaborateur'), getMonActivite)
router.post('/moi/expertises', requireAuth, requireRole('collaborateur'), createMyExpertise)
router.post('/moi/encadrements', requireAuth, requireRole('collaborateur'), createMyEncadrement)
router.post('/moi/activites', requireAuth, requireRole('collaborateur'), createMyActivite)

// Suppression : l'admin peut retirer n'importe quelle expertise ; le collaborateur ne peut
// retirer que ses propres entrées (vérifié côté contrôleur via l'id du token).
router.delete('/expertises/:expertiseId', requireAuth, requireRole('admin', 'collaborateur'), removeExpertise)
router.delete('/encadrements/:encadrementId', requireAuth, requireRole('collaborateur'), removeMyEncadrement)
router.delete('/activites/:activiteId', requireAuth, requireRole('collaborateur'), removeMyActivite)

export default router