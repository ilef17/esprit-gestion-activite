import {
  getAllDemandes,
  getDemandesByCollaborateur,
  getDemandeById,
  getDemandeDetailById,
  createDemande,
  setDestinataireEtEnvoyer,
  validerDemande,
  refuserDemande,
  deleteDemande,
} from '../models/demandeHorsEquipe.model.js'
import { getParametres } from '../models/parametreSysteme.model.js'
import { signToken, verifyToken } from '../utils/jwt.js'
import { sendDemandeVerificationEmail, sendDemandeStatutEmail } from '../utils/Mailer.js'
import { creerNotification } from '../models/notification.model.js'

export async function listDemandes(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const periode = annee_universitaire && semestre ? { annee_universitaire, semestre } : null
    const demandes = await getAllDemandes(periode)
    res.json(demandes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Construit le lien de confirmation + envoie le mail préformaté à un destinataire
// donné. Partagé entre l'envoi manuel (Super Admin) et l'envoi automatique
// (paramètre "Génération automatique du mail de vérification").
async function envoyerMailPourDemande(idDemande, destinataire) {
  const detail = await getDemandeDetailById(idDemande)
  const confirmToken = signToken(
    { purpose: 'demande-confirmation', demandeId: Number(idDemande) },
    { expiresIn: '30d' }
  )
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
  const confirmUrl = `${backendUrl}/api/demandes/confirmer?token=${confirmToken}`

  sendDemandeVerificationEmail({
    to: destinataire,
    collaborateurNom: detail.collaborateur_nom,
    description: detail.description,
    contexte: detail.contexte,
    dateDebut: detail.date_debut,
    dateFin: detail.date_fin,
    confirmUrl,
  }).catch((err) => console.error('Erreur envoi email de vérification (demande):', err))
}

// Notifie par email le collaborateur auteur de la demande dès que son statut
// passe à "validee" ou "refusee" — quel que soit le chemin emprunté (validation
// manuelle du Super Admin, ou lien de confirmation automatique).
async function notifierCollaborateurStatut(idDemande, statut) {
  const detail = await getDemandeDetailById(idDemande)
  if (!detail) return
  sendDemandeStatutEmail({
    to: detail.collaborateur_email,
    collaborateurNom: detail.collaborateur_nom,
    description: detail.description,
    statut,
  }).catch((err) => console.error('Erreur envoi email de notification (demande):', err))

  creerNotification({
    id_utilisateur: detail.id_collaborateur,
    type_utilisateur: 'collaborateur',
    type: 'demande_reponse',
    titre: statut === 'validee' ? 'Demande hors-équipe validée' : 'Demande hors-équipe refusée',
    message: statut === 'validee'
      ? `Votre activité "${detail.description}" a été validée`
      : `Votre activité "${detail.description}" a été refusée`,
    lien_page: 'horsequipe',
  }).catch((err) => console.error('Erreur notification (demande):', err))
}

// "Mes demandes" — le collaborateur connecté consulte ses propres demandes hors-équipe.
export async function listMesDemandes(req, res) {
  try {
    const demandes = await getDemandesByCollaborateur(req.user.id)
    res.json(demandes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function addDemande(req, res) {
  try {
    // Un collaborateur ne peut soumettre une demande que pour lui-même : l'id vient
    // toujours du token, jamais du corps de la requête, même si le champ est présent.
    const id_collaborateur = req.user.role === 'collaborateur' ? req.user.id : req.body.id_collaborateur
    const { description, contact_responsable } = req.body
    if (!id_collaborateur || !description) {
      return res.status(400).json({ message: 'id_collaborateur et description requis.' })
    }
    let created = await createDemande({ ...req.body, id_collaborateur })

    // Si l'automatisation est activée dans Paramètres ET que le collaborateur a
    // fourni un contact, on saute l'étape manuelle : la vérification part
    // immédiatement vers ce contact au lieu d'attendre que le Super Admin
    // complète un destinataire.
    const parametres = await getParametres()
    if (parametres.mail_verification_auto && contact_responsable) {
      created = await setDestinataireEtEnvoyer(created.id_demande, contact_responsable)
      await envoyerMailPourDemande(created.id_demande, contact_responsable)
    }

    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Étape 3 du workflow : le Super Admin renseigne le destinataire de vérification.
// Le système génère alors automatiquement le mail préformaté (avec lien de
// confirmation en un clic) et l'envoie au destinataire.
export async function envoyerVerification(req, res) {
  try {
    const { destinataire_verification } = req.body
    if (!destinataire_verification) {
      return res.status(400).json({ message: 'Le destinataire de vérification est requis.' })
    }

    const updated = await setDestinataireEtEnvoyer(req.params.id, destinataire_verification)
    await envoyerMailPourDemande(req.params.id, destinataire_verification)

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Étape 4-5 (fallback manuel) : le Super Admin valide/refuse lui-même, par exemple
// si la confirmation externe lui est parvenue autrement que par le lien de l'email,
// ou si "Validation automatique" est désactivé dans Paramètres.
export async function valider(req, res) {
  try {
    const updated = await validerDemande(req.params.id)
    notifierCollaborateurStatut(req.params.id, 'validee')
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function refuser(req, res) {
  try {
    const updated = await refuserDemande(req.params.id)
    notifierCollaborateurStatut(req.params.id, 'refusee')
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeDemande(req, res) {
  try {
    await deleteDemande(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- Confirmation externe (lien cliqué depuis l'email, sans authentification) ----------

function confirmationPage({ title, message, tone = 'success' }) {
  const color = tone === 'error' ? '#B30224' : '#1FAE63'
  const bg = tone === 'error' ? '#FCE1E5' : '#E7F8EF'
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0; padding:40px 16px; background:#F6F7FA; font-family:Arial, Helvetica, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh;">
  <div style="max-width:420px; width:100%; background:#FFFFFF; border-radius:16px; box-shadow:0 8px 30px rgba(20,20,40,0.08); padding:36px 32px; text-align:center;">
    <div style="width:52px; height:52px; border-radius:50%; background:${bg}; color:${color}; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; font-size:26px; font-weight:800;">
      ${tone === 'error' ? '!' : '✓'}
    </div>
    <h1 style="margin:0 0 10px; font-size:18px; color:#1D1D2B;">${title}</h1>
    <p style="margin:0; font-size:13.5px; color:#767A8A; line-height:1.6;">${message}</p>
  </div>
</body>
</html>`
}

// Lien public cliqué par le contact externe pour confirmer l'activité.
// Si "Validation automatique" est activé dans Paramètres (comportement par
// défaut), la demande est validée immédiatement et intégrée au dossier du
// collaborateur. Si désactivé, la confirmation est simplement notée dans le
// message affiché — la demande reste "envoyée" et attend une validation
// manuelle du Super Admin (bouton "Valider directement").
export async function confirmerDemande(req, res) {
  try {
    const { token } = req.query
    if (!token) {
      return res.status(400).send(confirmationPage({
        title: 'Lien invalide',
        message: "Ce lien de confirmation est incomplet. Merci de recontacter l'équipe ESPRIT.",
        tone: 'error',
      }))
    }

    let payload
    try {
      payload = verifyToken(token)
    } catch {
      return res.status(400).send(confirmationPage({
        title: 'Lien expiré',
        message: "Ce lien de confirmation a expiré ou n'est plus valide. Merci de recontacter l'équipe ESPRIT pour en obtenir un nouveau.",
        tone: 'error',
      }))
    }
    if (payload.purpose !== 'demande-confirmation') {
      return res.status(400).send(confirmationPage({
        title: 'Lien invalide',
        message: "Ce lien de confirmation n'est pas valide.",
        tone: 'error',
      }))
    }

    const demande = await getDemandeById(payload.demandeId)
    if (!demande) {
      return res.status(404).send(confirmationPage({
        title: 'Demande introuvable',
        message: "Cette demande n'existe plus.",
        tone: 'error',
      }))
    }

    if (demande.statut === 'refusee') {
      return res.status(409).send(confirmationPage({
        title: 'Demande déjà refusée',
        message: 'Cette demande a déjà été traitée et refusée. Merci de contacter directement le Super Admin si besoin.',
        tone: 'error',
      }))
    }

    if (demande.statut === 'validee') {
      return res.send(confirmationPage({
        title: 'Déjà confirmée',
        message: "Cette activité a déjà été validée précédemment. Aucune action supplémentaire n'est nécessaire.",
        tone: 'success',
      }))
    }

    const parametres = await getParametres()
    if (parametres.validation_auto) {
      await validerDemande(payload.demandeId)
      notifierCollaborateurStatut(payload.demandeId, 'validee')
      return res.send(confirmationPage({
        title: 'Activité confirmée',
        message: "Merci ! Votre confirmation a bien été enregistrée. L'activité est désormais validée et intégrée au dossier du collaborateur.",
        tone: 'success',
      }))
    }

    res.send(confirmationPage({
      title: 'Confirmation bien reçue',
      message: "Merci ! Votre confirmation a été transmise au Super Admin, qui finalisera la validation de cette activité de son côté.",
      tone: 'success',
    }))
  } catch (err) {
    console.error(err)
    res.status(500).send(confirmationPage({
      title: 'Erreur',
      message: "Une erreur est survenue. Merci de réessayer plus tard.",
      tone: 'error',
    }))
  }
}