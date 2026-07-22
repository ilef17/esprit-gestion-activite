import {
  listCampagnes,
  getCampagne,
  getCampagnePubliee,
  createCampagne,
  updateCampagneChoix,
  publierCampagne,
  cloturerCampagne,
  deleteCampagneBrouillon,
  getReponsesCampagne,
  getMaReponse,
  upsertMaReponse,
  ajouterAffectation,
  supprimerAffectation,
  getAffectationsCollaborateur,
} from '../models/voeuPedagogique.model.js'
import { sendAffectationEmail } from '../utils/Mailer.js'
import { creerNotification, creerNotificationsEnMasse } from '../models/notification.model.js'
import { getAllCollaborateurs } from '../models/collaborateur.model.js'

function toStringArray(value) {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v).trim()).filter(Boolean)
}

/* ---------- Admin ---------- */

export async function adminListCampagnes(req, res) {
  try {
    const campagnes = await listCampagnes()
    res.json(campagnes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminGetCampagne(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    res.json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminCreateCampagne(req, res) {
  try {
    const {
      titre, choix_modules, choix_modules_alternance, choix_modules_international,
      choix_niveau, choix_niveau_alternance, choix_niveau_international,
    } = req.body
    const campagne = await createCampagne({
      titre,
      choix_modules: toStringArray(choix_modules),
      choix_modules_alternance: toStringArray(choix_modules_alternance),
      choix_modules_international: toStringArray(choix_modules_international),
      choix_niveau: choix_niveau ? String(choix_niveau).trim() : null,
      choix_niveau_alternance: choix_niveau_alternance ? String(choix_niveau_alternance).trim() : null,
      choix_niveau_international: choix_niveau_international ? String(choix_niveau_international).trim() : null,
    })
    res.status(201).json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminUpdateCampagne(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    if (campagne.statut === 'cloturee') {
      return res.status(400).json({ message: 'Cette campagne est clôturée, ses choix ne sont plus modifiables' })
    }
    const {
      titre, choix_modules, choix_modules_alternance, choix_modules_international,
      choix_niveau, choix_niveau_alternance, choix_niveau_international,
    } = req.body
    const updated = await updateCampagneChoix(req.params.id, {
      titre,
      choix_modules: toStringArray(choix_modules),
      choix_modules_alternance: toStringArray(choix_modules_alternance),
      choix_modules_international: toStringArray(choix_modules_international),
      choix_niveau: choix_niveau ? String(choix_niveau).trim() : null,
      choix_niveau_alternance: choix_niveau_alternance ? String(choix_niveau_alternance).trim() : null,
      choix_niveau_international: choix_niveau_international ? String(choix_niveau_international).trim() : null,
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminPublierCampagne(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    if (campagne.statut !== 'brouillon') {
      return res.status(400).json({ message: 'Seule une campagne en brouillon peut être envoyée' })
    }
    if (campagne.choix_modules.length === 0) {
      return res.status(400).json({ message: 'Ajoutez au moins un module avant d\'envoyer le questionnaire' })
    }
    const updated = await publierCampagne(req.params.id)

    // Diffuse une notification à tous les collaborateurs actifs — le questionnaire
    // est ouvert à tout le monde, pas seulement à une sous-équipe donnée.
    getAllCollaborateurs()
      .then((collaborateurs) => {
        const idsActifs = collaborateurs.filter((c) => c.actif).map((c) => c.id_collaborateur)
        return creerNotificationsEnMasse(idsActifs, {
          type_utilisateur: 'collaborateur',
          type: 'campagne_voeux',
          titre: 'Vœux pédagogiques ouverts',
          message: `Le questionnaire "${updated.titre}" est disponible, vous pouvez y répondre dès maintenant`,
          lien_page: 'voeux-pedagogiques',
        })
      })
      .catch((err) => console.error('Erreur notification campagne de vœux:', err))

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminCloturerCampagne(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    if (campagne.statut !== 'publiee') {
      return res.status(400).json({ message: 'Seule une campagne envoyée peut être clôturée' })
    }
    const updated = await cloturerCampagne(req.params.id)
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminDeleteCampagne(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    if (campagne.statut !== 'brouillon') {
      return res.status(400).json({ message: 'Seul un brouillon peut être supprimé' })
    }
    await deleteCampagneBrouillon(req.params.id)
    res.json({ message: 'Brouillon supprimé' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Vue admin : toutes les réponses d'une campagne + statistiques agrégées simples
// (comptage par option), calculées ici pour rester en phase avec les libellés
// de choix propres à la campagne consultée.
export async function adminGetReponses(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    const reponses = await getReponsesCampagne(req.params.id)

    const compter = (getter) => {
      const counts = {}
      reponses.forEach((r) => {
        const values = getter(r)
        ;(Array.isArray(values) ? values : [values]).filter(Boolean).forEach((v) => {
          counts[v] = (counts[v] || 0) + 1
        })
      })
      return counts
    }

    const stats = {
      total_reponses: reponses.length,
      modules_souhaites: compter((r) => r.modules_souhaites),
      alternance: compter((r) => r.alternance),
      modules_alternance: compter((r) => r.modules_alternance),
      international: compter((r) => r.international),
      modules_international: compter((r) => r.modules_international),
      heures_sup: compter((r) => r.heures_sup),
      moyenne_heures_sup: (() => {
        const valeurs = reponses.filter((r) => r.heures_sup === 'oui' && r.nb_heures_sup != null).map((r) => r.nb_heures_sup)
        if (valeurs.length === 0) return null
        return Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 10) / 10
      })(),
    }

    res.json({ campagne, reponses, stats })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Affecte le collaborateur (auteur de la réponse) à un module supplémentaire,
// avec type/niveau/classes, puis le notifie par e-mail. Un collaborateur peut
// recevoir plusieurs affectations (plusieurs modules, plusieurs catégories).
export async function adminAjouterAffectation(req, res) {
  try {
    const { module, type, niveau, classes } = req.body
    if (!module || !String(module).trim()) {
      return res.status(400).json({ message: 'Le module est requis' })
    }
    const typesValides = new Set(['normal', 'alternance', 'international', 'autre'])
    const reponse = await ajouterAffectation(req.params.id, {
      module: String(module).trim(),
      type: typesValides.has(type) ? type : 'autre',
      niveau: niveau ? String(niveau).trim() : null,
      classes: toStringArray(classes),
    })
    if (!reponse) return res.status(404).json({ message: 'Réponse introuvable' })

    const nouvelleAffectation = reponse.affectations[reponse.affectations.length - 1]
    if (reponse.collaborateur_email && nouvelleAffectation) {
      sendAffectationEmail({
        to: reponse.collaborateur_email,
        collaborateurNom: reponse.collaborateur_nom,
        module: nouvelleAffectation.module,
        type: nouvelleAffectation.type,
        niveau: nouvelleAffectation.niveau,
        classes: nouvelleAffectation.classes,
      }).catch((err) => console.error('Erreur envoi email affectation:', err))
    }
    if (nouvelleAffectation) {
      creerNotification({
        id_utilisateur: reponse.id_collaborateur,
        type_utilisateur: 'collaborateur',
        type: 'affectation_pedagogique',
        titre: 'Nouvelle affectation pédagogique',
        message: `Vous avez été affecté(e) au module "${nouvelleAffectation.module}"`,
        lien_page: 'voeux-pedagogiques',
      }).catch((err) => console.error('Erreur notification affectation:', err))
    }

    res.json(reponse)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Retire une affectation (erreur de saisie, changement de plan…) sans notifier.
export async function adminSupprimerAffectation(req, res) {
  try {
    const reponse = await supprimerAffectation(req.params.id)
    if (!reponse) return res.status(404).json({ message: 'Affectation introuvable' })
    res.json(reponse)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Collaborateur ---------- */

// Renvoie la campagne actuellement publiée (le questionnaire à remplir) ainsi que
// la réponse déjà soumise par le collaborateur connecté, le cas échéant.
export async function collabGetQuestionnaire(req, res) {
  try {
    const campagne = await getCampagnePubliee()
    if (!campagne) return res.json({ campagne: null, reponse: null })
    const reponse = await getMaReponse(campagne.id_campagne, req.user.id)
    res.json({ campagne, reponse })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function collabSaveReponse(req, res) {
  try {
    const { id_campagne } = req.body
    if (!id_campagne) return res.status(400).json({ message: 'id_campagne requis' })

    const campagne = await getCampagne(id_campagne)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    if (campagne.statut !== 'publiee') {
      return res.status(400).json({ message: 'Ce questionnaire n\'est plus ouvert aux réponses' })
    }

    // Verrouillage 24h après le premier envoi : une fois ce délai passé, le collaborateur
    // ne peut plus modifier ses réponses (l'admin doit pouvoir affecter sans que les
    // réponses ne bougent encore sous ses pieds). date_soumission ne change qu'à la
    // création de la réponse, jamais lors d'une mise à jour, donc ce délai est fixe.
    const existante = await getMaReponse(id_campagne, req.user.id)
    if (existante && existante.date_soumission) {
      const heuresEcoulees = (Date.now() - new Date(existante.date_soumission).getTime()) / 36e5
      if (heuresEcoulees >= 24) {
        return res.status(400).json({ message: 'Vos réponses sont verrouillées 24h après leur envoi et ne sont plus modifiables' })
      }
    }

    const {
      modules_souhaites, alternance, modules_alternance,
      international, modules_international,
      heures_sup, nb_heures_sup, commentaire,
    } = req.body

    if (!['oui', 'non'].includes(alternance)) {
      return res.status(400).json({ message: 'Merci de répondre à la question sur l\'alternance (oui/non)' })
    }
    if (!['oui', 'non'].includes(international)) {
      return res.status(400).json({ message: 'Merci de répondre à la question sur la classe internationale (oui/non)' })
    }
    if (!['oui', 'non'].includes(heures_sup)) {
      return res.status(400).json({ message: 'Merci de répondre à la question sur les heures supplémentaires (oui/non)' })
    }
    if (heures_sup === 'oui' && (!Number.isFinite(Number(nb_heures_sup)) || Number(nb_heures_sup) <= 0)) {
      return res.status(400).json({ message: 'Merci de préciser un nombre d\'heures supplémentaires valide' })
    }

    const modulesValides = new Set(campagne.choix_modules)
    const modulesAlternanceValides = new Set(campagne.choix_modules_alternance)
    const modulesInternationalValides = new Set(campagne.choix_modules_international)

    const souhaites = toStringArray(modules_souhaites).filter((m) => modulesValides.has(m))
    const alternanceChoisis = alternance === 'oui' ? toStringArray(modules_alternance).filter((m) => modulesAlternanceValides.has(m)) : []
    const internationalChoisis = international === 'oui' ? toStringArray(modules_international).filter((m) => modulesInternationalValides.has(m)) : []

    const reponse = await upsertMaReponse(id_campagne, req.user.id, {
      modules_souhaites: souhaites,
      alternance,
      modules_alternance: alternanceChoisis,
      international,
      modules_international: internationalChoisis,
      heures_sup,
      nb_heures_sup: heures_sup === 'oui' ? Number(nb_heures_sup) : null,
      commentaire: commentaire ? String(commentaire).slice(0, 1000) : null,
    })
    res.json(reponse)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Liste des affectations du collaborateur connecté, toutes campagnes confondues,
// affichée dans son dashboard (module, niveau, classes).
export async function collabGetAffectations(req, res) {
  try {
    const affectations = await getAffectationsCollaborateur(req.user.id)
    res.json(affectations)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}