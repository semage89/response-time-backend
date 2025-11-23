const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serwuje index.html i pliki statyczne

// Funkcja do testowania czasu odpowiedzi
async function testService(url, timeout = 10000) {
  try {
    const startTime = Date.now();
    const response = await fetch(url, { timeout, method: 'HEAD' });
    const responseTime = Date.now() - startTime;
    return {
      success: true,
      responseTime,
      status: response.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: null,
      timestamp: new Date().toISOString()
    };
  }
}

// Test pojedynczego serwisu
app.post('/api/test', async (req, res) => {
  const { url, timeout = 10000 } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  const result = await testService(url, timeout);
  res.json(result);
});

// Test wielu serwisów
app.post('/api/test-multiple', async (req, res) => {
  const { services, timeout = 10000 } = req.body;
  if (!services || !Array.isArray(services)) return res.status(400).json({ error: 'Services array is required' });
  const results = await Promise.all(services.map(async (service) => ({
      name: service.name,
      url: service.url,
      ...(await testService(service.url, timeout))
  })));
  res.json(results);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✓ Backend działa na http://localhost:${PORT}`);
});
