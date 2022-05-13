const Message = require('discord-helper-lib/Message');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const FantasyCriticApi = require('./FantasyCriticApi.js');
const FCDataLayer = require('./FCDataLayer.js');
const ScoreRounder = require('./ScoreRounder.js');
const resources = require('../settings/resources.json');
const MessageArrayJoiner = require('discord-helper-lib/MessageArrayJoiner.js');
const ranked = require('ranked');
const CheckTypes = require('../api/CheckTypes.js');
const { DateTime } = require('luxon');

exports.sendPublisherScoreUpdatesToLeagueChannels = async function (guilds, leagueChannels) {
    const yearToCheck = new Date().getFullYear();
    const guildsToSend = guilds.filter((g) => leagueChannels.map((l) => l.guildId).includes(g.id));

    for (const leagueChannel of leagueChannels) {
        const leagueYear = await FantasyCriticApi.getLeagueYear(leagueChannel.leagueId, yearToCheck);

        const guildToSend = guildsToSend.find((g) => g.id === leagueChannel.guildId);
        if (!guildToSend) {
            console.log(`Could not find guild with id ${leagueChannel.guildId}`);
            continue;
        }
        const channelToSend = guildToSend.channels.find((c) => c.id === leagueChannel.channelId);
        if (!channelToSend) {
            console.log(`Could not find channel with id ${leagueChannel.channelId}`);
            continue;
        }

        const currentDateToSave = DateTime.now().toISO();
        const lastCheckTime = await FCDataLayer.getLastCheckTime(CheckTypes.LEAGUE_YEAR_UPDATER_CHECK);
        if (!lastCheckTime) {
            console.log('creating');
            await FCDataLayer.updateLastCheckTime({
                checkType: CheckTypes.LEAGUE_YEAR_UPDATER_CHECK,
                checkDate: currentDateToSave,
            });
        }
        const lastCheckDate = DateTime.fromISO(lastCheckTime ? lastCheckTime.checkDate : currentDateToSave);

        await scoreUpdate(leagueYear, channelToSend);
        await tradeUpdate(leagueYear, lastCheckDate, channelToSend);
    }
    console.log('Processed ALL leagues.');
};

async function scoreUpdate(leagueYear, channelToSend) {
    const publishersApiData = leagueYear.publishers.map((publisher) => {
        return {
            publisherID: publisher.publisherID,
            leagueID: publisher.leagueID,
            publisherName: publisher.publisherName,
            playerName: publisher.playerName,
            totalFantasyPoints: publisher.totalFantasyPoints,
        };
    });

    const publisherScoresCache = await FCDataLayer.getPublisherScores(leagueYear.leagueId);

    if (!publisherScoresCache || publisherScoresCache.length === 0) {
        await FCDataLayer.initPublisherScores(publishersApiData);
        return;
    }

    const rankedCache = ranked.ranking(publisherScoresCache, (pubScore) => pubScore.totalFantasyPoints);
    const rankedApi = ranked.ranking(publishersApiData, (pubScore) => pubScore.totalFantasyPoints);

    let publisherScoresToUpdate = [];
    let updatesToAnnounce = [];

    rankedApi.forEach((rankedPublisher) => {
        const publisherScoreToCheck = rankedPublisher.item;
        const publisherInCache = publisherScoresCache.find((p) => p.publisherID === publisherScoreToCheck.publisherID);

        const nameToShow = `${publisherScoreToCheck.publisherName} (Player: ${publisherScoreToCheck.playerName})`;
        if (!publisherInCache) {
            publisherScoresToUpdate.push(publisherScoreToCheck);
            updatesToAnnounce.push(
                `**${nameToShow}** now has a score of **${ScoreRounder.round(
                    publisherScoreToCheck.totalFantasyPoints,
                    1
                )}** and is now in **${formatRankNumber(rankedPublisher.rank)}** place.`
            );
        } else {
            if (publisherScoreToCheck.totalFantasyPoints !== publisherInCache.totalFantasyPoints) {
                publisherScoresToUpdate.push(publisherScoreToCheck);
                if (!publisherInCache.totalFantasyPoints) {
                    updatesToAnnounce.push(
                        `**${nameToShow}** now has a score of **${ScoreRounder.round(
                            publisherScoreToCheck.totalFantasyPoints,
                            1
                        )}** and is now in **${formatRankNumber(rankedPublisher.rank)}** place.`
                    );
                } else {
                    const roundedCacheScore = ScoreRounder.round(publisherInCache.totalFantasyPoints, 1);
                    const roundedApiScore = ScoreRounder.round(publisherScoreToCheck.totalFantasyPoints, 1);
                    const scoreDiff = roundedCacheScore - roundedApiScore;
                    if (scoreDiff !== 0 && Math.abs(scoreDiff) >= 1) {
                        const direction = scoreDiff < 0 ? 'UP' : 'DOWN';
                        let updateMessage = `**${nameToShow}**'s score has gone **${direction}** from **${roundedCacheScore}** to **${roundedApiScore}**`;
                        if (didRankChange(publisherScoreToCheck.publisherID, rankedCache, rankedApi)) {
                            updateMessage += ` and is now in **${formatRankNumber(rankedPublisher.rank)}** place.`;
                        }
                        updatesToAnnounce.push(updateMessage);
                    }
                }
            }
            if (publisherScoreToCheck.publisherName !== publisherInCache.publisherName) {
                publisherScoresToUpdate.push(publisherScoreToCheck);
                updatesToAnnounce.push(
                    `Publisher **${publisherInCache.publisherName}** is now known as **${publisherScoreToCheck.publisherName}**`
                );
            }
            if (publisherScoreToCheck.playerName !== publisherInCache.playerName) {
                publisherScoresToUpdate.push(publisherScoreToCheck);
            }
        }
    });

    await FCDataLayer.updatePublisherScores(publisherScoresToUpdate);

    sendMessages(updatesToAnnounce, '**Publisher Updates!**', channelToSend);
}

function didRankChange(publisherId, rankCache, rankApi) {
    const rankBefore = rankCache.find((p) => p.item.publisherID === publisherId);
    const rankAfter = rankApi.find((p) => p.item.publisherID === publisherId);
    if (!rankAfter) {
        return false;
    }
    return rankBefore.rank !== rankAfter.rank;
}

function formatRankNumber(rankNumber) {
    const numberToFormat = rankNumber.toString();
    let suffix = 'th';
    if (!numberToFormat.endsWith('11') && !numberToFormat.endsWith('12') && !numberToFormat.endsWith('13')) {
        if (numberToFormat.endsWith('1')) {
            suffix = 'st';
        } else if (numberToFormat.endsWith('2')) {
            suffix = 'nd';
        } else if (numberToFormat.endsWith('3')) {
            suffix = 'rd';
        }
    }
    return `${numberToFormat}${suffix}`;
}

async function tradeUpdate(leagueYear, lastCheckDate, channelToSend) {
    let updatesToAnnounce = [];

    const activeTrades = leagueYear.activeTrades;
    const tradesProposedSinceLastCheck = activeTrades.filter(
        (trade) => DateTime.fromISO(trade.proposedTimestamp) > lastCheckDate
    );

    for (const proposedTrade of tradesProposedSinceLastCheck) {
    }

    const tradesAcceptedSinceLastCheck = activeTrades.filter(
        (trade) => trade.acceptedTimestamp && DateTime.fromISO(trade.acceptedTimestamp) > lastCheckDate
    );

    for (const acceptedTrade of tradesAcceptedSinceLastCheck) {
    }

    sendMessages(updatesToAnnounce, '**Trade Updates!**', channelToSend);
}

function sendMessages(updatesToAnnounce, header, channelToSend) {
    const messageSender = new MessageSender();

    if (updatesToAnnounce.length > 0) {
        const messageArrayJoiner = new MessageArrayJoiner();
        const messageArray = messageArrayJoiner.buildMessageArrayFromStringArray(
            updatesToAnnounce,
            resources.maxMessageLength,
            header
        );

        if (messageArray.length > 10) {
            console.log('Attempting to send more than 10 messages at once', messageArray);
        }

        messageArray.forEach((message) => {
            const messageToSend = new Message(message, null);
            messageSender.sendMessage(messageToSend.buildMessage(), channelToSend, null);
        });
        console.log(`Sent updates to channel ${channelToSend.id}`);
    } else {
        console.log('No updates to announce.', new Date());
    }
}
