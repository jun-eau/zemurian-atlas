document.addEventListener('DOMContentLoaded', () => {
    const timelineKeyContainer = document.getElementById('lore-timeline-key');
    const gamesJsonPath = 'games.json';

    // --- Configuration ---
    const pixelsPerMonthVertical = 22; // Vertical space for each month row in the axis
    const axisAreaTopPadding = 25;     // Padding at the top of the axis/games area before first month line
    const gameBoxMargin = 4;           // Horizontal margin between overlapping game boxes in the same month slot
    const gameBoxBaseWidthPercentage = 80; // Default width % for a game box if no overlap. JS will make it smaller if needed.
    const monthsToShowOnAxis = [1, 4, 7, 10]; // January, April, July, October

    // --- Helper Functions ---
    function parseDate(dateStr) {
        if (!dateStr) return { year: 0, month: 0, day: 0, valid: false };
        const [year, month, day] = dateStr.split('-').map(Number);
        return { year, month, day: day || 1, valid: true }; // Default to day 1 if not specified
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
        // Check if the original string included a day part (e.g., "YYYY-MM-DD" vs "YYYY-MM")
        const showDay = originalDateString && originalDateString.length > 7;
        if (showDay && parsedDate.day) {
            return `${monthName} ${getDayWithOrdinal(parsedDate.day)}, ${year}`;
        }
        return `${monthName} ${year}`;
    }

    function determineArcForGame(game) {
        if (game.arc === "Liberl Arc") return "liberl";
        if (game.arc === "Crossbell Arc") return "crossbell";
        if (game.arc === "Erebonia Arc" || game.englishTitle === "Trails into Reverie" || game.englishTitle === "Trails of Cold Steel IV" || game.englishTitle === "Trails of Cold Steel III") return "erebonia";
        // Special handling for CS series to ensure they are in Erebonia if arc is missing for some reason
        if (game.englishTitle && game.englishTitle.startsWith("Trails of Cold Steel")) return "erebonia";
        return null;
    }

    // Calculate month index from a common epoch for sorting/positioning
    function getGlobalMonthIndex(pDate) {
        return pDate.year * 12 + pDate.month;
    }


    async function initTimelines() {
        if (!timelineKeyContainer) {
            console.warn('Timeline key container not found! Key will not be rendered.');
        }

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

            // Sort all games initially by start date for correct key generation
            processedGames.sort((a, b) => getGlobalMonthIndex(a.parsedStart) - getGlobalMonthIndex(b.parsedStart));
            if (timelineKeyContainer) renderGameKey(processedGames, timelineKeyContainer);

            const arcsDefinition = {
                liberl: { containerId: 'liberl-timeline-container', games: [], name: "Liberl Arc" },
                crossbell: { containerId: 'crossbell-timeline-container', games: [], name: "Crossbell Arc" },
                erebonia: { containerId: 'erebonia-timeline-container', games: [], name: "Erebonia Arc" },
            };

            processedGames.forEach(game => {
                if (arcsDefinition[game.arcKey]) {
                    arcsDefinition[game.arcKey].games.push(game);
                }
            });

            for (const arcName in arcsDefinition) {
                const arcDetails = arcsDefinition[arcName];
                const containerEl = document.getElementById(arcDetails.containerId);

                if (containerEl) {
                    if (arcDetails.games.length > 0) {
                        // Sort games within this specific arc by start date
                        arcDetails.games.sort((a, b) => getGlobalMonthIndex(a.parsedStart) - getGlobalMonthIndex(b.parsedStart));
                        renderArcTimelineVertical(arcDetails.games, containerEl, arcName);
                    } else {
                        const gamesArea = containerEl.querySelector('.timeline-games-area');
                        if(gamesArea) gamesArea.innerHTML = `<p style="text-align:center; padding-top:20px;">No timeline data for ${arcDetails.name}.</p>`;
                    }
                } else {
                    console.warn(`Container element not found for arc: ${arcDetails.containerId}`);
                }
            }

        } catch (error) {
            console.error('Failed to load or process game data for timelines:', error);
            // Display error in all timeline containers if a global error occurs
            ['liberl-timeline-container', 'crossbell-timeline-container', 'erebonia-timeline-container'].forEach(id => {
                const c = document.getElementById(id);
                if (c) {
                    const gamesArea = c.querySelector('.timeline-games-area');
                    if (gamesArea) gamesArea.innerHTML = `<p style="text-align:center; color:red; padding-top:20px;">Error loading timeline: ${error.message}</p>`;
                }
            });
        }
    }

    function renderGameKey(games, keyContainer) {
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

    function renderArcTimelineVertical(gamesInArc, containerElement, arcKeyName) {
        const axisArea = containerElement.querySelector('.timeline-axis-area');
        const gamesArea = containerElement.querySelector('.timeline-games-area');
        axisArea.innerHTML = ''; // Clear previous content
        gamesArea.innerHTML = ''; // Clear previous content

        if (gamesInArc.length === 0) return;

        // Determine the min/max years and months for this specific arc
        const arcMinDate = gamesInArc[0].parsedStart;
        const arcMaxDate = gamesInArc.reduce((latest, game) => {
            return getGlobalMonthIndex(game.parsedEnd) > getGlobalMonthIndex(latest) ? game.parsedEnd : latest;
        }, gamesInArc[0].parsedEnd);

        const firstYear = arcMinDate.year;
        const lastYear = arcMaxDate.year;

        let runningMonthOffset = 0; // Tracks the overall month offset from the start of this arc's timeline
        let lastRenderedYearOnAxis = null;

        // Render Years, Months, and Month Lines
        for (let year = firstYear; year <= lastYear; year++) {
            const startMonthInCurrentYearLoop = (year === firstYear) ? arcMinDate.month : 1;
            const endMonthInCurrentYearLoop = (year === lastYear) ? arcMaxDate.month : 12;

            // Year Label Logic
            if (year !== lastRenderedYearOnAxis) {
                // Calculate Y position for the year label based on the first month it applies to in this loop iteration
                const yearLabelEffectiveYPos = runningMonthOffset * pixelsPerMonthVertical + axisAreaTopPadding;

                const yearLabel = document.createElement('div');
                yearLabel.className = 'timeline-year';
                yearLabel.textContent = `S${year}`;
                 // Position slightly above the first month line of this year, or at top padding
                yearLabel.style.top = `${Math.max(axisAreaTopPadding - 10, yearLabelEffectiveYPos - (pixelsPerMonthVertical / 2))}px`;
                axisArea.appendChild(yearLabel);
                lastRenderedYearOnAxis = year;
            }

            for (let month = startMonthInCurrentYearLoop; month <= endMonthInCurrentYearLoop; month++) {
                const monthYPos = runningMonthOffset * pixelsPerMonthVertical + axisAreaTopPadding;

                if (monthsToShowOnAxis.includes(month)) {
                    const monthLabel = document.createElement('div');
                    monthLabel.className = 'timeline-month-label';
                    monthLabel.textContent = getMonthName(month).substring(0, 3);
                    monthLabel.style.top = `${monthYPos}px`;
                    axisArea.appendChild(monthLabel);
                }

                const monthLine = document.createElement('div');
                monthLine.className = 'timeline-month-line';
                monthLine.style.top = `${monthYPos}px`;
                gamesArea.appendChild(monthLine);

                runningMonthOffset++;
            }
        }
        const overallTimelineHeight = runningMonthOffset * pixelsPerMonthVertical + axisAreaTopPadding + pixelsPerMonthVertical; // Extra month space at bottom
        axisArea.style.minHeight = `${overallTimelineHeight}px`;
        gamesArea.style.minHeight = `${overallTimelineHeight}px`;

        // Prepare game elements for rendering (calculating top, height)
        const gameElements = gamesInArc.map(game => {
            // Calculate month offset from the very first month shown in this arc's axis
            let gameStartOffsetMonths = 0;
            for(let y = firstYear; y < game.parsedStart.year; y++) {
                gameStartOffsetMonths += (y === firstYear) ? (12 - arcMinDate.month + 1) : 12;
            }
            if (game.parsedStart.year === firstYear) {
                gameStartOffsetMonths += game.parsedStart.month - arcMinDate.month;
            } else { // game starts in a subsequent year
                gameStartOffsetMonths += game.parsedStart.month -1; // -1 because months are 1-indexed
            }

            let gameEndOffsetMonths = 0;
            for(let y = firstYear; y < game.parsedEnd.year; y++) {
                gameEndOffsetMonths += (y === firstYear) ? (12 - arcMinDate.month + 1) : 12;
            }
            if (game.parsedEnd.year === firstYear) {
                gameEndOffsetMonths += game.parsedEnd.month - arcMinDate.month;
            } else {
                gameEndOffsetMonths += game.parsedEnd.month -1;
            }

            const top = gameStartOffsetMonths * pixelsPerMonthVertical + axisAreaTopPadding;
            const durationInDisplayMonths = Math.max(gameEndOffsetMonths - gameStartOffsetMonths + 1, 1);
            const height = durationInDisplayMonths * pixelsPerMonthVertical - (pixelsPerMonthVertical > 10 ? 2 : 0); // Small gap

            return {
                ...game,
                displayTop: top,
                displayHeight: Math.max(height, pixelsPerMonthVertical * 0.75),
                overlapStart: top,
                overlapEnd: top + Math.max(height, pixelsPerMonthVertical * 0.75),
            };
        });

        // Collision detection and column assignment (horizontal within the gamesArea)
        gameElements.forEach(el => el.assignedHColumn = 0); // Initialize horizontal column

        for (let i = 0; i < gameElements.length; i++) {
            let currentHCol = 0;
            let placed = false;
            while(!placed) {
                let collision = false;
                for (let j = 0; j < i; j++) {
                    if (gameElements[j].assignedHColumn === currentHCol) {
                        if (gameElements[i].overlapStart < gameElements[j].overlapEnd && gameElements[i].overlapEnd > gameElements[j].overlapStart) {
                            collision = true;
                            break;
                        }
                    }
                }
                if (!collision) {
                    gameElements[i].assignedHColumn = currentHCol;
                    placed = true;
                } else {
                    currentHCol++;
                }
            }
        }

        const maxHColumnsNeeded = Math.max(0,...gameElements.map(el => el.assignedHColumn)) + 1;
        const availableGameAreaWidth = gamesArea.clientWidth > 0 ? gamesArea.clientWidth : (containerElement.clientWidth * 0.7); // Estimate if not rendered

        gameElements.forEach(elData => {
            const gameDiv = document.createElement('div');
            gameDiv.className = 'timeline-game-entry';
            gameDiv.style.backgroundColor = elData.timelineColor;
            gameDiv.style.top = `${elData.displayTop}px`;
            gameDiv.style.height = `${elData.displayHeight}px`;

            const boxWidth = Math.max(
                (availableGameAreaWidth / maxHColumnsNeeded) - (gameBoxMargin * (maxHColumnsNeeded > 1 ? (maxHColumnsNeeded -1)/maxHColumnsNeeded : 0) ), // Distribute width
                (gameBoxBaseWidthPercentage / maxHColumnsNeeded) * (availableGameAreaWidth/100) // Ensure a % of base as min
            );

            gameDiv.style.width = `${Math.max(boxWidth, 30)}px`; // Absolute min width 30px
            gameDiv.style.left = `${elData.assignedHColumn * (parseFloat(gameDiv.style.width) + gameBoxMargin) + gameBoxMargin}px`;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'game-title';
            titleSpan.textContent = elData.englishTitle;

            const datesSpan = document.createElement('span');
            datesSpan.className = 'game-dates';
            datesSpan.textContent = `${formatGameDateForDisplay(elData.parsedStart, elData.timelineStart)} - ${formatGameDateForDisplay(elData.parsedEnd, elData.timelineEnd)}`;

            gameDiv.appendChild(titleSpan);
            if (elData.displayHeight > 35) { // Only add dates if there's enough space
                 gameDiv.appendChild(datesSpan);
            }
            gameDiv.title = `${elData.englishTitle}\n(${datesSpan.textContent})`;


            // Adjust text color for contrast
            const r = parseInt(elData.timelineColor.slice(1, 3), 16);
            const g = parseInt(elData.timelineColor.slice(3, 5), 16);
            const b = parseInt(elData.timelineColor.slice(5, 7), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            gameDiv.style.color = brightness < 128 ? '#f0f0f0' : '#1a1a1a';
            if (brightness > 230 && gameDiv.style.borderColor !== 'rgb(85, 85, 85)') { // Check if already set
                gameDiv.style.borderColor = '#555555';
            }

            gamesArea.appendChild(gameDiv);
        });
    }

    initTimelines();
});
