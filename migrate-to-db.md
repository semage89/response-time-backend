# Migracja danych z localStorage do Supabase

Jeśli masz już dane w localStorage i chcesz je przenieść do bazy danych Supabase:

## Krok 1: Eksport danych z localStorage

Otwórz konsolę przeglądarki (F12) i wykonaj:

```javascript
const data = JSON.parse(localStorage.getItem('services_v2'));
console.log(JSON.stringify(data, null, 2));
```

Skopiuj wynik JSON.

## Krok 2: Import danych do Supabase

Możesz użyć jednej z następujących metod:

### Metoda 1: Przez API aplikacji

Użyj endpointu POST `/api/services` dla każdego serwisu, a następnie POST `/api/test` dla każdego testu.

### Metoda 2: Bezpośrednio przez SQL

W SQL Editor w Supabase wykonaj:

```sql
-- Dla każdego serwisu z localStorage:
INSERT INTO services (name, url, threshold, errors) 
VALUES ('Itaka.pl', 'https://itaka.pl', 3000, 0)
RETURNING id;

-- Następnie dla każdego testu (używając zwróconego id):
INSERT INTO service_tests (service_id, success, response_time, status_code, error_message, timestamp)
VALUES 
  ('<service_id>', true, 250, 200, NULL, '2024-01-01T12:00:00Z'),
  ('<service_id>', false, NULL, NULL, 'Connection timeout', '2024-01-01T13:00:00Z');
```

### Metoda 3: Skrypt Node.js

Utwórz plik `migrate.js`:

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Wklej tutaj dane z localStorage
const servicesData = [
  {
    name: 'Itaka.pl',
    url: 'https://itaka.pl',
    threshold: 3000,
    errors: 0,
    history: [
      { success: true, responseTime: 250, status: 200, timestamp: '2024-01-01T12:00:00Z' }
    ]
  }
];

async function migrate() {
  for (const service of servicesData) {
    // Dodaj serwis
    const { data: serviceRecord, error: serviceError } = await supabase
      .from('services')
      .insert([{
        name: service.name,
        url: service.url,
        threshold: service.threshold,
        errors: service.errors
      }])
      .select()
      .single();

    if (serviceError) {
      console.error(`Error creating service ${service.name}:`, serviceError);
      continue;
    }

    // Dodaj historię testów
    if (service.history && service.history.length > 0) {
      const tests = service.history.map(test => ({
        service_id: serviceRecord.id,
        success: test.success,
        response_time: test.responseTime,
        status_code: test.status,
        error_message: test.error || null,
        timestamp: test.timestamp
      }));

      const { error: testsError } = await supabase
        .from('service_tests')
        .insert(tests);

      if (testsError) {
        console.error(`Error inserting tests for ${service.name}:`, testsError);
      } else {
        console.log(`✓ Migrated ${service.name} with ${tests.length} tests`);
      }
    }
  }
}

migrate();
```

Uruchom: `node migrate.js`

