// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bymdtyokelfkiaunomco.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5bWR0eW9rZWxma2lhdW5vbWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDgwMjYsImV4cCI6MjA2Nzg4NDAyNn0.BEOgpAfrtFSid_8EjnnCXWatdK5Ianx3F2-_L9nTjec";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});