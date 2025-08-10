document.addEventListener('DOMContentLoaded', () => {
    let isMapInitialized = false;

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
            const response = await fetch('games.json');
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
            // Skip games that don't have timeline data (i.e., no parsed periods)
            if (!game.timelinePeriodsParsed || game.timelinePeriodsParsed.length === 0) {
                // console.log(`Skipping rendering for game without timeline periods: ${game.englishTitle}`);
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

                // Ensure height is at least a small visible amount for very short periods (e.g., 1-day)
                // For example, 1/30th of a month's pixel height for a single day.
                // This ensures even single day events are clickable/visible.
                const minPixelHeightForDay = Math.max(1, pixelsPerMonthVertical / 30);
                entryHeight = Math.max(entryHeight, minPixelHeightForDay);


                if (entryHeight <= 0) {
                    console.warn(`Invalid height for ${game.englishTitle} - ${period.label || `Period ${periodIndex+1}`}. Calculated Height: ${entryHeight}. Skipping period.`);
                    return; // Skip this period
                }

                const gameEntryDiv = document.createElement('div');
                gameEntryDiv.className = 'game-entry-box';
                gameEntryDiv.style.backgroundColor = game.timelineColor;
                gameEntryDiv.style.color = game.englishTitle === "Trails in the Sky SC" ? '#000000' : '#FFFFFF';
                gameEntryDiv.style.top = `${topPosition + 2}px`; // -1 for border adjustment, +3 for shift
                gameEntryDiv.style.height = `${entryHeight}px`;
                gameEntryDiv.style.width = '90%';
                gameEntryDiv.style.left = '5%';
                // Add a data attribute to identify boxes for a game, useful for positioning "info-below" text
                gameEntryDiv.dataset.gameTitle = game.englishTitle;
                gameEntryDiv.dataset.periodIndex = periodIndex; // Store period index for targeted text insertion

                // --- Text Display Logic ---
                const isSky3rd = game.englishTitle === "Trails in the Sky the 3rd";
                const isCSII = game.englishTitle === "Trails of Cold Steel II";
                const isReverie = game.englishTitle === "Trails into Reverie";
                const isCSIV = game.englishTitle === "Trails of Cold Steel IV"; // CSIV remains as is

                const isMultiPeriodSpecial = isSky3rd || isCSII || isReverie;

                if (isMultiPeriodSpecial) {
                    gameEntryDiv.classList.add('special-info-below'); // Ensures no text inside these boxes

                    // Create text container for this specific period box, to be placed below it
                    const periodTextContainer = document.createElement('div');
                    periodTextContainer.className = 'game-info-below-text-container individual-period-text';
                    periodTextContainer.style.color = '#FFFFFF'; // Assuming default, adjust if needed
                    periodTextContainer.style.textAlign = 'center';
                    periodTextContainer.style.position = 'absolute';
                    periodTextContainer.style.left = '5%'; // Match box alignment
                    periodTextContainer.style.width = '90%'; // Match box width

                    let textContent = "";
                    if (period.isMain) {
                        periodTextContainer.classList.add('is-main-period-text');
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        periodTextContainer.appendChild(titleEl);
                    }

                    const periodDetailEl = document.createElement('div');
                    periodDetailEl.className = 'game-entry-duration'; // Use existing class for similar styling

                    let lineText = "";
                    if (period.label) {
                        lineText += `<strong>${period.label}:</strong> `;
                    }
                    lineText += period.display;
                    periodDetailEl.innerHTML = lineText;
                    periodTextContainer.appendChild(periodDetailEl);

                    // Adjust spacing based on whether it's a main display or not
                    const spacing = period.isMain ? 2 : 1; // 2px for main (tightened), 1px for others
                    periodTextContainer.style.top = `${topPosition + entryHeight + spacing + 3}px`;

                    targetColumn.appendChild(periodTextContainer); // Add text container to the column

                } else if (isCSIV) {
                    // CSIV: Existing special placement logic (single text block below all its boxes)
                    // This will be handled after the loop by the existing CSIV logic block
                    gameEntryDiv.classList.add('special-info-below');
                } else {
                    // Default behavior for single-period games (or games not matching above conditions)
                    // Text (title + first period's display string) inside the first period's box.
                    // Subsequent period boxes for these games (if any, though typically not for default) remain empty.
                    if (periodIndex === 0) { // Only for the first box of such games
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        gameEntryDiv.appendChild(titleEl);

                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        dateDisplayEl.textContent = period.display; // Uses the period's display string
                        gameEntryDiv.appendChild(dateDisplayEl);

                        if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
                            titleEl.style.display = 'none';
                            dateDisplayEl.style.display = 'none';
                        } else if (entryHeight < (pixelsPerMonthVertical * 1.8)) {
                            dateDisplayEl.style.display = 'none';
                        }
                    }
                }

                // Tooltip for ALL period boxes
                // The tooltip should use the period's specific start/end for precision,
                // potentially formatted differently from the main 'display' string if needed.
                // Tooltip text construction for custom tooltips (if implemented later) or for clarity:
                // The main display information now comes directly from period.display.
                // Example: game.englishTitle + (period.label ? ` (${period.label})` : "") + "\n" + period.display
                // gameEntryDiv.setAttribute('title', SomeTooltipText); // Browser default tooltips are disabled.

                targetColumn.appendChild(gameEntryDiv);
            }); // End of period loop

            // --- Special Placement Text Rendering (Below the Box) FOR CSIV ONLY ---
            // This runs once per game *after* all its period boxes have been created and added to the DOM.
            // This section is now ONLY for Trails of Cold Steel IV.
            // Sky 3rd, CSII, and Reverie have their text rendered individually per period box.
            if (game.englishTitle === "Trails of Cold Steel IV") {
                const infoBelowContainer = document.createElement('div');
                infoBelowContainer.className = 'game-info-below-text-container'; // Keep existing class for potential shared styles
                infoBelowContainer.classList.add('is-main-period-text'); // Add class for spacing refinement
                infoBelowContainer.style.color = '#FFFFFF'; // Default color
                infoBelowContainer.style.textAlign = 'center';

                const titleEl = document.createElement('div');
                titleEl.className = 'game-entry-title';
                titleEl.textContent = game.englishTitle;
                infoBelowContainer.appendChild(titleEl);

                // For CSIV, it's a single period game effectively for this display logic,
                // so we just show its main display string.
                // If CSIV were to have multiple periods needing listing here, this would need game.timelinePeriodsParsed.forEach
                if (game.timelinePeriodsParsed.length > 0) {
                    const periodDetailEl = document.createElement('div');
                    periodDetailEl.className = 'game-entry-duration'; // Re-use class
                    // CSIV only has one period defined in games.json for timeline purposes.
                    // If it had more, and we wanted all listed like old Sky3rd/Reverie, we'd loop.
                    // For now, assuming first period's display is representative for CSIV's single block.
                    let lineText = game.timelinePeriodsParsed[0].display;
                    if (game.timelinePeriodsParsed[0].label) { // Should not happen for CSIV as it's not multi-period in the data
                        lineText = `<strong>${game.timelinePeriodsParsed[0].label}:</strong> ${lineText}`;
                    }
                    periodDetailEl.innerHTML = lineText;
                    infoBelowContainer.appendChild(periodDetailEl);
                }


                // Position the infoBelowContainer below the *lowest* rendered box for this game (CSIV).
                let lowestBoxBottom = 0;
                const gameBoxesInColumn = targetColumn.querySelectorAll(`.game-entry-box[data-game-title="${game.englishTitle}"]`);

                if (gameBoxesInColumn.length > 0) {
                    gameBoxesInColumn.forEach(box => { // Should only be one box for CSIV currently
                        const boxBottom = box.offsetTop + box.offsetHeight;
                        if (boxBottom > lowestBoxBottom) {
                            lowestBoxBottom = boxBottom;
                        }
                    });
                    infoBelowContainer.style.position = 'absolute';
                    infoBelowContainer.style.top = `${lowestBoxBottom + 2}px`; // Tightened spacing to 2px
                    infoBelowContainer.style.left = '5%';
                    infoBelowContainer.style.width = '90%';
                } else {
                     console.warn(`No boxes found for game "${game.englishTitle}" to position its 'infoBelowContainer'.`);
                }
                targetColumn.appendChild(infoBelowContainer);
            }
        }); // End of game loop
    }

    initializeTimeline();

    function initializeMap() {
        if (isMapInitialized) return;

        const svgNS = "http://www.w3.org/2000/svg";
        const mapOverlay = document.getElementById('map-overlay');
        const infobox = document.getElementById('map-infobox');
        const infoboxHeader = infobox.querySelector('.infobox-header');
        const infoboxGames = infobox.querySelector('.infobox-games');
        const closeButton = infobox.querySelector('.close-btn');

        if (!mapOverlay || !infobox || !infoboxHeader || !infoboxGames) {
            console.error("Map overlay SVG or crucial infobox element not found!");
            return;
        }

        let regionsData = [];
        let gamesData = [];
        let currentRegionId = null; // Track the currently displayed region

        /**
         * Converts a hex color string to an rgba string.
         * @param {string} hex The hex color code (e.g., "#RRGGBB").
         * @param {number} alpha The alpha transparency value (0 to 1).
         * @returns {string} The rgba color string.
         */
        function hexToRgba(hex, alpha = 1) {
            // Remove the hash at the start if it's there
            hex = hex.replace(/^#/, '');

            // Parse the r, g, b values
            let bigint = parseInt(hex, 16);
            let r = (bigint >> 16) & 255;
            let g = (bigint >> 8) & 255;
            let b = bigint & 255;

            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Fetch both JSON files
        Promise.all([
            fetch('regions.json').then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            }),
            fetch('games.json').then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
        ])
        .then(([regions, games]) => {
            regionsData = regions;
            gamesData = games;

            const maskGroup = mapOverlay.querySelector('#regions-mask g');
            if (!maskGroup) {
                console.error("SVG mask group for regions not found!");
                return;
            }

            const gamesById = gamesData.reduce((acc, game) => {
                acc[game.id] = game;
                return acc;
            }, {});

            regionsData.forEach(region => {
                const path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', region.svgPathData);
                path.setAttribute('class', 'region-path');
                path.setAttribute('id', `region-${region.id}`);
                path.dataset.regionId = region.id; // Store region id

                // Set the highlight color as a CSS variable from the region's base color
                if (region.baseColor) {
                    const highlightColor = hexToRgba(region.baseColor, 0.7); // 70% transparency
                    path.style.setProperty('--region-highlight-color', highlightColor);
                }

                mapOverlay.appendChild(path);

                // Create the second, identical path for the mask cutout
                const maskPath = document.createElementNS(svgNS, 'path');
                maskPath.setAttribute('d', region.svgPathData);
                maskPath.setAttribute('fill', 'black');
                maskGroup.appendChild(maskPath);
            });

            mapOverlay.addEventListener('click', (e) => {
                const path = e.target.closest('.region-path');
                if (path && path.dataset.regionId) {
                    const regionId = path.dataset.regionId;

                    // If clicking the same region that's already active, hide it.
                    if (regionId === currentRegionId && infobox.classList.contains('active')) {
                        hideInfobox();
                        return; // Stop further execution
                    }

                    // A new region is clicked, so proceed with showing the infobox.
                    currentRegionId = regionId;
                    const region = regionsData.find(r => r.id === regionId);

                    if (region) {
                        // --- Populate Header ---
                        infoboxHeader.innerHTML = ''; // Clear previous content

                        // 1. Emblem
                        const emblem = document.createElement('img');
                        emblem.src = `assets/logo/${region.emblemAsset}`;
                        emblem.alt = `${region.name} Emblem`;
                        emblem.className = 'infobox-emblem-img';
                        infoboxHeader.appendChild(emblem);

                        // 2. Nation Name
                        const name = document.createElement('h2');
                        name.textContent = region.name;
                        infoboxHeader.appendChild(name);

                        // 3. Stat Block
                        const statBlock = document.createElement('div');
                        statBlock.className = 'infobox-stat-block';
                        if (region.government) {
                            const p = document.createElement('p');
                            p.innerHTML = `<strong>Government</strong><span>${region.government}</span>`;
                            statBlock.appendChild(p);
                        }
                        if (region.capital) {
                            const p = document.createElement('p');
                            p.innerHTML = `<strong>Capital</strong><span>${region.capital}</span>`;
                            statBlock.appendChild(p);
                        }
                        infoboxHeader.appendChild(statBlock);


                        // --- Populate Game Art Grid ---
                        infoboxGames.innerHTML = ''; // Clear previous art
                        region.games.forEach(gameId => {
                            const game = gamesById[gameId];
                            if (game && game.art) {
                                const img = document.createElement('img');
                                img.src = game.art.grid;
                                img.alt = game.englishTitle;
                                img.title = game.englishTitle;
                                infoboxGames.appendChild(img);
                            }
                        });

                        // Store click coordinates for repositioning on resize
                        infobox.dataset.lastClickX = e.clientX;
                        infobox.dataset.lastClickY = e.clientY;

                        // Position and show infobox
                        infobox.style.display = 'block'; // Make it visible to calculate size
                        updateInfobox(); // This now handles both scaling and positioning
                        infobox.classList.add('active');
                    }
                } else if (!infobox.contains(e.target)) {
                    // Hide infobox if clicking outside a region path and not inside the infobox
                    hideInfobox();
                }
            });

            closeButton.addEventListener('click', () => {
                hideInfobox();
            });

            document.addEventListener('click', (e) => {
                // If the click is outside the map container and the infobox, hide it.
                const mapContainer = document.querySelector('.map-container');
                if (!mapContainer.contains(e.target) && !infobox.contains(e.target) && infobox.classList.contains('active')) {
                    hideInfobox();
                }
            });

            window.addEventListener('resize', () => {
                if (infobox.classList.contains('active')) {
                    updateInfobox();
                }
            });

            isMapInitialized = true;
        })
        .catch(error => {
            console.error("Error loading or processing map/game data:", error);
        });

        function updateInfobox() {
            const referenceWidth = 1440;
            const scale = Math.min(window.innerWidth / referenceWidth, 1);
            infobox.style.transform = `scale(${scale})`;

            // Position the infobox, taking the new scale into account.
            if (infobox.dataset.lastClickX && infobox.dataset.lastClickY) {
                const x = parseInt(infobox.dataset.lastClickX);
                const y = parseInt(infobox.dataset.lastClickY);

                const infoboxWidth = infobox.offsetWidth;
                const infoboxHeight = infobox.offsetHeight;
                const scaledWidth = infoboxWidth * scale;
                const scaledHeight = infoboxHeight * scale;

                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const margin = 15; // Margin from the viewport edges

                let top = y + 20;
                let left = x + 20;

                // Adjust if it goes off-screen
                if (left + scaledWidth + margin > viewportWidth) {
                    left = x - scaledWidth - 20;
                }
                if (top + scaledHeight + margin > viewportHeight) {
                    top = y - scaledHeight - 20;
                }

                // Final check to ensure it's not off the top/left after adjustments
                if (top < margin) top = margin;
                if (left < margin) left = margin;

                infobox.style.top = `${top}px`;
                infobox.style.left = `${left}px`;
            }
        }

        function hideInfobox() {
            infobox.classList.remove('active');
            currentRegionId = null; // Reset the currently selected region ID
            // Listen for transition to end before setting display to none
            infobox.addEventListener('transitionend', function handler() {
                if (!infobox.classList.contains('active')) {
                    infobox.style.display = 'none';
                }
                infobox.removeEventListener('transitionend', handler);
            });
        }
    }
});
