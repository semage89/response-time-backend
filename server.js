const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Obsługa plików statycznych z folderu "public"
app.use(express.static('public'));

// Middlewares do API
app.use(cors());
app.use(express.json());

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

// API endpoints
app.post('/api/test', async (req, res) => {
  const { url, timeout = 10000 } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  const result = await testService(url, timeout);
  res.json(result);
});

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✓ Backend działa na http://localhost:${PORT}`);
});
