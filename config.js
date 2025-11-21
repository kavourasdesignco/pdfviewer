// Supabase Configuration
// REPLACE THESE WITH YOUR ACTUAL SUPABASE PROJECT DETAILS
const SUPABASE_URL = 'https://ovoickwfqvahkrcgdvpr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b2lja3dmcXZhaGtyY2dkdnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjE3NzMsImV4cCI6MjA3OTI5Nzc3M30.FbU1OBSO8OTiThJVw9Kwwf04w83DHSWF4KCqEAfA5vo';

// Export for use in other files (if using modules) or global scope
window.APP_CONFIG = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY
};
