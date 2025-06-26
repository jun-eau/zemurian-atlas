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
                <img src="assets/grid/${game.assetName}.jpg" alt="${game.englishTitle} Grid Art" class="game-grid-art" loading="lazy">
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
                <img src="assets/logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="game-logo">
                <p class="japanese-title">
                    <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                    <span class="kanji-title">${game.japaneseTitleKanji}</span>
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
                    <img src="assets/logo/steam.png" alt="Steam Logo" title="">
                </a>
                ${game.playstationUrl ? `
                <a href="${game.playstationUrl}" target="_blank" rel="noopener noreferrer" title="PlayStation Store Page">
                    <img src="assets/logo/playstation.png" alt="PlayStation Store Logo" title="">
                </a>` : ''}
                ${game.nintendoUrl ? `
                <a href="${game.nintendoUrl}" target="_blank" rel="noopener noreferrer" title="Nintendo eShop Page">
                    <img src="assets/logo/nintendo.png" alt="Nintendo eShop Logo" title="">
                </a>` : ''}
                <a href="${game.wikiUrl}" target="_blank" rel="noopener noreferrer" title="Wikipedia">
                    <img src="assets/logo/wikipedia.png" alt="Wikipedia Logo" title="">
                </a>
                <a href="${game.fandomUrl}" target="_blank" rel="noopener noreferrer" title="Kiseki Fandom Wiki">
                    <img src="assets/logo/fandom.webp" alt="Fandom Logo" title="">
                </a>
            </div>`;
    }

    /**
     * Creates HTML for the desktop info container (background, content).
     * @param {Object} game - The game data object.
     * @param {boolean} isSliderItem - Whether this container is for an item in a slider.
     * @returns {string} HTML string for the info container.
     */
    function createDesktopInfoContainerHTML(game, isSliderItem) {
        let navButtonHTML = '';
        if (isSliderItem) {
            // The button's content (arrow) and specific event listener will be set up
            // by setupSliderControls.
            // aria-controls will also be set by setupSliderControls.
            navButtonHTML = `
                <button class="desktop-slider-toggle-button" aria-label="Toggle slide"></button>
            `;
        }

        return `
            <div class="info-container desktop-only">
                <div class="hero-background" style="background-image: url('assets/hero/${game.assetName}.jpg');" loading="lazy"></div>
                <div class="info-content">
                    ${createDesktopMainInfoHTML(game)}
                    ${createDesktopExternalLinksHTML(game)}
                    ${navButtonHTML}
                </div>
            </div>`;
    }

    /**
     * Creates the complete HTML for a desktop game entry.
     * @param {Object} game - The game data object.
     * @param {boolean} isSliderItem - Whether this entry is part of a slider.
     * @returns {string} HTML string for the desktop game entry.
     */
    function createGameEntryDesktopHTML(game, isSliderItem) {
        return `
            ${createDesktopArtContainerHTML(game)}
            ${createDesktopInfoContainerHTML(game, isSliderItem)}`;
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
        const heroImageUrl = `assets/hero/${game.assetName}.jpg`;

        const mainGameAttr = (mainGameAssetName && isVariant) ? `data-main-game-asset="${mainGameAssetName}"` : '';


        const cardId = `mobile-card-${game.assetName}-${Date.now()}`;
        let mobileNavButtonsWithAriaHTML = '';
        if (allVariantsData && allVariantsData.length > 1) {
            // Assuming the slider's content strip ID will be accessible or passed down
            // For now, let's assume a convention or find a way to get it.
            // Placeholder for contentStripId - this needs to be resolved.
            // Let's search for the parent slider-content-strip's ID when buttons are actually created/used.
            // For now, we can't directly link aria-controls here without knowing the slider's ID.
            // This will be handled in setupSliderControls for mobile buttons.
            mobileNavButtonsWithAriaHTML = `
                <button class="slider-nav-button-mobile slider-nav-mobile-prev" aria-label="Previous variant" style="display: none;">&#10094;</button>
                <button class="slider-nav-button-mobile slider-nav-mobile-next" aria-label="Next variant" style="display: none;">&#10095;</button>
            `;
        }

        return `
            <div class="game-entry-mobile-card mobile-only card-content-visible" id="${cardId}" ${mainGameAttr} data-asset-name="${game.assetName}" role="group" aria-label="${game.englishTitle} details">
                <div class="mobile-unified-header">
                    <div class="mobile-unified-header-bg" style="background-image: url('${heroImageUrl}');" loading="lazy"></div>
                    <div class="mobile-unified-header-content">
                        <img src="assets/logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="mobile-logo" loading="lazy">
                        <p class="japanese-title">
                            <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                            <span class="kanji-title">${game.japaneseTitleKanji}</span>
                        </p>
                    </div>
                    ${mobileNavButtonsWithAriaHTML}
                </div>
                <div class="mobile-release-accordion">
                    <div class="accordion-bar" role="button" aria-expanded="false" aria-controls="accordion-content-${game.assetName}-${cardId}">
                        <span>Release Details</span>
                        <span class="chevron" aria-hidden="true">▼</span>
                    </div>
                    <div class="accordion-content" id="accordion-content-${game.assetName}-${cardId}" role="region" style="display: none;">
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
                        <img src="assets/logo/steam.png" alt="Steam Logo">
                    </a>
                    ${game.playstationUrl ? `
                    <a href="${game.playstationUrl}" target="_blank" rel="noopener noreferrer" title="PlayStation Store Page" class="playstation-link">
                        <img src="assets/logo/playstation.png" alt="PlayStation Store Logo">
                    </a>` : ''}
                    ${game.nintendoUrl ? `
                    <a href="${game.nintendoUrl}" target="_blank" rel="noopener noreferrer" title="Nintendo eShop Page" class="nintendo-link">
                        <img src="assets/logo/nintendo.png" alt="Nintendo eShop Logo">
                    </a>` : ''}
                    <a href="${game.wikiUrl}" target="_blank" rel="noopener noreferrer" title="Wikipedia">
                        <img src="assets/logo/wikipedia.png" alt="Wikipedia Logo">
                    </a>
                    <a href="${game.fandomUrl}" target="_blank" rel="noopener noreferrer" title="Kiseki Fandom Wiki">
                        <img src="assets/logo/fandom.webp" alt="Fandom Logo">
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
    function createFullGameRenderHTML(gameData, isSliderItemContext = false, isVariant = false, allVariantsData = null, mainGameAssetName = null) {
        // isSliderItemContext indicates if the current game entry (original or variant) is part of a slider.
        // This is true if allVariantsData exists and has more than one item.
        // This flag is specifically for createGameEntryDesktopHTML.

        // For variants, allVariantsData would be the full list [mainGame, variant1, variant2...]
        // and mainGameAssetName would be the assetName of the original game.
        return `
            ${createGameEntryDesktopHTML(gameData, isSliderItemContext)}
            ${createMobileCardHTML(gameData, isVariant, allVariantsData, mainGameAssetName)}
        `;
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
                    bar.setAttribute('aria-expanded', !isExpanded);
                    if (chevron) {
                        chevron.classList.toggle('expanded', !isExpanded);
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
                    // Modify display text for navigation links
                    let displayText = arc;
                    if (arc.includes(" Arc")) { // Check if " Arc" (with a space) exists
                        displayText = arc.replace(" Arc", "").trim();
                    }
                    // Handle cases like "Calvard Arc" which might become "Calvard"
                    // but ensure if an arc was just "Arc" it doesn't become empty.
                    // However, current data doesn't have such a case.
                    // If displayText becomes empty and original arc was "Arc", revert to "Arc".
                    // This specific check might be redundant given current data like "Liberl Arc".
                    if (displayText === "" && arc.toLowerCase() === "arc") {
                        displayText = "Arc";
                    }

                    link.textContent = displayText;
                    link.href = '#' + arc.toLowerCase().replace(/\s+/g, '-') + '-header'; // Keep href the same
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
                    // Unique ID for the content strip for aria-controls
                    const contentStripId = `slider-content-${game.assetName || 'strip'}-${Date.now()}`;


                    const sliderContentStrip = document.createElement('div');
                    sliderContentStrip.className = 'slider-content-strip';
                    sliderContentStrip.id = contentStripId;
                    sliderContentStrip.setAttribute('role', 'region');
                    sliderContentStrip.setAttribute('aria-label', `${game.englishTitle} Variants`);

                    // Original game item
                    const originalGameItem = document.createElement('div');
                    originalGameItem.className = 'slider-item';
                    originalGameItem.setAttribute('role', 'group');
                    originalGameItem.setAttribute('aria-label', game.englishTitle);
                    const originalGameEntry = document.createElement('div');
                    originalGameEntry.className = 'game-entry';
                    // For the main game in a slider, pass its full variant data for the mobile card
                    const allVariantDataForMobile = [game, ...game.variants];
                    // true for isSliderItemContext because this is the slider rendering path
                    originalGameEntry.innerHTML = createFullGameRenderHTML(game, true, false, allVariantDataForMobile, null);
                    originalGameItem.appendChild(originalGameEntry);
                    sliderContentStrip.appendChild(originalGameItem);

                    // Variant game items
                    game.variants.forEach(variant => {
                        const variantGameItem = document.createElement('div');
                        variantGameItem.className = 'slider-item';
                        variantGameItem.setAttribute('role', 'group');
                        variantGameItem.setAttribute('aria-label', variant.englishTitle);
                        const variantGameEntry = document.createElement('div');
                        variantGameEntry.className = 'game-entry';
                        // Pass allVariantDataForMobile so the card knows it's part of a slider context
                        // true for isSliderItemContext
                        variantGameEntry.innerHTML = createFullGameRenderHTML(variant, true, true, allVariantDataForMobile, game.assetName);
                        variantGameItem.appendChild(variantGameEntry);
                        sliderContentStrip.appendChild(variantGameItem);
                    });

                    gameEntrySlider.appendChild(sliderContentStrip);
                    sliderDisplayArea.appendChild(gameEntrySlider);

                    // The desktop navigation button is now generated within each info-container.
                    // No need to create and append it here.
                    // The reference sliderDisplayArea.navButton is no longer needed as setupSliderControls
                    // will find the buttons within the .slider-item elements.

                    gameWrapperElement = sliderDisplayArea;
                } else {
                    const standardEntry = document.createElement('div');
                    standardEntry.className = 'game-entry';
                    // false for isSliderItemContext because this is NOT the slider rendering path
                    // No variants, so no allVariantData needed for mobile here
                    standardEntry.innerHTML = createFullGameRenderHTML(game, false, false, null, null);
                    gameWrapperElement = standardEntry;
                }
                timelineContainer.appendChild(gameWrapperElement);
            });

            // Initialize slider controls
            document.querySelectorAll('.slider-display-area').forEach(sliderArea => {
                setupSliderControls(sliderArea); // New setup function
            });

            // Setup interactive elements for mobile cards
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

            // Main Navigation Active State Highlighting
            const currentPageUrl = window.location.pathname.split('/').pop(); // Get the current HTML file name
            const mainNavLinks = document.querySelectorAll('.main-navigation a');
            mainNavLinks.forEach(link => {
                const linkUrl = link.getAttribute('href').split('/').pop();
                if (linkUrl === currentPageUrl || (currentPageUrl === '' && linkUrl === 'index.html')) { // Handle root path for index.html
                    link.classList.add('active');
                }
            });
        })
        .catch(error => {
            console.error('CRITICAL ERROR fetching or processing game data:', error);
            const timelineContainer = document.getElementById('game-timeline-container');
            if (timelineContainer) {
                timelineContainer.innerHTML = `
                    <div style="color: #ffdddd; background-color: #632020; border: 1px solid #ff7b7b; padding: 20px; margin: 20px auto; text-align: center; border-radius: 8px; max-width: 600px;">
                        <h3 style="color: #ffacac; margin-top: 0;">Oops! Something went wrong.</h3>
                        <p>We couldn't load the game data at this time.</p>
                        <p>Please try refreshing the page. If the problem continues, please check your internet connection or try again later.</p>
                    </div>`;
            }
        });

    /**
     * Sets up navigation controls for a slider (both desktop and mobile).
     * @param {HTMLElement} sliderDisplayAreaElement - The .slider-display-area element.
     */
    function setupSliderControls(sliderDisplayAreaElement) {
        const contentStrip = sliderDisplayAreaElement.querySelector('.game-entry-slider .slider-content-strip');
        if (!contentStrip || contentStrip.children.length <= 1) {
            // Hide all nav buttons if not a true slider (0 or 1 item)
            // Desktop buttons are inside .info-container, so we need to find them if they exist.
            const desktopNavButtons = sliderDisplayAreaElement.querySelectorAll('.slider-item .info-container .desktop-slider-toggle-button');
            desktopNavButtons.forEach(btn => btn.style.display = 'none');

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

        const contentStripId = contentStrip.id; // Get the ID from the content strip itself

        // Desktop buttons are now inside each .slider-item's .info-container.
        // We'll handle them in updateDesktopButtonState.
        const allDesktopToggleButtons = sliderDisplayAreaElement.querySelectorAll('.slider-item .info-container .desktop-slider-toggle-button');
        allDesktopToggleButtons.forEach(btn => btn.setAttribute('aria-controls', contentStripId));


        // Select all potential mobile nav buttons within this slider area
        const allMobilePrevButtons = sliderDisplayAreaElement.querySelectorAll('.slider-item .mobile-only .slider-nav-mobile-prev');
        const allMobileNextButtons = sliderDisplayAreaElement.querySelectorAll('.slider-item .mobile-only .slider-nav-mobile-next');

        // Set aria-controls for mobile buttons
        allMobilePrevButtons.forEach(btn => btn.setAttribute('aria-controls', contentStripId));
        allMobileNextButtons.forEach(btn => btn.setAttribute('aria-controls', contentStripId));


        function updateSlidePosition() {
            // The 2rem gap is defined in CSS for .slider-content-strip gap
            contentStrip.style.transform = `translateX(calc(-${currentIndex} * (100% + 2rem)))`;
        }

        function updateDesktopButtonState() {
            // Desktop buttons are inside each slider item.
            // Only the button in the *active* slide's info-container should be effectively visible/interactive.
            // However, CSS will handle visibility based on the .desktop-only class and media queries.
            // Here, we just set content and aria-label for *all* desktop buttons,
            // as they slide with their respective cards.
            // The click listener will be attached to all of them, but only the one in the
            // visible card will be practically clickable.

            if (itemsCount <= 1) { // Should be caught by initial check
                allDesktopToggleButtons.forEach(btn => {
                    btn.style.display = 'none';
                    btn.disabled = true;
                });
                return;
            }

            allDesktopToggleButtons.forEach((btn, index) => {
                // The button's appearance/action depends on the *slider's* current index,
                // not the index of the button itself in the NodeList.
                // Since there are only two items in a slider (0 and 1),
                // the button in item 0 shows "Next", button in item 1 shows "Prev".
                // This logic is for when the slider is on a particular card.
                // The button itself doesn't change, its host card does.
                // So, the button on card 0 *always* means "go to card 1" (Next)
                // and the button on card 1 *always* means "go to card 0" (Prev).
                // The `currentIndex` of the *slider* determines which card (and thus which button) is active.

                btn.style.display = 'flex'; // Assuming flex for alignment, adjust with CSS
                btn.disabled = false;

                if (index === 0) { // Button associated with the first item
                    btn.innerHTML = '&#10095;'; // → (Next)
                    btn.setAttribute('aria-label', 'Next item');
                    btn.onclick = () => {
                        if (currentIndex === 0) { // Only act if this button's card is active
                            currentIndex = 1;
                            sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                            updateSlidePosition();
                            // updateDesktopButtonState(); // Re-evaluating button states if needed, but content is fixed per button
                        }
                    };
                } else { // Button associated with the second item (index 1)
                    btn.innerHTML = '&#10094;'; // ← (Previous)
                    btn.setAttribute('aria-label', 'Previous item');
                    btn.onclick = () => {
                        if (currentIndex === 1) { // Only act if this button's card is active
                            currentIndex = 0;
                            sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                            updateSlidePosition();
                            // updateDesktopButtonState();
                        }
                    };
                }
            });
        }


        function updateMobileButtonsState() {
            // This function is called when a slider has 2 items (original + variant).
            // The case for 1 item (no slider) is handled by the initial check in setupSliderControls,
            // which hides all navigation buttons.
            // itemsCount is guaranteed to be 2 if we reach here for a slider.

            const sliderItems = contentStrip.children; // Should be 2 items

            if (sliderItems.length === 2) {
                // First item (index 0)
                const firstItemPrevBtn = sliderItems[0].querySelector('.slider-nav-mobile-prev');
                const firstItemNextBtn = sliderItems[0].querySelector('.slider-nav-mobile-next');
                if (firstItemPrevBtn) firstItemPrevBtn.style.display = 'none';    // Hide Prev on first
                if (firstItemNextBtn) firstItemNextBtn.style.display = 'flex';   // Show Next on first

                // Second item (index 1)
                const secondItemPrevBtn = sliderItems[1].querySelector('.slider-nav-mobile-prev');
                const secondItemNextBtn = sliderItems[1].querySelector('.slider-nav-mobile-next');
                if (secondItemPrevBtn) secondItemPrevBtn.style.display = 'flex';  // Show Prev on second
                if (secondItemNextBtn) secondItemNextBtn.style.display = 'none';   // Hide Next on second
            } else if (sliderItems.length === 1) {
                // This case should ideally be fully handled by the initial check in setupSliderControls
                // which should hide all buttons. But as a fallback, ensure buttons are hidden.
                const item = sliderItems[0];
                const prevBtn = item.querySelector('.slider-nav-mobile-prev');
                const nextBtn = item.querySelector('.slider-nav-mobile-next');
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }
            // No need to handle itemsCount > 2 as per new constraints.
        }

        // Desktop button onclick handlers are now set within updateDesktopButtonState,
        // as each button (one per card) has a fixed action.

        allMobilePrevButtons.forEach(btn => {
            btn.onclick = () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                    updateSlidePosition();
                    // updateDesktopButtonState(); // Desktop state doesn't change based on mobile clicks directly
                    updateMobileButtonsState();
                }
            };
        });

        allMobileNextButtons.forEach(btn => {
            btn.onclick = () => {
                if (currentIndex < itemsCount - 1) {
                    currentIndex++;
                    sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                    updateSlidePosition();
                    // updateDesktopButtonState();
                    updateMobileButtonsState();
                }
            };
        });

        // Initial setup
        updateSlidePosition();
        updateDesktopButtonState(); // Use the new function for desktop buttons
        updateMobileButtonsState();
    }

});
