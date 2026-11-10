// =============================================
// ADMIN.JS - VOYAGE
// =============================================

// Verificar se está logado
const adminLogado = localStorage.getItem('voyage_admin');
if (!adminLogado) {
    window.location.href = './login.html';
}

// =============================================
// NAVEGAÇÃO ENTRE SEÇÕES
// =============================================
function mostrarSecao(secao) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(secao).classList.add('active');

    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`[data-section="${secao}"]`);
    if (link) link.classList.add('active');

    // Carrega os dados da seção
    if (secao === 'noticias') carregarNoticias();
    if (secao === 'parceiros') carregarParceiros();
    if (secao === 'regioes') carregarRegioes();
    if (secao === 'dashboard') carregarDashboard();
}

// =============================================
// DASHBOARD - CONTADORES
// =============================================
async function carregarDashboard() {
    try {
        const [noticias, parceiros, regioes] = await Promise.all([
            supabase.from('news').select('id', { count: 'exact', head: true }),
            supabase.from('partners').select('id', { count: 'exact', head: true }),
            supabase.from('regions').select('id', { count: 'exact', head: true })
        ]);

        document.getElementById('count-noticias').textContent = noticias.count || 0;
        document.getElementById('count-parceiros').textContent = parceiros.count || 0;
        document.getElementById('count-regioes').textContent = regioes.count || 0;
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
    }
}

// =============================================
// NOTÍCIAS
// =============================================
async function carregarNoticias() {
    const tbody = document.getElementById('tabela-noticias');
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Carregando...</td></tr>`;

    try {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="bi bi-newspaper"></i>
                        <p>Nenhuma notícia cadastrada ainda</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.titulo}</td>
                <td>${item.autor || '-'}</td>
                <td>
                    <span class="badge ${item.publicada ? 'badge-success' : 'badge-muted'}">
                        ${item.publicada ? 'Publicada' : 'Rascunho'}
                    </span>
                </td>
                <td>${formatarData(item.created_at)}</td>
                <td class="actions">
                    <button class="btn-icon btn-delete" onclick="deletarItem('news', '${item.id}')" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Erro ao carregar notícias</td></tr>`;
    }
}

// =============================================
// PARCEIROS
// =============================================
async function carregarParceiros() {
    const tbody = document.getElementById('tabela-parceiros');
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Carregando...</td></tr>`;

    try {
        const { data, error } = await supabase
            .from('partners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="bi bi-people"></i>
                        <p>Nenhum parceiro cadastrado ainda</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.nome}</td>
                <td>${item.descricao || '-'}</td>
                <td>
                    <span class="badge ${item.ativo ? 'badge-success' : 'badge-muted'}">
                        ${item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn-icon btn-delete" onclick="deletarItem('partners', '${item.id}')" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Erro ao carregar parceiros</td></tr>`;
    }
}

// =============================================
// REGIÕES
// =============================================
async function carregarRegioes() {
    const tbody = document.getElementById('tabela-regioes');
    tbody.innerHTML = `<tr><td colspan="3" class="empty-state">Carregando...</td></tr>`;

    try {
        const { data, error } = await supabase
            .from('regions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-state">
                        <i class="bi bi-geo-alt"></i>
                        <p>Nenhuma região cadastrada ainda</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.nome}</td>
                <td>${item.descricao || '-'}</td>
                <td class="actions">
                    <button class="btn-icon btn-delete" onclick="deletarItem('regions', '${item.id}')" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="3" class="empty-state">Erro ao carregar regiões</td></tr>`;
    }
}

// =============================================
// DELETAR ITEM
// =============================================
async function deletarItem(tabela, id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
        const { error } = await supabase
            .from(tabela)
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Recarrega a seção atual
        if (tabela === 'news') carregarNoticias();
        if (tabela === 'partners') carregarParceiros();
        if (tabela === 'regions') carregarRegioes();
        carregarDashboard();
    } catch (err) {
        console.error(err);
        alert('Erro ao excluir item.');
    }
}

// =============================================
// MODAL
// =============================================
let tipoAtual = null;

function abrirModal(tipo) {
    tipoAtual = tipo;
    const modal = document.getElementById('modal');
    const titulo = document.getElementById('modal-titulo');
    const campos = document.getElementById('campos-modal');

    let html = '';

    if (tipo === 'noticia') {
        titulo.textContent = 'Nova Notícia';
        html = `
            <div class="form-group">
                <label>Título</label>
                <input type="text" name="titulo" required>
            </div>
            <div class="form-group">
                <label>Conteúdo</label>
                <textarea name="conteudo" required></textarea>
            </div>
            <div class="form-group">
                <label>Autor</label>
                <input type="text" name="autor">
            </div>
            <div class="form-group">
                <label>URL da Imagem</label>
                <input type="text" name="imagem_url">
            </div>
        `;
    }

    if (tipo === 'parceiro') {
        titulo.textContent = 'Novo Parceiro';
        html = `
            <div class="form-group">
                <label>Nome</label>
                <input type="text" name="nome" required>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea name="descricao"></textarea>
            </div>
            <div class="form-group">
                <label>URL do Logo</label>
                <input type="text" name="logo_url">
            </div>
            <div class="form-group">
                <label>Site</label>
                <input type="text" name="site_url">
            </div>
        `;
    }

    if (tipo === 'regiao') {
        titulo.textContent = 'Nova Região';
        html = `
            <div class="form-group">
                <label>Nome</label>
                <input type="text" name="nome" required>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea name="descricao"></textarea>
            </div>
            <div class="form-group">
                <label>URL da Imagem</label>
                <input type="text" name="imagem_url">
            </div>
        `;
    }

    campos.innerHTML = html;
    modal.classList.add('active');
}

function fecharModal() {
    document.getElementById('modal').classList.remove('active');
    tipoAtual = null;
}

// =============================================
// SALVAR (INSERT)
// =============================================
document.getElementById('form-modal').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());

    try {
        let tabela = '';
        let payload = {};

        if (tipoAtual === 'noticia') {
            tabela = 'news';
            payload = {
                titulo: dados.titulo,
                conteudo: dados.conteudo,
                autor: dados.autor || null,
                imagem_url: dados.imagem_url || null,
                publicada: true
            };
        }

        if (tipoAtual === 'parceiro') {
            tabela = 'partners';
            payload = {
                nome: dados.nome,
                descricao: dados.descricao || null,
                logo_url: dados.logo_url || null,
                site_url: dados.site_url || null,
                ativo: true
            };
        }

        if (tipoAtual === 'regiao') {
            tabela = 'regions';
            payload = {
                nome: dados.nome,
                descricao: dados.descricao || null,
                imagem_url: dados.imagem_url || null
            };
        }

        const { error } = await supabase.from(tabela).insert([payload]);

        if (error) throw error;

        fecharModal();

        // Recarrega a lista
        if (tipoAtual === 'noticia') carregarNoticias();
        if (tipoAtual === 'parceiro') carregarParceiros();
        if (tipoAtual === 'regiao') carregarRegioes();
        carregarDashboard();

    } catch (err) {
        console.error(err);
        alert('Erro ao salvar. Verifique o console.');
    }
});

// =============================================
// LOGOUT
// =============================================
function logout() {
    localStorage.removeItem('voyage_admin');
    window.location.href = './login.html';
}

// =============================================
// UTILITÁRIOS
// =============================================
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDashboard();
});