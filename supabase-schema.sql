-- Schemat bazy danych dla aplikacji monitorującej czas odpowiedzi serwisów
-- Supabase (PostgreSQL)

-- Tabela przechowująca informacje o serwisach
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 3000,
  errors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(url)
);

-- Tabela przechowująca historyczne wyniki testów
CREATE TABLE IF NOT EXISTS service_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  response_time INTEGER, -- w milisekundach, NULL jeśli błąd
  status_code INTEGER, -- HTTP status code, NULL jeśli błąd
  error_message TEXT, -- wiadomość błędu, NULL jeśli sukces
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksy dla lepszej wydajności zapytań
CREATE INDEX IF NOT EXISTS idx_service_tests_service_id ON service_tests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_tests_timestamp ON service_tests(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_service_tests_service_timestamp ON service_tests(service_id, timestamp DESC);

-- Funkcja do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger dla automatycznej aktualizacji updated_at w tabeli services
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Widok dla łatwego pobierania statystyk serwisów
CREATE OR REPLACE VIEW service_stats AS
SELECT 
  s.id,
  s.name,
  s.url,
  s.threshold,
  s.errors,
  COUNT(st.id) as total_tests,
  COUNT(CASE WHEN st.success THEN 1 END) as successful_tests,
  COUNT(CASE WHEN NOT st.success THEN 1 END) as failed_tests,
  AVG(CASE WHEN st.success THEN st.response_time END) as avg_response_time,
  MIN(CASE WHEN st.success THEN st.response_time END) as min_response_time,
  MAX(CASE WHEN st.success THEN st.response_time END) as max_response_time,
  MAX(st.timestamp) as last_test_at
FROM services s
LEFT JOIN service_tests st ON s.id = st.service_id
GROUP BY s.id, s.name, s.url, s.threshold, s.errors;

-- RLS (Row Level Security) - opcjonalnie, jeśli potrzebujesz bezpieczeństwa
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_tests ENABLE ROW LEVEL SECURITY;

-- Przykładowe dane (opcjonalnie)
-- INSERT INTO services (name, url, threshold) VALUES
--   ('Itaka.pl', 'https://itaka.pl', 3000),
--   ('Itaka.lt', 'https://itaka.lt', 3000),
--   ('Cedok.cz', 'https://cedok.cz', 3000),
--   ('Cedok.sk', 'https://cedok.sk', 3000),
--   ('Itaka.hu', 'https://itaka.hu', 3000),
--   ('Selvatour.pl', 'https://selvatour.pl', 3000),
--   ('um24.pl', 'https://um24.pl', 3000),
--   ('olakala.travel', 'https://olakala.travel', 3000);

