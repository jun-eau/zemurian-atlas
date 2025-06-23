document.addEventListener('DOMContentLoaded', () => {
    fetch('games.json')
        .then(response => response.json())
        .then(games => {
            const timelineContainer = document.getElementById('timeline-container');
            if (!timelineContainer) {
                console.error('Timeline container not found!');
                return;
            }

            console.log('Type of games data:', typeof games);
            console.log('Number of games loaded:', games.length);
            if (games.length > 0) {
                console.log('First game object:', JSON.stringify(games[0], null, 2));
            }

            // Determine the overall date range for the timeline
            let minDate = new Date('9999-12-31');
            let maxDate = new Date('0000-01-01');

            games.forEach(game => {
                if (game.timelineStart) {
                    const startDate = new Date(game.timelineStart);
                    if (startDate < minDate) {
                        minDate = startDate;
                    }
                }
                if (game.timelineEnd) {
                    const endDate = new Date(game.timelineEnd);
                    if (endDate > maxDate) {
                        maxDate = endDate;
                    }
                }
            });

            // Default to a range if no dates are found in games.json
            if (minDate > maxDate) {
                minDate = new Date('1200-01-01');
                maxDate = new Date('1210-01-01');
            }


            const timelineDuration = maxDate - minDate;

            // This is the check I added previously based on an earlier diagnosis.
            // It should be AFTER the minDate/maxDate calculation and timelineDuration calculation.
            if (timelineDuration <= 0) {
                console.warn("Timeline duration is zero or negative. Cannot calculate valid widths for timeline items. MinDate:", minDate, "MaxDate:", maxDate);
                return;
            }

            games.forEach(game => {
                // Log details for each game before the check
                console.log(
                    `Processing game: "${game.englishTitle}", timelineStart: [${game.timelineStart}], timelineEnd: [${game.timelineEnd}], type of timelineStart: ${typeof game.timelineStart}`
                );

                if (!game.timelineStart || !game.timelineEnd) {
                    // Skip games without timeline data
                    // Alternatively, decide how to represent them (e.g., a small marker or note)
                    console.warn(`Game "${game.englishTitle}" is SKIPPED due to missing timelineStart or timelineEnd.`);
                    return;
                }

                const gameElement = document.createElement('div');
                gameElement.classList.add('timeline-game');
                gameElement.style.backgroundColor = game.timelineColor || '#ccc'; // Default color if undefined

                const gameTitle = document.createElement('span');
                gameTitle.textContent = game.englishTitle;
                gameTitle.classList.add('timeline-game-title');
                gameElement.appendChild(gameTitle);

                // Calculate position and width based on dates
                const startDate = new Date(game.timelineStart);
                const endDate = new Date(game.timelineEnd);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.error(`Invalid date format for game "${game.englishTitle}"`);
                    return; // Skip this game if dates are invalid
                }


                // const startOffset = ((startDate - minDate) / timelineDuration) * 100; // Keep for potential future use
                const duration = ((endDate - startDate) / timelineDuration) * 100;

                // gameElement.style.left = `${startOffset}%`; // Removed for now, flex column handles stacking
                gameElement.style.width = `${Math.max(0, duration)}%`; // Ensure width is not negative

                // Add tooltip for exact dates
                gameElement.setAttribute('title', `${game.englishTitle}: ${game.timelineStart} to ${game.timelineEnd}`);


                timelineContainer.appendChild(gameElement);
            });
        })
        .catch(error => console.error('Error loading game data:', error));
});
