const Message = require('discord-helper-lib/Message');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const FantasyCriticApi = require('../api/FantasyCriticApi.js');
const FCDataLayer = require('../api/FCDataLayer.js');
const ScoreRounder = require('../api/ScoreRounder.js');
const resources = require('../settings/resources.json');
const MessageArrayJoiner = require('discord-helper-lib/MessageArrayJoiner.js');

exports.sendGameUpdatesToLeagueChannels = async function (
    guilds,
    leagueChannels
) {
    const yearToCheck = new Date().getFullYear();

    const masterGameYearApiData = await FantasyCriticApi.getMasterGameYear(
        yearToCheck
    );

    const masterGameCache = await FCDataLayer.getMasterGameList(yearToCheck);
    if (!masterGameCache || masterGameCache.length === 0) {
        await FCDataLayer.initMasterGameList(masterGameYearApiData);
        return;
    }

    let gamesToUpdate = [];
    let updatesToAnnounce = [];

    masterGameYearApiData.forEach((gameToCheck) => {
        const gameInCache = masterGameCache.find(
            (g) => g.masterGameID === gameToCheck.masterGameID
        );
        if (!gameInCache) {
            gamesToUpdate.push(gameToCheck);
            updatesToAnnounce.push(
                `New Game Added: **${gameToCheck.gameName}**`
            );
        } else {
            if (gameToCheck.gameName !== gameInCache.gameName) {
                gamesToUpdate.push(gameToCheck);
                updatesToAnnounce.push(
                    `**${gameInCache.gameName}** has been renamed to **${gameToCheck.gameName}**`
                );
            }
            if (
                gameToCheck.estimatedReleaseDate !==
                gameInCache.estimatedReleaseDate
            ) {
                gamesToUpdate.push(gameToCheck);
                updatesToAnnounce.push(
                    `The estimated release date for **${gameToCheck.gameName}** has changed from **${gameInCache.estimatedReleaseDate}** to **${gameToCheck.estimatedReleaseDate}**`
                );
            }
            if (gameToCheck.releaseDate !== gameInCache.releaseDate) {
                gamesToUpdate.push(gameToCheck);
                if (!gameInCache.releaseDate) {
                    updatesToAnnounce.push(
                        `**${gameToCheck.gameName}** now has a release date: **${gameToCheck.releaseDate}**`
                    );
                } else {
                    updatesToAnnounce.push(
                        `The official release date for **${gameToCheck.gameName}** has changed from **${gameInCache.releaseDate}** to **${gameToCheck.releaseDate}**`
                    );
                }
            }
            if (gameToCheck.isReleased !== gameInCache.isReleased) {
                gamesToUpdate.push(gameToCheck);
                if (gameToCheck.isReleased) {
                    updatesToAnnounce.push(
                        `**${gameToCheck.gameName}** has released!`
                    );
                } else {
                    updatesToAnnounce.push(
                        `The status for **${gameToCheck.gameName}** has changed to "not released" for some reason, check on this.`
                    );
                }
            }
            if (gameToCheck.willRelease !== gameInCache.willRelease) {
                gamesToUpdate.push(gameToCheck);
                if (gameToCheck.willRelease) {
                    updatesToAnnounce.push(
                        `**${gameToCheck.gameName}** will release this year!`
                    );
                } else {
                    updatesToAnnounce.push(
                        `**${gameToCheck.gameName}** will NOT release this year.`
                    );
                }
            }
            if (gameToCheck.criticScore !== gameInCache.criticScore) {
                gamesToUpdate.push(gameToCheck);
                if (!gameInCache.criticScore) {
                    updatesToAnnounce.push(
                        `**${gameToCheck.gameName
                        }** now has a critic score of ${ScoreRounder.round(
                            gameToCheck.criticScore,
                            1
                        )}.`
                    );
                } else {
                    const roundedCacheScore = ScoreRounder.round(
                        gameInCache.criticScore,
                        1
                    );
                    const roundedApiScore = ScoreRounder.round(
                        gameToCheck.criticScore,
                        1
                    );
                    const scoreDiff = roundedCacheScore - roundedApiScore;
                    if (scoreDiff !== 0 && Math.abs(scoreDiff) >= 1) {
                        const direction = scoreDiff < 0 ? 'UP' : 'DOWN';
                        updatesToAnnounce.push(
                            `The critic score for **${gameToCheck.gameName}** has gone **${direction}** from **${roundedCacheScore}** to **${roundedApiScore}**`
                        );
                    }
                }
            }
        }
    });

    await FCDataLayer.updateMasterGameList(gamesToUpdate);

    const messageSender = new MessageSender();

    const guildsToSend = guilds.filter((g) =>
        leagueChannels.map((l) => l.guildId).includes(g.id)
    );

    leagueChannels.forEach((leagueChannel) => {
        const guildToSend = guildsToSend.find(
            (g) => g.id === leagueChannel.guildId
        );
        if (!guildToSend) {
            console.log(
                `Could not find guild with id ${leagueChannel.guildId}`
            );
            return;
        }
        const channelToSend = guildToSend.channels.find(
            (c) => c.id === leagueChannel.channelId
        );
        if (!channelToSend) {
            console.log(
                `Could not find channel with id ${leagueChannel.channelId}`
            );
            return;
        }

        if (updatesToAnnounce.length > 0) {
            const messageArrayJoiner = new MessageArrayJoiner();
            const messageArray =
                messageArrayJoiner.buildMessageArrayFromStringArray(
                    updatesToAnnounce,
                    resources.maxMessageLength,
                    `**Game Updates!**`
                );

            if (messageArray.length > 10) {
                console.log(
                    'Attempting to send more than 10 messages at once',
                    messageArray
                );
            }

            messageArray.forEach((message) => {
                const messageToSend = new Message(message, null);
                messageSender.sendMessage(
                    messageToSend.buildMessage(),
                    channelToSend,
                    null
                );
            });
            console.log(`Sent updates to channel ${channelToSend.id}`);
        } else {
            console.log('No updates to announce.', new Date());
        }
    });
    console.log('Processed ALL games.');
};
