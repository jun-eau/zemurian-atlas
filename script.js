/**
 * @file script.js
 * Handles dynamic game data loading, HTML generation for game entries (desktop & mobile),
 * and interactive features like sliders, accordions, lightbox, and navigation.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Global Helper Functions ---

    /**
     * Creates a formatted HTML string for release dates.
     * @param {Array<Object>} releases - Array of release objects, each with date and platforms.
     * @returns {string} HTML string representing the formatted release dates.
     */
    const createReleaseString = (releases) => {
        if (!releases || releases.length === 0) {
            return '';
        }
        const [firstRelease, ...remainingReleases] = releases;
        const primaryReleaseHtml = `<span class="release-primary">${firstRelease.date} ${firstRelease.platforms}</span>`;
        const secondaryReleasesHtml = remainingReleases.map(release =>
            `<span class="release-secondary">, ${release.date} ${release.platforms}</span>`
        ).join('');
        return `${primaryReleaseHtml}${secondaryReleasesHtml}`;
    };

    // --- Desktop HTML Generation ---

    /**
     * Creates HTML for the desktop game art container.
     * @param {Object} game - The game data object.
     * @returns {string} HTML string for the art container.
     */
    function createDesktopArtContainerHTML(game) {
        return `
            <div class="art-container desktop-only">
                <img src="grid/${game.assetName}.jpg" alt="${game.englishTitle} Grid Art" class="game-grid-art">
            </div>`;
    }

    /**
     * Creates HTML for the desktop main info section (logo, titles, releases).
     * @param {Object} game - The game data object.
     * @returns {string} HTML string for the main info section.
     */
    function createDesktopMainInfoHTML(game) {
        return `
            <div class="main-info">
                <img src="logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="game-logo">
                <p class="japanese-title">
                    <span class="kanji-title">${game.japaneseTitleKanji}</span>
                    <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                </p>
                <div class="release-details">
                    <div class="release-region">
                        <h4 class="release-header">Japanese Release</h4>
                        <div class="release-list">${createReleaseString(game.releasesJP)}</div>
                    </div>
                    <div class="release-region">
                        <h4 class="release-header">English Release</h4>
                        <div class="release-list">${createReleaseString(game.releasesEN)}</div>
                    </div>
                </div>
            </div>`;
    }

    /**
     * Creates HTML for the desktop external links section.
     * @param {Object} game - The game data object.
     * @returns {string} HTML string for the external links.
     */
    function createDesktopExternalLinksHTML(game) {
        return `
            <div class="external-links">
                <a href="${game.steamUrl}" target="_blank" rel="noopener noreferrer" title="Steam Store Page">
                    <img src="logo/steam.png" alt="Steam Logo">
                </a>
                ${game.playstationUrl ? `
                <a href="${game.playstationUrl}" target="_blank" rel="noopener noreferrer" title="PlayStation Store Page">
                    <img src="logo/playstation.png" alt="PlayStation Store Logo">
                </a>` : ''}
                ${game.nintendoUrl ? `
                <a href="${game.nintendoUrl}" target="_blank" rel="noopener noreferrer" title="Nintendo eShop Page">
                    <img src="logo/nintendo.png" alt="Nintendo eShop Logo">
                </a>` : ''}
                <a href="${game.wikiUrl}" target="_blank" rel="noopener noreferrer" title="Wikipedia">
                    <img src="logo/wikipedia.png" alt="Wikipedia Logo">
                </a>
                <a href="${game.fandomUrl}" target="_blank" rel="noopener noreferrer" title="Kiseki Fandom Wiki">
                    <img src="logo/fandom.png" alt="Fandom Logo">
                </a>
            </div>`;
    }

    /**
     * Creates HTML for the desktop info container (background, content).
     * @param {Object} game - The game data object.
     * @returns {string} HTML string for the info container.
     */
    function createDesktopInfoContainerHTML(game) {
        return `
            <div class="info-container desktop-only">
                <div class="hero-background" style="background-image: url('hero/${game.assetName}.jpg');"></div>
                <div class="info-content">
                    ${createDesktopMainInfoHTML(game)}
                    ${createDesktopExternalLinksHTML(game)}
                </div>
            </div>`;
    }

    /**
     * Creates the complete HTML for a desktop game entry.
     * @param {Object} game - The game data object.
     * @returns {string} HTML string for the desktop game entry.
     */
    function createGameEntryDesktopHTML(game) {
        return `
            ${createDesktopArtContainerHTML(game)}
            ${createDesktopInfoContainerHTML(game)}`;
    }

    // --- Mobile HTML Generation ---

    /**
     * Creates HTML for a mobile game card.
     * @param {Object} game - The game data for the current card.
     * @param {boolean} [isVariant=false] - Whether this card is for a variant.
     * @param {Array<Object>|null} [allVariantsData=null] - Full list of variants (including main game) if this is the main game card.
     * @param {string|null} [mainGameAssetName=null] - Asset name of the main game if this is a variant card.
     * @returns {string} HTML string for the mobile game card.
     */
    function createMobileCardHTML(game, isVariant = false, allVariantsData = null, mainGameAssetName = null) {
        const heroImageUrl = `hero/${game.assetName}.jpg`;
        let mobileNavButtonHTML = '';
        // Add mobile navigation button if this card is part of a slider (has variant data with multiple items)
        if (allVariantsData && allVariantsData.length > 1) {
            mobileNavButtonHTML = `<button class="slider-nav-button-mobile">&#10095;</button>`; // Right arrow for "Next"
        }

        const mainGameAttr = (mainGameAssetName && isVariant) ? `data-main-game-asset="${mainGameAssetName}"` : '';


        return `
            <div class="game-entry-mobile-card mobile-only card-content-visible" ${mainGameAttr} data-asset-name="${game.assetName}">
                <div class="mobile-unified-header">
                    <div class="mobile-unified-header-bg" style="background-image: url('${heroImageUrl}');"></div>
                    <div class="mobile-unified-header-content">
                        <img src="logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="mobile-logo">
                        <p class="japanese-title">
                            <span class="kanji-title">${game.japaneseTitleKanji}</span>
                            <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                        </p>
                    </div>
                    ${mobileNavButtonHTML}
                </div>
                <div class="mobile-release-accordion">
                    <div class="accordion-bar">
                        <span>Release Details</span>
                        <span class="chevron">▼</span>
                    </div>
                    <div class="accordion-content" style="display: none;">
                        <div class="release-region">
                            <h4 class="release-header">Japanese Release</h4>
                            <div class="release-list">${createReleaseString(game.releasesJP)}</div>
                        </div>
                        <div class="release-region">
                            <h4 class="release-header">English Release</h4>
                            <div class="release-list">${createReleaseString(game.releasesEN)}</div>
                        </div>
                    </div>
                </div>
                <div class="mobile-external-links">
                    <a href="${game.steamUrl}" target="_blank" rel="noopener noreferrer" title="Steam Store Page">
                        <img src="logo/steam.png" alt="Steam Logo">
                    </a>
                    ${game.playstationUrl ? `
                    <a href="${game.playstationUrl}" target="_blank" rel="noopener noreferrer" title="PlayStation Store Page" class="playstation-link">
                        <img src="logo/playstation.png" alt="PlayStation Store Logo">
                    </a>` : ''}
                    ${game.nintendoUrl ? `
                    <a href="${game.nintendoUrl}" target="_blank" rel="noopener noreferrer" title="Nintendo eShop Page" class="nintendo-link">
                        <img src="logo/nintendo.png" alt="Nintendo eShop Logo">
                    </a>` : ''}
                    <a href="${game.wikiUrl}" target="_blank" rel="noopener noreferrer" title="Wikipedia">
                        <img src="logo/wikipedia.png" alt="Wikipedia Logo">
                    </a>
                    <a href="${game.fandomUrl}" target="_blank" rel="noopener noreferrer" title="Kiseki Fandom Wiki">
                        <img src="logo/fandom.png" alt="Fandom Logo">
                    </a>
                </div>

            </div>`;
    }

    /**
     * Creates the combined HTML for both desktop and mobile views of a single game or variant.
     * @param {Object} gameData - The game data for the current item.
     * @param {boolean} [isVariant=false] - Whether this item is a variant.
     * @param {Array<Object>|null} [allVariantsData=null] - Full list of variants (including main) for mobile card context.
     * @param {string|null} [mainGameAssetName=null] - Asset name of the main game for mobile variant context.
     * @returns {string} HTML string for the complete game render.
     */
    function createFullGameRenderHTML(gameData, isVariant = false, allVariantsData = null, mainGameAssetName = null) {
        // For variants, allVariantsData would be the full list [mainGame, variant1, variant2...]
        // and mainGameAssetName would be the assetName of the original game.
        return `
            ${createGameEntryDesktopHTML(gameData)}
            ${createMobileCardHTML(gameData, isVariant, allVariantsData, mainGameAssetName)}
        `;
    }

    // --- Lightbox Setup ---
    /**
     * Sets up the mobile lightbox functionality.
     * Creates lightbox DOM elements if they don't exist and attaches event listeners.
     */
    function setupLightbox() {
        if (document.getElementById('mobile-lightbox')) return; // Already created

        const lightboxHTML = `
            <div id="mobile-lightbox" class="mobile-lightbox-overlay" style="display:none;">
                <span class="mobile-lightbox-close">&times;</span>
                <img id="mobile-lightbox-image" src="" alt="Full screen hero image">
            </div>`;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        const lightbox = document.getElementById('mobile-lightbox');
        const lightboxImage = document.getElementById('mobile-lightbox-image');
        const lightboxClose = lightbox.querySelector('.mobile-lightbox-close');

        if (!lightbox || !lightboxImage || !lightboxClose) {
            console.error("Lightbox elements not found after creation.");
            return;
        }

        // Event delegation for hero banners, as they are dynamically added
        // document.body.addEventListener('click', function(event) {
        //     const banner = event.target.closest('.mobile-hero-banner');
        //     if (banner && banner.parentElement.classList.contains('mobile-only')) { // Ensure it's for the mobile card
        //         const heroSrc = banner.dataset.heroSrc;
        //         if (heroSrc) {
        //             lightboxImage.src = heroSrc;
        //             lightbox.style.display = 'flex';
        //         }
        //     }
        // });
        // Lightbox functionality for mobile hero images removed as per new requirements.
        // The lightbox HTML and general close logic will remain in case it's used for other purposes later.

        lightboxClose.addEventListener('click', () => {
            lightbox.style.display = 'none';
            lightboxImage.src = '';
        });
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
                lightboxImage.src = '';
            }
        });
    }

    // --- Accordion Setup ---
    /**
     * Sets up accordion functionality for mobile release details.
     * Uses event delegation on the body.
     */
    function setupAccordions() {
        // Event delegation for accordions
        document.body.addEventListener('click', function(event) {
            const bar = event.target.closest('.accordion-bar');
            if (bar && bar.parentElement.closest('.mobile-only')) { // Ensure it's for the mobile card
                const content = bar.nextElementSibling;
                const chevron = bar.querySelector('.chevron');
                if (content && content.classList.contains('accordion-content')) {
                    const isExpanded = content.style.display === 'block';
                    content.style.display = isExpanded ? 'none' : 'block';
                    if (chevron) {
                        chevron.classList.toggle('expanded', !isExpanded);
                        chevron.textContent = isExpanded ? '▼' : '▲';
                    }
                }
            }
        });
    }

    fetch('games.json')
        .then(response => {
            if (!response.ok) {
                console.error("Fetch response was not ok:", response.status, response.statusText);
                return response.text().then(text => { throw new Error("Server error: " + response.status + " " + response.statusText + " - " + text); });
            }
            return response.json();
        })
        .then(games => {
            const timelineContainer = document.getElementById('game-timeline-container');
            if (!timelineContainer) {
                console.error("CRITICAL: timelineContainer is null or undefined!");
                return;
            }
            let lastArc = null;

            // Create Arc navigation
            const headerElement = document.querySelector('header');
            if (headerElement) {
                const uniqueArcs = [...new Set(games.map(game => game.arc))];
                const arcNav = document.createElement('nav');
                arcNav.className = 'arc-navigation';
                uniqueArcs.forEach(arc => {
                    const link = document.createElement('a');
                    link.textContent = arc;
                    link.href = '#' + arc.toLowerCase().replace(/\s+/g, '-') + '-header';
                    arcNav.appendChild(link);
                    if (uniqueArcs.indexOf(arc) < uniqueArcs.length - 1) {
                        arcNav.appendChild(document.createTextNode(' • '));
                    }
                });
                headerElement.appendChild(arcNav);
                arcNav.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', function(event) {
                        event.preventDefault();
                        const targetElement = document.querySelector(this.getAttribute('href'));
                        if (targetElement) {
                            const headerHeight = headerElement.offsetHeight;
                            const targetPosition = targetElement.offsetTop - headerHeight - 10;
                            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                        }
                    });
                });
            }

            games.forEach((game) => {
                if (game.arc !== lastArc) {
                    const arcHeader = document.createElement('h2');
                    arcHeader.className = 'arc-header';
                    arcHeader.textContent = game.arc;
                    arcHeader.id = game.arc.toLowerCase().replace(/\s+/g, '-') + '-header';
                    timelineContainer.appendChild(arcHeader);
                    lastArc = game.arc;
                }

                let gameWrapperElement;

                if (game.variants && game.variants.length > 0) {
                    const sliderDisplayArea = document.createElement('div');
                    sliderDisplayArea.className = 'slider-display-area';
                    sliderDisplayArea.setAttribute('data-current-index', '0');

                    const gameEntrySlider = document.createElement('div');
                    gameEntrySlider.className = 'game-entry-slider';

                    const sliderContentStrip = document.createElement('div');
                    sliderContentStrip.className = 'slider-content-strip';

                    // Original game item
                    const originalGameItem = document.createElement('div');
                    originalGameItem.className = 'slider-item';
                    const originalGameEntry = document.createElement('div');
                    originalGameEntry.className = 'game-entry';
                    // For the main game in a slider, pass its full variant data for the mobile card
                    const allVariantDataForMobile = [game, ...game.variants];
                    originalGameEntry.innerHTML = createFullGameRenderHTML(game, false, allVariantDataForMobile, null);
                    originalGameItem.appendChild(originalGameEntry);
                    sliderContentStrip.appendChild(originalGameItem);

                    // Variant game items
                    game.variants.forEach(variant => {
                        const variantGameItem = document.createElement('div');
                        variantGameItem.className = 'slider-item';
                        const variantGameEntry = document.createElement('div');
                        variantGameEntry.className = 'game-entry';
                        // Pass allVariantDataForMobile so the card knows it's part of a slider context
                        variantGameEntry.innerHTML = createFullGameRenderHTML(variant, true, allVariantDataForMobile, game.assetName);
                        variantGameItem.appendChild(variantGameEntry);
                        sliderContentStrip.appendChild(variantGameItem);
                    });

                    gameEntrySlider.appendChild(sliderContentStrip);
                    sliderDisplayArea.appendChild(gameEntrySlider);

                    const prevButton = document.createElement('button');
                    prevButton.className = 'slider-arrow slider-arrow-prev';
                    prevButton.innerHTML = '&#10094;';
                    prevButton.onclick = () => navigateSlider(sliderDisplayArea, -1);
                    // sliderDisplayArea.appendChild(prevButton); // Old prev button removed

                    // const nextButton = document.createElement('button'); // Old next button removed
                    // nextButton.className = 'slider-arrow slider-arrow-next';
                    // nextButton.innerHTML = '&#10095;';
                    // nextButton.onclick = () => navigateSlider(sliderDisplayArea, 1);
                    // sliderDisplayArea.appendChild(nextButton);

                    const navButton = document.createElement('button');
                    navButton.className = 'slider-nav-button desktop-only'; // Added desktop-only
                    // Icon and onclick will be set by navigateSlider
                    sliderDisplayArea.appendChild(navButton);
                    sliderDisplayArea.navButton = navButton; // Store reference to the button

                    gameWrapperElement = sliderDisplayArea;
                } else {
                    const standardEntry = document.createElement('div');
                    standardEntry.className = 'game-entry';
                    standardEntry.innerHTML = createFullGameRenderHTML(game); // No variants, so no allVariantData needed for mobile here
                    gameWrapperElement = standardEntry;
                }
                timelineContainer.appendChild(gameWrapperElement);
            });

            // Initialize slider controls
            document.querySelectorAll('.slider-display-area').forEach(sliderArea => {
                setupSliderControls(sliderArea); // New setup function
            });

            // Setup interactive elements for mobile cards
            setupLightbox();
            setupAccordions();

            // Arc Navigation Active State Highlighting
            const navLinks = document.querySelectorAll('.arc-navigation a');
            const arcHeaders = document.querySelectorAll('.arc-header');
            const headerHeightThreshold = headerElement ? headerElement.offsetHeight + 20 : 100;

            function updateActiveLink() {
                let currentActiveArcId = null;
                for (let i = arcHeaders.length - 1; i >= 0; i--) {
                    const header = arcHeaders[i];
                    const rect = header.getBoundingClientRect();
                    if (rect.top <= headerHeightThreshold) {
                        currentActiveArcId = header.id;
                        break;
                    }
                }
                if (!currentActiveArcId && arcHeaders.length > 0 && window.scrollY < arcHeaders[0].offsetTop - headerHeightThreshold) {
                     currentActiveArcId = arcHeaders[0].id;
                }
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href').substring(1) === currentActiveArcId);
                });
            }
            if (navLinks.length > 0 && arcHeaders.length > 0) {
                window.addEventListener('scroll', updateActiveLink, { passive: true });
                updateActiveLink();
            }

            // Setup swipe functionality after all cards are in the DOM
            // setupMobileVariantNavigation(); // Renamed from setupMobileVariantSwipes - REMOVED as per requirements
        })
        .catch(error => {
            console.error('CRITICAL ERROR fetching or processing game data:', error);
            const timelineContainer = document.getElementById('game-timeline-container');
            if (timelineContainer) {
                timelineContainer.innerHTML = `<p style="color:red; text-align:center;">Error loading game data. Please check console.</p>`;
            }
        });

    // --- Mobile Variant Navigation Functionality (formerly Swipe) --- REMOVED as per requirements
    /*
    /**
     * Updates the content of a mobile game card with new game data.
     * Used when navigating between game variants on mobile.
     * @param {HTMLElement} cardElement - The .game-entry-mobile-card element to update.
     * @param {Object} gameData - The game data object for the new variant.
     */
    /*
    function updateMobileCardContent(cardElement, gameData) {
        // Update hero banner
        const heroBanner = cardElement.querySelector('.mobile-hero-banner');
        const heroImg = heroBanner ? heroBanner.querySelector('img') : null;
        if (heroBanner && heroImg) {
            const newHeroSrc = `hero/${gameData.assetName}.jpg`;
            heroBanner.dataset.heroSrc = newHeroSrc;
            heroImg.src = newHeroSrc;
            heroImg.alt = `${gameData.englishTitle} Hero Image`;
        }

        // Update logo
        const logoImg = cardElement.querySelector('.mobile-main-info .mobile-logo');
        if (logoImg) {
            logoImg.src = `logo/${gameData.assetName}.png`;
            logoImg.alt = `${gameData.englishTitle} Logo`;
        }

        // Update titles
        const kanjiTitleEl = cardElement.querySelector('.mobile-main-info .kanji-title');
        if (kanjiTitleEl) kanjiTitleEl.textContent = gameData.japaneseTitleKanji;
        const romajiTitleEl = cardElement.querySelector('.mobile-main-info .romaji-title');
        if (romajiTitleEl) romajiTitleEl.textContent = gameData.japaneseTitleRomaji;

        // Update release details
        const releaseAccordionContent = cardElement.querySelector('.mobile-release-accordion .accordion-content');
        if (releaseAccordionContent) {
            const jpReleaseList = releaseAccordionContent.querySelector('.release-region:nth-child(1) .release-list');
            if (jpReleaseList) jpReleaseList.innerHTML = createReleaseString(gameData.releasesJP);

            const enReleaseList = releaseAccordionContent.querySelector('.release-region:nth-child(2) .release-list');
            if (enReleaseList) enReleaseList.innerHTML = createReleaseString(gameData.releasesEN);
        }

        // Update external links
        const externalLinksContainer = cardElement.querySelector('.mobile-external-links');
        if (externalLinksContainer) {
            const steamLink = externalLinksContainer.querySelector('a[title*="Steam"]');
            if (steamLink) steamLink.href = gameData.steamUrl;

            // Update or create/remove PlayStation link
            let psLink = externalLinksContainer.querySelector('.playstation-link');
            if (gameData.playstationUrl) {
                if (!psLink) {
                    // Create and insert psLink if it doesn't exist
                    psLink = document.createElement('a');
                    psLink.className = 'playstation-link';
                    psLink.target = '_blank';
                    psLink.rel = 'noopener noreferrer';
                    psLink.title = 'PlayStation Store Page';
                    psLink.innerHTML = '<img src="logo/playstation.png" alt="PlayStation Store Logo">';
                    // Insert after Steam, before Wikipedia
                    const wikiLinkForInsert = externalLinksContainer.querySelector('a[title*="Wikipedia"]');
                    externalLinksContainer.insertBefore(psLink, wikiLinkForInsert);
                }
                psLink.href = gameData.playstationUrl;
                psLink.style.display = ''; // Ensure it's visible
            } else if (psLink) {
                psLink.remove(); // Remove if no URL and element exists
            }

            // Update or create/remove Nintendo link
            let nintendoLink = externalLinksContainer.querySelector('.nintendo-link');
            if (gameData.nintendoUrl) {
                if (!nintendoLink) {
                    // Create and insert nintendoLink if it doesn't exist
                    nintendoLink = document.createElement('a');
                    nintendoLink.className = 'nintendo-link';
                    nintendoLink.target = '_blank';
                    nintendoLink.rel = 'noopener noreferrer';
                    nintendoLink.title = 'Nintendo eShop Page';
                    nintendoLink.innerHTML = '<img src="logo/nintendo.png" alt="Nintendo eShop Logo">';
                    // Insert after PlayStation (if it exists) or Steam, before Wikipedia
                    const psLinkForInsert = externalLinksContainer.querySelector('.playstation-link');
                    const wikiLinkForInsert = externalLinksContainer.querySelector('a[title*="Wikipedia"]');
                    if (psLinkForInsert) {
                        psLinkForInsert.after(nintendoLink);
                    } else if (steamLink) {
                        steamLink.after(nintendoLink);
                    } else { // Fallback if somehow steam link is also missing, unlikely
                        externalLinksContainer.insertBefore(nintendoLink, wikiLinkForInsert);
                    }
                }
                nintendoLink.href = gameData.nintendoUrl;
                nintendoLink.style.display = ''; // Ensure it's visible
            } else if (nintendoLink) {
                nintendoLink.remove(); // Remove if no URL and element exists
            }

            const wikiLink = externalLinksContainer.querySelector('a[title*="Wikipedia"]');
            if (wikiLink) wikiLink.href = gameData.wikiUrl;
            const fandomLink = externalLinksContainer.querySelector('a[title*="Fandom"]');
            if (fandomLink) fandomLink.href = gameData.fandomUrl;
        }

        // Update the card's own asset name for consistency if needed, though not strictly used by display after this.
        cardElement.dataset.assetName = gameData.assetName;
    }
    */

    /**
     * Sets up click-based navigation for mobile game variants using pager dots.
     * Attaches event listeners to pager dots to update card content and trigger animations.
     */
    /*
    function setupMobileVariantNavigation() { // Renamed from setupMobileVariantSwipes
        document.querySelectorAll('.game-entry-mobile-card[data-variants]').forEach(card => {
            const pagerDotsContainer = card.querySelector('.mobile-pager-dots');
            if (!pagerDotsContainer) return;

            const dots = pagerDotsContainer.querySelectorAll('.dot');
            const variantsJson = card.dataset.variants;
            if (!variantsJson) return;

            try {
                const variants = JSON.parse(variantsJson);
                const animationDuration = 250; // ms, should match CSS transition duration

                dots.forEach((dot, targetIndex) => {
                    dot.addEventListener('click', () => {
                        let currentIndex = parseInt(card.dataset.currentVariantIndex, 10);

                        if (targetIndex !== currentIndex) {
                            const direction = targetIndex > currentIndex ? 1 : -1; // 1 for next, -1 for prev

                            const swipeOutClass = direction === 1 ? 'card-swiping-out-left' : 'card-swiping-out-right';
                            const swipeInClass = direction === 1 ? 'card-swiping-in-left' : 'card-swiping-in-right';

                            card.classList.add(swipeOutClass);
                            card.classList.remove('card-content-visible');

                            setTimeout(() => {
                                updateMobileCardContent(card, variants[targetIndex]);
                                card.dataset.currentVariantIndex = targetIndex.toString();

                                // Update active state for all dots
                                dots.forEach((d, i) => d.classList.toggle('active', i === targetIndex));

                                card.classList.remove(swipeOutClass);
                                card.classList.add(swipeInClass);
                                void card.offsetWidth; // Force reflow
                                card.classList.add('card-content-visible');
                                card.classList.remove(swipeInClass);

                            }, animationDuration);
                        }
                    });
                });

            } catch (e) {
                console.error("Error setting up mobile variant navigation:", e);
            }
        });
    }
    */

    /**
     * Sets up navigation controls for a slider (both desktop and mobile).
     * @param {HTMLElement} sliderDisplayAreaElement - The .slider-display-area element.
     */
    function setupSliderControls(sliderDisplayAreaElement) {
        const contentStrip = sliderDisplayAreaElement.querySelector('.game-entry-slider .slider-content-strip');
        if (!contentStrip || contentStrip.children.length <= 1) {
            // Hide all nav buttons if not a true slider (0 or 1 item)
            const desktopNavButton = sliderDisplayAreaElement.querySelector('.slider-nav-button.desktop-only');
            if (desktopNavButton) desktopNavButton.style.display = 'none';

            const firstItemMobileCard = contentStrip.querySelector('.slider-item:first-child .game-entry-mobile-card');
            if (firstItemMobileCard) {
                const mobileNavButton = firstItemMobileCard.querySelector('.slider-nav-button-mobile');
                if (mobileNavButton) mobileNavButton.style.display = 'none';
            }
            return;
        }

        const itemsCount = contentStrip.children.length;
        let currentIndex = parseInt(sliderDisplayAreaElement.getAttribute('data-current-index'), 10) || 0;
        sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());


        const desktopNavButton = sliderDisplayAreaElement.querySelector('.slider-nav-button.desktop-only');
        const mobileNavButtons = sliderDisplayAreaElement.querySelectorAll('.slider-item .mobile-only .slider-nav-button-mobile');

        function updateSlidePosition() {
            // The 2rem gap is defined in CSS for .slider-content-strip gap
            contentStrip.style.transform = `translateX(calc(-${currentIndex} * (100% + 2rem)))`;
        }

        function updateDesktopButton() {
            if (!desktopNavButton) return;
            if (itemsCount <= 1) {
                desktopNavButton.disabled = true;
                desktopNavButton.style.display = 'none';
            } else {
                desktopNavButton.style.display = 'flex';
                desktopNavButton.disabled = false;
                if (currentIndex < itemsCount - 1) {
                    desktopNavButton.innerHTML = '&#10095;'; // → (Next)
                } else {
                    desktopNavButton.innerHTML = '&#10094;'; // ← (Previous)
                }
            }
        }

        function updateMobileButtonsState() { // Renamed and updated
            mobileNavButtons.forEach(btn => {
                if (itemsCount <= 1) {
                    btn.style.display = 'none';
                } else {
                    btn.style.display = 'flex'; // Or 'inline-flex' etc. based on its styling
                    // Icon is static 'Next' (&#10095;) as per HTML generation. No change needed here.
                }
            });
        }

        if (desktopNavButton) {
            desktopNavButton.onclick = () => {
                if (currentIndex < itemsCount - 1) {
                    currentIndex++;
                } else {
                    currentIndex = 0; // Cycle back to start
                }
                sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                updateSlidePosition();
                updateDesktopButton();
            };
        }

        mobileNavButtons.forEach(btn => {
            btn.onclick = () => {
                currentIndex = (currentIndex + 1) % itemsCount; // Always go next and cycle
                sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                updateSlidePosition();
                // updateDesktopButton(); // No direct need to update desktop button from mobile click unless state is shared differently
                updateMobileButtonsState(); // Update all mobile buttons (e.g. if they were to change icon/state)
            };
        });

        // Initial setup
        updateSlidePosition();
        updateDesktopButton();
        updateMobileButtonsState(); // Call renamed function
    }

});
