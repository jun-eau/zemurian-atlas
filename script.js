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
    function createSingleMobileCardHTML(game) { // Generates HTML for one card, no variant logic here
        const heroImageUrl = `hero/${game.assetName}.jpg`;
        return `
            <div class="game-entry-mobile-card" data-asset-name="${game.assetName}">
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
    }

    function createMobileGameHTML(game) {
        let mobileHTML = '';
        if (game.variants && game.variants.length > 0) {
            const allGameVersions = [game, ...game.variants];
            let cardsHTML = '';
            allGameVersions.forEach(version => {
                cardsHTML += createSingleMobileCardHTML(version);
            });

            let pagerDotsHTML = '<span class="dot active"></span>'; // First dot for the main game
            game.variants.forEach(() => pagerDotsHTML += '<span class="dot"></span>');

            // Store all variants data on the viewport for swipe logic
            const variantsData = JSON.stringify(allGameVersions.map(g => ({ assetName: g.assetName /* add other needed fields if updateMobileCardContent is removed */ })));

            mobileHTML = `
                <div class="mobile-slider-container mobile-only" data-variants='${variantsData}' data-current-variant-index="0">
                    <div class="mobile-slider-viewport">
                        <div class="mobile-slider-strip">
                            ${cardsHTML}
                        </div>
                    </div>
                    <div class="mobile-pager-dots">${pagerDotsHTML}</div>
                </div>`;
        } else {
            // For games without variants, wrap the single card in mobile-only div
            mobileHTML = `<div class="mobile-only">${createSingleMobileCardHTML(game)}</div>`;
        }
        return mobileHTML;
    }


    // Combined function for a single game object (main or variant) for DESKTOP
    function createFullGameRenderHTMLDesktop(gameData) {
        return createGameEntryDesktopHTML(gameData);
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

                const gameEntryElement = document.createElement('div'); // This will be the main container for each game entry

                if (game.variants && game.variants.length > 0) {
                    // Desktop Slider Setup
                    const sliderDisplayArea = document.createElement('div');
                    sliderDisplayArea.className = 'slider-display-area desktop-only'; // Becomes desktop-only
                    sliderDisplayArea.setAttribute('data-current-index', '0');

                    const gameEntrySlider = document.createElement('div');
                    gameEntrySlider.className = 'game-entry-slider';

                    const sliderContentStrip = document.createElement('div');
                    sliderContentStrip.className = 'slider-content-strip';

                    // Original game item for desktop
                    const originalGameItem = document.createElement('div');
                    originalGameItem.className = 'slider-item';
                    const originalGameEntryDesktop = document.createElement('div');
                    originalGameEntryDesktop.className = 'game-entry'; // game-entry class for desktop structure
                    originalGameEntryDesktop.innerHTML = createFullGameRenderHTMLDesktop(game);
                    originalGameItem.appendChild(originalGameEntryDesktop);
                    sliderContentStrip.appendChild(originalGameItem);

                    // Variant game items for desktop
                    game.variants.forEach(variant => {
                        const variantGameItem = document.createElement('div');
                        variantGameItem.className = 'slider-item';
                        const variantGameEntryDesktop = document.createElement('div');
                        variantGameEntryDesktop.className = 'game-entry'; // game-entry class for desktop structure
                        variantGameEntryDesktop.innerHTML = createFullGameRenderHTMLDesktop(variant);
                        variantGameItem.appendChild(variantGameEntryDesktop);
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

                    gameEntryElement.appendChild(sliderDisplayArea); // Append desktop slider to gameEntryElement

                    // Mobile Slider Setup
                    gameEntryElement.insertAdjacentHTML('beforeend', createMobileGameHTML(game));

                } else {
                    // Standard entry for games without variants (both desktop and mobile)
                    // Desktop part
                    const standardDesktopEntry = document.createElement('div');
                    standardDesktopEntry.className = 'game-entry desktop-only'; // Becomes desktop-only
                    standardDesktopEntry.innerHTML = createFullGameRenderHTMLDesktop(game);
                    gameEntryElement.appendChild(standardDesktopEntry);

                    // Mobile part
                    gameEntryElement.insertAdjacentHTML('beforeend', createMobileGameHTML(game));
                }
                timelineContainer.appendChild(gameEntryElement);
            });

            // Initialize desktop slider arrow states
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
    function setupMobileVariantSwipes() {
        document.querySelectorAll('.mobile-slider-container[data-variants]').forEach(sliderContainer => {
            const strip = sliderContainer.querySelector('.mobile-slider-strip');
            const variantsJson = sliderContainer.dataset.variants;
            if (!strip || !variantsJson) return;

            const variants = JSON.parse(variantsJson);
            const totalVariants = variants.length;

            let touchStartX = 0;
            let touchLastX = 0; // To track the last X position during touchmove for touchend delta
            let currentStripTranslateX = 0; // Stores the strip's X position when touch starts
            let currentVariantIndex = 0;
            // let stripWidth = 0; // Total width of the strip - can be calculated if needed
            let cardWidth = 0; // Width of a single card, assuming all are same

            let isSwiping = false;
            const swipeThreshold = 50; // Minimum pixels to be considered a swipe to change card

            sliderContainer.addEventListener('touchstart', (event) => {
                if (event.touches.length !== 1 || totalVariants <= 1) return;
                isSwiping = true;
                touchStartX = event.touches[0].clientX;

                currentVariantIndex = parseInt(sliderContainer.dataset.currentVariantIndex, 10);
                cardWidth = strip.children[0] ? strip.children[0].offsetWidth : sliderContainer.offsetWidth; // Fallback to container width

                // Calculate the strip's current translateX based on the active card index
                // This assumes cards are 100% width of the viewport. No gaps for now.
                currentStripTranslateX = -currentVariantIndex * cardWidth;

                strip.style.transition = 'none'; // Remove transition for direct dragging
                touchLastX = touchStartX; // Initialize touchLastX
            }, { passive: true });

            sliderContainer.addEventListener('touchmove', (event) => {
                if (!isSwiping || event.touches.length !== 1) return;

                const touchCurrentX = event.touches[0].clientX;
                const deltaX = touchCurrentX - touchStartX; // Delta from the very start of the touch
                let newTranslateX = currentStripTranslateX + deltaX;

                touchLastX = touchCurrentX; // Update touchLastX for touchend calculation

                // Optional: Boundary checks (e.g., rubber banding) could be added here.
                // For now, allow free dragging during touchmove.
                strip.style.transform = `translateX(${newTranslateX}px)`;
            }, { passive: true });

            sliderContainer.addEventListener('touchend', () => {
                if (!isSwiping) return;
                isSwiping = false;

                const dragDistance = touchLastX - touchStartX; // Total distance dragged
                let targetVariantIndex = currentVariantIndex;

                if (Math.abs(dragDistance) > swipeThreshold) {
                    if (dragDistance < 0) { // Swiped left (towards next item)
                        targetVariantIndex = Math.min(totalVariants - 1, currentVariantIndex + 1);
                    } else { // Swiped right (towards previous item)
                        targetVariantIndex = Math.max(0, currentVariantIndex - 1);
                    }
                }
                // If swipeThreshold is not met, targetVariantIndex remains currentVariantIndex, so it snaps back.

                const finalTranslateX = -targetVariantIndex * cardWidth;

                strip.style.transition = 'transform 0.3s ease-out';
                strip.style.transform = `translateX(${finalTranslateX}px)`;

                sliderContainer.dataset.currentVariantIndex = targetVariantIndex.toString();

                // Pager dot update is now handled by the transitionend event listener below
            });

            strip.addEventListener('transitionend', (event) => {
                if (event.propertyName !== 'transform') return; // Only react to transform transitions

                const updatedVariantIndex = parseInt(sliderContainer.dataset.currentVariantIndex, 10);
                const pagerDotsContainer = sliderContainer.querySelector('.mobile-pager-dots');
                if (pagerDotsContainer) {
                    const dots = pagerDotsContainer.querySelectorAll('.dot');
                    dots.forEach((dot, idx) => {
                        dot.classList.toggle('active', idx === updatedVariantIndex);
                    });
                }
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
