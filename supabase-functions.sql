-- Dodatkowe funkcje pomocnicze dla Supabase

-- Funkcja do zwiększania licznika błędów serwisu
CREATE OR REPLACE FUNCTION increment_service_errors(service_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE services 
  SET errors = errors + 1, updated_at = NOW()
  WHERE id = service_id;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do czyszczenia starych testów (opcjonalnie - do użycia w cron job)
-- Usuwa testy starsze niż określona liczba dni
CREATE OR REPLACE FUNCTION cleanup_old_tests(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM service_tests
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

