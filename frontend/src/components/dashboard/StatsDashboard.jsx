import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  getDashboardVueGlobale,
  getDashboardParCollaborateur,
  getDashboardParSousEquipe,
  getDashboardEtatAvancement,
  getDashboardMonEspace,
} from '../../services/api.js'

const COULEURS = ['#0d1b6b', '#2196f3', '#e4032e', '#f5a623', '#8bc34a']

const STATUT_COLORS = {
  validee: { bg: 'var(--green-tint)', text: 'var(--green)' },
  en_cours: { bg: 'var(--blue-tint)', text: 'var(--blue)' },
  a_faire: { bg: 'var(--bg)', text: 'var(--text-muted)' },
  a_refaire: { bg: 'var(--amber-tint)', text: 'var(--amber)' },
  probleme_coordination: { bg: 'var(--red-tint)', text: 'var(--red)' },
  attente: { bg: 'var(--amber-tint)', text: 'var(--amber)' },
  envoye: { bg: 'var(--blue-tint)', text: 'var(--blue)' },
  refusee: { bg: 'var(--red-tint)', text: 'var(--red)' },
}
function StatutBadge({ statut }) {
  const c = STATUT_COLORS[statut] || { bg: 'var(--bg)', text: 'var(--text-muted)' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, background: c.bg, color: c.text,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {(statut || '').replace(/_/g, ' ')}
    </span>
  )
}

function TauxBar({ valeur }) {
  const v = Number(valeur) || 0
  const pct = Math.round(Math.max(0, Math.min(1, v)) * 100)
  const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', minWidth: 50 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', width: 36 }}>{pct}%</span>
    </div>
  )
}

function SousCarte({ title, subtitle, children }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ background: 'var(--card)' }}>{children}</div>
    </div>
  )
}

function GridTable({ columns, rows, renderRow, rowKey, emptyText }) {
  const template = columns.map((c) => c.width || 'minmax(80px, 1fr)').join(' ')
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: template, gap: 12, padding: '10px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        {columns.map((c, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.03em', textAlign: c.align || 'left' }}>
            {c.label}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '16px 18px', color: 'var(--text-faint)', fontSize: 13 }}>{emptyText}</div>
      ) : (
        rows.map((row, i) => (
          <div
            key={rowKey ? rowKey(row, i) : i}
            style={{
              display: 'grid', gridTemplateColumns: template, gap: 12, alignItems: 'center',
              padding: '12px 18px', borderBottom: '1px solid var(--border)',
              background: i % 2 === 1 ? 'var(--bg)' : 'var(--card)',
            }}
          >
            {renderRow(row).map((cell, j) => (
              <div key={j} style={{ fontSize: 13.5, color: 'var(--text)', textAlign: columns[j].align || 'left' }}>{cell}</div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Carte({ label, valeur }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', minWidth: 140, background: 'var(--card)' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{valeur}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

// scope : 'global' | 'collaborateur' | 'sous-equipe' | 'avancement' | 'mon-espace'
//
// Se tient à jour sans que l'utilisateur ait à recharger la page : un évènement global
// 'esprittech:data-changed' (émis par services/api.js après chaque création/modification/
// suppression, sur les 3 tableaux de bord) déclenche un rafraîchissement immédiat, et un
// sondage périodique (30s) rattrape les changements faits par d'autres utilisateurs.
const POLL_INTERVAL_MS = 30000

export default function StatsDashboard({ scope, annee, semestre }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchers = {
      global: getDashboardVueGlobale,
      collaborateur: getDashboardParCollaborateur,
      'sous-equipe': getDashboardParSousEquipe,
      avancement: getDashboardEtatAvancement,
      'mon-espace': getDashboardMonEspace,
    }

    let annule = false
    // premierChargement affiche "Chargement…" seulement au tout premier appel — les
    // rafraîchissements suivants (évènement ou sondage) remplacent les données en
    // silence, sans faire clignoter la page.
    let premierChargement = true
    const charger = () => {
      if (premierChargement) setLoading(true)
      return fetchers[scope](annee, semestre)
        .then((result) => { if (!annule) setData(result) })
        .finally(() => { if (!annule && premierChargement) { setLoading(false); premierChargement = false } })
    }

    charger()

    const onDataChanged = () => charger()
    window.addEventListener('esprittech:data-changed', onDataChanged)
    const intervalId = setInterval(charger, POLL_INTERVAL_MS)

    return () => {
      annule = true
      window.removeEventListener('esprittech:data-changed', onDataChanged)
      clearInterval(intervalId)
    }
  }, [scope, annee, semestre])

  if (loading) return <p>Chargement…</p>
  if (!data) return null

  if (scope === 'global') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <Carte label="Total Tâches" valeur={data.total_taches} />
          <Carte label="Taux d'Avancement" valeur={data.taux_avancement} />
          <Carte label="Tâches en Retard" valeur={data.taches_retard} />
          <Carte label="Nb Sous-équipes" valeur={data.nb_sous_equipes} />
          <Carte label="Tâches Validées" valeur={data.taches_validees} />
          <Carte label="Collaborateurs Actifs" valeur={data.collaborateurs_actifs} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data.par_statut} dataKey="total" nameKey="statut" outerRadius={100} innerRadius={60} label>
              {data.par_statut.map((_, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (scope === 'collaborateur') {
    return (
      <SousCarte title="Par collaborateur" subtitle={`${data.length} collaborateur${data.length > 1 ? 's' : ''}`}>
        <GridTable
          columns={[
            { label: 'Identifiant', width: '120px' },
            { label: 'Nom', width: '1.4fr' },
            { label: 'Total tâches', width: '110px', align: 'center' },
            { label: 'Validées', width: '90px', align: 'center' },
            { label: 'Taux', width: '140px' },
            { label: 'Score moyen', width: '110px', align: 'center' },
          ]}
          rows={data}
          rowKey={(c) => c.identifiant_esprit}
          emptyText="Aucun collaborateur"
          renderRow={(c) => [
            <span style={{ color: 'var(--text-muted)' }}>{c.identifiant_esprit}</span>,
            <b>{c.nom}</b>,
            c.total_taches,
            c.taches_validees,
            <TauxBar valeur={c.taux_avancement} />,
            c.score_moyen ?? '—',
          ]}
        />
      </SousCarte>
    )
  }

  if (scope === 'sous-equipe') {
    return (
      <SousCarte title="Par sous-équipe" subtitle={`${data.length} équipe${data.length > 1 ? 's' : ''} (UP + hors UP)`}>
        <GridTable
          columns={[
            { label: 'Sous-équipe', width: '1.1fr' },
            { label: 'Type', width: '90px' },
            { label: 'Responsable', width: '1.1fr' },
            { label: 'Total tâches', width: '110px', align: 'center' },
            { label: 'Taux', width: '140px' },
            { label: 'Nb collaborateurs', width: '140px', align: 'center' },
          ]}
          rows={data}
          rowKey={(se, i) => `${se.type}-${se.sous_equipe}-${i}`}
          emptyText="Aucune équipe"
          renderRow={(se) => [
            <b>{se.sous_equipe}</b>,
            <span style={{
              fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
              background: se.type === 'UP' ? 'var(--blue-tint)' : 'var(--bg)', color: se.type === 'UP' ? 'var(--blue)' : 'var(--text-muted)',
            }}>{se.type}</span>,
            se.responsable || '—',
            se.total_taches,
            se.taux_avancement == null ? <span style={{ color: 'var(--text-faint)' }}>—</span> : <TauxBar valeur={se.taux_avancement} />,
            se.nb_collaborateurs,
          ]}
        />
      </SousCarte>
    )
  }

  if (scope === 'avancement') {
    return (
      <div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.par_mois}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" /><YAxis /><Tooltip />
            <Bar dataKey="taches_validees" fill="#2196f3" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 16 }}>
          <SousCarte title="Tâches à venir" subtitle={`${data.a_venir.length} tâche${data.a_venir.length > 1 ? 's' : ''}`}>
            <GridTable
              columns={[
                { label: 'Titre', width: '1.3fr' },
                { label: 'Statut', width: '160px' },
                { label: 'Échéance', width: '110px' },
                { label: 'Collaborateur', width: '1fr' },
                { label: 'Sous-équipe', width: '1fr' },
              ]}
              rows={data.a_venir}
              rowKey={(t, i) => i}
              emptyText="Aucune tâche à venir"
              renderRow={(t) => [
                <b>{t.titre}</b>,
                <StatutBadge statut={t.statut} />,
                formatDate(t.date_echeance),
                t.collaborateur || '—',
                t.sous_equipe || '—',
              ]}
            />
          </SousCarte>
        </div>
      </div>
    )
  }

  if (scope === 'mon-espace') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <Carte label="Total Tâches" valeur={data.total_taches} />
          <Carte label="Tâches Validées" valeur={data.taches_validees} />
          <Carte label="Taux d'Avancement" valeur={data.taux_avancement} />
          <Carte label="Score Moyen" valeur={data.score_moyen} />
        </div>

        <SousCarte title="Mes tâches" subtitle={`${data.mes_taches.length} tâche${data.mes_taches.length > 1 ? 's' : ''}`}>
          <GridTable
            columns={[
              { label: 'Titre', width: '1.3fr' },
              { label: 'Statut', width: '170px' },
              { label: 'Priorité', width: '110px' },
              { label: 'Échéance', width: '110px' },
            ]}
            rows={data.mes_taches}
            rowKey={(t, i) => i}
            emptyText="Aucune tâche"
            renderRow={(t) => [
              <b>{t.titre}</b>,
              <StatutBadge statut={t.statut} />,
              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{t.priorite}</span>,
              <span style={{ color: 'var(--text-muted)' }}>{formatDate(t.date_echeance)}</span>,
            ]}
          />
        </SousCarte>

        <SousCarte title="Mes activités hors-équipe" subtitle={`${data.mes_demandes.length} activité${data.mes_demandes.length > 1 ? 's' : ''}`}>
          <GridTable
            columns={[
              { label: 'Titre', width: '1.6fr' },
              { label: 'Statut', width: '170px' },
              { label: 'Date de réception', width: '140px' },
            ]}
            rows={data.mes_demandes}
            rowKey={(d, i) => i}
            emptyText="Aucune activité hors-équipe"
            renderRow={(d) => [
              <b>{d.titre}</b>,
              <StatutBadge statut={d.statut} />,
              <span style={{ color: 'var(--text-muted)' }}>{formatDate(d.date_reception)}</span>,
            ]}
          />
        </SousCarte>
      </div>
    )
  }

  return null
}