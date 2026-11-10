
    // Lógica do Carrossel de Cards
    const cards = document.querySelectorAll('.card');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevCard');
    const nextBtn = document.getElementById('nextCard');
    let currentCard = 0;

    function updateCarousel(index) {
        // Remove classe ativa de todos
        cards.forEach(card => card.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Adiciona ao card e dot atual
        cards[index].classList.add('active');
        dots[index].classList.add('active');
        currentCard = index;
    }

    // Eventos das bolinhas
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => updateCarousel(index));
    });

    // Eventos das setas
    prevBtn.addEventListener('click', () => {
        let newIndex = currentCard - 1;
        if (newIndex < 0) newIndex = cards.length - 1;
        updateCarousel(newIndex);
    });

    nextBtn.addEventListener('click', () => {
        let newIndex = currentCard + 1;
        if (newIndex >= cards.length) newIndex = 0;
        updateCarousel(newIndex);
    });


// ===== Lógica do Loop de Cidades (Matão <-> Taquaritinga) =====
const cityText = document.getElementById('changing-city');
const cityImages = document.querySelectorAll('.city-image');
const creditText = document.getElementById('creditText');
const creditLink = document.getElementById('creditLink');
const cities = ['Matão', 'Taquaritinga'];
let currentCityIndex = 0;

function changeCity() {
    // Alterna o índice
    currentCityIndex = (currentCityIndex + 1) % cities.length;
    const nextCity = cities[currentCityIndex];

    // 1. Troca o texto com um pequeno fade (opcional)
    cityText.style.opacity = '0';
    setTimeout(() => {
        cityText.textContent = nextCity;
        cityText.style.opacity = '1';
    }, 300);

    // 2. Troca a imagem e atualiza os créditos
    cityImages.forEach(img => {
        img.classList.remove('active');
        if (img.dataset.city === nextCity) {
            img.classList.add('active');
            
            // Atualiza os créditos
            if (creditText && creditLink) {
                creditText.innerHTML = 'Foto: <a href="' + img.dataset.creditLink + '" target="_blank" rel="noopener noreferrer">' + img.dataset.credit + '</a>';
            }
        }
    });
}

// Inicia o loop a cada 4 segundos
setInterval(changeCity, 4000);