# Konfiguracja automatycznych testów przez Cron Job

## Endpoint do automatycznych testów

Aplikacja ma endpoint `/api/test-all`, który testuje wszystkie serwisy z bazy danych i zapisuje wyniki.

### Użycie

```bash
POST /api/test-all
Content-Type: application/json

{
  "timeout": 10000  // opcjonalnie, domyślnie 10000ms
}
```

### Odpowiedź

```json
{
  "message": "Tested 5 services",
  "tested": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "serviceId": "uuid",
      "url": "https://example.com",
      "success": true,
      "responseTime": 250,
      "status": 200,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Konfiguracja Heroku Scheduler

### Opcja 1: Przez Heroku Dashboard

1. Przejdź do: https://dashboard.heroku.com/apps/twoja-aplikacja
2. W menu po lewej wybierz **Heroku Scheduler**
3. Kliknij **Create job**
4. Ustaw:
   - **Schedule:** `*/30 * * * *` (co 30 minut)
   - **Run Command:** `curl -X POST https://twoja-aplikacja.herokuapp.com/api/test-all -H "Content-Type: application/json"`
5. Zapisz

### Opcja 2: Przez Heroku CLI

```bash
# Zainstaluj addon Heroku Scheduler (jeśli jeszcze nie masz)
heroku addons:create scheduler:standard

# Otwórz dashboard schedulera
heroku addons:open scheduler
```

Następnie w dashboardzie dodaj job jak w Opcji 1.

## Konfiguracja zewnętrznego Cron Job

Jeśli używasz zewnętrznego serwisu do cron jobs (np. cron-job.org, EasyCron):

### Przykład dla cron-job.org

1. Zarejestruj się na https://cron-job.org
2. Utwórz nowy cron job:
   - **Title:** Test all services
   - **Address:** `https://twoja-aplikacja.herokuapp.com/api/test-all`
   - **Schedule:** Co 30 minut
   - **Request method:** POST
   - **Request headers:** `Content-Type: application/json`
   - **Request body (opcjonalnie):** `{"timeout": 10000}`

### Przykład dla EasyCron

1. Zarejestruj się na https://www.easycron.com
2. Dodaj nowy cron job:
   - **URL:** `https://twoja-aplikacja.herokuapp.com/api/test-all`
   - **HTTP Method:** POST
   - **HTTP Headers:** `Content-Type: application/json`
   - **Cron Expression:** `*/30 * * * *` (co 30 minut)

## Bezpieczeństwo (opcjonalnie)

Jeśli chcesz zabezpieczyć endpoint przed nieautoryzowanym dostępem, możesz dodać prosty token:

### 1. Dodaj zmienną środowiskową

```bash
heroku config:set CRON_SECRET=twoj-sekretny-klucz
```

### 2. Zmodyfikuj endpoint w server.js

```javascript
app.post('/api/test-all', async (req, res) => {
  // Sprawdź token
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // ... reszta kodu
});
```

### 3. Dodaj header w cron job

```
X-Cron-Secret: twoj-sekretny-klucz
```

## Testowanie endpointu

### Lokalnie

```bash
curl -X POST http://localhost:3000/api/test-all \
  -H "Content-Type: application/json" \
  -d '{"timeout": 10000}'
```

### Na Heroku

```bash
curl -X POST https://twoja-aplikacja.herokuapp.com/api/test-all \
  -H "Content-Type: application/json" \
  -d '{"timeout": 10000}'
```

## Harmonogramy Cron

### Co 30 minut
```
*/30 * * * *
```

### Co godzinę
```
0 * * * *
```

### Co 15 minut
```
*/15 * * * *
```

### Co 5 minut
```
*/5 * * * *
```

### Raz dziennie o północy
```
0 0 * * *
```

## Monitoring

Możesz monitorować działanie cron joba przez:

1. **Heroku Logs:**
   ```bash
   heroku logs --tail
   ```

2. **Endpoint health:**
   ```bash
   curl https://twoja-aplikacja.herokuapp.com/api/health
   ```

3. **Sprawdź ostatnie testy w bazie:**
   - Przejdź do Supabase Dashboard
   - Sprawdź tabelę `service_tests` - powinny pojawiać się nowe wpisy

## Rozwiązywanie problemów

### Problem: Cron job nie działa
- Sprawdź logi: `heroku logs --tail`
- Zweryfikuj, czy endpoint działa: `curl -X POST https://twoja-aplikacja.herokuapp.com/api/test-all`
- Sprawdź konfigurację schedulera w Heroku Dashboard

### Problem: Błędy 503
- Sprawdź, czy zmienne środowiskowe Supabase są ustawione
- Zweryfikuj połączenie z bazą: `heroku run node check-config.js`

### Problem: Timeout
- Zwiększ timeout w request body: `{"timeout": 20000}`
- Sprawdź, czy serwisy odpowiadają w rozsądnym czasie

