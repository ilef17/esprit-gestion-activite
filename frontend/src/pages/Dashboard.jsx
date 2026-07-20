import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getMonActiviteEcole,
  addMonExpertise,
  deleteExpertise,
  addMonEncadrement,
  deleteMonEncadrement,
  addMonActiviteAcademique,
  deleteMonActiviteAcademique,
} from '../services/api.js'
import './admin/admin.css'

function formatDateShortFr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ACTIVITE_LABELS = {
  jury_soutenance: 'Jury de soutenance',
  evenement: 'Événement',
  comite_organisation: "Comité d'organisation",
}

function Dashboard() {
  const { user, role } = useAuth()
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  return (
    <div className="admin-root">
      <div className="content" style={{ padding: '28px 32px 60px' }}>
        <div className="page-head">
          <h2>Tableau de bord</h2>
          <p>Bienvenue, {user?.nom || ''}.</p>
        </div>

        {role === 'collaborateur' ? (
          <MonActiviteEcole showToast={showToast} />
        ) : (
          <div className="card">
            <div className="card-head">
              <div><h2>Votre espace</h2><div className="hint">Aucune information supplémentaire pour le moment</div></div>
            </div>
          </div>
        )}
      </div>

      <div className={`toast${toastMsg ? ' show' : ''}`}>
        <span>{toastMsg}</span>
      </div>
    </div>
  )
}

/* ================= MON ACTIVITÉ ÉCOLE (collaborateur) ================= */
function MonActiviteEcole({ showToast }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState({ expertises: [], encadrements: [], jury_soutenance: [], evenements: [], comites_organisation: [] })

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

  /* ---------- Jury / Événements / Comités (même structure, type variable) ---------- */
  const [activiteForms, setActiviteForms] = useState({
    jury_soutenance: { titre: '', date_activite: '' },
    evenement: { titre: '', date_activite: '' },
    comite_organisation: { titre: '', date_activite: '' },
  })
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
        date_activite: form.date_activite || null,
      })
      setActiviteForms((prev) => ({ ...prev, [type]: { titre: '', date_activite: '' } }))
      await refresh()
      showToast('Activité ajoutée ✓')
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

  return (
    <div className="card">
      <div className="card-head">
        <div><h2>Mon activité école</h2><div className="hint">{loading ? 'Chargement…' : 'Gérez vos expertises, encadrements et implication académique'}</div></div>
      </div>

      {loading ? (
        <div style={{ padding: '0 20px 20px', color: 'var(--text-faint)' }}>Chargement…</div>
      ) : (
        <div className="form-grid" style={{ padding: '0 20px 20px' }}>
          <div className="field full">
            <label>Expertises</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" placeholder="Ex. Intelligence artificielle" value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" type="button" disabled={savingExpertise} onClick={submitExpertise}>{savingExpertise ? 'Ajout…' : '+ Ajouter'}</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {detail.expertises.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucune expertise renseignée</span>}
              {detail.expertises.map((e) => (
                <span key={e.id_expertise} className="role-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {e.libelle}
                  <button type="button" onClick={() => removeExpertiseItem(e.id_expertise)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="field full">
            <label>Étudiants encadrés ({detail.encadrements.length})</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input type="text" placeholder="Nom de l'étudiant" value={encNom} onChange={(e) => setEncNom(e.target.value)} style={{ flex: '1 1 160px' }} />
              <input type="text" placeholder="Sujet (optionnel)" value={encSujet} onChange={(e) => setEncSujet(e.target.value)} style={{ flex: '1 1 160px' }} />
              <select value={encType} onChange={(e) => setEncType(e.target.value)} style={{ flex: '0 0 130px' }}>
                <option value="pfe">PFE</option>
                <option value="stage">Stage</option>
                <option value="mini_projet">Mini-projet</option>
                <option value="autre">Autre</option>
              </select>
              <input type="text" placeholder="Année (ex. 2025/2026)" value={encAnnee} onChange={(e) => setEncAnnee(e.target.value)} style={{ flex: '0 0 150px' }} />
              <button className="btn btn-ghost btn-sm" type="button" disabled={savingEnc} onClick={submitEncadrement}>{savingEnc ? 'Ajout…' : '+ Ajouter'}</button>
            </div>
            <div style={{ marginTop: 10 }}>
              {detail.encadrements.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucun étudiant encadré</span>}
              {detail.encadrements.map((enc) => (
                <div key={enc.id_encadrement} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <b>{enc.nom_etudiant}</b>
                    <span style={{ color: 'var(--text-faint)', fontSize: 12, marginLeft: 8 }}>
                      {enc.sujet ? `${enc.sujet} · ` : ''}{enc.type}{enc.annee_universitaire ? ` · ${enc.annee_universitaire}` : ''}
                    </span>
                  </div>
                  <button className="icon-btn sm" title="Retirer" onClick={() => removeEncadrementItem(enc.id_encadrement)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {['jury_soutenance', 'evenement', 'comite_organisation'].map((type) => {
            const list = type === 'jury_soutenance' ? detail.jury_soutenance : type === 'evenement' ? detail.evenements : detail.comites_organisation
            const form = activiteForms[type]
            return (
              <div className="field full" key={type}>
                <label>{ACTIVITE_LABELS[type]} ({list.length})</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Titre" value={form.titre} onChange={(e) => setActiviteField(type, 'titre', e.target.value)} style={{ flex: '1 1 180px' }} />
                  <input type="date" value={form.date_activite} onChange={(e) => setActiviteField(type, 'date_activite', e.target.value)} style={{ flex: '0 0 150px' }} />
                  <button className="btn btn-ghost btn-sm" type="button" disabled={savingActivite === type} onClick={() => submitActivite(type)}>{savingActivite === type ? 'Ajout…' : '+ Ajouter'}</button>
                </div>
                <div style={{ marginTop: 10 }}>
                  {list.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Aucune entrée</span>}
                  {list.map((a) => (
                    <div key={a.id_activite} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <b>{a.titre}</b>
                        {a.date_activite && <span style={{ color: 'var(--text-faint)', fontSize: 12, marginLeft: 8 }}>{formatDateShortFr(a.date_activite)}</span>}
                      </div>
                      <button className="icon-btn sm" title="Retirer" onClick={() => removeActiviteItem(a.id_activite)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Dashboard
