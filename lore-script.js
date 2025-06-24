document.addEventListener('DOMContentLoaded', () => {
    const pixelsPerMonthVertical = 22; // Adjusted for better density
    let allGames = [];
    let minDate, maxDate;

    // --- DOM Elements ---
    const timeAxisContainer = document.getElementById('time-axis-container');
    const gameColumnsContainer = document.getElementById('game-columns-container');
    const liberlColumn = document.getElementById('liberl-arc-column').querySelector('.game-entries-area');
    const crossbellColumn = document.getElementById('crossbell-arc-column').querySelector('.game-entries-area');
    const ereboniaColumn = document.getElementById('erebonia-arc-column').querySelector('.game-entries-area');
    
    let monthLinesOverlay; // Will be created and appended to gameColumnsContainer

    // --- Utility Functions ---
    function getDaysInMonth(year, month) { // month is 1-indexed
        return new Date(year, month, 0).getDate();
    }

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
            // Validate timelinePeriods
            if (game.timelinePeriods && (!Array.isArray(game.timelinePeriods) || game.timelinePeriods.length === 0)) {
                // If timelinePeriods is present but empty or not an array, treat as problematic for timeline display
                console.warn(`Game ${game.englishTitle} has invalid timelinePeriods. Skipping timeline processing for it.`);
                // Keep the game object but ensure it won't be processed for timeline rendering
                // by not creating timelinePeriodsParsed or by ensuring it's empty.
                // The original logic for `timelineDisplayString` check is removed as it's deprecated.
                return { ...game, timelinePeriodsParsed: [] };
            } else if (!game.timelinePeriods) {
                // Game does not have timelinePeriods, it's not for the timeline or is an older format.
                // Keep the game data if it's not intended for the new timeline logic.
                // If old fields like timelineStart/End were used, they'd be handled or ignored downstream.
                // For this refactor, we primarily care about games with timelinePeriods.
                return { ...game };
            }

            // At this point, game.timelinePeriods is a non-empty array.
            let parsedPeriods = [];
            // This check is slightly redundant due to above but ensures safety if logic changes.
            if (game.timelinePeriods) {
                parsedPeriods = game.timelinePeriods.map(period => {
                    // Ensure 'start' and 'end' fields exist in period
                    if (!period.start || !period.end) {
                        console.warn(`Period in ${game.englishTitle} is missing start or end date. Skipping period.`);
                        return null;
                    }
                    const periodStart = parseTimelineDate(period.start);
                    const periodEnd = parseTimelineDate(period.end);

                    if (!periodStart || !periodEnd) {
                        console.warn(`Invalid period dates for ${game.englishTitle} (${period.label || 'period'}). Skipping period.`);
                        return null;
                    }
                    if (dateToTotalMonths(periodStart) > dateToTotalMonths(periodEnd)) {
                        console.warn(`Period start date after end date for ${game.englishTitle} (${period.label || 'period'}). Skipping period.`);
                        return null;
                    }
                    // Crucially, ensure the 'display' field from games.json is carried over.
                    return { ...period, startParsed: periodStart, endParsed: periodEnd, display: period.display };
                }).filter(p => p !== null);

                if (parsedPeriods.length === 0) {
                     // If all periods were invalid
                    console.warn(`All periods invalid for ${game.englishTitle}. It will not be rendered on the timeline.`);
                     // Return game but with empty parsedPeriods so it's skipped in rendering.
                    return { ...game, timelinePeriodsParsed: [] };
                }
            }
            
            let timelineColor = game.timelineColor;
            if (game.timelinePeriods && (!timelineColor || !/^#[0-9A-F]{6}$/i.test(timelineColor))) {
                console.warn(`Invalid or missing timelineColor for ${game.englishTitle}. Using default.`);
                timelineColor = '#808080'; // Default gray
            }

            // Return game with parsed periods, or original game if no timeline data
            return game.timelinePeriods ? { ...game, timelinePeriodsParsed: parsedPeriods, timelineColor } : { ...game };
        }).filter(game => game !== null); // Filter out games that were explicitly skipped (returned null)
    }

    function calculateDateRange() {
        const gamesWithTimeline = allGames.filter(game => game.timelinePeriodsParsed && game.timelinePeriodsParsed.length > 0);
        if (gamesWithTimeline.length === 0) {
            console.warn("No games with valid timeline periods found to calculate date range.");
            minDate = null; // Explicitly nullify if no data
            maxDate = null;
            return;
        }

        let minMonths = Infinity, maxMonths = -Infinity;

        gamesWithTimeline.forEach(game => {
            game.timelinePeriodsParsed.forEach(period => {
                minMonths = Math.min(minMonths, dateToTotalMonths(period.startParsed));
                maxMonths = Math.max(maxMonths, dateToTotalMonths(period.endParsed));
            });
        });
        
        if (minMonths === Infinity || maxMonths === -Infinity) {
            console.warn("Could not determine min/max months from timeline periods.");
            minDate = null;
            maxDate = null;
            return;
        }

        minDate = { year: Math.floor((minMonths -1) / 12), month: (minMonths -1) % 12 + 1 };
        maxDate = { year: Math.floor((maxMonths -1) / 12), month: (maxMonths -1) % 12 + 1 };

        let paddedMinMonth = minDate.month - 3;
        let paddedMinYear = minDate.year;
        if (paddedMinMonth <= 0) { paddedMinMonth += 12; paddedMinYear--; }
        minDate = { year: paddedMinYear, month: paddedMinMonth };

        let paddedMaxMonth = maxDate.month + 3;
        let paddedMaxYear = maxDate.year;
        if (paddedMaxMonth > 12) { paddedMaxMonth -= 12; paddedMaxYear++; }
        maxDate = { year: paddedMaxYear, month: paddedMaxMonth };
        console.log("Timeline Range (Padded):", minDate, "to", maxDate);
    }

    function renderTimeAxis() {
        if (!minDate || !maxDate || !timeAxisContainer || !gameColumnsContainer) return;
        timeAxisContainer.innerHTML = ''; 
        
        if (monthLinesOverlay) monthLinesOverlay.remove();
        monthLinesOverlay = document.createElement('div');
        monthLinesOverlay.id = 'month-lines-overlay';
        gameColumnsContainer.insertBefore(monthLinesOverlay, gameColumnsContainer.firstChild);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const labeledMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct

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

            // Only render month label if it's one of the designated labeledMonths AND it's not January
            if (labeledMonths.includes(currentMonth - 1) && monthNames[currentMonth - 1] !== "Jan") {
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('month-label');
                monthLabel.textContent = monthNames[currentMonth - 1];
                // Move month labels up by half a step
                monthLabel.style.top = `${yOffset - (0.5 * pixelsPerMonthVertical)}px`;
                timeAxisContainer.appendChild(monthLabel);
            }
            
            const monthLine = document.createElement('div');
            monthLine.classList.add('month-line');
            monthLine.style.top = `${yOffset}px`;
            monthLinesOverlay.appendChild(monthLine);

            yOffset += pixelsPerMonthVertical;
            currentMonth++;
            if (currentMonth > 12) { currentMonth = 1; currentYear++; firstYearRendered = true; }
        }
        
        const totalTimelineHeight = yOffset;
        [timeAxisContainer, liberlColumn, crossbellColumn, ereboniaColumn, monthLinesOverlay].forEach(el => {
            if (el) el.style.height = `${totalTimelineHeight}px`;
        });
    }

    function getDayOrdinal(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th";
        }
    }

    function formatDisplayDate(parsedDate, game = null) {
        if (!parsedDate) return "N/A";
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[parsedDate.month - 1];

        let displayDay = parsedDate.day; // Start with the actual day from data

        // Apply specific overrides to hide the day if necessary
        if (game) {
            // For Liberl and Crossbell Arcs, usually the overall game start/end dates are shown without specific days
            // for a cleaner "Month Year" display, even if the raw data has a day (e.g., start of month).
            // The old logic for hiding days based on game.timelineStartParsed/EndParsed
            // is no longer directly applicable as those top-level fields are removed for timeline games.
            // The new `timelineDisplayString` handles the overall date range string.
            // This function `formatDisplayDate` will now be more general or used for specific period dates
            // where day display is desired.
            // The decision to show/hide day for *period-specific* strings (e.g. in "below the box" text)
            // might need new rules if the default "Month Day, SYYYY" is not always wanted.
            // For now, let's assume `timelineDisplayString` is primary for the main display,
            // and this function formats dates with days by default if a day is present.
        }

        // Format based on whether a day is to be displayed
        if (displayDay) {
            return `${monthName} ${displayDay}${getDayOrdinal(displayDay)}, S${parsedDate.year}`; // e.g., November 29th, S1204
        } else {
            return `${monthName} S${parsedDate.year}`; // e.g., January S1202 (no comma)
        }
    }

    function getTextColorForBackground(hexColor) {
        if (!hexColor) return '#FFFFFF';
        const r = parseInt(hexColor.slice(1, 3), 16), g = parseInt(hexColor.slice(3, 5), 16), b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    function renderGameEntries() {
        if (!allGames || allGames.length === 0 || !minDate) {
            console.warn("Cannot render game entries: missing data.");
            return;
        }
        [liberlColumn, crossbellColumn, ereboniaColumn].forEach(col => { if (col) col.innerHTML = ''; });

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
                gameEntryDiv.style.color = getTextColorForBackground(game.timelineColor);
                gameEntryDiv.style.top = `${topPosition -1}px`; // -1 for border adjustment
                gameEntryDiv.style.height = `${entryHeight}px`;
                gameEntryDiv.style.width = '90%';
                gameEntryDiv.style.left = '5%';
                // Add a data attribute to identify boxes for a game, useful for positioning "info-below" text
                gameEntryDiv.dataset.gameTitle = game.englishTitle; // Crucial for identifying boxes later

                // Text Display Logic Implementation Starts Here
                const isCSII = game.englishTitle === "Trails of Cold Steel II";
                const isSpecialPlacement = ["Trails in the Sky the 3rd", "Trails into Reverie", "Trails of Cold Steel IV"].includes(game.englishTitle);

                if (isSpecialPlacement) {
                    gameEntryDiv.classList.add('special-info-below');
                    // Text for these will be handled *after* all their period boxes are rendered.
                }
                // Default Placement (Inside the box)
                else if (!isCSII) { // This condition implies !isSpecialPlacement as well due to structure
                    if (periodIndex === 0) { // Only for the first period's box
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        gameEntryDiv.appendChild(titleEl);

                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        // Use the period's specific display string
                        dateDisplayEl.textContent = period.display ? period.display : "";
                        gameEntryDiv.appendChild(dateDisplayEl);

                        // Adjust text visibility based on box height
                        if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
                            titleEl.style.display = 'none';
                            dateDisplayEl.style.display = 'none';
                        } else if (entryHeight < (pixelsPerMonthVertical * 1.8)) {
                            dateDisplayEl.style.display = 'none';
                        }
                    }
                    // Subsequent period boxes for default games: Add their specific display string.
                    } else {
                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        dateDisplayEl.textContent = period.display ? period.display : "";
                        gameEntryDiv.appendChild(dateDisplayEl);
                        if (entryHeight < (pixelsPerMonthVertical * 0.8)) { // Hide if too small
                            dateDisplayEl.style.display = 'none';
                        }
                    }
                }
                // Exception Placement (CSII)
                else if (isCSII) {
                    if (period.label === "Main Story") {
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        gameEntryDiv.appendChild(titleEl);

                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        // Use the period's specific display string for CSII Main Story
                        dateDisplayEl.textContent = period.display ? period.display : "";
                        gameEntryDiv.appendChild(dateDisplayEl);

                        // Adjust text visibility (similar to default)
                        if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
                            titleEl.style.display = 'none';
                            dateDisplayEl.style.display = 'none';
                        } else if (entryHeight < (pixelsPerMonthVertical * 1.8)) {
                            dateDisplayEl.style.display = 'none';
                        }
                    }
                    // The "Epilogue" box for CSII will remain blank internally, or show its own period.display if desired
                    // For now, matching original behavior of being blank, but could add its display string:
                    else if (period.label === "Epilogue") { // Example: If CSII Epilogue should also show its date
                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        dateDisplayEl.textContent = period.display ? period.display : "";
                        gameEntryDiv.appendChild(dateDisplayEl);
                         if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
                            dateDisplayEl.style.display = 'none';
                        }
                    }
                }

                // Tooltip for each period: Use period.display for the date part
                let tooltipText = `${game.englishTitle}`;
                if (period.label) {
                    tooltipText += ` (${period.label})`;
                }
                // Use the new period.display string directly in the tooltip
                tooltipText += `\n${period.display ? period.display : formatDisplayDate(startDate, game) + " - " + formatDisplayDate(endDate, game)}`;
                gameEntryDiv.setAttribute('title', tooltipText);

                targetColumn.appendChild(gameEntryDiv);
            }); // End of period loop

            // Special Placement (Below the box) - Text Rendering
            // This runs once per game *after* all its period boxes have been created and added to the DOM.
            if (["Trails in the Sky the 3rd", "Trails into Reverie", "Trails of Cold Steel IV"].includes(game.englishTitle)) {
                const infoBelowContainer = document.createElement('div');
                infoBelowContainer.className = 'game-info-below-text-container';
                infoBelowContainer.style.color = '#FFFFFF';
                infoBelowContainer.style.textAlign = 'center';

                const titleEl = document.createElement('div');
                titleEl.className = 'game-entry-title';
                titleEl.textContent = game.englishTitle;
                infoBelowContainer.appendChild(titleEl);

                // Use period.display for each period's date information
                game.timelinePeriodsParsed.forEach(p => {
                    const periodDetailEl = document.createElement('div');
                    periodDetailEl.className = 'game-entry-duration period-detail';
                    let text = "";
                    if (p.label) {
                        text += `${p.label}: `;
                    }
                    // Use the new p.display string
                    text += p.display ? p.display : "Date not available";
                    periodDetailEl.textContent = text;
                    infoBelowContainer.appendChild(periodDetailEl);
                });

                // Position the infoBelowContainer below the lowest box of the current game.
                let lowestBottom = 0;
                // QuerySelectorAll is on targetColumn, which is correct.
                // Using the data-game-title attribute for reliable selection.
                const gameBoxesInColumn = targetColumn.querySelectorAll(`.game-entry-box[data-game-title="${game.englishTitle}"]`);

                if (gameBoxesInColumn.length > 0) {
                    gameBoxesInColumn.forEach(box => {
                        // offsetTop is relative to the offsetParent (targetColumn if it's positioned).
                        // offsetHeight is the height of the box.
                        const boxBottomInColumn = box.offsetTop + box.offsetHeight;
                        if (boxBottomInColumn > lowestBottom) {
                            lowestBottom = boxBottomInColumn;
                        }
                    });
                    infoBelowContainer.style.position = 'absolute'; // Essential for top/left positioning within column
                    infoBelowContainer.style.top = `${lowestBottom + 5}px`; // 5px spacing below the lowest box
                    infoBelowContainer.style.left = '5%'; // Align with game entry boxes
                    infoBelowContainer.style.width = '90%'; // Match width of game entry boxes
                } else {
                     // This case should ideally not be reached if periods were rendered.
                     console.warn(`No boxes found for game "${game.englishTitle}" to position its 'infoBelowContainer'. Appending at current flow.`);
                }
                targetColumn.appendChild(infoBelowContainer); // Add the fully constructed text block to the column.
            }
        }); // End of game loop
    }

    initializeTimeline();
});
