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
                gameEntryDiv.style.color = game.englishTitle === "Trails in the Sky SC" ? '#000000' : '#FFFFFF';
                gameEntryDiv.style.top = `${topPosition -1}px`; // -1 for border adjustment
                gameEntryDiv.style.height = `${entryHeight}px`;
                gameEntryDiv.style.width = '90%';
                gameEntryDiv.style.left = '5%';
                // Add a data attribute to identify boxes for a game, useful for positioning "info-below" text
                gameEntryDiv.dataset.gameTitle = game.englishTitle;
                gameEntryDiv.dataset.periodIndex = periodIndex; // Store period index for targeted text insertion

                // --- Text Display Logic ---
                const isCSII = game.englishTitle === "Trails of Cold Steel II";
                const isSpecialPlacementGame = ["Trails in the Sky the 3rd", "Trails into Reverie", "Trails of Cold Steel IV"].includes(game.englishTitle);

                if (isSpecialPlacementGame) {
                    gameEntryDiv.classList.add('special-info-below');
                    // Text for these games is handled *after* all their period boxes are rendered (see below).
                } else if (isCSII) {
                    // Trails of Cold Steel II: Text in main story box, epilogue box empty.
                    if (period.label === "Main Story") {
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        gameEntryDiv.appendChild(titleEl);

                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        // For CSII, the main story's display string is the one from its period object.
                        dateDisplayEl.textContent = period.display;
                        gameEntryDiv.appendChild(dateDisplayEl);

                        if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
                            titleEl.style.display = 'none';
                            dateDisplayEl.style.display = 'none';
                        } else if (entryHeight < (pixelsPerMonthVertical * 1.8)) {
                            dateDisplayEl.style.display = 'none';
                        }
                    }
                    // Epilogue box for CSII intentionally left empty.
                } else {
                    // Default behavior: Text (title + first period's display string) inside the first period's box.
                    // Subsequent period boxes for these games remain empty.
                    if (periodIndex === 0) {
                        const titleEl = document.createElement('div');
                        titleEl.className = 'game-entry-title';
                        titleEl.textContent = game.englishTitle;
                        gameEntryDiv.appendChild(titleEl);

                        const dateDisplayEl = document.createElement('div');
                        dateDisplayEl.className = 'game-entry-duration';
                        // Use the 'display' string from the first period.
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

                // Tooltip for ALL period boxes
                // The tooltip should use the period's specific start/end for precision,
                // potentially formatted differently from the main 'display' string if needed.
                // For now, let's use the period's 'display' string for the main part of the tooltip for consistency,
                // and add the label if it exists.
                let tooltipText = `${game.englishTitle}`;
                if (period.label) {
                    tooltipText += ` (${period.label})`;
                }
                tooltipText += `\n${period.display}`; // Use the period's own display string for the tooltip.
                gameEntryDiv.setAttribute('title', tooltipText);

                targetColumn.appendChild(gameEntryDiv);
            }); // End of period loop

            // --- Special Placement Text Rendering (Below the Box) ---
            // This runs once per game *after* all its period boxes have been created and added to the DOM.
            if (["Trails in the Sky the 3rd", "Trails into Reverie", "Trails of Cold Steel IV"].includes(game.englishTitle)) {
                const infoBelowContainer = document.createElement('div');
                infoBelowContainer.className = 'game-info-below-text-container';
                // Set text color for special placement games
                if (game.englishTitle === "Trails in the Sky SC") { // Should not happen based on current special placement games
                    infoBelowContainer.style.color = '#000000';
                } else {
                    infoBelowContainer.style.color = '#FFFFFF';
                }
                infoBelowContainer.style.textAlign = 'center';

                const titleEl = document.createElement('div');
                titleEl.className = 'game-entry-title';
                titleEl.textContent = game.englishTitle;
                infoBelowContainer.appendChild(titleEl);

                // Add each period's information
                game.timelinePeriodsParsed.forEach(p => {
                    const periodDetailEl = document.createElement('div');
                    periodDetailEl.className = 'game-entry-duration period-detail';

                    let lineText = "";
                    if (p.label) {
                        lineText += `<strong>${p.label}:</strong> `;
                    }
                    lineText += p.display; // Use the 'display' string from the period object
                    periodDetailEl.innerHTML = lineText; // Use innerHTML to render <strong>
                    infoBelowContainer.appendChild(periodDetailEl);
                });

                // Position the infoBelowContainer below the *lowest* rendered box for this game.
                let lowestBoxBottom = 0;
                const gameBoxesInColumn = targetColumn.querySelectorAll(`.game-entry-box[data-game-title="${game.englishTitle}"]`);

                if (gameBoxesInColumn.length > 0) {
                    gameBoxesInColumn.forEach(box => {
                        const boxBottom = box.offsetTop + box.offsetHeight;
                        if (boxBottom > lowestBoxBottom) {
                            lowestBoxBottom = boxBottom;
                        }
                    });
                    infoBelowContainer.style.position = 'absolute';
                    infoBelowContainer.style.top = `${lowestBoxBottom + 5}px`; // 5px spacing
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
});
