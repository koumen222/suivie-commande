# Mapping des colonnes Google Sheets vers Order

## Structure des données

Votre Google Sheet a la structure suivante :

| Colonne | En-tête | Type | Description |
|---------|---------|------|-------------|
| 0 | Product Name | string | Nom du produit |
| 1 | Product Price | number | Prix du produit (en centimes) |
| 2 | Product Quantity | number | Quantité |
| 3 | Ville | string | Ville de livraison |
| 4 | First Name | string | Prénom du client |
| 5 | Phone | string | Téléphone du client |
| 6 | Adresse | string | Adresse de livraison |
| 7 | DATE | string | Date de commande (YYYY-MM-DD) |

## Mapping vers Order

```typescript
const order = {
  id: `order_${index + 1}`,                    // Généré automatiquement
  productName: row[0],                         // Product Name
  productPrice: parseFloat(row[1]) || 0,       // Product Price
  productQuantity: parseInt(row[2]) || 1,      // Product Quantity
  city: row[3],                                // Ville
  firstName: row[4],                           // First Name
  phone: row[5],                               // Phone
  address1: row[6],                            // Adresse
  createdDate: row[7] || today,                // DATE
  productLink: '',                             // Pas de colonne
  subtotal: productPrice * productQuantity,    // Calculé automatiquement
  derivedDate: !row[7]                         // true si pas de date
};
```

## Exemple de conversion

### Données brutes du Google Sheet
```
Distributeur Automatique de Dentifrice avec Porte-Brosse Antibactérien et Lumière UV	9900	1	Douala	Fabien	237679888000	Maison du combattant	2025-02-28
```

### Objet Order généré
```json
{
  "id": "order_1",
  "productName": "Distributeur Automatique de Dentifrice avec Porte-Brosse Antibactérien et Lumière UV",
  "productPrice": 9900,
  "productQuantity": 1,
  "city": "Douala",
  "firstName": "Fabien",
  "phone": "237679888000",
  "address1": "Maison du combattant",
  "createdDate": "2025-02-28",
  "productLink": "",
  "subtotal": 9900,
  "derivedDate": false
}
```

## Notes importantes

1. **Prix en centimes** : Les prix sont stockés en centimes (9900 = 99.00€)
2. **Pas de lien produit** : La colonne productLink est vide car pas de colonne correspondante
3. **Date automatique** : Si pas de date fournie, utilise la date du jour
4. **Subtotal calculé** : Prix × Quantité automatiquement
5. **ID généré** : order_1, order_2, etc.

## Gestion des erreurs

- **Prix invalide** : 0 par défaut
- **Quantité invalide** : 1 par défaut
- **Date manquante** : Date du jour
- **Champs vides** : Chaîne vide par défaut

## Test de l'API

```bash
curl "http://localhost:4000/api/orders?sheetId=VOTRE_SHEET_ID&range=Feuille1!A:Z"
```

L'API devrait maintenant correctement mapper vos données vers le format Order attendu par le frontend !
