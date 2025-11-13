export function initTimelinePage() {
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

    // --- Initialization ---
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

    // --- Data Processing ---
    function processGameData(rawGames) {
        return rawGames.map(game => {
            if (!game.timelinePeriods || !Array.isArray(game.timelinePeriods)) {
                return { ...game };
            }

            let parsedPeriods = game.timelinePeriods.map(period => {
                const periodStart = parseTimelineDate(period.start);
                const periodEnd = parseTimelineDate(period.end);

                if (!periodStart || !periodEnd || dateToTotalMonths(periodStart) > dateToTotalMonths(periodEnd) || typeof period.display !== 'string') {
                    console.warn(`Invalid period data for ${game.englishTitle}. Skipping period.`);
                    return null;
                }
                return { ...period, startParsed: periodStart, endParsed: periodEnd };
            }).filter(p => p !== null);

            if (game.timelinePeriods.length > 0 && parsedPeriods.length === 0) {
                console.warn(`All timeline periods for ${game.englishTitle} were invalid.`);
            }
            
            let timelineColor = game.timelineColor;
            if (parsedPeriods.length > 0 && (!timelineColor || !/^#[0-9A-F]{6}$/i.test(timelineColor))) {
                console.warn(`Invalid or missing timelineColor for ${game.englishTitle}. Using default.`);
                timelineColor = '#808080'; // Default gray
            }

            return { ...game, timelinePeriodsParsed: parsedPeriods, timelineColor };
        }).filter(game => game !== null);
    }

    // --- Date Range Calculation ---
    function calculateDateRange() {
        const gamesWithTimeline = allGames.filter(game => game.timelinePeriodsParsed && game.timelinePeriodsParsed.length > 0);
        if (gamesWithTimeline.length === 0) {
            minDate = null;
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
        
        if (minMonths === Infinity) {
            minDate = null;
            maxDate = null;
            return;
        }

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
    }

    // --- Rendering Functions ---
    function renderTimeAxis() {
        if (!minDate || !maxDate || !timeAxisContainer || !gameColumnsContainer) return;
        timeAxisContainer.innerHTML = ''; 
        
        if (monthLinesOverlay) monthLinesOverlay.remove();
        monthLinesOverlay = document.createElement('div');
        monthLinesOverlay.id = 'month-lines-overlay';
        gameColumnsContainer.insertBefore(monthLinesOverlay, gameColumnsContainer.firstChild);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const labeledMonths = [2, 5, 8];

        let currentYear = minDate.year, currentMonth = minDate.month, yOffset = 0;
        let firstYearRendered = true;

        while (currentYear < maxDate.year || (currentYear === maxDate.year && currentMonth <= maxDate.month)) {
            if (currentMonth === 1 || firstYearRendered) {
                if (currentYear !== 1201) {
                    const yearLabel = document.createElement('div');
                    yearLabel.classList.add('year-label');
                    yearLabel.textContent = `S${currentYear}`;
                    yearLabel.style.top = `${yOffset - (firstYearRendered ? 0 : 8) - (0.5 * pixelsPerMonthVertical)}px`;
                    timeAxisContainer.appendChild(yearLabel);
                }
                firstYearRendered = false;
            }

            if (labeledMonths.includes(currentMonth - 1)) {
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('month-label');
                monthLabel.textContent = monthNames[currentMonth - 1];
                monthLabel.style.top = `${yOffset}px`;
                timeAxisContainer.appendChild(monthLabel);
            }
            
            const monthLine = document.createElement('div');
            monthLine.classList.add('month-line');
            if (currentMonth === 1) monthLine.classList.add('month-line-year');
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

    /**
     * Calculates the precise vertical position and height for a timeline entry.
     */
    function calculatePeriodGeometry(period, minTotalMonths) {
        const { startParsed: startDate, endParsed: endDate } = period;

        // --- Calculate topPosition with day precision ---
        let topPosition = ((dateToTotalMonths(startDate) - minTotalMonths) * pixelsPerMonthVertical) - (2.5 * pixelsPerMonthVertical);
        if (startDate.day) {
            const daysInStartMonth = getDaysInMonth(startDate.year, startDate.month);
            topPosition += ((startDate.day - 1) / daysInStartMonth) * pixelsPerMonthVertical;
        }

        // --- Calculate entryHeight with day precision ---
        let entryHeight;
        if (startDate.year === endDate.year && startDate.month === endDate.month) {
            const daysInMonth = getDaysInMonth(startDate.year, startDate.month);
            const daySpan = (endDate.day || daysInMonth) - (startDate.day || 1) + 1;
            entryHeight = (daySpan / daysInMonth) * pixelsPerMonthVertical;
        } else {
            const startDayCoverage = startDate.day ? (getDaysInMonth(startDate.year, startDate.month) - startDate.day + 1) / getDaysInMonth(startDate.year, startDate.month) : 1.0;
            const endDayCoverage = endDate.day ? endDate.day / getDaysInMonth(endDate.year, endDate.month) : 1.0;
            const fullMonths = Math.max(0, (dateToTotalMonths(endDate) - dateToTotalMonths(startDate) - 1));
            const fractionalMonths = startDayCoverage + endDayCoverage + fullMonths;
            entryHeight = fractionalMonths * pixelsPerMonthVertical;
        }

        entryHeight = Math.max(entryHeight, Math.max(1, pixelsPerMonthVertical / 30)); // Ensure a minimum height

        return { topPosition, entryHeight };
    }

    function renderGameEntries() {
        if (!allGames || allGames.length === 0 || !minDate) return;
        [liberlColumn, crossbellColumn, ereboniaColumn, calvardColumn].forEach(col => { if (col) col.innerHTML = ''; });

        const minTotalMonths = dateToTotalMonths(minDate);
        const columnMap = {
            "Liberl Arc": liberlColumn,
            "Crossbell Arc": crossbellColumn,
            "Erebonia Arc": ereboniaColumn,
            "Calvard Arc": calvardColumn,
            "Epilogue": ereboniaColumn // Reverie is in the Erebonia column
        };

        allGames.forEach(game => {
            if (!game.timelinePeriodsParsed || game.timelinePeriodsParsed.length === 0) return;

            const targetColumn = columnMap[game.arc];
            if (!targetColumn) {
                console.warn(`No column for arc: ${game.arc}`);
                return;
            }

            let lastPeriodBottom = 0;

            game.timelinePeriodsParsed.forEach((period, periodIndex) => {
                const { topPosition, entryHeight } = calculatePeriodGeometry(period, minTotalMonths);
                if (entryHeight <= 0) return;

                const gameEntryDiv = createGameEntryBox(game, period, topPosition, entryHeight);
                targetColumn.appendChild(gameEntryDiv);

                const settings = game.timelineSettings || {};

                if (settings.displayMode === 'below') {
                    gameEntryDiv.classList.add('special-info-below');

                    // For multi-period games, each period gets its own text below.
                    // For single-period games (like CSIV), the text is positioned after all boxes are rendered.
                    if (game.timelinePeriodsParsed.length > 1) {
                         const periodText = createBelowText(game, period, topPosition, entryHeight);
                         targetColumn.appendChild(periodText);
                    }
                } else {
                    // Render text inside the box only for the first period
                    if (periodIndex === 0) {
                        populateBoxWithText(gameEntryDiv, game, period, entryHeight);
                    }
                }

                lastPeriodBottom = Math.max(lastPeriodBottom, topPosition + entryHeight);
            });

            // Special handling for single-period "below" display games (e.g., CSIV)
            if (game.timelineSettings?.displayMode === 'below' && game.timelinePeriodsParsed.length === 1) {
                const textContainer = createBelowText(game, game.timelinePeriodsParsed[0], lastPeriodBottom, 0, true);
                targetColumn.appendChild(textContainer);
            }
        });
    }

    function createGameEntryBox(game, period, topPosition, entryHeight) {
        const gameEntryDiv = document.createElement('div');
        gameEntryDiv.className = 'game-entry-box';
        gameEntryDiv.style.backgroundColor = game.timelineColor;

        const textColor = game.timelineSettings?.textColor || '#FFFFFF'; // Default to white
        gameEntryDiv.style.color = textColor;

        gameEntryDiv.style.top = `${topPosition + 2}px`;
        gameEntryDiv.style.height = `${entryHeight}px`;
        gameEntryDiv.style.width = '90%';
        gameEntryDiv.style.left = '5%';
        gameEntryDiv.dataset.gameTitle = game.englishTitle;

        return gameEntryDiv;
    }

    function populateBoxWithText(box, game, period, entryHeight) {
        const titleEl = document.createElement('div');
        titleEl.className = 'game-entry-title';
        titleEl.textContent = game.englishTitle;
        box.appendChild(titleEl);

        const dateDisplayEl = document.createElement('div');
        dateDisplayEl.className = 'game-entry-duration';
        dateDisplayEl.textContent = period.display;
        box.appendChild(dateDisplayEl);

        // Hide text if the box is too small
        if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
            titleEl.style.display = 'none';
            dateDisplayEl.style.display = 'none';
        } else if (entryHeight < (pixelsPerMonthVertical * 1.8)) {
            dateDisplayEl.style.display = 'none';
        }
    }

    function createBelowText(game, period, topPosition, entryHeight, isGrouped = false) {
        const container = document.createElement('div');
        container.className = 'game-info-below-text-container';

        const textColor = game.timelineSettings?.textColor || '#FFFFFF';
        container.style.color = textColor;

        // Always add title for grouped text or if it's the main period
        if (isGrouped || period.isMain) {
            container.classList.add('is-main-period-text');
            const titleEl = document.createElement('div');
            titleEl.className = 'game-entry-title';
            titleEl.textContent = game.englishTitle;
            container.appendChild(titleEl);
        }

        const detailEl = document.createElement('div');
        detailEl.className = 'game-entry-duration';
        detailEl.innerHTML = period.label ? `<strong>${period.label}:</strong> ${period.display}` : period.display;
        container.appendChild(detailEl);

        const spacing = period.isMain || isGrouped ? 2 : 1;
        container.style.top = `${topPosition + entryHeight + spacing + 3}px`;

        return container;
    }

    initializeTimeline();
}
