import { Router } from 'express'
import {
  listUsers,
  updateUser,
  removeUser,
  promoteToResponsable,
  ensureCollaborateurAccount,
  getMe,
  updateMyPreferences,
  updateMyProfil,
  updateMyPassword,
  listCollaborateursOptions,
} from '../controllers/users.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Profil du collaborateur connecté — déclaré avant '/:role/:id' pour ne pas être capturé par lui.
router.get('/me', requireAuth, requireRole('collaborateur'), getMe)
router.patch('/me/preferences', requireAuth, requireRole('collaborateur'), updateMyPreferences)
router.patch('/me/profil', requireAuth, requireRole('collaborateur'), updateMyProfil)
router.patch('/me/mot-de-passe', requireAuth, requireRole('collaborateur'), updateMyPassword)

// Liste allégée des collaborateurs — responsable (affectation membres/tâches) ou admin.
router.get('/collaborateurs-options', requireAuth, requireRole('admin', 'responsable'), listCollaborateursOptions)

router.get('/', requireAuth, requireRole('admin'), listUsers)
router.patch('/:role/:id', requireAuth, requireRole('admin'), updateUser)
router.delete('/:role/:id', requireAuth, requireRole('admin'), removeUser)
router.post('/collaborateurs/:id/promote-responsable', requireAuth, requireRole('admin'), promoteToResponsable)
router.post('/responsables/:id/ensure-collaborateur', requireAuth, requireRole('admin'), ensureCollaborateurAccount)

export default router