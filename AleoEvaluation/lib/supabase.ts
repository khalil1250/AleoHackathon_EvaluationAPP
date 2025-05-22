// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osypqovrlpmjgmczqqfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeXBxb3ZybHBtamdtY3pxcWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTE5MzgsImV4cCI6MjA2MzQ4NzkzOH0.O_YcoLefMXzGjK2m-inBZ1tAmS-btp9u8WGQkgPc2mU';
export const supabase = createClient(supabaseUrl, supabaseKey);
