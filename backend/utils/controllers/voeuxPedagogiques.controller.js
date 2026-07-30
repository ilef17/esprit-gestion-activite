import {
  listCampagnes,
  getCampagne,
  getCampagnePubliee,
  createCampagne,
  updateCampagneTitre,
  publierCampagne,
  cloturerCampagne,
  deleteCampagneBrouillon,
  ajouterQuestion,
  modifierQuestion,
  supprimerQuestion,
  reordonnerQuestions,
  ajouterModule,
  modifierModule,
  supprimerModule,
  getReponsesCampagne,
  getMaReponse,
  upsertMaReponse,
  getPoolAffectation,
  affecterClasse,
  retirerAffectation,
  getClassesAffecteesCollaborateur,
  getInfosReponse,
} from '../models/voeuPedagogique.model.js'
import { creerNotification, creerNotificationsEnMasse } from '../models/notification.model.js'
import { getAllCollaborateurs } from '../models/collaborateur.model.js'

const TYPES_QUESTION = new Set(['texte', 'choix_unique', 'choix_multiple', 'modules'])

function toStringArray(value) {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v).trim()).filter(Boolean)
}

async function assertBrouillon(idCampagne) {
  const campagne = await getCampagne(idCampagne)
  if (!campagne) return { error: 404, message: 'Campagne introuvable' }
  if (campagne.statut !== 'brouillon') {
    return { error: 400, message: 'Le formulaire ne peut être modifié que tant que la campagne est en brouillon' }
  }
  return { campagne }
}

/* ---------- Admin : campagnes ---------- */

export async function adminListCampagnes(req, res) {
  try {
    res.json(await listCampagnes())
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
    const campagne = await createCampagne({ titre: req.body.titre })
    res.status(201).json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminUpdateCampagne(req, res) {
  try {
    const check = await assertBrouillon(req.params.id)
    if (check.error) return res.status(check.error).json({ message: check.message })
    res.json(await updateCampagneTitre(req.params.id, { titre: req.body.titre }))
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
    if (campagne.questions.length === 0) {
      return res.status(400).json({ message: 'Ajoutez au moins une question avant d\'envoyer le formulaire' })
    }
    const aQuestionModules = campagne.questions.some((q) => q.type === 'modules')
    if (aQuestionModules && campagne.modules.length === 0) {
      return res.status(400).json({ message: 'Ajoutez au moins un module (avec ses classes) avant d\'envoyer le formulaire' })
    }
    const updated = await publierCampagne(req.params.id)

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
    res.json(await cloturerCampagne(req.params.id))
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

/* ---------- Admin : form builder — questions ---------- */

export async function adminAjouterQuestion(req, res) {
  try {
    const check = await assertBrouillon(req.params.id)
    if (check.error) return res.status(check.error).json({ message: check.message })
    const { type, intitule, obligatoire, options } = req.body
    if (!TYPES_QUESTION.has(type)) return res.status(400).json({ message: 'Type de question invalide' })
    if (!intitule || !String(intitule).trim()) return res.status(400).json({ message: 'L\'intitulé est requis' })
    if (['choix_unique', 'choix_multiple'].includes(type) && toStringArray(options).length === 0) {
      return res.status(400).json({ message: 'Ajoutez au moins une réponse possible pour ce type de question' })
    }
    const campagne = await ajouterQuestion(req.params.id, {
      type,
      intitule: String(intitule).trim(),
      obligatoire: obligatoire !== false,
      options: toStringArray(options),
    })
    res.status(201).json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminModifierQuestion(req, res) {
  try {
    const { type, intitule, obligatoire, options } = req.body
    if (!TYPES_QUESTION.has(type)) return res.status(400).json({ message: 'Type de question invalide' })
    if (!intitule || !String(intitule).trim()) return res.status(400).json({ message: 'L\'intitulé est requis' })
    const campagne = await modifierQuestion(req.params.id, {
      type,
      intitule: String(intitule).trim(),
      obligatoire: obligatoire !== false,
      options: toStringArray(options),
    })
    if (!campagne) return res.status(404).json({ message: 'Question introuvable' })
    res.json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminSupprimerQuestion(req, res) {
  try {
    const campagne = await supprimerQuestion(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Question introuvable' })
    res.json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminReordonnerQuestions(req, res) {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Liste d\'ids requise' })
    res.json(await reordonnerQuestions(req.params.id, ids))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Admin : form builder — modules ---------- */

export async function adminAjouterModule(req, res) {
  try {
    const check = await assertBrouillon(req.params.id)
    if (check.error) return res.status(check.error).json({ message: check.message })
    const { id_question, nom, niveau, classes } = req.body
    if (!nom || !String(nom).trim()) return res.status(400).json({ message: 'Le nom du module est requis' })
    if (!niveau || !String(niveau).trim()) return res.status(400).json({ message: 'Le niveau du module est requis' })
    const question = (check.campagne.questions || []).find((q) => q.id_question === Number(id_question))
    if (!question || question.type !== 'modules') {
      return res.status(400).json({ message: 'Question de type "Modules" introuvable pour cette campagne' })
    }
    const campagne = await ajouterModule(req.params.id, {
      id_question: question.id_question,
      nom: String(nom).trim(),
      niveau: String(niveau).trim(),
      classes: toStringArray(classes),
    })
    res.status(201).json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminModifierModule(req, res) {
  try {
    const { nom, niveau, classes } = req.body
    if (!nom || !String(nom).trim()) return res.status(400).json({ message: 'Le nom du module est requis' })
    if (!niveau || !String(niveau).trim()) return res.status(400).json({ message: 'Le niveau du module est requis' })
    const campagne = await modifierModule(req.params.id, {
      nom: String(nom).trim(),
      niveau: String(niveau).trim(),
      classes: toStringArray(classes),
    })
    if (!campagne) return res.status(404).json({ message: 'Module introuvable' })
    res.json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminSupprimerModule(req, res) {
  try {
    const campagne = await supprimerModule(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Module introuvable' })
    res.json(campagne)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Admin : réponses ---------- */

export async function adminGetReponses(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    const reponses = await getReponsesCampagne(req.params.id)
    res.json({ campagne, reponses })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Admin : affectation des classes ---------- */

export async function adminGetPoolAffectation(req, res) {
  try {
    const campagne = await getCampagne(req.params.id)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    const pool = await getPoolAffectation(req.params.id)
    res.json({ campagne, pool })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminAffecterClasse(req, res) {
  try {
    const { id_reponse, id_module, classe } = req.body
    if (!id_reponse || !id_module || !classe || !String(classe).trim()) {
      return res.status(400).json({ message: 'id_reponse, id_module et classe sont requis' })
    }
    await affecterClasse({ id_reponse, id_module, classe: String(classe).trim() })

    const infos = await getInfosReponse(id_reponse)
    if (infos) {
      creerNotification({
        id_utilisateur: infos.id_collaborateur,
        type_utilisateur: 'collaborateur',
        type: 'affectation_pedagogique',
        titre: 'Nouvelle classe affectée',
        message: `Vous avez été affecté(e) à la classe "${classe}"`,
        lien_page: 'voeux-pedagogiques',
      }).catch((err) => console.error('Erreur notification affectation:', err))
    }

    res.status(201).json({ message: 'Classe affectée' })
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Cette classe a déjà été affectée à quelqu\'un d\'autre' })
    }
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function adminRetirerAffectation(req, res) {
  try {
    const affectation = await retirerAffectation(req.params.id)
    if (!affectation) return res.status(404).json({ message: 'Affectation introuvable' })
    res.json({ message: 'Affectation retirée' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Collaborateur ---------- */

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
    const { id_campagne, reponses } = req.body
    if (!id_campagne) return res.status(400).json({ message: 'id_campagne requis' })
    if (!reponses || typeof reponses !== 'object') return res.status(400).json({ message: 'reponses requis' })

    const campagne = await getCampagne(id_campagne)
    if (!campagne) return res.status(404).json({ message: 'Campagne introuvable' })
    if (campagne.statut !== 'publiee') {
      return res.status(400).json({ message: 'Ce questionnaire n\'est plus ouvert aux réponses' })
    }

    // Verrouillage 24h après le premier envoi.
    const existante = await getMaReponse(id_campagne, req.user.id)
    if (existante && existante.date_soumission) {
      const heuresEcoulees = (Date.now() - new Date(existante.date_soumission).getTime()) / 36e5
      if (heuresEcoulees >= 24) {
        return res.status(400).json({ message: 'Vos réponses sont verrouillées 24h après leur envoi et ne sont plus modifiables' })
      }
    }

    const questionsParId = Object.fromEntries(campagne.questions.map((q) => [String(q.id_question), q]))
    const modulesValides = new Set(campagne.modules.map((m) => m.nom))
    const valeursValidees = {}

    for (const question of campagne.questions) {
      const brute = reponses[String(question.id_question)]
      if (question.obligatoire && (brute === undefined || brute === null || brute === '' || (Array.isArray(brute) && brute.length === 0))) {
        return res.status(400).json({ message: `Merci de répondre à : "${question.intitule}"` })
      }
      if (brute === undefined || brute === null) continue

      if (question.type === 'texte') {
        valeursValidees[question.id_question] = String(brute).slice(0, 1000)
      } else if (question.type === 'choix_unique') {
        const options = new Set(question.options)
        valeursValidees[question.id_question] = options.has(brute) ? brute : ''
      } else if (question.type === 'choix_multiple') {
        const options = new Set(question.options)
        valeursValidees[question.id_question] = toStringArray(brute).filter((v) => options.has(v))
      } else if (question.type === 'modules') {
        valeursValidees[question.id_question] = toStringArray(brute).filter((v) => modulesValides.has(v))
      }
    }

    const reponse = await upsertMaReponse(id_campagne, req.user.id, valeursValidees)
    res.json(reponse)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function collabGetClassesAffectees(req, res) {
  try {
    res.json(await getClassesAffecteesCollaborateur(req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}