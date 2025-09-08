import { calculateRegionAreaInSelge } from './lib/geometry.js';

export function initMapPage() {
    let isMapInitialized = false;
    let infobox1, infobox2, currentInfobox; // Variables for the two infobox elements and state tracking

    // --- Map Logic & Data ---
    let mapRegionsData = [];
    let mapGamesData = [];

    function initializeMap() {
        if (isMapInitialized) return;
        isMapInitialized = true;

        const svgNS = "http://www.w3.org/2000/svg";
        const mapContainer = document.querySelector('.map-container');
        const mapOverlay = document.getElementById('map-overlay');
        // Assign to the variables declared in the higher scope
        infobox1 = document.getElementById('map-infobox-1');
        infobox2 = document.getElementById('map-infobox-2');
        currentInfobox = infobox1;

        if (!mapContainer || !mapOverlay || !infobox1 || !infobox2) {
            console.error("Required map elements not found!");
            return;
        }

        mapContainer.classList.add('is-loading');

        function hexToRgba(hex, alpha = 1) {
            hex = hex.replace(/^#/, '');
            let bigint = parseInt(hex, 16);
            let r = (bigint >> 16) & 255;
            let g = (bigint >> 8) & 255;
            let b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        Promise.all([
            fetch('src/data/regions.json').then(res => res.ok ? res.json() : Promise.reject(res.status)),
            fetch('src/data/games.json').then(res => res.ok ? res.json() : Promise.reject(res.status))
        ])
        .then(([regions, games]) => {
            // Now that data is loaded, assign it and calculate areas
            mapGamesData = games;
            mapRegionsData = regions.map(region => ({
                ...region,
                formattedArea: calculateRegionAreaInSelge(region)
            }));

            // Create the SVG paths for regions and the mask
            const maskGroup = mapOverlay.querySelector('#regions-mask g');
            if (!maskGroup) return;

            mapRegionsData.forEach(region => {
                const path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', region.svgPathData);
                path.setAttribute('class', 'region-path');
                path.id = `region-${region.id}`;
                path.dataset.regionId = region.id;
                if (region.baseColor) {
                    path.style.setProperty('--region-highlight-color', hexToRgba(region.baseColor, 0.4));
                }
                mapOverlay.appendChild(path);

                const maskPath = document.createElementNS(svgNS, 'path');
                maskPath.setAttribute('d', region.svgPathData);
                maskPath.setAttribute('fill', 'black');
                maskGroup.appendChild(maskPath);
            });

            // ATTACH THE EVENT LISTENER - only after data is ready and paths are drawn
            mapOverlay.addEventListener('click', (e) => {
                const clickedPath = e.target.closest('.region-path');
                const clickedRegionId = clickedPath ? clickedPath.dataset.regionId : null;

                handleMapClick(clickedRegionId, e.clientX, e.clientY, e.pageX, e.pageY);
            });

            // Remove the loading state
            mapContainer.classList.remove('is-loading');
        })
        .catch(error => {
            console.error("Error loading map/game data:", error);
            mapContainer.classList.remove('is-loading');
        });
    }

    /**
     * Handles clicks on the map overlay. Assumes mapRegionsData and mapGamesData are populated.
     * @param {string|null} clickedRegionId The ID of the clicked region, or null.
     * @param {number} clientX The clientX of the click event.
     * @param {number} clientY The clientY of the click event.
     * @param {number} pageX The pageX of the click event.
     * @param {number} pageY The pageY of the click event.
     */
    function handleMapClick(clickedRegionId, clientX, clientY, pageX, pageY) {
        const outgoingBox = currentInfobox;
        const isInfoboxActive = outgoingBox.classList.contains('active');
        const currentRegionId = outgoingBox.dataset.regionId;

        // Case 1: Close the active infobox if clicking outside or on the same region
        if (!clickedRegionId || (isInfoboxActive && clickedRegionId === currentRegionId)) {
            if (isInfoboxActive) {
                outgoingBox.classList.remove('active');
                outgoingBox.dataset.regionId = '';
            }
            return;
        }

        const region = mapRegionsData.find(r => r.id === clickedRegionId);
        if (!region) return;

        // Determine which box will be the new one
        const incomingBox = (outgoingBox.id === 'map-infobox-1') ? infobox2 : infobox1;

        // Make sure the incoming box is ready to be displayed (it might be display:none from a previous close)
        incomingBox.style.display = 'block';

        // Populate the incoming box with new content
        updateInfoboxContents(region, incomingBox);

        // Prepare the incoming box (size and position it), and once it's ready, trigger the animation
        prepareAndPositionInfobox(region, incomingBox, clientX, clientY, pageX, pageY).then(() => {
            // Now, trigger the cross-fade
            outgoingBox.classList.remove('active');
            incomingBox.classList.add('active');

            // Update the state to track the new active box
            currentInfobox = incomingBox;
        });
    }

    /**
     * Populates the infobox with content for a given region.
     * @param {object} region The region data object.
     * @param {HTMLElement} infoboxEl The main infobox element.
     */
    function updateInfoboxContents(region, infoboxEl) {
        const headerEl = infoboxEl.querySelector('.map-infobox-header');
        const gamesViewEl = infoboxEl.querySelector('.infobox-games-view');
        const loreViewEl = infoboxEl.querySelector('.infobox-lore-view');
        const footerEl = infoboxEl.querySelector('.map-infobox-footer');
        const bodyEl = infoboxEl.querySelector('.infobox-body');

        // Populate Header
        const hasEmblem = region.emblemAsset;
        if (hasEmblem) {
            headerEl.style.gridTemplateColumns = '40px 1fr auto';
        } else {
            headerEl.style.gridTemplateColumns = '1fr auto';
        }

        let headerHTML = '';
        if (hasEmblem) {
            headerHTML += `<img src="assets/logo/${region.emblemAsset}" alt="${region.name} Emblem" class="map-infobox-emblem">`;
        }
        headerHTML += `
            <div class="map-infobox-title-section">
                <h3>${region.name}</h3>
                <p>${region.government}</p>
            </div>
            <div class="map-infobox-links">
                <a href="${region.wikiLink}" target="_blank" rel="noopener noreferrer" title="View on Kiseki Wiki">
                    <img src="assets/logo/fandom.webp" alt="Fandom Wiki">
                </a>
            </div>
        `;
        headerEl.innerHTML = headerHTML;

        // Populate Games View
        const gamesInRegion = mapGamesData.filter(game => (region.games || []).includes(game.id));
        gamesViewEl.innerHTML = gamesInRegion.length > 0
            ? `<div class="map-infobox-games-grid">${gamesInRegion.map(game => {
                let assetName = game.assetName;
                // Per user request, show the 1st Chapter variant grid art for the Liberl infobox.
                if (game.id === 'trails-in-the-sky' && game.variants && game.variants.length > 0) {
                    assetName = game.variants[0].assetName;
                }
                return `<img src="assets/grid/${assetName}.jpg" alt="${game.englishTitle}" title="${game.englishTitle}" class="map-infobox-game-art">`;
              }).join('')}</div>`
            : '<p style="font-size: 0.8em; color: #999;">No specific games are primarily set in this region.</p>';

        // Populate Lore View
        const featuredInGames = mapGamesData.filter(game => (region.featuredIn || []).includes(game.id));
        let featuredInHtml = featuredInGames.length > 0 ? `
            <div class="map-infobox-lore-section">
                <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">${region.regionType === 'major' ? "Also Featured In" : "Featured In"}</h4>
                <ul>${featuredInGames.map(game => `<li>${game.englishTitle}</li>`).join('')}</ul>
            </div>` : '';
        loreViewEl.innerHTML = `
            <div class="map-infobox-lore-section">
                <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">Region Details</h4>
                <p><strong>Capital:</strong> ${region.capital}</p>
                ${region.formattedArea ? `<p><strong>Area:</strong> ${region.formattedArea}</p>` : ''}
            </div>
            <div class="map-infobox-lore-section">
                <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">Description</h4>
                <p>${region.description}</p>
            </div>
            <div class="map-infobox-lore-section">
                <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">History</h4>
                <p>${region.history}</p>
            </div>
            ${featuredInHtml}
        `;

        // Set initial view state first, so the button text is correct.
        const showLoreInitially = region.regionType !== 'major';
        infoboxEl.classList.toggle('show-lore-view', showLoreInitially);

        // Populate Footer & Set Up Toggle
        footerEl.innerHTML = '';
        if (region.regionType === 'major') {
            footerEl.style.display = 'block';
            const toggleButton = document.createElement('button');
            toggleButton.className = 'map-infobox-toggle-btn';

            const updateButtonText = () => {
                toggleButton.textContent = infoboxEl.classList.contains('show-lore-view') ? 'Show Game Art' : 'View Lore Details';
            };
            toggleButton.addEventListener('click', (event) => {
                event.stopPropagation();
                infoboxEl.classList.toggle('show-lore-view');
                updateButtonText();
                const targetView = infoboxEl.classList.contains('show-lore-view') ? loreViewEl : gamesViewEl;
                bodyEl.style.height = `${targetView.scrollHeight}px`;
            });

            footerEl.appendChild(toggleButton);
            updateButtonText(); // Now this will be correct.
        } else {
            footerEl.style.display = 'none';
        }
    }

    /**
     * Sizes, positions, and prepares the infobox, returning a promise that resolves when ready.
     * @param {object} region The region data object.
     * @param {HTMLElement} infoboxEl The main infobox element.
     * @param {number} clientX The clientX of the click event for viewport boundary checks.
     * @param {number} clientY The clientY of the click event for viewport boundary checks.
     * @param {number} pageX The pageX of the click event for document-relative positioning.
     * @param {number} pageY The pageY of the click event for document-relative positioning.
     * @returns {Promise} A promise that resolves when the infobox is sized and positioned.
     */
    function prepareAndPositionInfobox(region, infoboxEl, clientX, clientY, pageX, pageY) {
        const bodyEl = infoboxEl.querySelector('.infobox-body');
        const gamesViewEl = infoboxEl.querySelector('.infobox-games-view');
        const loreViewEl = infoboxEl.querySelector('.infobox-lore-view');
        const gamesInRegion = mapGamesData.filter(game => (region.games || []).includes(game.id));

        // Set width before calculating height
        if (region.regionType === 'major' && gamesInRegion.length > 0) {
            const gridWidth = (gamesInRegion.length * 80) + ((gamesInRegion.length - 1) * 8);
            infoboxEl.style.width = `${gridWidth + 24}px`;
        } else {
            infoboxEl.style.width = '320px';
        }

        // --- Image and Font Loading Fix ---
        const images = gamesViewEl.querySelectorAll('img');
        const imageLoadPromises = [...images].map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Resolve on error too so it doesn't hang forever
            });
        });

        return Promise.all([document.fonts.ready, ...imageLoadPromises]).then(() => {
            // The 'show-lore-view' class is now set in updateInfoboxContents.
            // We just need to read it here to determine the initial view for height calculation.
            const initialView = infoboxEl.classList.contains('show-lore-view') ? loreViewEl : gamesViewEl;

            // --- Height Calculation & Transition Fix ---
            // 1. Add a class to disable transitions on the body.
            bodyEl.classList.add('no-transition');
            // 2. Set the height instantaneously.
            bodyEl.style.height = `${initialView.scrollHeight}px`;

            // 3. Force a reflow. Accessing offsetHeight is a common way to do this.
            // This ensures the browser applies the height change before we re-enable transitions.
            void bodyEl.offsetHeight;

            // 4. Remove the no-transition class so future toggles are animated.
            bodyEl.classList.remove('no-transition');


            // Position the infobox
            const rect = infoboxEl.getBoundingClientRect();
            const offsetX = 20, offsetY = 20;

            // Use pageX/pageY for the base position, making it relative to the document
            let top = pageY + offsetY;
            let left = pageX + offsetX;

            // Use clientX/clientY for viewport boundary checks to decide if we need to flip
            if (clientX + offsetX + rect.width > window.innerWidth) {
                left = pageX - rect.width - offsetX;
            }
            if (clientY + offsetY + rect.height > window.innerHeight) {
                top = pageY - rect.height - offsetY;
            }

            infoboxEl.style.left = `${Math.max(5, left)}px`;
            infoboxEl.style.top = `${Math.max(5, top)}px`;

            // Set dataset for identification
            infoboxEl.dataset.regionId = region.id;
        });
    }

    initializeMap();
}
