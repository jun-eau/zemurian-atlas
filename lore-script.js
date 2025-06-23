document.addEventListener('DOMContentLoaded', () => {
    const pixelsPerMonthVertical = 22; // Adjusted for better density
    let allGames = [];
    let minDate, maxDate;

    // --- DOM Elements ---
    const colorKeyContainer = document.getElementById('game-color-key-container');
    const timeAxisContainer = document.getElementById('time-axis-container');
    const gameColumnsContainer = document.getElementById('game-columns-container');
    const liberlColumn = document.getElementById('liberl-arc-column').querySelector('.game-entries-area');
    const crossbellColumn = document.getElementById('crossbell-arc-column').querySelector('.game-entries-area');
    const ereboniaColumn = document.getElementById('erebonia-arc-column').querySelector('.game-entries-area');

    // Month lines overlay will be created and appended to gameColumnsContainer
    let monthLinesOverlay;

    // --- Utility Functions ---
    /**
     * Parses a timeline date string (YYYY-MM-DD or YYYY-MM) into year and month.
     * Month is 1-indexed (January = 1).
     * Returns null if date string is invalid.
     */
    function parseTimelineDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            console.warn(`Invalid date string encountered: ${dateStr}`);
            return null;
        }
        // Day is parts[2], but not strictly needed for month-based calculations yet
        return { year, month, day: parts[2] ? parseInt(parts[2], 10) : undefined };
    }

    /**
     * Converts a parsed date {year, month} to a total number of months from an epoch.
     * This helps in calculating durations and positions.
     */
    function dateToTotalMonths(parsedDate) {
        if (!parsedDate) return Infinity; // For sorting/min-max
        return parsedDate.year * 12 + parsedDate.month;
    }

    // --- Main Initialization ---
    async function initializeTimeline() {
        try {
            const response = await fetch('games.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rawGames = await response.json();

            allGames = processGameData(rawGames);
            if (allGames.length === 0) {
                console.warn("No valid game data to display on the timeline.");
                // Optionally, display a message to the user in the UI
                return;
            }

            calculateDateRange();
            if (!minDate || !maxDate) {
                console.error("Date range not calculated, cannot render timeline.");
                return;
            }
            renderTimeAxis();
            renderColorKey();
            renderGameEntries();

        } catch (error) {
            console.error("Error initializing timeline:", error);
            // Optionally, display an error message to the user in the UI
        }
    }

    /**
     * Processes raw game data: validates, parses dates, and filters out invalid entries.
     */
    function processGameData(rawGames) {
        return rawGames.map(game => {
            const timelineStart = parseTimelineDate(game.timelineStart);
            const timelineEnd = parseTimelineDate(game.timelineEnd);

            if (!timelineStart || !timelineEnd) {
                console.warn(`Skipping game due to invalid start/end date: ${game.englishTitle}`);
                return null;
            }

            if (dateToTotalMonths(timelineStart) > dateToTotalMonths(timelineEnd)) {
                console.warn(`Skipping game due to start date being after end date: ${game.englishTitle}`);
                return null;
            }

            // Basic validation for color
            let timelineColor = game.timelineColor;
            if (!timelineColor || !/^#[0-9A-F]{6}$/i.test(timelineColor)) {
                console.warn(`Invalid or missing timelineColor for ${game.englishTitle}. Using default.`);
                timelineColor = '#808080'; // Default gray color
            }

            return {
                ...game,
                timelineStartParsed: timelineStart,
                timelineEndParsed: timelineEnd,
                timelineColor: timelineColor // Ensure valid or default color is used
            };
        }).filter(game => game !== null); // Remove null entries
    }

    /**
     * Calculates the minimum and maximum year/month across all valid games.
     */
    function calculateDateRange() {
        if (allGames.length === 0) return;

        let minMonths = Infinity;
        let maxMonths = -Infinity;

        allGames.forEach(game => {
            minMonths = Math.min(minMonths, dateToTotalMonths(game.timelineStartParsed));
            maxMonths = Math.max(maxMonths, dateToTotalMonths(game.timelineEndParsed));
        });

        minDate = {
            year: Math.floor((minMonths -1) / 12), // -1 because months are 1-indexed
            month: (minMonths -1) % 12 + 1
        };
        maxDate = {
            year: Math.floor((maxMonths -1) / 12),
            month: (maxMonths -1) % 12 + 1
        };

        // Add some padding to the timeline (e.g., a few months before the first game and after the last)
        // For minDate, go back a few months, handling year change
        let paddedMinMonth = minDate.month - 3;
        let paddedMinYear = minDate.year;
        if (paddedMinMonth <= 0) {
            paddedMinMonth += 12;
            paddedMinYear--;
        }
        minDate = { year: paddedMinYear, month: paddedMinMonth };

        // For maxDate, go forward a few months, handling year change
        let paddedMaxMonth = maxDate.month + 3;
        let paddedMaxYear = maxDate.year;
        if (paddedMaxMonth > 12) {
            paddedMaxMonth -= 12;
            paddedMaxYear++;
        }
        maxDate = { year: paddedMaxYear, month: paddedMaxMonth };

        console.log("Timeline Range (Padded):", minDate, "to", maxDate);
    }

    /**
     * Renders the time axis with years, specific month labels, and horizontal month lines.
     */
    function renderTimeAxis() {
        if (!minDate || !maxDate || !timeAxisContainer || !gameColumnsContainer) return;

        timeAxisContainer.innerHTML = ''; // Clear previous labels

        // Create and append the month lines overlay to gameColumnsContainer
        // This ensures it's properly positioned relative to the game columns
        if (monthLinesOverlay) monthLinesOverlay.remove(); // Remove if already exists
        monthLinesOverlay = document.createElement('div');
        monthLinesOverlay.id = 'month-lines-overlay';
        gameColumnsContainer.insertBefore(monthLinesOverlay, gameColumnsContainer.firstChild); // Insert as first child

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const labeledMonths = [0, 3, 6, 9]; // January, April, July, October (0-indexed)

        let currentYear = minDate.year;
        let currentMonth = minDate.month; // 1-indexed
        let yOffset = 0;

        let firstYearRendered = true; // To control top padding for the first year

        while (currentYear < maxDate.year || (currentYear === maxDate.year && currentMonth <= maxDate.month)) {
            // Render Year Label at the start of each year (or first month displayed)
            if (currentMonth === 1 || firstYearRendered) {
                const yearLabel = document.createElement('div');
                yearLabel.classList.add('year-label');
                yearLabel.textContent = `S${currentYear}`;
                yearLabel.style.top = `${yOffset - (firstYearRendered ? 0 : 8)}px`; // Adjust position slightly
                timeAxisContainer.appendChild(yearLabel);
                firstYearRendered = false;
            }

            // Render Labeled Month Indicators (Jan, Apr, Jul, Oct)
            if (labeledMonths.includes(currentMonth - 1)) {
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('month-label');
                monthLabel.textContent = monthNames[currentMonth - 1];
                monthLabel.style.top = `${yOffset}px`;
                timeAxisContainer.appendChild(monthLabel);
            }

            // Draw horizontal line for EVERY month across game columns area
            const monthLine = document.createElement('div');
            monthLine.classList.add('month-line');
            monthLine.style.top = `${yOffset}px`;
            monthLinesOverlay.appendChild(monthLine);

            yOffset += pixelsPerMonthVertical;

            // Increment month/year
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
                firstYearRendered = true; // Reset for next year's label positioning
            }
        }

        // Set the total height for containers that need it
        const totalTimelineHeight = yOffset;
        timeAxisContainer.style.height = `${totalTimelineHeight}px`;
        liberlColumn.style.height = `${totalTimelineHeight}px`;
        crossbellColumn.style.height = `${totalTimelineHeight}px`;
        ereboniaColumn.style.height = `${totalTimelineHeight}px`;
        monthLinesOverlay.style.height = `${totalTimelineHeight}px`; // Ensure overlay covers the full height
        // gameColumnsContainer will naturally take this height due to its children.
    }

    /**
     * Renders the game color key.
     */
    function renderColorKey() {
        if (!allGames || allGames.length === 0 || !colorKeyContainer) return;

        colorKeyContainer.innerHTML = ''; // Clear previous key items

        // Use a Set to only add unique game titles (or series if preferred) to the key.
        // For this implementation, we'll list each game that has timeline data.
        // Consider grouping by series or a more compact representation if the list becomes too long.

        const uniqueGamesForKey = [];
        const titlesForKey = new Set();

        allGames.forEach(game => {
            // For simplicity, using englishTitle. Could be adapted for series name if available.
            if (!titlesForKey.has(game.englishTitle)) {
                uniqueGamesForKey.push({
                    title: game.englishTitle, // Or a shorter version / series name
                    color: game.timelineColor
                });
                titlesForKey.add(game.englishTitle);
            }
        });

        // Sort games for the key, e.g., alphabetically by title
        uniqueGamesForKey.sort((a, b) => a.title.localeCompare(b.title));

        uniqueGamesForKey.forEach(item => {
            const keyItemDiv = document.createElement('div');
            keyItemDiv.classList.add('color-key-item');

            const swatchDiv = document.createElement('div');
            swatchDiv.classList.add('color-key-swatch');
            swatchDiv.style.backgroundColor = item.color;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = item.title;

            keyItemDiv.appendChild(swatchDiv);
            keyItemDiv.appendChild(titleSpan);
            colorKeyContainer.appendChild(keyItemDiv);
        });
    }

    /**
     * Helper to get ordinal suffix for a day number.
     */
    function getDayOrdinal(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }

    /**
     * Formats a parsed date object for display.
     * Example: "April 15th, S1206" or "January S1202".
     */
    function formatDisplayDate(parsedDate) {
        if (!parsedDate) return "N/A";
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[parsedDate.month - 1];

        if (parsedDate.day) {
            return `${monthName} ${parsedDate.day}${getDayOrdinal(parsedDate.day)}, S${parsedDate.year}`;
        } else {
            return `${monthName} S${parsedDate.year}`;
        }
    }

    /**
     * Determines if a text color should be light or dark based on background color.
     * Returns '#FFFFFF' (white) for dark backgrounds, '#000000' (black) for light backgrounds.
     */
    function getTextColorForBackground(hexColor) {
        if (!hexColor) return '#FFFFFF'; // Default to white if color is invalid
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        // Standard luminance calculation
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }


    /**
     * Renders all game entries onto the timeline.
     */
    function renderGameEntries() {
        if (!allGames || allGames.length === 0 || !minDate) {
            console.warn("Cannot render game entries: missing game data or minDate.");
            return;
        }

        // Clear previous entries
        liberlColumn.innerHTML = '';
        crossbellColumn.innerHTML = '';
        ereboniaColumn.innerHTML = '';

        allGames.forEach(game => {
            let targetColumn;
            if (game.arc === "Liberl Arc") {
                targetColumn = liberlColumn;
            } else if (game.arc === "Crossbell Arc") {
                targetColumn = crossbellColumn;
            } else if (game.arc === "Erebonia Arc" || game.englishTitle === "Trails into Reverie") { // "Trails into Reverie" is Epilogue but goes to Erebonia
                targetColumn = ereboniaColumn;
            } else {
                console.warn(`Game "${game.englishTitle}" has unassigned arc "${game.arc}". Skipping.`);
                return; // Skip games not fitting into defined columns
            }

            const startDate = game.timelineStartParsed;
            const endDate = game.timelineEndParsed;

            // Calculate top position: (game's start month - timeline's min month) * pixelsPerMonth
            // Ensure year differences are accounted for.
            const startTotalMonths = dateToTotalMonths(startDate);
            const minTotalMonths = dateToTotalMonths(minDate);
            const topPosition = (startTotalMonths - minTotalMonths) * pixelsPerMonthVertical;

            // Calculate height: (game's end month - game's start month + 1 for inclusivity) * pixelsPerMonth
            const endTotalMonths = dateToTotalMonths(endDate);
            // Add 1 to endTotalMonths because the duration includes the end month.
            // E.g., Jan to Jan is 1 month duration. (1-1)*X = 0. (1-1+1)*X = X.
            const durationInMonths = (endTotalMonths - startTotalMonths + 1);
            const entryHeight = durationInMonths * pixelsPerMonthVertical;

            if (topPosition < 0 || entryHeight <= 0) {
                console.warn(`Calculated invalid dimensions for ${game.englishTitle}. Top: ${topPosition}, Height: ${entryHeight}. Skipping.`);
                return;
            }

            const gameEntryDiv = document.createElement('div');
            gameEntryDiv.classList.add('game-entry-box');
            gameEntryDiv.style.top = `${topPosition}px`;
            gameEntryDiv.style.height = `${entryHeight}px`;
            gameEntryDiv.style.backgroundColor = game.timelineColor;
            gameEntryDiv.style.width = '90%'; // As per requirement for large percentage width
            gameEntryDiv.style.left = '5%';   // Center it (100% - 90% = 10% / 2 = 5%)

            // Determine text color based on background
            const textColor = getTextColorForBackground(game.timelineColor);
            gameEntryDiv.style.color = textColor;

            const titleEl = document.createElement('div');
            titleEl.classList.add('game-entry-title');
            titleEl.textContent = game.englishTitle;

            const durationStr = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
            const durationEl = document.createElement('div');
            durationEl.classList.add('game-entry-duration');
            durationEl.textContent = durationStr;

            gameEntryDiv.appendChild(titleEl);

            // Prioritize title if box is too short
            // This is a rough check; more sophisticated checks might be needed for perfect text fitting.
            // A common heuristic is to check if height is less than some multiple of line height.
            // Assuming ~18px per line for title and ~16px for duration.
            if (entryHeight >= (pixelsPerMonthVertical * 1.8)) { // Enough space for at least title and part of duration
                 gameEntryDiv.appendChild(durationEl);
            } else if (entryHeight < (pixelsPerMonthVertical * 0.8)) { // Very short, hide title too to prevent overflow
                titleEl.style.display = 'none';
            }


            // Tooltip for full info
            const tooltipText = `${game.englishTitle}\n${durationStr}`;
            gameEntryDiv.setAttribute('title', tooltipText);

            targetColumn.appendChild(gameEntryDiv);
        });
    }


    initializeTimeline();
});
