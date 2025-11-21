// Initialize Supabase
// Assumes supabase-js is loaded via CDN and window.APP_CONFIG is set
const { createClient } = supabase;

if (!window.APP_CONFIG.supabaseUrl || window.APP_CONFIG.supabaseUrl === 'YOUR_SUPABASE_URL') {
    console.warn('Supabase not configured. Please update config.js');
}

const supabaseClient = createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabaseKey
);

// Helper to check auth
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

// Helper to logout
async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Error logging out:', error);
    window.location.reload();
}
