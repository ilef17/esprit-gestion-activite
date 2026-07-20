# Application de Gestion des Activités & Analyse de Performance

Projet 31 - ESPRIT (Encadrante: Mme Sana Abbes)

## Stack
- Frontend: React (Vite)
- Backend: Node.js / Express
- Base de données: MySQL

## Lancer le projet en local

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # puis renseigner tes identifiants MySQL
# créer la base avec schema.sql (dans MySQL Workbench / phpMyAdmin / CLI)
npm run dev
```
Backend disponible sur http://localhost:5000

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend disponible sur http://localhost:5173 (proxy /api -> backend automatique)

## Structure
```
arp-project/
├── frontend/       # App React (Vite)
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/  # appels API (axios)
├── backend/        # API Express
│   ├── config/     # connexion DB
│   ├── models/     # requêtes SQL
│   ├── controllers/
│   ├── routes/
│   └── schema.sql  # structure de la base
```

## Authentification (Login / Signup)

Le login et le signup sont fonctionnels et connectés au schéma `esprittech` :

- **Login** (`/login`) : sélection du rôle (Collaborateur / Responsable / Admin) + identifiant (email ou identifiant ESPRIT) + mot de passe. Retourne un JWT stocké en `localStorage`.
- **Signup** (`/signup`) : création de compte Collaborateur ou Responsable (l'Admin est créé uniquement en base). Pour un Collaborateur, sélection dynamique des sous-équipes (chargées depuis `/api/sous-equipes`).
- Les mots de passe sont hashés avec **bcrypt**, jamais stockés en clair.
- Compte admin de test créé par `schema.sql` : email `admin@esprit.tn`, mot de passe `admin123` (à changer après le premier login).

⚠️ Le schéma `esprittech.sql` fourni n'avait pas de colonnes mot de passe / identifiant pour `collaborateur` et `responsable`. `schema.sql` les ajoute (`mot_de_passe`, `identifiant_esprit`).

## Prochaines étapes suggérées
- [ ] Espaces Admin / Responsable / Collaborateur (dashboards, KPIs) — les maquettes HTML les mentionnent mais ne les détaillent pas encore
- [ ] Assignation des Responsables aux sous-équipes par l'Admin
- [ ] Module "Analyse de Performance" (graphiques, dashboards)
- [ ] Déploiement / intégration éventuelle avec SharePoint si toujours requis
