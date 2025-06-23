document.addEventListener('DOMContentLoaded', () => {
    const sharedAxisArea = document.getElementById('shared-timeline-axis');
    const gameColumnsWrapper = document.getElementById('game-columns-wrapper');
    const liberlGamesColumn = document.getElementById('liberl-games-column');
    const crossbellGamesColumn = document.getElementById('crossbell-games-column');
    const ereboniaGamesColumn = document.getElementById('erebonia-games-column');
    const timelineKeyContainer = document.getElementById('lore-timeline-key');
    const gamesJsonPath = 'games.json';

    // --- Configuration ---
    const pixelsPerMonthVertical = 22;
    const axisAreaTopPadding = 25;
    const monthsToShowOnAxis = [1, 4, 7, 10];
    const gameBoxWidthPercentage = 90; // Game boxes will take 90% of their column width

    // --- Helper Functions (mostly same as before) ---
    function parseDate(dateStr) {
        if (!dateStr) return { year: 0, month: 0, day: 0, valid: false };
        const [year, month, day] = dateStr.split('-').map(Number);
        return { year, month, day: day || 1, valid: true };
    }

    function getMonthName(monthNumber) {
        const d = new Date();
        d.setMonth(monthNumber - 1);
        return d.toLocaleString('en-US', { month: 'long' });
    }

    function getDayWithOrdinal(day) {
        if (day > 3 && day < 21) return day + 'th';
        switch (day % 10) {
            case 1: return day + "st";
            case 2: return day + "nd";
            case 3: return day + "rd";
            default: return day + "th";
        }
    }

    function formatGameDateForDisplay(parsedDate, originalDateString) {
        const monthName = getMonthName(parsedDate.month);
        const year = `S${parsedDate.year}`;
        const showDay = originalDateString && originalDateString.length > 7;
        if (showDay && parsedDate.day) {
            return `${monthName} ${getDayWithOrdinal(parsedDate.day)}, ${year}`;
        }
        return `${monthName} ${year}`;
    }

    function determineArcForGame(game) {
        if (game.arc === "Liberl Arc") return "liberl";
        if (game.arc === "Crossbell Arc") return "crossbell";
        if (game.arc === "Erebonia Arc" || game.englishTitle === "Trails into Reverie" ||
            (game.englishTitle && game.englishTitle.startsWith("Trails of Cold Steel"))) {
            return "erebonia";
        }
        return null;
    }

    function getGlobalMonthIndex(pDate) { // Used for vertical positioning
        return pDate.year * 12 + pDate.month;
    }

    async function initUnifiedTimeline() {
        if (!sharedAxisArea || !gameColumnsWrapper || !liberlGamesColumn || !crossbellGamesColumn || !ereboniaGamesColumn) {
            console.error("One or more core timeline layout elements are missing from the DOM.");
            return;
        }
        if (timelineKeyContainer) timelineKeyContainer.innerHTML = '';
        sharedAxisArea.innerHTML = '';
        gameColumnsWrapper.innerHTML = ''; // Clear it before re-adding columns (or just clear columns)
        // Re-add columns to ensure clean state if this function were ever called multiple times.
        // HTML structure already has columns, so just clear their content.
        liberlGamesColumn.innerHTML = '<h2>Liberl Arc</h2>'; // Keep titles
        crossbellGamesColumn.innerHTML = '<h2>Crossbell Arc</h2>';
        ereboniaGamesColumn.innerHTML = '<h2>Erebonia Arc</h2>';


        try {
            const response = await fetch(gamesJsonPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            let allGames = await response.json();

            const processedGames = allGames.map(game => ({
                ...game,
                parsedStart: parseDate(game.timelineStart),
                parsedEnd: parseDate(game.timelineEnd),
                arcKey: determineArcForGame(game)
            })).filter(game => game.arcKey && game.parsedStart.valid && game.parsedEnd.valid);

            if (processedGames.length === 0) {
                gameColumnsWrapper.innerHTML = '<p style="text-align:center; width:100%;">No valid game data to display.</p>';
                return;
            }

            // Sort all games for key generation and to find overall date range
            processedGames.sort((a, b) => getGlobalMonthIndex(a.parsedStart) - getGlobalMonthIndex(b.parsedStart));
            if (timelineKeyContainer) renderGameKey(processedGames, timelineKeyContainer);

            // Determine overall timeline range for the shared axis
            const overallMinDate = processedGames[0].parsedStart;
            const overallMaxDate = processedGames.reduce((latest, game) => {
                return getGlobalMonthIndex(game.parsedEnd) > getGlobalMonthIndex(latest) ? game.parsedEnd : latest;
            }, processedGames[0].parsedEnd);

            const firstYear = overallMinDate.year;
            const lastYear = overallMaxDate.year;

            let runningMonthOffset = 0;
            let lastRenderedYearOnAxis = null;

            // Render Shared Axis and Month Lines
            for (let year = firstYear; year <= lastYear; year++) {
                const startMonthInLoop = (year === firstYear) ? overallMinDate.month : 1;
                const endMonthInLoop = (year === lastYear) ? overallMaxDate.month : 12;

                if (year !== lastRenderedYearOnAxis) {
                    const yearLabelEffectiveYPos = runningMonthOffset * pixelsPerMonthVertical + axisAreaTopPadding;
                    const yearLabel = document.createElement('div');
                    yearLabel.className = 'timeline-year';
                    yearLabel.textContent = `S${year}`;
                    yearLabel.style.top = `${Math.max(axisAreaTopPadding - 10, yearLabelEffectiveYPos - (pixelsPerMonthVertical / 2))}px`;
                    sharedAxisArea.appendChild(yearLabel);
                    lastRenderedYearOnAxis = year;
                }

                for (let month = startMonthInLoop; month <= endMonthInLoop; month++) {
                    const monthYPos = runningMonthOffset * pixelsPerMonthVertical + axisAreaTopPadding;
                    if (monthsToShowOnAxis.includes(month)) {
                        const monthLabel = document.createElement('div');
                        monthLabel.className = 'timeline-month-label';
                        monthLabel.textContent = getMonthName(month).substring(0, 3);
                        monthLabel.style.top = `${monthYPos}px`;
                        sharedAxisArea.appendChild(monthLabel);
                    }
                    // Month lines should span across the gameColumnsWrapper
                    const monthLine = document.createElement('div');
                    monthLine.className = 'timeline-month-line';
                    monthLine.style.top = `${monthYPos}px`;
                    // Prepend month lines to gameColumnsWrapper so game boxes appear on top
                    if (gameColumnsWrapper.firstChild) {
                        gameColumnsWrapper.insertBefore(monthLine, gameColumnsWrapper.firstChild);
                    } else {
                        gameColumnsWrapper.appendChild(monthLine);
                    }
                    runningMonthOffset++;
                }
            }
            const totalTimelineHeight = runningMonthOffset * pixelsPerMonthVertical + axisAreaTopPadding + pixelsPerMonthVertical;
            sharedAxisArea.style.minHeight = `${totalTimelineHeight}px`;
            [liberlGamesColumn, crossbellGamesColumn, ereboniaGamesColumn].forEach(col => col.style.minHeight = `${totalTimelineHeight}px`);


            // Distribute games into their respective columns
            const gamesByArc = { liberl: [], crossbell: [], erebonia: [] };
            processedGames.forEach(game => {
                if (gamesByArc[game.arcKey]) gamesByArc[game.arcKey].push(game);
            });

            // Render game boxes in each column
            for (const arcKey in gamesByArc) {
                const targetColumn = document.getElementById(`${arcKey}-games-column`);
                if (!targetColumn) continue;

                gamesByArc[arcKey].forEach(game => {
                    // Calculate top and height based on the overall timeline's first month (overallMinDate.month in firstYear)
                    let gameStartOffsetMonths = 0; // Offset from the start of the *entire displayed timeline*
                    for(let y = firstYear; y < game.parsedStart.year; y++) {
                        gameStartOffsetMonths += (y === firstYear) ? (12 - overallMinDate.month + 1) : 12;
                    }
                    if (game.parsedStart.year === firstYear) {
                        gameStartOffsetMonths += game.parsedStart.month - overallMinDate.month;
                    } else {
                        gameStartOffsetMonths += game.parsedStart.month -1;
                    }

                    let gameEndOffsetMonths = 0;
                    for(let y = firstYear; y < game.parsedEnd.year; y++) {
                        gameEndOffsetMonths += (y === firstYear) ? (12 - overallMinDate.month + 1) : 12;
                    }
                    if (game.parsedEnd.year === firstYear) {
                        gameEndOffsetMonths += game.parsedEnd.month - overallMinDate.month;
                    } else {
                        gameEndOffsetMonths += game.parsedEnd.month -1;
                    }

                    const top = gameStartOffsetMonths * pixelsPerMonthVertical + axisAreaTopPadding;
                    const durationInDisplayMonths = Math.max(gameEndOffsetMonths - gameStartOffsetMonths + 1, 1);
                    const height = durationInDisplayMonths * pixelsPerMonthVertical - 2; // -2 for small gap

                    const gameDiv = document.createElement('div');
                    gameDiv.className = 'timeline-game-entry';
                    gameDiv.style.backgroundColor = game.timelineColor;
                    gameDiv.style.top = `${top}px`;
                    gameDiv.style.height = `${Math.max(height, pixelsPerMonthVertical * 0.75)}px`;
                    gameDiv.style.width = `${gameBoxWidthPercentage}%`;
                    gameDiv.style.left = `${(100 - gameBoxWidthPercentage) / 2}%`; // Center it

                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'game-title';
                    titleSpan.textContent = game.englishTitle;

                    const datesSpan = document.createElement('span');
                    datesSpan.className = 'game-dates';
                    const startDateStr = formatGameDateForDisplay(game.parsedStart, game.timelineStart);
                    const endDateStr = formatGameDateForDisplay(game.parsedEnd, game.timelineEnd);
                    datesSpan.textContent = `${startDateStr} - ${endDateStr}`;

                    gameDiv.appendChild(titleSpan);
                    if (parseFloat(gameDiv.style.height) > 35) {
                        gameDiv.appendChild(datesSpan);
                    }
                    gameDiv.title = `${game.englishTitle}\n(${startDateStr} - ${endDateStr})`;

                    // Robust color handling
                    if (game.timelineColor && typeof game.timelineColor === 'string' && game.timelineColor.startsWith('#') && game.timelineColor.length === 7) {
                        gameDiv.style.backgroundColor = game.timelineColor;
                        try {
                            const r = parseInt(game.timelineColor.slice(1, 3), 16);
                            const g = parseInt(game.timelineColor.slice(3, 5), 16);
                            const b = parseInt(game.timelineColor.slice(5, 7), 16);
                            // Check if parsing was successful (they are numbers)
                            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                gameDiv.style.color = brightness < 128 ? '#f0f0f0' : '#1a1a1a';
                                if (brightness > 230) gameDiv.style.borderColor = '#555555';
                            } else {
                                // Fallback if hex parsing failed unexpectedly
                                gameDiv.style.color = '#1a1a1a';
                                console.warn(`Failed to parse color components for ${game.englishTitle}: ${game.timelineColor}`);
                            }
                        } catch (e) {
                            console.warn(`Error parsing timelineColor for ${game.englishTitle}: ${game.timelineColor}`, e);
                            gameDiv.style.backgroundColor = '#CCCCCC'; // Default grey
                            gameDiv.style.color = '#1a1a1a';
                        }
                    } else {
                        console.warn(`Missing or invalid timelineColor for ${game.englishTitle}: '${game.timelineColor}'. Defaulting background.`);
                        gameDiv.style.backgroundColor = '#CCCCCC'; // Default grey
                        gameDiv.style.color = '#1a1a1a';
                    }

                    targetColumn.appendChild(gameDiv);
                });
            }

        } catch (error) {
            console.error('Failed to initialize unified timeline:', error);
            if(gameColumnsWrapper) gameColumnsWrapper.innerHTML = `<p style="text-align:center; color:red; width:100%;">Error initializing timeline: ${error.message}</p>`;
        }
    }

    function renderGameKey(games, keyContainer) { // Same as before
        keyContainer.innerHTML = '';
        const uniqueGamesForKey = [];
        const seenTitles = new Set();
        games.forEach(game => {
            if (game.timelineColor && !seenTitles.has(game.englishTitle)) {
                uniqueGamesForKey.push({ title: game.englishTitle, color: game.timelineColor });
                seenTitles.add(game.englishTitle);
            }
        });
        uniqueGamesForKey.sort((a,b) => a.title.localeCompare(b.title));
        uniqueGamesForKey.forEach(item => {
            const keyItemDiv = document.createElement('div');
            keyItemDiv.className = 'key-item';
            const swatch = document.createElement('div');
            swatch.className = 'key-color-swatch';
            swatch.style.backgroundColor = item.color;
            const titleSpan = document.createElement('span');
            titleSpan.textContent = item.title;
            keyItemDiv.appendChild(swatch);
            keyItemDiv.appendChild(titleSpan);
            keyContainer.appendChild(keyItemDiv);
        });
    }

    initUnifiedTimeline();
});
