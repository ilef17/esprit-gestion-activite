import { Router } from 'express'
import {
  getVueGlobale,
  getParCollaborateur,
  getParSousEquipe,
  getEtatAvancement,
  getMonEspace,
} from '../controllers/dashboard.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Admin uniquement — vues globales
router.get('/vue-globale', requireAuth, requireRole('admin'), getVueGlobale)
router.get('/par-collaborateur', requireAuth, requireRole('admin'), getParCollaborateur)
router.get('/etat-avancement', requireAuth, requireRole('admin'), getEtatAvancement)

// Admin ET responsable — le controller filtre déjà sur req.user pour le responsable
router.get('/par-sous-equipe', requireAuth, requireRole('admin', 'responsable'), getParSousEquipe)

// Collaborateur uniquement — toujours ses propres données
router.get('/mon-espace', requireAuth, requireRole('collaborateur'), getMonEspace)

export default router