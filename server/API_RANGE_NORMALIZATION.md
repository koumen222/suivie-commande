# API Range Normalization - Documentation

## Vue d'ensemble

L'API gère maintenant automatiquement les ranges invalides en détectant les onglets disponibles et en basculant automatiquement sur un onglet valide si nécessaire.

## Fonctionnalités

### 1. Auto-détection d'onglet
- Si aucun range n'est fourni → utilise le premier onglet disponible
- Si range invalide (onglet inexistant) → bascule sur le premier onglet avec avertissement
- Si range sans onglet (ex: "A:Z") → utilise le premier onglet

### 2. Gestion des noms d'onglets avec espaces
- Ajoute automatiquement des quotes autour des noms contenant des espaces
- `"Feuille 1"` → `"'Feuille 1'!A:Z"`

### 3. Logs d'avertissement
- Affiche un avertissement quand un onglet invalide est détecté
- Logge les onglets trouvés et le range final utilisé

## Endpoints modifiés

### GET /api/orders

**Paramètres :**
- `sheetId` (obligatoire) : ID ou URL Google Sheets
- `range` (optionnel) : Range à utiliser (ex: "Feuille1!A:Z", "A:Z")

**Exemples :**
```bash
# Range invalide (devrait basculer automatiquement)
curl "http://localhost:4000/api/orders?sheetId=1yJU...AL--7Q&range=Feuille1!A:Z"

# Sans range (devrait prendre le 1er onglet)
curl "http://localhost:4000/api/orders?sheetId=1yJU...AL--7Q"

# Range valide
curl "http://localhost:4000/api/orders?sheetId=1yJU...AL--7Q&range=Sheet1!A:Z"
```

**Réponse de succès :**
```json
{
  "ok": true,
  "spreadsheetId": "1yJU...AL--7Q",
  "range": "Sheet1!A:Z",
  "rows": 120,
  "data": [...]
}
```

### GET /api/stats/daily

**Paramètres :**
- `sheetId` (obligatoire) : ID ou URL Google Sheets
- `date` (obligatoire) : Date au format YYYY-MM-DD
- `range` (optionnel) : Range à utiliser

**Exemples :**
```bash
# Stats daily (sans range, auto)
curl "http://localhost:4000/api/stats/daily?sheetId=1yJU...AL--7Q&date=2025-09-25"

# Stats daily avec range spécifique
curl "http://localhost:4000/api/stats/daily?sheetId=1yJU...AL--7Q&date=2025-09-25&range=Sheet1!A:Z"

# Stats daily avec range invalide (devrait basculer)
curl "http://localhost:4000/api/stats/daily?sheetId=1yJU...AL--7Q&date=2025-09-25&range=Feuille1!A:Z"
```

**Réponse de succès :**
```json
{
  "ok": true,
  "totalSales": 1500.00,
  "totalOrders": 25,
  "averageBasket": 60,
  "topProducts": [
    { "name": "Produit A", "total": 500.00 },
    { "name": "Produit B", "total": 300.00 }
  ],
  "topCities": [
    { "name": "Paris", "total": 800.00 },
    { "name": "Lyon", "total": 400.00 }
  ],
  "date": "2025-09-25",
  "range": "Sheet1!A:Z"
}
```

## Gestion des erreurs

### Erreurs de validation (400)
```json
// Date manquante
{
  "ok": false,
  "code": "BAD_REQUEST",
  "error": "Paramètre date requis (YYYY-MM-DD)"
}

// Format de date invalide
{
  "ok": false,
  "code": "BAD_REQUEST",
  "error": "Format de date invalide. Utilisez YYYY-MM-DD"
}

// ID invalide
{
  "ok": false,
  "code": "BAD_REQUEST",
  "error": "ID de feuille de calcul invalide"
}
```

### Erreurs Google Sheets (502)
```json
// Permission refusée
{
  "ok": false,
  "code": "GOOGLE_SHEETS_ERROR",
  "error": "Permission refusée. Vérifiez que le service account a accès à la feuille de calcul",
  "details": { "status": 403 }
}

// Feuille non trouvée
{
  "ok": false,
  "code": "GOOGLE_SHEETS_ERROR",
  "error": "Feuille de calcul non trouvée. Vérifiez l'ID de la feuille",
  "details": { "status": 404 }
}
```

## Logs côté serveur

### Cas normal
```
[GOOGLE SHEETS] SpreadsheetId = 1yJU...AL--7Q
[GOOGLE SHEETS] Tabs found = ['Sheet1', 'Data', 'Stats']
[GOOGLE SHEETS] Using range = Sheet1!A:Z
```

### Range invalide (avec basculement)
```
[GOOGLE SHEETS] SpreadsheetId = 1yJU...AL--7Q
[GOOGLE SHEETS] Tabs found = ['Sheet1', 'Data', 'Stats']
[RANGE] Onglet "Feuille1" introuvable. Bascule sur "Sheet1".
[GOOGLE SHEETS] Using range = Sheet1!A:Z
```

## Avantages

### 1. Robustesse
- ✅ Plus d'erreurs "Unable to parse range"
- ✅ Basculement automatique sur onglet valide
- ✅ Gestion des noms d'onglets avec espaces

### 2. Expérience utilisateur
- ✅ Le frontend peut continuer à envoyer des ranges invalides
- ✅ L'API corrige automatiquement et répond avec des données
- ✅ Messages d'erreur clairs et explicites

### 3. Développement
- ✅ Logs détaillés pour le debug
- ✅ Codes d'erreur structurés
- ✅ Validation stricte des paramètres

## Configuration requise

### Variables d'environnement
```env
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
PORT=4000
```

### Sécurité maintenue
- ✅ Chargement ESM-friendly conservé
- ✅ Correction `GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')` maintenue
- ✅ Jamais de log de la clé privée
- ✅ Scope `spreadsheets.readonly` utilisé
- ✅ Fallback de port conservé

## Tests recommandés

1. **Test range invalide** : Vérifier que l'API bascule automatiquement
2. **Test sans range** : Vérifier que l'API utilise le premier onglet
3. **Test range valide** : Vérifier que l'API utilise le range fourni
4. **Test date invalide** : Vérifier les messages d'erreur clairs
5. **Test ID invalide** : Vérifier la validation des paramètres
