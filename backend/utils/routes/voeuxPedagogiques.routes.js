import { Router } from 'express'
import {
  adminListCampagnes,
  adminGetCampagne,
  adminCreateCampagne,
  adminUpdateCampagne,
  adminPublierCampagne,
  adminCloturerCampagne,
  adminDeleteCampagne,
  adminAjouterQuestion,
  adminModifierQuestion,
  adminSupprimerQuestion,
  adminReordonnerQuestions,
  adminAjouterModule,
  adminModifierModule,
  adminSupprimerModule,
  adminGetReponses,
  adminGetPoolAffectation,
  adminAffecterClasse,
  adminRetirerAffectation,
  collabGetQuestionnaire,
  collabSaveReponse,
  collabGetClassesAffectees,
} from '../controllers/voeuxPedagogiques.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Admin : campagnes
router.get('/campagnes', requireAuth, requireRole('admin'), adminListCampagnes)
router.get('/campagnes/:id', requireAuth, requireRole('admin'), adminGetCampagne)
router.post('/campagnes', requireAuth, requireRole('admin'), adminCreateCampagne)
router.put('/campagnes/:id', requireAuth, requireRole('admin'), adminUpdateCampagne)
router.post('/campagnes/:id/publier', requireAuth, requireRole('admin'), adminPublierCampagne)
router.post('/campagnes/:id/cloturer', requireAuth, requireRole('admin'), adminCloturerCampagne)
router.delete('/campagnes/:id', requireAuth, requireRole('admin'), adminDeleteCampagne)

// Admin : form builder
router.post('/campagnes/:id/questions', requireAuth, requireRole('admin'), adminAjouterQuestion)
router.put('/questions/:id', requireAuth, requireRole('admin'), adminModifierQuestion)
router.delete('/questions/:id', requireAuth, requireRole('admin'), adminSupprimerQuestion)
router.put('/campagnes/:id/questions/reordonner', requireAuth, requireRole('admin'), adminReordonnerQuestions)

router.post('/campagnes/:id/modules', requireAuth, requireRole('admin'), adminAjouterModule)
router.put('/modules/:id', requireAuth, requireRole('admin'), adminModifierModule)
router.delete('/modules/:id', requireAuth, requireRole('admin'), adminSupprimerModule)

// Admin : réponses + affectation
router.get('/campagnes/:id/reponses', requireAuth, requireRole('admin'), adminGetReponses)
router.get('/campagnes/:id/affectation', requireAuth, requireRole('admin'), adminGetPoolAffectation)
router.post('/affectations', requireAuth, requireRole('admin'), adminAffecterClasse)
router.delete('/affectations/:id', requireAuth, requireRole('admin'), adminRetirerAffectation)

// Collaborateur
router.get('/mon-questionnaire', requireAuth, requireRole('collaborateur'), collabGetQuestionnaire)
router.put('/ma-reponse', requireAuth, requireRole('collaborateur'), collabSaveReponse)
router.get('/mes-classes-affectees', requireAuth, requireRole('collaborateur'), collabGetClassesAffectees)

export default router