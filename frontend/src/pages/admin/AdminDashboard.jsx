import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import EspritLogo from '../../components/EspritLogo.jsx'
import StatsDashboard from '../../components/dashboard/StatsDashboard.jsx'
import { warningDateSeule } from '../../utils/dateValidation.js'
import {
  getSousEquipesDetaillees,
  getSousEquipe,
  createSousEquipe,
  updateSousEquipe,
  deleteSousEquipe,
  addMembreSousEquipe,
  removeMembreSousEquipe,
  getEquipesHorsUpDetaillees,
  getEquipeHorsUp,
  createEquipeHorsUp,
  updateEquipeHorsUp,
  deleteEquipeHorsUp,
  addMembreEquipeHorsUp,
  removeMembreEquipeHorsUp,
  getUsers,
  updateUser,
  deleteUser,
  promoteToResponsable,
  ensureCollaborateurAccount,
  getDemandes,
  getCriteres,
  createCritere,
  updateCritere,
  deleteCritere,
  getScores,
  getGrilleNotes,
  calculerScores,
  calculerScoresPourTous,
  getRapports,
  createRapport,
  telechargerRapportFichier,
  getStatsImplication,
  getParametres,
  updateParametres,
  ajouterAnneeSysteme,
  getSauvegardes,
  creerSauvegarde,
  verifierSauvegarde,
  telechargerSauvegardeFichier,
  deleteSauvegarde,
  createTache,
  getMembresSousEquipe,
  getTaches,
  getProfesseurs,
  getProfesseurDetail,
  addExpertiseAdmin,
  deleteExpertise,
  getCampagnesVoeuxPedagogiques,
  getCampagneVoeuxPedagogiques,
  createCampagneVoeuxPedagogiques,
  updateCampagneVoeuxPedagogiques,
  publierCampagneVoeuxPedagogiques,
  cloturerCampagneVoeuxPedagogiques,
  deleteCampagneVoeuxPedagogiques,
  ajouterQuestionVoeuxPedagogiques,
  modifierQuestionVoeuxPedagogiques,
  supprimerQuestionVoeuxPedagogiques,
 ajouterModuleVoeuxPedagogiques,
  modifierModuleVoeuxPedagogiques,
  supprimerModuleVoeuxPedagogiques,
  getReponsesCampagneVoeuxPedagogiques,
  getVueAffectationVoeuxPedagogiques,
  affecterClasseVoeuxPedagogiques,
  supprimerAffectationVoeuxPedagogiques,
  getMonProfil,
  updateMesPreferences,
  updateMonProfilIdentite,
  changerMonMotDePasse,
} from '../../services/api.js'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
import { useConfirm } from '../../hooks/useConfirm.jsx'
import './admin.css'

/* ---------- small inline icon set (copied from the design template) ---------- */
const Icon = {
  dashboard: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>),
  users: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.3"/></svg>),
  teams: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4" width="18" height="4" rx="1.2"/><rect x="3" y="10" width="18" height="4" rx="1.2"/><rect x="3" y="16" width="18" height="4" rx="1.2"/></svg>),
  requests: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 4h16v16H4z"/><path d="M4 9h16"/><path d="M9 4v16"/></svg>),
  eval: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 2l2.4 6.9L22 9l-5.6 4.9L18 22l-6-3.7L6 22l1.6-8.1L2 9l7.6-.1z"/></svg>),
  reports: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M14 4v6h6"/></svg>),
  settings: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>),
  bell: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>),
check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M20 6 9 17l-5-5"/></svg>),
  edit: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>),
  trash: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>),
  power: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/></svg>),
  promote: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 19V6"/><path d="M6 12l6-6 6 6"/></svg>),
  task: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>),
  academic: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/></svg>),
  eye: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 5v14"/><path d="M5 12h14"/></svg>),
  poll: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 17V9"/><path d="M15 17V5"/><path d="M4 17v-4"/><path d="M4 21h16"/></svg>),
  history: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 12a9 9 0 1 0 2.6-6.3"/><path d="M3 4v5h5"/><path d="M12 7v5l3.5 2"/></svg>),
  layers: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/></svg>),
  profile: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>),
  award: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="6"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/></svg>),
  gavel: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="m14.5 4.5 5 5"/><path d="m10.5 8.5-7 7 3 3 7-7"/><path d="m13 6 5 5"/><path d="M16 12l5 5"/><path d="M3 21h9"/></svg>),
  book: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>),
  calendar: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18"/><path d="M8 2.5v4"/><path d="M16 2.5v4"/></svg>),
  building: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="4" y="3" width="16" height="18" rx="1.2"/><path d="M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01"/></svg>),
}

const PRIORITE_OPTIONS = [
  { value: 'haute', label: 'Haute' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'basse', label: 'Basse' },
]

const NAV_SECTIONS = [
  { label: 'Pilotage', items: [
    { page: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { page: 'utilisateurs', label: 'Collaborateurs', icon: 'users' },
    { page: 'sous-equipes', label: 'Sous-équipes', icon: 'teams' },
  ]},
  { label: 'Activités', items: [
    { page: 'demandes', label: 'Activité hors-équipe', icon: 'requests', badgeKey: 'demandes' },
    { page: 'evaluation', label: 'Évaluation', icon: 'eval' },
    { page: 'rapports', label: 'Rapports', icon: 'reports' },
    { page: 'activite-ecole', label: 'Activité école', icon: 'academic' },
    { page: 'voeux-pedagogiques', label: 'Vœux pédagogiques', icon: 'poll' },
  ]},
  { label: 'Système', items: [
    { page: 'parametres', label: 'Paramètres', icon: 'settings' },
  ]},
]

const PAGE_TITLES = {
  dashboard:    { crumb: 'Intranet · Pilotage', title: 'Tableau de bord global' },
  utilisateurs: { crumb: 'Intranet · Pilotage', title: 'Collaborateurs' },
  'sous-equipes': { crumb: 'Intranet · Pilotage', title: 'Sous-équipes' },
  demandes:     { crumb: 'Intranet · Activités', title: 'Activité hors-équipe' },
  evaluation:   { crumb: 'Intranet · Activités', title: 'Évaluation' },
  rapports:     { crumb: 'Intranet · Activités', title: 'Rapports' },
  'activite-ecole': { crumb: 'Intranet · Activités', title: 'Activité école' },
  'voeux-pedagogiques': { crumb: 'Intranet · Activités', title: 'Vœux pédagogiques' },
  sauvegardes:  { crumb: 'Intranet · Système', title: 'Sauvegardes' },
  parametres:   { crumb: 'Intranet · Système', title: 'Paramètres' },
}

function initials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function statutBadge(statut) {
  const map = {
    a_faire: { label: 'À faire', cls: 'gray' },
    en_cours: { label: 'En cours', cls: 'blue' },
    faite: { label: 'Faite', cls: 'green' },
  }
  return map[statut] || { label: statut, cls: 'gray' }
}

const TACHE_STATUT_LABELS = {
  a_faire: 'Non réalisée',
  en_cours: 'En cours',
  validee: 'Validée',
  probleme_coordination: 'Problème de coordination',
  a_refaire: 'À refaire',
}
function tacheStatutBadge(statut) {
  const map = {
    a_faire: { label: 'Non réalisée', cls: 'nonrealisee' },
    en_cours: { label: 'En cours', cls: 'encours' },
    validee: { label: 'Validée', cls: 'validee' },
    probleme_coordination: { label: 'Problème de coordination', cls: 'refaire' },
    a_refaire: { label: 'À refaire', cls: 'refaire' },
  }
  return map[statut] || { label: TACHE_STATUT_LABELS[statut] || statut, cls: 'attente' }
}

function relativeDays(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return "Reçue aujourd'hui"
  if (days === 1) return 'Reçue hier'
  return `Reçue il y a ${days}j`
}

function formatDateShortFr(dateStr) {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('fr-FR', { month: 'long' })
  return `${d.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}`
}

const PROCESS_STEPS = [
  { label: 'Demande reçue' },
  { label: 'Mail préformaté généré' },
  { label: "Décision de l'admin" },
  { label: 'Email envoyé au collaborateur' },
  { label: 'Dossier mis à jour' },
]

// Période "actuelle" par défaut pour les filtres — même règle que côté serveur
// (septembre→janvier = S1, février→août = S2), affichée au chargement de la page.
function periodeParDefaut() {
  const now = new Date()
  const mois = now.getMonth() + 1
  const anneeDebut = mois >= 9 ? now.getFullYear() : now.getFullYear() - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}

// Même règle de découpage que le backend (utils/periode.js) et que le tableau de
// bord collaborateur, appliquée côté client pour filtrer les campagnes de vœux
// pédagogiques (date_creation) et les activités école (date_activite), qui n'ont
// pas de colonnes annee_universitaire/semestre dédiées comme les tâches.
function periodeDeDate(dateStr) {
  // Lit directement les composants année/mois de la chaîne ISO (YYYY-MM-DD…) plutôt
  // que de passer par un objet Date, pour éviter un décalage de jour/mois dû à la
  // conversion de fuseau horaire (ex. une date stockée à minuit UTC qui basculerait
  // sur le jour précédent une fois interprétée dans le fuseau du navigateur).
  const m = typeof dateStr === 'string' && dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  let annee, mois
  if (m) {
    annee = Number(m[1])
    mois = Number(m[2])
  } else {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return null
    annee = d.getFullYear()
    mois = d.getMonth() + 1
  }
  const anneeDebut = mois >= 9 ? annee : annee - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}
// Une entrée sans date reste toujours visible, quel que soit le filtre.
function estDansPeriode(dateStr, filtreAnnee, filtreSemestre) {
  if (!dateStr) return true
  const p = periodeDeDate(dateStr)
  if (!p) return true
  return p.annee === filtreAnnee && p.semestre === filtreSemestre
}

// Les encadrements n'ont qu'une année universitaire libre (pas de semestre) : ils
// restent visibles sur les deux semestres de leur année. Sans année renseignée,
// toujours visible (même logique que les entrées sans date).
function estDansAnnee(anneeUniversitaire, filtreAnnee) {
  if (!anneeUniversitaire) return true
  return anneeUniversitaire === filtreAnnee
}

export default function AdminDashboard() {
  const { user, logout, updateUser: updateAuthUser } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [toastMsg, setToastMsg] = useState(null)
  const [params, setParams] = useState(null)
  // Une seule instance de la modale de confirmation pour tout le tableau de bord :
  // partagée (via prop `confirm`) par toutes les pages qui remplaçaient auparavant
  // window.confirm(), pour ne monter qu'un seul overlay à la fois.
  const { confirm, ConfirmDialog } = useConfirm()

  // Filtres Année / Semestre du tableau de bord — changent uniquement la période
  // *consultée* (StatsDashboard, tâches, vœux, évaluations...). La période *active*
  // du système (celle par défaut pour les collaborateurs/responsables et les nouvelles
  // tâches sans période explicite) reste `params.annee_universitaire`/`semestre_actif`
  // jusqu'à ce que l'admin clique explicitement sur "Définir comme période active".
  const defautPeriode = useMemo(periodeParDefaut, [])
  const [filtreAnnee, setFiltreAnnee] = useState(defautPeriode.annee)
  const [filtreSemestre, setFiltreSemestre] = useState(defautPeriode.semestre)

  // Liste des années universitaires proposées dans le sélecteur : quelques années
  // autour de l'année courante, plus l'année active du système si elle est en dehors
  // de cette fenêtre (pour ne jamais la faire disparaître du menu).
  const anneesOptions = useMemo(() => {
    const debut = Number(defautPeriode.annee.split('/')[0])
    const annees = new Set()
    for (let i = 2; i >= -2; i--) annees.add(`${debut + i}/${debut + i + 1}`)
    ;(params?.annees_supplementaires || []).forEach((a) => annees.add(a))
    return Array.from(annees).sort().reverse()
  }, [defautPeriode.annee, params])

  // La période *active* du système est celle définie via "Définir comme période
  // active" (params.annee_universitaire / semestre_actif). Tant que la période
  // *consultée* (filtreAnnee/filtreSemestre) ne correspond pas à la période
  // active, le tableau de bord passe en lecture seule (aucune création/édition
  // possible) — pour ne jamais modifier des données d'une période archivée.
  const periodeEstActive = !params || (filtreAnnee === params.annee_universitaire && filtreSemestre === params.semestre_actif)

  // Petite confirmation visuelle ("✓ ... affiché") après un changement de sélection,
  // pour rendre le changement perceptible — s'efface après quelques secondes.
  const [periodeAppliedMsg, setPeriodeAppliedMsg] = useState(null)
  const periodeFirstRender = useRef(true)
  useEffect(() => {
    if (periodeFirstRender.current) { periodeFirstRender.current = false; return }
    const label = filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'
    setPeriodeAppliedMsg(`${filtreAnnee} · ${label} affiché`)
    const t = setTimeout(() => setPeriodeAppliedMsg(null), 2500)
    return () => clearTimeout(t)
  }, [filtreAnnee, filtreSemestre])

  // Notifications (cloche) : demandes hors-équipe en attente de vérification.
  const [notifOpen, setNotifOpen] = useState(false)

  // Mode sombre — appliqué à toute l'app admin via une classe sur .admin-root, persisté.
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('arp_dark_mode') === '1' } catch { return false }
  })
  const toggleDarkMode = () => {
    setDarkMode((d) => {
      const next = !d
      try { localStorage.setItem('arp_dark_mode', next ? '1' : '0') } catch {}
      return next
    })
  }

  // état partagé, chargé une fois et rafraîchi par les sous-pages après une action
  const [sousEquipes, setSousEquipes] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [equipesHorsUp, setEquipesHorsUp] = useState([])
  const [loadingHorsUp, setLoadingHorsUp] = useState(true)
  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [demandes, setDemandes] = useState([])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const refreshSousEquipes = useCallback(() => {
    setLoadingTeams(true)
    return getSousEquipesDetaillees(filtreAnnee, filtreSemestre)
      .then((data) => setSousEquipes(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement sous-équipes:', err))
      .finally(() => setLoadingTeams(false))
  }, [filtreAnnee, filtreSemestre])

  const refreshEquipesHorsUp = useCallback(() => {
    setLoadingHorsUp(true)
    return getEquipesHorsUpDetaillees(filtreAnnee, filtreSemestre)
      .then((data) => setEquipesHorsUp(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement équipes hors UP:', err))
      .finally(() => setLoadingHorsUp(false))
  }, [filtreAnnee, filtreSemestre])

  const refreshUsers = useCallback(() => (
    getUsers(filtreAnnee, filtreSemestre).then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement utilisateurs:', err))
  ), [filtreAnnee, filtreSemestre])

  // Liste complète, non filtrée par période : un compte responsable/collaborateur
  // reste valide d'un semestre à l'autre, donc la page "Utilisateurs" et les menus
  // déroulants (responsable/membres) ne doivent jamais être vidés par le filtre période.
  const refreshAllUsers = useCallback(() => (
    getUsers().then((data) => setAllUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement utilisateurs (complet):', err))
  ), [])

  const refreshDemandes = useCallback(() => (
    getDemandes(filtreAnnee, filtreSemestre).then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement demandes:', err))
  ), [filtreAnnee, filtreSemestre])

  // Au tout premier chargement (connexion / rechargement de page), on cale le
  // filtre *consulté* sur la période *active* persistée en base plutôt que sur la
  // date du jour — pour que la période choisie via "Définir comme période active"
  // reste affichée par défaut après une déconnexion/reconnexion.
  const periodeSyncedRef = useRef(false)
  const refreshParams = useCallback(() => (
    getParametres()
      .then((data) => {
        setParams(data)
        if (!periodeSyncedRef.current && data?.annee_universitaire && data?.semestre_actif) {
          periodeSyncedRef.current = true
          setFiltreAnnee(data.annee_universitaire)
          setFiltreSemestre(data.semestre_actif)
        }
      })
      .catch((err) => console.error('Erreur chargement paramètres:', err))
  ), [])

  // Rend la période actuellement consultée (filtreAnnee/filtreSemestre) active pour
  // tout le système : c'est elle qui devient la période par défaut des collaborateurs/
  // responsables à leur prochaine connexion, et des nouvelles tâches créées sans
  // période explicite. Action explicite et confirmée vu sa portée globale.
  const definirPeriodeActive = useCallback(async () => {
    const label = filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'
    const ok = await confirm({
      title: 'Changer la période active du système ?',
      message: `Faire de ${filtreAnnee} · ${label} la période active du système ? Cela changera la période par défaut pour tous les collaborateurs et responsables, ainsi que pour les nouvelles tâches créées sans période explicite.`,
      confirmLabel: 'Définir comme active',
    })
    if (!ok) return
    updateParametres({ annee_universitaire: filtreAnnee, semestre_actif: filtreSemestre })
      .then((updated) => {
        setParams(updated)
        showToast(`${filtreAnnee} · ${label} est maintenant la période active du système.`)
      })
      .catch((err) => {
        console.error('Erreur définition période active:', err)
        showToast("Impossible d'enregistrer la période active")
      })
  }, [filtreAnnee, filtreSemestre, showToast, confirm])

  useEffect(() => {
    refreshSousEquipes()
    refreshEquipesHorsUp()
    refreshUsers()
    refreshAllUsers()
    refreshDemandes()
    refreshParams()
  }, [refreshSousEquipes, refreshEquipesHorsUp, refreshUsers, refreshAllUsers, refreshDemandes, refreshParams])

  // Rafraîchissement périodique — pour voir apparaître les changements faits par les
  // collaborateurs/responsables (nouvelle activité hors-équipe, tâche mise à jour,
  // membre ajouté/retiré d'une équipe…) sans avoir à recharger la page.
  useEffect(() => {
    const id = setInterval(() => {
      refreshSousEquipes()
      refreshEquipesHorsUp()
      refreshUsers()
      refreshDemandes()
    }, 25000)
    return () => clearInterval(id)
  }, [refreshSousEquipes, refreshEquipesHorsUp, refreshUsers, refreshDemandes])

  const nav = PAGE_TITLES[activePage]
  const adminName = user?.nom || 'Admin'
  const demandesEnAttente = demandes.filter((d) => d.statut !== 'faite')
  const goTo = (page) => setActivePage(page)

  return (
    <div className={`admin-root${darkMode ? ' dark' : ''}`}>
      <div className="app">
        <aside className="sidebar sidebar-dark">
          <EspritLogo full />
          <div className="role-chip">ESPACE ADMIN</div>

          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              <nav className="nav">
                {section.items.map((item) => {
                  const IconCmp = Icon[item.icon]
                  return (
                    <a
                      key={item.page}
                      href="#"
                      className={activePage === item.page ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); setActivePage(item.page) }}
                    >
                      <IconCmp />
                      {item.label}
                      {item.badgeKey === 'demandes' && demandesEnAttente.length > 0 && <span className="badge">{demandesEnAttente.length}</span>}
                    </a>
                  )
                })}
              </nav>
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="profile-row" onClick={() => { logout(); }} title="Se déconnecter">
              <div className="avatar">{initials(adminName)}</div>
              <div className="profile-meta"><div className="pname">{adminName}</div><div className="prole">Chef d'équipe</div></div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div><div className="crumb">{nav.crumb}</div><h1>{nav.title}</h1></div>
            <div className="top-controls">
              {periodeAppliedMsg && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>{periodeAppliedMsg}
                </div>
              )}
              {params && (filtreAnnee !== params.annee_universitaire || filtreSemestre !== params.semestre_actif) && (
                <button
                  type="button"
                  onClick={definirPeriodeActive}
                  title="Faire de la période affichée la période active du système"
                  style={{
                    border: '1px solid var(--border, #e2e2e2)', background: 'var(--surface, #fff)',
                    color: 'inherit', borderRadius: 8, padding: '7px 14px', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Définir comme période active
                </button>
              )}
              <select
                className="select-chip"
                value={filtreAnnee}
                onChange={(e) => setFiltreAnnee(e.target.value)}
                title="Filtrer le tableau de bord par année universitaire"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                {anneesOptions.map((a) => (
                  <option key={a} value={a}>{a.replace('/', ' / ')}</option>
                ))}
              </select>
              <select
                className="select-chip"
                value={filtreSemestre}
                onChange={(e) => setFiltreSemestre(e.target.value)}
                title="Filtrer le tableau de bord par semestre"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
              </select>
              <div className="notif-wrap" style={{ position: 'relative' }}>
                <div className="icon-btn" onClick={() => setNotifOpen((o) => !o)} style={{ cursor: 'pointer', position: 'relative' }}>
                  <Icon.bell />
                  {demandesEnAttente.length > 0 && <span className="notif-dot" />}
                </div>
                {notifOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotifOpen(false)} />
                    <div className="notif-dropdown" style={{ position: 'absolute', right: 0, top: '120%', width: 320, zIndex: 41 }}>
                      <div className="notif-head">Activités hors-équipe en cours</div>
                      {demandesEnAttente.length === 0 && <div className="notif-empty">Aucune notification</div>}
                      {demandesEnAttente.slice(0, 6).map((d) => (
                        <div
                          key={d.id_demande}
                          className="notif-item"
                          onClick={() => { setNotifOpen(false); goTo('demandes') }}
                        >
                          <div className="avatar sm">{initials(d.collaborateur_nom)}</div>
                          <div className="body">
                            <div className="title">{d.collaborateur_nom}</div>
                            <div className="desc">{d.titre}</div>
                          </div>
                        </div>
                      ))}
                      {demandesEnAttente.length > 0 && (
                        <div className="notif-footer" onClick={() => { setNotifOpen(false); goTo('demandes') }}>Voir toutes les activités</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="avatar sm">{initials(adminName)}</div>
            </div>
          </div>

          <div className="content">
           {!periodeEstActive && (
             <div style={{
               display: 'flex', alignItems: 'center', gap: 8, background: 'var(--amber-tint, #FEF3C7)',
               color: '#9A6600', border: '1px solid #F5D68A', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600,
             }}>
               🔒 Période archivée ({filtreAnnee} · {filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'}) — lecture seule, aucune création ni modification possible. La période active est {params?.annee_universitaire} · {params?.semestre_actif === 'S1' ? 'Semestre 1' : 'Semestre 2'}.
             </div>
           )}
           <fieldset disabled={!periodeEstActive} style={{ border: 0, margin: 0, padding: 0 }}>
           {activePage === 'dashboard' && (
              <>
                <DashboardHome
                  teams={sousEquipes}
                  horsUpTeams={equipesHorsUp}
                  loadingTeams={loadingTeams}
                  users={users}
                  demandes={demandes}
                  filtreAnnee={filtreAnnee}
                  filtreSemestre={filtreSemestre}
                  onAnneeChange={setFiltreAnnee}
                  onSemestreChange={setFiltreSemestre}
                  onNavigate={goTo}
                />
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="card-head"><div><h2>Statistiques (Power BI natif)</h2><div className="hint">Vue globale</div></div></div>
                  <div style={{ padding: '0 20px 20px' }}><StatsDashboard scope="global" annee={filtreAnnee} semestre={filtreSemestre} /></div>
                </div>
                <div className="card">
                  <div className="card-head"><div><h2>Par collaborateur</h2></div></div>
                  <div style={{ padding: '0 20px 20px' }}><StatsDashboard scope="collaborateur" annee={filtreAnnee} semestre={filtreSemestre} /></div>
                </div>
                <div className="card">
                  <div className="card-head"><div><h2>Par sous-équipe</h2></div></div>
                  <div style={{ padding: '0 20px 20px' }}><StatsDashboard scope="sous-equipe" annee={filtreAnnee} semestre={filtreSemestre} /></div>
                </div>
                <div className="card">
                  <div className="card-head"><div><h2>État d'avancement</h2></div></div>
                  <div style={{ padding: '0 20px 20px' }}><StatsDashboard scope="avancement" annee={filtreAnnee} semestre={filtreSemestre} /></div>
                </div>
              </>
            )}
            {activePage === 'utilisateurs' && (
              <Utilisateurs
                users={allUsers}
                teams={sousEquipes}
                horsUpTeams={equipesHorsUp}
                showToast={showToast}
                confirm={confirm}
                onChanged={() => { refreshUsers(); refreshAllUsers(); refreshSousEquipes(); refreshEquipesHorsUp() }}
              />
            )}
            {activePage === 'sous-equipes' && (
              <SousEquipesPage
                teams={sousEquipes}
                loadingTeams={loadingTeams}
                horsUpTeams={equipesHorsUp}
                loadingHorsUp={loadingHorsUp}
                users={allUsers}
                showToast={showToast}
                confirm={confirm}
                onChanged={refreshSousEquipes}
                onHorsUpChanged={refreshEquipesHorsUp}
                onUsersChanged={() => { refreshUsers(); refreshAllUsers() }}
              />
            )}
            {activePage === 'demandes' && (
              <Demandes demandes={demandes} teams={sousEquipes} horsUpTeams={equipesHorsUp} users={allUsers} />
            )}
            {activePage === 'evaluation' && (
              <Evaluation teams={sousEquipes} horsUpTeams={equipesHorsUp} showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
            )}
            {activePage === 'rapports' && (
              <Rapports teams={sousEquipes} users={users} showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
            )}
            {activePage === 'activite-ecole' && (
              <ActiviteEcole showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} confirm={confirm} />
            )}
            {activePage === 'voeux-pedagogiques' && (
              <VoeuxPedagogiques showToast={showToast} confirm={confirm} />
            )}
            </fieldset>
            {activePage === 'sauvegardes' && (
              <Sauvegardes showToast={showToast} confirm={confirm} />
            )}
            {activePage === 'parametres' && (
              <MonProfilAdmin
                user={user}
                updateUser={updateAuthUser}
                showToast={showToast}
                dark={darkMode}
                onToggleDark={toggleDarkMode}
                params={params}
                onChangedParams={refreshParams}
                onAnneeAjoutee={(annee) => setFiltreAnnee(annee)}
              />
            )}
          </div>
        </main>
      </div>

      {ConfirmDialog}

      <div className={`toast${toastMsg ? ' show' : ''}`}>
        <Icon.check />
        <span>{toastMsg}</span>
      </div>
    </div>
  )
}

/* ---------- petits graphiques SVG maison (sans dépendance) ---------- */
function BarChartTaux({ data }) {
  if (!data.length) return <div className="hint" style={{ padding: '20px 0' }}>Aucune donnée pour cette période</div>
  const w = 600, h = 220, padTop = 24, padBottom = 34, padSide = 16
  const plotH = h - padTop - padBottom
  const barGap = 10
  const barWidth = Math.max(14, Math.min(44, (w - padSide * 2) / data.length - barGap))
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 220, overflow: 'visible' }}>
      <line x1={padSide} y1={h - padBottom} x2={w - padSide} y2={h - padBottom} stroke="var(--border)" />
      {data.map((d, i) => {
        const barH = (Math.max(0, Math.min(100, d.taux_implication)) / 100) * plotH
        const x = padSide + i * (barWidth + barGap)
        const y = h - padBottom - barH
        return (
          <g key={d.id_collaborateur}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={4} fill="var(--red)" opacity={0.9} />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--text)">{d.taux_implication}%</text>
            <text x={x + barWidth / 2} y={h - padBottom + 14} textAnchor="middle" fontSize="8.5" fill="var(--text-faint)">
              {(d.nom || '').split(' ')[0]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function PieChartRepartition({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div className="hint" style={{ padding: '20px 0' }}>Aucune donnée pour cette période</div>
  let cumul = -90
  const cx = 90, cy = 90, r = 78
  const toXY = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)]
  const slices = data.filter((d) => d.value > 0).map((d) => {
    const angle = (d.value / total) * 360
    const start = cumul
    const end = cumul + angle
    cumul = end
    const large = angle > 180 ? 1 : 0
    const [x1, y1] = toXY(start)
    const [x2, y2] = toXY(end)
    return { ...d, path: total === d.value ? null : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z` }
  })
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 180 180" style={{ width: 160, height: 160, flexShrink: 0 }}>
        {slices.map((s, i) => s.path
          ? <path key={i} d={s.path} fill={s.color} />
          : <circle key={i} cx={cx} cy={cy} r={r} fill={s.color} />
        )}
      </svg>
      <div>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: 'inline-block', flexShrink: 0 }} />
            <span>{d.label} — <b>{d.value}%</b></span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================= DASHBOARD ================= */
function DashboardHome({ teams, horsUpTeams, loadingTeams, users, demandes, filtreAnnee, filtreSemestre, onAnneeChange, onSemestreChange, onNavigate }) {
  const collaborateursActifs = users.filter((u) => u.role === 'collaborateur' && u.actif).length

  // Filtre "Sous-équipes" du tableau de bord : quand une sous-équipe est
  // choisie, on affiche ses membres avec la liste de leurs tâches
  // (statut, priorité, date d'échéance) à la place du tableau récapitulatif.
  const [sousEquipeFiltre, setSousEquipeFiltre] = useState('')
  const [membresFiltre, setMembresFiltre] = useState([])
  const [tachesFiltre, setTachesFiltre] = useState([])
  const [loadingFiltre, setLoadingFiltre] = useState(false)

  useEffect(() => {
    if (!sousEquipeFiltre) { setMembresFiltre([]); setTachesFiltre([]); return }
    setLoadingFiltre(true)
    Promise.all([
      getMembresSousEquipe(sousEquipeFiltre),
      getTaches({ sous_equipe: sousEquipeFiltre }),
    ])
      .then(([membres, taches]) => { setMembresFiltre(membres || []); setTachesFiltre(taches || []) })
      .catch((err) => console.error(err))
      .finally(() => setLoadingFiltre(false))
  }, [sousEquipeFiltre])
  const tauxGlobal = teams.length
    ? Math.round(teams.reduce((s, t) => s + (t.avancement || 0), 0) / teams.length)
    : 0
  const demandesRecentes = demandes.slice(0, 3)

  // Critères d'évaluation réels (y compris les critères personnalisés ajoutés
  // depuis la page Évaluation) — remplace l'ancienne liste figée en dur.
  const [criteresEval, setCriteresEval] = useState([])
  useEffect(() => {
    getCriteres().then((data) => setCriteresEval(data.criteres || [])).catch((err) => console.error(err))
  }, [])

  // Meilleur / moins bon membre d'une équipe (UP ou hors UP), par évaluation (score /20)
  const equipesPourClassement = [
    ...teams.map((t) => ({ ...t, type: 'up' })),
    ...(horsUpTeams || []).map((t) => ({ ...t, type: 'hors_up' })),
  ]
  const [teamPourClassement, setTeamPourClassement] = useState('') // `${type}:${id}`
  const [scoresEquipe, setScoresEquipe] = useState([])
  const [loadingScores, setLoadingScores] = useState(false)

  useEffect(() => {
    // Resynchronise la sélection avec la liste d'équipes courante : si
    // l'équipe choisie n'existe plus pour la période affichée (ou qu'il n'y a
    // plus aucune équipe), on retombe sur la première dispo ou sur rien du
    // tout — sinon le classement continue d'afficher les scores d'une équipe
    // qui n'appartient même plus à la période sélectionnée.
    if (equipesPourClassement.length === 0) {
      if (teamPourClassement) setTeamPourClassement('')
      return
    }
    const stillExists = equipesPourClassement.some((t) => `${t.type}:${t.id}` === teamPourClassement)
    if (!stillExists) setTeamPourClassement(`${equipesPourClassement[0].type}:${equipesPourClassement[0].id}`)
  }, [equipesPourClassement, teamPourClassement])

  useEffect(() => {
    if (!teamPourClassement) { setScoresEquipe([]); return }
    const [type, id] = teamPourClassement.split(':')
    setLoadingScores(true)
    getScores({ sous_equipe: id, type, annee: filtreAnnee, semestre: filtreSemestre })
      .then(setScoresEquipe)
      .catch((err) => console.error(err))
      .finally(() => setLoadingScores(false))
  }, [teamPourClassement, filtreAnnee, filtreSemestre])

  const meilleur = scoresEquipe.length ? scoresEquipe.reduce((a, b) => (b.score > a.score ? b : a)) : null
  const moinsBon = scoresEquipe.length ? scoresEquipe.reduce((a, b) => (b.score < a.score ? b : a)) : null

  // Taux de complétion des tâches par collaborateur — filtre local aux deux
  // graphiques ci-dessous uniquement (ne recharge pas le reste de la page,
  // contrairement au filtre Année/Semestre global en haut de l'app).
  const [chartAnnee, setChartAnnee] = useState(filtreAnnee)
  const [chartSemestre, setChartSemestre] = useState(filtreSemestre)
  const [statsCompletion, setStatsCompletion] = useState([])
  useEffect(() => {
    getStatsImplication(chartAnnee, chartSemestre).then(setStatsCompletion).catch((err) => console.error(err))
  }, [chartAnnee, chartSemestre])

  const PIE_PALETTE = ['#E4032E', '#3B82F6', '#1FAE63', '#F5A623', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16']
  const repartitionPie = statsCompletion.map((s, i) => ({
    label: s.nom,
    value: s.taux_implication,
    color: PIE_PALETTE[i % PIE_PALETTE.length],
  }))

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi" style={{ cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => onNavigate?.('utilisateurs')} onKeyDown={(e) => e.key === 'Enter' && onNavigate?.('utilisateurs')}>
          <div className="top"><div className="icon-wrap red"><Icon.users /></div></div>
          <div className="num">{collaborateursActifs}</div><div className="label">Collaborateurs actifs</div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => onNavigate?.('sous-equipes')} onKeyDown={(e) => e.key === 'Enter' && onNavigate?.('sous-equipes')}>
          <div className="top"><div className="icon-wrap blue"><Icon.teams /></div></div>
          <div className="num">{loadingTeams ? '…' : teams.length}</div><div className="label">Sous-équipes</div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => onNavigate?.('demandes')} onKeyDown={(e) => e.key === 'Enter' && onNavigate?.('demandes')}>
          <div className="top"><div className="icon-wrap amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div></div>
          <div className="num">{demandes.length}</div><div className="label">Activité hors-équipe</div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => onNavigate?.('rapports')} onKeyDown={(e) => e.key === 'Enter' && onNavigate?.('rapports')}>
          <div className="top"><div className="icon-wrap green"><Icon.check /></div></div>
          <div className="num">{tauxGlobal}%</div><div className="label">Taux de complétion global</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head">
              <div><h2>Sous-équipes</h2><div className="hint">Avancement des tâches par équipe</div></div>
              {teams.length > 0 && (
                <select
                  className="select-chip"
                  value={sousEquipeFiltre}
                  onChange={(e) => setSousEquipeFiltre(e.target.value)}
                  style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  <option value="">Toutes les sous-équipes</option>
                  {teams.map((t) => <option key={`filtre-${t.id}`} value={t.id}>{t.nom}</option>)}
                </select>
              )}
            </div>
            {!sousEquipeFiltre && (
              <table>
                <thead><tr><th>Équipe</th><th>Type</th><th>Responsable</th><th>Membres</th><th>Avancement</th><th>Statut</th></tr></thead>
                <tbody>
                  {equipesPourClassement.map((t) => (
                    <tr key={`${t.type}-${t.id}`}>
                      <td><b>{t.nom}</b></td>
                      <td><span className={`badge ${t.type === 'up' ? 'validee' : 'refaire'}`}>{t.type === 'up' ? 'UP' : 'Hors UP'}</span></td>
                      <td><div className="name-cell"><div className="avatar sm">{initials(t.responsable)}</div><span className="n">{t.responsable}</span></div></td>
                      <td>{t.membres_count} membre{t.membres_count > 1 ? 's' : ''}</td>
                      <td><div className="progress-row"><div className="progress-track"><div className="progress-fill" style={{ width: `${t.avancement}%` }} /></div><span>{t.avancement}%</span></div></td>
                      <td><span className={`badge ${t.statut === 'Active' ? 'validee' : 'refaire'}`}>{t.statut}</span></td>
                    </tr>
                  ))}
                  {!loadingTeams && equipesPourClassement.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucune équipe pour l'instant</td></tr>
                  )}
                </tbody>
              </table>
            )}
            {sousEquipeFiltre && loadingFiltre && (
              <div className="hint" style={{ padding: '16px 0' }}>Chargement…</div>
            )}
           {sousEquipeFiltre && !loadingFiltre && (
              <div className="vp-membres-list">
                {membresFiltre.length === 0 && (
                  <div className="hint" style={{ padding: '16px 0' }}>Aucun membre dans cette sous-équipe</div>
                )}
                {membresFiltre.map((m) => {
                  const tachesMembre = tachesFiltre.filter((t) => t.id_collaborateur === m.id_collaborateur)
                  return (
                    <div key={m.id_collaborateur} className="vp-membre-card">
                      <div className="name-cell" style={{ marginBottom: tachesMembre.length > 0 ? 10 : 0 }}>
                        <div className="avatar sm">{initials(m.nom)}</div>
                        <span className="n"><b>{m.nom}</b></span>
                        <span className="hint" style={{ marginLeft: 'auto' }}>{tachesMembre.length} tâche{tachesMembre.length > 1 ? 's' : ''}</span>
                      </div>
                      {tachesMembre.length > 0 && (
                        <table>
                          <thead><tr><th>Tâche</th><th>Statut</th><th>Priorité</th><th>Échéance</th></tr></thead>
                          <tbody>
                            {tachesMembre.map((t) => (
                              <tr key={t.id_tache}>
                                <td>{t.titre}</td>
                                <td><span className={`badge ${tacheStatutBadge(t.statut).cls}`}>{tacheStatutBadge(t.statut).label}</span></td>
                                <td><span className={`badge ${t.priorite || 'moyenne'}`}>{PRIORITE_OPTIONS.find((p) => p.value === t.priorite)?.label || t.priorite}</span></td>
                                <td>{t.date_echeance ? new Date(t.date_echeance).toLocaleDateString('fr-FR') : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {tachesMembre.length === 0 && (
                        <div className="hint">Aucune tâche assignée</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-head">
              <div><h2>Meilleur / moins bon membre</h2><div className="hint">Par évaluation, sur la période sélectionnée en haut de page</div></div>
              {equipesPourClassement.length > 0 && (
                <select className="select-chip" value={teamPourClassement} onChange={(e) => setTeamPourClassement(e.target.value)} style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <optgroup label="Sous-équipes (UP)">
                    {teams.map((t) => <option key={`c-up-${t.id}`} value={`up:${t.id}`}>{t.nom}</option>)}
                  </optgroup>
                  <optgroup label="Équipes hors UP">
                    {(horsUpTeams || []).map((t) => <option key={`c-hu-${t.id}`} value={`hors_up:${t.id}`}>{t.nom}</option>)}
                  </optgroup>
                </select>
              )}
            </div>
            {equipesPourClassement.length === 0 && (
              <div className="hint" style={{ padding: '16px 0' }}>Aucune sous-équipe pour cette période</div>
            )}
            {equipesPourClassement.length > 0 && loadingScores && <div className="hint" style={{ padding: '16px 0' }}>Chargement…</div>}
            {equipesPourClassement.length > 0 && !loadingScores && scoresEquipe.length === 0 && (
              <div className="hint" style={{ padding: '16px 0' }}>Aucun score calculé pour cette équipe — voir la page Évaluation</div>
            )}
            {equipesPourClassement.length > 0 && !loadingScores && scoresEquipe.length > 0 && (
              <div>
                <div className="list-item" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--green-tint, #E7F8EF)', background: 'var(--green-tint, #E7F8EF)', marginBottom: 10 }}>
                  <div className="avatar sm">{initials(meilleur.collaborateur_nom)}</div>
                  <div className="body">
                    <div className="title">🏆 Meilleur membre — {meilleur.collaborateur_nom}</div>
                    <div className="desc">Score : <b>{meilleur.score}/20</b></div>
                  </div>
                </div>
                <div className="list-item" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div className="avatar sm">{initials(moinsBon.collaborateur_nom)}</div>
                  <div className="body">
                    <div className="title">Moins bon membre — {moinsBon.collaborateur_nom}</div>
                    <div className="desc">Score : <b>{moinsBon.score}/20</b></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-head">
              <div><h2>Taux de complétion des tâches</h2><div className="hint">Par collaborateur</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={chartAnnee}
                  onChange={(e) => setChartAnnee(e.target.value)}
                  className="select-chip"
                  style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                  title="Filtrer ce graphique par année universitaire"
                >
                  <option value="2025/2026">2025 / 2026</option>
                  <option value="2024/2025">2024 / 2025</option>
                </select>
                <select
                  value={chartSemestre}
                  onChange={(e) => setChartSemestre(e.target.value)}
                  className="select-chip"
                  style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                  title="Filtrer ce graphique par semestre"
                >
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                </select>
                <button className="icon-btn sm" title="Voir les rapports détaillés" onClick={() => onNavigate?.('rapports')}><Icon.reports /></button>
              </div>
            </div>
            <BarChartTaux data={statsCompletion} />
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head">
              <div><h2>Activité hors-équipe</h2><div className="hint">Cliquez pour ouvrir</div></div>
              <button className="icon-btn sm" title="Voir toute l'activité hors-équipe" onClick={() => onNavigate?.('demandes')}><Icon.requests /></button>
            </div>
            <div className="list">
              {demandesRecentes.map((r) => (
                <div className="list-item" key={r.id_demande} style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('demandes')}>
                  <div className="avatar sm">{initials(r.collaborateur_nom)}</div>
                  <div className="body">
                    <div className="title">{r.collaborateur_nom}</div>
                    <div className="desc">{r.titre}</div>
                    <div className="meta"><span>{new Date(r.date_reception).toLocaleDateString('fr-FR')}</span></div>
                  </div>
                </div>
              ))}
              {demandesRecentes.length === 0 && (
                <div className="list-item"><div className="body"><div className="desc">Aucune demande en cours</div></div></div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2>Critères d'évaluation</h2><div className="hint">Pondération appliquée au score final</div></div></div>
            <div>
              {criteresEval.map((c) => (
                <div className="criteria-row" key={c.id_critere}>
                  <div className="top"><b>{c.nom}{!c.code ? ' (personnalisé)' : ''}</b><span>{c.ponderation}%</span></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${c.ponderation}%` }} /></div>
                </div>
              ))}
              {criteresEval.length === 0 && (
                <div className="hint" style={{ padding: '16px 20px' }}>Aucun critère configuré — voir la page Évaluation</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2>Répartition des taux</h2><div className="hint">Tous collaborateurs — nom et taux de complétion</div></div></div>
            <PieChartRepartition data={repartitionPie} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= UTILISATEURS ================= */
function Utilisateurs({ users, teams, horsUpTeams, showToast, confirm, onChanged }) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous les rôles')
  const [teamFilter, setTeamFilter] = useState('Toutes les équipes')
  const [picks, setPicks] = useState({}) // { [`${role}-${id}`]: `${type}:${teamId}` }
  const [affecting, setAffecting] = useState(null) // key of row currently saving

  // Modale d'affectation rapide de tâche depuis la liste des utilisateurs
  const [tacheModalGroup, setTacheModalGroup] = useState(null) // { nom, collabUser, upTeams }
  const [tacheSousEquipe, setTacheSousEquipe] = useState('')
  const [tacheTitre, setTacheTitre] = useState('')
  const [tacheDescription, setTacheDescription] = useState('')
  const [tachePriorite, setTachePriorite] = useState('moyenne')
  const [tacheEcheance, setTacheEcheance] = useState('')
  const [savingTache, setSavingTache] = useState(false)

  // Liste combinée UP + hors UP, chacune taguée pour savoir quelle API appeler
  const allTeams = [
    ...teams.map((t) => ({ ...t, type: 'up' })),
    ...horsUpTeams.map((t) => ({ ...t, type: 'hors_up' })),
  ]

  // Regroupe par email : si la même personne existe côté collaborateur ET responsable
  // (comptes distincts mais même email), on l'affiche sur une seule ligne avec les deux rôles empilés.
  const groups = []
  const groupByEmail = new Map()
  for (const u of users) {
    const emailKey = (u.email || '').trim().toLowerCase()
    if (emailKey && groupByEmail.has(emailKey)) {
      groupByEmail.get(emailKey).entries.push(u)
    } else {
      const group = { key: emailKey || `${u.role}-${u.id}`, nom: u.nom, entries: [u] }
      groups.push(group)
      if (emailKey) groupByEmail.set(emailKey, group)
    }
  }
  // Ordre d'affichage constant : Responsable d'abord, puis Collaborateur
  groups.forEach((g) => g.entries.sort((a, b) => (a.role === b.role ? 0 : a.role === 'responsable' ? -1 : 1)))

  // Entrées d'un groupe réellement affichées compte tenu du filtre rôle — utilisé à la
  // fois pour le filtrage (rôle + équipe) et pour l'affichage, afin de rester cohérents :
  // le filtre équipe ne doit regarder que les comptes visibles, pas TOUS les comptes de
  // la personne (ex. un compte responsable masqué par le filtre rôle ne doit pas faire
  // apparaître la ligne si son compte collaborateur visible n'est pas dans cette équipe).
  const getVisibleEntries = (g) => (
    roleFilter === 'Tous les rôles'
      ? g.entries
      : g.entries.filter((u) =>
          (roleFilter === 'Responsable sous-équipe' && u.role === 'responsable') ||
          (roleFilter === 'Collaborateur' && u.role === 'collaborateur')
        )
  )

  const filteredGroups = groups.filter((g) => {
    const matchesQuery = g.nom.toLowerCase().includes(query.toLowerCase())
    const visible = getVisibleEntries(g)
    const matchesRole = visible.length > 0
    const matchesTeam =
      teamFilter === 'Toutes les équipes' ||
      visible.some((u) => (u.equipes || '').includes(teamFilter))
    return matchesQuery && matchesRole && matchesTeam
  })

  // Bascule le statut actif/inactif de TOUS les comptes de la personne (collaborateur + responsable) d'un coup
  const [togglingId, setTogglingId] = useState(null)
  const toggleActifGroup = async (entries) => {
    const key = `${entries[0].role}-${entries[0].id}`
    setTogglingId(key)
    try {
      await Promise.all(entries.map((u) => updateUser(u.role, u.id, { actif: !u.actif })))
      showToast(entries[0].actif ? 'Compte désactivé' : 'Compte réactivé')
      onChanged()
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de la mise à jour du compte")
    } finally {
      setTogglingId(null)
    }
  }

  const [removingTeam, setRemovingTeam] = useState(null) // `${role}-${id}-${type}-${teamId}`
  const retirerDeEquipe = async (u, team) => {
    const teamKey = `${u.role}-${u.id}-${team.type}-${team.id}`
    const ok = await confirm({
      title: 'Retirer ce membre de l\'équipe ?',
      message: `Retirer ${u.nom} de « ${team.nom} » ?`,
      confirmLabel: 'Retirer',
      danger: true,
    })
    if (!ok) return
    setRemovingTeam(teamKey)
    try {
      if (u.role === 'collaborateur') {
        if (team.type === 'up') await removeMembreSousEquipe(team.id, u.id)
        else await removeMembreEquipeHorsUp(team.id, u.id)
      } else {
        if (team.type === 'up') await updateSousEquipe(team.id, { id_responsable: null })
        else await updateEquipeHorsUp(team.id, { id_responsable: null })
      }
      showToast(`${u.nom} retiré de ${team.nom} ✓`)
      onChanged()
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'équipe")
    } finally {
      setRemovingTeam(null)
    }
  }

  // Supprime en une seule confirmation TOUS les comptes de la personne (collaborateur + responsable si les deux existent)
  const [deletingId, setDeletingId] = useState(null)
  const supprimerCompte = async (entries) => {
    const nom = entries[0].nom
    const label = entries.length > 1 ? 'les comptes (responsable et collaborateur)' : `le compte ${entries[0].roleLabel.toLowerCase()}`
    const ok = await confirm({
      title: 'Supprimer ce compte ?',
      message: `Supprimer définitivement ${label} de ${nom} ? Cette action est irréversible (ex : l'utilisateur a quitté ESPRIT).`,
      confirmLabel: 'Supprimer définitivement',
      danger: true,
    })
    if (!ok) return
    const key = `${entries[0].role}-${entries[0].id}`
    setDeletingId(key)
    try {
      for (const u of entries) {
        await deleteUser(u.role, u.id)
      }
      showToast(`Compte de ${nom} supprimé`)
      onChanged()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la suppression du compte')
    } finally {
      setDeletingId(null)
    }
  }

  const affecter = async (u) => {
    const key = `${u.role}-${u.id}`
    const pick = picks[key]
    if (!pick) { showToast('Choisissez une équipe'); return }
    const [type, teamId] = pick.split(':')
    setAffecting(key)
    try {
      if (u.role === 'collaborateur') {
        if (type === 'up') await addMembreSousEquipe(teamId, u.id)
        else await addMembreEquipeHorsUp(teamId, u.id)
      } else {
        if (type === 'up') await updateSousEquipe(teamId, { id_responsable: u.id })
        else await updateEquipeHorsUp(teamId, { id_responsable: u.id })
      }
      const team = allTeams.find((t) => t.type === type && String(t.id) === String(teamId))
      showToast(`${u.nom} affecté${team ? ` à ${team.nom}` : ''} ✓`)
      setPicks((p) => ({ ...p, [key]: '' }))
      onChanged()
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'affectation")
    } finally {
      setAffecting(null)
    }
  }

  // Ouvre la modale d'affectation rapide de tâche pour une ligne (un groupe = une personne)
  const openTacheModal = (g) => {
    const collabUser = g.entries.find((u) => u.role === 'collaborateur')
    if (!collabUser) {
      showToast('Seuls les comptes collaborateur peuvent recevoir une tâche')
      return
    }
    const upTeams = (collabUser.equipesList || []).filter((t) => t.type === 'up')
    setTacheModalGroup({ nom: g.nom, collabUser, upTeams })
    setTacheSousEquipe(upTeams.length === 1 ? String(upTeams[0].id) : '')
    setTacheTitre('')
    setTacheDescription('')
    setTachePriorite('moyenne')
    setTacheEcheance('')
  }

  // Ferme sans demander si rien n'a été saisi ; sinon confirme, pour ne pas perdre
  // la saisie en cours à cause d'un clic accidentel en dehors de la modale.
  const demanderFermetureTacheModal = async () => {
    if (!(tacheTitre.trim() || tacheDescription.trim())) { setTacheModalGroup(null); return }
    const ok = await confirm({
      title: 'Fermer sans enregistrer ?',
      message: 'La tâche en cours de saisie sera perdue.',
      confirmLabel: 'Fermer sans enregistrer',
      danger: true,
    })
    if (ok) setTacheModalGroup(null)
  }
  const closeTacheModal = demanderFermetureTacheModal

  // Modale "Liste des tâches" d'un collaborateur : titre, équipe assignée,
  // statut, priorité et date d'échéance de chacune de ses tâches.
  const [tachesListeUser, setTachesListeUser] = useState(null) // { nom, id }
  const [tachesListe, setTachesListe] = useState([])
  const [loadingTachesListe, setLoadingTachesListe] = useState(false)

  const openTachesListe = (g) => {
    const collabUser = g.entries.find((u) => u.role === 'collaborateur')
    if (!collabUser) {
      showToast('Seuls les comptes collaborateur ont des tâches')
      return
    }
    setTachesListeUser({ nom: g.nom, id: collabUser.id })
    setLoadingTachesListe(true)
    getTaches({ collaborateur: collabUser.id })
      .then((data) => setTachesListe(data || []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement des tâches') })
      .finally(() => setLoadingTachesListe(false))
  }
  const closeTachesListe = () => { setTachesListeUser(null); setTachesListe([]) }

  const submitTacheModal = async () => {
    if (!tacheTitre.trim()) { showToast('Le titre de la tâche est requis'); return }
    if (tacheModalGroup.upTeams.length > 1 && !tacheSousEquipe) { showToast('Choisissez une sous-équipe'); return }
    setSavingTache(true)
    try {
      await createTache({
        titre: tacheTitre.trim(),
        description: tacheDescription.trim() || null,
        priorite: tachePriorite,
        date_echeance: tacheEcheance || null,
        id_collaborateur: tacheModalGroup.collabUser.id,
        id_sous_equipe: tacheSousEquipe
          ? Number(tacheSousEquipe)
          : (tacheModalGroup.upTeams[0] ? tacheModalGroup.upTeams[0].id : null),
      })
      showToast(`Tâche affectée à ${tacheModalGroup.nom} ✓`)
      setTacheModalGroup(null)
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'affectation de la tâche")
    } finally {
      setSavingTache(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Collaborateurs</h2>
        <p>Gérez les comptes des responsables et des collaborateurs, et suivez leur rattachement aux sous-équipes et aux équipes hors UP.</p>
      </div>
      <div className="card">
        <div className="card-head">
          <div><h2>Tous les comptes</h2><div className="hint">{filteredGroups.reduce((n, g) => n + getVisibleEntries(g).length, 0)} comptes</div></div>
        </div>
        <div className="toolbar">
          <div className="search">
            <Icon.search />
            <input type="text" placeholder="Rechercher un utilisateur…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option>Tous les rôles</option>
            <option>Responsable sous-équipe</option>
            <option>Collaborateur</option>
          </select>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option>Toutes les équipes</option>
            <optgroup label="Sous-équipes (UP)">
              {teams.map((t) => <option key={`up-${t.id}`}>{t.nom}</option>)}
            </optgroup>
            <optgroup label="Équipes hors UP">
              {horsUpTeams.map((t) => <option key={`hu-${t.id}`}>{t.nom}</option>)}
            </optgroup>
          </select>
        </div>
        <table style={{ marginTop: 8 }}>
          <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Équipe(s)</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredGroups.map((g) => {
              const visibleEntries = getVisibleEntries(g)
              return (
              <tr key={g.key}>
                <td>
                  <div className="name-cell">
                    <div className="avatar sm">{initials(g.nom)}</div>
                    <span className="n">{g.nom}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {visibleEntries.map((u) => (
                      <span key={`${u.role}-${u.id}`} className={`role-pill ${u.role === 'collaborateur' ? 'collab' : ''}`}>{u.roleLabel}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {visibleEntries.map((u) => {
                      const key = `${u.role}-${u.id}`
                      const canAssign = u.role === 'collaborateur' || !u.equipes
                      const userTeams = u.equipesList || []
                      return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {userTeams.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {userTeams.map((team) => {
                                const teamKey = `${key}-${team.type}-${team.id}`
                                return (
                                  <span key={teamKey} className={`role-pill ${u.role === 'collaborateur' ? 'collab' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {team.nom}
                                    <button
                                      type="button"
                                      title={`Retirer ${u.nom} de ${team.nom}`}
                                      disabled={removingTeam === teamKey}
                                      onClick={() => retirerDeEquipe(u, team)}
                                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800, lineHeight: 1 }}
                                    >
                                      ×
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>
                          )}
                          {canAssign && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <select
                                className="status-select"
                                value={picks[key] || ''}
                                onChange={(e) => setPicks((p) => ({ ...p, [key]: e.target.value }))}
                              >
                                <option value="">Choisir une équipe…</option>
                                <optgroup label="Sous-équipes (UP)">
                                  {teams.map((t) => <option key={`up-${t.id}`} value={`up:${t.id}`}>{t.nom}</option>)}
                                </optgroup>
                                <optgroup label="Équipes hors UP">
                                  {horsUpTeams.map((t) => <option key={`hu-${t.id}`} value={`hors_up:${t.id}`}>{t.nom}</option>)}
                                </optgroup>
                              </select>
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={!picks[key] || affecting === key}
                                onClick={() => affecter(u)}
                              >
                                {affecting === key ? 'Affectation…' : 'Affecter'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </td>
                <td>
                  {(() => {
                    const allActive = visibleEntries.every((u) => u.actif)
                    return <span><span className={`dot ${allActive ? 'on' : 'off'}`} />{allActive ? 'Actif' : 'Inactif'}</span>
                  })()}
                </td>
                <td>
                  {(() => {
                    const groupKey = `${visibleEntries[0].role}-${visibleEntries[0].id}`
                    const allActive = visibleEntries.every((u) => u.actif)
                    return (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="icon-btn sm"
                          title={`Affecter une tâche à ${g.nom}`}
                          onClick={() => openTacheModal(g)}
                        >
                          <Icon.task />
                        </button>
                        {g.entries.some((u) => u.role === 'collaborateur') && (
                          <button
                            type="button"
                            className="icon-btn sm"
                            title={`Voir les tâches de ${g.nom}`}
                            onClick={() => openTachesListe(g)}
                          >
                            <Icon.layers />
                          </button>
                        )}
                        <button
                          className="icon-btn sm"
                          disabled={togglingId === groupKey}
                          title={allActive ? 'Désactiver le compte' : 'Activer le compte'}
                          style={{ color: allActive ? 'var(--red-dark)' : 'var(--green)' }}
                          onClick={() => toggleActifGroup(visibleEntries)}
                        >
                          <Icon.power />
                        </button>
                        <button
                          className="icon-btn sm"
                          disabled={deletingId === groupKey}
                          title={`Supprimer le compte de ${g.nom} (ex : l'utilisateur a quitté ESPRIT)`}
                          style={{ color: 'var(--red-dark)' }}
                          onClick={() => supprimerCompte(visibleEntries)}
                        >
                          <Icon.trash />
                        </button>
                      </div>
                    )
                  })()}
                </td>
              </tr>
              )
            })}
            {filteredGroups.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucun utilisateur ne correspond</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {tacheModalGroup && (
        <div className="modal-overlay" onClick={closeTacheModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Affecter une tâche</h2><div className="hint">à {tacheModalGroup.nom}</div></div>
                <button className="btn btn-ghost btn-sm" onClick={closeTacheModal}>Annuler</button>
              </div>
              <div className="form-grid">
                {tacheModalGroup.upTeams.length > 1 && (
                  <div className="field full">
                    <label>Sous-équipe</label>
                    <select value={tacheSousEquipe} onChange={(e) => setTacheSousEquipe(e.target.value)}>
                      <option value="">Choisir une sous-équipe…</option>
                      {tacheModalGroup.upTeams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                    </select>
                  </div>
                )}
                {tacheModalGroup.upTeams.length === 1 && (
                  <div className="field full">
                    <label>Sous-équipe</label>
                    <span className="role-pill collab" style={{ display: 'inline-flex', width: 'fit-content' }}>{tacheModalGroup.upTeams[0].nom}</span>
                  </div>
                )}
                {tacheModalGroup.upTeams.length === 0 && (
                  <div className="field full" style={{ fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 500 }}>
                    Ce collaborateur n'appartient à aucune sous-équipe UP — la tâche sera affectée sans sous-équipe.
                  </div>
                )}
                <div className="field full"><label>Titre de la tâche</label><input type="text" placeholder="Ex. Préparer la démo sprint 3" value={tacheTitre} onChange={(e) => setTacheTitre(e.target.value)} /></div>
                <div className="field full"><label>Description</label><input type="text" placeholder="Détails de la tâche (optionnel)" value={tacheDescription} onChange={(e) => setTacheDescription(e.target.value)} /></div>
                <div className="field">
                  <label>Priorité</label>
                  <select value={tachePriorite} onChange={(e) => setTachePriorite(e.target.value)}>
                    {PRIORITE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="field"><label>Date d'échéance</label><input type="date" value={tacheEcheance} onChange={(e) => setTacheEcheance(e.target.value)} /></div>
                {warningDateSeule(tacheEcheance) && (
                  <div className="field full"><div className="date-warning">⚠ {warningDateSeule(tacheEcheance)}</div></div>
                )}
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={savingTache} onClick={submitTacheModal}>{savingTache ? 'Affectation…' : 'Affecter la tâche'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {tachesListeUser && (
        <div className="modal-overlay" onClick={closeTachesListe}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Tâches de {tachesListeUser.nom}</h2><div className="hint">Équipe assignée, statut, priorité et échéance</div></div>
                <button className="btn btn-ghost btn-sm" onClick={closeTachesListe}>Fermer</button>
              </div>
              {loadingTachesListe && <div className="hint" style={{ padding: '16px 20px' }}>Chargement…</div>}
              {!loadingTachesListe && tachesListe.length === 0 && (
                <div className="hint" style={{ padding: '16px 20px' }}>Aucune tâche assignée à ce collaborateur</div>
              )}
              {!loadingTachesListe && tachesListe.length > 0 && (
                <table>
                  <thead><tr><th>Tâche</th><th>Équipe</th><th>Statut</th><th>Priorité</th><th>Échéance</th></tr></thead>
                  <tbody>
                    {tachesListe.map((t) => (
                      <tr key={t.id_tache}>
                        <td>{t.titre}</td>
                        <td>{t.sous_equipe_nom || '—'}</td>
                        <td><span className={`badge ${tacheStatutBadge(t.statut).cls}`}>{tacheStatutBadge(t.statut).label}</span></td>
                        <td><span className={`badge ${t.priorite || 'moyenne'}`}>{PRIORITE_OPTIONS.find((p) => p.value === t.priorite)?.label || t.priorite}</span></td>
                        <td>{t.date_echeance ? new Date(t.date_echeance).toLocaleDateString('fr-FR') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
/* ================= ACTIVITÉ HORS-ÉQUIPE (visualisation uniquement) ================= */
function Demandes({ demandes, teams, horsUpTeams, users }) {
  // Page passée en simple visualisation : plus d'acceptation/refus côté admin.
  // Quand un collaborateur ajoute une activité hors-équipe, elle apparaît ici
  // avec son statut, à titre informatif uniquement.
  const [selected, setSelected] = useState(null) // activité affichée dans la modale de détail (lecture seule)
  const [equipeFilter, setEquipeFilter] = useState('') // '' | `up:${id}` | `hors_up:${id}`
  const [collaborateurFilter, setCollaborateurFilter] = useState('') // '' | id_collaborateur

  const collaborateurs = (users || []).filter((u) => u.role === 'collaborateur')

  const toutes = [...demandes]
    .filter((d) => {
      if (!equipeFilter) return true
      const [type, idStr] = equipeFilter.split(':')
      const id = Number(idStr)
      if (type === 'up') {
        if (d.id_sous_equipe === id) return true
        const nom = (teams || []).find((t) => t.id === id)?.nom
        return !!nom && (d.equipes_noms || '').split(', ').includes(nom)
      }
      if (d.id_up === id) return true
      const nom = (horsUpTeams || []).find((t) => t.id === id)?.nom
      return !!nom && (d.equipes_noms || '').split(', ').includes(nom)
    })
    .filter((d) => !collaborateurFilter || String(d.id_collaborateur) === String(collaborateurFilter))
    .sort((a, b) => new Date(b.date_reception) - new Date(a.date_reception))

  const periodeLabel = selected && (selected.date_debut || selected.date_fin)
    ? `${selected.date_debut ? new Date(selected.date_debut).toLocaleDateString('fr-FR') : '—'} → ${selected.date_fin ? new Date(selected.date_fin).toLocaleDateString('fr-FR') : '—'}`
    : null

  return (
    <>
      <div className="page-head">
        <h2>Activité hors-équipe</h2>
        <p>Vue en lecture seule des activités hors-équipe déclarées par les collaborateurs, avec leur statut.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Toutes les activités</h2>
            <div className="hint">{toutes.length} activité{toutes.length > 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select-chip" value={equipeFilter} onChange={(e) => setEquipeFilter(e.target.value)}>
              <option value="">Toutes les équipes</option>
              <optgroup label="Sous-équipes (UP)">
                {(teams || []).map((t) => <option key={`f-up-${t.id}`} value={`up:${t.id}`}>{t.nom}</option>)}
              </optgroup>
              <optgroup label="Équipes hors UP">
                {(horsUpTeams || []).map((t) => <option key={`f-hu-${t.id}`} value={`hors_up:${t.id}`}>{t.nom}</option>)}
              </optgroup>
            </select>
            <select className="select-chip" value={collaborateurFilter} onChange={(e) => setCollaborateurFilter(e.target.value)}>
              <option value="">Tous les collaborateurs</option>
              {collaborateurs.map((c) => <option key={`f-collab-${c.id}`} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
        </div>
        <div className="list">
          {toutes.map((d) => (
            <div className="list-item" key={d.id_demande} style={{ cursor: 'pointer' }} onClick={() => setSelected(d)}>
              <div className="avatar sm">{initials(d.collaborateur_nom)}</div>
              <div className="body">
                <div className="title">{d.collaborateur_nom}</div>
                <div className="desc">{d.titre}</div>
                <div className="meta">
                  <span>{relativeDays(d.date_reception)}</span>
                  <span className={`statut-pill ${statutBadge(d.statut).cls}`}>{statutBadge(d.statut).label}</span>
                </div>
              </div>
            </div>
          ))}
          {toutes.length === 0 && (
            <div className="list-item"><div className="body"><div className="desc">Aucune activité hors-équipe pour le moment</div></div></div>
          )}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setSelected(null)} aria-label="Fermer">×</button>
            <div className="modal-title">Détail de l'activité</div>
            <div className="modal-sub">
              <strong style={{ color: 'var(--text)' }}>{selected.collaborateur_nom}</strong> — {selected.titre}
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <b style={{ color: 'var(--text)' }}>Statut : </b>
                <span className={`statut-pill ${statutBadge(selected.statut).cls}`}>{statutBadge(selected.statut).label}</span>
              </div>
              {selected.description && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Description : </b>{selected.description}</div>
              )}
              {periodeLabel && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Période : </b>{periodeLabel}</div>
              )}
              {selected.equipes_noms ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Équipe(s) concernée(s) : </b>{selected.equipes_noms}</div>
              ) : (
                <>
                  {selected.sous_equipe_nom && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Sous-équipe concernée : </b>{selected.sous_equipe_nom}</div>
                  )}
                  {selected.up_nom && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Équipe hors UP concernée : </b>{selected.up_nom}</div>
                  )}
                </>
              )}
              {selected.contact_responsable && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Responsable(s) informé(s) : </b>{selected.contact_responsable}</div>
              )}
              {!selected.description && !periodeLabel && !selected.equipes_noms && !selected.sous_equipe_nom && !selected.up_nom && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Aucune information complémentaire fournie</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ================= SOUS-ÉQUIPES ================= */
function SousEquipesPage({ teams, loadingTeams, horsUpTeams, loadingHorsUp, users, showToast, confirm, onChanged, onHorsUpChanged, onUsersChanged }) {
  const responsables = users.filter((u) => u.role === 'responsable')
  const collaborateurs = users.filter((u) => u.role === 'collaborateur')
  const key = (u) => (u.email || u.identifiant_esprit || '').toLowerCase()
  // Collaborateurs qui n'ont pas encore de compte responsable correspondant (même email) —
  // ils peuvent être choisis comme responsable directement ici : la promotion se fait à l'enregistrement.
  const responsableEmails = new Set(responsables.map(key).filter(Boolean))
  const promotableCollaborateurs = collaborateurs.filter((c) => !responsableEmails.has(key(c)))
  // Un utilisateur peut être responsable ET collaborateur (même personne, deux comptes liés
  // par le même email/identifiant). Pour la liste des membres, on propose donc tout le monde :
  // les collaborateurs existants, plus les responsables qui n'ont pas encore de compte
  // collaborateur associé (un compte sera créé automatiquement à l'ajout, avec les mêmes
  // identifiants de connexion). L'admin n'est jamais concerné ici.
  const collaborateurEmails = new Set(collaborateurs.map(key).filter(Boolean))
  const responsablesSansCompteCollab = responsables.filter((r) => !collaborateurEmails.has(key(r)))
  const memberOptions = [
    ...collaborateurs.map((c) => ({ value: `c:${c.id}`, nom: c.nom })),
    ...responsablesSansCompteCollab.map((r) => ({ value: `r:${r.id}`, nom: r.nom })),
  ]
  const memberLabel = (value) => {
    const [kind, rawId] = String(value).split(':')
    if (kind === 'r') {
      const r = responsables.find((x) => String(x.id) === rawId)
      return r ? r.nom : `#${rawId}`
    }
    const c = collaborateurs.find((x) => String(x.id) === rawId)
    return c ? c.nom : `#${rawId}`
  }

  const [typeFilter, setTypeFilter] = useState('Toutes')

  /* ---------- Modale "plus de détail" : liste des membres d'une équipe ---------- */
  const [membresModal, setMembresModal] = useState(null) // { nom, membres: [...] }
  const [loadingMembresModal, setLoadingMembresModal] = useState(false)

  const openMembresModal = async (t) => {
    setMembresModal({ nom: t.nom, membres: [] })
    setLoadingMembresModal(true)
    try {
      const detail = t.type === 'up' ? await getSousEquipe(t.id) : await getEquipeHorsUp(t.id)
      setMembresModal({ nom: t.nom, membres: detail.membres || [] })
    } catch (err) {
      console.error(err)
      showToast('Erreur lors du chargement des membres')
    } finally {
      setLoadingMembresModal(false)
    }
  }

  const refreshAll = () => { onChanged(); onHorsUpChanged() }

  const allTeams = [
    ...teams.map((t) => ({ ...t, type: 'up' })),
    ...horsUpTeams.map((t) => ({ ...t, type: 'hors_up' })),
  ]
  const visibleTeams = allTeams.filter((t) => {
    if (typeFilter === 'UP') return t.type === 'up'
    if (typeFilter === 'Hors UP') return t.type === 'hors_up'
    return true
  })

  const [editingId, setEditingId] = useState(null)
  const [type, setType] = useState('up')
  const [nom, setNom] = useState('')
  const [idModule, setIdModule] = useState('')
  const [idResponsable, setIdResponsable] = useState('')
  const [memberPick, setMemberPick] = useState('')
  const [memberIds, setMemberIds] = useState([]) // ids added in this session (new members to attach)
  const [existingMemberIds, setExistingMemberIds] = useState([]) // ids already on the team when editing
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  /* ---------- Affecter tâche ---------- */
  const [showTacheForm, setShowTacheForm] = useState(false)
  const [tacheTeamKey, setTacheTeamKey] = useState('') // ex. "up:3" | "hors_up:2"
  const [tacheMembres, setTacheMembres] = useState([])
  const [loadingTacheMembres, setLoadingTacheMembres] = useState(false)
  const [tacheCollaborateur, setTacheCollaborateur] = useState('')
  const [tacheTitre, setTacheTitre] = useState('')
  const [tacheDescription, setTacheDescription] = useState('')
  const [tachePriorite, setTachePriorite] = useState('moyenne')
  const [tacheEcheance, setTacheEcheance] = useState('')
  const [savingTache, setSavingTache] = useState(false)

  const resetTacheForm = () => {
    setTacheTeamKey('')
    setTacheMembres([])
    setTacheCollaborateur('')
    setTacheTitre('')
    setTacheDescription('')
    setTachePriorite('moyenne')
    setTacheEcheance('')
  }

  const openTacheForm = () => {
    resetTacheForm()
    setShowTacheForm(true)
  }

  // Ferme sans demander si rien n'a été saisi ; sinon confirme, pour ne pas perdre
  // la saisie en cours à cause d'un clic accidentel en dehors de la modale.
  const demanderFermetureTacheForm = async () => {
    const contenuNonVide = tacheTeamKey || tacheCollaborateur || tacheTitre.trim() || tacheDescription.trim()
    if (!contenuNonVide) { setShowTacheForm(false); resetTacheForm(); return }
    const ok = await confirm({
      title: 'Fermer sans enregistrer ?',
      message: 'La tâche en cours de saisie sera perdue.',
      confirmLabel: 'Fermer sans enregistrer',
      danger: true,
    })
    if (ok) { setShowTacheForm(false); resetTacheForm() }
  }
  const closeTacheForm = demanderFermetureTacheForm

  const onTacheTeamChange = async (value) => {
    setTacheTeamKey(value)
    setTacheCollaborateur('')
    setTacheMembres([])
    if (!value) return
    const [teamType, rawId] = value.split(':')
    setLoadingTacheMembres(true)
    try {
      const detail = teamType === 'up' ? await getSousEquipe(rawId) : await getEquipeHorsUp(rawId)
      setTacheMembres(detail.membres || [])
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du chargement des membres de l'équipe")
    } finally {
      setLoadingTacheMembres(false)
    }
  }

  const submitTache = async () => {
    if (!tacheTeamKey) { showToast('Choisissez une sous-équipe ou une équipe hors UP'); return }
    if (!tacheCollaborateur) { showToast('Choisissez un collaborateur'); return }
    if (!tacheTitre.trim()) { showToast('Le titre de la tâche est requis'); return }
    const [teamType, rawId] = tacheTeamKey.split(':')
    setSavingTache(true)
    try {
      await createTache({
        titre: tacheTitre.trim(),
        description: tacheDescription.trim() || null,
        priorite: tachePriorite,
        date_echeance: tacheEcheance || null,
        id_collaborateur: Number(tacheCollaborateur),
        // La table `tache` ne référence que les sous-équipes UP : pour une équipe
        // hors UP, la tâche reste liée au collaborateur choisi sans sous-équipe.
        id_sous_equipe: teamType === 'up' ? Number(rawId) : null,
      })
      showToast('Tâche affectée ✓')
      setShowTacheForm(false)
      resetTacheForm()
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'affectation de la tâche")
    } finally {
      setSavingTache(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setType('up')
    setNom('')
    setIdModule('')
    setIdResponsable('')
    setMemberPick('')
    setMemberIds([])
    setExistingMemberIds([])
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  // Ferme sans demander si rien n'a été saisi ; sinon confirme, pour ne pas perdre
  // la saisie en cours à cause d'un clic accidentel en dehors de la modale.
  const demanderFermetureForm = async () => {
    const contenuNonVide = nom.trim() || idModule.trim() || !!idResponsable || !!memberPick || memberIds.length > 0
    if (!contenuNonVide) { setShowForm(false); resetForm(); return }
    const ok = await confirm({
      title: 'Fermer sans enregistrer ?',
      message: 'Les modifications en cours seront perdues.',
      confirmLabel: 'Fermer sans enregistrer',
      danger: true,
    })
    if (ok) { setShowForm(false); resetForm() }
  }
  const closeForm = demanderFermetureForm

  const startEdit = async (t) => {
    setShowForm(true)
    setEditingId(t.id)
    setType(t.type)
    setNom(t.nom)
    setIdModule(t.id_module || '')
    setIdResponsable(t.id_responsable ? `existing:${t.id_responsable}` : '')
    setMemberPick('')
    setMemberIds([])
    try {
      const detail = t.type === 'up' ? await getSousEquipe(t.id) : await getEquipeHorsUp(t.id)
      setExistingMemberIds((detail.membres || []).map((m) => m.id_collaborateur))
    } catch (err) {
      console.error(err)
      setExistingMemberIds([])
    }
  }

  const addMember = () => {
    if (!memberPick) return
    const [kind, rawId] = memberPick.split(':')
    const alreadyExisting = kind === 'c' && existingMemberIds.includes(Number(rawId))
    if (memberIds.includes(memberPick) || alreadyExisting) {
      showToast('Ce membre est déjà dans la liste')
      return
    }
    setMemberIds((prev) => [...prev, memberPick])
    setMemberPick('')
  }

  const removeNewMember = (id) => setMemberIds((prev) => prev.filter((m) => m !== id))

  const removeExistingMember = async (id) => {
    if (!editingId) return
    try {
      if (type === 'up') await removeMembreSousEquipe(editingId, id)
      else await removeMembreEquipeHorsUp(editingId, id)
      setExistingMemberIds((prev) => prev.filter((m) => m !== id))
      showToast('Collaborateur retiré ✓')
    } catch (err) {
      console.error(err)
      showToast('Erreur lors du retrait du collaborateur')
    }
  }

  const submit = async () => {
    if (!nom.trim()) { showToast('Le nom du module est requis'); return }
    setSaving(true)
    try {
      let responsableId = null
      if (idResponsable) {
        const [kind, rawId] = idResponsable.split(':')
        if (kind === 'promote') {
          const promoted = await promoteToResponsable(rawId)
          responsableId = promoted.id_responsable
          onUsersChanged()
        } else {
          responsableId = rawId
        }
      }

      let teamId = editingId
      const payload = {
        nom: nom.trim(),
        id_module: idModule.trim() || null,
        id_responsable: responsableId,
      }
      if (type === 'up') {
        if (editingId) {
          await updateSousEquipe(editingId, payload)
        } else {
          const created = await createSousEquipe(payload)
          teamId = created.id_sous_equipe
        }
      } else {
        if (editingId) {
          await updateEquipeHorsUp(editingId, payload)
        } else {
          const created = await createEquipeHorsUp(payload)
          teamId = created.id_up
        }
      }

      // Un membre choisi parmi les responsables (`r:<id>`) n'a pas encore de compte
      // collaborateur : on lui en crée un (mêmes identifiants) avant de l'affecter,
      // exactement comme un collaborateur choisi comme responsable en obtient un.
      let usersNeedRefresh = false
      for (const value of memberIds) {
        const [kind, rawId] = value.split(':')
        let idCollaborateur = rawId
        if (kind === 'r') {
          const ensured = await ensureCollaborateurAccount(rawId)
          idCollaborateur = ensured.id_collaborateur
          usersNeedRefresh = true
        }
        if (type === 'up') await addMembreSousEquipe(teamId, idCollaborateur)
        else await addMembreEquipeHorsUp(teamId, idCollaborateur)
      }
      if (usersNeedRefresh) onUsersChanged()
      showToast(editingId ? 'Sous-équipe mise à jour ✓' : 'Sous-équipe créée ✓')
      setShowForm(false)
      resetForm()
      refreshAll()
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'enregistrement de la sous-équipe")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (t) => {
    const ok = await confirm({
      title: 'Supprimer cette équipe ?',
      message: `Supprimer la sous-équipe « ${t.nom} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    setDeletingId(t.id)
    try {
      if (t.type === 'up') await deleteSousEquipe(t.id)
      else await deleteEquipeHorsUp(t.id)
      showToast('Sous-équipe supprimée ✓')
      if (editingId === t.id) { setShowForm(false); resetForm() }
      refreshAll()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const loading = loadingTeams || loadingHorsUp

  return (
    <>
      <div className="page-head">
        <h2>Sous-équipes</h2>
        <p>Créez des sous-équipes, désignez leur responsable et affectez les collaborateurs — un collaborateur peut appartenir à plusieurs sous-équipes.</p>
      </div>
      <div className="card">
        <div className="card-head">
          <div><h2>Sous-équipes existantes</h2><div className="hint">{loading ? 'Chargement…' : `${allTeams.length} sous-équipes`}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" type="button" onClick={openTacheForm}><Icon.task style={{ width: 15, height: 15, marginRight: 6 }} />Affecter tâche</button>
            <button className="btn btn-primary" type="button" onClick={openCreate}>+ Nouvelle sous-équipe</button>
          </div>
        </div>
        <div style={{ padding: '0 20px 16px' }}>
          <div className="tab-pills">
            <button type="button" className={`tab-pill ${typeFilter === 'Toutes' ? 'active' : ''}`} onClick={() => setTypeFilter('Toutes')}>Toutes</button>
            <button type="button" className={`tab-pill ${typeFilter === 'UP' ? 'active' : ''}`} onClick={() => setTypeFilter('UP')}>Sous-équipes (UP)</button>
            <button type="button" className={`tab-pill ${typeFilter === 'Hors UP' ? 'active' : ''}`} onClick={() => setTypeFilter('Hors UP')}>Équipes hors-UP</button>
          </div>
        </div>
        <table>
              <thead><tr><th>Équipe</th><th>Type</th><th>Responsable</th><th>Membres</th><th>Avancement</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {visibleTeams.map((t) => (
                  <tr key={`${t.type}-${t.id}`}>
                    <td><b>{t.nom}</b>{t.id_module ? <div className="hint">{t.id_module}</div> : null}</td>
                    <td><span className={`role-pill ${t.type === 'up' ? '' : 'collab'}`}>{t.type === 'up' ? 'UP' : 'Hors UP'}</span></td>
                    <td><div className="name-cell"><div className="avatar sm">{initials(t.responsable)}</div><span className="n">{t.responsable}</span></div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{t.membres_count}</span>
                        <button className="icon-btn sm" title="Voir la liste des membres" onClick={() => openMembresModal(t)}><Icon.eye /></button>
                      </div>
                    </td>
                    <td><div className="progress-row"><div className="progress-track"><div className="progress-fill" style={{ width: `${t.avancement}%` }} /></div><span>{t.avancement}%</span></div></td>
                    <td><span className={`badge ${t.statut === 'Active' ? 'validee' : 'refaire'}`}>{t.statut}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="icon-btn" title="Modifier" onClick={() => startEdit(t)}><Icon.edit /></button>
                        <button className="icon-btn" title="Supprimer" disabled={deletingId === t.id} onClick={() => remove(t)}><Icon.trash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && visibleTeams.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucune sous-équipe</td></tr>
                )}
              </tbody>
            </table>
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-head">
              <div><h2>{editingId ? 'Modifier la sous-équipe' : 'Nouvelle sous-équipe'}</h2><div className="hint">{editingId ? 'Mettre à jour le module, le responsable et les membres' : 'Créer et affecter un responsable'}</div></div>
              <button className="btn btn-ghost btn-sm" onClick={closeForm}>Annuler</button>
            </div>
            <div className="form-grid">
              <div className="field full">
                <label>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} disabled={!!editingId}>
                  <option value="up">UP</option>
                  <option value="hors_up">Hors UP</option>
                </select>
              </div>
              <div className="field full"><label>Nom du module</label><input type="text" placeholder="Ex. Cybersécurité" value={nom} onChange={(e) => setNom(e.target.value)} /></div>
              <div className="field full"><label>ID module</label><input type="text" placeholder="Ex. MOD-204" value={idModule} onChange={(e) => setIdModule(e.target.value)} /></div>
              <div className="field full">
                <label>Responsable</label>
                <select value={idResponsable} onChange={(e) => setIdResponsable(e.target.value)}>
                  <option value="">Choisir un responsable…</option>
                  <optgroup label="Responsables existants">
                    {responsables.map((r) => <option key={`r-${r.id}`} value={`existing:${r.id}`}>{r.nom}</option>)}
                  </optgroup>
                  {promotableCollaborateurs.length > 0 && (
                    <optgroup label="Collaborateurs (seront promus responsable automatiquement)">
                      {promotableCollaborateurs.map((c) => <option key={`c-${c.id}`} value={`promote:${c.id}`}>{c.nom}</option>)}
                    </optgroup>
                  )}
                </select>
                <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 500, lineHeight: 1.4 }}>Choisir un collaborateur ici crée automatiquement son compte responsable — il gardera les mêmes identifiants de connexion.</div>
              </div>
              <div className="field full">
                <label>Membres</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select value={memberPick} onChange={(e) => setMemberPick(e.target.value)} style={{ flex: 1 }}>
                    <option value="">Choisir un membre…</option>
                    {memberOptions.map((m) => <option key={m.value} value={m.value}>{m.nom}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={addMember}>+ Ajouter</button>
                </div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 500, lineHeight: 1.4 }}>Un responsable peut aussi être ajouté comme membre — un compte collaborateur lui sera créé automatiquement avec les mêmes identifiants de connexion.</div>
                {(existingMemberIds.length > 0 || memberIds.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {existingMemberIds.map((id) => {
                      const c = collaborateurs.find((x) => x.id === id)
                      return (
                        <span key={`e-${id}`} className="role-pill collab" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {c ? c.nom : `#${id}`}
                          <button type="button" onClick={() => removeExistingMember(id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}>×</button>
                        </span>
                      )
                    })}
                    {memberIds.map((value) => (
                      <span key={`n-${value}`} className="role-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {memberLabel(value)}
                        <button type="button" onClick={() => removeNewMember(value)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" disabled={saving} onClick={submit}>{saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Créer la sous-équipe'}</button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
      {showTacheForm && (
        <div className="modal-overlay" onClick={closeTacheForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Affecter une tâche</h2><div className="hint">Choisir une équipe, puis un collaborateur de cette équipe</div></div>
                <button className="btn btn-ghost btn-sm" onClick={closeTacheForm}>Annuler</button>
              </div>
              <div className="form-grid">
                <div className="field full">
                  <label>Sous-équipe / équipe hors UP</label>
                  <select value={tacheTeamKey} onChange={(e) => onTacheTeamChange(e.target.value)}>
                    <option value="">Choisir une équipe…</option>
                    <optgroup label="Sous-équipes (UP)">
                      {teams.map((t) => <option key={`tup-${t.id}`} value={`up:${t.id}`}>{t.nom}</option>)}
                    </optgroup>
                    <optgroup label="Équipes hors UP">
                      {horsUpTeams.map((t) => <option key={`thu-${t.id}`} value={`hors_up:${t.id}`}>{t.nom}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div className="field full">
                  <label>Collaborateur</label>
                  <select value={tacheCollaborateur} onChange={(e) => setTacheCollaborateur(e.target.value)} disabled={!tacheTeamKey || loadingTacheMembres}>
                    <option value="">{loadingTacheMembres ? 'Chargement…' : 'Choisir un collaborateur…'}</option>
                    {tacheMembres.map((m) => <option key={m.id_collaborateur} value={m.id_collaborateur}>{m.nom}</option>)}
                  </select>
                  {tacheTeamKey && !loadingTacheMembres && tacheMembres.length === 0 && (
                    <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 500 }}>Cette équipe n'a pas encore de membres.</div>
                  )}
                </div>
                <div className="field full"><label>Titre de la tâche</label><input type="text" placeholder="Ex. Préparer la démo sprint 3" value={tacheTitre} onChange={(e) => setTacheTitre(e.target.value)} /></div>
                <div className="field full"><label>Description</label><input type="text" placeholder="Détails de la tâche (optionnel)" value={tacheDescription} onChange={(e) => setTacheDescription(e.target.value)} /></div>
                <div className="field">
                  <label>Priorité</label>
                  <select value={tachePriorite} onChange={(e) => setTachePriorite(e.target.value)}>
                    {PRIORITE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="field"><label>Date d'échéance</label><input type="date" value={tacheEcheance} onChange={(e) => setTacheEcheance(e.target.value)} /></div>
                {warningDateSeule(tacheEcheance) && (
                  <div className="field full"><div className="date-warning">⚠ {warningDateSeule(tacheEcheance)}</div></div>
                )}
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={savingTache} onClick={submitTache}>{savingTache ? 'Affectation…' : 'Affecter la tâche'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {membresModal && (
        <div className="modal-overlay" onClick={() => setMembresModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Membres — {membresModal.nom}</h2><div className="hint">{membresModal.membres.length} membre{membresModal.membres.length > 1 ? 's' : ''}</div></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setMembresModal(null)}>Fermer</button>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                {loadingMembresModal && <div style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>Chargement…</div>}
                {!loadingMembresModal && membresModal.membres.length === 0 && (
                  <div style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>Aucun membre pour l'instant</div>
                )}
                {!loadingMembresModal && membresModal.membres.map((m) => (
                  <div key={m.id_collaborateur || m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="avatar sm">{initials(m.nom)}</div>
                    <b style={{ fontSize: 13 }}>{m.nom}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
function CellLibelle({ items, onOpenDetail, accent = 'blue' }) {
  const list = items || []
  if (list.length === 0) {
    return <span className="activite-empty">–</span>
  }
  return (
    <button
      type="button"
      className={`activite-chip accent-${accent}`}
      title={list.map((i) => i.titre).join(', ')}
      onClick={() => onOpenDetail(list)}
    >
      <span className="activite-chip-label">{list[0].titre}</span>
      {list.length > 1 && <span className="activite-chip-count">+{list.length - 1}</span>}
    </button>
  )
}
const ENCADREMENT_TYPE_LABELS = { pfe: 'PFE', stage: 'Stage', mini_projet: 'Mini-projet', autre: 'Autre' }

function CategoryListModal({ title, items, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>{title}</h2><div className="hint">{items.length} entrée{items.length > 1 ? 's' : ''}</div></div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            {items.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>Aucune entrée</span>}
            {items.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <b style={{ fontSize: 13 }}>{a.titre}</b>
                  {a.role && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>Rôle : {a.role}</div>}
                  {(a.sujet || a.type || a.annee_universitaire) && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
                      {a.sujet ? `${a.sujet} · ` : ''}
                      {a.type ? (ENCADREMENT_TYPE_LABELS[a.type] || a.type) : ''}
                      {a.annee_universitaire ? ` · ${a.annee_universitaire}` : ''}
                    </div>
                  )}
                </div>
                {a.date && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{formatDateShortFr(a.date)}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const ACTIVITE_COLUMN_GROUPS = [
  { label: 'Encadrement académique', accent: 'blue', cols: [
    { key: 'encadrements', label: 'Étudiants', icon: 'academic' },
    { key: 'expertises', label: 'Expertises', icon: 'award' },
  ] },
  { label: 'Jurys', accent: 'amber', cols: [
    { key: 'membre_jury', label: 'Membre', icon: 'gavel' },
    { key: 'president_jury', label: 'Président', icon: 'gavel' },
  ] },
  { label: 'Formations', accent: 'green', cols: [
    { key: 'formation_ete', label: 'Été', icon: 'book' },
    { key: 'formation_hiver', label: 'Hiver', icon: 'book' },
    { key: 'formation_printemps', label: 'Printemps', icon: 'book' },
  ] },
  { label: 'Vie associative', accent: 'purple', cols: [
    { key: 'evenement', label: 'Événements', icon: 'calendar' },
    { key: 'comite_organisation', label: 'Comités', icon: 'building' },
  ] },
]
const ACTIVITE_KEY_ACCENT = Object.fromEntries(
  ACTIVITE_COLUMN_GROUPS.flatMap((g) => g.cols.map((c) => [c.key, g.accent]))
)
const ACTIVITE_KEY_ICON = Object.fromEntries(
  ACTIVITE_COLUMN_GROUPS.flatMap((g) => g.cols.map((c) => [c.key, c.icon]))
)

function ActiviteEcole({ showToast, filtreAnnee, filtreSemestre, confirm }) {
  const [professeurs, setProfesseurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [addingExpertiseFor, setAddingExpertiseFor] = useState(null)
  const [categoryModal, setCategoryModal] = useState(null) // { title, items }

  const refresh = useCallback(() => {
    setLoading(true)
    return getProfesseurs()
      .then((data) => setProfesseurs(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement des collaborateurs') })
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { refresh() }, [refresh])

  const filtered = professeurs.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()))
  // Les colonnes jury/formation/événements/comités sont filtrées sur la période
  // sélectionnée (semestre inclus) ; les encadrements n'ont qu'une année universitaire
  // (pas de semestre) donc filtrés uniquement sur l'année. Les expertises n'ont
  // aucune notion de période et restent donc toujours affichées en entier.
  const dansPeriode = (items) => (items || []).filter((it) => estDansPeriode(it.date, filtreAnnee, filtreSemestre))
  const dansAnnee = (items) => (items || []).filter((it) => estDansAnnee(it.annee_universitaire, filtreAnnee))

  return (
    <>
      <div className="page-head">
        <h2>Activité école</h2>
        <p>Suivez l'implication de chaque collaborateur : étudiants encadrés, expertises, jurys, formations, événements et comités d'organisation.</p>
      </div>
      <div className="card">
        <div className="card-head">
          <div><h2>Tous les collaborateurs</h2><div className="hint">{loading ? 'Chargement…' : `${professeurs.length} collaborateurs`}</div></div>
        </div>
        <div className="toolbar">
          <div className="search">
            <Icon.search />
            <input type="text" placeholder="Rechercher un collaborateur…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="activite-table" style={{ marginTop: 8 }}>
            <thead>
              <tr className="grp">
                <th rowSpan={2}>Collaborateur</th>
                {ACTIVITE_COLUMN_GROUPS.map((g) => (
                  <th key={g.label} colSpan={g.cols.length} className={`grp-start accent-${g.accent}`}>{g.label}</th>
                ))}
                <th rowSpan={2}></th>
              </tr>
              <tr className="sub">
                {ACTIVITE_COLUMN_GROUPS.map((g) => g.cols.map((c, i) => {
                  const ColIcon = Icon[c.icon]
                  return (
                    <th key={c.key} className={i === 0 ? 'grp-start' : ''}>
                      <span className={`col-label accent-${g.accent}`}>{ColIcon && <ColIcon />}{c.label}</span>
                    </th>
                  )
                }))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td><div className="name-cell"><div className="avatar sm">{initials(p.nom)}</div><span className="n">{p.nom}</span></div></td>
                  <td className="grp-start"><CellLibelle items={p.encadrements} accent="blue" onOpenDetail={(items) => setCategoryModal({ title: `Étudiants encadrés — ${p.nom}`, items })} /></td>
                  <td><CellLibelle items={p.expertises} accent="blue" onOpenDetail={(items) => setCategoryModal({ title: `Expertises — ${p.nom}`, items })} /></td>
                  <td className="grp-start"><CellLibelle items={dansPeriode(p.membre_jury)} accent="amber" onOpenDetail={(items) => setCategoryModal({ title: `Membre de jury — ${p.nom}`, items })} /></td>
                  <td><CellLibelle items={dansPeriode(p.president_jury)} accent="amber" onOpenDetail={(items) => setCategoryModal({ title: `Président de jury — ${p.nom}`, items })} /></td>
                  <td className="grp-start"><CellLibelle items={dansPeriode(p.formation_ete)} accent="green" onOpenDetail={(items) => setCategoryModal({ title: `Formation d'été — ${p.nom}`, items })} /></td>
                  <td><CellLibelle items={dansPeriode(p.formation_hiver)} accent="green" onOpenDetail={(items) => setCategoryModal({ title: `Formation d'hiver — ${p.nom}`, items })} /></td>
                  <td><CellLibelle items={dansPeriode(p.formation_printemps)} accent="green" onOpenDetail={(items) => setCategoryModal({ title: `Formation de printemps — ${p.nom}`, items })} /></td>
                  <td className="grp-start"><CellLibelle items={dansPeriode(p.evenement)} accent="purple" onOpenDetail={(items) => setCategoryModal({ title: `Événements — ${p.nom}`, items })} /></td>
                  <td><CellLibelle items={dansPeriode(p.comite_organisation)} accent="purple" onOpenDetail={(items) => setCategoryModal({ title: `Comités — ${p.nom}`, items })} /></td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button className="icon-btn sm" title="Ajouter une expertise" onClick={() => setAddingExpertiseFor(p)}><Icon.plus /></button>
                      <button className="icon-btn sm" title="Voir le détail complet" onClick={() => setSelected(p)}><Icon.eye /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucun collaborateur trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selected && (
        <ProfesseurDetail
          professeur={selected}
          onClose={() => setSelected(null)}
          showToast={showToast}
          filtreAnnee={filtreAnnee}
          filtreSemestre={filtreSemestre}
        />
      )}
      {addingExpertiseFor && (
        <ExpertiseModal
          professeur={addingExpertiseFor}
          onClose={() => setAddingExpertiseFor(null)}
          showToast={showToast}
          onChanged={refresh}
          confirm={confirm}
        />
      )}
      {categoryModal && (
        <CategoryListModal
          title={categoryModal.title}
          items={categoryModal.items}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </>
  )
}

const ACTIVITE_LABELS = {
  membre_jury: 'Membre de jury',
  president_jury: 'Président de jury',
  formation_ete: "Formation d'été",
  formation_hiver: "Formation d'hiver",
  formation_printemps: 'Formation de printemps',
  evenement: 'Événement',
  comite_organisation: "Comité d'organisation",
}

function DetailSection({ icon, accent = 'blue', label, count, isEmpty, emptyText, children }) {
  const IconComp = Icon[icon]
  return (
    <div className="field full">
      <div className={`detail-head accent-${accent}`}>
        {IconComp && <IconComp />}
        <label>{label}</label>
        <span className="detail-count">{count}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        {isEmpty && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{emptyText}</span>}
        {children}
      </div>
    </div>
  )
}

function ProfesseurDetail({ professeur, onClose, showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState({
    expertises: [], encadrements: [],
    membre_jury: [], president_jury: [],
    formation_ete: [], formation_hiver: [], formation_printemps: [],
    evenement: [], comite_organisation: [],
  })

  useEffect(() => {
    setLoading(true)
    getProfesseurDetail(professeur.id)
      .then(setDetail)
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement du détail') })
      .finally(() => setLoading(false))
  }, [professeur.id, showToast])

  const encadrementsFiltres = detail.encadrements.filter((enc) => estDansAnnee(enc.annee_universitaire, filtreAnnee))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>{professeur.nom}</h2><div className="hint">Vue d'ensemble — renseignée par le collaborateur lui-même, sauf les expertises</div></div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: 'var(--text-faint)' }}>Chargement…</div>
          ) : (
            <div className="form-grid">
              <DetailSection
                icon="academic" accent="blue" label="Étudiants encadrés" count={encadrementsFiltres.length}
                isEmpty={encadrementsFiltres.length === 0}
                emptyText={detail.encadrements.length === 0 ? 'Aucun étudiant encadré' : 'Aucun étudiant encadré sur cette période'}
              >
                {encadrementsFiltres.map((enc) => (
                  <div key={enc.id_encadrement} className="detail-entry accent-blue">
                    <b>{enc.nom_etudiant}</b>
                    <span className="detail-entry-meta">
                      {enc.sujet ? `${enc.sujet} · ` : ''}{enc.type}{enc.annee_universitaire ? ` · ${enc.annee_universitaire}` : ''}
                    </span>
                  </div>
                ))}
              </DetailSection>

              <DetailSection
                icon="award" accent="blue" label="Expertises" count={detail.expertises.length}
                isEmpty={detail.expertises.length === 0} emptyText="Aucune expertise renseignée"
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.expertises.map((e) => (
                    <span key={e.id_expertise} className="role-pill">{e.libelle}</span>
                  ))}
                </div>
              </DetailSection>

              {Object.keys(ACTIVITE_LABELS).map((type) => {
                const list = (detail[type] || []).filter((a) => estDansPeriode(a.date_activite, filtreAnnee, filtreSemestre))
                const accent = ACTIVITE_KEY_ACCENT[type] || 'blue'
                return (
                  <DetailSection
                    key={type} icon={ACTIVITE_KEY_ICON[type]} accent={accent} label={ACTIVITE_LABELS[type]} count={list.length}
                    isEmpty={list.length === 0} emptyText="Aucune entrée sur cette période"
                  >
                    {list.map((a) => (
                      <div key={a.id_activite} className={`detail-entry accent-${accent}`}>
                        <b>{a.titre}</b>
                        {type === 'evenement' && a.role && <span className="detail-entry-meta">· Rôle : {a.role}</span>}
                        {a.date_activite && <span className="detail-entry-meta">{formatDateShortFr(a.date_activite)}</span>}
                      </div>
                    ))}
                  </DetailSection>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Modale dédiée : ajouter/retirer une expertise (admin) ---------- */
function ExpertiseModal({ professeur, onClose, showToast, onChanged, confirm }) {
  const [loading, setLoading] = useState(true)
  const [expertises, setExpertises] = useState([])
  const [expertiseInput, setExpertiseInput] = useState('')
  const [savingExpertise, setSavingExpertise] = useState(false)

  // Ferme sans demander si rien n'a été saisi ; sinon confirme, pour ne pas perdre
  // la saisie en cours à cause d'un clic accidentel en dehors de la modale.
  const demanderFermeture = async () => {
    if (!expertiseInput.trim()) { onClose(); return }
    const ok = await confirm({
      title: 'Fermer sans enregistrer ?',
      message: 'La saisie en cours sera perdue.',
      confirmLabel: 'Fermer sans enregistrer',
      danger: true,
    })
    if (ok) onClose()
  }

  const refresh = useCallback(() => (
    getProfesseurDetail(professeur.id)
      .then((d) => setExpertises(d.expertises || []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement des expertises') })
      .finally(() => setLoading(false))
  ), [professeur.id, showToast])

  useEffect(() => { refresh() }, [refresh])

  const submitExpertise = async () => {
    if (!expertiseInput.trim()) return
    setSavingExpertise(true)
    try {
      await addExpertiseAdmin(professeur.id, expertiseInput.trim())
      setExpertiseInput('')
      await refresh()
      onChanged()
      showToast('Expertise ajoutée ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'ajout de l'expertise")
    } finally {
      setSavingExpertise(false)
    }
  }

  const removeExpertiseItem = async (id) => {
    try {
      await deleteExpertise(id)
      await refresh()
      onChanged()
      showToast('Expertise retirée ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'expertise")
    }
  }

  return (
    <div className="modal-overlay" onClick={demanderFermeture}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>Expertises — {professeur.nom}</h2><div className="hint">Ajouter ou retirer une expertise pour ce collaborateur</div></div>
            <button className="btn btn-ghost btn-sm" onClick={demanderFermeture}>Fermer</button>
          </div>
          <div className="form-grid">
            <div className="field full">
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" placeholder="Ex. Intelligence artificielle" value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" type="button" disabled={savingExpertise} onClick={submitExpertise}>{savingExpertise ? 'Ajout…' : '+ Ajouter'}</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {loading && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Chargement…</span>}
                {!loading && expertises.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucune expertise renseignée</span>}
                {expertises.map((e) => (
                  <span key={e.id_expertise} className="role-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {e.libelle}
                    <button type="button" onClick={() => removeExpertiseItem(e.id_expertise)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= VŒUX PÉDAGOGIQUES (formulaire dynamique) ================= */
// Refonte complète : plus de 8 questions fixes. L'admin construit lui-même le
// formulaire (questions + réponses possibles), pour les questions de type
// "module" il ajoute aussi la liste des classes de chaque module. Une fois le
// formulaire envoyé, les réponses des collaborateurs remontent ici, et l'admin
// affecte les classes disponibles module par module (page "Affectation").

function vpStatutBadge(statut) {
  const map = {
    brouillon: { label: 'Brouillon', cls: 'gray' },
    publiee: { label: 'Envoyée', cls: 'blue' },
    cloturee: { label: 'Clôturée', cls: 'validee' },
  }
  return map[statut] || { label: statut, cls: 'gray' }
}

const VP_TYPES_QUESTION = [
  { value: 'modules', label: 'Modules (avec classes à affecter)', color: 'blue' },
  { value: 'choix_unique', label: 'Choix unique', color: 'amber' },
  { value: 'choix_multiple', label: 'Choix multiple', color: 'green' },
  { value: 'texte', label: 'Réponse libre', color: 'muted' },
]

function VoeuxPedagogiques({ showToast, confirm }) {
  const [campagnes, setCampagnes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('builder') // 'builder' | 'reponses' | 'affectation'
  const [creatingTitre, setCreatingTitre] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  const load = () => {
    setLoading(true)
    getCampagnesVoeuxPedagogiques()
      .then((data) => {
        setCampagnes(data)
        if (!selectedId && data.length > 0) setSelectedId(data[0].id_campagne)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const creerCampagne = async () => {
    try {
      const c = await createCampagneVoeuxPedagogiques({ titre: creatingTitre.trim() || 'Vœux pédagogiques' })
      showToast('Formulaire créé — ajoutez vos questions')
      setCreatingTitre('')
      setShowNewForm(false)
      setCampagnes((prev) => [c, ...prev])
      setSelectedId(c.id_campagne)
      setTab('builder')
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la création')
    }
  }

  const selected = campagnes.find((c) => c.id_campagne === selectedId)

  return (
    <>
      <div className="page-head">
        <h2>Vœux pédagogiques</h2>
        <p>Créez votre propre formulaire (questions, réponses, classes par module), envoyez-le, puis affectez les classes disponibles.</p>
      </div>

      <div className="vp-layout">
        <div className="vp-sidebar">
          <div className="card">
            <div className="card-head">
              <div><h2>Formulaires</h2><div className="hint">{campagnes.length} au total</div></div>
              <button
                type="button"
                className="icon-btn sm"
                title="Nouveau formulaire"
                onClick={() => setShowNewForm((v) => !v)}
                style={showNewForm ? { color: 'var(--red)' } : undefined}
              >
                <Icon.plus />
              </button>
            </div>

            {showNewForm && (
              <div style={{ padding: '0 20px 16px' }}>
                <div className="vp-new-form-panel" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.02em' }}>Titre du formulaire</label>
                  <input
                    type="text"
                    placeholder="ex. Vœux 2026/2027 - S1"
                    value={creatingTitre}
                    onChange={(e) => setCreatingTitre(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); creerCampagne() } }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewForm(false)}>Annuler</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={creerCampagne}>Créer</button>
                  </div>
                </div>
              </div>
            )}

            {loading && <div className="hint" style={{ padding: '0 20px 16px' }}>Chargement…</div>}
            {!loading && (
              <div className="vp-campagnes-list">
                {campagnes.map((c) => (
                  <div
                    key={c.id_campagne}
                    className={`vp-campagne-row${c.id_campagne === selectedId ? ' active' : ''}`}
                    onClick={() => { setSelectedId(c.id_campagne); setTab('builder') }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</div>
                      <div className="hint">{c.nb_reponses} réponse{c.nb_reponses > 1 ? 's' : ''}</div>
                    </div>
                    <span className={`statut-pill ${vpStatutBadge(c.statut).cls}`}>{vpStatutBadge(c.statut).label}</span>
                  </div>
                ))}
                {campagnes.length === 0 && <div className="hint" style={{ padding: '0 12px 12px' }}>Aucun formulaire pour l'instant — créez-en un avec le bouton +.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="vp-main">
          {selected ? (
            <VoeuxCampagneDetail
              campagne={selected}
              showToast={showToast}
              confirm={confirm}
              tab={tab}
              setTab={setTab}
              onChanged={(updated) => {
                if (updated === null) { setSelectedId(null); load(); return }
                setCampagnes((prev) => prev.map((c) => (c.id_campagne === updated.id_campagne ? { ...c, ...updated, questions: updated.questions ?? c.questions } : c)))
              }}
            />
          ) : (
            !loading && <div className="card"><div className="hint" style={{ padding: 20 }}>Sélectionnez un formulaire à gauche, ou créez-en un nouveau.</div></div>
          )}
        </div>
      </div>
    </>
  )
}

function VoeuxCampagneDetail({ campagne, showToast, confirm, tab, setTab, onChanged }) {
  const [full, setFull] = useState(campagne)
  const [loading, setLoading] = useState(true)

  const reload = () => {
    getCampagneVoeuxPedagogiques(campagne.id_campagne)
      .then((data) => { setFull(data); onChanged(data) })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }
  useEffect(() => { setLoading(true); reload() }, [campagne.id_campagne]) // eslint-disable-line react-hooks/exhaustive-deps

  const isBrouillon = full.statut === 'brouillon'

  const publier = async () => {
    try {
      const updated = await publierCampagneVoeuxPedagogiques(campagne.id_campagne)
      showToast('Formulaire envoyé aux collaborateurs')
      setFull((f) => ({ ...f, ...updated }))
      onChanged(updated)
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || "Erreur lors de l'envoi")
    }
  }
  const cloturer = async () => {
    const ok = await confirm({ title: 'Clôturer ce formulaire ?', message: 'Les collaborateurs ne pourront plus y répondre.', confirmLabel: 'Clôturer' })
    if (!ok) return
    try {
      const updated = await cloturerCampagneVoeuxPedagogiques(campagne.id_campagne)
      showToast('Formulaire clôturé')
      setFull((f) => ({ ...f, ...updated }))
      onChanged(updated)
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur')
    }
  }
  const supprimer = async () => {
    const ok = await confirm({ title: 'Supprimer ce brouillon ?', message: full.titre, confirmLabel: 'Supprimer', danger: true })
    if (!ok) return
    try {
      await deleteCampagneVoeuxPedagogiques(campagne.id_campagne)
      showToast('Brouillon supprimé')
      onChanged(null)
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h2>{full.titre}</h2><div className="hint">{full.nb_reponses ?? 0} réponse{(full.nb_reponses ?? 0) > 1 ? 's' : ''}</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isBrouillon && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-dark)' }} onClick={supprimer}>Supprimer</button>}
          {isBrouillon && <button className="btn btn-primary btn-sm" onClick={publier}>Envoyer aux collaborateurs</button>}
          {full.statut === 'publiee' && <button className="btn btn-ghost btn-sm" onClick={cloturer}>Clôturer</button>}
        </div>
      </div>
      <div className="vp-tabs">
        {['builder', 'reponses', 'affectation'].map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t === 'builder' ? 'Questions' : t === 'reponses' ? 'Réponses' : 'Affectation'}
          </button>
        ))}
      </div>
      <div style={{ padding: 20 }}>
        {loading && <div className="hint">Chargement…</div>}
        {!loading && tab === 'builder' && <VoeuxBuilder campagne={full} showToast={showToast} confirm={confirm} onChanged={reload} />}
        {!loading && tab === 'reponses' && <VoeuxReponses campagne={full} showToast={showToast} />}
        {!loading && tab === 'affectation' && <VoeuxAffectation campagne={full} showToast={showToast} />}
      </div>
    </div>
  )
}

/* ---------- Onglet "Questions" : le formulaire-builder ---------- */
/* ---------- Onglet "Questions" : le formulaire-builder ---------- */
function VoeuxBuilder({ campagne, showToast, confirm, onChanged }) {
  const isBrouillon = campagne.statut === 'brouillon'
  const [newType, setNewType] = useState('modules')
  const [newIntitule, setNewIntitule] = useState('')
  const [newOptionsTexte, setNewOptionsTexte] = useState('')
  const needsOptions = newType === 'choix_unique' || newType === 'choix_multiple'

  const ajouterQuestion = async () => {
    if (!newIntitule.trim()) { showToast("L'intitulé de la question est requis"); return }
    const options = toStringArrayFrontend(newOptionsTexte)
    if (needsOptions && options.length === 0) {
      showToast('Ajoutez au moins une réponse possible (séparées par des virgules)')
      return
    }
    try {
      await ajouterQuestionVoeuxPedagogiques(campagne.id_campagne, {
        type: newType,
        intitule: newIntitule.trim(),
        obligatoire: true,
        options: needsOptions ? options : [],
      })
      setNewIntitule('')
      setNewOptionsTexte('')
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || "Erreur lors de l'ajout de la question")
    }
  }

  const supprimerQuestion = async (q) => {
    const ok = await confirm({ title: 'Supprimer cette question ?', message: q.intitule, confirmLabel: 'Supprimer', danger: true })
    if (!ok) return
    try {
      await supprimerQuestionVoeuxPedagogiques(q.id_question)
      onChanged()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la suppression')
    }
  }

  const modifierOptions = async (q, options) => {
    try {
      await modifierQuestionVoeuxPedagogiques(q.id_question, { type: q.type, intitule: q.intitule, obligatoire: q.obligatoire, options })
      onChanged()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la mise à jour des réponses possibles')
    }
  }

  return (
    <div>
      {!isBrouillon && (
        <div className="hint" style={{ marginBottom: 12 }}>
          Ce formulaire a déjà été envoyé — les questions ne sont plus modifiables.
        </div>
      )}
      {isBrouillon && (
        <div className="vp-new-question">
          <div className="vp-new-question-head"><Icon.plus />Nouvelle question</div>
          <div className="vp-field-row">
            <div>
              <label>Type de question</label>
              <select className="select-chip" value={newType} onChange={(e) => setNewType(e.target.value)}>
                {VP_TYPES_QUESTION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label>Intitulé</label>
              <input
                type="text"
                placeholder="ex. Quels modules souhaitez-vous enseigner ?"
                value={newIntitule}
                onChange={(e) => setNewIntitule(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          {needsOptions && (
            <div className="vp-field-row" style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <label>Réponses possibles</label>
                <input
                  type="text"
                  placeholder="Séparées par des virgules (ex. Oui, Non, Peut-être)"
                  value={newOptionsTexte}
                  onChange={(e) => setNewOptionsTexte(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
          {newType === 'modules' && (
            <div className="hint" style={{ marginTop: 10 }}>
              La liste des modules proposés se gère dans le bloc « Modules & classes » ci-dessous.
            </div>
          )}
          <div className="vp-new-question-actions">
            <button className="btn btn-primary btn-sm" onClick={ajouterQuestion}>+ Ajouter la question</button>
          </div>
        </div>
      )}

      {(campagne.questions || []).map((q, i) => {
        const meta = VP_TYPES_QUESTION.find((t) => t.value === q.type)
        const accent = { blue: 'var(--blue)', amber: 'var(--amber)', green: 'var(--green)', muted: 'var(--border)' }[meta?.color || 'muted']
        return (
          <div key={q.id_question} className="vp-question-card" style={{ '--vp-accent': accent }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div className="vp-question-title-row">
                <span className="vp-question-num">{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{q.intitule}</div>
                  <span className={`vp-type-badge vp-type-${meta?.color || 'muted'}`}>{meta?.label}</span>
                </div>
              </div>
              {isBrouillon && (
                <button className="icon-btn sm" title="Supprimer la question" onClick={() => supprimerQuestion(q)}><Icon.trash /></button>
              )}
            </div>
            {(q.type === 'choix_unique' || q.type === 'choix_multiple') && (
              <VoeuxChoixOptionsEditor question={q} isBrouillon={isBrouillon} onSave={(options) => modifierOptions(q, options)} />
            )}
            {q.type === 'modules' && (
              <VoeuxModulesManager
                campagne={campagne}
                question={q}
                isBrouillon={isBrouillon}
                showToast={showToast}
                confirm={confirm}
                onChanged={onChanged}
              />
            )}
          </div>
        )
      })}
      {(campagne.questions || []).length === 0 && (
        <div className="hint">Aucune question pour l'instant — ajoutez-en une ci-dessus.</div>
      )}
    </div>
  )
}

function toStringArrayFrontend(texte) {
  return texte.split(',').map((s) => s.trim()).filter(Boolean)
}

// Réponses possibles d'une question à choix (unique ou multiple) : stockées
// directement sur la question côté serveur, on renvoie la liste complète à
// chaque modification.
function VoeuxChoixOptionsEditor({ question, isBrouillon, onSave }) {
  const [nouvelle, setNouvelle] = useState('')

  const ajouter = () => {
    if (!nouvelle.trim()) return
    onSave([...(question.options || []), nouvelle.trim()])
    setNouvelle('')
  }

  const retirer = (opt) => {
    onSave((question.options || []).filter((o) => o !== opt))
  }

  return (
    <div className="vp-options-editor">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(question.options || []).map((o) => (
          <span key={o} className="vp-option-chip">
            {o}
            {isBrouillon && <button type="button" onClick={() => retirer(o)}>×</button>}
          </span>
        ))}
        {(question.options || []).length === 0 && <span className="hint">Aucune réponse possible pour l'instant</span>}
      </div>
      {isBrouillon && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="text"
            placeholder="Ajouter une réponse possible"
            value={nouvelle}
            onChange={(e) => setNouvelle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouter() } }}
            style={{ flex: 1, minWidth: 180 }}
          />
          <button className="btn btn-ghost btn-sm" onClick={ajouter}>+ Ajouter</button>
        </div>
      )}
    </div>
  )
}

// Liste des modules proposés pour UNE question de type "modules" donnée
// (chaque question de ce type a ses propres modules & classes à affecter).
function VoeuxModulesManager({ campagne, question, isBrouillon, showToast, confirm, onChanged }) {
  const [nom, setNom] = useState('')
  const [niveau, setNiveau] = useState('')
  const [classesTexte, setClassesTexte] = useState('')

  const modulesQuestion = (campagne.modules || []).filter((m) => m.id_question === question.id_question)

  const ajouter = async () => {
    if (!nom.trim()) { showToast('Le nom du module est requis'); return }
    if (!niveau.trim()) { showToast('Le niveau du module est requis'); return }
    const classes = toStringArrayFrontend(classesTexte)
    if (classes.length === 0) { showToast('Ajoutez au moins une classe (séparées par des virgules)'); return }
    try {
      await ajouterModuleVoeuxPedagogiques(campagne.id_campagne, {
        id_question: question.id_question,
        nom: nom.trim(),
        niveau: niveau.trim(),
        classes,
      })
      setNom('')
      setNiveau('')
      setClassesTexte('')
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || "Erreur lors de l'ajout du module")
    }
  }

  const supprimer = async (m) => {
    const ok = await confirm({ title: 'Supprimer ce module ?', message: m.nom, confirmLabel: 'Supprimer', danger: true })
    if (!ok) return
    try {
      await supprimerModuleVoeuxPedagogiques(m.id_module)
      onChanged()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la suppression du module')
    }
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="card-head"><div><h2>Modules &amp; classes</h2><div className="hint">Proposés dans « {question.intitule} »</div></div></div>
      <div style={{ padding: '0 20px 20px' }}>
       {modulesQuestion.map((m) => (
          <div key={m.id_module} className="vp-module-row">
            <div className="vp-module-row-head">
              <b>{m.nom}</b>
              {m.niveau && <span className="badge" style={{ marginLeft: 8 }}>{m.niveau}</span>}
              {isBrouillon && <button className="icon-btn sm" title="Supprimer" onClick={() => supprimer(m)}><Icon.trash /></button>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {(m.classes || []).map((c) => <span key={c} className="vp-option-chip">{c}</span>)}
              {(m.classes || []).length === 0 && <span className="hint">Aucune classe</span>}
            </div>
          </div>
        ))}
        {modulesQuestion.length === 0 && <div className="hint" style={{ padding: '8px 0' }}>Aucun module pour l'instant — ajoutez-en un ci-dessous.</div>}
        {isBrouillon && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Nom du module (ex. Algorithmique 2)"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{ flex: 1, minWidth: 160 }}
            />
            <input
              type="text"
              placeholder="Niveau (ex. 2ème année)"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              style={{ flex: 1, minWidth: 140 }}
            />
            <input
              type="text"
              placeholder="Classes séparées par des virgules (ex. 2A-G1, 2A-G2)"
              value={classesTexte}
              onChange={(e) => setClassesTexte(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <button className="btn btn-ghost btn-sm" onClick={ajouter}>+ Ajouter un module</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Onglet "Réponses" ---------- */
function VoeuxReponses({ campagne, showToast }) {
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    setLoading(true)
    getReponsesCampagneVoeuxPedagogiques(campagne.id_campagne)
      .then((data) => setReponses(data.reponses || []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement des réponses') })
      .finally(() => setLoading(false))
  }, [campagne.id_campagne]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="hint">Chargement…</div>
  if (reponses.length === 0) return <div className="hint">Aucune réponse pour l'instant</div>

  return (
    <>
      <table>
        <thead><tr><th>Collaborateur</th><th>Sous-équipe(s)</th><th>Soumis le</th><th></th></tr></thead>
        <tbody>
          {reponses.map((r) => (
            <tr key={r.id_reponse}>
              <td><div className="name-cell"><div className="avatar sm">{initials(r.collaborateur_nom)}</div><span className="n">{r.collaborateur_nom}</span></div></td>
              <td>{(r.sous_equipes || []).map((s) => s.nom).join(', ') || '—'}</td>
              <td>{r.date_soumission ? new Date(r.date_soumission).toLocaleDateString('fr-FR') : '—'}</td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>Voir les réponses</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {detail && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setDetail(null)} aria-label="Fermer">×</button>
            <div className="modal-title">Réponses de {detail.collaborateur_nom}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {(campagne.questions || []).length === 0 && <div className="hint">Aucune réponse enregistrée</div>}
              {(campagne.questions || []).map((q) => {
                const valeur = detail.reponses_par_question?.[q.id_question]
                const affichage = Array.isArray(valeur) ? valeur.join(', ') : (valeur || '—')
                return (
                  <div key={q.id_question} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600 }}>{q.intitule}</div>
                    <div>{affichage || '—'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- Onglet "Affectation" : module par module, classe par classe ---------- */
function VoeuxAffectation({ campagne, showToast }) {
  const [pool, setPool] = useState([])
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [affecting, setAffecting] = useState(null)
  // Classe choisie dans le menu mais pas encore envoyée — l'admin doit cliquer
  // "Valider" pour confirmer (ou "Annuler" pour revenir en arrière en cas d'erreur
  // de sélection), plutôt que d'affecter immédiatement au changement du <select>.
  const [selections, setSelections] = useState({}) // { [`${id_module}-${id_reponse}`]: classe }

  const reload = () => {
    setLoading(true)
    Promise.all([
      getVueAffectationVoeuxPedagogiques(campagne.id_campagne),
      getReponsesCampagneVoeuxPedagogiques(campagne.id_campagne),
    ])
      .then(([affectation, reponsesData]) => {
        setPool(affectation.pool || [])
        setReponses(reponsesData.reponses || [])
      })
      .catch((err) => { console.error(err); showToast("Erreur lors du chargement de l'affectation") })
      .finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [campagne.id_campagne]) // eslint-disable-line react-hooks/exhaustive-deps

  const cleSelection = (module, candidat) => `${module.id_module}-${candidat.id_reponse}`

  const choisir = (module, candidat, classe) => {
    setSelections((prev) => ({ ...prev, [cleSelection(module, candidat)]: classe }))
  }

  const annulerSelection = (module, candidat) => {
    setSelections((prev) => {
      const next = { ...prev }
      delete next[cleSelection(module, candidat)]
      return next
    })
  }

  const confirmer = async (module, candidat) => {
    const cle = cleSelection(module, candidat)
    const classe = selections[cle]
    if (!classe) return
    setAffecting(cle)
    try {
      await affecterClasseVoeuxPedagogiques({ id_reponse: candidat.id_reponse, id_module: module.id_module, classe })
      showToast(`Classe "${classe}" affectée à ${candidat.collaborateur_nom}`)
      annulerSelection(module, candidat)
      reload()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || "Erreur lors de l'affectation")
    } finally {
      setAffecting(null)
    }
  }

  const retirer = async (idAffectation) => {
    try {
      await supprimerAffectationVoeuxPedagogiques(idAffectation, campagne.id_campagne)
      showToast('Affectation retirée — la classe redevient disponible')
      reload()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors du retrait')
    }
  }

  if (loading) return <div className="hint">Chargement…</div>

  if (pool.length === 0) {
    return <div className="hint">Aucun module défini pour ce formulaire — ajoutez-en dans l'onglet Questions.</div>
  }

  const candidatsPourModule = (module) =>
    reponses.filter((r) => {
      const valeur = r.reponses_par_question?.[module.id_question]
      return Array.isArray(valeur) && valeur.includes(module.nom)
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {pool.map((m) => {
        const candidats = candidatsPourModule(m)
        return (
          <div key={m.id_module} className="vp-question-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div><b>{m.nom}</b>{m.niveau && <span className="badge" style={{ marginLeft: 8 }}>{m.niveau}</span>}</div>
              <span className="hint">{m.classes_disponibles.length} classe{m.classes_disponibles.length > 1 ? 's' : ''} disponible{m.classes_disponibles.length > 1 ? 's' : ''}</span>
            </div>

            {candidats.length === 0 && <div className="hint" style={{ marginTop: 8 }}>Aucun collaborateur n'a choisi ce module</div>}

            {candidats.map((cand) => {
              const affectationsCand = m.classes_affectees.filter((a) => a.id_reponse === cand.id_reponse)
              const cle = cleSelection(m, cand)
              const selection = selections[cle]
              return (
                <div key={cand.id_reponse} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <div className="name-cell" style={{ minWidth: 160 }}><div className="avatar sm">{initials(cand.collaborateur_nom)}</div><span className="n">{cand.collaborateur_nom}</span></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {affectationsCand.map((a) => (
                      <span key={a.id_affectation} className="badge validee" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {a.classe}
                        <button type="button" onClick={() => retirer(a.id_affectation)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>×</button>
                      </span>
                    ))}
                  </div>
                  {selection ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge attente">{selection} · en attente</span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={affecting === cle}
                        onClick={() => confirmer(m, cand)}
                      >
                        {affecting === cle ? 'Envoi…' : 'Valider'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={affecting === cle}
                        onClick={() => annulerSelection(m, cand)}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    m.classes_disponibles.length > 0 && (
                      <select
                        className="select-chip"
                        style={{ border: '1px solid var(--border)' }}
                        value=""
                        onChange={(e) => { if (e.target.value) choisir(m, cand, e.target.value) }}
                      >
                        <option value="">+ Affecter une classe…</option>
                        {m.classes_disponibles.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/* ================= ÉVALUATION ================= */
// Mêmes garde-fous que côté backend (voir PLAFOND_NOTE_MANUELLE / JUSTIFICATION_MIN_LENGTH
// dans evaluationScore.model.js) — dupliqués ici uniquement pour l'affichage (placeholder,
// max de l'input, longueur du hint) ; la validation qui fait foi reste côté serveur.
const PLAFOND_NOTE_MANUELLE = 15
const JUSTIFICATION_MIN_LENGTH = 20

function Evaluation({ teams, horsUpTeams, showToast, filtreAnnee, filtreSemestre }) {
  const [criteria, setCriteria] = useState([])
  const [total, setTotal] = useState(0)
  const [teamId, setTeamId] = useState(null)
  const [teamType, setTeamType] = useState('up') // 'up' | 'hors_up'
  const [scores, setScores] = useState([])
  const [calculating, setCalculating] = useState(false)
  const [expandedScore, setExpandedScore] = useState(null)
  const [noteEdits, setNoteEdits] = useState({}) // { [id_collaborateur]: { [id_critere]: note } }
  const [justificationEdits, setJustificationEdits] = useState({}) // { [id_collaborateur]: { [id_critere]: texte } }
  const [membres, setMembres] = useState([]) // [{ id_collaborateur, nom }] pour l'équipe courante
  const [notingCritereId, setNotingCritereId] = useState(null) // critère personnalisé actuellement déplié pour notation
  const [sliderDraft, setSliderDraft] = useState({}) // { [id_critere]: valeur affichée pendant le drag, avant envoi au serveur }

  const allTeams = [
    ...teams.map((t) => ({ ...t, type: 'up' })),
    ...(horsUpTeams || []).map((t) => ({ ...t, type: 'hors_up' })),
  ]

  const loadCriteres = useCallback(() => {
    getCriteres()
      .then((data) => { setCriteria(data.criteres || []); setTotal(data.total || 0) })
      .catch((err) => console.error(err))
  }, [])

  useEffect(() => { loadCriteres() }, [loadCriteres])

  useEffect(() => {
    if (!teamId && allTeams.length > 0) {
      setTeamId(allTeams[0].id)
      setTeamType(allTeams[0].type)
    }
  }, [allTeams, teamId])

  const selectTeam = (value) => {
    const [type, id] = value.split(':')
    setTeamType(type)
    setTeamId(Number(id))
  }

  const loadGrille = useCallback(() => {
    if (!teamId) return
    getGrilleNotes(teamId, teamType)
      .then((data) => {
        setMembres(data.grille || [])
        const customIds = new Set((data.criteres || []).filter((c) => !c.code).map((c) => c.id_critere))
        const edits = {}
        const justifs = {}
        ;(data.grille || []).forEach((m) => {
          const custom = {}
          const customJustifs = {}
          Object.entries(m.notes || {}).forEach(([idCritere, value]) => {
            if (customIds.has(Number(idCritere)) && value !== null && value !== undefined) {
              custom[idCritere] = value
            }
          })
          Object.entries(m.justifications || {}).forEach(([idCritere, texte]) => {
            if (customIds.has(Number(idCritere))) customJustifs[idCritere] = texte
          })
          edits[m.id_collaborateur] = custom
          justifs[m.id_collaborateur] = customJustifs
        })
        setNoteEdits(edits)
        setJustificationEdits(justifs)
      })
      .catch((err) => console.error(err))
  }, [teamId, teamType])

  useEffect(() => {
    if (!teamId) return
    getScores({ sous_equipe: teamId, type: teamType, annee: filtreAnnee, semestre: filtreSemestre })
      .then(setScores)
      .catch((err) => console.error(err))
    loadGrille()
  }, [teamId, teamType, filtreAnnee, filtreSemestre, loadGrille])

  const labelSemestre = (s) => (s === 'S1' ? 'Semestre 1' : s === 'S2' ? 'Semestre 2' : s)

  const setValue = async (critere, value) => {
    const v = Math.max(0, Math.min(100, Number(value) || 0))
    try {
      await updateCritere(critere.id_critere, { ponderation: v })
      loadCriteres()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la mise à jour du critère')
    }
  }

  // Ne sauvegarde qu'une fois le glissement terminé (mouseup/touchend/keyup),
  // au lieu d'envoyer une requête à chaque valeur intermédiaire du drag.
  const commitSlider = (critere, value) => {
    setValue(critere, value)
    setSliderDraft((prev) => {
      const next = { ...prev }
      delete next[critere.id_critere]
      return next
    })
  }

  const renameCritere = async (critere, label) => {
    if (!label.trim() || label === critere.nom) return
    try {
      await updateCritere(critere.id_critere, { nom: label.trim() })
      loadCriteres()
    } catch (err) {
      console.error(err)
    }
  }

  const ajouterCritere = async () => {
    try {
      await createCritere({ nom: 'Nouveau critère', ponderation: 0 })
      loadCriteres()
      loadGrille()
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'ajout du critère")
    }
  }

  const supprimerCritere = async (critere) => {
    try {
      await deleteCritere(critere.id_critere)
      loadCriteres()
      loadGrille()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la suppression du critère')
    }
  }

  const updateNote = (idCollaborateur, idCritere, value) => {
    setNoteEdits((prev) => ({
      ...prev,
      [idCollaborateur]: { ...prev[idCollaborateur], [idCritere]: value },
    }))
  }

  const updateJustification = (idCollaborateur, idCritere, value) => {
    setJustificationEdits((prev) => ({
      ...prev,
      [idCollaborateur]: { ...prev[idCollaborateur], [idCritere]: value },
    }))
  }

  const appliquer = async () => {
    if (total !== 100) { showToast(`Le total des pondérations doit être égal à 100% (actuellement ${total}%)`); return }
    setCalculating(true)
    try {
      // Notation manuelle retirée : "Appliquer" recalcule le score de TOUTE
      // équipe (UP et hors UP), pour tous les collaborateurs du système, en une
      // fois. Le filtre au-dessus ne sert plus qu'à choisir quelle équipe
      // afficher ensuite dans "Scores calculés".
      await calculerScoresPourTous(filtreAnnee, filtreSemestre)
      showToast('Formule appliquée — scores recalculés pour tous les collaborateurs')
      if (teamId) {
        const data = await getScores({ sous_equipe: teamId, type: teamType, annee: filtreAnnee, semestre: filtreSemestre })
        setScores(data)
      }
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors du calcul des scores')
    } finally {
      setCalculating(false)
    }
  }

  const teamSelectValue = `${teamType}:${teamId || ''}`

  return (
    <>
      <div className="page-head">
        <h2>Mode d'évaluation</h2>
        <p>Définissez les critères d'évaluation et leur pondération : le score final de chaque collaborateur est calculé automatiquement à partir des tâches réalisées et validées (y compris le nombre de tâches prises en charge), par équipe. Le score se met à jour tout seul dès qu'une tâche change — plus besoin de cliquer sur un bouton pour que ça reste à jour.</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>Critères & pondération</h2><div className="hint">Faites glisser le curseur, le total se recalcule automatiquement</div></div>
            <button className="btn btn-ghost btn-sm" onClick={ajouterCritere}>+ Ajouter un critère</button>
          </div>
          <div>
            {criteria.map((c) => (
              <div className="criteria-row slider-row" key={c.id_critere}>
                <div className="top">
                  <b contentEditable suppressContentEditableWarning onBlur={(e) => renameCritere(c, e.target.textContent)}>{c.nom}</b>
                  <span>
                    <input className="pond-input" type="number" min="0" max="100" value={c.ponderation} onChange={(e) => setValue(c, e.target.value)} />%
                    {!c.code && (
                      <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }} onClick={() => supprimerCritere(c)}>✕</button>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderDraft[c.id_critere] ?? c.ponderation}
                  onChange={(e) => setSliderDraft((prev) => ({ ...prev, [c.id_critere]: e.target.value }))}
                  onMouseUp={(e) => commitSlider(c, e.target.value)}
                  onTouchEnd={(e) => commitSlider(c, e.target.value)}
                  onKeyUp={(e) => commitSlider(c, e.target.value)}
                />
                {!c.code && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--amber)' }}>
                      Critère personnalisé — sans données connectées, il compte pour 0 tant qu'il n'est pas relié à une source objective.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="pond-total">Total pondéré <span className={total === 100 ? 'ok' : 'bad'}>{total}%</span></div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div>
              <h2>Scores calculés</h2>
              <div className="hint">{labelSemestre(filtreSemestre)} · {filtreAnnee} — filtre d'affichage uniquement</div>
            </div>
            <select
              value={teamSelectValue}
              onChange={(e) => selectTeam(e.target.value)}
              style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700, padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border)', background: '#fff' }}
            >
              <optgroup label="Sous-équipes (UP)">
                {teams.map((t) => <option key={`up-${t.id}`} value={`up:${t.id}`}>{t.nom}</option>)}
              </optgroup>
              <optgroup label="Équipes hors UP">
                {(horsUpTeams || []).map((t) => <option key={`hu-${t.id}`} value={`hors_up:${t.id}`}>{t.nom}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            {scores.map((s, idx) => {
              const expanded = expandedScore === s.id_collaborateur
              const detailEntries = s.detail_json ? Object.entries(s.detail_json) : []
              const scoreValue = s.score !== null && s.score !== undefined ? s.score : 0
              return (
                <div key={s.id_collaborateur}>
                  <div
                    className="rank-row"
                    style={{ cursor: detailEntries.length > 0 ? 'pointer' : 'default' }}
                    onClick={() => detailEntries.length > 0 && setExpandedScore(expanded ? null : s.id_collaborateur)}
                  >
                    <span className="rk">{idx + 1}</span>
                    <div className="avatar sm">{initials(s.collaborateur_nom)}</div>
                    <div className="body" style={{ flex: 1 }}><div className="title">{s.collaborateur_nom}</div></div>
                    <span className="score">{scoreValue}/20</span>
                  </div>
                  {expanded && (
                    <div style={{ padding: '4px 20px 14px 62px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detailEntries.map(([key, d]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                          <span style={{ width: 130, color: 'var(--text-muted)' }}>{d.nom}</span>
                          <div className="progress-track" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${Math.round(d.ratio * 100)}%` }} />
                          </div>
                          <span style={{ width: 110, textAlign: 'right', color: 'var(--text-faint)' }}>
                            {d.note}/20 × {d.ponderation}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {scores.length === 0 && (
              <div className="rank-row"><div className="body"><div className="desc">Aucun score calculé pour cette équipe</div></div></div>
            )}
          </div>
          <div style={{ padding: '0 20px 18px' }}>
            <div className="hint" style={{ marginBottom: 8, textAlign: 'center' }}>

            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={calculating}
              onClick={appliquer}
            >
              {calculating ? 'Recalcul en cours pour tous les collaborateurs…' : 'Recalculer maintenant pour tous les collaborateurs'}
            </button>
          </div>
        </div>
      </div>


    </>
  )
}

/* ================= RAPPORTS ================= */
function Rapports({ teams, users, showToast, filtreAnnee, filtreSemestre }) {
  const [rapports, setRapports] = useState([])
  const [stats, setStats] = useState([])
  const [historique, setHistorique] = useState([])
  const [format, setFormat] = useState('pdf')
  const [sousEquipeId, setSousEquipeId] = useState('')
  const [collaborateurId, setCollaborateurId] = useState('')
  const [annee, setAnnee] = useState(filtreAnnee || '2025/2026')
  const [portee, setPortee] = useState(filtreSemestre || 'S1') // 'S1' | 'S2' | 'annuel'
  const [generating, setGenerating] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  // Le filtre Année/Semestre de la barre du haut reste la référence : s'il change
  // pendant que cette page est ouverte, on suit (l'admin peut ensuite l'ajuster
  // localement, ex. "Année complète", sans toucher au filtre global).
  useEffect(() => { setAnnee(filtreAnnee) }, [filtreAnnee])
  useEffect(() => { setPortee(filtreSemestre) }, [filtreSemestre])

  const collaborateurs = (users || []).filter((u) => u.role === 'collaborateur')

  const load = useCallback(() => {
    getRapports(annee, portee === 'annuel' ? undefined : portee).then(setRapports).catch((err) => console.error(err))
    getStatsImplication(annee, portee === 'annuel' ? undefined : portee).then(setStats).catch((err) => console.error(err))
    getScores().then(setHistorique).catch((err) => console.error(err))
  }, [annee, portee])

  useEffect(() => { load() }, [load])

  const generer = async () => {
    setGenerating(true)
    try {
      const team = teams.find((t) => t.id === Number(sousEquipeId))
      const collaborateur = collaborateurs.find((c) => c.id === Number(collaborateurId))
      const titreParts = []
      if (team) titreParts.push(team.nom)
      if (collaborateur) titreParts.push(collaborateur.nom)
      const periodeLabel = portee === 'annuel' ? `Année complète ${annee}` : `${portee === 'S1' ? 'Semestre 1' : 'Semestre 2'} ${annee}`
      await createRapport({
        titre: titreParts.length ? `Rapport — ${titreParts.join(' · ')} — ${periodeLabel}` : `Rapport global — ${periodeLabel}`,
        description: collaborateur
          ? `Synthèse pour ${collaborateur.nom}${team ? ` (${team.nom})` : ''}`
          : team ? `Synthèse pour ${team.nom}` : 'Toutes sous-équipes',
        format,
        id_sous_equipe: sousEquipeId || null,
        id_collaborateur: collaborateurId || null,
        annee_universitaire: annee,
        semestre: portee,
      })
      showToast('Rapport généré ✓')
      load()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la génération du rapport')
    } finally {
      setGenerating(false)
    }
  }

  const telecharger = async (r) => {
    if (!r.chemin_fichier) { showToast('Fichier pas encore généré côté serveur'); return }
    setDownloadingId(r.id_rapport)
    try {
      const res = await telechargerRapportFichier(r.id_rapport)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${r.titre}.${r.format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      showToast('Erreur lors du téléchargement')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Rapports</h2>
        <p>Générez des rapports annuels ou semestriels par sous-équipe ou par collaborateur, au format PDF ou Excel.</p>
      </div>
      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Générer un rapport</h2></div></div>
            <div className="form-grid">
              <div className="field">
                <label>Sous-équipe</label>
                <select value={sousEquipeId} onChange={(e) => setSousEquipeId(e.target.value)}>
                  <option value="">Toutes les sous-équipes</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Collaborateur</label>
                <select value={collaborateurId} onChange={(e) => setCollaborateurId(e.target.value)}>
                  <option value="">Tous les collaborateurs</option>
                  {collaborateurs.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
              <div className="field">
                <label>Année universitaire</label>
                <select value={annee} onChange={(e) => setAnnee(e.target.value)}>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                </select>
              </div>
              <div className="field">
                <label>Portée</label>
                <select value={portee} onChange={(e) => setPortee(e.target.value)}>
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                  <option value="annuel">Année complète</option>
                </select>
              </div>
              <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" disabled={generating} onClick={generer}>{generating ? 'Génération…' : 'Générer le rapport'}</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Rapports récents</h2></div></div>
            <div>
              {rapports.map((r) => (
                <div className="report-row" key={r.id_rapport}>
                  <div className="rico"><Icon.reports /></div>
                  <div className="body">
                    <div className="title">{r.titre}</div>
                    <div className="desc">
                      {r.sous_equipe_nom || 'Toutes sous-équipes'}
                      {r.collaborateur_nom ? ` · ${r.collaborateur_nom}` : ''} · {r.format.toUpperCase()} · généré le {new Date(r.date_generation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" disabled={downloadingId === r.id_rapport} onClick={() => telecharger(r)}>
                    {downloadingId === r.id_rapport ? '…' : 'Télécharger'}
                  </button>
                </div>
              ))}
              {rapports.length === 0 && <div className="report-row"><div className="body"><div className="desc">Aucun rapport généré pour l'instant</div></div></div>}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div><h2>Statistiques d'implication</h2><div className="hint">{portee === 'annuel' ? 'Année complète' : (portee === 'S1' ? 'Semestre 1' : 'Semestre 2')} · {annee}</div></div></div>
        <table>
          <thead><tr><th>Collaborateur</th><th>Tâches validées</th><th>Tâches totales</th><th>Taux d'implication</th></tr></thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.id_collaborateur}>
                <td><div className="name-cell"><div className="avatar sm">{initials(s.nom)}</div><span className="n">{s.nom}</span></div></td>
                <td>{s.taches_validees}</td><td>{s.taches_total}</td>
                <td><div className="progress-row"><div className="progress-track"><div className={`progress-fill${s.taux_implication >= 80 ? ' green' : ''}`} style={{ width: `${s.taux_implication}%` }} /></div><span>{s.taux_implication}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-head"><div><h2>Historique des évaluations</h2><div className="hint">Scores calculés, semestre par semestre et par sous-équipe</div></div></div>
        <table>
          <thead><tr><th>Collaborateur</th><th>Sous-équipe</th><th>Période</th><th>Score</th><th>Calculé le</th></tr></thead>
          <tbody>
            {historique.map((h) => (
              <tr key={h.id_score}>
                <td><div className="name-cell"><div className="avatar sm">{initials(h.collaborateur_nom)}</div><span className="n">{h.collaborateur_nom}</span></div></td>
                <td>{h.sous_equipe_nom}</td>
                <td>{h.semestre} · {h.annee_universitaire}</td>
                <td><b>{h.score}/20</b></td>
                <td style={{ color: 'var(--text-faint)' }}>{new Date(h.date_calcul).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
            {historique.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucun score calculé pour le moment — voir la page Évaluation</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ================= SAUVEGARDES ================= */
function formatOctets(n) {
  if (!n) return '—'
  const units = ['o', 'Ko', 'Mo', 'Go']
  let val = n, i = 0
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function Sauvegardes({ showToast, confirm }) {
  const [sauvegardes, setSauvegardes] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [verifyingId, setVerifyingId] = useState(null)
  const [verifyResults, setVerifyResults] = useState({}) // { [id]: { intact, checksum_actuel } }
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getSauvegardes()
      .then(setSauvegardes)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const sauvegarderMaintenant = async () => {
    setCreating(true)
    try {
      await creerSauvegarde()
      showToast('Sauvegarde créée ✓')
      load()
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.message
      showToast(msg ? `Échec de la sauvegarde — ${msg}` : 'Échec de la sauvegarde')
      load() // même en échec, la tentative est enregistrée (statut "echec")
    } finally {
      setCreating(false)
    }
  }

  const verifier = async (s) => {
    setVerifyingId(s.id_sauvegarde)
    try {
      const res = await verifierSauvegarde(s.id_sauvegarde)
      setVerifyResults((prev) => ({ ...prev, [s.id_sauvegarde]: res }))
      showToast(res.intact ? 'Intégrité vérifiée — fichier intact ✓' : 'Attention — le fichier a changé depuis sa création')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de la vérification d'intégrité")
    } finally {
      setVerifyingId(null)
    }
  }

  const telecharger = async (s) => {
    setDownloadingId(s.id_sauvegarde)
    try {
      const res = await telechargerSauvegardeFichier(s.id_sauvegarde)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = s.nom_fichier
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      showToast('Erreur lors du téléchargement')
    } finally {
      setDownloadingId(null)
    }
  }

  const supprimer = async (s) => {
    const ok = await confirm({
      title: 'Supprimer cette sauvegarde ?',
      message: `Supprimer la sauvegarde « ${s.nom_fichier} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    setDeletingId(s.id_sauvegarde)
    try {
      await deleteSauvegarde(s.id_sauvegarde)
      showToast('Sauvegarde supprimée')
      load()
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Sauvegardes</h2>
        <p>
          Sauvegarde complète de la base de données (structure + données), avec contrôle d'intégrité par empreinte SHA-256.
          Une sauvegarde automatique est planifiée chaque nuit à 2h si l'option correspondante est activée dans Paramètres.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div><h2>Sauvegarde manuelle</h2><div className="hint">Génère un dump SQL immédiat de la base esprittech</div></div>
          <button className="btn btn-primary btn-sm" disabled={creating} onClick={sauvegarderMaintenant}>
            {creating ? 'Sauvegarde en cours…' : 'Sauvegarder maintenant'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h2>Historique des sauvegardes</h2></div></div>
        <table>
          <thead>
            <tr>
              <th>Fichier</th><th>Type</th><th>Taille</th><th>Statut</th><th>Créée le</th><th>Intégrité</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sauvegardes.map((s) => {
              const verif = verifyResults[s.id_sauvegarde]
              return (
                <tr key={s.id_sauvegarde}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{s.nom_fichier}</td>
                  <td>{s.type === 'automatique' ? 'Automatique' : 'Manuelle'}</td>
                  <td>{formatOctets(s.taille_octets)}</td>
                  <td>
                    <span className={`badge ${s.statut === 'ok' ? 'validee' : 'refaire'}`}>
                      {s.statut === 'ok' ? 'OK' : 'Échec'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-faint)' }}>{new Date(s.date_creation).toLocaleString('fr-FR')}</td>
                  <td>
                    {verif ? (
                      <span className={`statut-pill ${verif.intact ? 'green' : 'red'}`}>
                        {verif.intact ? 'Intact' : 'Altéré'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-faint)', fontSize: 11.5 }}>Non vérifiée</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {s.statut === 'ok' && (
                        <>
                          <button className="btn btn-ghost btn-sm" disabled={verifyingId === s.id_sauvegarde} onClick={() => verifier(s)}>
                            {verifyingId === s.id_sauvegarde ? '…' : 'Vérifier'}
                          </button>
                          <button className="btn btn-ghost btn-sm" disabled={downloadingId === s.id_sauvegarde} onClick={() => telecharger(s)}>
                            {downloadingId === s.id_sauvegarde ? '…' : 'Télécharger'}
                          </button>
                        </>
                      )}
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-dark)' }} disabled={deletingId === s.id_sauvegarde} onClick={() => supprimer(s)}>
                        {deletingId === s.id_sauvegarde ? '…' : 'Suppr.'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && sauvegardes.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucune sauvegarde pour l'instant</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ================= MON PROFIL (admin) ================= */
function MonProfilAdmin({ user, updateUser, showToast, dark, onToggleDark, params, onChangedParams, onAnneeAjoutee }) {
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(null)
  const [nouvelleAnnee, setNouvelleAnnee] = useState('')
  const [ajoutingAnnee, setAjoutingAnnee] = useState(false)
  const [limiteTaches, setLimiteTaches] = useState('')
  const [savingLimite, setSavingLimite] = useState(false)

  useEffect(() => {
    if (params?.limite_taches_collaborateur !== undefined) {
      setLimiteTaches(String(params.limite_taches_collaborateur))
    }
  }, [params?.limite_taches_collaborateur])

  const enregistrerLimiteTaches = async () => {
    const valeur = Number(limiteTaches)
    if (!Number.isInteger(valeur) || valeur < 1) {
      showToast?.('La limite doit être un nombre entier positif')
      return
    }
    setSavingLimite(true)
    try {
      await updateParametres({ limite_taches_collaborateur: valeur })
      onChangedParams?.()
      showToast?.('Limite de tâches actives mise à jour ✓')
    } catch (err) {
      console.error(err)
      showToast?.(err?.response?.data?.message || 'Erreur lors de la mise à jour de la limite')
    } finally {
      setSavingLimite(false)
    }
  }

  const ajouterAnnee = async () => {
    const annee = nouvelleAnnee.trim()
    if (!/^\d{4}\/\d{4}$/.test(annee)) { showToast?.('Format attendu : AAAA/AAAA (ex. 2027/2028)'); return }
    setAjoutingAnnee(true)
    try {
      await ajouterAnneeSysteme(annee)
      onChangedParams?.()
      onAnneeAjoutee?.(annee)
      setNouvelleAnnee('')
      showToast?.(`Année ${annee} ajoutée au filtre`)
    } catch (err) {
      console.error(err)
      showToast?.(err?.response?.data?.message || "Erreur lors de l'ajout de l'année")
    } finally {
      setAjoutingAnnee(false)
    }
  }

  const name = profil?.nom || user?.nom || 'Admin'
  const email = profil?.email || user?.email

  useEffect(() => {
    getMonProfil()
      .then(setProfil)
      .catch((err) => {
        console.error('Erreur chargement du profil:', err)
        showToast?.('Erreur lors du chargement de votre profil')
      })
      .finally(() => setLoading(false))
  }, [showToast])

  const togglePref = async (key) => {
    if (!profil) return
    const nextValue = !profil[key]
    setProfil((p) => ({ ...p, [key]: nextValue }))
    setSavingPref(key)
    try {
      const updated = await updateMesPreferences({ [key]: nextValue })
      setProfil((p) => ({ ...p, ...updated }))
    } catch (err) {
      console.error(err)
      setProfil((p) => ({ ...p, [key]: !nextValue }))
      showToast?.('Erreur lors de la mise à jour de vos préférences')
    } finally {
      setSavingPref(null)
    }
  }

  /* ---------- Édition identité (nom / email) ---------- */
  const [editingIdentite, setEditingIdentite] = useState(false)
  const [nomInput, setNomInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [savingIdentite, setSavingIdentite] = useState(false)

  const ouvrirEditionIdentite = () => {
    setNomInput(name)
    setEmailInput(email || '')
    setEditingIdentite(true)
  }
  const annulerEditionIdentite = () => setEditingIdentite(false)

  const enregistrerIdentite = async () => {
    const nom = nomInput.trim()
    const emailPropre = emailInput.trim()
    if (!nom || !emailPropre) { showToast?.('Le nom et l\'email sont requis'); return }
    setSavingIdentite(true)
    try {
      const updated = await updateMonProfilIdentite({ nom, email: emailPropre })
      setProfil((p) => ({ ...p, ...updated }))
      updateUser?.({ nom: updated.nom, email: updated.email })
      setEditingIdentite(false)
      showToast?.('Profil mis à jour ✓')
    } catch (err) {
      console.error(err)
      showToast?.(err?.response?.data?.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setSavingIdentite(false)
    }
  }

  /* ---------- Changement de mot de passe ---------- */
  const [editingPassword, setEditingPassword] = useState(false)
  const [pwActuel, setPwActuel] = useState('')
  const [pwNouveau, setPwNouveau] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const annulerEditionPassword = () => {
    setEditingPassword(false)
    setPwActuel(''); setPwNouveau(''); setPwConfirm('')
  }

  const enregistrerPassword = async () => {
    if (!pwActuel || !pwNouveau) { showToast?.('Merci de remplir tous les champs'); return }
    if (!isPasswordStrong(pwNouveau)) { showToast?.(PASSWORD_RULES_MESSAGE); return }
    if (pwNouveau !== pwConfirm) { showToast?.('La confirmation ne correspond pas au nouveau mot de passe'); return }
    setSavingPassword(true)
    try {
      await changerMonMotDePasse({ mot_de_passe_actuel: pwActuel, nouveau_mot_de_passe: pwNouveau })
      showToast?.('Mot de passe mis à jour ✓')
      annulerEditionPassword()
    } catch (err) {
      console.error(err)
      showToast?.(err?.response?.data?.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Paramètres</h2>
        <p>Vos informations de compte, votre sécurité et les réglages système de l'application.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Période du système</h2>
            <div className="hint">
              Période active actuelle : <b>{params?.annee_universitaire}</b> · {params?.semestre_actif === 'S1' ? 'Semestre 1' : 'Semestre 2'}
            </div>
          </div>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <p className="hint" style={{ marginBottom: 10 }}>
            Ajoutez une nouvelle année universitaire au filtre en haut de l'écran.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Nouvelle année (ex. 2027/2028)"
              value={nouvelleAnnee}
              onChange={(e) => setNouvelleAnnee(e.target.value)}
              style={{ maxWidth: 240 }}
            />
            <button className="btn btn-primary btn-sm" disabled={ajoutingAnnee} onClick={ajouterAnnee}>
              {ajoutingAnnee ? 'Ajout…' : '+ Ajouter cette année au filtre'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Automatisation</h2>
            <div className="hint">Nombre maximum de tâches "à faire" / "en cours" qu'un collaborateur peut cumuler en se servant dans le pool commun de son équipe.</div>
          </div>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              placeholder="Ex. 3"
              value={limiteTaches}
              onChange={(e) => setLimiteTaches(e.target.value)}
              style={{ maxWidth: 120 }}
            />
            <button className="btn btn-primary btn-sm" disabled={savingLimite} onClick={enregistrerLimiteTaches}>
              {savingLimite ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="profile-hero">
          <div className="avatar">{initials(name)}</div>
          <div style={{ flex: 1 }}>
            <div className="pname">{name}</div>
            <div className="prole">Super Admin{email ? ` · ${email}` : ''}</div>
          </div>
          {!editingIdentite && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={ouvrirEditionIdentite}>Modifier</button>
          )}
        </div>

        {editingIdentite ? (
          <div className="form-grid">
            <div className="field">
              <label>Nom complet</label>
              <input type="text" value={nomInput} onChange={(e) => setNomInput(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            </div>
            <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" type="button" disabled={savingIdentite} onClick={annulerEditionIdentite}>Annuler</button>
              <button className="btn btn-primary" type="button" disabled={savingIdentite} onClick={enregistrerIdentite}>
                {savingIdentite ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          email && <div className="info-row"><span className="k">Email</span><span className="v">{email}</span></div>
        )}
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head">
              <div><h2>Mot de passe</h2><div className="hint">Modifiez votre mot de passe de connexion</div></div>
              {!editingPassword && (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditingPassword(true)}>Modifier</button>
              )}
            </div>
            {editingPassword && (
              <div className="form-grid">
                <div className="field full">
                  <label>Mot de passe actuel</label>
                  <input type="password" value={pwActuel} onChange={(e) => setPwActuel(e.target.value)} autoFocus />
                </div>
                <div className="field full">
                  <label>Nouveau mot de passe</label>
                  <input type="password" value={pwNouveau} onChange={(e) => setPwNouveau(e.target.value)} />
                  {pwNouveau && (
                    <ul className="password-checklist">
                      {getPasswordChecklist(pwNouveau).map((rule) => (
                        <li key={rule.key} className={rule.ok ? 'ok' : ''}>
                          <span className="dot">{rule.ok ? '✓' : '•'}</span>{rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="field full">
                  <label>Confirmer le nouveau mot de passe</label>
                  <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingPassword} onClick={annulerEditionPassword}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingPassword} onClick={enregistrerPassword}>
                    {savingPassword ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Préférences du compte</h2></div></div>
            <div className="toggle-row">
              <div><div className="t">Mode sombre</div><div className="d">S'applique à tout l'espace admin (tableau de bord, sous-équipes, rapports…) et reste actif à la reconnexion</div></div>
              <label className="switch">
                <input type="checkbox" checked={!!dark} onChange={onToggleDark} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}