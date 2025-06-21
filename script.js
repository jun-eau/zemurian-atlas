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
    function createMobileCardHTML(game, isVariant = false, allVariantsData = null, mainGameAssetName = null) {
        const heroImageUrl = `hero/${game.assetName}.jpg`;
        let pagerDotsHTML = '';

        // Pager dots are only added to the main game card that has variants
        if (!isVariant && game.variants && game.variants.length > 0) {
            pagerDotsHTML += '<span class="dot active"></span>'; // First dot for the main game
            game.variants.forEach(() => pagerDotsHTML += '<span class="dot"></span>');
        }

        // Store all variants data on the main game's mobile card for swipe updates.
        // Also store the main game's asset name for context if needed.
        const variantsAttr = (allVariantsData && !isVariant)
            ? `data-variants='${JSON.stringify(allVariantsData)}' data-current-variant-index="0"`
            : '';
        const mainGameAttr = (mainGameAssetName && isVariant) ? `data-main-game-asset="${mainGameAssetName}"` : '';


        return `
            <div class="game-entry-mobile-card mobile-only card-content-visible" ${variantsAttr} ${mainGameAttr} data-asset-name="${game.assetName}">
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
                ${pagerDotsHTML ? `<div class="mobile-pager-dots">${pagerDotsHTML}</div>` : ''}
            </div>`;
    }

    // Combined function for a single game object (main or variant)
    function createFullGameRenderHTML(gameData, isVariant = false, allVariantsData = null, mainGameAssetName = null) {
        // For variants, allVariantsData would be the full list [mainGame, variant1, variant2...]
        // and mainGameAssetName would be the assetName of the original game.
        return `
            ${createGameEntryDesktopHTML(gameData)}
            ${createMobileCardHTML(gameData, isVariant, allVariantsData, mainGameAssetName)}
        `;
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
                    // For the main game in a slider, pass its full variant data for the mobile card
                    const allVariantDataForMobile = [game, ...game.variants];
                    originalGameEntry.innerHTML = createFullGameRenderHTML(game, false, allVariantDataForMobile);
                    originalGameItem.appendChild(originalGameEntry);
                    sliderContentStrip.appendChild(originalGameItem);

                    // Variant game items
                    game.variants.forEach(variant => {
                        const variantGameItem = document.createElement('div');
                        variantGameItem.className = 'slider-item';
                        const variantGameEntry = document.createElement('div');
                        variantGameEntry.className = 'game-entry';
                        // For variants in a slider, their mobile card is generated as a variant,
                        // but it doesn't need to host the full variant data itself or pager dots.
                        variantGameEntry.innerHTML = createFullGameRenderHTML(variant, true, null, game.assetName);
                        variantGameItem.appendChild(variantGameEntry);
                        sliderContentStrip.appendChild(variantGameItem);
                    });

                    gameEntrySlider.appendChild(sliderContentStrip);
                    sliderDisplayArea.appendChild(gameEntrySlider);

                    const prevButton = document.createElement('button');
                    prevButton.className = 'slider-arrow slider-arrow-prev';
                    prevButton.innerHTML = '&#10094;';
                    prevButton.onclick = () => navigateSlider(sliderDisplayArea, -1);
                    sliderDisplayArea.appendChild(prevButton);

                    const nextButton = document.createElement('button');
                    nextButton.className = 'slider-arrow slider-arrow-next';
                    nextButton.innerHTML = '&#10095;';
                    nextButton.onclick = () => navigateSlider(sliderDisplayArea, 1);
                    sliderDisplayArea.appendChild(nextButton);

                    gameWrapperElement = sliderDisplayArea;
                } else {
                    const standardEntry = document.createElement('div');
                    standardEntry.className = 'game-entry';
                    standardEntry.innerHTML = createFullGameRenderHTML(game); // No variants, so no allVariantData needed for mobile here
                    gameWrapperElement = standardEntry;
                }
                timelineContainer.appendChild(gameWrapperElement);
            });

            // Initialize slider arrow states
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
            const wikiLink = externalLinksContainer.querySelector('a[title*="Wikipedia"]');
            if (wikiLink) wikiLink.href = gameData.wikiUrl;
            const fandomLink = externalLinksContainer.querySelector('a[title*="Fandom"]');
            if (fandomLink) fandomLink.href = gameData.fandomUrl;
        }

        // Update the card's own asset name for consistency if needed, though not strictly used by display after this.
        cardElement.dataset.assetName = gameData.assetName;
    }

    function setupMobileVariantSwipes() {
        document.querySelectorAll('.game-entry-mobile-card[data-variants]').forEach(card => {
            let touchStartX = 0;
            let touchEndX = 0;
            let isSwiping = false;
            const swipeThreshold = 50; // Minimum pixels to be considered a swipe

            card.addEventListener('touchstart', (event) => {
                // Only react to single touch
                if (event.touches.length === 1) {
                    touchStartX = event.touches[0].clientX;
                    isSwiping = true; // Assume swipe might start
                }
            }, { passive: true });

            card.addEventListener('touchmove', (event) => {
                if (event.touches.length === 1 && isSwiping) {
                    touchEndX = event.touches[0].clientX;
                    // Optional: Add visual feedback during swipe if desired (e.g., slight card movement)
                    // To prevent vertical scroll while swiping horizontally:
                    // Check if horizontal movement is more significant than vertical
                    // For simplicity, we'll handle this at touchend. If more complex behavior is needed,
                    // event.preventDefault() could be used here conditionally.
                }
            }, { passive: true }); // passive:true if not preventing scroll, false if you might.

            card.addEventListener('touchend', () => {
                if (!isSwiping || touchEndX === 0) { // Ensure touchmove happened
                    isSwiping = false;
                    touchEndX = 0; // Reset for next potential swipe
                    return;
                }

                const deltaX = touchEndX - touchStartX;
                let direction = 0;

                if (Math.abs(deltaX) > swipeThreshold) {
                    if (deltaX < 0) { // Swipe Left (next)
                        direction = 1;
                    } else { // Swipe Right (previous)
                        direction = -1;
                    }
                }

                if (direction !== 0) {
                    const variantsJson = card.dataset.variants;
                    const currentVariantIndexStr = card.dataset.currentVariantIndex;

                    if (variantsJson && currentVariantIndexStr) {
                        try {
                            const variants = JSON.parse(variantsJson);
                            let currentVariantIndex = parseInt(currentVariantIndexStr, 10);
                            const totalVariants = variants.length;

                            currentVariantIndex += direction;

                            // Clamp index
                            if (currentVariantIndex < 0) currentVariantIndex = 0;
                            if (currentVariantIndex >= totalVariants) currentVariantIndex = totalVariants - 1;

                            if (currentVariantIndex !== parseInt(currentVariantIndexStr, 10)) {
                                const animationDuration = 250; // ms, should match CSS transition duration

                                // Determine swipe direction for animation classes
                                const swipeOutClass = direction === 1 ? 'card-swiping-out-left' : 'card-swiping-out-right';
                                const swipeInClass = direction === 1 ? 'card-swiping-in-left' : 'card-swiping-in-right';

                                // Add class to animate out current content
                                card.classList.add(swipeOutClass);
                                // Remove visibility class if present, to ensure out animation starts from visible state
                                card.classList.remove('card-content-visible');


                                setTimeout(() => {
                                    // Update card content after "out" animation
                                    updateMobileCardContent(card, variants[currentVariantIndex]);
                                    card.dataset.currentVariantIndex = currentVariantIndex.toString();

                                    // Prepare for "in" animation
                                    card.classList.remove(swipeOutClass); // Remove out-animation class
                                    card.classList.add(swipeInClass);     // Add class for initial state of in-animation (e.g., opacity 0, translated)

                                    // Force reflow to ensure "in" animation starts correctly
                                    void card.offsetWidth;

                                    // Add class to trigger "in" animation (to opacity 1, translate 0)
                                    card.classList.add('card-content-visible');
                                    card.classList.remove(swipeInClass); // Clean up initial state class for "in"

                                    // Update pager dots
                                    const pagerDotsContainer = card.querySelector('.mobile-pager-dots');
                                    if (pagerDotsContainer) {
                                        const dots = pagerDotsContainer.querySelectorAll('.dot');
                                        dots.forEach((dot, idx) => {
                                            dot.classList.toggle('active', idx === currentVariantIndex);
                                        });
                                    }

                                    // Optional: Clean up card-content-visible after animation if it interferes with subsequent swipes
                                    // setTimeout(() => {
                                    //    card.classList.remove('card-content-visible');
                                    // }, animationDuration);
                                    // For now, leaving it as subsequent swipes will toggle it.

                                }, animationDuration);
                            }
                        } catch (e) {
                            console.error("Error processing variants for swipe:", e);
                        }
                    }
                }
                // Reset for next swipe
                isSwiping = false;
                touchStartX = 0;
                touchEndX = 0;
            });
        });
    }

    function navigateSlider(sliderDisplayAreaElement, direction) {
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
