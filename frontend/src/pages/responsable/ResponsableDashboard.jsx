import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import EspritLogo from '../../components/EspritLogo.jsx'
import NotificationBell from '../../components/NotificationBell.jsx'
import {
  getMesSousEquipes,
  getMembresSousEquipe,
  addMembreSousEquipe,
  removeMembreSousEquipe,
  getCollaborateursOptions,
  getTaches,
  createTache,
  updateTache,
  repartirTaches,
  getMonProfil,
  updateMesPreferences,
  updateMonProfilIdentite,
  changerMonMotDePasse,
} from '../../services/api.js'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
import './responsable.css'

/* ---------- small inline icon set (copied from the design template) ---------- */
const Icon = {
  dashboard: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>),
  teams: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.3"/></svg>),
  task: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>),
  trending: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M20 6 9 17l-5-5"/></svg>),
  cross: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 4h16v16H4z"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 5v14"/><path d="M5 12h14"/></svg>),
  trash: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>),
  profile: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>),
}

const PAGE_TITLES = {
  dashboard: 'Tableau de bord',
  'mon-equipe': 'Mon équipe',
  taches: 'Tâches',
  avancement: 'Avancement',
  profil: 'Mon profil',
}

// Le collaborateur choisit lui-même "En cours" / "Faite" / "Problème de coordination".
// Le responsable pilote en plus "Validée" et "À refaire" (cahier des charges) ; "Non
// réalisée" correspond au statut initial 'a_faire' posé à la création de la tâche.
const STATUT_OPTIONS = [
  { value: 'a_faire', label: 'Non réalisée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'validee', label: 'Validée' },
  { value: 'a_refaire', label: 'À refaire' },
]
const STATUT_LABELS = Object.fromEntries(STATUT_OPTIONS.map((s) => [s.value, s.label]))

const PRIORITE_OPTIONS = [
  { value: 'haute', label: 'Haute' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'basse', label: 'Basse' },
]
const PRIORITE_LABELS = Object.fromEntries(PRIORITE_OPTIONS.map((p) => [p.value, p.label]))

function initials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function formatDateShortFr(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// Statistiques d'un membre à partir de la liste des tâches de la sous-équipe.
function statsForMembre(idCollaborateur, taches) {
  const mine = taches.filter((t) => t.id_collaborateur === idCollaborateur)
  const total = mine.length
  const validees = mine.filter((t) => t.statut === 'validee').length
  const actives = mine.filter((t) => t.statut !== 'validee').length
  return { total, validees, actives, pct: total ? Math.round((validees / total) * 100) : 0 }
}

// Période "actuelle" par défaut pour le filtre — même règle que côté serveur et
// que les tableaux de bord admin/collaborateur (septembre→janvier = S1, février→août = S2).
function periodeParDefaut() {
  const now = new Date()
  const mois = now.getMonth() + 1
  const anneeDebut = mois >= 9 ? now.getFullYear() : now.getFullYear() - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}

export default function ResponsableDashboard() {
  const { user, logout, updateUser } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [toastMsg, setToastMsg] = useState(null)

  // Filtre Année / Semestre du tableau de bord — purement côté client, même
  // logique que les filtres équivalents des tableaux de bord admin et collaborateur.
  const defautPeriode = useMemo(periodeParDefaut, [])
  const [filtreAnnee, setFiltreAnnee] = useState(defautPeriode.annee)
  const [filtreSemestre, setFiltreSemestre] = useState(defautPeriode.semestre)

  const [equipes, setEquipes] = useState([])
  const [loadingEquipes, setLoadingEquipes] = useState(true)
  const [activeEquipeId, setActiveEquipeId] = useState(null)

  const [membres, setMembres] = useState([])
  const [loadingMembres, setLoadingMembres] = useState(true)

  const [taches, setTaches] = useState([])
  const [loadingTaches, setLoadingTaches] = useState(true)

  const [collaborateurs, setCollaborateurs] = useState([])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const refreshEquipes = useCallback(() => {
    setLoadingEquipes(true)
    return getMesSousEquipes()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setEquipes(list)
        setActiveEquipeId((prev) => (prev && list.some((e) => e.id === prev)) ? prev : (list[0]?.id || null))
      })
      .catch((err) => console.error('Erreur chargement sous-équipe:', err))
      .finally(() => setLoadingEquipes(false))
  }, [])

  const refreshCollaborateurs = useCallback(() => (
    getCollaborateursOptions()
      .then((data) => setCollaborateurs(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement collaborateurs:', err))
  ), [])

  useEffect(() => {
    refreshEquipes()
    refreshCollaborateurs()
  }, [refreshEquipes, refreshCollaborateurs])

  const refreshMembres = useCallback(() => {
    if (!activeEquipeId) { setMembres([]); return Promise.resolve() }
    setLoadingMembres(true)
    return getMembresSousEquipe(activeEquipeId)
      .then((data) => setMembres(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement membres:', err))
      .finally(() => setLoadingMembres(false))
  }, [activeEquipeId])

  const refreshTaches = useCallback(() => {
    if (!activeEquipeId) { setTaches([]); return Promise.resolve() }
    setLoadingTaches(true)
    return getTaches({ sous_equipe: activeEquipeId })
      .then((data) => setTaches(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement tâches:', err))
      .finally(() => setLoadingTaches(false))
  }, [activeEquipeId])

  useEffect(() => { refreshMembres() }, [refreshMembres])
  useEffect(() => { refreshTaches() }, [refreshTaches])

  const changerStatutTache = useCallback(async (id, statut) => {
    setTaches((prev) => prev.map((t) => (t.id_tache === id ? { ...t, statut } : t)))
    try {
      await updateTache(id, { statut })
      showToast('Statut mis à jour ✓')
      refreshEquipes()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut')
      refreshTaches()
    }
  }, [showToast, refreshTaches, refreshEquipes])

  // Mode sombre — persisté localement, appliqué en ajoutant/retirant la classe "dark"
  // sur le conteneur racine (toutes les couleurs sont des variables CSS sur .responsable-root).
  const [dark, setDark] = useState(() => localStorage.getItem('arp_theme') === 'dark')
  useEffect(() => {
    localStorage.setItem('arp_theme', dark ? 'dark' : 'light')
  }, [dark])
  const toggleDark = useCallback(() => setDark((d) => !d), [])

  const respoName = user?.nom || 'Responsable'
  const equipeActive = equipes.find((e) => e.id === activeEquipeId) || null

  const membresCount = membres.length
  // Le filtre Année/Semestre s'applique aux tâches affichées ; celles sans période
  // enregistrée (anciennes données) restent visibles quel que soit le filtre, pour
  // ne rien faire disparaître silencieusement (même logique que côté collaborateur).
  const tachesFiltrees = taches
    .filter((t) => !t.annee_universitaire || t.annee_universitaire === filtreAnnee)
    .filter((t) => !t.semestre || t.semestre === filtreSemestre)
  const tachesActives = tachesFiltrees.filter((t) => t.statut !== 'validee').length
  const tachesTerminees = tachesFiltrees.filter((t) => t.statut === 'validee').length
  const tachesEnRetard = tachesFiltrees.filter((t) => t.date_echeance && new Date(t.date_echeance) < new Date() && t.statut !== 'validee').length
  const tauxCompletion = tachesFiltrees.length ? Math.round((tachesFiltrees.filter((t) => t.statut === 'validee').length / tachesFiltrees.length) * 100) : 0

  return (
    <div className={`responsable-root${dark ? ' dark' : ''}`}>
      <div className="app">
        <aside className="sidebar">
          <EspritLogo full />
          <div className="role-chip">RESPONSABLE</div>

          <div className="nav-section-label">Équipe</div>
          <nav className="nav">
            <a href="#" className={activePage === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('dashboard') }}>
              <Icon.dashboard /> Tableau de bord
            </a>
            <a href="#" className={activePage === 'mon-equipe' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('mon-equipe') }}>
              <Icon.teams /> Mon équipe
            </a>
          </nav>

          <div className="nav-section-label">Activités</div>
          <nav className="nav">
            <a href="#" className={activePage === 'taches' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('taches') }}>
              <Icon.task /> Tâches
              {tachesActives > 0 && <span className="badge">{tachesActives}</span>}
            </a>
            <a href="#" className={activePage === 'avancement' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('avancement') }}>
              <Icon.trending /> Avancement
            </a>
          </nav>

          <div className="nav-section-label">Compte</div>
          <nav className="nav">
            <a href="#" className={activePage === 'profil' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('profil') }}>
              <Icon.profile /> Mon profil
            </a>
          </nav>

          <div className="sidebar-footer">
            <div className="profile-row" onClick={() => logout()} title="Se déconnecter">
              <div className="avatar">{initials(respoName)}</div>
              <div className="profile-meta"><div className="pname">{respoName}</div><div className="prole">Responsable sous-équipe</div></div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <div className="crumb">Intranet · {equipeActive ? `Sous-équipe ${equipeActive.nom}` : 'Sous-équipe'}</div>
              <h1>{PAGE_TITLES[activePage]}</h1>
            </div>
            <div className="top-controls">
              {equipes.length > 1 && (
                <select
                  className="select-chip"
                  value={activeEquipeId || ''}
                  onChange={(e) => setActiveEquipeId(Number(e.target.value))}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                >
                  {equipes.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
                </select>
              )}
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
              <NotificationBell onNavigate={setActivePage} />
              <div className="avatar sm">{initials(respoName)}</div>
            </div>
          </div>

          <div className="content">
            {activePage === 'profil' ? (
              <MonProfilResponsable user={user} showToast={showToast} updateUser={updateUser} dark={dark} onToggleDark={toggleDark} />
            ) : !loadingEquipes && equipes.length === 0 ? (
              <div className="page-head">
                <h2>Aucune sous-équipe assignée</h2>
                <p>Contactez le Super Admin pour vous voir attribuer la responsabilité d'une sous-équipe.</p>
              </div>
            ) : (
              <>
                {activePage === 'dashboard' && (
                  <DashboardHome
                    membres={membres}
                    taches={tachesFiltrees}
                    loadingTaches={loadingTaches}
                    membresCount={membresCount}
                    tachesActives={tachesActives}
                    tachesTerminees={tachesTerminees}
                    tachesEnRetard={tachesEnRetard}
                    tauxCompletion={tauxCompletion}
                    onChangerStatut={changerStatutTache}
                    onNavigate={setActivePage}
                  />
                )}
                {activePage === 'mon-equipe' && (
                  <MonEquipe
                    membres={membres}
                    loadingMembres={loadingMembres}
                    collaborateurs={collaborateurs}
                    taches={tachesFiltrees}
                    activeEquipeId={activeEquipeId}
                    showToast={showToast}
                    onChanged={() => { refreshMembres(); refreshEquipes() }}
                  />
                )}
                {activePage === 'taches' && (
                  <TachesPage
                    taches={tachesFiltrees}
                    loadingTaches={loadingTaches}
                    membres={membres}
                    activeEquipeId={activeEquipeId}
                    showToast={showToast}
                    onChangerStatut={changerStatutTache}
                    onChanged={() => { refreshTaches(); refreshEquipes() }}
                  />
                )}
                {activePage === 'avancement' && (
                  <Avancement membres={membres} taches={tachesFiltrees} tauxCompletion={tauxCompletion} />
                )}
              </>
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

/* ================= DASHBOARD ================= */
function DashboardHome({ membres, taches, loadingTaches, membresCount, tachesActives, tachesTerminees, tachesEnRetard, tauxCompletion, onChangerStatut, onNavigate }) {
  // Filtre local au tableau de bord : cliquer sur une carte "Tâches…" filtre la liste
  // "Tâches de l'équipe" ci-dessous sans quitter la page. Un second clic sur la même
  // carte réinitialise le filtre (bascule).
  const [filtreCarte, setFiltreCarte] = useState('toutes')
  const toggleFiltreCarte = (val) => setFiltreCarte((f) => (f === val ? 'toutes' : val))

  const tachesAffichees = taches.filter((t) => {
    if (filtreCarte === 'actives') return t.statut !== 'validee'
    if (filtreCarte === 'validees') return t.statut === 'validee'
    if (filtreCarte === 'retard') return t.date_echeance && new Date(t.date_echeance) < new Date() && t.statut !== 'validee'
    return true
  })
  const FILTRE_LABELS = { actives: 'Tâches actives', validees: 'Tâches terminées', retard: 'Tâches en retard' }

  return (
    <>
      <div className="kpi-grid kpi-grid-5">
        <div
          className="kpi clickable"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('mon-equipe')}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('mon-equipe') }}
          title="Voir mon équipe"
        >
          <div className="top"><div className="icon-wrap red"><Icon.teams /></div></div><div className="num">{membresCount}</div><div className="label">Membres de l'équipe</div>
        </div>
        <div
          className={`kpi clickable${filtreCarte === 'actives' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => toggleFiltreCarte('actives')}
          onKeyDown={(e) => { if (e.key === 'Enter') toggleFiltreCarte('actives') }}
          title="Filtrer sur les tâches actives"
        >
          <div className="top"><div className="icon-wrap blue"><Icon.task /></div></div><div className="num">{tachesActives}</div><div className="label">Tâches actives</div>
        </div>
        <div
          className={`kpi clickable${filtreCarte === 'validees' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => toggleFiltreCarte('validees')}
          onKeyDown={(e) => { if (e.key === 'Enter') toggleFiltreCarte('validees') }}
          title="Filtrer sur les tâches terminées"
        >
          <div className="top"><div className="icon-wrap green"><Icon.check /></div></div><div className="num">{tachesTerminees}</div><div className="label">Tâches terminées</div>
        </div>
        <div
          className={`kpi clickable${filtreCarte === 'retard' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => toggleFiltreCarte('retard')}
          onKeyDown={(e) => { if (e.key === 'Enter') toggleFiltreCarte('retard') }}
          title="Filtrer sur les tâches en retard"
        >
          <div className="top"><div className="icon-wrap amber"><Icon.clock /></div></div><div className="num">{tachesEnRetard}</div><div className="label">Tâches en retard</div>
        </div>
        <div className="kpi"><div className="top"><div className="icon-wrap green"><Icon.check /></div></div><div className="num">{tauxCompletion}%</div><div className="label">Taux de complétion</div></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Tâches de l'équipe</h2>
                <div className="hint">
                  {filtreCarte === 'toutes' ? 'Description, deadline, priorité et état' : `Filtré : ${FILTRE_LABELS[filtreCarte]}`}
                </div>
              </div>
              {filtreCarte !== 'toutes' && (
                <button className="btn btn-ghost btn-sm" onClick={() => setFiltreCarte('toutes')}>Réinitialiser</button>
              )}
            </div>
            <table>
              <thead><tr><th>Tâche</th><th>Assigné à</th><th>Priorité</th><th>Deadline</th><th>État</th></tr></thead>
              <tbody>
                {loadingTaches && <tr><td colSpan={5}>Chargement…</td></tr>}
                {!loadingTaches && tachesAffichees.length === 0 && <tr><td colSpan={5}>Aucune tâche dans ce filtre.</td></tr>}
                {tachesAffichees.slice(0, 6).map((t) => (
                  <tr key={t.id_tache}>
                    <td><b>{t.titre}</b></td>
                    <td>{t.collaborateur_nom
                      ? <div className="name-cell"><div className="avatar sm">{initials(t.collaborateur_nom)}</div><span className="n">{t.collaborateur_nom}</span></div>
                      : <span style={{ color: 'var(--text-faint)' }}>Non assignée</span>}
                    </td>
                    <td><span className={`badge ${t.priorite || 'moyenne'}`}>{PRIORITE_LABELS[t.priorite] || 'Moyenne'}</span></td>
                    <td>{formatDateShortFr(t.date_echeance)}</td>
                    <td>
                      <select className="status-select" value={t.statut} onChange={(e) => onChangerStatut(t.id_tache, e.target.value)}>

                        {STATUT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head"><div><h2>Membres</h2><div className="hint">{membres.length} collaborateur{membres.length > 1 ? 's' : ''} affecté{membres.length > 1 ? 's' : ''}</div></div></div>
            <div className="list">
              {membres.map((m) => {
                const stats = statsForMembre(m.id_collaborateur, taches)
                return (
                  <div className="list-item" key={m.id_collaborateur}>
                    <div className="avatar sm">{initials(m.nom)}</div>
                    <div className="body"><div className="title">{m.nom}</div><div className="desc">{stats.actives} tâche{stats.actives > 1 ? 's' : ''} active{stats.actives > 1 ? 's' : ''}</div></div>
                    <div className="progress-row" style={{ minWidth: 70 }}>
                      <div className="progress-track"><div className={`progress-fill${stats.pct >= 50 ? ' green' : ''}`} style={{ width: `${stats.pct}%` }}></div></div>
                    </div>
                  </div>
                )
              })}
              {membres.length === 0 && <div style={{ padding: 20, color: 'var(--text-muted)' }}>Aucun membre affecté pour le moment.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= MON ÉQUIPE ================= */
function MonEquipe({ membres, loadingMembres, collaborateurs, taches, activeEquipeId, showToast, onChanged }) {
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)

  const dejaMembres = new Set(membres.map((m) => m.id_collaborateur))
  const suggestions = query.trim().length
    ? collaborateurs.filter((c) => !dejaMembres.has(c.id_collaborateur) && c.nom.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : []

  const ajouter = async (c) => {
    setBusyId(c.id_collaborateur)
    try {
      await addMembreSousEquipe(activeEquipeId, c.id_collaborateur)
      showToast(`${c.nom} ajouté à l'équipe ✓`)
      setQuery('')
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || "Erreur lors de l'ajout du membre")
    } finally {
      setBusyId(null)
    }
  }

  const retirer = async (m) => {
    setBusyId(m.id_collaborateur)
    try {
      await removeMembreSousEquipe(activeEquipeId, m.id_collaborateur)
      showToast(`${m.nom} retiré de l'équipe`)
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors du retrait du membre')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Mon équipe</h2>
        <p>Affectez des membres à votre sous-équipe et suivez leur charge de travail actuelle.</p>
      </div>
      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head">
              <div><h2>Membres affectés</h2><div className="hint">{membres.length} collaborateur{membres.length > 1 ? 's' : ''}</div></div>
            </div>
            <table>
              <thead><tr><th>Collaborateur</th><th>Tâches actives</th><th>Charge</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {loadingMembres && <tr><td colSpan={5}>Chargement…</td></tr>}
                {!loadingMembres && membres.length === 0 && <tr><td colSpan={5}>Aucun membre affecté pour le moment.</td></tr>}
                {membres.map((m) => {
                  const stats = statsForMembre(m.id_collaborateur, taches)
                  return (
                    <tr key={m.id_collaborateur}>
                      <td><div className="name-cell"><div className="avatar sm">{initials(m.nom)}</div><span className="n">{m.nom}</span></div></td>
                      <td>{stats.actives}</td>
                      <td><div className="progress-row"><div className="progress-track"><div className={`progress-fill${stats.pct >= 50 ? ' green' : ''}`} style={{ width: `${stats.pct}%` }}></div></div><span>{stats.pct}%</span></div></td>
                      <td><span className={`dot ${m.actif ? 'on' : 'off'}`}></span>{m.actif ? 'Actif' : 'Inactif'}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" disabled={busyId === m.id_collaborateur} onClick={() => retirer(m)}>
                          <Icon.trash /> Retirer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Affecter un membre</h2></div></div>
            <div className="form-grid">
              <div className="field full">
                <label>Collaborateur</label>
                <input type="text" placeholder="Rechercher un collaborateur…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {suggestions.length > 0 && (
                <div className="field full">
                  <div className="list">
                    {suggestions.map((c) => (
                      <div className="list-item" key={c.id_collaborateur}>
                        <div className="avatar sm">{initials(c.nom)}</div>
                        <div className="body"><div className="title">{c.nom}</div><div className="desc">{c.email}</div></div>
                        <button className="btn btn-primary btn-sm" disabled={busyId === c.id_collaborateur} onClick={() => ajouter(c)}>
                          <Icon.plus /> Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {query.trim().length > 0 && suggestions.length === 0 && (
                <div className="field full" style={{ color: 'var(--text-muted)' }}>Aucun collaborateur correspondant (ou déjà dans l'équipe).</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= TÂCHES ================= */
function TachesPage({ taches, loadingTaches, membres, activeEquipeId, showToast, onChangerStatut, onChanged }) {
  const [filter, setFilter] = useState('toutes')
  const [showForm, setShowForm] = useState(false)
  const [repartition, setRepartition] = useState(null)
  const [repartitionEnCours, setRepartitionEnCours] = useState(false)

  const tachesFiltrees = taches.filter((t) => {
    if (filter === 'toutes') return true
    if (filter === 'en_cours') return t.statut === 'en_cours'
    if (filter === 'validees') return t.statut === 'validee'
    if (filter === 'a_refaire') return t.statut === 'a_refaire'
    // Même définition que la carte KPI "Tâches en retard" du tableau de bord :
    // échéance dépassée et tâche pas encore validée.
    if (filter === 'retard') return t.date_echeance && new Date(t.date_echeance) < new Date() && t.statut !== 'validee'
    return true
  })

  const tachesNonAssignees = taches.filter((t) => !t.id_collaborateur).length

  const lancerRepartition = async () => {
    setRepartitionEnCours(true)
    try {
      const data = await repartirTaches(activeEquipeId)
      setRepartition(data)
      showToast(`${data.total_taches_reparties} tâche(s) réparties équitablement ✓`)
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la répartition')
    } finally {
      setRepartitionEnCours(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Tâches</h2>
        <p>Créez des tâches sans les assigner, puis répartissez-les équitablement entre les membres selon leur nombre de classes — pas de favoritisme.</p>
      </div>
      <div className="card">
        <div className="card-head">
          <div><h2>Toutes les tâches</h2><div className="hint">{taches.length} tâche{taches.length > 1 ? 's' : ''}{tachesNonAssignees > 0 ? ` · ${tachesNonAssignees} non assignée${tachesNonAssignees > 1 ? 's' : ''}` : ''}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={lancerRepartition}
              disabled={tachesNonAssignees === 0 || repartitionEnCours}
              title="Répartit les tâches non assignées entre les membres, proportionnellement à leur nombre de classes"
            >
              {repartitionEnCours ? 'Répartition…' : 'Répartir équitablement'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Icon.plus /> Créer une tâche</button>
          </div>
        </div>
        <div className="tab-bar">
          <button className={filter === 'toutes' ? 'active' : ''} onClick={() => setFilter('toutes')}>Toutes</button>
          <button className={filter === 'en_cours' ? 'active' : ''} onClick={() => setFilter('en_cours')}>En cours</button>
          <button className={filter === 'validees' ? 'active' : ''} onClick={() => setFilter('validees')}>Validées</button>
          <button className={filter === 'a_refaire' ? 'active' : ''} onClick={() => setFilter('a_refaire')}>À refaire</button>
          <button className={filter === 'retard' ? 'active' : ''} onClick={() => setFilter('retard')}>En retard</button>
        </div>
        <table>
          <thead><tr><th>Tâche</th><th>Assignée à</th><th>Priorité</th><th>Deadline</th><th>État</th></tr></thead>
          <tbody>
            {loadingTaches && <tr><td colSpan={5}>Chargement…</td></tr>}
            {!loadingTaches && tachesFiltrees.length === 0 && <tr><td colSpan={5}>Aucune tâche dans ce filtre.</td></tr>}
            {tachesFiltrees.map((t) => (
              <tr key={t.id_tache}>
                <td><b>{t.titre}</b>{t.description && <div className="desc" style={{ marginTop: 4 }}>{t.description}</div>}</td>
                <td>{t.collaborateur_nom
                  ? <div className="name-cell"><div className="avatar sm">{initials(t.collaborateur_nom)}</div><span className="n">{t.collaborateur_nom}</span></div>
                  : <span style={{ color: 'var(--text-faint)' }}>Non assignée</span>}
                </td>
                <td><span className={`badge ${t.priorite || 'moyenne'}`}>{PRIORITE_LABELS[t.priorite] || 'Moyenne'}</span></td>
                <td>{formatDateShortFr(t.date_echeance)}</td>
                <td>
                  <select className="status-select" value={t.statut} onChange={(e) => onChangerStatut(t.id_tache, e.target.value)}>
                    {STATUT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {repartition && (
        <div className="modal-overlay" onClick={() => setRepartition(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setRepartition(null)} aria-label="Fermer">×</button>
            <div className="modal-title">Répartition effectuée</div>
            <div className="modal-sub">{repartition.total_taches_reparties} tâche(s) réparties selon le nombre de classes de chacun.</div>
            <table>
              <thead><tr><th>Collaborateur</th><th>Nb. classes</th><th>Tâches reçues</th></tr></thead>
              <tbody>
                {repartition.affectations.map((a) => (
                  <tr key={a.id_collaborateur}>
                    <td>{a.nom}</td>
                    <td>{a.nb_classes}</td>
                    <td>{a.nb_taches_assignees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <NouvelleTacheModal
          activeEquipeId={activeEquipeId}
          showToast={showToast}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); onChanged() }}
        />
      )}
    </>
  )
}

function NouvelleTacheModal({ activeEquipeId, showToast, onClose, onCreated }) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [priorite, setPriorite] = useState('moyenne')
  const [echeance, setEcheance] = useState('')
  const [saving, setSaving] = useState(false)

  const creerTache = async (e) => {
    e.preventDefault()
    if (!titre.trim()) { showToast('Le titre de la tâche est requis'); return }
    setSaving(true)
    try {
      await createTache({
        titre: titre.trim(),
        description: description.trim() || null,
        priorite,
        date_echeance: echeance || null,
        id_collaborateur: null,
        id_sous_equipe: activeEquipeId,
        statut: 'a_faire',
      })
      showToast('Tâche créée ✓ — utilisez "Répartir équitablement" pour l\'assigner')
      onCreated()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la création de la tâche')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <div className="modal-title">Nouvelle tâche</div>
        <div className="modal-sub">La tâche est créée sans assignation. Utilisez ensuite "Répartir équitablement" pour l'attribuer aux membres selon leur charge de classes.</div>
        <form className="form-grid" onSubmit={creerTache}>
          <div className="field full"><label>Titre</label><input type="text" placeholder="Ex. Maquette écran connexion" value={titre} onChange={(e) => setTitre(e.target.value)} /></div>
          <div className="field full"><label>Description</label><textarea placeholder="Décrire la tâche à réaliser…" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="field">
            <label>Priorité</label>
            <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
              {PRIORITE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="field full"><label>Date limite</label><input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} /></div>
          <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Création…' : 'Créer la tâche'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ================= AVANCEMENT ================= */
function Avancement({ membres, taches, tauxCompletion }) {
  const validees = taches.filter((t) => t.statut === 'validee').length
  const aRefaire = taches.filter((t) => t.statut === 'a_refaire').length
  const nonRealisees = taches.filter((t) => t.statut === 'a_faire').length

  const repartition = membres
    .map((m) => ({ ...m, ...statsForMembre(m.id_collaborateur, taches) }))
    .sort((a, b) => b.pct - a.pct)

  return (
    <>
      <div className="page-head">
        <h2>Avancement</h2>
        <p>Visualisez la répartition des tâches par membre et le taux d'avancement global de la sous-équipe.</p>
      </div>
      <div className="kpi-grid">
        <div className="kpi"><div className="top"><div className="icon-wrap green"><Icon.check /></div></div><div className="num">{validees}</div><div className="label">Tâches validées</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap amber"><Icon.clock /></div></div><div className="num">{aRefaire}</div><div className="label">À refaire</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap red"><Icon.cross /></div></div><div className="num">{nonRealisees}</div><div className="label">Non réalisées</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap blue"><Icon.trending /></div></div><div className="num">{tauxCompletion}%</div><div className="label">Taux de complétion</div></div>
      </div>
      <div className="card">
        <div className="card-head"><div><h2>Répartition par membre</h2><div className="hint">Part des tâches validées sur le total assigné</div></div></div>
        <div>
          {repartition.map((m) => (
            <div className="criteria-row" key={m.id_collaborateur}>
              <div className="top"><b>{m.nom}</b><span>{m.total ? `${m.pct}%` : 'Aucune tâche'}</span></div>
              <div className="progress-track"><div className={`progress-fill${m.pct >= 50 ? ' green' : ''}`} style={{ width: `${m.pct}%` }}></div></div>
            </div>
          ))}
          {repartition.length === 0 && <div style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Aucun membre affecté pour le moment.</div>}
        </div>
      </div>
    </>
  )
}

/* ================= MON PROFIL (responsable) ================= */
function MonProfilResponsable({ user, showToast, updateUser, dark, onToggleDark }) {
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(null) // 'notifications_email' | 'profil_visible' | null

  const name = profil?.nom || user?.nom || 'Responsable'
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

  return (
    <>
      <div className="card">
        <div className="profile-hero">
          <div className="avatar">{initials(name)}</div>
          <div style={{ flex: 1 }}>
            <div className="pname">{name}</div>
            <div className="prole">Responsable{email ? ` · ${email}` : ''}</div>
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
            <div className="info-row"><span className="k">Sous-équipes gérées</span><span className="v">{loading ? '…' : (profil?.sous_equipes || '—')}</span></div>
          </>
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
              <div><div className="t">Visibilité du profil</div><div className="d">Visible par le Super Admin</div></div>
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