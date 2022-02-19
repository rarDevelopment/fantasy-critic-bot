const Message = require('discord-lib/Message');
const MessageSender = require('discord-lib/MessageSender.js');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const FCDataLayer = require("../api/FCDataLayer.js");
const ScoreRounder = require("../api/ScoreRounder.js");
const resources = require("../settings/resources.json");
const MessageArrayJoiner = require('discord-lib/MessageArrayJoiner.js');

exports.sendPublisherScoreUpdatesToLeagueChannels = async function (guilds, leagueChannels) {
    const yearToCheck = new Date().getFullYear();
    const guildsToSend = guilds.filter(g => leagueChannels.map(l => l.guildId).includes(g.id));

    for (const leagueChannel of leagueChannels) {
        const leagueYear = await FantasyCriticApi.getLeagueYear(leagueChannel.leagueId, yearToCheck);
        const publishersApiData = leagueYear.publishers.map(publisher => {
            return {
                publisherID: publisher.publisherID,
                leagueID: publisher.leagueID,
                publisherName: publisher.publisherName,
                playerName: publisher.playerName,
                totalFantasyPoints: publisher.totalFantasyPoints
            };
        });

        const publisherScoreCache = await FCDataLayer.getPublisherScores(leagueChannel.leagueId);

        if (!publisherScoreCache || publisherScoreCache.length === 0) {
            await FCDataLayer.initPublisherScores(publishersApiData);
            continue;
        }

        let publisherScoresToUpdate = [];
        let updatesToAnnounce = [];

        publishersApiData.forEach(publisherScoreToCheck => {
            const publisherInCache = publisherScoreCache.find(p => p.publisherID === publisherScoreToCheck.publisherID);

            const nameToShow = `${publisherScoreToCheck.publisherName} (Player: ${publisherScoreToCheck.playerName})`;
            if (!publisherInCache) {
                publisherScoresToUpdate.push(publisherScoreToCheck);
                updatesToAnnounce.push(`**${nameToShow}** now has a score of **${ScoreRounder.round(publisherScoreToCheck.totalFantasyPoints, 1)}**`);
            }
            else {
                if (publisherScoreToCheck.totalFantasyPoints !== publisherInCache.totalFantasyPoints) {
                    publisherScoresToUpdate.push(publisherScoreToCheck);
                    if (!publisherInCache.totalFantasyPoints) {
                        updatesToAnnounce.push(`**${nameToShow}** now has a score of **${ScoreRounder.round(publisherScoreToCheck.totalFantasyPoints, 1)}**`);
                    }
                    else {
                        const roundedCacheScore = ScoreRounder.round(publisherInCache.totalFantasyPoints, 1);
                        const roundedApiScore = ScoreRounder.round(publisherScoreToCheck.totalFantasyPoints, 1);
                        const scoreDiff = roundedCacheScore - roundedApiScore;
                        if (scoreDiff !== 0 && Math.abs(scoreDiff) >= 1) {
                            const direction = scoreDiff < 0 ? "UP" : "DOWN";
                            updatesToAnnounce.push(`**${nameToShow}**'s score has gone **${direction}** from **${roundedCacheScore}** to **${roundedApiScore}**`);
                        }
                    }
                }
                if (publisherScoreToCheck.publisherName !== publisherInCache.publisherName) {
                    publisherScoresToUpdate.push(publisherScoreToCheck);
                    updatesToAnnounce.push(`Publisher **${publisherInCache.publisherName}** is now known as **${publisherScoreToCheck.publisherName}**`);
                }
                if (publisherScoreToCheck.playerName !== publisherInCache.playerName) {
                    publisherScoresToUpdate.push(publisherScoreToCheck);
                    //updatesToAnnounce.push(`Player **${publisherInCache.playerName}** is now known as ${publisherScoreToCheck.playerName}`);
                }
            }
        });

        await FCDataLayer.updatePublisherScores(publisherScoresToUpdate);

        const messageSender = new MessageSender();

        const guildToSend = guildsToSend.find(g => g.id === leagueChannel.guildId);
        if (!guildToSend) {
            console.log(`Could not find guild with id ${leagueChannel.guildId}`)
            return;
        }
        const channelToSend = guildToSend.channels.find(c => c.id === leagueChannel.channelId);
        if (!channelToSend) {
            console.log(`Could not find channel with id ${leagueChannel.channelId}`);
            return;
        }

        if (updatesToAnnounce.length > 0) {
            const messageArrayJoiner = new MessageArrayJoiner();
            const messageArray = messageArrayJoiner.buildMessageArrayFromStringArray(updatesToAnnounce, resources.maxMessageLength, `**Publisher Updates!**`);

            if (messageArray.length > 10) {
                console.log("Attempting to send more than 10 messages at once", messageArray);
            }

            messageArray.forEach(message => {
                const messageToSend = new Message(
                    message,
                    null
                );
                messageSender.sendMessage(messageToSend.buildMessage(), channelToSend, null);
            });
            console.log(`Sent updates to channel ${channelToSend.id}`);
        }
        else {
            console.log("No updates to announce.", new Date());
        }
    }
    console.log("Processed ALL publishers.");
}
