document.addEventListener('DOMContentLoaded', () => {

    const games = [
        {
            arc: "Liberl Arc",
            englishTitle: "Trails in the Sky",
            japaneseTitleKanji: "英雄伝説 空の軌跡FC",
            japaneseTitleRomaji: "Sora no Kiseki FC",
            assetName: "trails-in-the-sky",
            steamUrl: "https://store.steampowered.com/app/251150/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_in_the_Sky",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Sora_no_Kiseki_FC",
            releasesJP: [
                { date: "June 24, 2004", platforms: "(PC)" },
                { date: "June 28, 2006", platforms: "(PSP)" },
                { date: "December 13, 2012", platforms: "(PS3)" },
                { date: "June 11, 2015", platforms: "(PS Vita)" }
            ],
            releasesEN: [
                { date: "March 29, 2011", platforms: "(PSP)" },
                { date: "July 29, 2014", platforms: "(PC)" }
            ]
        },
        {
            arc: "Liberl Arc",
            englishTitle: "Trails in the Sky SC",
            japaneseTitleKanji: "英雄伝説 空の軌跡SC",
            japaneseTitleRomaji: "Sora no Kiseki SC",
            assetName: "trails-in-the-sky-sc",
            steamUrl: "https://store.steampowered.com/app/251290/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_in_the_Sky_SC",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Sora_no_Kiseki_SC",
            releasesJP: [
                { date: "March 9, 2006", platforms: "(PC)" },
                { date: "December 27, 2007", platforms: "(PSP)" },
                { date: "April 25, 2013", platforms: "(PS3)" },
                { date: "December 10, 2015", platforms: "(PS Vita)" }
            ],
            releasesEN: [
                { date: "October 29, 2015", platforms: "(PC, PSP)" }
            ]
        },
        {
            arc: "Liberl Arc",
            englishTitle: "Trails in the Sky the 3rd",
            japaneseTitleKanji: "英雄伝説 空の軌跡 the 3rd",
            japaneseTitleRomaji: "Sora no Kiseki the 3rd",
            assetName: "trails-in-the-sky-the-3rd",
            steamUrl: "https://store.steampowered.com/app/436670/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_in_the_Sky_the_3rd",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Sora_no_Kiseki_the_3rd",
            releasesJP: [
                { date: "June 28, 2007", platforms: "(PC)" },
                { date: "July 24, 2008", platforms: "(PSP)" },
                { date: "June 26, 2014", platforms: "(PS3)" },
                { date: "July 14, 2016", platforms: "(PS Vita)" }
            ],
            releasesEN: [
                { date: "May 3, 2017", platforms: "(PC)" }
            ]
        },
        {
            arc: "Crossbell Arc",
            englishTitle: "Trails from Zero",
            japaneseTitleKanji: "英雄伝説 零の軌跡",
            japaneseTitleRomaji: "Zero no Kiseki",
            assetName: "trails-from-zero",
            steamUrl: "https://store.steampowered.com/app/1668510/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_from_Zero",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Zero_no_Kiseki",
            releasesJP: [
                { date: "September 30, 2010", platforms: "(PSP)" },
                { date: "October 18, 2012", platforms: "(PS Vita)" },
                { date: "May 1, 2020", platforms: "(PS4)" }
            ],
            releasesEN: [
                { date: "September 27, 2022", platforms: "(PC, PS4, Switch)" }
            ]
        },
        {
            arc: "Crossbell Arc",
            englishTitle: "Trails to Azure",
            japaneseTitleKanji: "英雄伝説 碧の軌跡",
            japaneseTitleRomaji: "Ao no Kiseki",
            assetName: "trails-to-azure",
            steamUrl: "https://store.steampowered.com/app/1668520/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_to_Azure",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Ao_no_Kiseki",
            releasesJP: [
                { date: "September 29, 2011", platforms: "(PSP)" },
                { date: "June 12, 2014", platforms: "(PS Vita)" },
                { date: "May 28, 2020", platforms: "(PS4)" }
            ],
            releasesEN: [
                { date: "March 14, 2023", platforms: "(PC, PS4, Switch)" }
            ]
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel",
            japaneseTitleKanji: "英雄伝説 閃の軌跡",
            japaneseTitleRomaji: "Sen no Kiseki",
            assetName: "trails-of-cold-steel",
            steamUrl: "https://store.steampowered.com/app/538680/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_of_Cold_Steel",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Sen_no_Kiseki",
            releasesJP: [
                { date: "September 26, 2013", platforms: "(PS3, PS Vita)" },
                { date: "March 8, 2018", platforms: "(PS4)" }
            ],
            releasesEN: [
                { date: "December 22, 2015", platforms: "(PS3, PS Vita)" },
                { date: "August 2, 2017", platforms: "(PC)" },
                { date: "March 26, 2019", platforms: "(PS4)" },
                { date: "April 9, 2024", platforms: "(Switch)" }
            ]
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel II",
            japaneseTitleKanji: "英雄伝説 閃の軌跡II",
            japaneseTitleRomaji: "Sen no Kiseki II",
            assetName: "trails-of-cold-steel-ii",
            steamUrl: "https://store.steampowered.com/app/748490/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_of_Cold_Steel_II",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Sen_no_Kiseki_II",
            releasesJP: [
                { date: "September 25, 2014", platforms: "(PS3, PS Vita)" },
                { date: "April 26, 2018", platforms: "(PS4)" }
            ],
            releasesEN: [
                { date: "September 6, 2016", platforms: "(PS3, PS Vita)" },
                { date: "February 14, 2018", platforms: "(PC)" },
                { date: "June 4, 2019", platforms: "(PS4)" },
                { date: "July 5, 2024", platforms: "(Switch)" }
            ]
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel III",
            japaneseTitleKanji: "英雄伝説 閃の軌跡III",
            japaneseTitleRomaji: "Sen no Kiseki III",
            assetName: "trails-of-cold-steel-iii",
            steamUrl: "https://store.steampowered.com/app/991270/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_of_Cold_Steel_III",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Sen_no_Kiseki_III",
            releasesJP: [
                { date: "September 28, 2017", platforms: "(PS4)" }
            ],
            releasesEN: [
                { date: "October 22, 2019", platforms: "(PS4)" },
                { date: "March 23, 2020", platforms: "(PC)" },
                { date: "June 30, 2020", platforms: "(Switch)" }
            ]
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel IV",
            japaneseTitleKanji: "英雄伝説 閃の軌跡IV",
            japaneseTitleRomaji: "Sen no Kiseki IV -THE END OF SAGA-",
            assetName: "trails-of-cold-steel-iv",
            steamUrl: "https://store.steampowered.com/app/1198010/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_of_Cold_Steel_IV",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Sen_no_Kiseki_IV",
            releasesJP: [
                { date: "September 27, 2018", platforms: "(PS4)" }
            ],
            releasesEN: [
                { date: "October 27, 2020", platforms: "(PS4)" },
                { date: "April 9, 2021", platforms: "(PC, Switch)" }
            ]
        },
        {
            arc: "Epilogue Arc",
            englishTitle: "Trails into Reverie",
            japaneseTitleKanji: "英雄伝説 創の軌跡",
            japaneseTitleRomaji: "Hajimari no Kiseki",
            assetName: "trails-into-reverie",
            steamUrl: "https://store.steampowered.com/app/1668540/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_into_Reverie",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Hajimari_no_Kiseki",
            releasesJP: [
                { date: "August 27, 2020", platforms: "(PS4)" },
                { date: "August 26, 2021", platforms: "(PC, Switch)" }
            ],
            releasesEN: [
                { date: "July 7, 2023", platforms: "(PC, PS4, PS5, Switch)" }
            ]
        },
        {
            arc: "Calvard Arc",
            englishTitle: "Trails through Daybreak",
            japaneseTitleKanji: "英雄伝説 黎の軌跡",
            japaneseTitleRomaji: "Kuro no Kiseki",
            assetName: "trails-through-daybreak",
            steamUrl: "https://store.steampowered.com/app/1811950/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_through_Daybreak",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Kuro_no_Kiseki",
            releasesJP: [
                { date: "September 30, 2021", platforms: "(PS4)" },
                { date: "July 28, 2022", platforms: "(PS5)" }
            ],
            releasesEN: [
                { date: "July 5, 2024", platforms: "(PC, PS4, PS5, Switch)" }
            ]
        },
        {
            arc: "Calvard Arc",
            englishTitle: "Trails through Daybreak II",
            japaneseTitleKanji: "英雄伝説 黎の軌跡II",
            japaneseTitleRomaji: "Kuro no Kiseki II -CRIMSON SiN-",
            assetName: "trails-through-daybreak-ii",
            steamUrl: "https://store.steampowered.com/app/2138610/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Kuro_no_Kiseki_II_–_Crimson_Sin",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Kuro_no_Kseki_II_-CRIMSON_SiN-",
            releasesJP: [
                { date: "September 29, 2022", platforms: "(PS4, PS5)" }
            ],
            releasesEN: [
                { date: "TBA 2025", platforms: "(PC, PS4, PS5, Switch)" }
            ]
        },
        {
            arc: "Calvard Arc",
            englishTitle: "Trails beyond the Horizon",
            japaneseTitleKanji: "英雄伝説 界の軌跡",
            japaneseTitleRomaji: "Kai no Kiseki -Farewell, O Zemuria-",
            assetName: "trails-beyond-the-horizon",
            steamUrl: "https://store.steampowered.com/app/3316940/",
            wikiUrl: "https://en.wikipedia.org/wiki/The_Legend_of_Heroes:_Trails_Beyond_the_Horizon",
            fandomUrl: "https://kiseki.fandom.com/wiki/The_Legend_of_Heroes:_Trails_beyond_the_Horizon",
            releasesJP: [
                { date: "September 26, 2024", platforms: "(PS4, PS5)" }
            ],
            releasesEN: [
                { date: "January 2026", platforms: "(PC, PS4, PS5, Switch)" }
            ]
        }
    ];

    const timelineContainer = document.getElementById('game-timeline-container');
    let lastArc = null;

    games.forEach((game) => {
        if (game.arc !== lastArc) {
            const arcHeader = document.createElement('h2');
            arcHeader.className = 'arc-header';
            arcHeader.textContent = game.arc;
            timelineContainer.appendChild(arcHeader);
            lastArc = game.arc;
        }

        const entry = document.createElement('div');
        entry.className = 'game-entry';

        // Helper function to generate the hierarchical release string
        const createReleaseString = (releases) => {
            if (!releases || releases.length === 0) return '';
            
            const primary = `<span class="release-primary">${releases[0].date} ${releases[0].platforms}</span>`;
            
            const secondary = releases.slice(1).map(r => 
                `<span class="release-secondary">, ${r.date} ${r.platforms}</span>`
            ).join('');
            
            return primary + secondary;
        };

        entry.innerHTML = `
            <div class="art-container">
                <img src="grid/${game.assetName}.jpg" alt="${game.englishTitle} Grid Art" class="game-grid-art">
            </div>
            <div class="info-container">
                <div class="hero-background" style="background-image: url('hero/${game.assetName}.jpg');"></div>
                <div class="info-content">
                    <div class="main-info">
                        <img src="logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="game-logo">
                        <p class="japanese-title">
                            <span class="kanji-title">${game.japaneseTitleKanji}</span>
                            <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                        </p>
                        <div class="release-details">
                            <div class="release-region">
                                <h4 class="release-header">Japanese Release</h4>
                                <div class="release-list">${createReleaseString(game.releasesJP)}</div>
                            </div>
                            <div class="release-region">
                                <h4 class="release-header">English Release</h4>
                                <div class="release-list">${createReleaseString(game.releasesEN)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="external-links">
                        <a href="${game.steamUrl}" target="_blank" rel="noopener noreferrer" title="Steam Store Page">
                            <img src="logo/steam.png" alt="Steam Logo">
                        </a>
                        <a href="${game.wikiUrl}" target="_blank" rel="noopener noreferrer" title="Wikipedia">
                            <img src="logo/wikipedia.png" alt="Wikipedia Logo">
                        </a>
                        <a href="${game.fandomUrl}" target="_blank" rel="noopener noreferrer" title="Kiseki Fandom Wiki">
                            <img src="logo/fandom.png" alt="Fandom Logo">
                        </a>
                    </div>
                </div>
            </div>
        `;

        timelineContainer.appendChild(entry);
    });
});