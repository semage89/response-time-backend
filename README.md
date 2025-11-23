# Response Time Backend - Monitor czasu odpowiedzi serwisów

Aplikacja do monitorowania czasu odpowiedzi serwisów internetowych z integracją Supabase.

## Instalacja

1. Zainstaluj zależności:
```bash
npm install
```

2. Skonfiguruj zmienne środowiskowe:
```bash
cp .env.example .env
```

3. Uzupełnij plik `.env` danymi z Supabase:
   - `SUPABASE_URL` - URL projektu Supabase
   - `SUPABASE_ANON_KEY` - Klucz anon/public z Supabase

## Konfiguracja bazy danych Supabase

1. Utwórz projekt w Supabase: https://app.supabase.com

2. W SQL Editor wykonaj skrypty:
   - `supabase-schema.sql` - tworzy tabele i widoki
   - `supabase-functions.sql` - tworzy funkcje pomocnicze

3. Skopiuj URL projektu i klucz anon z Settings > API

## Uruchomienie lokalnie

```bash
npm start
```

Aplikacja będzie dostępna na http://localhost:3000

## Wdrożenie na Heroku

Szczegółowe instrukcje znajdziesz w pliku [HEROKU_SETUP.md](./HEROKU_SETUP.md)

**Szybki start:**
1. Ustaw zmienne środowiskowe w Heroku:
   ```bash
   heroku config:set SUPABASE_URL=twoj_url
   heroku config:set SUPABASE_ANON_KEY=twoj_klucz
   ```

2. Wypchnij kod:
   ```bash
   git push heroku main
   ```

## Struktura bazy danych

### Tabela `services`
- `id` (UUID) - unikalny identyfikator
- `name` (VARCHAR) - nazwa serwisu
- `url` (VARCHAR) - URL serwisu
- `threshold` (INTEGER) - próg czasu odpowiedzi w ms
- `errors` (INTEGER) - licznik błędów
- `created_at`, `updated_at` - znaczniki czasu

### Tabela `service_tests`
- `id` (UUID) - unikalny identyfikator
- `service_id` (UUID) - referencja do services
- `success` (BOOLEAN) - czy test zakończył się sukcesem
- `response_time` (INTEGER) - czas odpowiedzi w ms
- `status_code` (INTEGER) - kod HTTP
- `error_message` (TEXT) - wiadomość błędu
- `timestamp` - czas wykonania testu

## API Endpoints

- `GET /api/services` - pobierz wszystkie serwisy z historią
- `POST /api/services` - dodaj nowy serwis
- `DELETE /api/services/:id` - usuń serwis
- `POST /api/test` - wykonaj test serwisu i zapisz wynik
- `GET /api/services/:id/tests` - pobierz historię testów dla serwisu
- `GET /api/health` - sprawdź status aplikacji

## Funkcje

- Monitorowanie czasu odpowiedzi wielu serwisów
- Automatyczne testy co 30 minut
- Wizualizacja danych na wykresach
- Eksport danych do CSV
- Filtrowanie historii po zakresie dat
- Statystyki (min, max, średnia, mediana, odchylenie standardowe)

