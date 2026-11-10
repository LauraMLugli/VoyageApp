// =============================================
// MODO NOTURNO - LÓGICA COMPLETA (COM TROCA DE IMAGENS)
// =============================================

// Função para pegar o caminho correto da logo baseado na página atual
function getLogoPath(isDarkMode) {
    // Pega a logo atual do DOM
    const logo = document.querySelector('.brand img.logo');
    
    if (!logo) return null;

    // Pega o src atual (ex: ./front-end/img/voyage_logo.svg ou ../img/voyage_logo.svg)
    const currentSrc = logo.src;
    
    // Separa o caminho da pasta e o nome do arquivo
    const lastSlashIndex = currentSrc.lastIndexOf('/');
    const basePath = currentSrc.substring(0, lastSlashIndex + 1); // Ex: ./front-end/img/ ou ../img/
    
    // Define o novo nome do arquivo
    const fileName = isDarkMode ? 'voyage_logo_noturna.svg' : 'voyage_logo.svg';
    
    // Retorna o novo caminho completo
    return basePath + fileName;
}

// Função para ativar/desativar o modo noturno
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');

    // Salva a preferência do usuário
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('voyage-dark-mode', isDarkMode ? 'enabled' : 'disabled');

    // Atualiza o ícone do botão
    const darkModeIcon = document.getElementById('darkModeIcon');
    if (darkModeIcon) {
        darkModeIcon.classList.toggle('bi-moon-stars-fill', isDarkMode);
        darkModeIcon.classList.toggle('bi-sun-fill', !isDarkMode);
    }

    // TROCA DE IMAGENS
    updateImages(isDarkMode);
}

// Função para trocar as imagens baseadas no modo
function updateImages(isDarkMode) {
    // 1. Troca da Logo principal (usando caminho dinâmico)
    const logo = document.querySelector('.brand img.logo');
    if (logo) {
        const logoPath = getLogoPath(isDarkMode);
        if (logoPath) {
            logo.src = logoPath;
        }
    }

    // 2. Troca das fotos da equipe (se existirem)
    const equipeFotos = document.querySelectorAll('.equipe-foto img');
    equipeFotos.forEach((img, index) => {
        const fotoNormal = img.getAttribute('data-src-normal');
        const fotoNoturna = img.getAttribute('data-src-noturna');
        
        if (fotoNoturna && fotoNormal) {
            img.src = isDarkMode ? fotoNoturna : fotoNormal;
        }
    });

    // 3. Troca das imagens das cidades (se existirem)
    const cidadeImagens = document.querySelectorAll('.city-image, .regioes-hero-image img, .cidade-item img');
    cidadeImagens.forEach((img) => {
        const imgNormal = img.getAttribute('data-src-normal');
        const imgNoturna = img.getAttribute('data-src-noturna');
        
        if (imgNoturna && imgNormal) {
            img.src = isDarkMode ? imgNoturna : imgNormal;
        }
    });

    // 4. Troca da imagem do app (se existir)
    const appImage = document.querySelector('.app-image-container img');
    if (appImage) {
        const appNormal = appImage.getAttribute('data-src-normal');
        const appNoturna = appImage.getAttribute('data-src-noturna');
        
        if (appNoturna && appNormal) {
            appImage.src = isDarkMode ? appNoturna : appNormal;
        }
    }

    // 5. Troca da imagem da visão (se existir)
    const visionImage = document.querySelector('.vision-image img');
    if (visionImage) {
        const visionNormal = visionImage.getAttribute('data-src-normal');
        const visionNoturna = visionImage.getAttribute('data-src-noturna');
        
        if (visionNoturna && visionNormal) {
            visionImage.src = isDarkMode ? visionNoturna : visionNormal;
        }
    }

    // 6. Troca da logo da Fatec (se existir)
    const fatecLogo = document.querySelector('.sobre-voyage-image img');
    if (fatecLogo) {
        const fatecNormal = fatecLogo.getAttribute('data-src-normal');
        const fatecNoturna = fatecLogo.getAttribute('data-src-noturna');
        
        if (fatecNoturna && fatecNormal) {
            fatecLogo.src = isDarkMode ? fatecNoturna : fatecNormal;
        }
    }
}

// Verifica se o usuário já tinha ativado o modo noturno anteriormente
function initDarkMode() {
    const savedMode = localStorage.getItem('voyage-dark-mode');
    const body = document.body;
    
    if (savedMode === 'enabled') {
        body.classList.add('dark-mode');
        
        // Atualiza o ícone se o botão existir
        const darkModeIcon = document.getElementById('darkModeIcon');
        if (darkModeIcon) {
            darkModeIcon.classList.remove('bi-sun-fill');
            darkModeIcon.classList.add('bi-moon-stars-fill');
        }

        // TROCA AS IMAGENS PARA O MODO NOTURNO
        updateImages(true);
    } else {
        // Se não estiver em modo noturno, garante que as imagens normais sejam usadas
        updateImages(false);
    }
}

// Executa a verificação assim que a página carrega
document.addEventListener('DOMContentLoaded', initDarkMode);