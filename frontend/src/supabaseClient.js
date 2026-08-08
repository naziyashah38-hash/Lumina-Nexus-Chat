// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pseaazvukvhtveaywtue.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZWFhenZ1a3ZodHZlYXl3dHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MzMyMzksImV4cCI6MjEwMTUwOTIzOX0.S-h-W8eD7pMZ41R90g73KixrLcNkvh2nCkPo-I0YSwY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);