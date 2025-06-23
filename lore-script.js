// lore-script.js for the Trails Series Visual Guide Lore Timeline

document.addEventListener('DOMContentLoaded', () => {
    const pixelsPerMonthVertical = 20; // Vertical space for each month slot
    const gameBoxWidthPercent = 90; // Width of game boxes within their column
    const defaultTimelineColor = '#808080'; // Grey color for games with missing/invalid timelineColor

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const axisMonthLabels = { 0: "Jan", 3: "Apr", 6: "Jul", 9: "Oct" }; // Months to label on the axis

    const timeAxisContainer = document.getElementById('time-axis-container');
    const liberlArcEntries = document.getElementById('liberl-arc-entries');
    const crossbellArcEntries = document.getElementById('crossbell-arc-entries');
    const ereboniaArcEntries = document.getElementById('erebonia-arc-entries');
    const gameColorKeyContainer = document.getElementById('game-color-key-container');
    const gameColumnsContainer = document.querySelector('.game-columns-container');


    if (!timeAxisContainer || !liberlArcEntries || !crossbellArcEntries || !ereboniaArcEntries || !gameColorKeyContainer || !gameColumnsContainer) {
        console.error("Essential HTML containers for timeline not found. Aborting script.");
        return;
    }

    async function fetchGameData() {
        try {
            const response = await fetch('games.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch or parse games.json:", error);
            // Display a user-friendly message on the page
            const mainTimelineContainer = document.querySelector('.timeline-container');
            if (mainTimelineContainer) {
                mainTimelineContainer.innerHTML = '<p style="text-align:center; color:var(--accent-gold);">Error loading timeline data. Please try again later.</p>';
            }
            return []; // Return empty array to prevent further errors
        }
    }

    /**
     * Parses a timeline date string (YYYY-MM-DD or YYYY-MM) into an object.
     * Returns null if the format is invalid.
     * Year is prefixed with "S" in the input string internally for consistency (e.g. S1202-01-01).
     * The internal representation of year will be numeric (e.g. 1202).
     */
    function parseTimelineDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;

        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10); // 1-12

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            console.warn(`Invalid date format for: ${dateStr}`);
            return null;
        }

        let day = parts.length > 2 ? parseInt(parts[2], 10) : null;
        if (parts.length > 2 && (isNaN(day) || day < 1 || day > 31)) {
            // Basic day validation, specific month day counts not checked here for simplicity
            // as we mostly care about month-level precision for positioning.
            console.warn(`Invalid day in date: ${dateStr}`);
            day = null; // Treat as month-only if day is invalid
        }

        return { year, month, day }; // month is 1-indexed
    }


    function getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th'; // Covers 4th-20th
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }

    function formatTimelineDate(parsedDate, isEnd = false) {
        if (!parsedDate) return "N/A";
        // For end dates of YYYY-MM, consider it the end of that month.
        // For start dates of YYYY-MM, consider it the start of that month.
        // This detail is mostly for display; calculations use month index.
        let dayPart = "";
        if (parsedDate.day) {
            dayPart = ` ${parsedDate.day}${getOrdinalSuffix(parsedDate.day)},`;
        }
        return `${monthNames[parsedDate.month - 1]}${dayPart} S${parsedDate.year}`;
    }

    // Function to determine text color (black or white) based on background hex color
    function getTextColorForBackground(hexColor) {
        if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
            return '#000000'; // Default to black for invalid colors
        }
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        // Formula for perceived brightness (YIQ)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF'; // Black text on light, White text on dark
    }


    async function initializeTimeline() {
        const games = await fetchGameData();
        if (!games || games.length === 0) {
            console.warn("No game data available to render timeline.");
            // Message already shown by fetchGameData if there was an error
            return;
        }

        const processedGames = [];
        let minYear = Infinity, maxYear = -Infinity;
        let minMonthOverall = Infinity, maxMonthOverall = -Infinity; // 0-11 month index

        games.forEach(game => {
            const start = parseTimelineDate(game.timelineStart);
            const end = parseTimelineDate(game.timelineEnd);

            if (!start || !end) {
                console.warn(`Skipping game "${game.englishTitle}" due to missing or invalid timelineStart/timelineEnd.`);
                return;
            }

            // Validate and prepare game data
            const gameArc = game.arc === "Epilogue" ? "Erebonia Arc" : game.arc; // Map Epilogue to Erebonia

            processedGames.push({
                ...game,
                parsedStart: start,
                parsedEnd: end,
                mappedArc: gameArc,
                timelineColor: (game.timelineColor && /^#[0-9A-F]{6}$/i.test(game.timelineColor)) ? game.timelineColor : defaultTimelineColor,
            });

            if (start.year < minYear) minYear = start.year;
            if (start.year === minYear) minMonthOverall = Math.min(minMonthOverall, start.month -1);

            if (end.year > maxYear) maxYear = end.year;
            if (end.year === maxYear) maxMonthOverall = Math.max(maxMonthOverall, end.month -1);

        });

        // If only one year, ensure min/max month overall cover Jan-Dec for that year if needed.
        // Or if games span part of a year, ensure axis covers Jan-Dec for involved years.
        // For simplicity, we'll ensure the axis always starts from Jan of minYear and ends Dec of maxYear.
        minMonthOverall = 0; // January
        maxMonthOverall = 11; // December


        if (processedGames.length === 0) {
            console.warn("No valid games to display on timeline after processing.");
            // Potentially display a message if all games were filtered out
            return;
        }

        renderTimeAxis(minYear, maxYear, minMonthOverall, maxMonthOverall);
        renderGameColorKey(processedGames);
        renderGameEntries(processedGames, minYear, minMonthOverall);

        // Set total height for game entry areas based on timeline span
        const totalYears = maxYear - minYear + 1;
        // Total months considers full years from minYear Jan to maxYear Dec
        const totalMonthsDuration = (maxYear - minYear) * 12 + (maxMonthOverall - minMonthOverall) + 1;

        const totalTimelineHeight = totalMonthsDuration * pixelsPerMonthVertical;

        // Apply this height to the time axis container and each game entries area
        timeAxisContainer.style.height = `${totalTimelineHeight}px`;
        liberlArcEntries.style.height = `${totalTimelineHeight}px`;
        crossbellArcEntries.style.height = `${totalTimelineHeight}px`;
        ereboniaArcEntries.style.height = `${totalTimelineHeight}px`;
    }

    function renderTimeAxis(minYear, maxYear, minMonthAxis, maxMonthAxis) { // min/maxMonthAxis are 0-11
        timeAxisContainer.innerHTML = ''; // Clear previous content

        let currentTop = 0;

        for (let year = minYear; year <= maxYear; year++) {
            const yearLabelDiv = document.createElement('div');
            yearLabelDiv.classList.add('year-label');
            yearLabelDiv.textContent = `S${year}`;
            // Position first year label slightly offset from the very top if it's Jan
            // Subsequent year labels at the start of their January month line.
            const yearLabelTopPosition = (year - minYear) * 12 * pixelsPerMonthVertical + ( (year === minYear) ? (pixelsPerMonthVertical / 2) : 0 );
            yearLabelDiv.style.top = `${yearLabelTopPosition}px`;
            timeAxisContainer.appendChild(yearLabelDiv);

            for (let month = 0; month < 12; month++) { // 0-11 for month index
                // Calculate position for this month slot
                // currentTop is the top of the current month slot
                currentTop = ((year - minYear) * 12 + month) * pixelsPerMonthVertical;

                // Add month label if it's one of the specified ones (Jan, Apr, Jul, Oct)
                if (axisMonthLabels[month]) {
                    const monthLabelDiv = document.createElement('div');
                    monthLabelDiv.classList.add('month-label');
                    monthLabelDiv.textContent = axisMonthLabels[month];
                    // Position month label in the middle of its slot
                    monthLabelDiv.style.top = `${currentTop + pixelsPerMonthVertical / 2}px`;
                    timeAxisContainer.appendChild(monthLabelDiv);
                }

                // Draw horizontal line for EVERY month, extending across game columns
                const monthLineDiv = document.createElement('div');
                monthLineDiv.classList.add('month-line');
                monthLineDiv.style.top = `${currentTop}px`; // Line at the start of the month slot
                // These lines are added to timeAxisContainer but styled to span across timeline-display-area
                // CSS: left: axis-width, right: 0
                timeAxisContainer.appendChild(monthLineDiv);
            }
        }
        // Add one final line at the very bottom of the timeline (after Dec of maxYear)
        const finalLineTop = ((maxYear - minYear + 1) * 12) * pixelsPerMonthVertical;
        const finalMonthLineDiv = document.createElement('div');
        finalMonthLineDiv.classList.add('month-line');
        finalMonthLineDiv.style.top = `${finalLineTop}px`;
        timeAxisContainer.appendChild(finalMonthLineDiv);

    }

    function renderGameColorKey(games) {
        gameColorKeyContainer.innerHTML = ''; // Clear previous
        const uniqueGamesForKey = [];
        const seenTitles = new Set();

        games.forEach(game => {
            // Use a simplified name for series or just the title if unique enough
            let keyName = game.englishTitle.includes("Trails in the Sky") ? "Trails in the Sky Series" :
                          game.englishTitle.includes("Trails of Cold Steel") ? "Trails of Cold Steel Series" :
                          game.englishTitle;

            // For Cold Steel, group them by a general "Trails of Cold Steel" entry if colors are similar or for simplicity
            // For this implementation, we'll list each game if its color is distinct enough or it's not part of a major series grouping.
            // For simplicity here, we'll use englishTitle if it hasn't been added yet with this color.
            // A more sophisticated approach might group by series if colors are identical.

            if (!seenTitles.has(game.englishTitle)) { // Simple uniqueness, can be enhanced
                 uniqueGamesForKey.push({ name: game.englishTitle, color: game.timelineColor });
                 seenTitles.add(game.englishTitle);
            }
        });

        // Alternative: Group by color to ensure each color swatch is unique
        const colorsMap = new Map();
        games.forEach(game => {
            if (!colorsMap.has(game.timelineColor)) {
                colorsMap.set(game.timelineColor, game.englishTitle); // Store first game title for this color
            }
        });

        gameColorKeyContainer.innerHTML = ''; // Clear again for the map-based approach

        colorsMap.forEach((title, color) => {
            const keyItem = document.createElement('div');
            keyItem.classList.add('color-key-item');

            const swatch = document.createElement('div');
            swatch.classList.add('color-key-swatch');
            swatch.style.backgroundColor = color;

            const label = document.createElement('span');
            label.textContent = title; // Display the representative title

            keyItem.appendChild(swatch);
            keyItem.appendChild(label);
            gameColorKeyContainer.appendChild(keyItem);
        });
    }

    function renderGameEntries(games, overallMinYear, overallMinMonthIndex) { // overallMinMonthIndex is 0-11
        games.forEach(game => {
            const startMonthIndexTotal = (game.parsedStart.year - overallMinYear) * 12 + (game.parsedStart.month - 1 - overallMinMonthIndex);
            // For duration, if end date is YYYY-MM, it means until the end of that month.
            // So, if start is Jan Y1, end is Feb Y1, duration is 2 months.
            // month is 1-indexed from parsedDate
            const endMonthIndexTotal = (game.parsedEnd.year - overallMinYear) * 12 + (game.parsedEnd.month - 1 - overallMinMonthIndex);

            let durationMonths = endMonthIndexTotal - startMonthIndexTotal + 1;
            if (durationMonths <= 0) durationMonths = 1; // Minimum 1 month height visually

            const topPosition = startMonthIndexTotal * pixelsPerMonthVertical;
            const height = durationMonths * pixelsPerMonthVertical;

            const gameBox = document.createElement('div');
            gameBox.classList.add('game-entry-box');
            gameBox.style.backgroundColor = game.timelineColor;
            gameBox.style.color = getTextColorForBackground(game.timelineColor);
            gameBox.style.top = `${topPosition}px`;
            gameBox.style.height = `${height - 2}px`; // -2 for border to fit within slot
            gameBox.style.width = `${gameBoxWidthPercent}%`;
            gameBox.style.left = `${(100 - gameBoxWidthPercent) / 2}%`; // Center it

            const titleEl = document.createElement('div');
            titleEl.classList.add('title');
            titleEl.textContent = game.englishTitle;

            const durationEl = document.createElement('div');
            durationEl.classList.add('duration');
            const startDateFormatted = formatTimelineDate(game.parsedStart);
            const endDateFormatted = formatTimelineDate(game.parsedEnd, true);
            durationEl.textContent = `${startDateFormatted} – ${endDateFormatted}`;

            // Tooltip for full info
            gameBox.setAttribute('title', `${game.englishTitle}\nDuration: ${startDateFormatted} – ${endDateFormatted}`);

            gameBox.appendChild(titleEl);
            // Only add duration if box is tall enough
            if (height > pixelsPerMonthVertical * 1.8) { // Arbitrary threshold: roughly >1.8 months height
                 gameBox.appendChild(durationEl);
            }


            let targetColumn;
            switch (game.mappedArc) {
                case "Liberl Arc":
                    targetColumn = liberlArcEntries;
                    break;
                case "Crossbell Arc":
                    targetColumn = crossbellArcEntries;
                    break;
                case "Erebonia Arc": // This now includes "Epilogue" games mapped to Erebonia
                    targetColumn = ereboniaArcEntries;
                    break;
                default:
                    console.warn(`Game "${game.englishTitle}" has unknown arc "${game.mappedArc}". Skipping.`);
                    return; // Skip this game
            }
            targetColumn.appendChild(gameBox);
        });
    }

    initializeTimeline();
});
