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
  validee: { bg: '#e7f8ef', text: '#1fae63' },
  en_cours: { bg: '#e8f1fd', text: '#2196f3' },
  a_faire: { bg: '#f2f2f2', text: '#666' },
  a_refaire: { bg: '#fff4e5', text: '#f5a623' },
  probleme_coordination: { bg: '#fdeaea', text: '#e4032e' },
  attente: { bg: '#fff4e5', text: '#f5a623' },
  envoye: { bg: '#e8f1fd', text: '#2196f3' },
  refusee: { bg: '#fdeaea', text: '#e4032e' },
}
function StatutBadge({ statut }) {
  const c = STATUT_COLORS[statut] || { bg: '#f2f2f2', text: '#666' }
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
  const color = pct >= 70 ? '#1fae63' : pct >= 40 ? '#f5a623' : '#e4032e'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#eee', overflow: 'hidden', minWidth: 50 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#444', width: 36 }}>{pct}%</span>
    </div>
  )
}

function SousCarte({ title, subtitle, children }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: '#888', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function GridTable({ columns, rows, renderRow, rowKey, emptyText }) {
  const template = columns.map((c) => c.width || 'minmax(80px, 1fr)').join(' ')
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: template, gap: 12, padding: '10px 18px', background: '#fafafa', borderBottom: '1px solid #eee' }}>
        {columns.map((c, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.03em', textAlign: c.align || 'left' }}>
            {c.label}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '16px 18px', color: '#999', fontSize: 13 }}>{emptyText}</div>
      ) : (
        rows.map((row, i) => (
          <div
            key={rowKey ? rowKey(row, i) : i}
            style={{
              display: 'grid', gridTemplateColumns: template, gap: 12, alignItems: 'center',
              padding: '12px 18px', borderBottom: '1px solid #f2f2f2',
              background: i % 2 === 1 ? '#fbfbfd' : '#fff',
            }}
          >
            {renderRow(row).map((cell, j) => (
              <div key={j} style={{ fontSize: 13.5, color: '#222', textAlign: columns[j].align || 'left' }}>{cell}</div>
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
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{valeur}</div>
      <div style={{ fontSize: 13, color: '#666' }}>{label}</div>
    </div>
  )
}

// scope : 'global' | 'collaborateur' | 'sous-equipe' | 'avancement' | 'mon-espace'
export default function StatsDashboard({ scope, annee, semestre }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const fetchers = {
      global: getDashboardVueGlobale,
      collaborateur: getDashboardParCollaborateur,
      'sous-equipe': getDashboardParSousEquipe,
      avancement: getDashboardEtatAvancement,
      'mon-espace': getDashboardMonEspace,
    }
    fetchers[scope](annee, semestre)
      .then(setData)
      .finally(() => setLoading(false))
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
            <span style={{ color: '#888' }}>{c.identifiant_esprit}</span>,
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
      <SousCarte title="Par sous-équipe" subtitle={`${data.length} sous-équipe${data.length > 1 ? 's' : ''}`}>
        <GridTable
          columns={[
            { label: 'Sous-équipe', width: '1.2fr' },
            { label: 'Responsable', width: '1.2fr' },
            { label: 'Total tâches', width: '110px', align: 'center' },
            { label: 'Taux', width: '140px' },
            { label: 'Nb collaborateurs', width: '140px', align: 'center' },
          ]}
          rows={data}
          rowKey={(se) => se.sous_equipe}
          emptyText="Aucune sous-équipe"
          renderRow={(se) => [
            <b>{se.sous_equipe}</b>,
            se.responsable,
            se.total_taches,
            <TauxBar valeur={se.taux_avancement} />,
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
              <span style={{ color: '#888', textTransform: 'capitalize' }}>{t.priorite}</span>,
              <span style={{ color: '#888' }}>{formatDate(t.date_echeance)}</span>,
            ]}
          />
        </SousCarte>

        <SousCarte title="Mes demandes hors-équipe" subtitle={`${data.mes_demandes.length} demande${data.mes_demandes.length > 1 ? 's' : ''}`}>
          <GridTable
            columns={[
              { label: 'Contexte', width: '1.6fr' },
              { label: 'Statut', width: '170px' },
              { label: 'Date de réception', width: '140px' },
            ]}
            rows={data.mes_demandes}
            rowKey={(d, i) => i}
            emptyText="Aucune demande hors-équipe"
            renderRow={(d) => [
              <b>{d.contexte}</b>,
              <StatutBadge statut={d.statut} />,
              <span style={{ color: '#888' }}>{formatDate(d.date_reception)}</span>,
            ]}
          />
        </SousCarte>
      </div>
    )
  }

  return null
}