require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const app = express(); // ← INICJALIZUJ OBIEKT EXPRESS

app.use(express.static('public')); // ← UŻYWAJ PO INICJALIZACJI

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Inicjalizacja Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Using localStorage fallback.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// --- funkcja do testowania czasu ---
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

// --- endpointy API ---

// Pobierz wszystkie serwisy
app.get('/api/services', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Pobierz ostatnie testy dla każdego serwisu (dla kompatybilności z frontendem)
    const servicesWithHistory = await Promise.all(
      data.map(async (service) => {
        const { data: tests } = await supabase
          .from('service_tests')
          .select('*')
          .eq('service_id', service.id)
          .order('timestamp', { ascending: false })
          .limit(50);

        return {
          id: service.id,
          name: service.name,
          url: service.url,
          threshold: service.threshold,
          errors: service.errors,
          history: (tests || []).map(test => ({
            success: test.success,
            responseTime: test.response_time,
            status: test.status_code,
            error: test.error_message,
            timestamp: test.timestamp
          }))
        };
      })
    );

    res.json(servicesWithHistory);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dodaj nowy serwis
app.post('/api/services', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { name, url, threshold = 3000 } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    const { data, error } = await supabase
      .from('services')
      .insert([{ name, url, threshold, errors: 0 }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: data.id,
      name: data.name,
      url: data.url,
      threshold: data.threshold,
      errors: data.errors,
      history: []
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Usuń serwis
app.delete('/api/services/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test pojedynczego serwisu i zapisz wynik
app.post('/api/test', async (req, res) => {
  try {
    const { url, timeout = 10000, serviceId } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const result = await testService(url, timeout);

    // Zapisz wynik do bazy, jeśli mamy serviceId i Supabase
    if (serviceId && supabase) {
      const { error: dbError } = await supabase
        .from('service_tests')
        .insert([{
          service_id: serviceId,
          success: result.success,
          response_time: result.responseTime,
          status_code: result.status,
          error_message: result.error || null,
          timestamp: result.timestamp
        }]);

      if (dbError) {
        console.error('Error saving test result:', dbError);
      } else {
        // Aktualizuj licznik błędów w serwisie
        if (!result.success) {
          // Pobierz aktualną wartość błędów
          const { data: serviceData } = await supabase
            .from('services')
            .select('errors')
            .eq('id', serviceId)
            .single();
          
          if (serviceData) {
            await supabase
              .from('services')
              .update({ errors: (serviceData.errors || 0) + 1 })
              .eq('id', serviceId);
          }
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error testing service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pobierz historię testów dla serwisu
app.get('/api/services/:id/tests', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { from, to, limit = 100 } = req.query;

    let query = supabase
      .from('service_tests')
      .select('*')
      .eq('service_id', id)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (from) {
      query = query.gte('timestamp', from);
    }
    if (to) {
      query = query.lte('timestamp', to + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error) throw error;

    const tests = (data || []).map(test => ({
      success: test.success,
      responseTime: test.response_time,
      status: test.status_code,
      error: test.error_message,
      timestamp: test.timestamp
    }));

    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: error.message });
  }
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

// Automatyczne testy wszystkich serwisów (dla cron job)
app.post('/api/test-all', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Pobierz wszystkie serwisy
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, url');

    if (servicesError) throw servicesError;
    if (!services || services.length === 0) {
      return res.json({ message: 'No services to test', tested: 0 });
    }

    const timeout = req.body?.timeout || 10000;
    const results = [];

    // Testuj każdy serwis
    for (const service of services) {
      try {
        const testResult = await testService(service.url, timeout);
        
        // Zapisz wynik do bazy
        const { error: dbError } = await supabase
          .from('service_tests')
          .insert([{
            service_id: service.id,
            success: testResult.success,
            response_time: testResult.responseTime,
            status_code: testResult.status,
            error_message: testResult.error || null,
            timestamp: testResult.timestamp
          }]);

        if (dbError) {
          console.error(`Error saving test for service ${service.id}:`, dbError);
        } else {
          // Aktualizuj licznik błędów jeśli test się nie powiódł
          if (!testResult.success) {
            const { data: serviceData } = await supabase
              .from('services')
              .select('errors')
              .eq('id', service.id)
              .single();
            
            if (serviceData) {
              await supabase
                .from('services')
                .update({ errors: (serviceData.errors || 0) + 1 })
                .eq('id', service.id);
            }
          }
        }

        results.push({
          serviceId: service.id,
          url: service.url,
          ...testResult
        });
      } catch (error) {
        console.error(`Error testing service ${service.id}:`, error);
        results.push({
          serviceId: service.id,
          url: service.url,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: `Tested ${results.length} services`,
      tested: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test-all endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: supabase ? 'connected' : 'not configured'
  });
});

app.listen(PORT, () => {
  console.log(`✓ Backend działa na http://localhost:${PORT}`);
});
