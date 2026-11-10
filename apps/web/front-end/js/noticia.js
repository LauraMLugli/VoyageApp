// =============================================
// NOTICIA.JS - Carrega a notícia pelo ID
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('noticiaContent');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!container) return;

    // Estado de carregamento
    container.innerHTML = `<div class="noticia-loading">Carregando notícia...</div>`;

    if (!id) {
        container.innerHTML = `
            <div class="noticia-container">
                <div class="noticia-erro">
                    <p>Nenhuma notícia selecionada.</p>
                    <a href="blog.html" class="btn-voltar-noticia">
                        <i class="bi bi-arrow-left"></i> Voltar ao Blog
                    </a>
                </div>
            </div>`;
        return;
    }

    try {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .eq('publicada', true)
            .single();

        if (error || !data) {
            container.innerHTML = `
                <div class="noticia-container">
                    <div class="noticia-erro">
                        <p>Esta notícia não existe ou foi removida.</p>
                        <a href="blog.html" class="btn-voltar-noticia">
                            <i class="bi bi-arrow-left"></i> Voltar ao Blog
                        </a>
                    </div>
                </div>`;
            return;
        }

        document.title = `${data.titulo} | Voyage`;

        const dataFormatada = data.created_at
            ? new Date(data.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })
            : '';

        container.innerHTML = `
            <div class="noticia-container">
                <div class="noticia-meta">
                    <span><i class="bi bi-person"></i> ${data.autor || 'Equipe Voyage'}</span>
                    ${dataFormatada ? `<span><i class="bi bi-calendar3"></i> ${dataFormatada}</span>` : ''}
                </div>

                <h1 class="noticia-titulo">${data.titulo}</h1>

                <img
                        alt="${data.titulo}" 
                        class="noticia-imagem-principal"
                >

                <div class="noticia-corpo">
                    <p>${data.conteudo}</p>
                </div>

                <a href="blog.html" class="btn-voltar-noticia">
                    <i class="bi bi-arrow-left"></i> Voltar ao Blog
                </a>
            </div>
        `;

        const image = container.querySelector('.noticia-imagem-principal');
        image.addEventListener('error', () => {
            image.onerror = null;
            image.src = defaultNewsImage;
        }, { once: true });
        image.src = resolverImagemWeb(data.imagem_url);

    } catch (err) {
        console.error('Erro ao carregar notícia:', err);
        container.innerHTML = `
            <div class="noticia-container">
                <div class="noticia-erro">
                    <p>Ocorreu um erro ao carregar a notícia.</p>
                    <a href="blog.html" class="btn-voltar-noticia">
                        <i class="bi bi-arrow-left"></i> Voltar ao Blog
                    </a>
                </div>
            </div>`;
    }
});