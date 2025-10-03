import { calculateRegionAreaInSelge } from './lib/geometry.js';

// --- SHARED DATA ---
let mapRegionsData = [];
let mapGamesData = [];

// --- ENTRY POINT ---
export function initMapPage() {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.classList.add('is-loading');
    }

    Promise.all([
        fetch('src/data/regions.json').then(res => res.ok ? res.json() : Promise.reject(res.status)),
        fetch('src/data/games.json').then(res => res.ok ? res.json() : Promise.reject(res.status))
    ])
    .then(([regions, games]) => {
        mapGamesData = games;
        mapRegionsData = regions.map(region => ({
            ...region,
            formattedArea: calculateRegionAreaInSelge(region)
        }));

        if (mapContainer) {
            mapContainer.classList.remove('is-loading');
        }

        if (window.innerWidth <= 900 && typeof L !== 'undefined') {
            initMobileMap();
        } else {
            initDesktopMap();
        }
    })
    .catch(error => {
        console.error("Error loading map/game data:", error);
        if (mapContainer) {
            mapContainer.classList.remove('is-loading');
        }
    });
}

// --- MOBILE MAP IMPLEMENTATION (FINAL FEATURE PARITY) ---
function initMobileMap() {
    // Add a class to the body to disable scrolling ONLY on the map page for mobile
    document.body.classList.add('no-scroll');

    // --- Element References ---
    const mapContainer = document.getElementById('mobile-map-container');
    const infoPanel = document.getElementById('mobile-info-panel');
    const panelHeader = infoPanel.querySelector('.panel-header');
    const panelTabsContainer = infoPanel.querySelector('.panel-tabs');
    const scrollableContent = infoPanel.querySelector('.panel-tab-content');
    const loreContentPane = document.getElementById('panel-lore-content');
    const gamesContentPane = document.getElementById('panel-games-content');
    const mapBanner = document.getElementById('mobile-map-banner');

    if (!mapContainer || !infoPanel) return;

    let selectedPath = null;

    // --- Map Initialization ---
    const bounds = [[0, 0], [1744, 2800]];
    const map = L.map('mobile-map-container', {
        crs: L.CRS.Simple,
        minZoom: -2,
        attributionControl: false
    });

    L.imageOverlay('assets/zemuria-map.webp', bounds).addTo(map);

    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
    svgElement.setAttribute('viewBox', '0 0 2800 1744');

    // --- SVG Defs for Masking ---
    const defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
    const mask = document.createElementNS("http://www.w3.org/2000/svg", 'mask');
    mask.id = 'mobile-regions-mask';

    const maskRect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    maskRect.setAttribute('x', '0');
    maskRect.setAttribute('y', '0');
    maskRect.setAttribute('width', '2800');
    maskRect.setAttribute('height', '1744');
    maskRect.setAttribute('fill', 'white');
    mask.appendChild(maskRect);

    const maskGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    maskGroup.setAttribute('fill', 'black');
    mask.appendChild(maskGroup);
    defs.appendChild(mask);
    svgElement.appendChild(defs);

    // --- Dimming Rectangle ---
    const dimmingRect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    dimmingRect.setAttribute('class', 'mobile-dimming-rect');
    dimmingRect.setAttribute('x', '0');
    dimmingRect.setAttribute('y', '0');
    dimmingRect.setAttribute('width', '2800');
    dimmingRect.setAttribute('height', '1744');
    dimmingRect.setAttribute('fill', 'rgba(0, 0, 0, 0.6)');
    dimmingRect.setAttribute('mask', 'url(#mobile-regions-mask)');
    svgElement.appendChild(dimmingRect);

    // --- Region Path Creation & Event Handling ---
    mapRegionsData.forEach(region => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path.setAttribute('d', region.svgPathData);
        path.style.cursor = 'pointer';
        path.classList.add('interactive-region');

        // Add a clone of the path to the mask to make it visible by default
        const maskPath = path.cloneNode();
        maskGroup.appendChild(maskPath);

        path.addEventListener('click', () => {
            // Hide banner on first interaction
            if (mapBanner && !mapBanner.classList.contains('hidden')) {
                mapBanner.classList.add('hidden');
            }

            // Clear previous selection
            if (selectedPath) {
                selectedPath.classList.remove('selected');
            }

            // Set new selection
            path.classList.add('selected');
            selectedPath = path;

            // --- Dynamically Build Panel ---
            buildPanelHeader(region);
            buildPanelTabs(region);
            buildPanelContent(region);

            // Reset scroll to top before showing
            if (scrollableContent) {
                scrollableContent.scrollTop = 0;
            }

            infoPanel.classList.add('active');
        });

        svgElement.appendChild(path);
    });

    L.svgOverlay(svgElement, bounds, { interactive: true }).addTo(map);

    // --- Panel Header Builder ---
    function buildPanelHeader(region) {
        panelHeader.innerHTML = '';

        const hasEmblem = region.emblemAsset;
        panelHeader.style.gridTemplateColumns = hasEmblem ? '40px 1fr auto auto' : '1fr auto auto';

        let headerHTML = '';
        if (hasEmblem) {
            headerHTML += `<img src="assets/logo/${region.emblemAsset}" alt="${region.name} Emblem" class="panel-emblem">`;
        }
        headerHTML += `
            <div class="panel-title-section">
                <h3 class="panel-title">${region.name}</h3>
                <p class="panel-subtitle">${region.government}</p>
            </div>
            <a href="${region.falcomWikiUrl}" target="_blank" rel="noopener noreferrer" class="panel-links" title="View on Falcom Wiki">
                <img src="assets/logo/falcom-wiki.png" alt="Falcom Wiki">
            </a>
            <button class="close-panel-btn">×</button>
        `;
        panelHeader.innerHTML = headerHTML;
        panelHeader.querySelector('.close-panel-btn').addEventListener('click', closePanel);
    }

    // --- Panel Tabs Builder ---
    function buildPanelTabs(region) {
        panelTabsContainer.innerHTML = '';
        const hasGames = region.games && region.games.length > 0;

        if (hasGames) {
            panelTabsContainer.style.display = 'flex';
            panelTabsContainer.innerHTML = `
                <button class="panel-tab active" data-tab="lore">Lore</button>
                <button class="panel-tab" data-tab="games">Games</button>
            `;
            panelTabsContainer.querySelectorAll('.panel-tab').forEach(addTabListener);
        } else {
            panelTabsContainer.style.display = 'none';
        }
    }

    // --- Panel Content Builder ---
    function buildPanelContent(region) {
        const hasGames = region.games && region.games.length > 0;
        const featuredInGames = mapGamesData.filter(game => (region.featuredIn || []).includes(game.id));
        let featuredInHtml = '';
        if (featuredInGames.length > 0) {
            const title = hasGames ? "Also Featured In" : "Featured In";
            featuredInHtml = `
                <div class="panel-lore-section">
                    <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">${title}</h4>
                    <ul>${featuredInGames.map(game => `<li>${game.englishTitle}</li>`).join('')}</ul>
                </div>`;
        }
        loreContentPane.innerHTML = `
            <div class="panel-lore-section">
                <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">Description</h4>
                <p>${region.description || 'No description available.'}</p>
            </div>
            <div class="panel-lore-section">
                <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">History</h4>
                <p>${region.history || 'No history available.'}</p>
            </div>
            <div class="panel-lore-section">
                <h4 style="color: ${region.baseColor}; border-bottom-color: ${region.baseColor};">Region Details</h4>
                ${region.capital ? `<p><strong>Capital:</strong> ${region.capital}</p>` : ''}
                ${region.formattedArea ? `<p><strong>Area:</strong> ${region.formattedArea}</p>` : ''}
            </div>
            ${featuredInHtml}
        `;

        if (hasGames) {
            const gamesInRegion = mapGamesData.filter(game => region.games.includes(game.id));
            gamesContentPane.innerHTML = `<div class="panel-games-grid">${gamesInRegion.map(game => {
                let assetName = game.assetName;
                if (game.id === 'trails-in-the-sky' && game.variants && game.variants.length > 0) {
                    assetName = game.variants[0].assetName;
                }
                return `<img src="assets/grid/${assetName}.jpg" alt="${game.englishTitle}" title="${game.englishTitle}">`;
            }).join('')}</div>`;
        } else {
            gamesContentPane.innerHTML = '';
        }

        loreContentPane.classList.add('active');
        gamesContentPane.classList.remove('active');
    }

    // --- Event Listeners ---
    const closePanel = () => {
        infoPanel.classList.remove('active');
        if (selectedPath) {
            selectedPath.classList.remove('selected');
            selectedPath = null;
        }
    };

    function addTabListener(tab) {
        tab.addEventListener('click', () => {
            const targetPaneId = `panel-${tab.dataset.tab}-content`;
            panelTabsContainer.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            infoPanel.querySelectorAll('.panel-content-pane').forEach(pane => {
                pane.classList.toggle('active', pane.id === targetPaneId);
            });
        });
    }

    // --- Final Map Setup ---
    map.fitBounds(bounds);
    map.setMinZoom(map.getZoom());
    map.setMaxZoom(map.getZoom() + 3);
}


// --- DESKTOP MAP IMPLEMENTATION (Unchanged) ---
function initDesktopMap() {
    let isMapInitialized = false;
    let infobox1, infobox2, currentInfobox;

    function initializeMap() {
        if (isMapInitialized) return;
        isMapInitialized = true;
        const svgNS = "http://www.w3.org/2000/svg";
        const mapOverlay = document.getElementById('map-overlay');
        infobox1 = document.getElementById('map-infobox-1');
        infobox2 = document.getElementById('map-infobox-2');
        currentInfobox = infobox1;

        if (!mapOverlay || !infobox1 || !infobox2) {
            console.error("Required desktop map elements not found!");
            return;
        }

        function hexToRgba(hex, alpha = 1) {
            hex = hex.replace(/^#/, '');
            let bigint = parseInt(hex, 16);
            let r = (bigint >> 16) & 255;
            let g = (bigint >> 8) & 255;
            let b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

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

        mapOverlay.addEventListener('click', (e) => {
            const clickedPath = e.target.closest('.region-path');
            const clickedRegionId = clickedPath ? clickedPath.dataset.regionId : null;
            handleMapClick(clickedRegionId, e.clientX, e.clientY, e.pageX, e.pageY);
        });
    }

    function handleMapClick(clickedRegionId, clientX, clientY, pageX, pageY) {
        const outgoingBox = currentInfobox;
        const isInfoboxActive = outgoingBox.classList.contains('active');
        const currentRegionId = outgoingBox.dataset.regionId;

        if (!clickedRegionId || (isInfoboxActive && clickedRegionId === currentRegionId)) {
            if (isInfoboxActive) {
                outgoingBox.classList.remove('active');
                outgoingBox.dataset.regionId = '';
            }
            return;
        }

        const region = mapRegionsData.find(r => r.id === clickedRegionId);
        if (!region) return;

        const incomingBox = (outgoingBox.id === 'map-infobox-1') ? infobox2 : infobox1;
        incomingBox.style.display = 'block';
        updateInfoboxContents(region, incomingBox);

        prepareAndPositionInfobox(region, incomingBox, clientX, clientY, pageX, pageY).then(() => {
            outgoingBox.classList.remove('active');
            incomingBox.classList.add('active');
            currentInfobox = incomingBox;
        });
    }

    function updateInfoboxContents(region, infoboxEl) {
        const headerEl = infoboxEl.querySelector('.map-infobox-header');
        const gamesViewEl = infoboxEl.querySelector('.infobox-games-view');
        const loreViewEl = infoboxEl.querySelector('.infobox-lore-view');
        const footerEl = infoboxEl.querySelector('.map-infobox-footer');
        const bodyEl = infoboxEl.querySelector('.infobox-body');

        const hasEmblem = region.emblemAsset;
        headerEl.style.gridTemplateColumns = hasEmblem ? '40px 1fr auto' : '1fr auto';
        let headerHTML = hasEmblem ? `<img src="assets/logo/${region.emblemAsset}" alt="${region.name} Emblem" class="map-infobox-emblem">` : '';
        headerHTML += `
            <div class="map-infobox-title-section">
                <h3>${region.name}</h3>
                <p>${region.government}</p>
            </div>
            <div class="map-infobox-links">
                <a href="${region.falcomWikiUrl}" target="_blank" rel="noopener noreferrer" title="View on Falcom Wiki">
                    <img src="assets/logo/falcom-wiki.png" alt="Falcom Wiki">
                </a>
            </div>`;
        headerEl.innerHTML = headerHTML;

        const gamesInRegion = mapGamesData.filter(game => (region.games || []).includes(game.id));
        gamesViewEl.innerHTML = gamesInRegion.length > 0
            ? `<div class="map-infobox-games-grid">${gamesInRegion.map(game => {
                let assetName = game.assetName;
                if (game.id === 'trails-in-the-sky' && game.variants && game.variants.length > 0) {
                    assetName = game.variants[0].assetName;
                }
                return `<img src="assets/grid/${assetName}.jpg" alt="${game.englishTitle}" title="${game.englishTitle}" class="map-infobox-game-art">`;
              }).join('')}</div>`
            : '<p style="font-size: 0.8em; color: #999;">No specific games are primarily set in this region.</p>';

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
            ${featuredInHtml}`;

        const showLoreInitially = region.regionType !== 'major';
        infoboxEl.classList.toggle('show-lore-view', showLoreInitially);
        footerEl.innerHTML = '';
        if (region.regionType === 'major') {
            footerEl.style.display = 'block';
            const toggleButton = document.createElement('button');
            toggleButton.className = 'map-infobox-toggle-btn';
            const updateButtonText = () => {
                toggleButton.textContent = infoboxEl.classList.contains('show-lore-view') ? 'Show Game Art' : 'Show More Details';
            };
            toggleButton.addEventListener('click', (event) => {
                event.stopPropagation();
                infoboxEl.classList.toggle('show-lore-view');
                updateButtonText();
                const targetView = infoboxEl.classList.contains('show-lore-view') ? loreViewEl : gamesViewEl;
                bodyEl.style.height = `${targetView.scrollHeight}px`;
            });
            footerEl.appendChild(toggleButton);
            updateButtonText();
        } else {
            footerEl.style.display = 'none';
        }
    }

    function prepareAndPositionInfobox(region, infoboxEl, clientX, clientY, pageX, pageY) {
        const bodyEl = infoboxEl.querySelector('.infobox-body');
        const gamesViewEl = infoboxEl.querySelector('.infobox-games-view');
        const loreViewEl = infoboxEl.querySelector('.infobox-lore-view');
        const gamesInRegion = mapGamesData.filter(game => (region.games || []).includes(game.id));

        if (region.regionType === 'major' && gamesInRegion.length > 0) {
            const gridWidth = (gamesInRegion.length * 80) + ((gamesInRegion.length - 1) * 8);
            infoboxEl.style.width = `${gridWidth + 24}px`;
        } else {
            infoboxEl.style.width = '320px';
        }

        const images = gamesViewEl.querySelectorAll('img');
        const imageLoadPromises = [...images].map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });

        return Promise.all([document.fonts.ready, ...imageLoadPromises]).then(() => {
            const initialView = infoboxEl.classList.contains('show-lore-view') ? loreViewEl : gamesViewEl;
            bodyEl.classList.add('no-transition');
            bodyEl.style.height = `${initialView.scrollHeight}px`;
            void bodyEl.offsetHeight;
            bodyEl.classList.remove('no-transition');

            const rect = infoboxEl.getBoundingClientRect();
            const offsetX = 20, offsetY = 20;
            let top = pageY + offsetY;
            let left = pageX + offsetX;

            if (clientX + offsetX + rect.width > window.innerWidth) {
                left = pageX - rect.width - offsetX;
            }
            if (clientY + offsetY + rect.height > window.innerHeight) {
                top = pageY - rect.height - offsetY;
            }

            infoboxEl.style.left = `${Math.max(5, left)}px`;
            infoboxEl.style.top = `${Math.max(5, top)}px`;
            infoboxEl.dataset.regionId = region.id;
        });
    }

    initializeMap();
}