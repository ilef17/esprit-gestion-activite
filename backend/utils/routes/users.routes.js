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

// Profil du compte connecté (admin, responsable ou collaborateur) — déclaré avant
// '/:role/:id' pour ne pas être capturé par lui. Le contrôleur distingue déjà le
// rôle via req.user.role ; la route ne doit pas restreindre plus que lui, sinon
// responsable/admin se prennent un 403 avant même d'atteindre le contrôleur.
router.get('/me', requireAuth, requireRole('collaborateur', 'responsable', 'admin'), getMe)
router.patch('/me/preferences', requireAuth, requireRole('collaborateur', 'responsable', 'admin'), updateMyPreferences)
router.patch('/me/profil', requireAuth, requireRole('collaborateur', 'responsable', 'admin'), updateMyProfil)
router.patch('/me/mot-de-passe', requireAuth, requireRole('collaborateur', 'responsable', 'admin'), updateMyPassword)

// Liste allégée des collaborateurs — responsable (affectation membres/tâches) ou admin.
router.get('/collaborateurs-options', requireAuth, requireRole('admin', 'responsable'), listCollaborateursOptions)

router.get('/', requireAuth, requireRole('admin'), listUsers)
router.patch('/:role/:id', requireAuth, requireRole('admin'), updateUser)
router.delete('/:role/:id', requireAuth, requireRole('admin'), removeUser)
router.post('/collaborateurs/:id/promote-responsable', requireAuth, requireRole('admin'), promoteToResponsable)
router.post('/responsables/:id/ensure-collaborateur', requireAuth, requireRole('admin'), ensureCollaborateurAccount)

export default router