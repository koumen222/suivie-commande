# Commandes de test pour l'API Google Sheets

## Tests de base

### 1. Test avec ID pur
```bash
curl "http://localhost:4000/api/orders?sheetId=1AbCDeFGhIJkLMNOP_qrsTuvWXyz&range=Sheet1!A:Z"
```

### 2. Test avec URL complète + auto-détection d'onglet
```bash
curl "http://localhost:4000/api/orders?sheetId=https://docs.google.com/spreadsheets/d/1AbCDeFGhIJkLMNOP_qrsTuvWXyz/edit"
```

### 3. Test avec onglet contenant des espaces
```bash
curl "http://localhost:4000/api/orders?sheetId=1AbCDeFGhIJkLMNOP_qrsTuvWXyz&range=Feuille 1!A:Z"
```

### 4. Test sans range (auto-détection)
```bash
curl "http://localhost:4000/api/orders?sheetId=1AbCDeFGhIJkLMNOP_qrsTuvWXyz"
```

## Tests d'erreurs

### 5. Test sans sheetId (erreur 400)
```bash
curl "http://localhost:4000/api/orders"
```

### 6. Test avec ID invalide (erreur 400)
```bash
curl "http://localhost:4000/api/orders?sheetId=invalid"
```

### 7. Test avec ID inexistant (erreur 502)
```bash
curl "http://localhost:4000/api/orders?sheetId=1InvalidIdThatDoesNotExist"
```

## Tests de santé

### 8. Health check
```bash
curl "http://localhost:4000/api/health"
```

### 9. Debug env (sans secrets)
```bash
curl "http://localhost:4000/api/debug/env"
```

### 10. Health check legacy
```bash
curl "http://localhost:4000/healthz"
```

## Réponses attendues

### Succès (200)
```json
{
  "ok": true,
  "spreadsheetId": "1AbCDeFGhIJkLMNOP_qrsTuvWXyz",
  "range": "Sheet1!A:Z",
  "rows": 153,
  "data": [
    ["Nom", "Email", "Date"],
    ["John Doe", "john@example.com", "2024-01-15"]
  ]
}
```

### Erreur 400 - Paramètre manquant
```json
{
  "ok": false,
  "code": "BAD_REQUEST",
  "error": "Paramètre sheetId requis"
}
```

### Erreur 400 - Aucun onglet
```json
{
  "ok": false,
  "code": "NO_TABS",
  "error": "Aucun onglet trouvé dans la feuille"
}
```

### Erreur 502 - Permission refusée
```json
{
  "ok": false,
  "code": "GOOGLE_SHEETS_ERROR",
  "error": "Permission refusée. Vérifiez que le service account a accès à la feuille de calcul",
  "details": { "status": 403 }
}
```

### Health check
```json
{
  "ok": true,
  "port": 4000,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Debug env
```json
{
  "ok": true,
  "hasClientEmail": true,
  "hasPrivateKey": true,
  "port": 4000
}
```

## Logs côté serveur attendus

```
[2024-01-15T10:30:00.000Z] GET /api/orders { query: { sheetId: '1AbC...' } }
[GOOGLE SHEETS] SpreadsheetId = 1AbCDeFGhIJkLMNOP_qrsTuvWXyz
[GOOGLE SHEETS] Tabs found = ['Sheet1', 'Feuille 1']
[GOOGLE SHEETS] Using range = Sheet1!A:Z
[2024-01-15T10:30:00.500Z] GET /api/orders - 200 (500ms)
```
