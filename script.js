document.addEventListener('DOMContentLoaded', () => {
    fetch('games.json')
        .then(response => {
            console.log("Fetched games.json, attempting to parse response...");
            if (!response.ok) {
                console.error("Fetch response was not ok:", response.status, response.statusText);
                return response.text().then(text => { throw new Error("Server error: " + response.status + " " + response.statusText + " - " + text); });
            }
            return response.json();
        })
        .then(games => {
            console.log("Successfully parsed game data. Number of games:", games.length);
            if (games.length > 0) {
                console.log("First game entry sample:", games[0]);
            }
            const timelineContainer = document.getElementById('game-timeline-container');
            console.log("Timeline container element:", timelineContainer);
            if (!timelineContainer) {
                console.error("CRITICAL: timelineContainer is null or undefined!");
            }
            let lastArc = null;

            // Helper function to generate the hierarchical release string (moved outside the loop and refactored for readability)
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

            // --- Helper functions for creating HTML structure ---
            function createArtContainerHTML(game) {
                return `
            <div class="art-container">
                <img src="grid/${game.assetName}.jpg" alt="${game.englishTitle} Grid Art" class="game-grid-art">
            </div>
        `;
            }

            function createMainInfoHTML(game) {
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
                    sliderDisplayArea.setAttribute('data-current-index', '0'); // Keep index here for navigateSlider

                    // Inner container for the sliding content, this will have overflow:hidden
                    const gameEntrySlider = document.createElement('div');
                    gameEntrySlider.className = 'game-entry-slider';
                    // data-current-index might be more logical on sliderDisplayArea if arrows are direct children of it.
                    // Let's assume navigateSlider will be passed sliderDisplayArea.

                    const sliderContentStrip = document.createElement('div');
                    sliderContentStrip.className = 'slider-content-strip';

                    // Create and add the original game entry
                    const originalGameItem = document.createElement('div');
                    originalGameItem.className = 'slider-item';
                    const originalGameEntry = document.createElement('div');
                    originalGameEntry.className = 'game-entry';
                    originalGameEntry.innerHTML = createGameEntryHTML(game);
                    originalGameItem.appendChild(originalGameEntry);
                    sliderContentStrip.appendChild(originalGameItem);

                    // Create and add variant game entries
                    game.variants.forEach(variant => {
                        const variantGameItem = document.createElement('div');
                        variantGameItem.className = 'slider-item';
                        const variantGameEntry = document.createElement('div');
                        variantGameEntry.className = 'game-entry';
                        variantGameEntry.innerHTML = createGameEntryHTML(variant);
                        variantGameItem.appendChild(variantGameEntry);
                        sliderContentStrip.appendChild(variantGameItem);
                    });

                    gameEntrySlider.appendChild(sliderContentStrip); // Add strip to the overflow-hidden container
                    sliderDisplayArea.appendChild(gameEntrySlider); // Add overflow-hidden container to the display area

                    // Add Navigation Arrows to sliderDisplayArea (so they are not clipped)
                    const prevButton = document.createElement('button');
                    prevButton.className = 'slider-arrow slider-arrow-prev';
                    prevButton.innerHTML = '&#10094;';
                    prevButton.setAttribute('aria-label', 'Previous version');
                    prevButton.onclick = () => navigateSlider(sliderDisplayArea, -1); // Pass sliderDisplayArea
                    sliderDisplayArea.appendChild(prevButton);

                    const nextButton = document.createElement('button');
                    nextButton.className = 'slider-arrow slider-arrow-next';
                    nextButton.innerHTML = '&#10095;';
                    nextButton.setAttribute('aria-label', 'Next version');
                    nextButton.onclick = () => navigateSlider(sliderDisplayArea, 1); // Pass sliderDisplayArea
                    sliderDisplayArea.appendChild(nextButton);

                    gameWrapperElement = sliderDisplayArea;

                } else {
                    // Non-slider game entries
                    const standardEntry = document.createElement('div');
                    standardEntry.className = 'game-entry';
                    standardEntry.innerHTML = createGameEntryHTML(game);
                    gameWrapperElement = standardEntry;
                }

                timelineContainer.appendChild(gameWrapperElement);
            });

            function navigateSlider(sliderDisplayAreaElement, direction) {
                // sliderDisplayAreaElement is the new '.slider-display-area'
                // The content strip is inside '.game-entry-slider' which is inside 'sliderDisplayAreaElement'
                const contentStrip = sliderDisplayAreaElement.querySelector('.game-entry-slider .slider-content-strip');
                if (!contentStrip) return;

                const itemsCount = contentStrip.children.length;
                let currentIndex = parseInt(sliderDisplayAreaElement.getAttribute('data-current-index'), 10);

                currentIndex += direction;

                if (currentIndex < 0) currentIndex = 0;
                if (currentIndex >= itemsCount) currentIndex = itemsCount - 1;

                sliderDisplayAreaElement.setAttribute('data-current-index', currentIndex.toString());
                // Adjust translateX to account for the gap.
                // Each item is 100% width, plus a 2rem gap.
                contentStrip.style.transform = `translateX(calc(-${currentIndex} * (100% + 2rem)))`;

                const prevButton = sliderDisplayAreaElement.querySelector('.slider-arrow-prev');
                const nextButton = sliderDisplayAreaElement.querySelector('.slider-arrow-next');
                if (prevButton) prevButton.disabled = currentIndex === 0;
                if (nextButton) nextButton.disabled = currentIndex === itemsCount - 1;
            }

            // Initialize slider arrow states after all game entries are added
            // Query for the new outer wrapper '.slider-display-area'
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

            // --- Arc Navigation Active State Highlighting ---
            const navLinks = document.querySelectorAll('.arc-navigation a');
            const arcHeaders = document.querySelectorAll('.arc-header');
            const headerHeightThreshold = 300; // Adjust as needed, roughly header height + a bit

            function updateActiveLink() {
                let currentActiveArcId = null;

                // First pass: find which arc is currently "active"
                // Iterate backwards to find the *last* header that is above the threshold
                for (let i = arcHeaders.length - 1; i >= 0; i--) {
                    const header = arcHeaders[i];
                    const rect = header.getBoundingClientRect();
                    if (rect.top <= headerHeightThreshold) {
                        currentActiveArcId = header.id;
                        break; // Found the topmost visible arc header
                    }
                }
                
                // If no header is above threshold (e.g. scrolled to very top, before first arc header)
                // default to the first arc, or handle as preferred.
                // For now, if nothing is "active" based on threshold, the first link will be made active if scrolled to top.
                // Or, if scrolled way down past the last header, the last one remains active.
                if (!currentActiveArcId && arcHeaders.length > 0 && window.scrollY < arcHeaders[0].offsetTop) {
                     // If scrolled to the very top, before the first section, make the first link active.
                    currentActiveArcId = arcHeaders[0].id;
                }


                navLinks.forEach(link => {
                    // The link's href is like "#arc-name-header"
                    // The header's id is "arc-name-header"
                    const linkHrefId = link.getAttribute('href').substring(1);
                    if (linkHrefId === currentActiveArcId) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }

            if (navLinks.length > 0 && arcHeaders.length > 0) {
                window.addEventListener('scroll', updateActiveLink);
                updateActiveLink(); // Initial call to set active link on page load
            }
        })
        .catch(error => {
            console.error('CRITICAL ERROR fetching or processing game data:', error);
            // Optionally, display a user-friendly message on the page
            // const body = document.querySelector('body');
            // if (body) {
            //     body.innerHTML = '<h1>Error loading game data</h1><p>Sorry, the game data could not be loaded. Please try again later.</p><p>Error details: ' + error.message + '</p>';
            // }
        });

    // Back to Top Button Functionality
    const backToTopButton = document.getElementById("backToTopBtn");

    if (backToTopButton && typeof backToTopButton.addEventListener === 'function') {
        if (typeof window !== 'undefined' && window.onscroll !== undefined) {
            window.onscroll = function() {
                scrollFunction();
            };
        }

        function scrollFunction() {
            const currentScrollTop = (typeof document !== 'undefined' && document.body && typeof document.body.scrollTop === 'number' ? document.body.scrollTop : 0) ||
                                   (typeof document !== 'undefined' && document.documentElement && typeof document.documentElement.scrollTop === 'number' ? document.documentElement.scrollTop : 0);

            if (backToTopButton.style) {
                if (currentScrollTop > 100) {
                    backToTopButton.style.display = "block";
                } else {
                    backToTopButton.style.display = "none";
                }
            }
        }

        backToTopButton.addEventListener("click", function() {
            if(typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
        });
    }

});
