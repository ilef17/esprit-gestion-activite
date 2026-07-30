import { Router } from 'express'
import {
  listSousEquipes,
  listSousEquipesDetaillees,
  getSousEquipe,
  listMembresSousEquipe,
  listMesSousEquipes,
  listMesEquipesCollaborateur,
  addSousEquipe,
  editSousEquipe,
  removeSousEquipe,
  addMembre,
  removeMembre,
} from '../controllers/sousEquipes.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Publique — utilisée par la page d'inscription pour choisir une sous-équipe
router.get('/', listSousEquipes)

// Responsable — ses propres sous-équipes (déclarée avant '/:id' pour ne pas être capturée par lui)
router.get('/mes-sous-equipes', requireAuth, requireRole('responsable'), listMesSousEquipes)

// Collaborateur — ses propres sous-équipes avec le responsable de chacune (formulaire
// "Nouvelle activité hors-équipe").
router.get('/mes-equipes', requireAuth, requireRole('collaborateur'), listMesEquipesCollaborateur)

// Ouverte à tout utilisateur authentifié (ex. collaborateur choisissant "le membre
// concerné" pour un problème de coordination sur une de ses tâches).
router.get('/:id/membres', requireAuth, listMembresSousEquipe)

// Admin
router.get('/detaillees', requireAuth, requireRole('admin'), listSousEquipesDetaillees)
router.get('/:id', requireAuth, requireRole('admin'), getSousEquipe)
router.post('/', requireAuth, requireRole('admin'), addSousEquipe)
router.put('/:id', requireAuth, requireRole('admin'), editSousEquipe)
router.delete('/:id', requireAuth, requireRole('admin'), removeSousEquipe)

// Gestion des membres — admin (toute sous-équipe) ou responsable (uniquement la sienne,
// vérifié dans le contrôleur).
router.post('/:id/membres', requireAuth, requireRole('admin', 'responsable'), addMembre)
router.delete('/:id/membres/:idCollaborateur', requireAuth, requireRole('admin', 'responsable'), removeMembre)

export default router