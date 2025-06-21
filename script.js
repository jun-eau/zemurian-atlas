document.addEventListener('DOMContentLoaded', () => {
    // --- Global Helper Functions ---
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
    function createDesktopArtContainerHTML(game) {
        return `
            <div class="art-container desktop-only">
                <img src="grid/${game.assetName}.jpg" alt="${game.englishTitle} Grid Art" class="game-grid-art">
            </div>`;
    }

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

    function createDesktopExternalLinksHTML(game) {
        return `
            <div class="external-links">
                <a href="${game.steamUrl}" target="_blank" rel="noopener noreferrer" title="Steam Store Page">
                    <img src="logo/steam.png" alt="Steam Logo">
                </a>
                <a href="${game.wikiUrl}" target="_blank" rel="noopener noreferrer" title="Wikipedia">
                    <img src="logo/wikipedia.png" alt="Wikipedia Logo">
                </a>
                <a href="${game.fandomUrl}" target="_blank" rel="noopener noreferrer" title="Kiseki Fandom Wiki">
                    <img src="logo/fandom.png" alt="Fandom Logo">
                </a>
            </div>`;
    }

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

    function createGameEntryDesktopHTML(game) {
        return `
            ${createDesktopArtContainerHTML(game)}
            ${createDesktopInfoContainerHTML(game)}`;
    }

    // --- Mobile HTML Generation ---
    function createSingleMobileCardHTML(game) { // Renamed and simplified
        const heroImageUrl = `hero/${game.assetName}.jpg`;
        // Removed pagerDotsHTML and variantsAttr from individual card generation
        // mainGameAttr might still be useful if a variant card needs to know its main game, but not for swipe data.
        // For now, data-asset-name is the key identifier for a card's content.

        return `
            <div class="game-entry-mobile-card mobile-only" data-asset-name="${game.assetName}">
                <div class="mobile-hero-banner" data-hero-src="${heroImageUrl}">
                    <img src="${heroImageUrl}" alt="${game.englishTitle} Hero Image">
                </div>
                <div class="mobile-main-info">
                    <img src="logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="mobile-logo">
                    <p class="japanese-title">
                        <span class="kanji-title">${game.japaneseTitleKanji}</span>
                        <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                    </p>
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
                    <a href="${game.wikiUrl}" target="_blank" rel="noopener noreferrer" title="Wikipedia">
                        <img src="logo/wikipedia.png" alt="Wikipedia Logo">
                    </a>
                    <a href="${game.fandomUrl}" target="_blank" rel="noopener noreferrer" title="Kiseki Fandom Wiki">
                        <img src="logo/fandom.png" alt="Fandom Logo">
                    </a>
                </div>
            </div>`;
            // Pager dots will be added to the slider container, not individual cards.
    }


    function createMobileSliderHTML(game, allGameVariantsData) {
        // allGameVariantsData is an array like [mainGame, variant1, variant2,...]
        let slidesHTML = '';
        allGameVariantsData.forEach(variantData => {
            slidesHTML += `<div class="mobile-slider-item">${createSingleMobileCardHTML(variantData)}</div>`;
        });

        let pagerDotsHTML = '';
        if (allGameVariantsData.length > 1) {
            allGameVariantsData.forEach((_, index) => {
                pagerDotsHTML += `<span class="dot ${index === 0 ? 'active' : ''}"></span>`;
            });
        }

        return `
            <div class="mobile-slider-display-area mobile-only" data-variants='${JSON.stringify(allGameVariantsData)}' data-current-variant-index="0">
                <div class="mobile-slider-content-strip">
                    ${slidesHTML}
                </div>
                ${pagerDotsHTML ? `<div class="mobile-pager-dots">${pagerDotsHTML}</div>` : ''}
            </div>
        `;
    }


    // Combined function for a single game object (main or variant)
    function createFullGameRenderHTML(gameData) {
        // This function now primarily generates the desktop HTML.
        // It also generates mobile HTML ONLY IF the game has NO variants.
        // If the game HAS variants, its mobile representation (a slider) is created
        // by createMobileSliderHTML, called directly from the main processing loop.

        let desktopHTML = createGameEntryDesktopHTML(gameData);
        let mobileHTML = '';

        // Only create a single mobile card if the game does NOT have variants.
        // If it has variants, the mobile slider is generated elsewhere.
        if (!gameData.variants || gameData.variants.length === 0) {
            mobileHTML = createSingleMobileCardHTML(gameData);
        }

        return `${desktopHTML}${mobileHTML}`;
    }

    // --- Lightbox Setup ---
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
        document.body.addEventListener('click', function(event) {
            const banner = event.target.closest('.mobile-hero-banner');
            if (banner && banner.parentElement.classList.contains('mobile-only')) { // Ensure it's for the mobile card
                const heroSrc = banner.dataset.heroSrc;
                if (heroSrc) {
                    lightboxImage.src = heroSrc;
                    lightbox.style.display = 'flex';
                }
            }
        });

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
                    // Desktop part of the original game in a slider
                    let desktopHTML = createGameEntryDesktopHTML(game);
                    // Mobile part: if game has variants, create a mobile slider
                    let mobileHTML = createMobileSliderHTML(game, [game, ...game.variants]);
                    originalGameEntry.innerHTML = desktopHTML + mobileHTML; // Combine desktop and mobile slider
                    originalGameItem.appendChild(originalGameEntry);
                    sliderContentStrip.appendChild(originalGameItem);


                    // Variant game items (for DESKTOP slider)
                    // Mobile versions of these variants are already inside the mobileHTML slider created above.
                    game.variants.forEach(variant => {
                        const variantGameItem = document.createElement('div');
                        variantGameItem.className = 'slider-item';
                        const variantGameEntry = document.createElement('div');
                        variantGameEntry.className = 'game-entry';
                        // For desktop variants, we only need their desktop HTML.
                        // Their mobile representation is part of the main game's mobile slider.
                        variantGameEntry.innerHTML = createGameEntryDesktopHTML(variant); // Only desktop HTML
                        variantGameItem.appendChild(variantGameEntry);
                        sliderContentStrip.appendChild(variantGameItem);
                    });

                    gameEntrySlider.appendChild(sliderContentStrip);
                    sliderDisplayArea.appendChild(gameEntrySlider);


                    // Desktop slider arrows (these are .desktop-only via CSS or JS if needed)
                    const prevButton = document.createElement('button');
                    prevButton.className = 'slider-arrow slider-arrow-prev desktop-only'; // Added desktop-only
                    prevButton.innerHTML = '&#10094;';
                    prevButton.onclick = () => navigateSlider(sliderDisplayArea, -1);
                    sliderDisplayArea.appendChild(prevButton);

                    const nextButton = document.createElement('button');
                    nextButton.className = 'slider-arrow slider-arrow-next desktop-only'; // Added desktop-only
                    nextButton.innerHTML = '&#10095;';
                    nextButton.onclick = () => navigateSlider(sliderDisplayArea, 1);
                    sliderDisplayArea.appendChild(nextButton);

                    // The sliderDisplayArea now contains the desktop slider AND the mobile slider (for the first game).
                    // Subsequent items in the desktop slider do not generate their own mobile sliders.
                    gameWrapperElement = sliderDisplayArea;

                } else { // Game has NO variants
                    const standardEntry = document.createElement('div');
                    standardEntry.className = 'game-entry';
                    // This will render desktop HTML and a single mobile card HTML
                    standardEntry.innerHTML = createFullGameRenderHTML(game);
                    gameWrapperElement = standardEntry;
                }
                timelineContainer.appendChild(gameWrapperElement);
            });

            // Initialize slider arrow states for DESKTOP sliders
            document.querySelectorAll('.slider-display-area').forEach(sliderArea => {
                navigateSlider(sliderArea, 0); // Initial call to set button states
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
            setupMobileVariantSwipes();
        })
        .catch(error => {
            console.error('CRITICAL ERROR fetching or processing game data:', error);
            const timelineContainer = document.getElementById('game-timeline-container');
            if (timelineContainer) {
                timelineContainer.innerHTML = `<p style="color:red; text-align:center;">Error loading game data. Please check console.</p>`;
            }
        });

    // --- Mobile Variant Swipe Functionality ---
    // updateMobileCardContent is no longer needed for swipe, as cards are pre-rendered in the slider.
    // It might be useful for other dynamic updates in the future, so keeping it for now but commented out if unused.
    /*
    function updateMobileCardContent(cardElement, gameData) {
        // ... (implementation as before) ...
    }
    */

    function setupMobileVariantSwipes() {
        // Target the new mobile slider container
        document.querySelectorAll('.mobile-slider-display-area[data-variants]').forEach(sliderArea => {
            const contentStrip = sliderArea.querySelector('.mobile-slider-content-strip');
            if (!contentStrip) return;

            let touchStartX = 0;
            let touchEndX = 0;
            let isSwiping = false; // Flag to track if a swipe is in progress
            const swipeThreshold = 50; // Minimum pixels to be considered a swipe

            // Use the contentStrip for touch events, as it's the scrollable part.
            // However, events on the sliderArea can also work if they don't interfere with children.
            // Let's attach to sliderArea for broader capture, assuming no complex nested scroll/touch.
            sliderArea.addEventListener('touchstart', (event) => {
                if (event.touches.length === 1) { // Only single touch
                    touchStartX = event.touches[0].clientX;
                    isSwiping = true; // Swipe gesture begins
                    // Optionally, disable transition during drag for immediate feedback
                    // contentStrip.style.transition = 'none';
                }
            }, { passive: true });

            sliderArea.addEventListener('touchmove', (event) => {
                if (!isSwiping || event.touches.length !== 1) return;
                touchEndX = event.touches[0].clientX;

                // Optional: Allow dragging the strip with the finger
                // const currentVariantIndex = parseInt(sliderArea.dataset.currentVariantIndex, 10);
                // const deltaX = touchEndX - touchStartX;
                // const baseTranslateX = -currentVariantIndex * 100; // Assuming 100% width per slide
                // contentStrip.style.transform = `translateX(calc(${baseTranslateX}% + ${deltaX}px))`;
                // This makes it feel more like a native swipe but requires careful handling of touchend.
                // For simplicity, we'll stick to calculating transform only on touchend.

            }, { passive: true }); // passive: true if not preventing scroll

            sliderArea.addEventListener('touchend', () => {
                if (!isSwiping) return; // No swipe started

                // Re-enable transition if it was disabled during touchmove
                // contentStrip.style.transition = ''; // Or the specific transition property

                if (touchEndX === 0) { // No touchmove recorded (or reset)
                    isSwiping = false;
                    return;
                }

                const deltaX = touchEndX - touchStartX;
                let direction = 0; // -1 for previous, 1 for next

                if (Math.abs(deltaX) > swipeThreshold) {
                    direction = (deltaX < 0) ? 1 : -1;
                }

                if (direction !== 0) {
                    const variantsJson = sliderArea.dataset.variants;
                    const currentVariantIndexStr = sliderArea.dataset.currentVariantIndex;

                    if (variantsJson && currentVariantIndexStr) {
                        try {
                            const variants = JSON.parse(variantsJson); // Not strictly needed if only using index
                            let currentVariantIndex = parseInt(currentVariantIndexStr, 10);
                            const totalVariants = variants.length;

                            const previousIndex = currentVariantIndex; // Store for comparison
                            currentVariantIndex += direction;

                            // Clamp index
                            currentVariantIndex = Math.max(0, Math.min(currentVariantIndex, totalVariants - 1));

                            if (currentVariantIndex !== previousIndex) {
                                // Update data attribute
                                sliderArea.dataset.currentVariantIndex = currentVariantIndex.toString();

                                // Animate slide
                                contentStrip.style.transform = `translateX(-${currentVariantIndex * 100}%)`;

                                // Update pager dots
                                const pagerDotsContainer = sliderArea.querySelector('.mobile-pager-dots');
                                if (pagerDotsContainer) {
                                    const dots = pagerDotsContainer.querySelectorAll('.dot');
                                    dots.forEach((dot, idx) => {
                                        dot.classList.toggle('active', idx === currentVariantIndex);
                                    });
                                }
                            } else {
                                // If swipe didn't change index (e.g., at boundary), snap back
                                contentStrip.style.transform = `translateX(-${currentVariantIndex * 100}%)`;
                            }
                        } catch (e) {
                            console.error("Error processing variants for mobile swipe animation:", e);
                        }
                    }
                } else if (touchEndX !== 0) { // Not enough swipe, snap back to current slide
                     const currentVariantIndex = parseInt(sliderArea.dataset.currentVariantIndex, 10);
                     contentStrip.style.transform = `translateX(-${currentVariantIndex * 100}%)`;
                }

                // Reset for next swipe
                isSwiping = false;
                touchStartX = 0;
                touchEndX = 0;
            });
        });
    }

    function navigateSlider(sliderDisplayAreaElement, direction) { // This is for DESKTOP slider
        const contentStrip = sliderDisplayAreaElement.querySelector('.game-entry-slider .slider-content-strip');
        if (!contentStrip) return;

        const itemsCount = contentStrip.children.length;
        let currentIndex = parseInt(sliderDisplayAreaElement.getAttribute('data-current-index'), 10);
        currentIndex += direction;
        currentIndex = Math.max(0, Math.min(currentIndex, itemsCount - 1));
        sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
        contentStrip.style.transform = `translateX(calc(-${currentIndex} * (100% + 2rem)))`;

        const prevButton = sliderDisplayAreaElement.querySelector('.slider-arrow-prev');
        const nextButton = sliderDisplayAreaElement.querySelector('.slider-arrow-next');
        if (prevButton) prevButton.disabled = currentIndex === 0;
        if (nextButton) nextButton.disabled = currentIndex === itemsCount - 1;
    }

});
