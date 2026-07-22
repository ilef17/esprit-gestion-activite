import bcrypt from 'bcryptjs'
import { isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../utils/passwordrules.js'
import {
  getAllCollaborateurs,
  getCollaborateurById,
  findCollaborateurByEmailOrIdentifiant,
  createCollaborateurFromResponsable,
  updateCollaborateur,
  deleteCollaborateur,
  getMonProfil,
  updateMesPreferences,
  updateMonIdentite,
  updateCollaborateurPasswordById,
} from '../models/collaborateur.model.js'
import { getMesScores } from '../models/evaluationScore.model.js'
import { getBornesPeriode } from '../utils/periode.js'
import {
  getAllResponsables,
  getResponsableById,
  findResponsableByEmailOrIdentifiant,
  createResponsableFromCollaborateur,
  updateResponsable,
  deleteResponsable,
  getMonProfilResponsable,
  updateMesPreferencesResponsable,
  updateMonIdentiteResponsable,
  updateResponsablePasswordById,
} from '../models/responsable.model.js'
import {
  getAdminById,
  getMonProfilAdmin,
  updateMesPreferencesAdmin,
  updateMonIdentiteAdmin,
  updateAdminPasswordById,
} from '../models/admin.model.js'

// Un même compte peut exister à la fois côté collaborateur et côté responsable
// (promotion bidirectionnelle — voir promoteToResponsable / ensureCollaborateurAccount,
// qui créent ce compte miroir avec les mêmes identifiants de connexion). Quand l'un des
// deux modifie son nom/email depuis "Mon profil", on répercute le changement sur l'autre
// pour que les deux dashboards restent synchronisés — sinon le responsable ne voit jamais
// le nouveau nom choisi côté collaborateur (et inversement).
async function syncIdentiteVersResponsable(compteCollaborateurAvant, { nom, email }) {
  if (!compteCollaborateurAvant) return
  const lie = await findResponsableByEmailOrIdentifiant(
    compteCollaborateurAvant.email,
    compteCollaborateurAvant.identifiant_esprit || '__none__'
  )
  if (lie) {
    await updateMonIdentiteResponsable(lie.id_responsable, { nom, email })
  }
}

async function syncIdentiteVersCollaborateur(compteResponsableAvant, { nom, email }) {
  if (!compteResponsableAvant) return
  const lie = await findCollaborateurByEmailOrIdentifiant(
    compteResponsableAvant.email,
    compteResponsableAvant.identifiant_esprit || '__none__'
  )
  if (lie) {
    await updateMonIdentite(lie.id_collaborateur, { nom, email })
  }
}

// Parse un champ GROUP_CONCAT de la forme "id:nom||id:nom" en liste structurée
function parseEquipesField(raw, type) {
  if (!raw) return []
  return raw.split('||').map((entry) => {
    const [id, ...rest] = entry.split(':')
    return { type, id: Number(id), nom: rest.join(':') }
  })
}

// Combine les affectations UP et hors-UP : une chaîne d'affichage + une liste
// structurée (type/id/nom) utilisée par le front pour retirer une affectation précise.
function combineEquipes(row) {
  const list = [
    ...parseEquipesField(row.sous_equipes, 'up'),
    ...parseEquipesField(row.equipes_hors_up, 'hors_up'),
  ]
  return { display: list.map((e) => e.nom).join(', ') || null, list }
}

// Liste allégée des collaborateurs — utilisée par le responsable pour affecter des
// membres à sa sous-équipe ou assigner une tâche (pas les infos sensibles de la
// page admin "Utilisateurs").
export async function listCollaborateursOptions(req, res) {
  try {
    const collaborateurs = await getAllCollaborateurs()
    res.json(collaborateurs.map((c) => ({
      id_collaborateur: c.id_collaborateur,
      nom: c.nom,
      email: c.email,
      actif: !!c.actif,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Vue unifiée pour la page "Utilisateurs" du dashboard admin
export async function listUsers(req, res) {
  try {
    const [collaborateurs, responsables] = await Promise.all([
      getAllCollaborateurs(),
      getAllResponsables(),
    ])

    // Filtre Année/Semestre global (tableau de bord) : ne montrer que les comptes
    // créés durant la période sélectionnée. Sans paramètres, comportement inchangé
    // (tous les comptes, toutes périodes confondues).
    const { annee_universitaire, semestre } = req.query
    let dansPeriode = () => true
    if (annee_universitaire && semestre) {
      const { debut, fin } = getBornesPeriode(annee_universitaire, semestre)
      const debutTime = new Date(debut).getTime()
      const finTime = new Date(fin).getTime()
      dansPeriode = (dateCreation) => {
        const t = new Date(dateCreation).getTime()
        return t >= debutTime && t < finTime
      }
    }

    const users = [
      ...responsables.filter((r) => dansPeriode(r.date_creation)).map((r) => {
        const { display, list } = combineEquipes(r)
        return {
          id: r.id_responsable,
          role: 'responsable',
          roleLabel: 'Responsable',
          nom: r.nom,
          email: r.email,
          identifiant_esprit: r.identifiant_esprit,
          equipes: display,
          equipesList: list,
          actif: !!r.actif,
        }
      }),
      ...collaborateurs.filter((c) => dansPeriode(c.date_creation)).map((c) => {
        const { display, list } = combineEquipes(c)
        return {
          id: c.id_collaborateur,
          role: 'collaborateur',
          roleLabel: 'Collaborateur',
          nom: c.nom,
          email: c.email,
          identifiant_esprit: c.identifiant_esprit,
          equipes: display,
          equipesList: list,
          actif: !!c.actif,
        }
      }),
    ]

    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function updateUser(req, res) {
  try {
    const { role, id } = req.params
    if (role === 'responsable') {
      const updated = await updateResponsable(id, req.body)
      return res.json(updated)
    }
    if (role === 'collaborateur') {
      const updated = await updateCollaborateur(id, req.body)
      return res.json(updated)
    }
    res.status(400).json({ message: 'Rôle invalide.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeUser(req, res) {
  try {
    const { role, id } = req.params
    if (role === 'responsable') {
      await deleteResponsable(id)
      return res.status(204).end()
    }
    if (role === 'collaborateur') {
      await deleteCollaborateur(id)
      return res.status(204).end()
    }
    res.status(400).json({ message: 'Rôle invalide.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Promeut un collaborateur en responsable : crée un compte responsable qui réutilise
// les mêmes identifiants de connexion (email / identifiant ESPRIT / mot de passe déjà hashé),
// afin qu'il puisse ensuite être désigné responsable d'une sous-équipe ou d'une équipe hors UP.
// Si un compte responsable existe déjà pour cet email/identifiant, on le réutilise (pas de doublon).
export async function promoteToResponsable(req, res) {
  try {
    const collaborateur = await getCollaborateurById(req.params.id)
    if (!collaborateur) return res.status(404).json({ message: 'Collaborateur non trouvé' })

    const existing = await findResponsableByEmailOrIdentifiant(collaborateur.email, collaborateur.identifiant_esprit)
    if (existing) {
      const { mot_de_passe, ...safe } = existing
      return res.status(200).json(safe)
    }

    const created = await createResponsableFromCollaborateur({
      nom: collaborateur.nom,
      email: collaborateur.email,
      identifiant_esprit: collaborateur.identifiant_esprit,
      mot_de_passe: collaborateur.mot_de_passe,
    })
    const { mot_de_passe, ...safe } = created
    res.status(201).json(safe)
  } catch (err) {
    console.error(err)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Un compte responsable existe déjà avec cet email ou cet identifiant.' })
    }
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Symétrique de promoteToResponsable : un responsable est aussi un collaborateur potentiel
// (un chef d'équipe peut être membre d'une autre sous-équipe). On garantit qu'un compte
// collaborateur existe pour ce responsable — en le créant si besoin, avec les mêmes
// identifiants de connexion — afin qu'il puisse être ajouté comme membre d'une (sous-)équipe.
export async function ensureCollaborateurAccount(req, res) {
  try {
    const responsable = await getResponsableById(req.params.id)
    if (!responsable) return res.status(404).json({ message: 'Responsable non trouvé' })

    const existing = await findCollaborateurByEmailOrIdentifiant(responsable.email, responsable.identifiant_esprit)
    if (existing) {
      const { mot_de_passe, ...safe } = existing
      return res.status(200).json(safe)
    }

    const created = await createCollaborateurFromResponsable({
      nom: responsable.nom,
      email: responsable.email,
      identifiant_esprit: responsable.identifiant_esprit,
      mot_de_passe: responsable.mot_de_passe,
    })
    const { mot_de_passe, ...safe } = created
    res.status(201).json(safe)
  } catch (err) {
    console.error(err)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Un compte collaborateur existe déjà avec cet email ou cet identifiant.' })
    }
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- Profil du collaborateur connecté (page "Mon profil") ----------

// Identité, sous-équipes, responsable(s) et dernier score, pour l'utilisateur du token.
export async function getMe(req, res) {
  try {
    if (req.user.role === 'admin') {
      const profil = await getMonProfilAdmin(req.user.id)
      if (!profil) return res.status(404).json({ message: 'Profil introuvable' })
      return res.json(profil)
    }
    if (req.user.role === 'responsable') {
      const profil = await getMonProfilResponsable(req.user.id)
      if (!profil) return res.status(404).json({ message: 'Profil introuvable' })
      return res.json(profil)
    }
    if (req.user.role !== 'collaborateur') {
      return res.status(403).json({ message: "Réservé aux comptes admin, collaborateur ou responsable." })
    }
    const profil = await getMonProfil(req.user.id)
    if (!profil) return res.status(404).json({ message: 'Profil introuvable' })
    const mesScores = await getMesScores(req.user.id, req.query.annee_universitaire, req.query.semestre)
    res.json({ ...profil, mes_scores: mesScores })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Mise à jour des toggles "Préférences du compte" (notifications, visibilité du profil).
export async function updateMyPreferences(req, res) {
  try {
    const { notifications_email, profil_visible } = req.body
    if (req.user.role === 'admin') {
      const updated = await updateMesPreferencesAdmin(req.user.id, { notifications_email })
      if (!updated) return res.status(404).json({ message: 'Profil introuvable' })
      return res.json(updated)
    }
    if (req.user.role === 'responsable') {
      const updated = await updateMesPreferencesResponsable(req.user.id, { notifications_email, profil_visible })
      if (!updated) return res.status(404).json({ message: 'Profil introuvable' })
      return res.json(updated)
    }
    if (req.user.role !== 'collaborateur') {
      return res.status(403).json({ message: "Réservé aux comptes admin, collaborateur ou responsable." })
    }
    const updated = await updateMesPreferences(req.user.id, { notifications_email, profil_visible })
    if (!updated) return res.status(404).json({ message: 'Profil introuvable' })
    const mesScores = await getMesScores(req.user.id, req.query.annee_universitaire, req.query.semestre)
    res.json({ ...updated, mes_scores: mesScores })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Édition de l'identité (nom / email) depuis "Mon profil". L'email doit rester unique
// tous comptes confondus (collaborateur/responsable partagent le même espace de login).
export async function updateMyProfil(req, res) {
  try {
    const nom = String(req.body.nom || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!nom || !email) {
      return res.status(400).json({ message: 'Le nom et l\'email sont requis.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Adresse email invalide.' })
    }
    if (req.user.role === 'admin') {
      const updated = await updateMonIdentiteAdmin(req.user.id, { nom, email })
      if (!updated) return res.status(404).json({ message: 'Profil introuvable' })
      return res.json(updated)
    }
    if (req.user.role === 'responsable') {
      const existant = await findResponsableByEmailOrIdentifiant(email, '__none__')
      if (existant && existant.id_responsable !== req.user.id) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte.' })
      }
      // Capturé avant la mise à jour : sert à retrouver le compte collaborateur lié
      // (même email/identifiant), pour lui répercuter le nouveau nom/email.
      const compteActuel = await getResponsableById(req.user.id)
      const updated = await updateMonIdentiteResponsable(req.user.id, { nom, email })
      if (!updated) return res.status(404).json({ message: 'Profil introuvable' })
      await syncIdentiteVersCollaborateur(compteActuel, { nom, email })
      return res.json(updated)
    }
    if (req.user.role !== 'collaborateur') {
      return res.status(403).json({ message: "Réservé aux comptes admin, collaborateur ou responsable." })
    }
    const existant = await findCollaborateurByEmailOrIdentifiant(email, '__none__')
    if (existant && existant.id_collaborateur !== req.user.id) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte.' })
    }
    // Capturé avant la mise à jour : sert à retrouver le compte responsable lié
    // (même email/identifiant), pour lui répercuter le nouveau nom/email.
    const compteActuel = await getCollaborateurById(req.user.id)
    const updated = await updateMonIdentite(req.user.id, { nom, email })
    if (!updated) return res.status(404).json({ message: 'Profil introuvable' })
    await syncIdentiteVersResponsable(compteActuel, { nom, email })
    const mesScores = await getMesScores(req.user.id, req.query.annee_universitaire, req.query.semestre)
    res.json({ ...updated, mes_scores: mesScores })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Changement de mot de passe depuis "Mon profil" — exige le mot de passe actuel.
export async function updateMyPassword(req, res) {
  try {
    const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body
    if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis.' })
    }
    if (!isPasswordStrong(nouveau_mot_de_passe)) {
      return res.status(400).json({ message: PASSWORD_RULES_MESSAGE })
    }

    if (req.user.role === 'admin') {
      const compte = await getAdminById(req.user.id)
      if (!compte) return res.status(404).json({ message: 'Profil introuvable' })
      const ok = await bcrypt.compare(mot_de_passe_actuel, compte.mot_de_passe)
      if (!ok) return res.status(400).json({ message: 'Mot de passe actuel incorrect.' })
      const hashed = await bcrypt.hash(nouveau_mot_de_passe, 10)
      await updateAdminPasswordById(req.user.id, hashed)
      return res.json({ message: 'Mot de passe mis à jour avec succès.' })
    }

    if (req.user.role === 'responsable') {
      const compte = await getResponsableById(req.user.id)
      if (!compte) return res.status(404).json({ message: 'Profil introuvable' })
      const ok = await bcrypt.compare(mot_de_passe_actuel, compte.mot_de_passe)
      if (!ok) return res.status(400).json({ message: 'Mot de passe actuel incorrect.' })
      const hashed = await bcrypt.hash(nouveau_mot_de_passe, 10)
      await updateResponsablePasswordById(req.user.id, hashed)
      return res.json({ message: 'Mot de passe mis à jour avec succès.' })
    }

    if (req.user.role !== 'collaborateur') {
      return res.status(403).json({ message: "Réservé aux comptes admin, collaborateur ou responsable." })
    }
    const compte = await getCollaborateurById(req.user.id)
    if (!compte) return res.status(404).json({ message: 'Profil introuvable' })
    const ok = await bcrypt.compare(mot_de_passe_actuel, compte.mot_de_passe)
    if (!ok) return res.status(400).json({ message: 'Mot de passe actuel incorrect.' })

    const hashed = await bcrypt.hash(nouveau_mot_de_passe, 10)
    await updateCollaborateurPasswordById(req.user.id, hashed)
    res.json({ message: 'Mot de passe mis à jour avec succès.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}