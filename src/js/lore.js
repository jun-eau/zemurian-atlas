import { calculateRegionAreaInSelge } from './lib/geometry.js';

export function initLorePage() {
    let isMapInitialized = false;
    let infobox1, infobox2, currentInfobox; // Variables for the two infobox elements and state tracking

    // --- Tabbed Interface Logic ---
    const tabsContainer = document.querySelector('.lore-tabs');
    if (tabsContainer) {
        // Determine the tab to show: saved tab or default to 'map-view'.
        const tabIdToShow = localStorage.getItem('loreLastTab') || 'map-view';

        // Apply 'active' to the determined tab and its content.
        const tabLinkToShow = document.querySelector(`.tab-link[data-tab="${tabIdToShow}"]`);
        const contentToShow = document.getElementById(tabIdToShow);
        if (tabLinkToShow) tabLinkToShow.classList.add('active');
        if (contentToShow) contentToShow.classList.add('active');

        // Check if the map is the active tab on load (either default or from storage) and initialize it
        const initialActiveContent = document.querySelector('.tab-content.active');
        if (initialActiveContent) {
            if (initialActiveContent.id === 'map-view' && !isMapInitialized) {
                initializeMap();
            }
            // Add 'show' class to make it visible with fade-in effect
            setTimeout(() => initialActiveContent.classList.add('show'), 10);
        }

        tabsContainer.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-link');
            if (!clickedTab || clickedTab.classList.contains('active')) {
                return; // Do nothing if not a tab link or if already active
            }
            e.preventDefault();

            const targetTabContentId = clickedTab.dataset.tab;
            localStorage.setItem('loreLastTab', targetTabContentId); // Save selection

            // Initialize map if it's being shown for the first time
            if (targetTabContentId === 'map-view' && !isMapInitialized) {
                initializeMap();
            }

            const targetTabContent = document.getElementById(targetTabContentId);
            const currentActiveTab = tabsContainer.querySelector('.active');
            const currentActiveContent = document.querySelector('.tab-content.active');

            // Switch active state on tabs
            if (currentActiveTab) currentActiveTab.classList.remove('active');
            clickedTab.classList.add('active');

            // Animate content transition
            if (currentActiveContent && targetTabContent) {
                currentActiveContent.classList.remove('show');
                currentActiveContent.addEventListener('transitionend', function handler(event) {
                    if (event.propertyName !== 'opacity') return;
                    currentActiveContent.classList.remove('active');
                    targetTabContent.classList.add('active');
                    setTimeout(() => targetTabContent.classList.add('show'), 10);
                }, { once: true }); // Use { once: true } for cleaner event handling
            }
        });
    }


    const pixelsPerMonthVertical = 22; // Adjusted for better density
    let allGames = [];
    let minDate, maxDate;

    // --- DOM Elements ---
    const timeAxisContainer = document.getElementById('time-axis-container');
    const gameColumnsContainer = document.getElementById('game-columns-container');
    const liberlColumn = document.getElementById('liberl-arc-column').querySelector('.game-entries-area');
    const crossbellColumn = document.getElementById('crossbell-arc-column').querySelector('.game-entries-area');
    const ereboniaColumn = document.getElementById('erebonia-arc-column').querySelector('.game-entries-area');
    const calvardColumn = document.getElementById('calvard-arc-column').querySelector('.game-entries-area');
    
    let monthLinesOverlay; // Will be created and appended to gameColumnsContainer

    // --- Utility Functions ---
    function getDaysInMonth(year, month) { // month is 1-indexed
        return new Date(year, month, 0).getDate();
    }

    // formatDisplayDate and getDayOrdinal are no longer needed as the 'display' string from games.json is used directly.

    function parseTimelineDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            console.warn(`Invalid date string encountered: ${dateStr}`);
            return null;
        }
        return { year, month, day: parts[2] ? parseInt(parts[2], 10) : undefined };
    }

    function dateToTotalMonths(parsedDate) {
        if (!parsedDate) return Infinity;
        return parsedDate.year * 12 + parsedDate.month;
    }

    async function initializeTimeline() {
        try {
            const response = await fetch('src/data/games.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const rawGames = await response.json();
            
            allGames = processGameData(rawGames);
            if (allGames.length === 0) {
                console.warn("No valid game data to display.");
                return;
            }

            calculateDateRange(); // This will now use timelinePeriods
            if (!minDate || !maxDate) {
                console.error("Date range not calculated, cannot render timeline.");
                return;
            }
            renderTimeAxis();
            renderGameEntries();

        } catch (error) {
            console.error("Error initializing timeline:", error);
        }
    }

    function processGameData(rawGames) {
        return rawGames.map(game => {
            // Games not intended for the timeline might not have timelinePeriods.
            // We only process periods if they exist.
            if (!game.timelinePeriods || !Array.isArray(game.timelinePeriods)) {
                // If it's a game that *should* have timeline data (e.g., it has a timelineColor)
                // but is missing timelinePeriods, it's an issue.
                // For now, we'll let it pass through and it simply won't render on the timeline.
                // Alternatively, one could log a warning here for games expected on the timeline.
                return { ...game }; // Keep game data, it just won't have parsed periods.
            }

            let parsedPeriods = game.timelinePeriods.map(period => {
                const periodStart = parseTimelineDate(period.start);
                const periodEnd = parseTimelineDate(period.end);

                if (!periodStart || !periodEnd) {
                    console.warn(`Invalid period dates for ${game.englishTitle} (Label: ${period.label || 'N/A'}, Display: ${period.display}). Skipping period.`);
                    return null;
                }
                if (dateToTotalMonths(periodStart) > dateToTotalMonths(periodEnd)) {
                    console.warn(`Period start date after end date for ${game.englishTitle} (Label: ${period.label || 'N/A'}, Display: ${period.display}). Skipping period.`);
                    return null;
                }
                // The `display` key is crucial and should exist as per new schema.
                if (typeof period.display !== 'string') {
                    console.warn(`Missing or invalid 'display' string for period in ${game.englishTitle} (Label: ${period.label || 'N/A'}). Skipping period.`);
                    return null;
                }
                return { ...period, startParsed: periodStart, endParsed: periodEnd };
            }).filter(p => p !== null);

            // If a game was intended for the timeline (had a timelinePeriods array)
            // but all its periods were invalid, it effectively has no timeline data.
            if (game.timelinePeriods.length > 0 && parsedPeriods.length === 0) {
                console.warn(`All timeline periods for ${game.englishTitle} were invalid. Game will not be rendered on timeline.`);
            }
            
            let timelineColor = game.timelineColor;
            // Validate color only if there are valid periods to render
            if (parsedPeriods.length > 0 && (!timelineColor || !/^#[0-9A-F]{6}$/i.test(timelineColor))) {
                console.warn(`Invalid or missing timelineColor for ${game.englishTitle} with valid periods. Using default.`);
                timelineColor = '#808080'; // Default gray
            }

            return { ...game, timelinePeriodsParsed: parsedPeriods, timelineColor };
        }).filter(game => game !== null); // Filter out any games that might have been explicitly nulled (though current logic doesn't do that at game level).
    }

    function calculateDateRange() {
        // Filter games that have at least one valid, parsed timeline period.
        const gamesWithTimeline = allGames.filter(game => game.timelinePeriodsParsed && game.timelinePeriodsParsed.length > 0);

        if (gamesWithTimeline.length === 0) {
            console.warn("No games with valid timeline periods found to calculate date range.");
            minDate = null;
            maxDate = null;
            return;
        }

        let minMonths = Infinity, maxMonths = -Infinity;

        gamesWithTimeline.forEach(game => {
            game.timelinePeriodsParsed.forEach(period => {
                // Ensure startParsed and endParsed exist on the period object
                if (period.startParsed && period.endParsed) {
                    minMonths = Math.min(minMonths, dateToTotalMonths(period.startParsed));
                    maxMonths = Math.max(maxMonths, dateToTotalMonths(period.endParsed));
                } else {
                    // This should not happen if processGameData filters correctly, but good for safety.
                    console.warn(`Period for ${game.englishTitle} (Label: ${period.label}) missing parsed dates during range calculation.`);
                }
            });
        });
        
        if (minMonths === Infinity || maxMonths === -Infinity) {
            console.warn("Could not determine min/max months from timeline periods. This might happen if all periods had issues.");
            minDate = null;
            maxDate = null;
            return;
        }

        // Convert total months back to year/month objects
        // Ensure calculation is correct for month (1-indexed)
        minDate = { year: Math.floor((minMonths - 1) / 12), month: ((minMonths - 1) % 12) + 1 };
        maxDate = { year: Math.floor((maxMonths - 1) / 12), month: ((maxMonths - 1) % 12) + 1 };


        // Apply padding
        let paddedMinMonth = minDate.month - 3;
        let paddedMinYear = minDate.year;
        if (paddedMinMonth <= 0) { paddedMinMonth += 12; paddedMinYear--; }
        minDate = { year: paddedMinYear, month: paddedMinMonth };

        let paddedMaxMonth = maxDate.month + 3;
        let paddedMaxYear = maxDate.year;
        if (paddedMaxMonth > 12) { paddedMaxMonth -= 12; paddedMaxYear++; }
        maxDate = { year: paddedMaxYear, month: paddedMaxMonth };
        // console.log("Timeline Range (Padded):", minDate, "to", maxDate); // Removed for production
    }

    function renderTimeAxis() {
        if (!minDate || !maxDate || !timeAxisContainer || !gameColumnsContainer) return;
        timeAxisContainer.innerHTML = ''; 
        
        if (monthLinesOverlay) monthLinesOverlay.remove();
        monthLinesOverlay = document.createElement('div');
        monthLinesOverlay.id = 'month-lines-overlay';
        gameColumnsContainer.insertBefore(monthLinesOverlay, gameColumnsContainer.firstChild);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const labeledMonths = [2, 5, 8]; // Mar, Jun, Sep

        let currentYear = minDate.year, currentMonth = minDate.month, yOffset = 0;
        let firstYearRendered = true;

        while (currentYear < maxDate.year || (currentYear === maxDate.year && currentMonth <= maxDate.month)) {
            if (currentMonth === 1 || firstYearRendered) {
                // Only render year label if it's not S1201
                if (currentYear !== 1201) {
                    const yearLabel = document.createElement('div');
                    yearLabel.classList.add('year-label');
                    yearLabel.textContent = `S${currentYear}`;
                    // Move year labels up by half a step
                    yearLabel.style.top = `${yOffset - (firstYearRendered ? 0 : 8) - (0.5 * pixelsPerMonthVertical)}px`;
                    timeAxisContainer.appendChild(yearLabel);
                }
                firstYearRendered = false;
            }

            // Only render month label if it's one of the designated labeledMonths
            if (labeledMonths.includes(currentMonth - 1)) {
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('month-label');
                monthLabel.textContent = monthNames[currentMonth - 1];
                // Adjust month labels to be centered in their month slot
                monthLabel.style.top = `${yOffset}px`;
                timeAxisContainer.appendChild(monthLabel);
            }
            
            const monthLine = document.createElement('div');
            monthLine.classList.add('month-line');
            if (currentMonth === 1) {
                monthLine.classList.add('month-line-year');
            }
            monthLine.style.top = `${yOffset}px`;
            monthLinesOverlay.appendChild(monthLine);

            yOffset += pixelsPerMonthVertical;
            currentMonth++;
            if (currentMonth > 12) { currentMonth = 1; currentYear++; firstYearRendered = true; }
        }
        
        const totalTimelineHeight = yOffset;
        [timeAxisContainer, liberlColumn, crossbellColumn, ereboniaColumn, calvardColumn, monthLinesOverlay].forEach(el => {
            if (el) el.style.height = `${totalTimelineHeight}px`;
        });
    }

    function renderGameEntries() {
        if (!allGames || allGames.length === 0 || !minDate) {
            console.warn("Cannot render game entries: missing data.");
            return;
        }
        [liberlColumn, crossbellColumn, ereboniaColumn, calvardColumn].forEach(col => { if (col) col.innerHTML = ''; });

        const minTotalMonths = dateToTotalMonths(minDate);

        allGames.forEach(game => {
            if (!game.timelinePeriodsParsed || game.timelinePeriodsParsed.length === 0) {
                return;
            }

            let targetColumn;
            if (game.arc === "Liberl Arc") targetColumn = liberlColumn;
            else if (game.arc === "Crossbell Arc") targetColumn = crossbellColumn;
            else if (game.arc === "Erebonia Arc" || game.englishTitle === "Trails into Reverie") targetColumn = ereboniaColumn;
            else if (game.arc === "Calvard Arc") targetColumn = calvardColumn;
            else {
                console.warn(`Game "${game.englishTitle}" arc "${game.arc}" unassigned. Skipping rendering.`);
                return;
            }

            if (!targetColumn) {
                console.warn(`Target column not found for game "${game.englishTitle}". Skipping rendering.`);
                return;
            }

            // New variable to track the bottom position for CSIV without reading from DOM
            let csivCalculatedLowestBottom = 0;

            // Loop through each period of the game
            game.timelinePeriodsParsed.forEach((period, periodIndex) => {
                const startDate = period.startParsed;
                const endDate = period.endParsed;

                // --- Calculate topPosition with day precision ---
                let topPosition = ((dateToTotalMonths(startDate) - minTotalMonths) * pixelsPerMonthVertical) - (2.5 * pixelsPerMonthVertical);
                if (startDate.day) {
                    const daysInStartMonth = getDaysInMonth(startDate.year, startDate.month);
                    const startDayProportion = (startDate.day - 1) / daysInStartMonth;
                    topPosition += startDayProportion * pixelsPerMonthVertical;
                }

                // --- Calculate entryHeight with day precision ---
                let entryHeight;
                const startYear = startDate.year, startMonth = startDate.month, startDay = startDate.day;
                const endYear = endDate.year, endMonth = endDate.month, endDay = endDate.day;

                if (startYear === endYear && startMonth === endMonth) {
                    const daysInMonth = getDaysInMonth(startYear, startMonth);
                    const daySpan = (endDay ? endDay : daysInMonth) - (startDay ? startDay : 1) + 1;
                    entryHeight = (daySpan / daysInMonth) * pixelsPerMonthVertical;
                } else {
                    let startMonthCoverage = 1.0;
                    if (startDay) {
                        const daysInStartMonth = getDaysInMonth(startYear, startMonth);
                        startMonthCoverage = (daysInStartMonth - startDay + 1) / daysInStartMonth;
                    }
                    let endMonthCoverage = 1.0;
                    if (endDay) {
                        const daysInEndMonth = getDaysInMonth(endYear, endMonth);
                        endMonthCoverage = endDay / daysInEndMonth;
                    }
                    const startTotalMonthsValue = startYear * 12 + startMonth;
                    const endTotalMonthsValue = endYear * 12 + endMonth;
                    let numberOfFullMiddleMonths = (endTotalMonthsValue - startTotalMonthsValue - 1);
                    numberOfFullMiddleMonths = Math.max(0, numberOfFullMiddleMonths);
                    const fractionalMonths = startMonthCoverage + endMonthCoverage + numberOfFullMiddleMonths;
                    entryHeight = fractionalMonths * pixelsPerMonthVertical;
                }

                if (entryHeight > 0 && entryHeight < 1) entryHeight = 1; // Min 1px height

                const minPixelHeightForDay = Math.max(1, pixelsPerMonthVertical / 30);
                entryHeight = Math.max(entryHeight, minPixelHeightForDay);

                if (entryHeight <= 0) {
                    console.warn(`Invalid height for ${game.englishTitle} - ${period.label || `Period ${periodIndex+1}`}. Calculated Height: ${entryHeight}. Skipping period.`);
                    return; // Skip this period
                }

                // For CSIV, calculate the lowest point among its periods using the calculated variables.
                if (game.englishTitle === "Trails of Cold Steel IV") {
                    // The box's visual bottom is its calculated top position + its calculated height.
                    // The box's `top` style is `topPosition + 2`.
                    const calculatedBoxBottom = topPosition + 2 + entryHeight;
                    if (calculatedBoxBottom > csivCalculatedLowestBottom) {
                        csivCalculatedLowestBottom = calculatedBoxBottom;
                    }
                }

                const gameEntryDiv = document.createElement('div');
                gameEntryDiv.className = 'game-entry-box';
                gameEntryDiv.style.backgroundColor = game.timelineColor;
                gameEntryDiv.style.color = game.englishTitle === "Trails in the Sky SC" || game.englishTitle === "Trails through Daybreak" ? '#000000' : '#FFFFFF';
                gameEntryDiv.style.top = `${topPosition + 2}px`; // -1 for border adjustment, +3 for shift
                gameEntryDiv.style.height = `${entryHeight}px`;
                gameEntryDiv.style.width = '90%';
                gameEntryDiv.style.left = '5%';
                gameEntryDiv.dataset.gameTitle = game.englishTitle;
                gameEntryDiv.dataset.periodIndex = periodIndex;

                // --- Text Display Logic ---
                const isSky3rd = game.englishTitle === "Trails in the Sky the 3rd";
                const isCSII = game.englishTitle === "Trails of Cold Steel II";
                const isReverie = game.englishTitle === "Trails into Reverie";
                const isCSIV = game.englishTitle === "Trails of Cold Steel IV";

                const isMultiPeriodSpecial = isSky3rd || isCSII || isReverie;

                if (isMultiPeriodSpecial) {
                    gameEntryDiv.classList.add('special-info-below'); // Ensures no text inside these boxes

                    const periodTextContainer = document.createElement('div');
                    periodTextContainer.className = 'game-info-below-text-container individual-period-text';
                    periodTextContainer.style.color = '#FFFFFF';
                    periodTextContainer.style.textAlign = 'center';
                    periodTextContainer.style.position = 'absolute';
                    periodTextContainer.style.left = '5%';
                    periodTextContainer.style.width = '90%';

                    if (period.isMain) {
                        periodTextContainer.classList.add('is-main-period-text');
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        periodTextContainer.appendChild(titleEl);
                    }

                    const periodDetailEl = document.createElement('div');
                    periodDetailEl.className = 'game-entry-duration';

                    let lineText = "";
                    if (period.label) {
                        lineText += `<strong>${period.label}:</strong> `;
                    }
                    lineText += period.display;
                    periodDetailEl.innerHTML = lineText;
                    periodTextContainer.appendChild(periodDetailEl);

                    const spacing = period.isMain ? 2 : 1;
                    periodTextContainer.style.top = `${topPosition + entryHeight + spacing + 3}px`;

                    targetColumn.appendChild(periodTextContainer);

                } else if (isCSIV) {
                    gameEntryDiv.classList.add('special-info-below');
                } else {
                    if (periodIndex === 0) {
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        gameEntryDiv.appendChild(titleEl);

                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        dateDisplayEl.textContent = period.display;
                        gameEntryDiv.appendChild(dateDisplayEl);

                        if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
                            titleEl.style.display = 'none';
                            dateDisplayEl.style.display = 'none';
                        } else if (entryHeight < (pixelsPerMonthVertical * 1.8)) {
                            dateDisplayEl.style.display = 'none';
                        }
                    }
                }
                targetColumn.appendChild(gameEntryDiv);
            }); // End of period loop

            // --- Special Placement Text Rendering (Below the Box) FOR CSIV ONLY ---
            if (game.englishTitle === "Trails of Cold Steel IV") {
                const infoBelowContainer = document.createElement('div');
                infoBelowContainer.className = 'game-info-below-text-container is-main-period-text';
                infoBelowContainer.style.color = '#FFFFFF';
                infoBelowContainer.style.textAlign = 'center';

                const titleEl = document.createElement('div');
                titleEl.className = 'game-entry-title';
                titleEl.textContent = game.englishTitle;
                infoBelowContainer.appendChild(titleEl);

                if (game.timelinePeriodsParsed.length > 0) {
                    const periodDetailEl = document.createElement('div');
                    periodDetailEl.className = 'game-entry-duration';
                    let lineText = game.timelinePeriodsParsed[0].display;
                    if (game.timelinePeriodsParsed[0].label) {
                        lineText = `<strong>${game.timelinePeriodsParsed[0].label}:</strong> ${lineText}`;
                    }
                    periodDetailEl.innerHTML = lineText;
                    infoBelowContainer.appendChild(periodDetailEl);
                }

                // Use the calculated bottom position instead of reading from the DOM
                if (csivCalculatedLowestBottom > 0) {
                    infoBelowContainer.style.position = 'absolute';
                    infoBelowContainer.style.top = `${csivCalculatedLowestBottom + 2}px`; // Add 2px spacing below the box
                    infoBelowContainer.style.left = '5%';
                    infoBelowContainer.style.width = '90%';
                } else {
                     // This case should ideally not be hit if CSIV has periods, but keep for safety.
                     console.warn(`Could not calculate a bottom position for game "${game.englishTitle}" to position its 'infoBelowContainer'.`);
                }
                targetColumn.appendChild(infoBelowContainer);
            }
        }); // End of game loop
    }

    initializeTimeline();

    // --- Map Logic & Data ---
    let mapRegionsData = [];
    let mapGamesData = [];

    let dataReadyPromise = null;

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
                
                handleMapClick(clickedRegionId, e.clientX, e.clientY);
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
     * @param {number} clickX The clientX of the click event.
     * @param {number} clickY The clientY of the click event.
     */
    function handleMapClick(clickedRegionId, clickX, clickY) {
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
        prepareAndPositionInfobox(region, incomingBox, clickX, clickY).then(() => {
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
            ? `<div class="map-infobox-games-grid">${gamesInRegion.map(game => `
                <img src="assets/grid/${game.assetName}.jpg" alt="${game.englishTitle}" title="${game.englishTitle}" class="map-infobox-game-art">
              `).join('')}</div>`
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
     * @param {number} clickX The clientX of the click event.
     * @param {number} clickY The clientY of the click event.
     * @returns {Promise} A promise that resolves when the infobox is sized and positioned.
     */
    function prepareAndPositionInfobox(region, infoboxEl, clickX, clickY) {
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
            let top = clickY + offsetY;
            let left = clickX + offsetX;
            if (left + rect.width > window.innerWidth) left = clickX - rect.width - offsetX;
            if (top + rect.height > window.innerHeight) top = clickY - rect.height - offsetY;
            infoboxEl.style.left = `${Math.max(5, left)}px`;
            infoboxEl.style.top = `${Math.max(5, top)}px`;

            // Set dataset for identification
            infoboxEl.dataset.regionId = region.id;
        });
    }
}
