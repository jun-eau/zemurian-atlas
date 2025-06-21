document.addEventListener('DOMContentLoaded', () => {
    fetch('games.json')
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error("Server error: " + response.status + " " + response.statusText + " - " + text); });
            }
            return response.json();
        })
        .then(games => {
            const timelineContainer = document.getElementById('game-timeline-container');
            if (!timelineContainer) {
                console.error("CRITICAL: timelineContainer is null or undefined!");
                return; // Exit if container not found
            }

            // Create and append Lightbox structure to the body once
            const lightboxHTML = `
                <div class="lightbox-overlay" id="heroLightbox">
                    <div class="lightbox-content">
                        <img src="" alt="Hero Image Fullscreen" id="lightboxImage">
                    </div>
                    <button class="lightbox-close" id="lightboxCloseBtn" aria-label="Close lightbox">&times;</button>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', lightboxHTML);

            let lastArc = null;

            // Helper function to generate the hierarchical release string
            const createReleaseString = (releases) => {
                if (!releases || releases.length === 0) return '';
                const [firstRelease, ...remainingReleases] = releases;
                const primaryReleaseHtml = `<span class="release-primary">${firstRelease.date} ${firstRelease.platforms}</span>`;
                const secondaryReleasesHtml = remainingReleases.map(release =>
                    `<span class="release-secondary">, ${release.date} ${release.platforms}</span>`
                ).join('');
                return `${primaryReleaseHtml}${secondaryReleasesHtml}`;
            };

            // --- Helper functions for creating HTML structure ---
            function createMobileHeroBannerHTML(game) {
                return `
                    <div class="mobile-hero-banner" data-hero-src="hero/${game.assetName}.jpg" data-game-title="${game.englishTitle}" role="button" tabindex="0" aria-label="View ${game.englishTitle} hero image fullscreen">
                        <img src="hero/${game.assetName}.jpg" alt="${game.englishTitle} Hero Banner" class="mobile-hero-image">
                    </div>
                `;
            }

            function createArtContainerHTML(game) {
                return `
                    <div class="art-container">
                        <img src="grid/${game.assetName}.jpg" alt="${game.englishTitle} Grid Art" class="game-grid-art">
                    </div>
                `;
            }

            function createMainInfoHTML(game) {
                const jpReleasesHTML = createReleaseString(game.releasesJP);
                const enReleasesHTML = createReleaseString(game.releasesEN);

                const releaseDetailsContentHTML = `
                    <div class="release-region">
                        <h4 class="release-header">Japanese Release</h4>
                        <div class="release-list">${jpReleasesHTML}</div>
                    </div>
                    <div class="release-region">
                        <h4 class="release-header">English Release</h4>
                        <div class="release-list">${enReleasesHTML}</div>
                    </div>
                `;

                return `
                    <div class="main-info"> {/* Retained for potential desktop style scope */}
                        <div class="main-info-mobile-group">
                            <img src="logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="game-logo">
                            <p class="japanese-title">
                                <span class="kanji-title">${game.japaneseTitleKanji}</span>
                                <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                            </p>
                        </div>

                        {/* Mobile Accordion */}
                        <div class="mobile-release-accordion">
                            <button class="mobile-release-toggle" aria-expanded="false" aria-controls="release-content-${game.assetName}">
                                Release Details <span class="mobile-chevron">▼</span>
                            </button>
                            <div class="mobile-release-content" id="release-content-${game.assetName}">
                                <div class="release-details">
                                    ${releaseDetailsContentHTML}
                                </div>
                            </div>
                        </div>

                        {/* Desktop Original Release Details */}
                        <div class="release-details-desktop">
                             <div class="release-details">
                                ${releaseDetailsContentHTML}
                             </div>
                        </div>
                    </div>
                `;
            }

            function createExternalLinksHTML(game) {
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
                    </div>
                `;
            }

            function createInfoContainerHTML(game) {
                return `
                    <div class="info-container">
                        <div class="hero-background" style="background-image: url('hero/${game.assetName}.jpg');"></div>
                        <div class="info-content">
                            ${createMainInfoHTML(game)}
                            ${createExternalLinksHTML(game)}
                        </div>
                    </div>
                `;
            }

            function createGameEntryHTML(game) {
                return `
                    ${createMobileHeroBannerHTML(game)}
                    ${createArtContainerHTML(game)}
                    ${createInfoContainerHTML(game)}
                `;
            }

            // Create and add Arc navigation
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
                        const separator = document.createTextNode(' • ');
                        arcNav.appendChild(separator);
                    }
                });
                headerElement.appendChild(arcNav);

                // --- Smooth Scroll for Arc Navigation Links ---
                const arcNavLinks = arcNav.querySelectorAll('a');
                arcNavLinks.forEach(link => {
                    link.addEventListener('click', function(event) {
                        event.preventDefault();
                        const href = this.getAttribute('href');
                        const targetElement = document.querySelector(href);

                        if (targetElement && headerElement) {
                            const headerHeight = headerElement.offsetHeight;
                            const additionalMargin = 10; // Small visual margin
                            const targetPosition = targetElement.offsetTop - headerHeight - additionalMargin;

                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'smooth'
                            });
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

                let gameWrapperElement; // This will be the element added to timelineContainer

                if (game.variants && game.variants.length > 0) {
                    // New outer wrapper for slider and arrows
                    const sliderDisplayArea = document.createElement('div');
                    sliderDisplayArea.className = 'slider-display-area';
                    sliderDisplayArea.setAttribute('data-current-index', '0');

                    const gameEntrySlider = document.createElement('div');
                    gameEntrySlider.className = 'game-entry-slider';

                    const sliderContentStrip = document.createElement('div');
                    sliderContentStrip.className = 'slider-content-strip';

                    // Original game
                    const originalGameItem = document.createElement('div');
                    originalGameItem.className = 'slider-item';
                    const originalGameEntry = document.createElement('div');
                    originalGameEntry.className = 'game-entry';
                    originalGameEntry.innerHTML = createGameEntryHTML(game);
                    originalGameItem.appendChild(originalGameEntry);
                    sliderContentStrip.appendChild(originalGameItem);

                    // Variants
                    game.variants.forEach(variant => {
                        const variantGameItem = document.createElement('div');
                        variantGameItem.className = 'slider-item';
                        const variantGameEntry = document.createElement('div');
                        variantGameEntry.className = 'game-entry';
                        variantGameEntry.innerHTML = createGameEntryHTML(variant);
                        variantGameItem.appendChild(variantGameEntry);
                        sliderContentStrip.appendChild(variantGameItem);
                    });

                    gameEntrySlider.appendChild(sliderContentStrip);
                    sliderDisplayArea.appendChild(gameEntrySlider);

                    const prevButton = document.createElement('button');
                    prevButton.className = 'slider-arrow slider-arrow-prev';
                    prevButton.innerHTML = '&#10094;';
                    prevButton.setAttribute('aria-label', 'Previous version');
                    prevButton.onclick = () => navigateSlider(sliderDisplayArea, -1);
                    sliderDisplayArea.appendChild(prevButton);

                    const nextButton = document.createElement('button');
                    nextButton.className = 'slider-arrow slider-arrow-next';
                    nextButton.innerHTML = '&#10095;';
                    nextButton.setAttribute('aria-label', 'Next version');
                    nextButton.onclick = () => navigateSlider(sliderDisplayArea, 1);
                    sliderDisplayArea.appendChild(nextButton);

                    const sliderWithPagerWrapper = document.createElement('div');
                    sliderWithPagerWrapper.className = 'slider-plus-pager-wrapper';
                    sliderWithPagerWrapper.appendChild(sliderDisplayArea);

                    const pagerContainer = document.createElement('div');
                    pagerContainer.className = 'mobile-variant-pager';
                    sliderWithPagerWrapper.appendChild(pagerContainer);

                    gameWrapperElement = sliderWithPagerWrapper;

                } else {
                    const standardEntry = document.createElement('div');
                    standardEntry.className = 'game-entry';
                    standardEntry.innerHTML = createGameEntryHTML(game);
                    gameWrapperElement = standardEntry;
                }

                timelineContainer.appendChild(gameWrapperElement);
            });

            function navigateSlider(sliderDisplayAreaElement, direction) {
                const contentStrip = sliderDisplayAreaElement.querySelector('.game-entry-slider .slider-content-strip');
                if (!contentStrip) return;

                const itemsCount = contentStrip.children.length;
                let currentIndex = parseInt(sliderDisplayAreaElement.getAttribute('data-current-index'), 10);
                currentIndex += direction;
                if (currentIndex < 0) currentIndex = 0;
                if (currentIndex >= itemsCount) currentIndex = itemsCount - 1;

                sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                // Desktop transform:
                // contentStrip.style.transform = `translateX(calc(-${currentIndex} * (100% + 2rem)))`;
                // Call the unified update function instead
                if (sliderDisplayAreaElement.updateSliderUIVisuals) {
                    sliderDisplayAreaElement.updateSliderUIVisuals();
                } else {
                    // Fallback for safety, though updateSliderUIVisuals should always be attached
                    contentStrip.style.transform = `translateX(calc(-${currentIndex} * (100% + 2rem)))`;
                }

                const prevButton = sliderDisplayAreaElement.querySelector('.slider-arrow-prev');
                const nextButton = sliderDisplayAreaElement.querySelector('.slider-arrow-next');
                if (prevButton) prevButton.disabled = currentIndex === 0;
                if (nextButton) nextButton.disabled = currentIndex === itemsCount - 1;
            }

            document.querySelectorAll('.slider-display-area').forEach(sliderArea => {
                const initialIndex = parseInt(sliderArea.getAttribute('data-current-index'), 10) || 0;
                const contentStrip = sliderArea.querySelector('.game-entry-slider .slider-content-strip');
                if (contentStrip) {
                    const itemsCount = contentStrip.children.length;
                    const prevButton = sliderArea.querySelector('.slider-arrow-prev');
                    const nextButton = sliderArea.querySelector('.slider-arrow-next');
                    if (prevButton) prevButton.disabled = initialIndex === 0;
                    if (nextButton) nextButton.disabled = initialIndex >= itemsCount - 1;
                }
            });

            function initializeLightbox() {
                const lightbox = document.getElementById('heroLightbox');
                const lightboxImage = document.getElementById('lightboxImage');
                const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
                const mainContentElements = document.querySelectorAll('header, main, footer'); // Elements to hide from screen readers

                if (!lightbox || !lightboxImage || !lightboxCloseBtn) {
                    // No console.warn here, as it's a non-critical issue.
                    return;
                }

                let focusedElementBeforeLightbox;

                document.querySelectorAll('.mobile-hero-banner').forEach(banner => {
                    const openLightbox = () => {
                        focusedElementBeforeLightbox = document.activeElement; // Store focus

                        const heroSrc = banner.dataset.heroSrc;
                        const gameTitle = banner.dataset.gameTitle || "Hero Image";
                        if (heroSrc) {
                            lightboxImage.src = heroSrc;
                            lightboxImage.alt = `${gameTitle} Fullscreen Hero Art`;
                            lightbox.classList.add('visible');
                            lightbox.setAttribute('aria-modal', 'true');
                            document.body.style.overflow = 'hidden';

                            mainContentElements.forEach(el => el.setAttribute('aria-hidden', 'true'));
                            lightboxCloseBtn.focus(); // Focus the close button
                        }
                    };
                    banner.addEventListener('click', openLightbox);
                    banner.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openLightbox();
                        }
                    });
                });

                const closeLightbox = () => {
                    lightbox.classList.remove('visible');
                    lightbox.removeAttribute('aria-modal');
                    document.body.style.overflow = '';
                    lightboxImage.src = "";
                    lightboxImage.alt = "Hero Image Fullscreen";

                    mainContentElements.forEach(el => el.removeAttribute('aria-hidden'));
                    if (focusedElementBeforeLightbox) {
                        focusedElementBeforeLightbox.focus(); // Restore focus
                    }
                };

                lightboxCloseBtn.addEventListener('click', closeLightbox);
                lightbox.addEventListener('click', (e) => {
                    if (e.target === lightbox) closeLightbox();
                });
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && lightbox.classList.contains('visible')) closeLightbox();
                });
            }

            function initializeAccordions() {
                document.querySelectorAll('.mobile-release-accordion').forEach(accordion => {
                    const toggleButton = accordion.querySelector('.mobile-release-toggle');
                    const content = accordion.querySelector('.mobile-release-content');
                    if (!toggleButton || !content) return;
                    toggleButton.addEventListener('click', () => {
                        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
                        toggleButton.setAttribute('aria-expanded', !isExpanded);
                        toggleButton.classList.toggle('expanded');
                        content.classList.toggle('expanded');
                    });
                });
            }

            function initializeMobileSliders() {
                document.querySelectorAll('.slider-plus-pager-wrapper').forEach(wrapper => {
                    const sliderDisplayArea = wrapper.querySelector('.slider-display-area');
                    const contentStrip = sliderDisplayArea.querySelector('.slider-content-strip');
                    const pagerContainer = wrapper.querySelector('.mobile-variant-pager');

                    if (!contentStrip || !pagerContainer) return;

                    const items = contentStrip.querySelectorAll('.slider-item');
                    const totalItems = items.length;

                    if (totalItems <= 1) {
                        pagerContainer.style.display = 'none';
                        return;
                    }

                    let currentIndex = 0;
                    let touchstartX = 0;
                    let touchendX = 0;

                    pagerContainer.innerHTML = ''; // Clear any existing dots
                    for (let i = 0; i < totalItems; i++) {
                        const dot = document.createElement('span');
                        dot.classList.add('dot');
                        if (i === 0) dot.classList.add('active');
                        dot.dataset.index = i;
                        dot.setAttribute('role', 'button');
                        dot.setAttribute('tabindex', '0');
                        dot.setAttribute('aria-label', `Go to variant ${i + 1} of ${totalItems}`);
                        dot.addEventListener('click', () => goToSlide(i));
                        dot.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToSlide(i); }});
                        pagerContainer.appendChild(dot);
                    }
                    const dots = pagerContainer.querySelectorAll('.dot');

                    function updateSliderUIVisuals() { // Renamed to avoid conflict if another updateSliderUI exists
                        if (window.innerWidth <= 900) {
                             contentStrip.style.transform = `translateX(-${currentIndex * 100}%)`;
                        } else {
                            // Ensure desktop transform is correct if somehow called
                             contentStrip.style.transform = `translateX(calc(-${currentIndex} * (100% + 2rem)))`;
                        }
                        dots.forEach(dot => dot.classList.remove('active'));
                        if (dots[currentIndex]) {
                            dots[currentIndex].classList.add('active');
                        }
                        sliderDisplayArea.setAttribute('data-current-index', currentIndex.toString());

                        // Accessibility: Set aria-hidden on non-visible slides
                        items.forEach((item, idx) => {
                            if (idx === currentIndex) {
                                item.removeAttribute('aria-hidden');
                                item.querySelectorAll('a, button, input, [tabindex="0"]').forEach(el => el.removeAttribute('tabindex'));
                            } else {
                                item.setAttribute('aria-hidden', 'true');
                                // Prevent tabbing to interactive elements in hidden slides
                                item.querySelectorAll('a, button, input, [tabindex="0"]').forEach(el => el.setAttribute('tabindex', '-1'));
                            }
                        });
                    }
                    // Attach the function to the element for access by navigateSlider
                    sliderDisplayArea.updateSliderUIVisuals = updateSliderUIVisuals;


                    function goToSlide(index) {
                        currentIndex = Math.max(0, Math.min(index, totalItems - 1));
                        // updateSliderUIVisuals also updates data-current-index, so no need to set it here explicitly
                        updateSliderUIVisuals();
                    }

                    contentStrip.addEventListener('touchstart', (event) => {
                        if (window.innerWidth > 900) return;
                        touchstartX = event.changedTouches[0].screenX;
                    }, { passive: true });

                    contentStrip.addEventListener('touchend', (event) => {
                        if (window.innerWidth > 900) return;
                        touchendX = event.changedTouches[0].screenX;
                        handleSwipeGesture(); // Renamed
                    });

                    function handleSwipeGesture() { // Renamed
                        const swipeThreshold = 50;
                        if (touchendX < touchstartX - swipeThreshold) {
                            goToSlide(currentIndex + 1);
                        } else if (touchendX > touchstartX + swipeThreshold) {
                            goToSlide(currentIndex - 1);
                        }
                    }

                    updateSliderUIVisuals();

                    window.addEventListener('resize', () => {
                        // Always update UI based on current index and new screen size
                        updateSliderUIVisuals();
                    });
                });
            }

            const navLinks = document.querySelectorAll('.arc-navigation a');
            const arcHeaders = document.querySelectorAll('.arc-header');
            const headerHeightThreshold = 300;

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
                if (!currentActiveArcId && arcHeaders.length > 0 && window.scrollY < arcHeaders[0].offsetTop) {
                    currentActiveArcId = arcHeaders[0].id;
                }
                navLinks.forEach(link => {
                    const linkHrefId = link.getAttribute('href').substring(1);
                    if (linkHrefId === currentActiveArcId) {
                        link.classList.add('active');
                        link.setAttribute('aria-current', 'location');
                    } else {
                        link.classList.remove('active');
                        link.removeAttribute('aria-current');
                    }
                });
            }

            if (navLinks.length > 0 && arcHeaders.length > 0) {
                window.addEventListener('scroll', updateActiveLink);
                updateActiveLink();
            }

            initializeLightbox();
            initializeAccordions();
            initializeMobileSliders();

        })
        .catch(error => {
            console.error('CRITICAL ERROR fetching or processing game data:', error);
        });

    const backToTopButton = document.getElementById("backToTopBtn");
    if (backToTopButton) {
        window.onscroll = function() { scrollFunction(); };
        function scrollFunction() {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                backToTopButton.style.display = "block";
            } else {
                backToTopButton.style.display = "none";
            }
        }
        backToTopButton.addEventListener("click", function() {
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    }
});
