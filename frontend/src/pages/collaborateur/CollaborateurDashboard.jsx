import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import EspritLogo from '../../components/EspritLogo.jsx'
import NotificationBell from '../../components/NotificationBell.jsx'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
import {
  getMonActiviteEcole,
  addMonExpertise,
  deleteExpertise,
  addMonEncadrement,
  deleteMonEncadrement,
  addMonActiviteAcademique,
  deleteMonActiviteAcademique,
  getProfesseurs,
  getProfesseurDetail,
  getMesTaches,
  updateMaTache,
  getMesDemandes,
  creerDemande,
  getMembresSousEquipe,
  getMonProfil,
  updateMesPreferences,
  updateMonProfilIdentite,
  changerMonMotDePasse,
  getMonQuestionnaireVoeuxPedagogiques,
  saveMaReponseVoeuxPedagogiques,
  getMesAffectationsVoeuxPedagogiques,
} from '../../services/api.js'
import './collaborateur.css'

function relativeDays(dateStr) {
  if (!dateStr) return ''
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return "Reçue aujourd'hui"
  if (days === 1) return 'Reçue hier'
  return `Reçue il y a ${days}j`
}

// Cahier des charges : le collaborateur ne peut choisir que ces 3 statuts pour ses tâches.
const TACHE_STATUTS = [
  { value: 'en_cours', label: 'En cours', cls: 'encours' },
  { value: 'validee', label: 'Faite', cls: 'validee' },
  { value: 'probleme_coordination', label: 'Problème de coordination', cls: 'nonrealisee' },
]
function tacheStatutMeta(statut) {
  return TACHE_STATUTS.find((s) => s.value === statut) || { value: 'a_faire', label: 'À faire', cls: 'gray' }
}

const PRIORITE_LABELS = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' }

const DEMANDE_STATUTS = {
  attente: { label: 'En attente', cls: 'attente' },
  envoye: { label: 'Vérification envoyée', cls: 'attente' },
  validee: { label: 'Validée', cls: 'validee' },
  refusee: { label: 'Refusée', cls: 'nonrealisee' },
}
function demandeStatutMeta(statut) {
  return DEMANDE_STATUTS[statut] || { label: statut, cls: 'gray' }
}

function formatDateShortFr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
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

function initials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

const Icon = {
  search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>),
  eye: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
  task: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>),
  requests: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 4h16v16H4z"/><path d="M4 9h16"/><path d="M9 4v16"/></svg>),
  eval: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 2l2.4 6.9L22 9l-5.6 4.9L18 22l-6-3.7L6 22l1.6-8.1L2 9l7.6-.1z"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>),
  academic: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/></svg>),
  profile: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>),
  bell: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>),
  poll: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 17V9"/><path d="M15 17V5"/><path d="M4 17v-4"/><path d="M4 21h16"/></svg>),
  students: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.3"/></svg>),
  gavel: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="m14 5 5 5"/><path d="m3 21 6-6"/><path d="m9.5 8.5 6 6"/><path d="M14.5 4.5 19.5 9.5"/><path d="M6.5 12.5 11.5 17.5"/></svg>),
  calendar: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18"/><path d="M8 2.5v4"/><path d="M16 2.5v4"/></svg>),
  flag: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M5 3v18"/><path d="M5 4h11l-2.5 4L16 12H5"/></svg>),
  removeX: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>),
}

// Icône + couleur de badge pour chacune des 7 catégories d'activité école
// (mêmes catégories que les colonnes du tableau admin "Activité école").
const ACTIVITE_ICONS = {
  membre_jury: { icon: <Icon.gavel />, color: 'red' },
  president_jury: { icon: <Icon.gavel />, color: 'red' },
  formation_ete: { icon: <Icon.academic />, color: 'amber' },
  formation_hiver: { icon: <Icon.academic />, color: 'blue' },
  formation_printemps: { icon: <Icon.academic />, color: 'green' },
  evenement: { icon: <Icon.calendar />, color: 'green' },
  comite_organisation: { icon: <Icon.flag />, color: 'blue' },
}

// Période Année/Semestre — mêmes options et même règle par défaut que le filtre
// du tableau de bord admin (septembre→janvier = S1, février→août = S2), pour
// rester cohérent dans toute l'application.
const ANNEE_OPTIONS = ['2025/2026', '2024/2025']
const SEMESTRE_OPTIONS = [
  { value: 'S1', label: 'Semestre 1' },
  { value: 'S2', label: 'Semestre 2' },
]
function periodeParDefaut() {
  const now = new Date()
  const mois = now.getMonth() + 1
  const anneeDebut = mois >= 9 ? now.getFullYear() : now.getFullYear() - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}

// Même règle de découpage que le backend (utils/periode.js), appliquée côté client pour
// filtrer les demandes hors-équipe (date_reception) et les activités école (date_activite),
// qui n'ont pas de colonnes annee_universitaire/semestre dédiées comme les tâches.
function periodeDeDate(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const mois = d.getMonth() + 1
  const anneeDebut = mois >= 9 ? d.getFullYear() : d.getFullYear() - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}
// Une entrée sans date reste toujours visible, quel que soit le filtre (même logique que
// pour les tâches sans annee_universitaire/semestre enregistrés).
function estDansPeriode(dateStr, filtreAnnee, filtreSemestre) {
  if (!dateStr) return true
  const p = periodeDeDate(dateStr)
  if (!p) return true
  return p.annee === filtreAnnee && p.semestre === filtreSemestre
}

const NAV_TABS = [
  { page: 'taches', label: 'Mes tâches', icon: 'task' },
  { page: 'horsequipe', label: 'Activités hors-équipe', icon: 'requests' },
  { page: 'voeux-pedagogiques', label: 'Vœux pédagogiques', icon: 'poll' },
  { page: 'activite-ecole', label: 'Activité école', icon: 'academic' },
  { page: 'profil', label: 'Mon profil', icon: 'profile' },
]

function CollaborateurDashboard() {
  const { user, role, logout, updateUser } = useAuth()
  const [toastMsg, setToastMsg] = useState(null)
  const [activePage, setActivePage] = useState('taches')

  // Mode sombre — persisté localement, appliqué en ajoutant/retirant la classe "dark"
  // sur le conteneur racine (toutes les couleurs sont des variables CSS sur .admin-root).
  const [dark, setDark] = useState(() => localStorage.getItem('arp_theme') === 'dark')
  useEffect(() => {
    localStorage.setItem('arp_theme', dark ? 'dark' : 'light')
  }, [dark])
  const toggleDark = useCallback(() => setDark((d) => !d), [])

  // Filtre Année / Semestre du tableau de bord — purement côté client, même
  // logique que le filtre équivalent du tableau de bord admin.
  const defautPeriode = useMemo(periodeParDefaut, [])
  const [filtreAnnee, setFiltreAnnee] = useState(defautPeriode.annee)
  const [filtreSemestre, setFiltreSemestre] = useState(defautPeriode.semestre)

  // Les tâches sont chargées ici (et non dans MesTaches) pour pouvoir afficher
  // le nombre de tâches en cours sous forme de pastille sur l'onglet de navigation.
  const [taches, setTaches] = useState([])
  const [tachesLoading, setTachesLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  // Nombre de demandes hors-équipe, utilisé par la carte KPI "Activités hors-équipe"
  // affichée sur la page Mes tâches.
  const [demandesCount, setDemandesCount] = useState(0)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const refreshTaches = useCallback(() => (
    getMesTaches()
      .then((data) => setTaches(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de vos tâches') })
      .finally(() => setTachesLoading(false))
  ), [showToast])

  useEffect(() => {
    if (role !== 'collaborateur') return
    refreshTaches()
  }, [role, refreshTaches])

  useEffect(() => {
    if (role !== 'collaborateur') return
    getMesDemandes()
      .then((data) => setDemandesCount(Array.isArray(data) ? data.length : 0))
      .catch((err) => console.error('Erreur chargement demandes:', err))
  }, [role])

  const changerStatutTache = useCallback(async (id, statut, membreConcerne) => {
    setSavingId(id)
    // Mise à jour optimiste
    setTaches((prev) => prev.map((t) => (t.id_tache === id ? { ...t, statut, membre_concerne: membreConcerne || null } : t)))
    try {
      await updateMaTache(id, statut, membreConcerne)
      showToast('Statut mis à jour ✓')
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut')
      refreshTaches()
    } finally {
      setSavingId(null)
    }
  }, [showToast, refreshTaches])

  const tachesEnCoursCount = taches.filter((t) => t.statut === 'en_cours').length

  const collabName = user?.nom || 'Collaborateur'

  if (role !== 'collaborateur') {
    return (
      <div className={`admin-root${dark ? ' dark' : ''}`}>
        <div className="content" style={{ padding: '28px 32px 60px' }}>
          <div className="page-head">
            <h2>Tableau de bord</h2>
            <p>Bienvenue, {collabName}.</p>
          </div>
          <div className="card">
            <div className="card-head">
              <div><h2>Votre espace</h2><div className="hint">Aucune information supplémentaire pour le moment</div></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`admin-root${dark ? ' dark' : ''}`}>
      <div className="app app-horizontal">
        <nav className="topnav">
          <div className="topnav-left">
            <EspritLogo full />
            <div className="topnav-links">
              {NAV_TABS.map((item) => {
                const IconCmp = Icon[item.icon]
                const showBadge = item.page === 'taches' && tachesEnCoursCount > 0
                return (
                  <a
                    key={item.page}
                    href="#"
                    className={activePage === item.page ? 'active' : ''}
                    onClick={(e) => { e.preventDefault(); setActivePage(item.page) }}
                  >
                    <IconCmp />
                    {item.label}
                    {showBadge && <span className="badge">{tachesEnCoursCount}</span>}
                  </a>
                )
              })}
            </div>
          </div>
          <div className="topnav-right">
            <select
              className="select-chip"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(e.target.value)}
              title="Filtrer par année universitaire"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
            >
              {ANNEE_OPTIONS.map((a) => <option key={a} value={a}>{a.replace('/', ' / ')}</option>)}
            </select>
            <select
              className="select-chip"
              value={filtreSemestre}
              onChange={(e) => setFiltreSemestre(e.target.value)}
              title="Filtrer par semestre"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
            >
              {SEMESTRE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <NotificationBell onNavigate={setActivePage} />
            <div className="role-chip-inline">COLLABORATEUR</div>
            <div className="avatar sm" title="Se déconnecter" style={{ cursor: 'pointer' }} onClick={logout}>{initials(collabName)}</div>
          </div>
        </nav>

        <main className="main">
          <div className="content">
            {activePage === 'taches' && (
              <MesTachesHub
                showToast={showToast}
                taches={taches}
                loading={tachesLoading}
                savingId={savingId}
                changerStatut={changerStatutTache}
                currentUserId={user?.id}
                demandesCount={demandesCount}
                filtreAnnee={filtreAnnee}
                filtreSemestre={filtreSemestre}
              />
            )}
            {activePage === 'horsequipe' && <ActivitesHorsEquipe showToast={showToast} />}
            {activePage === 'voeux-pedagogiques' && <VoeuxPedagogiquesCollab showToast={showToast} />}
            {activePage === 'activite-ecole' && (
              <>
                <MonActiviteEcole showToast={showToast} />
                <div style={{ marginTop: 24 }}>
                  <ActiviteEcoleTousLesCollegues showToast={showToast} />
                </div>
              </>
            )}
            {activePage === 'profil' && (
              <MonProfil user={user} showToast={showToast} dark={dark} onToggleDark={toggleDark} updateUser={updateUser} />
            )}
          </div>
        </main>
      </div>

      <div className={`toast${toastMsg ? ' show' : ''}`}>
        <span>{toastMsg}</span>
      </div>
    </div>
  )
}

/* ================= MES TÂCHES — vue d'ensemble (3 onglets) =================
   Consolide, en lecture seule, les 3 volets de l'implication du collaborateur :
   ses tâches, ses demandes hors-équipe et son activité école — filtrables par
   année/semestre. La saisie elle-même (nouvelle demande, nouvelle activité)
   reste sur les pages dédiées de la barre de navigation. */
const MES_TACHES_SOUS_ONGLETS = [
  { key: 'mes-taches', label: 'Mes tâches' },
  { key: 'horsequipe', label: 'Demandes hors-équipe' },
  { key: 'activite-ecole', label: 'Activité école' },
]

function MesTachesHub({ showToast, taches, loading, savingId, changerStatut, currentUserId, demandesCount, filtreAnnee, filtreSemestre }) {
  const [sousOnglet, setSousOnglet] = useState('mes-taches')

  return (
    <>
      <div className="page-head">
        <h2>Mes tâches</h2>
        <p>Vue d'ensemble de votre implication : tâches assignées, demandes hors-équipe et activité école.</p>
      </div>
      <div className="tab-pills" style={{ marginBottom: 18 }}>
        {MES_TACHES_SOUS_ONGLETS.map((o) => (
          <button
            key={o.key}
            type="button"
            className={`tab-pill ${sousOnglet === o.key ? 'active' : ''}`}
            onClick={() => setSousOnglet(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {sousOnglet === 'mes-taches' && (
        <MesTaches
          showToast={showToast}
          taches={taches}
          loading={loading}
          savingId={savingId}
          changerStatut={changerStatut}
          currentUserId={currentUserId}
          demandesCount={demandesCount}
          filtreAnnee={filtreAnnee}
          filtreSemestre={filtreSemestre}
        />
      )}
      {sousOnglet === 'horsequipe' && (
        <DemandesApercu showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
      )}
      {sousOnglet === 'activite-ecole' && (
        <ActiviteEcoleApercu showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
      )}
    </>
  )
}

/* ---------- Onglet "Demandes hors-équipe" de Mes tâches (lecture seule) ----------
   Même liste que la page "Activités hors-équipe", sans le formulaire de saisie —
   la soumission d'une nouvelle demande se fait uniquement depuis cette page dédiée. */
function DemandesApercu({ showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [demandes, setDemandes] = useState([])

  useEffect(() => {
    getMesDemandes()
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de vos demandes') })
      .finally(() => setLoading(false))
  }, [showToast])

  const demandesFiltrees = demandes.filter((d) => estDansPeriode(d.date_reception, filtreAnnee, filtreSemestre))

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Demandes hors-équipe</h2>
          <div className="hint">
            {loading ? 'Chargement…' : `${demandesFiltrees.length} demande${demandesFiltrees.length > 1 ? 's' : ''} sur la période sélectionnée`}
          </div>
        </div>
      </div>
      <div className="list">
        {demandesFiltrees.map((d) => {
          const meta = demandeStatutMeta(d.statut)
          return (
            <div className="list-item" key={d.id_demande}>
              <div className="body">
                <div className="title">{d.description}</div>
                <div className="desc">
                  {d.statut === 'validee' && d.date_validation
                    ? `Validée le ${formatDateShortFr(d.date_validation)}`
                    : d.statut === 'refusee'
                      ? 'Refusée'
                      : relativeDays(d.date_reception)}
                </div>
              </div>
              <span className={`badge ${meta.cls}`}>{meta.label}</span>
            </div>
          )
        })}
        {!loading && demandesFiltrees.length === 0 && (
          <div className="list-item"><div className="body"><div className="desc">Aucune demande sur cette période</div></div></div>
        )}
      </div>
    </div>
  )
}

/* ---------- Onglet "Activité école" de Mes tâches (lecture seule) ----------
   Résumé de sa propre activité école (les 7 catégories), filtré par année/semestre.
   La saisie se fait uniquement depuis la page dédiée "Activité école" (onglet "Mon
   activité école"). */
function ActiviteEcoleApercu({ showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState({
    expertises: [], encadrements: [],
    membre_jury: [], president_jury: [],
    formation_ete: [], formation_hiver: [], formation_printemps: [],
    evenement: [], comite_organisation: [],
  })

  useEffect(() => {
    getMonActiviteEcole()
      .then(setDetail)
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de votre activité école') })
      .finally(() => setLoading(false))
  }, [showToast])

  const sectionsFiltrees = Object.keys(ACTIVITE_LABELS).map((type) => ({
    type,
    list: (detail[type] || []).filter((a) => estDansPeriode(a.date_activite, filtreAnnee, filtreSemestre)),
  }))
  const totalFiltre = sectionsFiltrees.reduce((sum, s) => sum + s.list.length, 0)

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Activité école</h2>
          <div className="hint">{loading ? 'Chargement…' : `${totalFiltre} entrée${totalFiltre > 1 ? 's' : ''} sur la période sélectionnée`}</div>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '0 20px 20px', color: 'var(--text-faint)' }}>Chargement…</div>
      ) : (
        <div className="ae-body">
          {sectionsFiltrees.filter((s) => s.list.length > 0).map(({ type, list }) => {
            const { icon: sectionIcon, color: sectionColor } = ACTIVITE_ICONS[type]
            return (
              <div className="ae-section" key={type}>
                <div className="ae-section-head">
                  <div className={`ae-icon ${sectionColor}`}>{sectionIcon}</div>
                  <h3>{ACTIVITE_LABELS[type]}</h3>
                  <span className="ae-count">{list.length}</span>
                </div>
                <div className="ae-list">
                  {list.map((a) => (
                    <div key={a.id_activite} className="ae-row">
                      <div className="ae-row-main">
                        <div className="title">{a.titre}</div>
                        {type === 'evenement' && a.role && <span className="ae-date-chip">{a.role}</span>}
                        {a.date_activite && <span className="ae-date-chip"><Icon.calendar />{formatDateShortFr(a.date_activite)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {totalFiltre === 0 && <div className="ae-empty" style={{ padding: '0 20px 20px' }}>Aucune activité sur cette période</div>}
        </div>
      )}
    </div>
  )
}

/* ================= MES TÂCHES (branché à l'API des tâches) ================= */
// Un collaborateur pouvant appartenir à plusieurs sous-équipes, un filtre par
// équipe est proposé au-dessus de la liste.
function MesTaches({ showToast, taches, loading, savingId, changerStatut, currentUserId, demandesCount, filtreAnnee, filtreSemestre }) {
  const [equipeFiltre, setEquipeFiltre] = useState('toutes')
  // Ligne d'édition ouverte pour préciser le membre concerné (statut "Problème de coordination")
  const [coordEdit, setCoordEdit] = useState(null) // { id, value }
  // Cache des membres par sous-équipe, pour remplir le menu déroulant "membre concerné"
  const [membresParEquipe, setMembresParEquipe] = useState({})
  const [membresLoading, setMembresLoading] = useState(false)

  const equipes = Array.from(new Set(taches.map((t) => t.sous_equipe_nom).filter(Boolean))).sort()

  // Le filtre Année/Semestre du haut de page s'applique en plus du filtre par équipe.
  // Les tâches sans période enregistrée (anciennes données, avant migration) restent
  // visibles quel que soit le filtre, pour ne rien faire disparaître silencieusement.
  const tachesFiltrees = taches
    .filter((t) => equipeFiltre === 'toutes' || t.sous_equipe_nom === equipeFiltre)
    .filter((t) => !t.annee_universitaire || t.annee_universitaire === filtreAnnee)
    .filter((t) => !t.semestre || t.semestre === filtreSemestre)

  const enCours = taches.filter((t) => t.statut === 'en_cours').length
  const validees = taches.filter((t) => t.statut === 'validee').length

  const chargerMembres = useCallback((idSousEquipe) => {
    if (!idSousEquipe || membresParEquipe[idSousEquipe]) return
    setMembresLoading(true)
    getMembresSousEquipe(idSousEquipe)
      .then((data) => setMembresParEquipe((prev) => ({ ...prev, [idSousEquipe]: Array.isArray(data) ? data : [] })))
      .catch((err) => { console.error(err); showToast("Erreur lors du chargement des membres de l'équipe") })
      .finally(() => setMembresLoading(false))
  }, [membresParEquipe, showToast])

  const onChangeStatut = (t, value) => {
    if (value === 'probleme_coordination') {
      setCoordEdit({ id: t.id_tache, idSousEquipe: t.id_sous_equipe, value: t.membre_concerne || '' })
      chargerMembres(t.id_sous_equipe)
      return
    }
    setCoordEdit((prev) => (prev?.id === t.id_tache ? null : prev))
    changerStatut(t.id_tache, value)
  }

  const confirmerCoordination = (id) => {
    const membre = (coordEdit?.value || '').trim()
    if (!membre) { showToast('Veuillez préciser le membre concerné'); return }
    changerStatut(id, 'probleme_coordination', membre)
    setCoordEdit(null)
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 760 }}>
        <div className="kpi"><div className="top"><div className="icon-wrap blue"><Icon.clock /></div></div><div className="num">{enCours}</div><div className="label">Tâches en cours</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap green"><Icon.task /></div></div><div className="num">{validees}</div><div className="label">Tâches réalisées</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap red"><Icon.requests /></div></div><div className="num">{demandesCount}</div><div className="label">Activités hors-équipe</div></div>
      </div>
      <div className="card">
        <div className="card-head">
          <div><h2>Mes tâches</h2><div className="hint">{loading ? 'Chargement…' : `${tachesFiltrees.length} tâche${tachesFiltrees.length > 1 ? 's' : ''} assignée${tachesFiltrees.length > 1 ? 's' : ''}`}</div></div>
          {equipes.length > 0 && (
            <select
              className="status-select"
              value={equipeFiltre}
              onChange={(e) => setEquipeFiltre(e.target.value)}
              title="Filtrer par sous-équipe"
            >
              <option value="toutes">Toutes les équipes</option>
              {equipes.map((nom) => <option key={nom} value={nom}>{nom}</option>)}
            </select>
          )}
        </div>
        <div className="list">
          {tachesFiltrees.map((t) => {
            const isEditingCoord = coordEdit?.id === t.id_tache
            const membresEquipe = (membresParEquipe[t.id_sous_equipe] || []).filter((m) => m.id_collaborateur !== currentUserId)
            return (
              <div className="list-item" key={t.id_tache} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div className="body">
                    <div className="title">{t.titre}</div>
                    {t.description && <div className="desc">{t.description}</div>}
                    <div className="meta">
                      {t.date_echeance && <span>Échéance : {formatDateShortFr(t.date_echeance)}</span>}
                      {t.priorite && <span className={`badge ${t.priorite}`}>{PRIORITE_LABELS[t.priorite] || 'Moyenne'}</span>}
                      {t.sous_equipe_nom && <span>{t.sous_equipe_nom}</span>}
                      {t.statut === 'a_refaire' && <span className="badge nonrealisee">À refaire</span>}
                      {t.statut === 'probleme_coordination' && t.membre_concerne && (
                        <span>Membre concerné : {t.membre_concerne}</span>
                      )}
                    </div>
                  </div>
                  <select
                    className="status-select"
                    value={isEditingCoord ? 'probleme_coordination' : (t.statut === 'a_faire' ? '' : t.statut)}
                    disabled={savingId === t.id_tache}
                    onChange={(e) => onChangeStatut(t, e.target.value)}
                  >
                    {t.statut === 'a_faire' && !isEditingCoord && <option value="" disabled>À faire</option>}
                    {TACHE_STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                {isEditingCoord && (
                  <div className="coord-field open" style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                    <select
                      value={coordEdit.value}
                      onChange={(e) => setCoordEdit({ ...coordEdit, value: e.target.value })}
                      style={{ flex: 1, width: 'auto' }}
                      disabled={membresLoading}
                      autoFocus
                    >
                      <option value="" disabled>
                        {membresLoading ? 'Chargement des membres…' : 'Choisir le membre concerné'}
                      </option>
                      {membresEquipe.map((m) => (
                        <option key={m.id_collaborateur} value={m.nom}>{m.nom}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => confirmerCoordination(t.id_tache)}>Confirmer</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCoordEdit(null)}>Annuler</button>
                  </div>
                )}
              </div>
            )
          })}
          {!loading && tachesFiltrees.length === 0 && (
            <div className="list-item"><div className="body"><div className="desc">Aucune tâche assignée pour le moment</div></div></div>
          )}
        </div>
      </div>
    </>
  )
}

/* ================= ACTIVITÉS HORS-ÉQUIPE (branché à l'API des demandes) ================= */
function ActivitesHorsEquipe({ showToast }) {
  const [loading, setLoading] = useState(true)
  const [demandes, setDemandes] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [description, setDescription] = useState('')
  const [contexte, setContexte] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [contact, setContact] = useState('')

  const refresh = useCallback(() => (
    getMesDemandes()
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de vos demandes') })
      .finally(() => setLoading(false))
  ), [showToast])

  useEffect(() => { refresh() }, [refresh])

  const soumettre = async () => {
    if (!description.trim()) { showToast('La description est requise'); return }
    setSubmitting(true)
    try {
      await creerDemande({
        description: description.trim(),
        contexte: contexte.trim() || null,
        date_debut: dateDebut || null,
        date_fin: dateFin || null,
        contact_responsable: contact.trim() || null,
      })
      setDescription(''); setContexte(''); setDateDebut(''); setDateFin(''); setContact('')
      await refresh()
      showToast('Demande soumise pour validation ✓')
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la soumission de la demande')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Activités hors-équipe</h2>
        <p>Déclarez une intervention, collaboration, publication ou séminaire réalisé en dehors de votre sous-équipe. La demande est transmise à l'administration pour vérification.</p>
      </div>
      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Nouvelle activité hors-équipe</h2><div className="hint">Intervention externe, collaboration, publication, séminaire…</div></div></div>
            <div className="form-grid">
              <div className="field full">
                <label>Description</label>
                <input type="text" placeholder="Ex. Intervention lors du séminaire IEEE Tunisie" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="field">
                <label>Contexte</label>
                <input type="text" placeholder="Ex. Partenariat institution externe" value={contexte} onChange={(e) => setContexte(e.target.value)} />
              </div>
              <div className="field">
                <label>Contact du responsable (vérification)</label>
                <input type="email" placeholder="responsable@institution.tn" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div className="field">
                <label>Date de début</label>
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div className="field">
                <label>Date de fin</label>
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </div>
              <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="button" disabled={submitting} onClick={soumettre}>
                  {submitting ? 'Envoi…' : 'Soumettre pour validation'}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-head">
              <div><h2>Mes demandes</h2><div className="hint">{loading ? 'Chargement…' : `${demandes.length} demande${demandes.length > 1 ? 's' : ''}`}</div></div>
            </div>
            <div className="list">
              {demandes.map((d) => {
                const meta = demandeStatutMeta(d.statut)
                return (
                  <div className="list-item" key={d.id_demande}>
                    <div className="body">
                      <div className="title">{d.description}</div>
                      <div className="desc">
                        {d.statut === 'validee' && d.date_validation
                          ? `Validée le ${formatDateShortFr(d.date_validation)}`
                          : d.statut === 'refusee'
                            ? 'Refusée'
                            : relativeDays(d.date_reception)}
                      </div>
                    </div>
                    <span className={`badge ${meta.cls}`}>{meta.label}</span>
                  </div>
                )
              })}
              {!loading && demandes.length === 0 && (
                <div className="list-item"><div className="body"><div className="desc">Aucune demande pour le moment</div></div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= VŒUX PÉDAGOGIQUES (questionnaire admin -> collaborateur) =================
   Le questionnaire à 8 questions fixes envoyé par l'admin sur les préférences
   de modules à enseigner. */
const VP_Q = {
  q1: 'Veuillez indiquer vos préférences quant aux modules que vous souhaitez enseigner',
  q2: 'Souhaitez-vous enseigner les modules offerts dans le cadre de la formation en alternance ?',
  q3: 'Si oui, veuillez choisir le(s) module(s)',
  q4: 'Souhaitez-vous enseigner les modules offerts pour la classe internationale (enseignée en anglais) ?',
  q5: 'Si oui, veuillez choisir le(s) module(s)',
  q6: 'Souhaitez-vous avoir des heures supplémentaires ?',
  q7: "Si oui, veuillez préciser le nombre d'heures",
  q8: 'Souhaitez-vous mentionner autre chose ? (facultatif)',
}

function ModulePicker({ items, selected, onToggle, disabled, empty }) {
  if (!items || items.length === 0) {
    return <div className="hint">{empty || 'Aucun module proposé pour le moment.'}</div>
  }
  return (
    <div>
      {items.map((m) => {
        const isSelected = selected.includes(m)
        return (
          <div
            key={m}
            className={`vow-chip${isSelected ? ' selected' : ''}`}
            onClick={() => !disabled && onToggle(m)}
            style={disabled ? { cursor: 'default', opacity: 0.75 } : undefined}
          >
            <div className="left"><span className="rank">{isSelected ? '✓' : ''}</span>{m}</div>
          </div>
        )
      })}
    </div>
  )
}

function OuiNonToggle({ value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        type="button"
        className={`btn ${value === 'oui' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
        disabled={disabled}
        onClick={() => onChange('oui')}
      >Oui</button>
      <button
        type="button"
        className={`btn ${value === 'non' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
        disabled={disabled}
        onClick={() => onChange('non')}
      >Non</button>
    </div>
  )
}

function VoeuxPedagogiquesCollab({ showToast }) {
  const [loading, setLoading] = useState(true)
  const [campagne, setCampagne] = useState(null)
  const [reponse, setReponse] = useState(null)
  const [affectations, setAffectations] = useState([])
  const [modulesSouhaites, setModulesSouhaites] = useState([])
  const [alternance, setAlternance] = useState('')
  const [modulesAlternance, setModulesAlternance] = useState([])
  const [international, setInternational] = useState('')
  const [modulesInternational, setModulesInternational] = useState([])
  const [heuresSup, setHeuresSup] = useState('')
  const [nbHeuresSup, setNbHeuresSup] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  // Le formulaire ne reste ouvert que tant qu'il n'y a pas encore de réponse
  // enregistrée ; une fois envoyé, on repasse en résumé (bouton "Modifier"
  // pour le rouvrir), au lieu de laisser le formulaire visible en permanence.
  const [editing, setEditing] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    return Promise.all([getMonQuestionnaireVoeuxPedagogiques(), getMesAffectationsVoeuxPedagogiques().catch(() => [])])
      .then(([data, mesAffectations]) => {
        const c = data?.campagne || null
        const r = data?.reponse || null
        setCampagne(c)
        setReponse(r)
        setEditing(!r)
        setAffectations(Array.isArray(mesAffectations) ? mesAffectations : [])
        setModulesSouhaites(r?.modules_souhaites || [])
        setAlternance(r?.alternance || '')
        setModulesAlternance(r?.modules_alternance || [])
        setInternational(r?.international || '')
        setModulesInternational(r?.modules_international || [])
        setHeuresSup(r?.heures_sup || '')
        setNbHeuresSup(r?.nb_heures_sup != null ? String(r.nb_heures_sup) : '')
        setCommentaire(r?.commentaire || '')
      })
      .catch((err) => { console.error(err); showToast?.('Erreur lors du chargement du questionnaire') })
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { load() }, [load])

  const toggleIn = (setter) => (value) => (
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  )

  const submit = () => {
    if (!campagne) return
    if (!alternance) { showToast?.("Merci de répondre à la question sur l'alternance"); return }
    if (!international) { showToast?.('Merci de répondre à la question sur la classe internationale'); return }
    if (!heuresSup) { showToast?.('Merci de répondre à la question sur les heures supplémentaires'); return }
    if (heuresSup === 'oui' && (!nbHeuresSup || Number(nbHeuresSup) <= 0)) {
      showToast?.("Merci de préciser un nombre d'heures supplémentaires valide")
      return
    }
    setSaving(true)
    saveMaReponseVoeuxPedagogiques({
      id_campagne: campagne.id_campagne,
      modules_souhaites: modulesSouhaites,
      alternance,
      modules_alternance: alternance === 'oui' ? modulesAlternance : [],
      international,
      modules_international: international === 'oui' ? modulesInternational : [],
      heures_sup: heuresSup,
      nb_heures_sup: heuresSup === 'oui' ? Number(nbHeuresSup) : null,
      commentaire,
    })
      .then(() => { showToast?.('Réponses enregistrées ✓'); load() })
      .catch((err) => { console.error(err); showToast?.(err.response?.data?.message || "Erreur lors de l'enregistrement") })
      .finally(() => setSaving(false))
  }

  if (loading) {
    return (
      <div className="page-head">
        <h2>Vœux pédagogiques</h2>
        <p>Chargement…</p>
      </div>
    )
  }

  const VP_TYPE_LABELS = {
    normal: 'Cours normal',
    alternance: 'Alternance',
    international: 'Classe internationale',
    autre: 'Autre',
  }

  // Si le niveau n'a pas été enregistré séparément, on le retrouve dans le nom
  // du module (format "Module[Niveau]" tel que configuré par l'admin).
  const niveauAffichage = (a) => {
    if (a.niveau) return a.niveau
    const m = /^(.*)\[(.+)\]\s*$/.exec(a.module || '')
    return m ? m[2].trim() : '—'
  }

  const VP_TYPE_BADGE = {
    normal: 'vp-normal',
    alternance: 'vp-alternance',
    international: 'vp-international',
    autre: 'vp-autre',
  }

  const affectationsParType = affectations.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {})

  const affectationsCard = affectations.length > 0 && (
    <div className="card affectations-card">
      <div className="card-head">
        <div>
          <h2>Mes affectations</h2>
          <div className="hint">{affectations.length} affectation{affectations.length > 1 ? 's' : ''}</div>
        </div>
        <div className="affectations-summary">
          {Object.entries(affectationsParType).map(([type, count]) => (
            <span key={type} className={`badge ${VP_TYPE_BADGE[type] || 'vp-autre'}`}>
              {count} · {VP_TYPE_LABELS[type] || type}
            </span>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Type</th>
              <th>Niveau</th>
              <th>Classes</th>
            </tr>
          </thead>
          <tbody>
            {affectations.map((a) => (
              <tr key={a.id_affectation}>
                <td>
                  <div className="module-cell">
                    <span className="module-dot" aria-hidden="true">{(a.module || '?').trim().charAt(0).toUpperCase()}</span>
                    <span className="module-name">{(a.module || '').replace(/\s*\[.+\]\s*$/, '')}</span>
                  </div>
                </td>
                <td><span className={`badge ${VP_TYPE_BADGE[a.type] || 'vp-autre'}`}>{VP_TYPE_LABELS[a.type] || a.type || '—'}</span></td>
                <td>{niveauAffichage(a)}</td>
                <td>
                  {(a.classes || []).length > 0
                    ? (a.classes || []).map((c) => <span key={c} className="classe-chip">{c}</span>)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (!campagne) {
    return (
      <>
        <div className="page-head">
          <h2>Vœux pédagogiques</h2>
          <p>Aucun questionnaire n'est ouvert pour le moment. Revenez plus tard.</p>
        </div>
        {affectationsCard}
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <h2>Vœux pédagogiques</h2>
        <p>
          {reponse
            ? (editing
              ? 'Vous pouvez modifier vos réponses tant que le questionnaire reste ouvert.'
              : 'Vos réponses ont bien été envoyées.')
            : 'Répondez aux questions ci-dessous. Vous pourrez modifier vos réponses tant que le questionnaire reste ouvert.'}
        </p>
      </div>

      {affectationsCard}

      {reponse && !editing && (
        <div className="card">
          <div className="card-head"><div><h2>Mes réponses</h2><div className="hint">Envoyées — vous pouvez encore les modifier tant que le questionnaire reste ouvert.</div></div></div>
          <div className="reponses-grid">
            <div className="reponse-item full">
              <div className="reponse-label">Q1 — Modules souhaités</div>
              <div className="reponse-value">
                {modulesSouhaites.length > 0
                  ? modulesSouhaites.map((m) => <span key={m} className="classe-chip">{m}</span>)
                  : <span className="reponse-empty">Aucun</span>}
              </div>
            </div>
            <div className="reponse-item">
              <div className="reponse-label">Q2 — Alternance</div>
              <div className="reponse-value">
                <span className={`pill-ouinon ${alternance === 'oui' ? 'oui' : 'non'}`}>{alternance === 'oui' ? 'Oui' : 'Non'}</span>
                {alternance === 'oui' && modulesAlternance.length > 0 && (
                  <div className="reponse-detail">{modulesAlternance.join(', ')}</div>
                )}
              </div>
            </div>
            <div className="reponse-item">
              <div className="reponse-label">Q4 — Classe internationale</div>
              <div className="reponse-value">
                <span className={`pill-ouinon ${international === 'oui' ? 'oui' : 'non'}`}>{international === 'oui' ? 'Oui' : 'Non'}</span>
                {international === 'oui' && modulesInternational.length > 0 && (
                  <div className="reponse-detail">{modulesInternational.join(', ')}</div>
                )}
              </div>
            </div>
            <div className="reponse-item">
              <div className="reponse-label">Q6 — Heures supplémentaires</div>
              <div className="reponse-value">
                <span className={`pill-ouinon ${heuresSup === 'oui' ? 'oui' : 'non'}`}>{heuresSup === 'oui' ? `Oui — ${nbHeuresSup}h` : 'Non'}</span>
              </div>
            </div>
            {commentaire && (
              <div className="reponse-item full">
                <div className="reponse-label">Q8 — Autre chose</div>
                <div className="reponse-value reponse-comment">{commentaire}</div>
              </div>
            )}
          </div>
          <div style={{ padding: '4px 20px 18px' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Modifier mes réponses</button>
          </div>
        </div>
      )}

      {editing && (
        <>
          <div className="card">
            <div className="card-head"><div><h2>Q1 — Modules souhaités</h2><div className="hint">{VP_Q.q1}</div></div></div>
            <div style={{ padding: '0 20px 16px' }}>
              <ModulePicker items={campagne.choix_modules} selected={modulesSouhaites} onToggle={toggleIn(setModulesSouhaites)} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2>Q2 — Alternance</h2><div className="hint">{VP_Q.q2}</div></div></div>
            <div style={{ padding: '0 20px 16px' }}><OuiNonToggle value={alternance} onChange={(v) => { setAlternance(v); if (v === 'non') setModulesAlternance([]) }} /></div>
            {alternance === 'oui' && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                <div className="hint" style={{ margin: '14px 0 8px' }}>Q3 — {VP_Q.q3}</div>
                <ModulePicker items={campagne.choix_modules_alternance} selected={modulesAlternance} onToggle={toggleIn(setModulesAlternance)} empty="Aucun module d'alternance proposé pour le moment." />
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><div><h2>Q4 — Classe internationale</h2><div className="hint">{VP_Q.q4}</div></div></div>
            <div style={{ padding: '0 20px 16px' }}><OuiNonToggle value={international} onChange={(v) => { setInternational(v); if (v === 'non') setModulesInternational([]) }} /></div>
            {international === 'oui' && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                <div className="hint" style={{ margin: '14px 0 8px' }}>Q5 — {VP_Q.q5}</div>
                <ModulePicker items={campagne.choix_modules_international} selected={modulesInternational} onToggle={toggleIn(setModulesInternational)} empty="Aucun module international proposé pour le moment." />
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><div><h2>Q6 — Heures supplémentaires</h2><div className="hint">{VP_Q.q6}</div></div></div>
            <div style={{ padding: '0 20px 16px' }}><OuiNonToggle value={heuresSup} onChange={(v) => { setHeuresSup(v); if (v === 'non') setNbHeuresSup('') }} /></div>
            {heuresSup === 'oui' && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                <div className="field" style={{ maxWidth: 220, marginTop: 14 }}>
                  <label>Q7 — {VP_Q.q7}</label>
                  <input type="number" min="1" value={nbHeuresSup} onChange={(e) => setNbHeuresSup(e.target.value)} placeholder="Nombre d'heures" />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><div><h2>Q8 — Autre chose ?</h2><div className="hint">{VP_Q.q8}</div></div></div>
            <div className="field full" style={{ padding: '0 20px 16px' }}>
              <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Facultatif…" />
            </div>
          </div>

          <div className="card">
            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {reponse && <button type="button" className="btn btn-ghost btn-sm" onClick={() => load()}>Annuler</button>}
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={submit}>
                {saving ? 'Enregistrement…' : (reponse ? 'Mettre à jour mes réponses' : 'Envoyer mes réponses')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

/* ================= MON PROFIL (branché à l'API : identité, sous-équipes, responsable,
   dernier score et préférences persistées) ================= */
function MonProfil({ user, showToast, dark, onToggleDark, updateUser }) {
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(null) // 'notifications_email' | 'profil_visible' | null

  const name = profil?.nom || user?.nom || 'Collaborateur'
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
    setProfil((p) => ({ ...p, [key]: nextValue })) // optimiste
    setSavingPref(key)
    try {
      const updated = await updateMesPreferences({ [key]: nextValue })
      // Fusion avec l'état existant (et non remplacement) : si la réponse ne renvoie pas
      // certains champs (ex. dernier_score), on ne veut pas les perdre côté UI.
      setProfil((p) => ({ ...p, ...updated }))
    } catch (err) {
      console.error(err)
      setProfil((p) => ({ ...p, [key]: !nextValue })) // rollback
      showToast?.("Erreur lors de la mise à jour de vos préférences")
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

  const score = profil?.dernier_score
  const scoreLabel = score
    ? `${score.equipe_nom || 'Équipe'} · ${score.semestre === 'S1' ? 'Semestre 1' : 'Semestre 2'} ${score.annee_universitaire}`
    : "Aucune évaluation calculée pour le moment"

  return (
    <>
      <div className="card">
        <div className="profile-hero">
          <div className="avatar">{initials(name)}</div>
          <div style={{ flex: 1 }}>
            <div className="pname">{name}</div>
            <div className="prole">Collaborateur{email ? ` · ${email}` : ''}</div>
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
          <>
            {email && <div className="info-row"><span className="k">Email</span><span className="v">{email}</span></div>}
            <div className="info-row"><span className="k">Sous-équipes</span><span className="v">{loading ? '…' : (profil?.sous_equipes || '—')}</span></div>
            <div className="info-row"><span className="k">Responsable</span><span className="v">{loading ? '…' : (profil?.responsables || '—')}</span></div>
          </>
        )}
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Mon score</h2><div className="hint">{loading ? 'Chargement…' : scoreLabel}</div></div></div>
            <div className="rank-row">
              <span className="rk">—</span>
              <div className="body" style={{ flex: 1 }}><div className="title">Score final</div></div>
              <span className="score">{score ? `${score.score}/20` : '—/20'}</span>
            </div>
          </div>

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
              <div><div className="t">Visibilité du profil</div><div className="d">Visible par les responsables de sous-équipe</div></div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={!!profil?.profil_visible}
                  disabled={loading || savingPref !== null}
                  onChange={() => togglePref('profil_visible')}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <div><div className="t">Mode sombre</div><div className="d">Adapte l'interface pour une utilisation en faible luminosité</div></div>
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

/* ================= MON ACTIVITÉ ÉCOLE (collaborateur) ================= */
function MonActiviteEcole({ showToast }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState({
    expertises: [], encadrements: [],
    membre_jury: [], president_jury: [],
    formation_ete: [], formation_hiver: [], formation_printemps: [],
    evenement: [], comite_organisation: [],
  })
  // Formulaire ouvert dans une carte modale : 'expertise', 'encadrement', ou l'une des
  // clés de ACTIVITE_LABELS (membre_jury, evenement...). null = aucun formulaire ouvert.
  const [openForm, setOpenForm] = useState(null)

  const refresh = useCallback(() => (
    getMonActiviteEcole()
      .then(setDetail)
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de votre activité') })
      .finally(() => setLoading(false))
  ), [showToast])

  useEffect(() => { refresh() }, [refresh])

  /* ---------- Expertises ---------- */
  const [expertiseInput, setExpertiseInput] = useState('')
  const [savingExpertise, setSavingExpertise] = useState(false)

  const submitExpertise = async () => {
    if (!expertiseInput.trim()) return
    setSavingExpertise(true)
    try {
      await addMonExpertise(expertiseInput.trim())
      setExpertiseInput('')
      await refresh()
      showToast('Expertise ajoutée ✓')
      setOpenForm(null)
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
      showToast('Expertise retirée ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'expertise")
    }
  }

  /* ---------- Encadrements ---------- */
  const [encNom, setEncNom] = useState('')
  const [encSujet, setEncSujet] = useState('')
  const [encType, setEncType] = useState('pfe')
  const [encAnnee, setEncAnnee] = useState('')
  const [savingEnc, setSavingEnc] = useState(false)

  const submitEncadrement = async () => {
    if (!encNom.trim()) { showToast("Le nom de l'étudiant est requis"); return }
    setSavingEnc(true)
    try {
      await addMonEncadrement({
        nom_etudiant: encNom.trim(),
        sujet: encSujet.trim() || null,
        type: encType,
        annee_universitaire: encAnnee.trim() || null,
      })
      setEncNom(''); setEncSujet(''); setEncAnnee('')
      await refresh()
      showToast('Encadrement ajouté ✓')
      setOpenForm(null)
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'ajout de l'encadrement")
    } finally {
      setSavingEnc(false)
    }
  }

  const removeEncadrementItem = async (id) => {
    try {
      await deleteMonEncadrement(id)
      await refresh()
      showToast('Encadrement retiré ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'encadrement")
    }
  }

  /* ---------- Jury / Formations / Événements / Comités (même structure, type variable) ---------- */
  const [activiteForms, setActiviteForms] = useState(
    Object.fromEntries(Object.keys(ACTIVITE_LABELS).map((type) => [type, { titre: '', role: '', date_activite: '' }]))
  )
  const [savingActivite, setSavingActivite] = useState(null)

  const setActiviteField = (type, field, value) => {
    setActiviteForms((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }))
  }

  const submitActivite = async (type) => {
    const form = activiteForms[type]
    if (!form.titre.trim()) { showToast('Le titre est requis'); return }
    setSavingActivite(type)
    try {
      await addMonActiviteAcademique({
        type,
        titre: form.titre.trim(),
        role: type === 'evenement' ? (form.role.trim() || null) : null,
        date_activite: form.date_activite || null,
      })
      setActiviteForms((prev) => ({ ...prev, [type]: { titre: '', role: '', date_activite: '' } }))
      await refresh()
      showToast('Activité ajoutée ✓')
      setOpenForm(null)
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'ajout de l'activité")
    } finally {
      setSavingActivite(null)
    }
  }

  const removeActiviteItem = async (id) => {
    try {
      await deleteMonActiviteAcademique(id)
      await refresh()
      showToast('Activité retirée ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'activité")
    }
  }

  const encTypeLabel = { pfe: 'PFE', stage: 'Stage', mini_projet: 'Mini-projet', autre: 'Autre' }

  return (
    <div className="card">
      <div className="card-head">
        <div><h2>Mon activité école</h2><div className="hint">{loading ? 'Chargement…' : 'Gérez vos expertises, encadrements et implication académique'}</div></div>
      </div>

      {loading ? (
        <div style={{ padding: '0 20px 20px', color: 'var(--text-faint)' }}>Chargement…</div>
      ) : (
        <div className="ae-body">

          {/* ---------- Expertises ---------- */}
          <div className="ae-section">
            <div className="ae-section-head">
              <div className="ae-icon amber"><Icon.eval /></div>
              <h3>Expertises</h3>
              <span className="ae-count">{detail.expertises.length}</span>
              <button className="ae-add-btn" type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpenForm('expertise')}>+ Ajouter</button>
            </div>
            {detail.expertises.length === 0 ? (
              <div className="ae-empty">Aucune expertise renseignée</div>
            ) : (
              <div className="ae-chip-list">
                {detail.expertises.map((e) => (
                  <span key={e.id_expertise} className="ae-chip amber">
                    {e.libelle}
                    <button type="button" onClick={() => removeExpertiseItem(e.id_expertise)} title="Retirer"><Icon.removeX /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ---------- Étudiants encadrés ---------- */}
          <div className="ae-section">
            <div className="ae-section-head">
              <div className="ae-icon blue"><Icon.students /></div>
              <h3>Étudiants encadrés</h3>
              <span className="ae-count">{detail.encadrements.length}</span>
              <button className="ae-add-btn" type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpenForm('encadrement')}>+ Ajouter</button>
            </div>
            {detail.encadrements.length === 0 ? (
              <div className="ae-empty">Aucun étudiant encadré</div>
            ) : (
              <div className="ae-list">
                {detail.encadrements.map((enc) => (
                  <div key={enc.id_encadrement} className="ae-row">
                    <div className="ae-row-main">
                      <div className="ae-avatar">{initials(enc.nom_etudiant)}</div>
                      <div>
                        <div className="title">{enc.nom_etudiant}</div>
                        <div className="meta">
                          {enc.sujet ? `${enc.sujet} · ` : ''}
                          <span className={`badge ${enc.type === 'pfe' ? 'vp-normal' : enc.type === 'stage' ? 'vp-international' : enc.type === 'mini_projet' ? 'vp-alternance' : 'vp-autre'}`} style={{ marginRight: 0 }}>
                            {encTypeLabel[enc.type] || enc.type}
                          </span>
                          {enc.annee_universitaire ? ` · ${enc.annee_universitaire}` : ''}
                        </div>
                      </div>
                    </div>
                    <button className="ae-remove-btn" title="Retirer" onClick={() => removeEncadrementItem(enc.id_encadrement)}><Icon.removeX /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------- Jury / Formations / Événements / Comités ---------- */}
          {Object.keys(ACTIVITE_LABELS).map((type) => {
            const list = detail[type] || []
            const { icon: sectionIcon, color: sectionColor } = ACTIVITE_ICONS[type]
            return (
              <div className="ae-section" key={type}>
                <div className="ae-section-head">
                  <div className={`ae-icon ${sectionColor}`}>{sectionIcon}</div>
                  <h3>{ACTIVITE_LABELS[type]}</h3>
                  <span className="ae-count">{list.length}</span>
                  <button className="ae-add-btn" type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpenForm(type)}>+ Ajouter</button>
                </div>
                {list.length === 0 ? (
                  <div className="ae-empty">Aucune entrée</div>
                ) : (
                  <div className="ae-list">
                    {list.map((a) => (
                      <div key={a.id_activite} className="ae-row">
                        <div className="ae-row-main">
                          <div className="title">{a.titre}</div>
                          {type === 'evenement' && a.role && <span className="ae-date-chip">{a.role}</span>}
                          {a.date_activite && <span className="ae-date-chip"><Icon.calendar />{formatDateShortFr(a.date_activite)}</span>}
                        </div>
                        <button className="ae-remove-btn" title="Retirer" onClick={() => removeActiviteItem(a.id_activite)}><Icon.removeX /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {openForm === 'expertise' && (
        <div className="modal-overlay" onClick={() => !savingExpertise && setOpenForm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Ajouter une expertise</h2></div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpenForm(null)}>Fermer</button>
              </div>
              <div className="form-grid">
                <div className="field full">
                  <label>Expertise</label>
                  <input type="text" placeholder="Ex. Intelligence artificielle" value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} autoFocus />
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingExpertise} onClick={() => setOpenForm(null)}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingExpertise} onClick={submitExpertise}>
                    {savingExpertise ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {openForm === 'encadrement' && (
        <div className="modal-overlay" onClick={() => !savingEnc && setOpenForm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Ajouter un étudiant encadré</h2></div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpenForm(null)}>Fermer</button>
              </div>
              <div className="form-grid">
                <div className="field full">
                  <label>Nom de l'étudiant</label>
                  <input type="text" value={encNom} onChange={(e) => setEncNom(e.target.value)} autoFocus />
                </div>
                <div className="field">
                  <label>Sujet (optionnel)</label>
                  <input type="text" value={encSujet} onChange={(e) => setEncSujet(e.target.value)} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={encType} onChange={(e) => setEncType(e.target.value)}>
                    <option value="pfe">PFE</option>
                    <option value="stage">Stage</option>
                    <option value="mini_projet">Mini-projet</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="field">
                  <label>Année universitaire</label>
                  <input type="text" placeholder="Ex. 2025/2026" value={encAnnee} onChange={(e) => setEncAnnee(e.target.value)} />
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingEnc} onClick={() => setOpenForm(null)}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingEnc} onClick={submitEncadrement}>
                    {savingEnc ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {openForm && ACTIVITE_LABELS[openForm] && (
        <div className="modal-overlay" onClick={() => savingActivite !== openForm && setOpenForm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Ajouter — {ACTIVITE_LABELS[openForm]}</h2></div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpenForm(null)}>Fermer</button>
              </div>
              <div className="form-grid">
                <div className="field full">
                  <label>Titre</label>
                  <input type="text" value={activiteForms[openForm].titre} onChange={(e) => setActiviteField(openForm, 'titre', e.target.value)} autoFocus />
                </div>
                {openForm === 'evenement' && (
                  <div className="field full">
                    <label>Votre rôle</label>
                    <input type="text" placeholder="Ex. Intervenant, Organisateur" value={activiteForms[openForm].role} onChange={(e) => setActiviteField(openForm, 'role', e.target.value)} />
                  </div>
                )}
                <div className="field full">
                  <label>Date</label>
                  <input type="date" value={activiteForms[openForm].date_activite} onChange={(e) => setActiviteField(openForm, 'date_activite', e.target.value)} />
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingActivite === openForm} onClick={() => setOpenForm(null)}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingActivite === openForm} onClick={() => submitActivite(openForm)}>
                    {savingActivite === openForm ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Petit composant partagé : cellule "premier item + N autres" avec bouton détail ---------- */
function CellLibelle({ items, onOpenDetail }) {
  const list = items || []
  if (list.length === 0) {
    return <span style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>—</span>
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 170 }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5 }} title={list.map((i) => i.titre).join(', ')}>
        {list[0].titre}{list.length > 1 ? ` +${list.length - 1}` : ''}
      </span>
      <button className="icon-btn sm" title="Voir la liste" onClick={() => onOpenDetail(list)} style={{ width: 22, height: 22, flexShrink: 0 }}><Icon.eye /></button>
    </div>
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

/* ================= ACTIVITÉ ÉCOLE — TOUS LES COLLÈGUES (collaborateur, lecture seule) =================
   Même contenu, mêmes colonnes que la page admin "Activité école" : chaque collègue voit
   l'implication de tous les autres (expertises, encadrements, jury, formations, événements,
   comités), mais ne peut modifier que sa propre page "Mon activité école". */
function ActiviteEcoleTousLesCollegues({ showToast }) {
  const [professeurs, setProfesseurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [categoryModal, setCategoryModal] = useState(null) // { title, items }

  useEffect(() => {
    getProfesseurs()
      .then((data) => setProfesseurs(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement des collègues') })
      .finally(() => setLoading(false))
  }, [showToast])

  const filtered = professeurs.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="card">
      <div className="card-head">
        <div><h2>Activité école — tous les collègues</h2><div className="hint">{loading ? 'Chargement…' : `${professeurs.length} collaborateurs · consultez l'implication de chacun`}</div></div>
      </div>
      <div className="toolbar">
        <div className="search">
          <Icon.search />
          <input type="text" placeholder="Rechercher un collègue…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Collègue</th>
              <th>Étudiants encadrés</th>
              <th>Expertises</th>
              <th>Membre de jury</th>
              <th>Président de jury</th>
              <th>Formation d'été</th>
              <th>Formation d'hiver</th>
              <th>Formation de printemps</th>
              <th>Événements</th>
              <th>Comités</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><div className="name-cell"><div className="avatar sm">{initials(p.nom)}</div><span className="n">{p.nom}</span></div></td>
                <td>{p.nb_etudiants_encadres}</td>
                <td><CellLibelle items={p.expertises} onOpenDetail={(items) => setCategoryModal({ title: `Expertises — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.membre_jury} onOpenDetail={(items) => setCategoryModal({ title: `Membre de jury — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.president_jury} onOpenDetail={(items) => setCategoryModal({ title: `Président de jury — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.formation_ete} onOpenDetail={(items) => setCategoryModal({ title: `Formation d'été — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.formation_hiver} onOpenDetail={(items) => setCategoryModal({ title: `Formation d'hiver — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.formation_printemps} onOpenDetail={(items) => setCategoryModal({ title: `Formation de printemps — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.evenement} onOpenDetail={(items) => setCategoryModal({ title: `Événements — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.comite_organisation} onOpenDetail={(items) => setCategoryModal({ title: `Comités — ${p.nom}`, items })} /></td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="icon-btn sm" title="Voir le détail" onClick={() => setSelected(p)}><Icon.eye /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucun collègue trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <CollegueDetail
          professeur={selected}
          onClose={() => setSelected(null)}
          showToast={showToast}
        />
      )}
      {categoryModal && (
        <CategoryListModal
          title={categoryModal.title}
          items={categoryModal.items}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </div>
  )
}

function CollegueDetail({ professeur, onClose, showToast }) {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>{professeur.nom}</h2><div className="hint">Vue d'ensemble — lecture seule</div></div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: 'var(--text-faint)' }}>Chargement…</div>
          ) : (
            <div className="form-grid">
              <div className="field full">
                <label>Expertises ({detail.expertises.length})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {detail.expertises.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucune expertise renseignée</span>}
                  {detail.expertises.map((e) => (
                    <span key={e.id_expertise} className="role-pill">{e.libelle}</span>
                  ))}
                </div>
              </div>

              <div className="field full">
                <label>Étudiants encadrés ({detail.encadrements.length})</label>
                <div style={{ marginTop: 4 }}>
                  {detail.encadrements.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucun étudiant encadré</span>}
                  {detail.encadrements.map((enc) => (
                    <div key={enc.id_encadrement} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <b>{enc.nom_etudiant}</b>
                        <span style={{ color: 'var(--text-faint)', fontSize: 12, marginLeft: 8 }}>
                          {enc.sujet ? `${enc.sujet} · ` : ''}{enc.type}{enc.annee_universitaire ? ` · ${enc.annee_universitaire}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(ACTIVITE_LABELS).map((type) => {
                const list = detail[type] || []
                return (
                  <div className="field full" key={type}>
                    <label>{ACTIVITE_LABELS[type]} ({list.length})</label>
                    <div style={{ marginTop: 4 }}>
                      {list.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucune entrée</span>}
                      {list.map((a) => (
                        <div key={a.id_activite} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <b>{a.titre}</b>
                            {type === 'evenement' && a.role && <span style={{ color: 'var(--text-faint)', fontSize: 12, marginLeft: 8 }}>· Rôle : {a.role}</span>}
                            {a.date_activite && <span style={{ color: 'var(--text-faint)', fontSize: 12, marginLeft: 8 }}>{formatDateShortFr(a.date_activite)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollaborateurDashboard