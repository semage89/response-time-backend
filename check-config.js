#!/usr/bin/env node

/**
 * Skrypt do weryfikacji konfiguracji Supabase
 * Uruchom: node check-config.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Sprawdzanie konfiguracji Supabase...\n');

// Sprawdź zmienne środowiskowe
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL nie jest ustawione');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY nie jest ustawione');
  process.exit(1);
}

console.log('✅ Zmienne środowiskowe są ustawione');
console.log(`   SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);

// Test połączenia
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  try {
    // Sprawdź, czy tabele istnieją
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .limit(1);

    if (servicesError) {
      console.error('❌ Błąd połączenia z tabelą services:', servicesError.message);
      console.error('   Upewnij się, że wykonałeś skrypt supabase-schema.sql');
      process.exit(1);
    }

    console.log('✅ Połączenie z bazą danych działa');
    console.log('✅ Tabela services istnieje');

    // Sprawdź tabelę service_tests
    const { data: tests, error: testsError } = await supabase
      .from('service_tests')
      .select('id')
      .limit(1);

    if (testsError) {
      console.error('❌ Błąd połączenia z tabelą service_tests:', testsError.message);
      process.exit(1);
    }

    console.log('✅ Tabela service_tests istnieje');

    // Sprawdź liczbę serwisów
    const { count } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Statystyki:`);
    console.log(`   Liczba serwisów: ${count || 0}`);

    const { count: testsCount } = await supabase
      .from('service_tests')
      .select('*', { count: 'exact', head: true });

    console.log(`   Liczba testów: ${testsCount || 0}`);

    console.log('\n✅ Konfiguracja jest poprawna!');
    console.log('🚀 Możesz uruchomić aplikację: npm start');

  } catch (error) {
    console.error('❌ Nieoczekiwany błąd:', error.message);
    process.exit(1);
  }
}

checkConnection();

