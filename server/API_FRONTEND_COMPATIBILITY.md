# API Frontend Compatibility - Résolution du problème

## Problème identifié

L'erreur "Erreur lors du chargement des commandes" était causée par une incompatibilité entre :

1. **Format de réponse de l'API** : `{ ok: true, spreadsheetId, range, rows, data }`
2. **Format attendu par le frontend** : `{ orders: Order[], meta: OrdersMeta }`

## Solution implémentée

### Modification de `/api/orders`

L'API `/api/orders` a été modifiée pour retourner le format attendu par le frontend :

```typescript
// Ancien format (incompatible)
{
  "ok": true,
  "spreadsheetId": "1yJU...",
  "range": "orders!A:Z",
  "rows": 120,
  "data": [["Product", "Price", ...], ...]
}

// Nouveau format (compatible)
{
  "orders": [
    {
      "id": "order_1",
      "productName": "Product A",
      "productPrice": 29.99,
      "productQuantity": 2,
      "subtotal": 59.98,
      "firstName": "John",
      "phone": "1234567890",
      "address1": "123 Main St",
      "city": "Paris",
      "createdDate": "2025-09-25",
      "derivedDate": false
    }
  ],
  "meta": {
    "method": "service-account",
    "sheetId": "1yJU...",
    "sheetRange": "orders!A:Z",
    "detectedHeaders": { "Product": "col_0", "Price": "col_1" },
    "missingHeaders": [],
    "availableHeaders": ["Product", "Price", "Quantity", ...]
  }
}
```

### Fonctionnalités conservées

- ✅ **Auto-détection d'onglets** : Fonctionne toujours
- ✅ **Basculement automatique** : Fonctionne toujours
- ✅ **Logs d'avertissement** : Fonctionne toujours
- ✅ **Gestion d'erreurs** : Fonctionne toujours

### Mapping des colonnes

L'API mappe automatiquement les colonnes du Google Sheet vers les champs Order :

| Colonne | Champ Order | Type |
|---------|-------------|------|
| 0 | productName | string |
| 1 | productPrice | number |
| 2 | productQuantity | number |
| 3 | address1 | string |
| 4 | city | string |
| 5 | firstName | string |
| 6 | phone | string |
| 7 | productLink | string |
| 8 | createdDate | string |

### Calculs automatiques

- **subtotal** : `productPrice * productQuantity`
- **derivedDate** : `true` si pas de date fournie
- **id** : `order_${index + 1}` (généré automatiquement)

## Test de la solution

### Commande de test
```bash
curl "http://localhost:4000/api/orders?sheetId=1yJUfs6hb8j3FgVCGfKJ06Eg8Pj9iiz9GIlWy1AL--7Q&range=Feuille1!A:Z"
```

### Réponse attendue
```json
{
  "orders": [
    {
      "id": "order_1",
      "productName": "Product A",
      "productPrice": 29.99,
      "productQuantity": 2,
      "subtotal": 59.98,
      "firstName": "John",
      "phone": "1234567890",
      "address1": "123 Main St",
      "city": "Paris",
      "createdDate": "2025-09-25",
      "derivedDate": false
    }
  ],
  "meta": {
    "method": "service-account",
    "sheetId": "1yJUfs6hb8j3FgVCGfKJ06Eg8Pj9iiz9GIlWy1AL--7Q",
    "sheetRange": "orders!A:Z",
    "detectedHeaders": { "Product": "col_0", "Price": "col_1" },
    "missingHeaders": [],
    "availableHeaders": ["Product", "Price", "Quantity", "Address", "City", "Name", "Phone", "Link", "Date"]
  }
}
```

## Avantages de cette solution

1. **Compatibilité totale** : Le frontend fonctionne sans modification
2. **Robustesse** : Gestion automatique des ranges invalides
3. **Flexibilité** : Mapping automatique des colonnes
4. **Performance** : Pas de double traitement des données
5. **Maintenabilité** : Code centralisé dans l'API

## Logs côté serveur

```
[RANGE] Onglet "Feuille1" introuvable. Bascule sur "orders".
[GOOGLE SHEETS] SpreadsheetId = 1yJUfs6hb8j3FgVCGfKJ06Eg8Pj9iiz9GIlWy1AL--7Q
[GOOGLE SHEETS] Tabs found = [ 'orders', 'easysell_abandoneds' ]
[GOOGLE SHEETS] Using range = orders!A:Z
```

Le problème "Erreur lors du chargement des commandes" devrait maintenant être résolu !
