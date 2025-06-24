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

            calculateDateRange();
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
            if (!game.timelinePeriods || game.timelinePeriods.length === 0) {
                // Games without timeline data (e.g. future releases) might not have these keys.
                // Or, if they are explicitly empty, we can skip them for timeline rendering.
                // We'll keep them in the allGames array for other potential uses, but they won't affect date range.
                console.log(`Game "${game.englishTitle}" has no timelinePeriods. It will not be rendered on the timeline.`);
                return { ...game, timelinePeriodsParsed: [] };
            }

            const parsedPeriods = game.timelinePeriods.map(period => {
                const start = parseTimelineDate(period.start);
                const end = parseTimelineDate(period.end);
                if (!start || !end) {
                    console.warn(`Invalid period date for ${game.englishTitle} (${period.label || 'N/A'}). Skipping this period.`);
                    return null;
                }
                if (dateToTotalMonths(start) > dateToTotalMonths(end)) {
                    console.warn(`Period start date after end date for ${game.englishTitle} (${period.label || 'N/A'}). Skipping this period.`);
                    return null;
                }
                return { ...period, startParsed: start, endParsed: end };
            }).filter(period => period !== null);

            if (parsedPeriods.length === 0 && game.timelinePeriods.length > 0) {
                console.warn(`Skipping game due to all periods having invalid dates: ${game.englishTitle}`);
                return null; // Or return game with empty parsedPeriods if you want to keep it for non-timeline purposes
            }
            
            let timelineColor = game.timelineColor;
            if (!timelineColor || !/^#[0-9A-F]{6}$/i.test(timelineColor)) {
                console.warn(`Invalid or missing timelineColor for ${game.englishTitle}. Using default.`);
                timelineColor = '#808080'; // Default gray
            }

            return { ...game, timelinePeriodsParsed: parsedPeriods, timelineColor };
        }).filter(game => game !== null && (game.timelinePeriodsParsed && game.timelinePeriodsParsed.length > 0 || !game.timelinePeriods || game.timelinePeriods.length === 0) );
        // Keep games that have valid parsed periods OR had no timeline periods to begin with (for other data uses)
        // Filter out games that *should* have had periods but all were invalid.
    }

    function calculateDateRange() {
        if (allGames.length === 0) return;
        let minMonths = Infinity, maxMonths = -Infinity;

        allGames.forEach(game => {
            if (game.timelinePeriodsParsed && game.timelinePeriodsParsed.length > 0) {
                game.timelinePeriodsParsed.forEach(period => {
                    minMonths = Math.min(minMonths, dateToTotalMonths(period.startParsed));
                    maxMonths = Math.max(maxMonths, dateToTotalMonths(period.endParsed));
                });
            }
        });

        if (minMonths === Infinity || maxMonths === -Infinity) {
            console.warn("No valid timeline data found across all games to calculate date range.");
            // Set a default range or handle this case as appropriate
            minDate = { year: 1200, month: 1 }; // Arbitrary default
            maxDate = { year: 1210, month: 12 }; // Arbitrary default
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

        allGames.forEach(game => {
            if (!game.timelinePeriodsParsed || game.timelinePeriodsParsed.length === 0) {
                return; // Skip games with no valid periods to render
            }

            let targetColumn;
            if (game.arc === "Liberl Arc") targetColumn = liberlColumn;
            else if (game.arc === "Crossbell Arc") targetColumn = crossbellColumn;
            else if (game.arc === "Erebonia Arc" || game.englishTitle === "Trails into Reverie") targetColumn = ereboniaColumn;
            else { console.warn(`Game "${game.englishTitle}" arc "${game.arc}" unassigned. Skipping.`); return; }

            if (!targetColumn) {
                console.warn(`Target column not found for game "${game.englishTitle}". Skipping.`);
                return;
            }

            const minTotalMonths = dateToTotalMonths(minDate);

            game.timelinePeriodsParsed.forEach((period, index) => {
                const startDate = period.startParsed;
                const endDate = period.endParsed;

                let topPosition = ((dateToTotalMonths(startDate) - minTotalMonths) * pixelsPerMonthVertical) - (2.5 * pixelsPerMonthVertical);
                if (startDate.day) {
                    const daysInStartMonth = getDaysInMonth(startDate.year, startDate.month);
                    const startDayProportion = (startDate.day - 1) / daysInStartMonth;
                    topPosition += startDayProportion * pixelsPerMonthVertical;
                }

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

                if (entryHeight > 0 && entryHeight < 1) entryHeight = 1;
                if (entryHeight <= 0) {
                    console.warn(`Invalid height for period of ${game.englishTitle} (${period.label || index}). Height: ${entryHeight}. Skipping period.`);
                    return;
                }

                const gameEntryDiv = document.createElement('div');
                gameEntryDiv.className = 'game-entry-box';

                // Apply special class for specific games if it's the first block
                // This class might need re-evaluation based on multi-block display
                if (index === 0) {
                    const specialGames = ["Trails in the Sky the 3rd", "Trails of Cold Steel IV", "Trails into Reverie"];
                    if (specialGames.includes(game.englishTitle)) {
                        gameEntryDiv.classList.add('special-info-below');
                    }
                }

                Object.assign(gameEntryDiv.style, {
                    top: `${topPosition - 1}px`, height: `${entryHeight}px`,
                    backgroundColor: game.timelineColor, color: getTextColorForBackground(game.timelineColor),
                    width: '90%', left: '5%'
                });

                let tooltipText = game.englishTitle;
                if (period.label) {
                    tooltipText += ` - ${period.label}`;
                }
                // Potentially add formatted date range for this specific period to tooltip later if desired

                if (index === 0) { // Only for the first period block
                    const titleEl = document.createElement('div');
                    titleEl.className = 'game-entry-title';
                    titleEl.textContent = game.englishTitle;
                    gameEntryDiv.appendChild(titleEl);

                    if (game.timelineDisplayString) {
                        const isSpecialGame = gameEntryDiv.classList.contains('special-info-below');
                        if (isSpecialGame || entryHeight >= (pixelsPerMonthVertical * 1.8)) {
                            const durationEl = document.createElement('div');
                            durationEl.className = 'game-entry-duration';
                            durationEl.textContent = game.timelineDisplayString;
                            gameEntryDiv.appendChild(durationEl);
                        }
                        tooltipText = `${game.englishTitle}\n${game.timelineDisplayString}`;
                        if (period.label) tooltipText += `\n(${period.label})`;


                    } else if (entryHeight < (pixelsPerMonthVertical * 0.8) && !isSpecialGame) {
                         titleEl.style.display = 'none';
                    }
                } else {
                    // For subsequent blocks, maybe a smaller label or just rely on tooltip
                    if (period.label && entryHeight >= (pixelsPerMonthVertical * 0.5) ) { // Only if block is reasonably tall
                        const periodLabelEl = document.createElement('div');
                        periodLabelEl.className = 'game-entry-period-label'; // New class for styling these
                        periodLabelEl.textContent = period.label;
                        // Style this to be less prominent than the main title/duration
                        Object.assign(periodLabelEl.style, {
                            fontSize: '0.8em',
                            opacity: 0.85,
                            paddingTop: '3px', // Adjust as needed
                        });
                        gameEntryDiv.appendChild(periodLabelEl);
                    }
                     if (period.label) tooltipText = `${game.englishTitle} - ${period.label}`;
                     else tooltipText = game.englishTitle;
                }

                gameEntryDiv.setAttribute('title', tooltipText);
                targetColumn.appendChild(gameEntryDiv);
            });
        });
    }

    initializeTimeline();
});
