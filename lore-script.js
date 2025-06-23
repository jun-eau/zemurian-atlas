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

        // Ensure timeline starts no earlier than S1202, January
        const timelineStartYearCap = 1202;
        if (paddedMinYear < timelineStartYearCap) {
            paddedMinYear = timelineStartYearCap;
            paddedMinMonth = 1; // Start from January of the cap year
        } else if (paddedMinYear === timelineStartYearCap && paddedMinMonth < 1) {
            // This case should ideally not be hit if logic is sound, but as a safeguard
            paddedMinMonth = 1;
        }
        minDate = { year: paddedMinYear, month: paddedMinMonth };

        let paddedMaxMonth = maxDate.month + 3;
        let paddedMaxYear = maxDate.year;
        if (paddedMaxMonth > 12) { paddedMaxMonth -= 12; paddedMaxYear++; }
        maxDate = { year: paddedMaxYear, month: paddedMaxMonth };
        console.log("Timeline Range (Padded & Capped):", minDate, "to", maxDate);
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
                const yearLabel = document.createElement('div');
                yearLabel.classList.add('year-label');
                yearLabel.textContent = `S${currentYear}`;
                yearLabel.style.top = `${yOffset - (firstYearRendered ? 0 : 8)}px`;
                timeAxisContainer.appendChild(yearLabel);
                firstYearRendered = false;
            }

            // Only render month label if it's one of the designated labeledMonths AND it's not January
            if (labeledMonths.includes(currentMonth - 1) && monthNames[currentMonth - 1] !== "Jan") {
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('month-label');
                monthLabel.textContent = monthNames[currentMonth - 1];
                monthLabel.style.top = `${yOffset}px`;
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

    function formatDisplayDate(parsedDate) {
        if (!parsedDate) return "N/A";
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[parsedDate.month - 1];
        return parsedDate.day ? `${monthName} ${parsedDate.day}${getDayOrdinal(parsedDate.day)}, S${parsedDate.year}` : `${monthName} S${parsedDate.year}`;
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
            const startTotalMonths = dateToTotalMonths(startDate), minTotalMonths = dateToTotalMonths(minDate);
            const topPosition = (startTotalMonths - minTotalMonths) * pixelsPerMonthVertical;
            const durationInMonths = (dateToTotalMonths(endDate) - startTotalMonths + 1);
            const entryHeight = durationInMonths * pixelsPerMonthVertical;

            if (topPosition < 0 || entryHeight <= 0) {
                console.warn(`Invalid dimensions for ${game.englishTitle}. Top: ${topPosition}, Height: ${entryHeight}. Skipping.`);
                return;
            }

            const gameEntryDiv = document.createElement('div');
            gameEntryDiv.className = 'game-entry-box'; // Use className for single class, or classList.add for multiple
            Object.assign(gameEntryDiv.style, {
                top: `${topPosition}px`, height: `${entryHeight}px`,
                backgroundColor: game.timelineColor, color: getTextColorForBackground(game.timelineColor),
                width: '90%', left: '5%'
            });

            const titleEl = document.createElement('div');
            titleEl.className = 'game-entry-title';
            titleEl.textContent = game.englishTitle;
            gameEntryDiv.appendChild(titleEl);

            const durationStr = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
            if (entryHeight >= (pixelsPerMonthVertical * 1.8)) {
                const durationEl = document.createElement('div');
                durationEl.className = 'game-entry-duration';
                durationEl.textContent = durationStr;
                gameEntryDiv.appendChild(durationEl);
            } else if (entryHeight < (pixelsPerMonthVertical * 0.8)) {
                titleEl.style.display = 'none'; 
            }
            
            gameEntryDiv.setAttribute('title', `${game.englishTitle}\n${durationStr}`);
            targetColumn.appendChild(gameEntryDiv);
        });
    }

    initializeTimeline();
});
