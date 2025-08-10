/**
 * @file shared.js
 * Contains shared logic used across multiple pages, such as navigation highlighting.
 */

/**
 * Sets the 'active' class on the main navigation link corresponding to the current page.
 */
export function highlightActiveNav() {
    const currentPageUrl = window.location.pathname.split('/').pop();
    const mainNavLinks = document.querySelectorAll('.main-navigation a');

    mainNavLinks.forEach(link => {
        const linkUrl = link.getAttribute('href').split('/').pop();
        // Clear any existing 'active' class
        link.classList.remove('active');
        // Add 'active' class if the link href matches the current page URL
        if (linkUrl === currentPageUrl || (currentPageUrl === '' && linkUrl === 'index.html')) {
            link.classList.add('active');
        }
    });
}
