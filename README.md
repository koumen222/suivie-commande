# Suivie Commande

Application complète pour suivre et éditer des commandes provenant d'un Google Sheet. Le projet est structuré en deux applications :

- `client/` : interface React (Vite + TypeScript + TailwindCSS + Zustand).
- `server/` : API Node/Express en TypeScript qui gère les connexions Google Sheets (lecture publique CSV ou via compte de service).

## Prérequis

- Node.js 18+
- npm 9+
- Un projet Google Cloud avec un compte de service si vous souhaitez activer l'écriture dans Google Sheets.

## Installation

```bash
npm install
```

Cette commande installe les dépendances du monorepo (client + server).

## Scripts utiles

```bash
# Lancer le client (http://localhost:5173) et le serveur (http://localhost:4000) en parallèle
npm run dev

# Lancer uniquement le client
npm run dev:client

# Lancer uniquement le serveur
npm run dev:server

# Construire les deux applications
npm run build

# Lancer l'API Express compilée
npm run start

# Lancer les linters
npm run lint

# Lancer les tests (client + serveur)
npm run test
```

## Configuration du serveur (`server/.env`)

Créez un fichier `server/.env` (non versionné) avec les variables suivantes :

```env
PORT=4000
GOOGLE_PROJECT_ID=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SHEET_RANGE=Feuille1!A:Z
```

> ⚠️ Remplacez les `\n` littéraux dans la clé privée par de vrais sauts de ligne ou laissez-les, le serveur les convertit automatiquement.

### Mode lecture seule (public CSV)

1. Ouvrez votre Google Sheet → `Fichier > Publier sur le Web`.
2. Copiez l'URL générée (`https://docs.google.com/spreadsheets/d/<SHEET_ID>/pub?output=csv`).
3. Collez ce lien dans l'application. La méthode détectée sera `public-csv` (édition désactivée).

### Mode lecture/écriture (Service Account)

1. Créez un compte de service sur Google Cloud Console.
2. Téléchargez la clé JSON et renseignez `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY` dans `.env`.
3. Partagez le Google Sheet avec l'adresse e-mail du compte de service (droit Éditeur).
4. Indiquez le `SHEET_RANGE` à lire/écrire (ex : `Feuille1!A:Z`).
5. Collez l'URL du sheet (ex : `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit#gid=0`). L'API utilisera le compte de service et autorisera l'édition inline.

## Endpoints API

| Méthode | URL | Description |
| --- | --- | --- |
| `POST` | `/api/sheets/parse-link` | Détecte le `sheetId`, la méthode (`public-csv` ou `service-account`) et le `gid` à partir de l'URL fournie. |
| `GET` | `/api/orders` | Récupère les commandes normalisées (`Order[]`) et les métadonnées (mapping, en-têtes détectées). Paramètres : `sheetId`, `range`, `method`, `gid`, `mapping` (JSON stringifié). |
| `PUT` | `/api/orders/:rowId` | Met à jour une ligne (service account uniquement). Paramètres : `sheetId`. Body : champs à modifier. |
| `GET` | `/api/stats/daily` | Calcule les KPIs (ventes, panier moyen, top produits/villes) pour la date `YYYY-MM-DD`. Paramètres : `sheetId`, `date`. |

Les erreurs sont renvoyées au format `{ message: string }` avec codes HTTP appropriés.

## Format Order

```ts
 type Order = {
   id: string;               // numéro de ligne (header = ligne 1)
   productName: string;
   productPrice: number;     // FCFA
   productQuantity: number;
   address1: string;
   city?: string;            // extraite automatiquement
   firstName: string;
   phone: string;
   productLink?: string;
   createdDate?: string;     // ISO
   subtotal: number;         // productPrice * productQuantity
   derivedDate?: boolean;    // true si date inférée (mode CSV public)
 };
```

## Jeu de données mock

Un fichier `server/mock/orders.csv` est fourni pour tester sans Google Sheet. Importez-le en mode CSV public (ou utilisez-le dans vos tests).

## Fonctionnalités principales

- Connexion à un Google Sheet via URL (détection automatique du mode d'accès).
- Table de commandes ergonomique (TanStack Table) avec tri multi-colonnes, pagination et recherche globale.
- Filtres dynamiques (date, ville, adresse, produit, téléphone) + état synchronisé dans l’URL.
- Édition inline des champs (prix, quantité, adresse, etc.) avec synchronisation Google Sheets (service account).
- Calcul automatique des ventes du jour + KPI cards (ventes, nb commandes, panier moyen, top villes/produits).
- Graphique Recharts (ventes par heure) basé sur la date sélectionnée.
- Export CSV client-side.
- Modale de mapping pour associer manuellement les en-têtes si la détection échoue.
- Toasts de succès/erreur et message explicite si le sheet est en lecture seule.

## Structure du projet

```
client/
  src/
    features/orders/...
    store/ordersStore.ts
    utils/
      extractCity.ts
      number.ts
server/
  src/
    routes/
      orders.ts
      sheets.ts
      stats.ts
    services/
      googleSheetsService.ts
      orderCache.ts
      publicCsvService.ts
    utils/
      city.ts
      gsheet.ts
      mapping.ts
      normalization.ts
      orders.ts
      time.ts
  mock/orders.csv
```

## Tests

- `client/tests/extractCity.test.ts` : tests unitaires Vitest sur l'extraction de ville côté client.
- `server/tests/*.test.ts` : tests unitaires (ville, normalisation, parsing CSV).

Exécuter tous les tests :

```bash
npm run test
```

## Bonnes pratiques & lint

- ESLint + Prettier configurés côté client et serveur.
- TailwindCSS pour la mise en forme.
- Zustand pour l’état global (filtres, connexion, commandes).
- Axios pour les requêtes HTTP, react-hook-form pour le formulaire de connexion au sheet.

## Notes supplémentaires

- Les valeurs monétaires sont normalisées (suppression des séparateurs, conversion en nombre) côté serveur et client.
- `city` est inférée depuis `Address 1` via une liste de villes du Cameroun (configurable).
- Les statistiques sont calculées côté serveur à partir du cache des commandes.
- L’URL garde date/tri/filtres/sheetId pour permettre un refresh sans perdre le contexte.
- Les mises à jour de ligne utilisent le cache en mémoire et reconstituent la ligne complète avant envoi à Google Sheets pour éviter d’effacer les colonnes non modifiées.

## Exemple d’URL Google Sheets

```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit#gid=0
```

- `SHEET_ID` = `1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`
- `gid` (onglet) = `0`

Bon suivi de commandes !
