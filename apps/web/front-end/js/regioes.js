// Filtro de cidades em tempo real
const searchInput = document.getElementById('searchInput');
const cidadeItems = document.querySelectorAll('.cidade-item');

searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();

    cidadeItems.forEach(item => {
        const cityName = item.getAttribute('data-name').toLowerCase();
        
        if (cityName.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
});