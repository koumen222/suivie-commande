# API Google Sheets Dynamique - Documentation

## Vue d'ensemble

L'API permet à n'importe quel utilisateur de fournir l'URL ou l'ID d'un Google Sheet et de détecter automatiquement les onglets et lire les données.

## Configuration requise

### Variables d'environnement (.env)
```env
# Seules ces variables sont requises
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# Optionnel
PORT=4000
```

**Note :** `SPREADSHEET_ID` n'est plus requis - l'API est totalement dynamique.

## Endpoints disponibles

### 1. GET /api/sheets/tabs

Liste tous les onglets d'un Google Sheet.

**Paramètres :**
- `sheetId` (obligatoire) : ID pur ou URL complète Google Sheets

**Exemples :**
```bash
# Avec ID pur
curl "http://localhost:4000/api/sheets/tabs?sheetId=1AbCDEFghIJkLMNOP_qrsTuvWXyz"

# Avec URL complète
curl "http://localhost:4000/api/sheets/tabs?sheetId=https://docs.google.com/spreadsheets/d/1AbCDEFghIJkLMNOP_qrsTuvWXyz/edit"
```

**Réponse de succès :**
```json
{
  "ok": true,
  "tabs": ["Sheet1", "Feuille 1", "Stats", "Data"]
}
```

**Réponses d'erreur :**
```json
// 400 - Paramètre manquant
{
  "ok": false,
  "error": "Paramètre sheetId requis"
}

// 400 - ID invalide
{
  "ok": false,
  "error": "ID de feuille de calcul invalide. Fournissez un ID valide ou une URL Google Sheets complète."
}

// 400 - Aucun onglet
{
  "ok": false,
  "error": "Aucun onglet trouvé"
}

// 502 - Permission refusée
{
  "ok": false,
  "error": "Permission refusée. Vérifiez que le service account a accès à la feuille de calcul"
}

// 502 - Feuille non trouvée
{
  "ok": false,
  "error": "Feuille de calcul non trouvée. Vérifiez l'ID de la feuille"
}
```

### 2. GET /api/sheets/read

Lit les données d'un Google Sheet.

**Paramètres :**
- `sheetId` (obligatoire) : ID pur ou URL complète Google Sheets
- `tab` (optionnel) : nom de l'onglet à lire

**Exemples :**
```bash
# Lire la première feuille (auto-détection)
curl "http://localhost:4000/api/sheets/read?sheetId=1AbCDEFghIJkLMNOP_qrsTuvWXyz"

# Lire un onglet précis
curl "http://localhost:4000/api/sheets/read?sheetId=1AbCDEFghIJkLMNOP_qrsTuvWXyz&tab=Stats"

# Avec URL complète
curl "http://localhost:4000/api/sheets/read?sheetId=https://docs.google.com/spreadsheets/d/1AbCDEFghIJkLMNOP_qrsTuvWXyz/edit&tab=Feuille 1"
```

**Réponse de succès :**
```json
{
  "ok": true,
  "sheetId": "1AbCDEFghIJkLMNOP_qrsTuvWXyz",
  "range": "Sheet1!A:Z",
  "rows": 120,
  "data": [
    ["Nom", "Email", "Date", "Montant"],
    ["John Doe", "john@example.com", "2024-01-15", "150.00"],
    ["Jane Smith", "jane@example.com", "2024-01-16", "200.00"]
  ]
}
```

**Réponses d'erreur :**
```json
// 400 - Paramètre manquant
{
  "ok": false,
  "error": "Paramètre sheetId requis"
}

// 400 - Aucun onglet
{
  "ok": false,
  "error": "Aucun onglet trouvé"
}

// 502 - Range invalide
{
  "ok": false,
  "error": "Range invalide. Vérifiez le nom de l'onglet"
}
```

## Fonctionnalités automatiques

### 1. Extraction d'ID depuis URL
L'API extrait automatiquement l'ID depuis une URL Google Sheets complète :
```
https://docs.google.com/spreadsheets/d/1AbCDEFghIJkLMNOP_qrsTuvWXyz/edit#gid=0
→ 1AbCDEFghIJkLMNOP_qrsTuvWXyz
```

### 2. Auto-détection des onglets
Si aucun onglet n'est spécifié, l'API :
1. Liste tous les onglets disponibles
2. Utilise le premier onglet trouvé
3. Construit automatiquement le range `"Onglet!A:Z"`

### 3. Gestion des noms d'onglets avec espaces
Les noms d'onglets contenant des espaces sont automatiquement entourés de quotes :
```
"Feuille 1" → "'Feuille 1'!A:Z"
"Sheet1" → "Sheet1!A:Z"
```

### 4. Logs détaillés
L'API logge côté serveur :
```
[GOOGLE SHEETS] SpreadsheetId = 1AbCDEFghIJkLMNOP_qrsTuvWXyz
[GOOGLE SHEETS] Tabs found = ['Sheet1', 'Feuille 1', 'Stats']
[GOOGLE SHEETS] Using range = Sheet1!A:Z
```

## Workflow typique

1. **Découvrir les onglets :**
   ```bash
   curl "http://localhost:4000/api/sheets/tabs?sheetId=YOUR_SHEET_ID"
   ```

2. **Lire les données :**
   ```bash
   # Auto-détection (premier onglet)
   curl "http://localhost:4000/api/sheets/read?sheetId=YOUR_SHEET_ID"
   
   # Onglet spécifique
   curl "http://localhost:4000/api/sheets/read?sheetId=YOUR_SHEET_ID&tab=Stats"
   ```

## Sécurité

- ✅ Utilise uniquement les credentials du serveur
- ✅ Scope `spreadsheets.readonly` (lecture seule)
- ✅ Ne stocke aucune donnée côté serveur
- ✅ Ne logge jamais la clé privée
- ✅ Validation stricte des entrées

## Gestion d'erreurs

L'API distingue clairement :
- **400** : Erreurs de validation (paramètres manquants/invalides)
- **502** : Erreurs Google Sheets (permissions, feuille non trouvée, etc.)
- **500** : Erreurs internes du serveur

Chaque erreur inclut un message explicite pour faciliter le debug côté frontend.
