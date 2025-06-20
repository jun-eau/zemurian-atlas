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

                const entry = document.createElement('div');
                entry.className = 'game-entry';

                entry.innerHTML = createGameEntryHTML(game); // Call the new main function

                timelineContainer.appendChild(entry);
            });
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
