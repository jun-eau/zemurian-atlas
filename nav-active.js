document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.main-navigation a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        // Special case for root index.html (when currentPage might be empty string)
        if ((currentPage === '' || currentPage === 'index.html') && (linkPage === 'index.html' || linkPage === '')) {
            link.classList.add('active');
        } else if (linkPage !== '' && linkPage !== 'index.html' && currentPage === linkPage) {
            // For other pages like games.html, lore.html
            link.classList.add('active');
        }
    });
});
