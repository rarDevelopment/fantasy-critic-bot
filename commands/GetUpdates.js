const Chariot = require('chariot.js');
const MessageColors = require('discord-lib/MessageColors');
const MessageReplyDetails = require('discord-lib/MessageReplyDetails.js');
const MessageSender = require('discord-lib/MessageSender.js');
const MessageWithEmbed = require('discord-lib/MessageWithEmbed.js');
const Message = require('discord-lib/Message');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const channelLeagueMap = require("../channelLeagueMap.json");
const FCDataLayer = require("../api/FCDataLayer.js");

class GetLeague extends Chariot.Command {
    constructor() {
        super();
        this.name = 'updates';
        this.cooldown = 5;
        this.help = {
            message: `Get updates manually.`,
            usage: 'updates',
            example: ['updates'],
            inline: true
        }

        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args, chariot) {

        const yearToCheck = new Date().getFullYear();

        const masterGameYearApiData = await FantasyCriticApi.getMasterGameYear(yearToCheck);

        const masterGameCache = await FCDataLayer.getMasterGameList(yearToCheck);

        let gamesToUpdate = [];
        let updatesToAnnounce = [];

        masterGameYearApiData.forEach(gameToCheck => {
            const gameInCache = masterGameCache.find(g => g.masterGameID === gameToCheck.masterGameID);
            if (!gameInCache) {
                gamesToUpdate.push(gameToCheck);
                updatesToAnnounce.push(`New Game Added: **${gameToCheck.gameName}**`);
            }
            else {
                if (gameToCheck.gameName !== gameInCache.gameName) {
                    gamesToUpdate.push(gameToCheck);
                    updatesToAnnounce.push(`Game Name Change: **${gameInCache.gameName}** renamed to **${gameToCheck.gameName}**`);
                }
                if (gameToCheck.estimatedReleaseDate !== gameInCache.estimatedReleaseDate) {
                    gamesToUpdate.push(gameToCheck);
                    updatesToAnnounce.push(`Estimated Release Date Change: **${gameToCheck.gameName}** estimated release date changed from **${gameInCache.estimatedReleaseDate}** to **${gameToCheck.estimatedReleaseDate}**`);
                }
                if (gameToCheck.releaseDate !== gameInCache.releaseDate) {
                    gamesToUpdate.push(gameToCheck);
                    updatesToAnnounce.push(`Release Date Change: **${gameToCheck.gameName}** release date changed from **${gameInCache.releaseDate}** to **${gameToCheck.releaseDate}**`);
                }
                if (gameToCheck.isReleased !== gameInCache.isReleased) {
                    gamesToUpdate.push(gameToCheck);
                    if (gameToCheck.isReleased) {
                        updatesToAnnounce.push(`**${gameToCheck.gameName}** has released!`);
                    }
                    else {
                        updatesToAnnounce.push(`**${gameToCheck.gameName}**'s status has changed to "not released" for some reason, check on this.`);
                    }
                }
                if (gameToCheck.willRelease !== gameInCache.willRelease) {
                    gamesToUpdate.push(gameToCheck);
                    if (gameToCheck.willRelease) {
                        updatesToAnnounce.push(`**${gameToCheck.gameName}** will release this year!`);
                    }
                    else {
                        updatesToAnnounce.push(`**${gameToCheck.gameName}** will NOT release this year.`);
                    }
                }
                if (gameToCheck.criticScore !== gameInCache.criticScore) {
                    gamesToUpdate.push(gameToCheck);
                    if (!gameInCache.criticScore) {
                        updatesToAnnounce.push(`**${gameToCheck.gameName}** now has a critic score of ${gameToCheck.criticScore}.`);
                    }
                    else {
                        const scoreDiff = gameInCache.criticScore - gameToCheck.criticScore;
                        const direction = scoreDiff < 0 ? "UP" : "DOWN";
                        updatesToAnnounce.push(`Critic Score Change: **${gameToCheck.gameName}**'s critic score has gone **${direction}** from **${gameInCache.criticScore}** to **${gameToCheck.criticScore}**`);
                    }
                }
            }
        });

        await FCDataLayer.updateMasterGameList(gamesToUpdate);

        if (updatesToAnnounce.length > 50) {
            console.log(updatesToAnnounce);
            const messageToSend = new Message(
                "Too many updates to send. Log has been created, please check it.",
                null
            );
            this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
        }
        else if (updatesToAnnounce.length > 0) {
            let message = `**Updates!**\n`;
            updatesToAnnounce.forEach(updateMessage => {
                message += `${updateMessage}\n`;
            });
            const messageToSend = new Message(
                message,
                null
            );
            this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
        }
        else {
            console.log("No updates to announce.", new Date());
        }
    }
}
module.exports = new GetLeague();