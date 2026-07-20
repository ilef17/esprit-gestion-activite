import { Router } from 'express'
import {
  adminListCampagnes,
  adminGetCampagne,
  adminCreateCampagne,
  adminUpdateCampagne,
  adminPublierCampagne,
  adminCloturerCampagne,
  adminDeleteCampagne,
  adminGetReponses,
  adminAjouterAffectation,
  adminSupprimerAffectation,
  collabGetQuestionnaire,
  collabSaveReponse,
  collabGetAffectations,
} from '../controllers/voeuxPedagogiques.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Admin : gestion des campagnes (les 8 questions sont fixes, seuls les choix
// de modules par campagne sont gérés ici) et consultation des réponses.
router.get('/campagnes', requireAuth, requireRole('admin'), adminListCampagnes)
router.get('/campagnes/:id', requireAuth, requireRole('admin'), adminGetCampagne)
router.post('/campagnes', requireAuth, requireRole('admin'), adminCreateCampagne)
router.put('/campagnes/:id', requireAuth, requireRole('admin'), adminUpdateCampagne)
router.post('/campagnes/:id/publier', requireAuth, requireRole('admin'), adminPublierCampagne)
router.post('/campagnes/:id/cloturer', requireAuth, requireRole('admin'), adminCloturerCampagne)
router.delete('/campagnes/:id', requireAuth, requireRole('admin'), adminDeleteCampagne)
router.get('/campagnes/:id/reponses', requireAuth, requireRole('admin'), adminGetReponses)
router.post('/reponses/:id/affectations', requireAuth, requireRole('admin'), adminAjouterAffectation)
router.delete('/affectations/:id', requireAuth, requireRole('admin'), adminSupprimerAffectation)

// Collaborateur : questionnaire actuellement publié + sa propre réponse.
router.get('/mon-questionnaire', requireAuth, requireRole('collaborateur'), collabGetQuestionnaire)
router.put('/ma-reponse', requireAuth, requireRole('collaborateur'), collabSaveReponse)
router.get('/mes-affectations', requireAuth, requireRole('collaborateur'), collabGetAffectations)

export default router