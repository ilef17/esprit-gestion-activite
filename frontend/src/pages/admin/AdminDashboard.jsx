import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import EspritLogo from '../../components/EspritLogo.jsx'
import StatsDashboard from '../../components/dashboard/StatsDashboard.jsx'
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
  envoyerVerificationDemande,
  validerDemande,
  refuserDemande,
  getCriteres,
  createCritere,
  updateCritere,
  deleteCritere,
  getScores,
  getGrilleNotes,
  calculerScores,
  getRapports,
  createRapport,
  telechargerRapportFichier,
  getStatsImplication,
  getParametres,
  updateParametres,
  getSauvegardes,
  creerSauvegarde,
  verifierSauvegarde,
  telechargerSauvegardeFichier,
  deleteSauvegarde,
  createTache,
  getProfesseurs,
  getProfesseurDetail,
  addExpertiseAdmin,
  deleteExpertise,
  getCampagnesVoeuxPedagogiques,
  createCampagneVoeuxPedagogiques,
  updateCampagneVoeuxPedagogiques,
  publierCampagneVoeuxPedagogiques,
  cloturerCampagneVoeuxPedagogiques,
  deleteCampagneVoeuxPedagogiques,
  getReponsesCampagneVoeuxPedagogiques,
  ajouterAffectationVoeuxPedagogiques,
  supprimerAffectationVoeuxPedagogiques,
  getMonProfil,
  updateMesPreferences,
  updateMonProfilIdentite,
  changerMonMotDePasse,
} from '../../services/api.js'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
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
    { page: 'demandes', label: 'Demandes hors-équipe', icon: 'requests', badgeKey: 'demandes' },
    { page: 'evaluation', label: 'Évaluation', icon: 'eval' },
    { page: 'rapports', label: 'Rapports', icon: 'reports' },
    { page: 'activite-ecole', label: 'Activité école', icon: 'academic' },
    { page: 'voeux-pedagogiques', label: 'Vœux pédagogiques', icon: 'poll' },
  ]},
  { label: 'Système', items: [
    { page: 'parametres', label: 'Mon profil', icon: 'profile' },
  ]},
]

const PAGE_TITLES = {
  dashboard:    { crumb: 'Intranet · Pilotage', title: 'Tableau de bord global' },
  utilisateurs: { crumb: 'Intranet · Pilotage', title: 'Collaborateurs' },
  'sous-equipes': { crumb: 'Intranet · Pilotage', title: 'Sous-équipes' },
  demandes:     { crumb: 'Intranet · Activités', title: 'Demandes hors-équipe' },
  evaluation:   { crumb: 'Intranet · Activités', title: 'Évaluation' },
  rapports:     { crumb: 'Intranet · Activités', title: 'Rapports' },
  'activite-ecole': { crumb: 'Intranet · Activités', title: 'Activité école' },
  'voeux-pedagogiques': { crumb: 'Intranet · Activités', title: 'Vœux pédagogiques' },
  sauvegardes:  { crumb: 'Intranet · Système', title: 'Sauvegardes' },
  parametres:   { crumb: 'Intranet · Système', title: 'Mon profil' },
}

function initials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function statutBadge(statut) {
  const map = {
    attente: { label: 'En attente', cls: 'amber' },
    envoye: { label: 'Vérification envoyée', cls: 'blue' },
    validee: { label: 'Validée', cls: 'green' },
    refusee: { label: 'Refusée', cls: 'red' },
  }
  return map[statut] || { label: statut, cls: 'gray' }
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

  // Filtres Année / Semestre du tableau de bord — purement côté client (ne modifient
  // plus aucun réglage serveur, contrairement à l'ancienne "période active").
  const defautPeriode = useMemo(periodeParDefaut, [])
  const [filtreAnnee, setFiltreAnnee] = useState(defautPeriode.annee)
  const [filtreSemestre, setFiltreSemestre] = useState(defautPeriode.semestre)

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

  const refreshParams = useCallback(() => (
    getParametres().then(setParams).catch((err) => console.error('Erreur chargement paramètres:', err))
  ), [])

  useEffect(() => {
    refreshSousEquipes()
    refreshEquipesHorsUp()
    refreshUsers()
    refreshAllUsers()
    refreshDemandes()
    refreshParams()
  }, [refreshSousEquipes, refreshEquipesHorsUp, refreshUsers, refreshAllUsers, refreshDemandes, refreshParams])

  const nav = PAGE_TITLES[activePage]
  const adminName = user?.nom || 'Admin'
  const demandesEnAttente = demandes.filter((d) => d.statut !== 'validee' && d.statut !== 'refusee')
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
              <select
                className="select-chip"
                value={filtreAnnee}
                onChange={(e) => setFiltreAnnee(e.target.value)}
                title="Filtrer le tableau de bord par année universitaire"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                <option value="2025/2026">2025 / 2026</option>
                <option value="2024/2025">2024 / 2025</option>
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
                      <div className="notif-head">Demandes hors-équipe en attente</div>
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
                            <div className="desc">{d.description}</div>
                          </div>
                        </div>
                      ))}
                      {demandesEnAttente.length > 0 && (
                        <div className="notif-footer" onClick={() => { setNotifOpen(false); goTo('demandes') }}>Voir toutes les demandes</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="avatar sm">{initials(adminName)}</div>
            </div>
          </div>

          <div className="content">
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
                onChanged={refreshSousEquipes}
                onHorsUpChanged={refreshEquipesHorsUp}
                onUsersChanged={() => { refreshUsers(); refreshAllUsers() }}
              />
            )}
            {activePage === 'demandes' && (
              <Demandes demandes={demandes} showToast={showToast} onChanged={refreshDemandes} />
            )}
            {activePage === 'evaluation' && (
              <Evaluation teams={sousEquipes} horsUpTeams={equipesHorsUp} showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
            )}
            {activePage === 'rapports' && (
              <Rapports teams={sousEquipes} users={users} showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
            )}
            {activePage === 'activite-ecole' && (
              <ActiviteEcole showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
            )}
            {activePage === 'voeux-pedagogiques' && (
              <VoeuxPedagogiques showToast={showToast} teams={sousEquipes} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
            )}
            {activePage === 'sauvegardes' && (
              <Sauvegardes showToast={showToast} />
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
              />
            )}
          </div>
        </main>
      </div>

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
          <div className="num">{demandes.length}</div><div className="label">Demandes hors-équipe</div>
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
            </div>
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
              <div><h2>Demandes hors-équipe</h2><div className="hint">En attente de vérification — cliquez pour ouvrir</div></div>
              <button className="icon-btn sm" title="Voir toutes les demandes" onClick={() => onNavigate?.('demandes')}><Icon.requests /></button>
            </div>
            <div className="list">
              {demandesRecentes.map((r) => (
                <div className="list-item" key={r.id_demande} style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('demandes')}>
                  <div className="avatar sm">{initials(r.collaborateur_nom)}</div>
                  <div className="body">
                    <div className="title">{r.collaborateur_nom}</div>
                    <div className="desc">{r.description}</div>
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
function Utilisateurs({ users, teams, horsUpTeams, showToast, onChanged }) {
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
    if (!window.confirm(`Retirer ${u.nom} de "${team.nom}" ?`)) return
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
    if (!window.confirm(`Supprimer définitivement ${label} de ${nom} ? Cette action est irréversible (ex : l'utilisateur a quitté ESPRIT).`)) return
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

  const closeTacheModal = () => setTacheModalGroup(null)

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
      closeTacheModal()
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
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={savingTache} onClick={submitTacheModal}>{savingTache ? 'Affectation…' : 'Affecter la tâche'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
/* ================= DEMANDES HORS-ÉQUIPE ================= */
function Demandes({ demandes, showToast, onChanged }) {
  const [selected, setSelected] = useState(null) // demande en cours d'édition dans la modale
  const [destinataire, setDestinataire] = useState('')
  const [sending, setSending] = useState(false)
  const [acting, setActing] = useState(false)
  // id_demande -> 'validee' | 'refusee' : pour l'animation de transition de couleur avant
  // que la demande ne quitte réellement la liste "En attente" (au prochain onChanged()).
  const [justDecided, setJustDecided] = useState({})
  // Étapes 2,3,4 ("Décision de l'admin", "Email envoyé...", "Dossier mis à jour") du schéma
  // "Processus de validation" : passées en vert l'une après l'autre à chaque décision admin,
  // pour visualiser la cascade décision -> email -> dossier, puis remises à zéro.
  const [pipelineExtraDone, setPipelineExtraDone] = useState({})

  const runPipelineAnimation = () => {
    setPipelineExtraDone({ 2: true })
    setTimeout(() => setPipelineExtraDone((p) => ({ ...p, 3: true })), 900)
    setTimeout(() => setPipelineExtraDone((p) => ({ ...p, 4: true })), 1800)
    setTimeout(() => setPipelineExtraDone({}), 3600)
  }

  const ouvrirModale = (d) => {
    setSelected(d)
    setDestinataire(d.destinataire_verification || d.contact_responsable || '')
  }
  const fermerModale = () => {
    if (sending || acting) return
    setSelected(null)
  }

  const envoyer = async () => {
    const email = destinataire.trim()
    if (!email) { showToast('Merci de renseigner un destinataire de vérification'); return }
    setSending(true)
    try {
      await envoyerVerificationDemande(selected.id_demande, email)
      showToast(`Mail de vérification envoyé à ${email}`)
      onChanged()
      setSelected(null)
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'envoi du mail de vérification")
    } finally {
      setSending(false)
    }
  }

  const valider = async () => {
    const id = selected.id_demande
    setActing(true)
    try {
      await validerDemande(id)
      showToast('Demande validée')
      setSelected(null)
      runPipelineAnimation()
      setJustDecided((prev) => ({ ...prev, [id]: 'validee' }))
      setTimeout(() => {
        onChanged()
        setJustDecided((prev) => { const next = { ...prev }; delete next[id]; return next })
      }, 1400)
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la validation')
    } finally {
      setActing(false)
    }
  }

  const refuser = async () => {
    if (!window.confirm(`Refuser la demande de ${selected.collaborateur_nom} ?`)) return
    const id = selected.id_demande
    setActing(true)
    try {
      await refuserDemande(id)
      showToast('Demande refusée')
      setSelected(null)
      runPipelineAnimation()
      setJustDecided((prev) => ({ ...prev, [id]: 'refusee' }))
      setTimeout(() => {
        onChanged()
        setJustDecided((prev) => { const next = { ...prev }; delete next[id]; return next })
      }, 1400)
    } catch (err) {
      console.error(err)
      showToast('Erreur lors du refus')
    } finally {
      setActing(false)
    }
  }

  const enAttente = demandes
    .filter((d) => d.statut === 'attente' || d.statut === 'envoye')
    .sort((a, b) => new Date(a.date_reception) - new Date(b.date_reception))

  const historique = demandes
    .filter((d) => d.statut === 'validee' || d.statut === 'refusee')
    .sort((a, b) => new Date(b.date_validation || b.date_reception) - new Date(a.date_validation || a.date_reception))
    .slice(0, 8)

  const periodeLabel = selected && (selected.date_debut || selected.date_fin)
    ? `${selected.date_debut ? new Date(selected.date_debut).toLocaleDateString('fr-FR') : '—'} → ${selected.date_fin ? new Date(selected.date_fin).toLocaleDateString('fr-FR') : '—'}`
    : null

  return (
    <>
      <div className="page-head">
        <h2>Demandes hors-équipe</h2>
        <p>
          Chaque demande d'un collaborateur déclenche un mail de vérification préformaté vers un destinataire
          externe&nbsp;; dès confirmation, la tâche est validée automatiquement et intégrée au dossier.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div><h2>Processus de validation</h2></div></div>
        <div className="process-stepper">
          {PROCESS_STEPS.map((step, i) => {
            const isDone = i < 2 || !!pipelineExtraDone[i]
            const isCurrent = !isDone && [2, 3, 4].find((idx) => !(idx < 2 || pipelineExtraDone[idx])) === i
            return (
              <div key={step.label} className={`process-step ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                <span className="process-line" />
                <span className="process-dot">{isDone ? '✓' : i + 1}</span>
                <span className="process-step-label">{step.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>En attente de vérification</h2>
              <div className="hint">{enAttente.length} demande{enAttente.length > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="list">
            {enAttente.map((d) => {
              const decision = justDecided[d.id_demande]
              return (
                <div
                  className={`list-item${decision ? ` decision-flash decision-${decision}` : ''}`}
                  key={d.id_demande}
                >
                  <div className="avatar sm">{initials(d.collaborateur_nom)}</div>
                  <div className="body">
                    <div className="title">{d.collaborateur_nom}</div>
                    <div className="desc">{d.description}</div>
                    <div className="meta">
                      <span>{relativeDays(d.date_reception)}</span>
                      <span className={`statut-pill ${statutBadge(decision || d.statut).cls}`}>{statutBadge(decision || d.statut).label}</span>
                    </div>
                  </div>
                  <div className="actions">
                    <button className="btn btn-ghost btn-sm" disabled={!!decision} onClick={() => ouvrirModale(d)}>
                      {d.statut === 'envoye' ? 'Relancer' : 'Compléter destinataire'}
                    </button>
                  </div>
                </div>
              )
            })}
            {enAttente.length === 0 && (
              <div className="list-item"><div className="body"><div className="desc">Aucune demande en attente</div></div></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Historique récent</h2></div></div>
          <div className="list">
            {historique.map((d) => (
              <div className="list-item" key={d.id_demande}>
                <div className="body">
                  <div className="title">{d.collaborateur_nom}</div>
                  <div className="desc">
                    {d.description}
                    {d.statut === 'validee'
                      ? ` — validée le ${formatDateShortFr(d.date_validation)}`
                      : ' — non confirmée'}
                  </div>
                </div>
                <div className="actions">
                  <span className={`statut-pill ${statutBadge(d.statut).cls}`}>{statutBadge(d.statut).label}</span>
                </div>
              </div>
            ))}
            {historique.length === 0 && (
              <div className="list-item"><div className="body"><div className="desc">Aucune demande traitée pour le moment</div></div></div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) fermerModale() }}>
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={fermerModale} aria-label="Fermer">×</button>
            <div className="modal-title">{selected.statut === 'envoye' ? 'Relancer la vérification' : 'Compléter le destinataire'}</div>
            <div className="modal-sub">
              <strong style={{ color: 'var(--text)' }}>{selected.collaborateur_nom}</strong> — {selected.description}
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.contexte && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Contexte : </b>{selected.contexte}</div>
              )}
              {periodeLabel && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Période : </b>{periodeLabel}</div>
              )}
              {selected.contact_responsable && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Contact fourni : </b>{selected.contact_responsable}</div>
              )}
              {!selected.contexte && !periodeLabel && !selected.contact_responsable && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Aucune information complémentaire fournie</div>
              )}
            </div>

            <div className="field full" style={{ marginBottom: 16 }}>
              <label>Destinataire de vérification</label>
              <input
                type="email"
                placeholder="email@partenaire.tn"
                value={destinataire}
                onChange={(e) => setDestinataire(e.target.value)}
                autoFocus
              />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={sending || acting} onClick={envoyer}>
              {sending ? 'Envoi…' : selected.statut === 'envoye' ? 'Renvoyer le mail de vérification' : 'Envoyer le mail de vérification'}
            </button>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.03em' }}>
                Action manuelle (si confirmation reçue autrement)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} disabled={sending || acting} onClick={valider}>
                  Valider directement
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', color: 'var(--red-dark)' }} disabled={sending || acting} onClick={refuser}>
                  Refuser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ================= SOUS-ÉQUIPES ================= */
function SousEquipesPage({ teams, loadingTeams, horsUpTeams, loadingHorsUp, users, showToast, onChanged, onHorsUpChanged, onUsersChanged }) {
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

  const closeTacheForm = () => {
    setShowTacheForm(false)
    resetTacheForm()
  }

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
      closeTacheForm()
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

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

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
    if (!window.confirm(`Supprimer la sous-équipe "${t.nom}" ? Cette action est irréversible.`)) return
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

function ActiviteEcole({ showToast, filtreAnnee, filtreSemestre }) {
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
                  <td className="grp-start"><CellLibelle items={dansAnnee(p.encadrements)} accent="blue" onOpenDetail={(items) => setCategoryModal({ title: `Étudiants encadrés — ${p.nom}`, items })} /></td>
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
function ExpertiseModal({ professeur, onClose, showToast, onChanged }) {
  const [loading, setLoading] = useState(true)
  const [expertises, setExpertises] = useState([])
  const [expertiseInput, setExpertiseInput] = useState('')
  const [savingExpertise, setSavingExpertise] = useState(false)

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>Expertises — {professeur.nom}</h2><div className="hint">Ajouter ou retirer une expertise pour ce collaborateur</div></div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
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

/* ================= VŒUX PÉDAGOGIQUES ================= */
// Les 8 questions sont fixes (cahier des charges) ; seules les listes de choix de
// modules (Q1, Q3, Q5) sont gérées par l'admin, campagne par campagne.
const VP_QUESTIONS = {
  q1: 'Veuillez indiquer vos préférences quant aux modules que vous souhaitez enseigner',
  q2: "Souhaitez-vous enseigner les modules offerts dans le cadre de la formation en alternance ?",
  q3: 'Si oui, veuillez choisir le(s) module(s)',
  q4: 'Souhaitez-vous enseigner les modules offerts pour la classe internationale (enseignée en anglais) ?',
  q5: 'Si oui, veuillez choisir le(s) module(s)',
  q6: 'Souhaitez-vous avoir des heures supplémentaires ?',
  q7: "Si oui, veuillez préciser le nombre d'heures",
  q8: 'Souhaitez-vous mentionner autre chose ? (facultatif)',
}

function vpStatutBadge(statut) {
  const map = {
    brouillon: { label: 'Brouillon', cls: 'gray' },
    publiee: { label: 'Envoyée', cls: 'blue' },
    cloturee: { label: 'Clôturée', cls: 'green' },
  }
  return map[statut] || { label: statut, cls: 'gray' }
}

function ChipListEditor({ label, items, onChange, disabled, placeholder }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v || items.includes(v)) { setInput(''); return }
    onChange([...items, v])
    setInput('')
  }
  return (
    <div className="field full">
      <label>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: disabled ? 0 : 8 }}>
        {items.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucun module ajouté</span>}
        {items.map((it) => (
          <span key={it} className="role-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {it}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== it))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 14, lineHeight: 1 }}
                title="Retirer"
              >×</button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder={placeholder || 'Nom du module…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={add}>Ajouter</button>
        </div>
      )}
    </div>
  )
}

// Variante de ChipListEditor avec un module ET un niveau côte à côte : chaque
// module de la liste peut avoir un niveau différent (ex. TLA[3A], proxy2[1A]).
// Les deux champs sont combinés en une seule chip "Module[Niveau]" à l'ajout ;
// si aucun niveau n'est saisi, seul le nom du module est ajouté.
function ModuleNiveauEditor({ label, items, onChange, disabled }) {
  const [module, setModule] = useState('')
  const [niveau, setNiveau] = useState('')

  const add = () => {
    const m = module.trim()
    const n = niveau.trim()
    if (!m) return
    const v = n ? `${m}[${n}]` : m
    if (items.includes(v)) { setModule(''); setNiveau(''); return }
    onChange([...items, v])
    setModule('')
    setNiveau('')
  }

  return (
    <div className="field full">
      <label>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: disabled ? 0 : 8 }}>
        {items.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucun module ajouté</span>}
        {items.map((it) => (
          <span key={it} className="role-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {it}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== it))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 14, lineHeight: 1 }}
                title="Retirer"
              >×</button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Module (ex. TLA)"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            style={{ flex: 2 }}
          />
          <input
            type="text"
            placeholder="Niveau (ex. 3A)"
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={add}>Ajouter</button>
        </div>
      )}
    </div>
  )
}

function VoeuxPedagogiques({ showToast, teams, filtreAnnee, filtreSemestre }) {
  const [campagnes, setCampagnes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [choixModules, setChoixModules] = useState([])
  const [choixAlternance, setChoixAlternance] = useState([])
  const [choixInternational, setChoixInternational] = useState([])
  const [saving, setSaving] = useState(false)
  const [historiqueOpen, setHistoriqueOpen] = useState(false)
  const [choixModalOpen, setChoixModalOpen] = useState(false)
  const [reponses, setReponses] = useState([])
  const [loadingReponses, setLoadingReponses] = useState(false)
  const [filtreEquipe, setFiltreEquipe] = useState('all')
  const [detail, setDetail] = useState(null)
  const [affecterTarget, setAffecterTarget] = useState(null)
  const [groupByModule, setGroupByModule] = useState(false)

  const refresh = useCallback((keepSelection) => {
    setLoading(true)
    return getCampagnesVoeuxPedagogiques()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setCampagnes(list)
        if (!keepSelection || !list.some((c) => c.id_campagne === selectedId)) {
          setSelectedId(list[0]?.id_campagne ?? null)
        }
      })
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement des campagnes') })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast])

  useEffect(() => { refresh(false) }, [refresh])

  // Le filtre Année/Semestre du haut de page doit piloter QUELLE campagne est
  // affichée/gérée ici, pas seulement afficher un avertissement : dès qu'il change
  // (ou que la liste de campagnes vient de se charger), on bascule automatiquement
  // sur la campagne dont la date de création correspond à cette période, si elle
  // existe. Si aucune campagne ne correspond, on garde la sélection actuelle (l'alerte
  // ci-dessous prévient déjà l'admin, qui peut ouvrir l'historique pour choisir manuellement).
  useEffect(() => {
    if (campagnes.length === 0) return
    const correspondante = campagnes.find((c) => estDansPeriode(c.date_creation, filtreAnnee, filtreSemestre))
    if (correspondante && correspondante.id_campagne !== selectedId) {
      setSelectedId(correspondante.id_campagne)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtreAnnee, filtreSemestre, campagnes])

  const selected = campagnes.find((c) => c.id_campagne === selectedId) || null

  useEffect(() => {
    if (selected) {
      setChoixModules(selected.choix_modules || [])
      setChoixAlternance(selected.choix_modules_alternance || [])
      setChoixInternational(selected.choix_modules_international || [])
    }
  }, [selected?.id_campagne])

  // Réponses de la campagne sélectionnée — affichées dans un tableau simple sur la page.
  useEffect(() => {
    if (!selected || selected.statut === 'brouillon') { setReponses([]); return }
    setLoadingReponses(true)
    getReponsesCampagneVoeuxPedagogiques(selected.id_campagne)
      .then((data) => setReponses(Array.isArray(data?.reponses) ? data.reponses : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement des réponses') })
      .finally(() => setLoadingReponses(false))
  }, [selected?.id_campagne, selected?.statut, showToast])

  // Une réponse ne reste visible que si elle a elle-même été soumise dans la
  // période sélectionnée (et pas seulement la campagne à laquelle elle appartient) :
  // changer l'année/semestre doit faire disparaître les réponses d'une autre période.
  const filteredReponses = reponses
    .filter((r) => estDansPeriode(r.date_soumission, filtreAnnee, filtreSemestre))
    .filter((r) => (filtreEquipe === 'all' ? true : (r.sous_equipes || []).some((se) => String(se.id) === String(filtreEquipe))))

  // Regroupe les réponses par module souhaité (Q1) — un collaborateur ayant
  // souhaité plusieurs modules apparaît dans chacun des groupes correspondants.
  const reponsesParModule = (() => {
    const map = {}
    filteredReponses.forEach((r) => {
      (r.modules_souhaites || []).forEach((m) => {
        if (!map[m]) map[m] = []
        map[m].push(r)
      })
    })
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  })()

  // Après une affectation dans la modale de détail, on met à jour la ligne
  // correspondante dans la liste (et la modale) sans recharger toute la page.
  const handleAffecte = (updated) => {
    setReponses((prev) => prev.map((r) => (r.id_reponse === updated.id_reponse ? { ...r, ...updated } : r)))
    setDetail((prev) => (prev && prev.id_reponse === updated.id_reponse ? { ...prev, ...updated } : prev))
    setAffecterTarget((prev) => (prev && prev.id_reponse === updated.id_reponse ? { ...prev, ...updated } : prev))
  }

  const handleCreate = () => {
    createCampagneVoeuxPedagogiques({ titre: 'Vœux pédagogiques' })
      .then((c) => { showToast('Nouvelle campagne créée'); return refresh(false).then(() => setSelectedId(c.id_campagne)) })
      .catch((err) => { console.error(err); showToast(err.response?.data?.message || 'Erreur lors de la création') })
  }

  const handleSaveChoix = () => {
    if (!selected) return
    setSaving(true)
    updateCampagneVoeuxPedagogiques(selected.id_campagne, {
      titre: selected.titre,
      choix_modules: choixModules,
      choix_modules_alternance: choixAlternance,
      choix_modules_international: choixInternational,
    })
      .then(() => { showToast('Choix enregistrés'); return refresh(true) })
      .catch((err) => { console.error(err); showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement') })
      .finally(() => setSaving(false))
  }

  const handlePublier = () => {
    if (!selected) return
    publierCampagneVoeuxPedagogiques(selected.id_campagne)
      .then(() => { showToast('Questionnaire envoyé à tous les collaborateurs'); refresh(true) })
      .catch((err) => { console.error(err); showToast(err.response?.data?.message || 'Erreur lors de l\'envoi') })
  }

  const handleCloturer = () => {
    if (!selected) return
    cloturerCampagneVoeuxPedagogiques(selected.id_campagne)
      .then(() => { showToast('Campagne clôturée'); refresh(true) })
      .catch((err) => { console.error(err); showToast(err.response?.data?.message || 'Erreur lors de la clôture') })
  }

  const handleDelete = () => {
    if (!selected) return
    deleteCampagneVoeuxPedagogiques(selected.id_campagne)
      .then(() => { showToast('Brouillon supprimé'); refresh(false) })
      .catch((err) => { console.error(err); showToast(err.response?.data?.message || 'Erreur lors de la suppression') })
  }

  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2>Vœux pédagogiques</h2>
          <p>Questionnaire à 8 questions envoyé à tous les collaborateurs. Les questions sont fixes ; vous gérez ici uniquement les modules proposés en réponse, campagne par campagne.</p>
          {selected?.date_creation && !estDansPeriode(selected.date_creation, filtreAnnee, filtreSemestre) && (
            <p style={{ color: 'var(--amber, #B45309)', fontSize: 12.5, marginTop: 4 }}>
              La campagne active a été créée hors de la période sélectionnée ({filtreAnnee} · {filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'}). Ouvrez l'historique pour choisir une campagne de cette période.
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {campagnes.length > 0 && (
            <button className="icon-btn sm" title="Voir l'historique des campagnes" onClick={() => setHistoriqueOpen(true)}><Icon.history /></button>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleCreate}><Icon.plus /> Nouvelle campagne</button>
        </div>
      </div>

      {campagnes.length === 0 && !loading && (
        <div className="card">
          <div className="empty-state">
            <Icon.poll />
            <div className="t">Aucune campagne pour l'instant</div>
            <div className="d">Créez-en une pour envoyer le questionnaire aux collaborateurs.</div>
          </div>
        </div>
      )}

      {selected && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Campagne active</h2>
              <div className="hint" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{selected.titre}</span>
                <span className={`statut-pill ${vpStatutBadge(selected.statut).cls}`}>{vpStatutBadge(selected.statut).label}</span>
                <span className="vp-count-badge">{selected.nb_reponses ?? 0} réponse(s)</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="icon-btn sm" title="Modifier les modules proposés" onClick={() => setChoixModalOpen(true)}><Icon.edit /></button>
              {selected.statut === 'brouillon' && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={handleDelete}><Icon.trash /> Supprimer</button>
                  <button className="btn btn-primary btn-sm" onClick={handlePublier}>Envoyer aux collaborateurs</button>
                </>
              )}
              {selected.statut === 'publiee' && (
                <button className="btn btn-primary btn-sm" onClick={handleCloturer}>Clôturer</button>
              )}
            </div>
          </div>

          {selected.statut === 'brouillon' && (
            <div style={{ padding: '0 20px 20px', color: 'var(--text-faint)', fontSize: 12.5 }}>
              Cliquez sur <Icon.edit style={{ width: 12, height: 12, verticalAlign: -1 }} /> pour définir les modules proposés (Q1, Q3, Q5), puis envoyez le questionnaire.
            </div>
          )}

          {selected.statut !== 'brouillon' && (
            <>
              <div className="vp-filter-bar">
                <div className="hint">{loadingReponses ? 'Chargement…' : `${filteredReponses.length} / ${reponses.length} réponse(s)`}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="field">
                    <label>Filtrer par sous-équipe</label>
                    <select value={filtreEquipe} onChange={(e) => setFiltreEquipe(e.target.value)}>
                      <option value="all">Toutes les sous-équipes</option>
                      {(teams || []).map((t) => (
                        <option key={t.id_sous_equipe} value={t.id_sous_equipe}>{t.nom}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${groupByModule ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setGroupByModule((v) => !v)}
                  >
                    <Icon.layers style={{ width: 14, height: 14 }} /> {groupByModule ? 'Vue liste' : 'Grouper par module'}
                  </button>
                </div>
              </div>

              {!loadingReponses && filteredReponses.length === 0 && (
                <div style={{ padding: '0 20px 20px', color: 'var(--text-faint)' }}>Aucune réponse pour ce filtre.</div>
              )}

              {!loadingReponses && filteredReponses.length > 0 && !groupByModule && (
                <div style={{ overflowX: 'auto', paddingTop: 4 }}>
                  <table className="vp-table">
                    <colgroup>
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '13%' }} />
                      <col />
                      <col style={{ width: '80px' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Collaborateur</th>
                        <th>Sous-équipe(s)</th>
                        <th>Répondu le</th>
                        <th>Affectation</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReponses.map((r) => (
                        <tr key={r.id_reponse}>
                          <td><div className="name-cell"><div className="avatar sm">{initials(r.collaborateur_nom)}</div><span className="n">{r.collaborateur_nom}</span></div></td>
                          <td>{(r.sous_equipes || []).map((se) => se.nom).join(', ') || '—'}</td>
                          <td>{r.date_soumission ? new Date(r.date_soumission).toLocaleDateString('fr-FR') : '—'}</td>
                          <td>
                            {(r.affectations || []).length > 0
                              ? (
                                <div className="vp-affectation-tags">
                                  {r.affectations.map((a) => (
                                    <span className="statut-pill green" key={a.id_affectation}>{a.module}</span>
                                  ))}
                                </div>
                              )
                              : <span className="statut-pill gray">Non affecté</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="icon-btn sm" title="Affecter à un module" onClick={() => setAffecterTarget(r)}><Icon.academic /></button>
                            <button className="icon-btn sm" title="Voir les réponses" onClick={() => setDetail(r)}><Icon.eye /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loadingReponses && filteredReponses.length > 0 && groupByModule && (
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reponsesParModule.length === 0 && (
                    <div style={{ color: 'var(--text-faint)' }}>Aucun module souhaité (Q1) dans ce filtre.</div>
                  )}
                  {reponsesParModule.map(([module, groupe]) => (
                    <div key={module} className="vp-module-group">
                      <div className="vp-module-group-head">
                        <span className="vp-module-name">{module}</span>
                        <span className="vp-count-badge">{groupe.length} réponse(s)</span>
                      </div>
                      <div className="list">
                        {groupe.map((r) => (
                          <div className="list-item" key={r.id_reponse}>
                            <div className="body">
                              <div className="name-cell"><div className="avatar sm">{initials(r.collaborateur_nom)}</div><span className="n">{r.collaborateur_nom}</span></div>
                            </div>
                            <div className="actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {(r.affectations || []).some((a) => a.module === module)
                                ? <span className="statut-pill green">Affecté</span>
                                : <span className="statut-pill gray">Non affecté</span>}
                              <button className="icon-btn sm" title="Affecter à un module" onClick={() => setAffecterTarget(r)}><Icon.academic /></button>
                              <button className="icon-btn sm" title="Voir les réponses" onClick={() => setDetail(r)}><Icon.eye /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {choixModalOpen && selected && (
        <VoeuxChoixModal
          selected={selected}
          choixModules={choixModules}
          setChoixModules={setChoixModules}
          choixAlternance={choixAlternance}
          setChoixAlternance={setChoixAlternance}
          choixInternational={choixInternational}
          setChoixInternational={setChoixInternational}
          saving={saving}
          onSave={handleSaveChoix}
          onClose={() => setChoixModalOpen(false)}
        />
      )}

      {detail && (
        <VoeuxReponseDetail reponse={detail} onClose={() => setDetail(null)} />
      )}

      {affecterTarget && (
        <VoeuxAffecterModal
          reponse={affecterTarget}
          onClose={() => setAffecterTarget(null)}
          onAffecte={handleAffecte}
          showToast={showToast}
        />
      )}

      {historiqueOpen && (
        <VoeuxCampagnesHistorique
          campagnes={campagnes}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setHistoriqueOpen(false) }}
          onClose={() => setHistoriqueOpen(false)}
          filtreAnnee={filtreAnnee}
          filtreSemestre={filtreSemestre}
        />
      )}
    </>
  )
}

function VoeuxChoixModal({
  selected, choixModules, setChoixModules, choixAlternance, setChoixAlternance, choixInternational, setChoixInternational,
  saving, onSave, onClose,
}) {
  const dirty =
    JSON.stringify(choixModules) !== JSON.stringify(selected.choix_modules || []) ||
    JSON.stringify(choixAlternance) !== JSON.stringify(selected.choix_modules_alternance || []) ||
    JSON.stringify(choixInternational) !== JSON.stringify(selected.choix_modules_international || [])
  const readonly = selected.statut === 'cloturee'

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 640 }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <div className="modal-title">Modules proposés — {selected.titre}</div>
        <div className="modal-sub">Ces choix sont ceux vus par les collaborateurs pour les questions à choix multiple.</div>

        <div className="form-grid" style={{ padding: '16px 0 0' }}>
          <ModuleNiveauEditor
            label={`Q1 — ${VP_QUESTIONS.q1}`}
            items={choixModules}
            onChange={setChoixModules}
            disabled={readonly}
          />
          <ModuleNiveauEditor
            label={`Q3 — ${VP_QUESTIONS.q3} (alternance)`}
            items={choixAlternance}
            onChange={setChoixAlternance}
            disabled={readonly}
          />
          <ModuleNiveauEditor
            label={`Q5 — ${VP_QUESTIONS.q5} (classe internationale)`}
            items={choixInternational}
            onChange={setChoixInternational}
            disabled={readonly}
          />
        </div>

        {!readonly && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            {dirty && <span style={{ alignSelf: 'center', color: 'var(--amber, #B45309)', fontSize: 12.5, marginRight: 'auto' }}>Modifications non enregistrées</span>}
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
            <button className="btn btn-primary btn-sm" disabled={saving} onClick={onSave}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function VoeuxCampagnesHistorique({ campagnes, selectedId, onSelect, onClose, filtreAnnee, filtreSemestre }) {
  const [showAll, setShowAll] = useState(false)
  const campagnesAffichees = showAll
    ? campagnes
    : campagnes.filter((c) => estDansPeriode(c.date_creation, filtreAnnee, filtreSemestre))

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 0' }}>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
          <div className="modal-title">Historique des campagnes</div>
          <div className="modal-sub">
            {campagnesAffichees.length} campagne(s){!showAll && ` · ${filtreAnnee} · ${filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'}`}
            {' — '}
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--blue, #3B82F6)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}
            >
              {showAll ? 'Filtrer par période sélectionnée' : 'Voir toutes les périodes'}
            </button>
          </div>
        </div>
        <div className="list" style={{ maxHeight: 440, overflowY: 'auto', marginTop: 12 }}>
          {campagnesAffichees.map((c) => (
            <div
              className="list-item"
              key={c.id_campagne}
              style={{ cursor: 'pointer', background: c.id_campagne === selectedId ? 'var(--bg)' : undefined }}
              onClick={() => onSelect(c.id_campagne)}
            >
              <div className="body">
                <div className="title">{c.titre}</div>
                <div className="desc">Créée le {new Date(c.date_creation).toLocaleDateString('fr-FR')} · {c.nb_reponses ?? 0} réponse(s)</div>
              </div>
              <div className="actions">
                <span className={`statut-pill ${vpStatutBadge(c.statut).cls}`}>{vpStatutBadge(c.statut).label}</span>
              </div>
            </div>
          ))}
          {campagnesAffichees.length === 0 && (
            <div className="list-item"><div className="body"><div className="desc">Aucune campagne sur cette période</div></div></div>
          )}
        </div>
      </div>
    </div>
  )
}

function VoeuxReponseDetail({ reponse: r, onClose }) {
  const QA = ({ q, label, value }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-faint)', marginBottom: 5 }}>
        {q} — {label}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{value}</div>
    </div>
  )

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} style={{ zIndex: 1001 }}>
      <div className="modal-card" style={{ maxWidth: 480 }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <div className="modal-title">{r.collaborateur_nom}</div>
        <div className="modal-sub">
          {(r.sous_equipes || []).map((se) => se.nom).join(', ') || 'Aucune sous-équipe'}
          {r.date_soumission && ` · répondu le ${new Date(r.date_soumission).toLocaleDateString('fr-FR')}`}
        </div>

        <div style={{ marginTop: 18 }}>
          <QA q="Q1" label="Modules souhaités" value={r.modules_souhaites.join(', ') || '—'} />
          <QA q="Q2" label="Alternance" value={r.alternance === 'oui' ? 'Oui' : 'Non'} />
          <QA q="Q3" label="Modules choisis (alternance)" value={r.alternance === 'oui' ? (r.modules_alternance.join(', ') || '—') : 'Non concerné'} />
          <QA q="Q4" label="Classe internationale" value={r.international === 'oui' ? 'Oui' : 'Non'} />
          <QA q="Q5" label="Modules choisis (international)" value={r.international === 'oui' ? (r.modules_international.join(', ') || '—') : 'Non concerné'} />
          <QA q="Q6" label="Heures supplémentaires" value={r.heures_sup === 'oui' ? 'Oui' : 'Non'} />
          <QA q="Q7" label="Nombre d'heures" value={r.heures_sup === 'oui' ? `${r.nb_heures_sup}h` : 'Non concerné'} />
          <QA q="Q8" label="Remarque" value={r.commentaire || '—'} />
        </div>
      </div>
    </div>
  )
}

// Modale rapide ouverte directement depuis la liste (icône à côté de l'œil) pour
// affecter un collaborateur sans passer par le détail complet de sa réponse.
function VoeuxAffecterModal({ reponse: r, onClose, onAffecte, showToast }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} style={{ zIndex: 1001 }}>
      <div className="modal-card" style={{ maxWidth: 420 }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <div className="modal-title">Affecter {r.collaborateur_nom}</div>
        <div className="modal-sub">
          {r.modules_souhaites?.length > 0 ? `A souhaité : ${r.modules_souhaites.join(', ')}` : 'Aucun module souhaité (Q1)'}
        </div>
        <div style={{ marginTop: 16 }}>
          <AffectationForm reponse={r} onAffecte={onAffecte} showToast={showToast} />
        </div>
      </div>
    </div>
  )
}

// Formulaire d'affectation (module + classes) partagé entre le détail
// complet d'une réponse et la modale rapide ouverte depuis la liste.
const VP_TYPE_LABELS = {
  normal: 'Cours normal',
  alternance: 'Alternance',
  international: 'Classe internationale',
  autre: 'Autre',
}

// Extrait "Niveau" d'un nom de module au format "Module[Niveau]" (tel que
// saisi par l'admin à la création de la campagne). Retourne '' si absent.
function extraireNiveau(moduleStr) {
  const m = /^(.*)\[(.+)\]\s*$/.exec(moduleStr || '')
  return m ? m[2].trim() : ''
}

function AffectationForm({ reponse: r, onAffecte, showToast }) {
  // Un collaborateur peut avoir répondu "oui" à l'alternance et/ou à
  // l'international, avec des modules différents pour chaque catégorie — le
  // type est donc choisi explicitement en premier (boutons toujours visibles),
  // pas seulement déduit d'un groupe caché dans un <select> fermé.
  const groupes = [
    { type: 'normal', label: 'Cours normal', items: r.modules_souhaites || [] },
    { type: 'alternance', label: 'Alternance', items: r.alternance === 'oui' ? (r.modules_alternance || []) : [] },
    { type: 'international', label: 'Classe internationale', items: r.international === 'oui' ? (r.modules_international || []) : [] },
  ].filter((g) => g.items.length > 0)

  const typeOptions = [...groupes, { type: 'autre', label: 'Autre' }]

  const affectations = r.affectations || []

  // Le niveau n'est plus un champ séparé : il fait partie du nom du module
  // (ex. "TLA[3A]"), tel que configuré par l'admin dans la campagne — il est
  // extrait automatiquement à l'envoi.
  // Chaque type a son propre brouillon pour la sélection en cours (module,
  // classes) ; passer de l'un à l'autre ne l'efface jamais. En revanche la
  // liste d'attente ("pending") est commune à TOUS les types : on peut ainsi
  // ajouter des modules en Cours normal, puis en Alternance, puis en
  // international, et tout envoyer d'un coup avec un seul "Affecter et notifier".
  const emptyDraft = { module: '', customModule: '', classes: [] }

  const [adding, setAdding] = useState(affectations.length === 0)
  const [type, setType] = useState('')
  const [drafts, setDrafts] = useState({})
  const [pending, setPending] = useState([]) // [{ type, module, classes }]
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const draft = drafts[type] || emptyDraft
  const { module, customModule, classes } = draft

  const updateDraft = (patch) => setDrafts((prev) => ({ ...prev, [type]: { ...(prev[type] || emptyDraft), ...patch } }))
  const setModule = (v) => updateDraft({ module: v })
  const setCustomModule = (v) => updateDraft({ customModule: v })
  const setClasses = (v) => updateDraft({ classes: v })

  const modulesDuType = groupes.find((g) => g.type === type)?.items || []

  const resetForm = () => { setType(''); setDrafts({}); setPending([]) }

  const handleChoisirType = (t) => setType(t)

  // Ajoute le module en cours (avec ses classes) à la liste d'attente
  // commune, puis vide la sélection du type courant pour en choisir un autre
  // (du même type ou d'un autre — la liste d'attente les garde tous).
  const handleAjouterModule = () => {
    const moduleFinal = type === 'autre' ? customModule.trim() : module
    if (!type) { showToast?.('Choisissez un type (cours normal, alternance…)'); return }
    if (!moduleFinal) { showToast?.('Choisissez ou saisissez un module'); return }
    setPending((prev) => [...prev, { type, module: moduleFinal, classes }])
    updateDraft({ module: '', customModule: '', classes: [] })
  }

  const handleRetirerPending = (idx) => {
    setPending((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleAjouter = () => {
    // Le module en cours de saisie (pas encore ajouté à la liste) est inclus
    // automatiquement, pour ne pas obliger à cliquer deux fois.
    const moduleFinal = type === 'autre' ? customModule.trim() : module
    const aEnvoyer = moduleFinal ? [...pending, { type, module: moduleFinal, classes }] : pending
    if (aEnvoyer.length === 0) { showToast?.('Ajoutez au moins un module (choisissez un type puis un module)'); return }
    setSaving(true)
    aEnvoyer
      .reduce(
        (chain, entry) => chain.then(() => ajouterAffectationVoeuxPedagogiques(r.id_reponse, {
          module: entry.module,
          type: entry.type,
          niveau: extraireNiveau(entry.module),
          classes: entry.classes,
        })),
        Promise.resolve()
      )
      .then((updated) => { onAffecte?.(updated); resetForm(); setAdding(false); showToast?.('Collaborateur affecté et notifié par e-mail') })
      .catch((err) => { console.error(err); showToast?.(err.response?.data?.message || "Erreur lors de l'affectation") })
      .finally(() => setSaving(false))
  }

  const handleSupprimer = (idAffectation) => {
    setRemovingId(idAffectation)
    supprimerAffectationVoeuxPedagogiques(idAffectation)
      .then((updated) => { onAffecte?.(updated); showToast?.('Affectation retirée') })
      .catch((err) => { console.error(err); showToast?.('Erreur lors de la suppression') })
      .finally(() => setRemovingId(null))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {affectations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {affectations.map((a) => (
            <div key={a.id_affectation} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--bg)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="statut-pill green">{a.module}</span>
                {a.type && <span className="role-pill">{VP_TYPE_LABELS[a.type] || a.type}</span>}
                {a.niveau && <span className="role-pill">{a.niveau}</span>}
                {a.classes?.length > 0 && <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{a.classes.join(', ')}</span>}
              </div>
              <button type="button" className="icon-btn sm" title="Retirer cette affectation" disabled={removingId === a.id_affectation} onClick={() => handleSupprimer(a.id_affectation)}>
                <Icon.trash />
              </button>
            </div>
          ))}
        </div>
      )}

      {!adding && (
        <div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
            <Icon.plus style={{ width: 14, height: 14 }} /> Affecter à un {affectations.length > 0 ? 'autre ' : ''}module
          </button>
        </div>
      )}

      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: affectations.length > 0 ? 10 : 0, borderTop: affectations.length > 0 ? '1px dashed var(--border)' : 'none' }}>
          <div className="field full">
            <label>Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {typeOptions.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  className={`btn btn-sm ${type === t.type ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handleChoisirType(t.type)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {groupes.length === 0 && (
              <div className="hint" style={{ marginTop: 6 }}>Ce collaborateur n'a souhaité aucun module — utilisez "Autre".</div>
            )}
          </div>

          {pending.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pending.map((p, idx) => (
                <div key={`${p.type}-${p.module}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', borderRadius: 10, background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="role-pill">{p.module}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{VP_TYPE_LABELS[p.type] || p.type}</span>
                    {p.classes?.length > 0 && <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.classes.join(', ')}</span>}
                  </div>
                  <button type="button" className="icon-btn sm" title="Retirer" onClick={() => handleRetirerPending(idx)}>
                    <Icon.trash />
                  </button>
                </div>
              ))}
            </div>
          )}

          {type && type !== 'autre' && (
            <div className="field full">
              <label>Module ({VP_TYPE_LABELS[type]})</label>
              <select value={module} onChange={(e) => setModule(e.target.value)}>
                <option value="">Sélectionner un module…</option>
                {modulesDuType.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {type === 'autre' && (
            <div className="field full">
              <label>Nom du module</label>
              <input value={customModule} onChange={(e) => setCustomModule(e.target.value)} placeholder="Nom du module…" />
            </div>
          )}

          {type && (
            <>
              <ChipListEditor label="Classes" items={classes} onChange={setClasses} placeholder="Ex. 3A-G1" />
              <div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleAjouterModule}>
                  <Icon.plus style={{ width: 14, height: 14 }} /> Ajouter ce module et passer au suivant
                </button>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {affectations.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); resetForm() }}>Annuler</button>}
            <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={handleAjouter}>
              {saving ? 'Envoi…' : 'Affecter et notifier'}
            </button>
          </div>
        </div>
      )}
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
    if (!teamId) { showToast('Sélectionnez une équipe'); return }
    setCalculating(true)
    try {
      // Pour chaque critère personnalisé noté manuellement, le serveur exige une note ET
      // une justification écrite (voir JUSTIFICATION_MIN_LENGTH côté backend) — on
      // combine les deux ici dans le format attendu par calculerScoresEquipe. Les
      // critères connectés (basés sur les tâches / activité école) sont toujours
      // recalculés côté serveur à partir des données réelles, quoi qu'on envoie ici.
      const payload = {}
      Object.entries(noteEdits).forEach(([idCollaborateur, notesParCritere]) => {
        payload[idCollaborateur] = {}
        Object.entries(notesParCritere).forEach(([idCritere, note]) => {
          payload[idCollaborateur][idCritere] = {
            note,
            justification: justificationEdits[idCollaborateur]?.[idCritere] || '',
          }
        })
      })
      await calculerScores(teamId, payload, teamType, filtreAnnee, filtreSemestre)
      showToast('Formule appliquée — scores recalculés')
      const data = await getScores({ sous_equipe: teamId, type: teamType })
      setScores(data)
      loadGrille()
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
        <p>Définissez les critères d'évaluation et leur pondération : le score final de chaque collaborateur est calculé automatiquement à partir des tâches réalisées et validées, par équipe.</p>
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
                  value={c.ponderation}
                  onChange={(e) => setValue(c, e.target.value)}
                />
                {!c.code && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--amber)' }}>
                        Critère personnalisé — note manuelle plafonnée à {PLAFOND_NOTE_MANUELLE}/20, justification obligatoire
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 8px', fontSize: 10.5 }}
                        onClick={() => setNotingCritereId((id) => (id === c.id_critere ? null : c.id_critere))}
                      >
                        {notingCritereId === c.id_critere ? 'Fermer' : 'Noter les membres'}
                      </button>
                    </div>
                    {notingCritereId === c.id_critere && (
                      <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        {membres.map((m) => {
                          const justif = justificationEdits[m.id_collaborateur]?.[c.id_critere] || ''
                          const justifTropCourte = justif.length > 0 && justif.length < JUSTIFICATION_MIN_LENGTH
                          return (
                            <div key={m.id_collaborateur} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <div className="name-cell"><div className="avatar sm">{initials(m.nom)}</div><span className="n">{m.nom}</span></div>
                                <input
                                  type="number"
                                  min="0"
                                  max={PLAFOND_NOTE_MANUELLE}
                                  step="0.5"
                                  placeholder={`—/${PLAFOND_NOTE_MANUELLE}`}
                                  className="pond-input"
                                  value={noteEdits[m.id_collaborateur]?.[c.id_critere] ?? ''}
                                  onChange={(e) => updateNote(m.id_collaborateur, c.id_critere, e.target.value)}
                                />
                              </div>
                              <textarea
                                placeholder={`Justification obligatoire (min. ${JUSTIFICATION_MIN_LENGTH} caractères) — pourquoi cette note ?`}
                                rows={2}
                                style={{
                                  width: '100%', marginTop: 6, fontFamily: 'Inter', fontSize: 11.5,
                                  padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                                  border: `1px solid ${justifTropCourte ? 'var(--red)' : 'var(--border)'}`, resize: 'vertical',
                                }}
                                value={justif}
                                onChange={(e) => updateJustification(m.id_collaborateur, c.id_critere, e.target.value)}
                              />
                              {justifTropCourte && (
                                <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>
                                  Encore {JUSTIFICATION_MIN_LENGTH - justif.length} caractère(s) minimum
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {membres.length === 0 && (
                          <div style={{ padding: 12, color: 'var(--text-faint)', fontSize: 12 }}>Aucun membre dans cette équipe</div>
                        )}
                      </div>
                    )}
                  </>
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
              <div className="hint">{labelSemestre(filtreSemestre)} · {filtreAnnee}</div>
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
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={calculating}
              onClick={appliquer}
            >
              {calculating ? 'Calcul en cours…' : "Appliquer la formule d'évaluation"}
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

function Sauvegardes({ showToast }) {
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
    if (!window.confirm(`Supprimer la sauvegarde "${s.nom_fichier}" ? Cette action est irréversible.`)) return
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
function MonProfilAdmin({ user, updateUser, showToast, dark, onToggleDark, params, onChangedParams }) {
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(null)

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
        <h2>Mon profil</h2>
        <p>Vos informations de compte, votre sécurité et les réglages système de l'application.</p>
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
              <div><div className="t">Notifications par email</div><div className="d">Rappels de deadline</div></div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={!!profil?.notifications_email}
                  disabled={loading || savingPref !== null}
                  onChange={() => togglePref('notifications_email')}
                />
                <span className="slider"></span>
              </label>
            </div>
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