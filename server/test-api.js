// Script de test rapide pour vérifier le format de réponse de l'API
const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing /api/orders endpoint...');
    
    const response = await axios.get('http://localhost:4000/api/orders', {
      params: {
        sheetId: '1yJUfs6hb8j3FgVCGfKJ06Eg8Pj9iiz9GIlWy1AL--7Q',
        range: 'Feuille1!A:Z'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log('- Has orders:', !!response.data.orders);
    console.log('- Has meta:', !!response.data.meta);
    console.log('- Orders count:', response.data.orders?.length || 0);
    console.log('- Meta method:', response.data.meta?.method);
    console.log('- Meta sheetId:', response.data.meta?.sheetId);
    console.log('- Meta sheetRange:', response.data.meta?.sheetRange);
    
    if (response.data.orders && response.data.orders.length > 0) {
      console.log('First order structure:');
      console.log(JSON.stringify(response.data.orders[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
