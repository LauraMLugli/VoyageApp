// =============================================
// ACESSIBILIDADE - FILTROS DE DALTONISMO (CORRIGIDO)
// =============================================

// Estado atual do filtro
let currentFilter = 'padrao';

// Lista de filtros disponíveis
const filters = [
    { id: 'padrao', name: 'Modo Padrão', message: 'Filtro padrão ativado. Cores originais restauradas.' },
    { id: 'protanopia', name: 'Protanopsia', message: 'Filtro de Protanopsia ativado. Cores ajustadas para vermelho/verde.' },
    { id: 'deuteranopia', name: 'Deuteranopia', message: 'Filtro de Deuteranopia ativado. Cores ajustadas para verde/vermelho.' },
    { id: 'tritanopia', name: 'Tritanopia', message: 'Filtro de Tritanopia ativado. Cores ajustadas para azul/amarelo.' },
    { id: 'acromatopsia', name: 'Acromatopsia', message: 'Filtro de Acromatopsia ativado. Cores em tons de cinza.' }
];

// Elementos do menu
const menu = document.getElementById('accessibilityMenu');
const overlay = document.getElementById('accessibilityOverlay');
const toggleBtn = document.getElementById('accessibilityToggle');
const closeBtn = document.getElementById('accessibilityClose');

// Função para abrir o menu
function openAccessibilityMenu() {
    if (!menu) return;
    menu.classList.add('open');
    overlay.classList.add('show');
}

// Função para fechar o menu
function closeAccessibilityMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    overlay.classList.remove('show');
}

// Função para mostrar mensagem personalizada (Toast)
function showAccessibilityToast(message) {
    const toast = document.getElementById('accessibilityToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show', 'success');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Função para aplicar o filtro
function applyFilter(filterId) {
    // Remove todos os filtros anteriores
    document.body.classList.remove(
        'daltonismo-protanopia',
        'daltonismo-deuteranopia',
        'daltonismo-tritanopia',
        'daltonismo-acromatopsia'
    );
    
    // Se não for o modo padrão, aplica o filtro
    if (filterId !== 'padrao') {
        document.body.classList.add(`daltonismo-${filterId}`);
    }
    
    // Atualiza o estado atual
    currentFilter = filterId;
    
    // Salva a preferência
    localStorage.setItem('voyage-accessibility-filter', filterId);
    
    // Atualiza os botões de rádio
    document.querySelectorAll('input[name="daltonismo"]').forEach(radio => {
        radio.checked = (radio.value === filterId);
    });
    
    // Mostra mensagem personalizada
    const filter = filters.find(f => f.id === filterId);
    if (filter) {
        showAccessibilityToast(filter.message);
    }
}

// Inicializa o filtro salvo
function initAccessibility() {
    const savedFilter = localStorage.getItem('voyage-accessibility-filter');
    
    if (savedFilter) {
        applyFilter(savedFilter);
    }
}

// EVENTOS DO MENU (GARANTE QUE SEMPRE FUNCIONEM)
if (toggleBtn) {
    toggleBtn.addEventListener('click', openAccessibilityMenu);
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeAccessibilityMenu);
}

if (overlay) {
    overlay.addEventListener('click', closeAccessibilityMenu);
}

// Eventos dos botões de rádio
document.querySelectorAll('input[name="daltonismo"]').forEach(radio => {
    radio.addEventListener('change', (event) => {
        applyFilter(event.target.value);
        // Fecha o menu após selecionar
        closeAccessibilityMenu();
    });
});

// Inicializa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    initAccessibility();
    
    // Garante que o menu não fique aberto ao carregar a página
    closeAccessibilityMenu();
});