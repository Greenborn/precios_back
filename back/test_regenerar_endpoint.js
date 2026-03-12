// Simple test script for the /admin/productos/regenerar_price_today endpoint
// Usage: node test_regenerar_endpoint.js

require("dotenv").config({ path: '.env' });
const axios = require('axios');

const KEY = process.env.KEY_INT;
const BASE_URL = `http://localhost:${process.env.service_port_api}/admin/productos`;

(async () => {
    if (!KEY) {
        console.error('KEY_INT is not defined in .env');
        process.exit(1);
    }

    try {
        console.log('Enviando petición de regeneración...');
        const resp = await axios.post(`${BASE_URL}/regenerar_price_today`, { key: KEY });
        console.log('Respuesta del servidor:', resp.data);
    } catch (err) {
        console.error('Error al llamar al endpoint:', err.response?.data || err.message);
    }
})();
