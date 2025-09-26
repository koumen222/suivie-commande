# API Dynamique Google Sheets - Exemples d'utilisation

## Endpoint GET /api/orders

Permet de lire les données d'un Google Sheet en fournissant l'ID ou l'URL via les paramètres de requête.

### Exemple 1 : Avec ID de feuille uniquement

```bash
curl "http://localhost:4000/api/orders?sheetId=1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890"
```

**Réponse :**
```json
{
  "ok": true,
  "spreadsheetId": "1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890",
  "range": "Sheet1!A:Z",
  "rows": 153,
  "data": [
    ["Nom", "Email", "Date"],
    ["John Doe", "john@example.com", "2024-01-15"],
    ["Jane Smith", "jane@example.com", "2024-01-16"]
  ]
}
```

### Exemple 2 : Avec URL complète

```bash
curl "http://localhost:4000/api/orders?sheetId=https://docs.google.com/spreadsheets/d/1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890/edit#gid=0"
```

### Exemple 3 : Avec range spécifique

```bash
curl "http://localhost:4000/api/orders?sheetId=1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890&range=Sheet1!A1:C10"
```

### Exemple 4 : Avec onglet contenant des espaces

```bash
curl "http://localhost:4000/api/orders?sheetId=1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890&range=Feuille 1!A:Z"
```

**Réponse :**
```json
{
  "ok": true,
  "spreadsheetId": "1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890",
  "range": "'Feuille 1'!A:Z",
  "rows": 153,
  "data": [...]
}
```

## Gestion des erreurs

### ID manquant
```json
{
  "ok": false,
  "error": "Paramètre sheetId requis dans l'URL"
}
```

### Aucun onglet trouvé
```json
{
  "ok": false,
  "error": "Aucun onglet trouvé dans la feuille."
}
```

### Permission refusée
```json
{
  "ok": false,
  "error": "Permission denied. The caller does not have permission"
}
```

### Feuille non trouvée
```json
{
  "ok": false,
  "error": "Requested entity was not found"
}
```

## Logs côté serveur

```
[ENV] GOOGLE_CLIENT_EMAIL: OK
[ENV] SPREADSHEET_ID: Non défini (lecture dynamique)
[ENV] SHEET_RANGE: Non défini (auto-détection)
[GOOGLE SHEETS] SpreadsheetId = 1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890
[GOOGLE SHEETS] Using range = Sheet1!A:Z
```

## Fonctionnalités automatiques

1. **Auto-détection des onglets** : Si aucun range n'est fourni, utilise le premier onglet disponible
2. **Extraction d'ID depuis URL** : Extrait automatiquement l'ID depuis une URL Google Sheets complète
3. **Gestion des espaces** : Ajoute automatiquement des quotes autour des noms d'onglets contenant des espaces
4. **Validation des onglets** : Vérifie que l'onglet spécifié existe, sinon utilise le premier disponible
5. **Sécurité** : Utilise uniquement les credentials du serveur, ne stocke rien côté client
6. **Pas de dépendance .env** : Le serveur démarre même sans SPREADSHEET_ID dans le .env

## Configuration .env minimale

```env
# Seules ces variables sont requises
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# Optionnel
PORT=4000
```

## Avantages de cette approche

- ✅ **Flexibilité** : Chaque utilisateur peut fournir son propre Google Sheet
- ✅ **Sécurité** : Utilise uniquement les credentials du serveur
- ✅ **Simplicité** : Pas besoin de configurer SPREADSHEET_ID dans .env
- ✅ **Robustesse** : Gestion automatique des erreurs et des cas d'usage
- ✅ **Compatibilité** : Fonctionne avec les IDs et les URLs complètes
