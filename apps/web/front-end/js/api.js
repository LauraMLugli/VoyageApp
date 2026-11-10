// =============================================
// API.JS - Funções compartilhadas do Voyage
// =============================================

const webImagesDirectory = new URL('../img/', document.currentScript.src);
const defaultNewsImage = new URL('noticia_1.png', webImagesDirectory).href;

function resolverImagemWeb(imagePath) {
    const path = typeof imagePath === 'string' ? imagePath.trim() : '';

    if (!path) return defaultNewsImage;
    if (/^(https?:|\/\/|data:image\/|blob:)/i.test(path)) return path;

    const normalizedPath = path.replace(/\\/g, '/');
    const localImageMatch = normalizedPath.match(/(?:^|\/)(?:front-end\/)?img\/(.+)$/i);

    if (localImageMatch) {
        return new URL(localImageMatch[1], webImagesDirectory).href;
    }

    if (!normalizedPath.includes('/')) {
        return new URL(normalizedPath, webImagesDirectory).href;
    }

    return new URL(normalizedPath, document.baseURI).href;
}

async function buscarNoticias() {
    const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('publicada', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar notícias:', error);
        return [];
    }
    return data || [];
}

async function buscarParceiros() {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar parceiros:', error);
        return [];
    }
    return data || [];
}

async function buscarRegioes() {
    const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao buscar regiões:', error);
        return [];
    }
    return data || [];
}