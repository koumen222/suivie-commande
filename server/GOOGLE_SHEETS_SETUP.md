# Configuration Google Sheets

## Variables d'environnement requises

Créez un fichier `.env` dans le dossier `server/` avec les variables suivantes :

```env
# Google Sheets Configuration
SPREADSHEET_ID=your_spreadsheet_id_here
SHEET_RANGE=Sheet1!A:Z

# Google Service Account Credentials
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# Server Configuration
PORT=4000
```

## Fonctionnalités automatiques

### Auto-détection des onglets
- Si `SHEET_RANGE` n'est pas défini, l'application utilisera automatiquement le premier onglet disponible
- Si l'onglet spécifié dans `SHEET_RANGE` n'existe pas, l'application basculera vers le premier onglet disponible avec un avertissement

### Gestion des noms d'onglets avec espaces
- Les noms d'onglets contenant des espaces sont automatiquement entourés de quotes
- Exemple : `Feuille 1!A:Z` devient `'Feuille 1'!A:Z`

### Validation au démarrage
- `SPREADSHEET_ID` est obligatoire (l'application s'arrête si manquant)
- `SHEET_RANGE` est optionnel (utilise le premier onglet si non défini)

## Endpoints de test

- `GET /healthz` - Vérification basique du serveur
- `GET /test-sheets` - Test complet de la connexion Google Sheets avec auto-détection des onglets

## Messages d'erreur clairs

L'application affiche des messages d'erreur explicites pour :
- Permissions insuffisantes
- Feuille de calcul non trouvée
- Clé privée mal formatée
- Onglet inexistant
