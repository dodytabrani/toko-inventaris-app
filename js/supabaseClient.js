// js/supabaseClient.js

// GANTI DENGAN KREDENSIAL PROYEK SUPABASE ANDA!
const SUPABASE_URL = 'https://sjxhosrvcmejqprooofk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGhvc3J2Y21lanFwcm9vb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzIxMzEsImV4cCI6MjA2NjgwODEzMX0.n3RmP7ouaZSPBuymRi6axXWZQc_DJKi2gX0VEeV3o4U';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);