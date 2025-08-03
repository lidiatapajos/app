const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mriyckqgacainraogeif.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaXlja3FnYWNhaW5yYW9nZWlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkxNDM4NCwiZXhwIjoyMDY5NDkwMzg0fQ.aP5bLKZYLMBec-rRaNYPfcJkLw1NhibgznhBduRP9DU';


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
