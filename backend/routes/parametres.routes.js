import { Router } from 'express'
import { fetchParametres, editParametres } from '../controllers/parametres.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Lecture : accessible à tous les rôles authentifiés (le collaborateur et le responsable
// doivent pouvoir afficher l'année/semestre actifs, même s'ils ne peuvent pas les modifier).
router.get('/', requireAuth, requireRole('admin', 'responsable', 'collaborateur'), fetchParametres)
router.put('/', requireAuth, requireRole('admin'), editParametres)

export default router