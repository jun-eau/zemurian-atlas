/**
 * @file main.js
 * This is the main entry point for all JavaScript on the site.
 * It handles routing to page-specific logic.
 */

import { highlightActiveNav } from './lib/shared.js';
import { initReleasesPage } from './releases.js';
import { initTimelinePage } from './timeline.js';
import { initMapPage } from './map.js';
import { initHomePage } from './home.js';

/**
 * Determines the current page and runs the appropriate initialization functions.
 */
function route() {
    // Run shared logic on all pages
    highlightActiveNav();

    // Get the current page filename
    const currentPage = window.location.pathname.split('/').pop();

    // Route to page-specific logic
    if (currentPage === '' || currentPage === 'index.html') {
        initHomePage();
    } else if (currentPage === 'games.html') {
        initReleasesPage();
    } else if (currentPage === 'timeline.html') {
        initTimelinePage();
    } else if (currentPage === 'map.html') {
        initMapPage();
    }
}

// Run the router once the DOM is loaded
document.addEventListener('DOMContentLoaded', route);
