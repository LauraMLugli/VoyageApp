// =============================================
// CONFIGURAÇÃO DO SUPABASE - VOYAGE
// =============================================

const SUPABASE_URL = 'https://bgxubkefecukhbaffrgu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IGFcsWWm5zkl8B_u1BG1QQ_RO8u7qbB';

// Cria o cliente usando a biblioteca carregada pelo CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Deixa disponível globalmente com o nome que o login.js espera
window.supabase = supabaseClient;