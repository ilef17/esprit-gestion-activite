import bcrypt from 'bcryptjs'
import { isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../utils/passwordrules.js'
import {
  findAdminByLogin,
  findAdminByEmail,
  findAdminByEmailOrIdentifiant,
  createAdmin,
  updateAdminPassword,
} from '../models/admin.model.js'
import {
  findResponsableByLogin,
  findResponsableByEmailOrIdentifiant,
  createResponsable,
  updateResponsablePassword,
} from '../models/responsable.model.js'
import {
  findCollaborateurByLogin,
  findCollaborateurByEmailOrIdentifiant,
  createCollaborateur,
  addCollaborateurToSousEquipes,
  updateCollaborateurPassword,
} from '../models/collaborateur.model.js'
import { signToken, verifyToken } from '../utils/jwt.js'
import { verifyCaptcha } from '../utils/verifyCaptcha.js'
import { sendResetCodeEmail } from '../utils/Mailer.js'
import crypto from 'crypto'

const ROLES = ['admin', 'responsable', 'collaborateur']

// ---------- LOGIN ----------
export async function login(req, res) {
  try {
    console.log('LOGIN REQUEST BODY:', req.body)
    const captchaValid = await verifyCaptcha(req.body.captchaToken)
    if (!captchaValid) {
      return res.status(400).json({ message: 'Vérification anti-robot échouée.' })
    }

    const { role, login: identifiant, password } = req.body
  

    if (!role || !identifiant || !password) {
      return res.status(400).json({ message: 'Rôle, identifiant et mot de passe requis.' })
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' })
    }

    let user
    let idField

    if (role === 'admin') {
      user = await findAdminByLogin(identifiant)
      idField = 'id_admin'
    } else if (role === 'responsable') {
      user = await findResponsableByLogin(identifiant)
      idField = 'id_responsable'
    } else {
      user = await findCollaborateurByLogin(identifiant)
      idField = 'id_collaborateur'
    }

    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' })
    }

    const valid = await bcrypt.compare(password, user.mot_de_passe)
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects.' })
    }

    const token = signToken({ id: user[idField], role })

    const { mot_de_passe, ...userSafe } = user

    res.json({ token, role, user: userSafe })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- SIGNUP ----------
export async function signup(req, res) {
  try {
    const captchaValid = await verifyCaptcha(req.body.captchaToken)
    if (!captchaValid) {
      return res.status(400).json({ message: 'Vérification anti-robot échouée.' })
    }

    const {
      role,
      prenom,
      nom,
      email,
      identifiant_esprit,
      password,
      sousEquipeIds,
    } = req.body

    if (!role || !nom || !email || !identifiant_esprit || !password) {
      return res.status(400).json({ message: 'Champs requis manquants.' })
    }
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ message: PASSWORD_RULES_MESSAGE })
    }
    if (!['admin', 'responsable', 'collaborateur'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide pour l\'inscription.' })
    }

    // La création d'un compte Admin n'est jamais publique : elle exige qu'un
    // administrateur soit déjà connecté (jeton Bearer valide, rôle admin).
    if (role === 'admin') {
      const header = req.headers.authorization
      const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null
      let requester = null
      try {
        requester = token ? verifyToken(token) : null
      } catch {
        requester = null
      }
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ message: 'Seul un administrateur connecté peut créer un compte administrateur.' })
      }
    }

    const fullName = prenom ? `${prenom} ${nom}` : nom
    const hashed = await bcrypt.hash(password, 10)

    if (role === 'admin') {
      const existing = await findAdminByEmailOrIdentifiant(email, identifiant_esprit)
      if (existing) {
        return res.status(409).json({ message: 'Un compte existe déjà avec cet email ou identifiant.' })
      }
      const newAdmin = await createAdmin({
        nom: fullName,
        email,
        identifiant_esprit,
        mot_de_passe: hashed,
      })
      const token = signToken({ id: newAdmin.id_admin, role })
      return res.status(201).json({ token, role, user: newAdmin })
    }

    if (role === 'responsable') {
      const existing = await findResponsableByEmailOrIdentifiant(email, identifiant_esprit)
      if (existing) {
        return res.status(409).json({ message: 'Un compte existe déjà avec cet email ou identifiant.' })
      }
      const newResponsable = await createResponsable({
        nom: fullName,
        email,
        identifiant_esprit,
        mot_de_passe: hashed,
      })
      const token = signToken({ id: newResponsable.id_responsable, role })
      return res.status(201).json({ token, role, user: newResponsable })
    }

    // collaborateur
    const existing = await findCollaborateurByEmailOrIdentifiant(email, identifiant_esprit)
    if (existing) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email ou identifiant.' })
    }
    const newCollaborateur = await createCollaborateur({
      nom: fullName,
      email,
      identifiant_esprit,
      mot_de_passe: hashed,
    })
    if (Array.isArray(sousEquipeIds) && sousEquipeIds.length > 0) {
      await addCollaborateurToSousEquipes(newCollaborateur.id_collaborateur, sousEquipeIds)
    }
    const token = signToken({ id: newCollaborateur.id_collaborateur, role })
    res.status(201).json({ token, role, user: newCollaborateur })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- MOT DE PASSE OUBLIÉ ----------

function generateSixDigitCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

async function findUserByRoleAndEmail(role, email) {
  if (role === 'admin') return findAdminByEmail(email)
  if (role === 'responsable') return findResponsableByEmailOrIdentifiant(email, email)
  return findCollaborateurByEmailOrIdentifiant(email, email)
}

// Étape 1 : demande de code. Réponse volontairement générique dans tous les cas
// (on ne révèle jamais si un email existe ou non côté client).
//
// Rien n'est stocké en base pour le code : son hash bcrypt voyage dans un jeton
// signé et à courte durée de vie ("pendingToken") renvoyé au front, qui le garde
// en mémoire le temps de l'étape 2. Comme le code change de toute façon à chaque
// nouvel envoi, il n'y a pas besoin de le persister côté serveur.
export async function forgotPassword(req, res) {
  try {
    const { role, email } = req.body
    if (!role || !email) {
      return res.status(400).json({ message: 'Rôle et email requis.' })
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' })
    }

    const user = await findUserByRoleAndEmail(role, email)
    let pendingToken = null

    if (user) {
      const code = generateSixDigitCode()
      const codeHash = await bcrypt.hash(code, 10)
      pendingToken = signToken(
        { purpose: 'password-reset-pending', role, email, codeHash },
        { expiresIn: '10m' }
      )
      sendResetCodeEmail({ to: email, identifiant: user.identifiant_esprit || user.nom, code })
        .catch((err) => console.error('Erreur envoi email de réinitialisation:', err))
    } else {
      // Même en l'absence de compte, on renvoie un jeton "leurre" de la même forme
      // pour ne pas révéler si l'email existe via un simple diff de réponse.
      pendingToken = signToken(
        { purpose: 'password-reset-pending', role, email, codeHash: await bcrypt.hash(crypto.randomUUID(), 10) },
        { expiresIn: '10m' }
      )
    }

    res.json({
      message: "Si un compte existe avec cet email, un code de vérification vient d'être envoyé.",
      pendingToken,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Étape 2 : vérification du code à 6 chiffres contre le hash porté par le pendingToken.
// Si valide, on émet un nouveau jeton court ("resetToken") qui autorise l'étape 3.
export async function verifyResetCode(req, res) {
  try {
    const { pendingToken, code } = req.body
    if (!pendingToken || !code) {
      return res.status(400).json({ message: 'Champs requis manquants.' })
    }

    let payload
    try {
      payload = verifyToken(pendingToken)
    } catch {
      return res.status(400).json({ message: 'Code expiré. Redemandez un code.' })
    }
    if (payload.purpose !== 'password-reset-pending') {
      return res.status(400).json({ message: 'Jeton invalide.' })
    }

    const valid = await bcrypt.compare(code, payload.codeHash)
    if (!valid) {
      return res.status(400).json({ message: 'Code invalide.' })
    }

    const resetToken = signToken(
      { purpose: 'password-reset', role: payload.role, email: payload.email },
      { expiresIn: '10m' }
    )
    res.json({ resetToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Étape 3 : nouveau mot de passe, protégée par le resetToken émis à l'étape 2.
export async function resetPassword(req, res) {
  try {
    const { resetToken, password } = req.body
    if (!resetToken || !password) {
      return res.status(400).json({ message: 'Champs requis manquants.' })
    }
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ message: PASSWORD_RULES_MESSAGE })
    }

    let payload
    try {
      payload = verifyToken(resetToken)
    } catch {
      return res.status(400).json({ message: 'Session de réinitialisation expirée. Recommencez.' })
    }
    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Jeton de réinitialisation invalide.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    if (payload.role === 'admin') await updateAdminPassword(payload.email, hashed)
    else if (payload.role === 'responsable') await updateResponsablePassword(payload.email, hashed)
    else await updateCollaborateurPassword(payload.email, hashed)

    res.json({ message: 'Mot de passe réinitialisé avec succès.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}