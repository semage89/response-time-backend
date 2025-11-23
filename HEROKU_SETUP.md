# Konfiguracja aplikacji na Heroku

## Krok 1: Przygotowanie bazy danych Supabase

1. **Utwórz projekt w Supabase:**
   - Przejdź do https://app.supabase.com
   - Kliknij "New Project"
   - Wypełnij formularz i poczekaj na utworzenie projektu

2. **Wykonaj skrypty SQL:**
   - W Supabase przejdź do **SQL Editor**
   - Wykonaj skrypt `supabase-schema.sql` (tworzy tabele)
   - Wykonaj skrypt `supabase-functions.sql` (tworzy funkcje pomocnicze)

3. **Pobierz dane dostępowe:**
   - Przejdź do **Settings > API**
   - Skopiuj:
     - **Project URL** (np. `https://xxxxx.supabase.co`)
     - **anon/public key** (klucz publiczny)

## Krok 2: Konfiguracja Heroku

### Opcja A: Przez Heroku Dashboard (zalecane)

1. **Przejdź do swojego projektu na Heroku:**
   - https://dashboard.heroku.com/apps
   - Wybierz swoją aplikację

2. **Ustaw zmienne środowiskowe:**
   - Przejdź do **Settings**
   - Kliknij **Reveal Config Vars**
   - Dodaj następujące zmienne:

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **WAŻNE:** Użyj `SUPABASE_ANON_KEY`, nie service_role key!

### Opcja B: Przez Heroku CLI

```bash
# Zainstaluj Heroku CLI jeśli nie masz
# https://devcenter.heroku.com/articles/heroku-cli

# Zaloguj się
heroku login

# Przejdź do katalogu projektu
cd response-time-backend-1

# Ustaw zmienne środowiskowe
heroku config:set SUPABASE_URL=https://xxxxx.supabase.co
heroku config:set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sprawdź ustawione zmienne
heroku config
```

## Krok 3: Wdrożenie na Heroku

### Jeśli aplikacja już jest na Heroku:

```bash
# Dodaj zmiany do git
git add .
git commit -m "Add Supabase integration"

# Wypchnij na Heroku
git push heroku main

# Sprawdź logi
heroku logs --tail
```

### Jeśli dopiero wdrażasz:

```bash
# Zainicjalizuj git (jeśli jeszcze nie)
git init
git add .
git commit -m "Initial commit"

# Utwórz aplikację na Heroku
heroku create twoja-nazwa-aplikacji

# Wypchnij kod
git push heroku main

# Otwórz aplikację
heroku open
```

## Krok 4: Weryfikacja

1. **Sprawdź status aplikacji:**
   ```bash
   heroku ps
   heroku logs --tail
   ```

2. **Przetestuj endpoint health:**
   ```bash
   curl https://twoja-aplikacja.herokuapp.com/api/health
   ```
   
   Powinieneś zobaczyć:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T12:00:00.000Z",
     "database": "connected"
   }
   ```

3. **Otwórz aplikację w przeglądarce:**
   - Przejdź do `https://twoja-aplikacja.herokuapp.com`
   - Sprawdź, czy dashboard się ładuje
   - Dodaj testowy serwis i wykonaj test

## Krok 5: Konfiguracja CORS w Supabase (jeśli potrzebna)

Jeśli masz problemy z CORS, w Supabase:

1. Przejdź do **Settings > API**
2. W sekcji **CORS** dodaj domenę Heroku:
   ```
   https://twoja-aplikacja.herokuapp.com
   ```

## Rozwiązywanie problemów

### Problem: "Database not configured"
- **Przyczyna:** Zmienne środowiskowe nie są ustawione
- **Rozwiązanie:** Sprawdź `heroku config` i upewnij się, że `SUPABASE_URL` i `SUPABASE_ANON_KEY` są ustawione

### Problem: "Error fetching services"
- **Przyczyna:** Błąd połączenia z Supabase lub nieprawidłowe dane dostępowe
- **Rozwiązanie:** 
  - Sprawdź logi: `heroku logs --tail`
  - Zweryfikuj klucze w Supabase Dashboard
  - Upewnij się, że tabele zostały utworzone w Supabase

### Problem: Aplikacja nie startuje
- **Przyczyna:** Błąd w kodzie lub brakujące zależności
- **Rozwiązanie:**
  ```bash
  heroku logs --tail
  # Sprawdź błędy i popraw kod
  git push heroku main
  ```

### Problem: Port already in use
- **Przyczyna:** Heroku automatycznie ustawia PORT, ale kod może próbować użyć innego
- **Rozwiązanie:** Kod już używa `process.env.PORT || 3000`, więc powinno działać

## Dodatkowe wskazówki

### Automatyczne wdrożenia z GitHub

1. W Heroku Dashboard przejdź do **Deploy**
2. Połącz z repozytorium GitHub
3. Włącz **Automatic deploys** dla brancha `main`

### Monitoring

- Użyj **Heroku Metrics** do monitorowania wydajności
- Włącz **Heroku Logs** do śledzenia błędów
- Rozważ dodanie **Sentry** lub podobnego narzędzia do monitorowania błędów

### Backup bazy danych

- W Supabase Dashboard przejdź do **Database > Backups**
- Skonfiguruj automatyczne backupy
- Rozważ ręczne backupy przed większymi zmianami

## Bezpieczeństwo

⚠️ **WAŻNE:**
- **NIGDY** nie commituj pliku `.env` do git
- Używaj **anon/public key** w aplikacji frontend/backend, nie service_role key
- Service role key powinien być używany tylko w bezpiecznych środowiskach serwerowych
- Włącz **Row Level Security (RLS)** w Supabase, jeśli potrzebujesz dodatkowego bezpieczeństwa

## Sprawdzenie konfiguracji

### Lokalnie

Uruchom skrypt weryfikacyjny:

```bash
npm run check-config
```

Skrypt sprawdzi:
- ✅ Czy zmienne środowiskowe są ustawione
- ✅ Czy połączenie z Supabase działa
- ✅ Czy tabele istnieją
- ✅ Statystyki bazy danych

### Na Heroku

Sprawdź zmienne środowiskowe:

```bash
heroku config
```

Lub uruchom skrypt weryfikacyjny na Heroku:

```bash
heroku run node check-config.js
```

### Szybka weryfikacja przez API

```bash
curl https://twoja-aplikacja.herokuapp.com/api/health
```

Powinieneś zobaczyć:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected"
}
```

Jeśli `database` pokazuje `"not configured"`, sprawdź zmienne środowiskowe w Heroku.

