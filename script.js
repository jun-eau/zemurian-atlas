document.addEventListener('DOMContentLoaded', () => {

    const games = [
        {
            arc: "Liberl Arc",
            englishTitle: "Trails in the Sky",
            japaneseTitleKanji: "英雄伝説 空の軌跡FC",
            japaneseTitleRomaji: "Sora no Kiseki FC",
            releaseJP: "June 24, 2004",
            releaseEN: "March 29, 2011",
            platforms: ["PC", "PSP", "PS3", "PS Vita"],
            assetName: "trails-in-the-sky",
            steamUrl: "https://store.steampowered.com/app/251150/"
        },
        {
            arc: "Liberl Arc",
            englishTitle: "Trails in the Sky SC",
            japaneseTitleKanji: "英雄伝説 空の軌跡SC",
            japaneseTitleRomaji: "Sora no Kiseki SC",
            releaseJP: "March 9, 2006",
            releaseEN: "October 29, 2015",
            platforms: ["PC", "PSP", "PS3", "PS Vita"],
            assetName: "trails-in-the-sky-sc",
            steamUrl: "https://store.steampowered.com/app/251290/"
        },
        {
            arc: "Liberl Arc",
            englishTitle: "Trails in the Sky the 3rd",
            japaneseTitleKanji: "英雄伝説 空の軌跡 the 3rd",
            japaneseTitleRomaji: "Sora no Kiseki the 3rd",
            releaseJP: "June 28, 2007",
            releaseEN: "May 3, 2017",
            platforms: ["PC", "PSP", "PS3"],
            assetName: "trails-in-the-sky-the-3rd",
            steamUrl: "https://store.steampowered.com/app/436670/"
        },
        {
            arc: "Crossbell Arc",
            englishTitle: "Trails from Zero",
            japaneseTitleKanji: "英雄伝説 零の軌跡",
            japaneseTitleRomaji: "Zero no Kiseki",
            releaseJP: "September 30, 2010",
            releaseEN: "September 27, 2022",
            platforms: ["PSP", "PS Vita", "PS4", "Switch", "PC"],
            assetName: "trails-from-zero",
            steamUrl: "https://store.steampowered.com/app/1668510/"
        },
        {
            arc: "Crossbell Arc",
            englishTitle: "Trails to Azure",
            japaneseTitleKanji: "英雄伝説 碧の軌跡",
            japaneseTitleRomaji: "Ao no Kiseki",
            releaseJP: "September 29, 2011",
            releaseEN: "March 14, 2023",
            platforms: ["PSP", "PS Vita", "PS4", "Switch", "PC"],
            assetName: "trails-to-azure",
            steamUrl: "https://store.steampowered.com/app/1668520/"
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel",
            japaneseTitleKanji: "英雄伝説 閃の軌跡",
            japaneseTitleRomaji: "Sen no Kiseki",
            releaseJP: "September 26, 2013",
            releaseEN: "December 22, 2015",
            platforms: ["PS3", "PS Vita", "PC", "PS4", "Switch"],
            assetName: "trails-of-cold-steel",
            steamUrl: "https://store.steampowered.com/app/538680/"
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel II",
            japaneseTitleKanji: "英雄伝説 閃の軌跡II",
            japaneseTitleRomaji: "Sen no Kiseki II",
            releaseJP: "September 25, 2014",
            releaseEN: "September 6, 2016",
            platforms: ["PS3", "PS Vita", "PC", "PS4", "Switch"],
            assetName: "trails-of-cold-steel-ii",
            steamUrl: "https://store.steampowered.com/app/748490/"
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel III",
            japaneseTitleKanji: "英雄伝説 閃の軌跡III",
            japaneseTitleRomaji: "Sen no Kiseki III",
            releaseJP: "September 28, 2017",
            releaseEN: "October 22, 2019",
            platforms: ["PS4", "Switch", "PC", "PS5"],
            assetName: "trails-of-cold-steel-iii",
            steamUrl: "https://store.steampowered.com/app/991270/"
        },
        {
            arc: "Erebonia Arc",
            englishTitle: "Trails of Cold Steel IV",
            japaneseTitleKanji: "英雄伝説 閃の軌跡IV",
            japaneseTitleRomaji: "Sen no Kiseki IV -THE END OF SAGA-",
            releaseJP: "September 27, 2018",
            releaseEN: "October 27, 2020",
            platforms: ["PS4", "Switch", "PC", "PS5"],
            assetName: "trails-of-cold-steel-iv",
            steamUrl: "https://store.steampowered.com/app/1198010/"
        },
        {
            arc: "Epilogue Arc",
            englishTitle: "Trails into Reverie",
            japaneseTitleKanji: "英雄伝説 創の軌跡",
            japaneseTitleRomaji: "Hajimari no Kiseki",
            releaseJP: "August 27, 2020",
            releaseEN: "July 7, 2023",
            platforms: ["PS4", "PS5", "Switch", "PC"],
            assetName: "trails-into-reverie",
            steamUrl: "https://store.steampowered.com/app/1668540/"
        },
        {
            arc: "Calvard Arc",
            englishTitle: "Trails through Daybreak",
            japaneseTitleKanji: "英雄伝説 黎の軌跡",
            japaneseTitleRomaji: "Kuro no Kiseki",
            releaseJP: "September 30, 2021",
            releaseEN: "July 5, 2024",
            platforms: ["PS4", "PS5", "Switch", "PC"],
            assetName: "trails-through-daybreak",
            steamUrl: "https://store.steampowered.com/app/1811950/"
        },
        {
            arc: "Calvard Arc",
            englishTitle: "Trails through Daybreak II",
            japaneseTitleKanji: "英雄伝説 黎の軌跡II",
            japaneseTitleRomaji: "Kuro no Kiseki II -CRIMSON SiN-",
            releaseJP: "September 29, 2022",
            releaseEN: "July 5, 2024",
            platforms: ["PS4", "PS5", "Switch", "PC"],
            assetName: "trails-through-daybreak-ii",
            steamUrl: "https://store.steampowered.com/app/2138610/"
        },
        {
            arc: "Calvard Arc",
            englishTitle: "Trails beyond the Horizon",
            japaneseTitleKanji: "英雄伝説 界の軌跡",
            japaneseTitleRomaji: "Kai no Kiseki -Farewell, O Zemuria-",
            releaseJP: "September 26, 2024",
            releaseEN: "January 2026",
            platforms: ["PS4", "PS5", "Switch", "PC"],
            assetName: "trails-beyond-the-horizon",
            steamUrl: "https://store.steampowered.com/app/3316940/"
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

        const platformString = game.platforms.join(', ');

        entry.innerHTML = `
            <div class="art-container">
                <a href="${game.steamUrl}" target="_blank" rel="noopener noreferrer">
                    <img src="grid/${game.assetName}.jpg" alt="${game.englishTitle} Grid Art" class="game-grid-art">
                </a>
            </div>
            <div class="info-container">
                <div class="hero-background" style="background-image: url('hero/${game.assetName}.jpg');"></div>
                <div class="info-content">
                    <img src="logo/${game.assetName}.png" alt="${game.englishTitle} Logo" class="game-logo">
                    <p class="japanese-title">
                        <span class="kanji-title">${game.japaneseTitleKanji}</span>
                        <span class="romaji-title">${game.japaneseTitleRomaji}</span>
                    </p>
                    <div class="details">
                        <p class="release-info">
                            <strong>JP Release:</strong> ${game.releaseJP}<br>
                            <strong>EN Release:</strong> ${game.releaseEN}
                        </p>
                        <p class="platforms"><strong>Platforms:</strong> ${platformString}</p>
                    </div>
                </div>
            </div>
        `;

        timelineContainer.appendChild(entry);
    });
});