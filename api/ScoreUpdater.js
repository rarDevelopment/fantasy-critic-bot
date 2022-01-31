const Message = require('discord-lib/Message');
const MessageSender = require('discord-lib/MessageSender.js');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const FCDataLayer = require("../api/FCDataLayer.js");

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

        let publisherScoresToUpdate = [];
        let updatesToAnnounce = [];

        publishersApiData.forEach(publisherScoreToCheck => {
            const publisherInCache = publisherScoreCache.find(p => p.publisherID === publisherScoreToCheck.publisherID);

            const nameToShow = `${publisherScoreToCheck.publisherName} (Player: ${publisherScoreToCheck.playerName})`;

            if (!publisherInCache) {
                publisherScoresToUpdate.push(publisherScoreToCheck);
                updatesToAnnounce.push(`**${nameToShow}** now has a score of **${publisherScoreToCheck.totalFantasyPoints}**`);
            }
            else {
                if (publisherScoreToCheck.totalFantasyPoints !== publisherInCache.totalFantasyPoints) {
                    publisherScoresToUpdate.push(publisherScoreToCheck);
                    if (!publisherInCache.totalFantasyPoints) {
                        updatesToAnnounce.push(`**${nameToShow}** now has a score of **${publisherScoreToCheck.totalFantasyPoints}**`);
                    }
                    else {
                        const scoreDiff = publisherInCache.totalFantasyPoints - publisherScoreToCheck.totalFantasyPoints;
                        const direction = scoreDiff < 0 ? "UP" : "DOWN";
                        updatesToAnnounce.push(`**${nameToShow}**'s score has gone **${direction}** from **${publisherInCache.totalFantasyPoints}** to **${publisherScoreToCheck.totalFantasyPoints}**`);
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

        console.log(publisherScoreToCheck);
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
            let message = `**Publisher Updates!**\n`;
            updatesToAnnounce.forEach(updateMessage => {
                message += `${updateMessage}\n`;
            });
            const messageToSend = new Message(
                message,
                null
            );
            messageSender.sendMessage(messageToSend.buildMessage(), channelToSend, null);
        }
        else {
            console.log("No updates to announce.", new Date());
        }
    }
    console.log("Updated ALL scores.");
}