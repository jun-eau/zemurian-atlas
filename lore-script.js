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
            renderColorKey();
            renderGameEntries();

        } catch (error) {
            console.error("Error initializing timeline:", error);
        }
    }

    function processGameData(rawGames) {
        return rawGames.map(game => {
            const timelineStart = parseTimelineDate(game.timelineStart);
            const timelineEnd = parseTimelineDate(game.timelineEnd);

            if (!timelineStart || !timelineEnd) {
                console.warn(`Skipping game due to invalid start/end date: ${game.englishTitle}`);
                return null;
            }
            if (dateToTotalMonths(timelineStart) > dateToTotalMonths(timelineEnd)) {
                console.warn(`Skipping game due to start date after end date: ${game.englishTitle}`);
                return null;
            }
            
            let timelineColor = game.timelineColor;
            if (!timelineColor || !/^#[0-9A-F]{6}$/i.test(timelineColor)) {
                console.warn(`Invalid or missing timelineColor for ${game.englishTitle}. Using default.`);
                timelineColor = '#808080'; // Default gray
            }

            return { ...game, timelineStartParsed: timelineStart, timelineEndParsed: timelineEnd, timelineColor };
        }).filter(game => game !== null);
    }

    function calculateDateRange() {
        if (allGames.length === 0) return;
        let minMonths = Infinity, maxMonths = -Infinity;
        allGames.forEach(game => {
            minMonths = Math.min(minMonths, dateToTotalMonths(game.timelineStartParsed));
            maxMonths = Math.max(maxMonths, dateToTotalMonths(game.timelineEndParsed));
        });
        
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

    function renderColorKey() {
        if (!allGames || allGames.length === 0 || !colorKeyContainer) return;
        colorKeyContainer.innerHTML = '';
        const uniqueGamesForKey = [], titlesForKey = new Set();
        allGames.forEach(game => {
            if (!titlesForKey.has(game.englishTitle)) {
                uniqueGamesForKey.push({ title: game.englishTitle, color: game.timelineColor });
                titlesForKey.add(game.englishTitle);
            }
        });
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
            if (game.arc === "Liberl Arc" || game.arc === "Crossbell Arc") {
                // This rule might be too broad if some Liberl/Crossbell dates *should* show days.
                // Assuming this override is for the main start/end of the game block.
                // If this date is part of a game's general timelineStartParsed or timelineEndParsed, hide day.
                if (JSON.stringify(parsedDate) === JSON.stringify(game.timelineStartParsed) ||
                    JSON.stringify(parsedDate) === JSON.stringify(game.timelineEndParsed)) {
                    displayDay = undefined;
                }
            }

            // Specific formatting for the start date of Trails of Cold Steel
            if (game.englishTitle === "Trails of Cold Steel" &&
                parsedDate.year === 1204 && parsedDate.month === 3 && parsedDate.day === 1 &&
                JSON.stringify(parsedDate) === JSON.stringify(game.timelineStartParsed)) {
                displayDay = undefined; // Display as "March S1204"
            }
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

        allGames.forEach(game => {
            let targetColumn;
            if (game.arc === "Liberl Arc") targetColumn = liberlColumn;
            else if (game.arc === "Crossbell Arc") targetColumn = crossbellColumn;
            else if (game.arc === "Erebonia Arc" || game.englishTitle === "Trails into Reverie") targetColumn = ereboniaColumn;
            else { console.warn(`Game "${game.englishTitle}" arc "${game.arc}" unassigned. Skipping.`); return; }

            if (!targetColumn) { // Should not happen if columns exist, but good check
                console.warn(`Target column not found for game "${game.englishTitle}". Skipping.`);
                return;
            }

            const startDate = game.timelineStartParsed, endDate = game.timelineEndParsed;
            const minTotalMonths = dateToTotalMonths(minDate);

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
                // Game starts and ends within the same month
                const daysInMonth = getDaysInMonth(startYear, startMonth);
                const daySpan = (endDay ? endDay : daysInMonth) - (startDay ? startDay : 1) + 1;
                entryHeight = (daySpan / daysInMonth) * pixelsPerMonthVertical;
            } else {
                // Game spans multiple months
                let startMonthCoverage = 1.0; // Assume full month if no day
                if (startDay) {
                    const daysInStartMonth = getDaysInMonth(startYear, startMonth);
                    startMonthCoverage = (daysInStartMonth - startDay + 1) / daysInStartMonth;
                }

                let endMonthCoverage = 1.0; // Assume full month if no day
                if (endDay) {
                    const daysInEndMonth = getDaysInMonth(endYear, endMonth);
                    endMonthCoverage = endDay / daysInEndMonth;
                }

                const startTotalMonthsValue = startYear * 12 + startMonth;
                const endTotalMonthsValue = endYear * 12 + endMonth;

                let numberOfFullMiddleMonths = (endTotalMonthsValue - startTotalMonthsValue - 1);
                numberOfFullMiddleMonths = Math.max(0, numberOfFullMiddleMonths); // Ensure it's not negative

                const fractionalMonths = startMonthCoverage + endMonthCoverage + numberOfFullMiddleMonths;
                entryHeight = fractionalMonths * pixelsPerMonthVertical;
            }

            // Ensure height is at least a small visible amount if it's very short, e.g. 1-day event
            // entryHeight = Math.max(entryHeight, pixelsPerMonthVertical * 0.1); // Min height of 10% of a month row

            if (entryHeight <= 0) { // topPosition can be negative if it starts before timeline minDate (padded)
                console.warn(`Invalid height for ${game.englishTitle}. Calculated Height: ${entryHeight}. Skipping.`);
                return;
            }

            const gameEntryDiv = document.createElement('div');
            gameEntryDiv.className = 'game-entry-box'; // Use className for single class, or classList.add for multiple

            // Apply special class for specific games
            const specialGames = ["Trails in the Sky the 3rd", "Trails of Cold Steel IV", "Trails into Reverie"];
            if (specialGames.includes(game.englishTitle)) {
                gameEntryDiv.classList.add('special-info-below');
            }

            Object.assign(gameEntryDiv.style, {
                top: `${topPosition - 1}px`, height: `${entryHeight}px`,
                backgroundColor: game.timelineColor, color: getTextColorForBackground(game.timelineColor),
                width: '90%', left: '5%'
            });

            const titleEl = document.createElement('div');
            titleEl.className = 'game-entry-title';
            titleEl.textContent = game.englishTitle;
            gameEntryDiv.appendChild(titleEl);

            let durationStr;
            if (game.englishTitle === "Trails in the Sky the 3rd") {
                // For "Trails in the Sky the 3rd", display only its single month/year.
                // formatDisplayDate will correctly format this as "Month SYYYY".
                // This assumes its timelineStartParsed accurately represents this single period.
                durationStr = formatDisplayDate(game.timelineStartParsed, game);
            } else {
                // For all other games, display the range.
                durationStr = `${formatDisplayDate(game.timelineStartParsed, game)} - ${formatDisplayDate(game.timelineEndParsed, game)}`;
            }

            const isSpecialGame = gameEntryDiv.classList.contains('special-info-below');

            if (isSpecialGame || entryHeight >= (pixelsPerMonthVertical * 1.8)) {
                const durationEl = document.createElement('div');
                durationEl.className = 'game-entry-duration';
                durationEl.textContent = durationStr;
                gameEntryDiv.appendChild(durationEl);
            } else if (!isSpecialGame && entryHeight < (pixelsPerMonthVertical * 0.8)) {
                // Hide title only for non-special, very short entries
                titleEl.style.display = 'none'; 
            }
            
            gameEntryDiv.setAttribute('title', `${game.englishTitle}\n${durationStr}`);
            targetColumn.appendChild(gameEntryDiv);
        });
    }

    initializeTimeline();
});
