# API Google Sheets Dynamique - Exemples d'utilisation

## Endpoint POST /api/sheets/read

Permet de lire les données d'un Google Sheet en fournissant l'ID ou l'URL.

### Exemple 1 : Avec ID de feuille uniquement

```bash
curl -X POST http://localhost:4000/api/sheets/read \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890"
  }'
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
curl -X POST http://localhost:4000/api/sheets/read \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "https://docs.google.com/spreadsheets/d/1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890/edit#gid=0"
  }'
```

### Exemple 3 : Avec range spécifique

```bash
curl -X POST http://localhost:4000/api/sheets/read \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890",
    "range": "Feuille 1!A1:C10"
  }'
```

### Exemple 4 : Avec onglet contenant des espaces

```bash
curl -X POST http://localhost:4000/api/sheets/read \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890",
    "range": "Feuille 1!A:Z"
  }'
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
  "error": "spreadsheetId est requis dans le body de la requête"
}
```

### ID invalide
```json
{
  "ok": false,
  "error": "ID de feuille de calcul invalide. Fournissez un ID valide ou une URL Google Sheets complète."
}
```

### Permission refusée
```json
{
  "ok": false,
  "error": "Permission refusée. Vérifiez que le service account a accès à la feuille de calcul."
}
```

### Feuille non trouvée
```json
{
  "ok": false,
  "error": "Feuille de calcul non trouvée. Vérifiez l'ID de la feuille."
}
```

## Logs côté serveur

```
[GOOGLE SHEETS] SpreadsheetId = 1AbCDeFGhIJkLMNOP_qrsTUVwXyZ1234567890
[GOOGLE SHEETS] Tabs found = ['Sheet1', 'Feuille 1', 'Data']
[GOOGLE SHEETS] Using range = 'Feuille 1'!A:Z
[GOOGLE SHEETS] First row: ['Nom', 'Email', 'Date']
[GOOGLE SHEETS] Total rows: 153
```

## Fonctionnalités automatiques

1. **Auto-détection des onglets** : Si aucun range n'est fourni, utilise le premier onglet disponible
2. **Extraction d'ID depuis URL** : Extrait automatiquement l'ID depuis une URL Google Sheets complète
3. **Gestion des espaces** : Ajoute automatiquement des quotes autour des noms d'onglets contenant des espaces
4. **Validation des onglets** : Vérifie que l'onglet spécifié existe, sinon utilise le premier disponible
5. **Sécurité** : Utilise uniquement les credentials du serveur, ne stocke rien côté client
