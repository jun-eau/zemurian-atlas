document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('lore-timeline-container');
    const timelineKeyContainer = document.getElementById('lore-timeline-key');
    const gamesJsonPath = 'games.json';

    // --- Configuration ---
    const pixelsPerMonth = 50; // Height of one month in pixels
    const yearLabelOffset = 15; // Offset for year labels to be slightly above the month line
    const gameBoxBaseWidth = 100; // Base width of a game box in pixels
    const gameBoxMargin = 5; // Horizontal margin between game boxes in case of overlap
    const timelinePaddingTop = 30; // Top padding inside the timeline container before first entry

    // --- Helper Functions ---
    function parseDate(dateStr) {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return { year, month, day }; // Keep it simple, focus on year/month
    }

    function getMonthIndex(year, month, startYear) {
        return (year - startYear) * 12 + (month - 1);
    }

    function getMonthAbbreviation(monthNumber) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[monthNumber -1];
    }


    async function initTimeline() {
        if (!timelineContainer || !timelineKeyContainer) {
            console.error('Timeline container or key container not found!');
            return;
        }

        try {
            const response = await fetch(gamesJsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const games = await response.json();

            // Filter out games without timeline data and parse dates
            const validGames = games.filter(game => game.timelineStart && game.timelineEnd)
                .map(game => ({
                    ...game,
                    parsedStart: parseDate(game.timelineStart),
                    parsedEnd: parseDate(game.timelineEnd)
                }));

            if (validGames.length === 0) {
                timelineContainer.innerHTML = '<p>No game data with timeline information available.</p>';
                return;
            }

            // Sort games by start date, then by end date as a tie-breaker
            validGames.sort((a, b) => {
                if (a.parsedStart.year !== b.parsedStart.year) return a.parsedStart.year - b.parsedStart.year;
                if (a.parsedStart.month !== b.parsedStart.month) return a.parsedStart.month - b.parsedStart.month;
                if (a.parsedEnd.year !== b.parsedEnd.year) return a.parsedEnd.year - b.parsedEnd.year;
                return a.parsedEnd.month - b.parsedEnd.month;
            });


            renderGameKey(validGames, timelineKeyContainer);
            renderTimeline(validGames, timelineContainer);

        } catch (error) {
            console.error('Failed to load or process game data:', error);
            timelineContainer.innerHTML = `<p>Error loading timeline data: ${error.message}. Please try again later.</p>`;
        }
    }

    function renderGameKey(games, keyContainer) {
        keyContainer.innerHTML = ''; // Clear previous key
        const uniqueGamesForKey = [];
        const seenTitles = new Set();

        games.forEach(game => {
            if (game.timelineColor && !seenTitles.has(game.englishTitle)) {
                uniqueGamesForKey.push({ title: game.englishTitle, color: game.timelineColor });
                seenTitles.add(game.englishTitle);
            }
        });

        // Sort key items alphabetically by title for consistent order
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

    function renderTimeline(games, container) {
        container.innerHTML = ''; // Clear previous timeline

        const firstYear = Math.min(...games.map(g => g.parsedStart.year));
        const lastGame = games.reduce((latest, game) => {
            return (latest.parsedEnd.year > game.parsedEnd.year ||
                    (latest.parsedEnd.year === game.parsedEnd.year && latest.parsedEnd.month > game.parsedEnd.month))
                    ? latest : game;
        });
        const lastYear = lastGame.parsedEnd.year;
        const lastMonthOfLastYear = lastGame.parsedEnd.month;

        const totalMonths = (lastYear - firstYear) * 12 + lastMonthOfLastYear;
        const timelineHeight = totalMonths * pixelsPerMonth + timelinePaddingTop + 50; // Extra 50 for bottom padding
        container.style.minHeight = `${timelineHeight}px`;

        const axisDiv = document.createElement('div');
        axisDiv.className = 'timeline-axis';
        container.appendChild(axisDiv);

        // Render Years and Months on Axis
        for (let year = firstYear; year <= lastYear; year++) {
            const yearLabel = document.createElement('div');
            yearLabel.className = 'timeline-year';
            yearLabel.textContent = year;
            // Position at the start of the first month of this year
            const yearTopPosition = getMonthIndex(year, 1, firstYear) * pixelsPerMonth + timelinePaddingTop - yearLabelOffset;
            yearLabel.style.top = `${Math.max(timelinePaddingTop - yearLabelOffset, yearTopPosition)}px`; // Ensure it doesn't go above timelinePaddingTop
            axisDiv.appendChild(yearLabel);

            for (let month = 1; month <= 12; month++) {
                if (year === lastYear && month > lastMonthOfLastYear) break; // Don't render months after the last game ends

                const monthLabel = document.createElement('div');
                monthLabel.className = 'timeline-month';
                monthLabel.textContent = getMonthAbbreviation(month);
                const monthTopPosition = getMonthIndex(year, month, firstYear) * pixelsPerMonth + timelinePaddingTop;
                monthLabel.style.top = `${monthTopPosition}px`;
                axisDiv.appendChild(monthLabel);
            }
        }

        // --- Game Box Rendering with Overlap Management ---
        const gameElements = []; // To store data for collision detection

        games.forEach(game => {
            const startIndex = getMonthIndex(game.parsedStart.year, game.parsedStart.month, firstYear);
            const endIndex = getMonthIndex(game.parsedEnd.year, game.parsedEnd.month, firstYear);

            const top = startIndex * pixelsPerMonth + timelinePaddingTop;
            // Height calculation: ensure at least a small visible height even for same-month events
            const durationMonths = (endIndex - startIndex) + 1; // +1 because e.g. Jan to Jan is 1 month duration
            const height = Math.max(durationMonths * pixelsPerMonth - 5, pixelsPerMonth / 2); // -5 for a small gap, min height half a month

            const gameElement = {
                id: game.assetName, // For debugging or future use
                top: top,
                bottom: top + height,
                height: height,
                color: game.timelineColor,
                title: game.englishTitle,
                start: `${getMonthAbbreviation(game.parsedStart.month)} ${game.parsedStart.year}`,
                end: `${getMonthAbbreviation(game.parsedEnd.month)} ${game.parsedEnd.year}`,
                originalData: game // Keep original data if needed
            };
            gameElements.push(gameElement);
        });

        // Collision detection and column assignment
        // This is a simplified approach: it assigns columns greedily.
        // More sophisticated layout algorithms could be used for optimal packing.
        gameElements.forEach(el => el.column = 0); // Initialize column

        for (let i = 0; i < gameElements.length; i++) {
            let currentCol = 0;
            let placed = false;
            while(!placed) {
                let collision = false;
                for (let j = 0; j < i; j++) { // Check against previously placed items
                    if (gameElements[j].column === currentCol) { // Only check if they are trying for the same column
                        // Check for vertical overlap
                        if (gameElements[i].top < gameElements[j].bottom && gameElements[i].bottom > gameElements[j].top) {
                            collision = true;
                            break;
                        }
                    }
                }
                if (!collision) {
                    gameElements[i].column = currentCol;
                    placed = true;
                } else {
                    currentCol++; // Try next column
                }
            }
        }

        const maxColumns = Math.max(...gameElements.map(el => el.column)) + 1;
        // The timeline container has 100px padding-left where the 90px axisDiv sits.
        // So, game content area starts effectively 100px from the left edge of timelineContainer.
        // clientWidth is the width of the content area (excluding padding if box-sizing is content-box, which is default for divs).
        // However, since axisDiv is position:absolute and inside timelineContainer, its width doesn't directly subtract from clientWidth in a flow sense.
        // The game boxes are positioned relative to timelineContainer's content box.
        // The available width for game boxes is the timelineContainer's content width MINUS the space we want to reserve on the right.
        const contentAreaWidth = container.clientWidth; // This is the width games can actually use.
        const rightPadding = 10; // Small padding on the right of the game area.
        const availableGameAreaWidth = contentAreaWidth - rightPadding;


        gameElements.forEach(elData => {
            const gameDiv = document.createElement('div');
            gameDiv.className = 'timeline-game-entry';
            gameDiv.style.backgroundColor = elData.color;
            gameDiv.style.top = `${elData.top}px`;
            gameDiv.style.height = `${elData.height}px`;
            gameDiv.title = `${elData.title} (${elData.start} - ${elData.end})`; // Add tooltip

            // Calculate width for each box
            const minBoxWidth = 40; // Minimum sensible width for a box to be somewhat readable
            let calculatedWidth = (availableGameAreaWidth - (maxColumns > 1 ? (maxColumns - 1) * gameBoxMargin : 0)) / maxColumns;
            calculatedWidth = Math.max(calculatedWidth, minBoxWidth);

            gameDiv.style.width = `${calculatedWidth}px`;

            // Calculate left position for each box
            // The gameBoxMargin on the left of the first column pushes it slightly from the axis line.
            // The axis line is at 90px, container padding-left is 100px. Game content starts effectively at 100px from container's border.
            // So left: gameBoxMargin (e.g. 5px) means it's 5px into the game content area, which is 105px from container's actual left border.
            // This is fine.
            gameDiv.style.left = `${(elData.column * (calculatedWidth + gameBoxMargin)) + gameBoxMargin}px`;

            const titleDiv = document.createElement('div');
            titleDiv.className = 'game-title';
            titleDiv.textContent = elData.title;

            const durationDiv = document.createElement('div');
            durationDiv.className = 'game-duration';
            durationDiv.textContent = `${elData.start} - ${elData.end}`;

            // Text color check (simple version based on brightness)
            const bgColor = elData.color.startsWith('#') ? elData.color : '#000000'; // default to black if not hex
            const r = parseInt(bgColor.slice(1, 3), 16);
            const g = parseInt(bgColor.slice(3, 5), 16);
            const b = parseInt(bgColor.slice(5, 7), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness < 128) { // Dark background
                gameDiv.style.color = '#f0f0f0';
            } else { // Light background
                gameDiv.style.color = '#1a1a1a';
                if (brightness > 230) { // Very light, add darker border
                     gameDiv.style.borderColor = '#555555';
                }
            }


            gameDiv.appendChild(titleDiv);
            if (elData.height > 40) { // Only show duration if box is tall enough
                 gameDiv.appendChild(durationDiv);
            }

            container.appendChild(gameDiv);
        });
    }

    initTimeline();
});
