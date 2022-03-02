const Chariot = require('chariot.js');
const MessageColors = require('discord-lib/MessageColors');
const MessageReplyDetails = require('discord-lib/MessageReplyDetails.js');
const MessageSender = require('discord-lib/MessageSender.js');
const MessageWithEmbed = require('discord-lib/MessageWithEmbed.js');
const EmbedField = require('discord-lib/EmbedField.js')
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const ScoreRounder = require('../api/ScoreRounder.js');
const resources = require('../settings/resources.json');

class GetPublisher extends Chariot.Command {
    constructor() {
        super();
        this.name = 'pub';
        this.cooldown = 0;
        this.help = {
            message: `Get publisher information. You can search with just a portion of the name`,
            usage: 'pub [player name | publisher name]',
            example: ['pub jeff', 'pub bronsonia'],
            inline: true
        }

        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args, chariot) {

        if (args < 1) {
            this.MessageSender.sendErrorMessage("You must provide a publisher search term", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const termToSearch = args[0].toLowerCase().trim();

        if (termToSearch.length < 2) {
            this.MessageSender.sendErrorMessage("Please provide at least 3 characters to search with", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const leagueChannel = await ConfigDataLayer.getLeagueChannel(msg.channel.id, msg.guildID);
        if (!leagueChannel) {
            this.MessageSender.sendErrorMessage("No league configuration found for this channel.", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const leagueYearData = await FantasyCriticApi.getLeagueYear(leagueId, new Date().getFullYear());

        const foundByPlayerName = leagueYearData.publishers.filter(p => p.playerName.toLowerCase().includes(termToSearch));
        const foundByPublisherName = leagueYearData.publishers.filter(p => p.publisherName.toLowerCase().includes(termToSearch));

        if (foundByPlayerName.length == 0 && foundByPublisherName.length == 0) {
            const messageToSend = new MessageWithEmbed(
                "No matches were found for your query.",
                "No Matches Found",
                null,
                `Requested by ${msg.author.username}`,
                new MessageReplyDetails(msg.id, true),
                this.MessageColors.RegularColor,
                null
            );

            this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
            return;
        }

        if (foundByPlayerName.length > 1 || foundByPublisherName.length > 1) {
            let message = "";

            if (foundByPlayerName.length > 0) {
                message += `Match by player name: ${foundByPlayerName.map(p => p.playerName).join(", ")} \n`;
            }
            if (foundByPublisherName.length > 0) {
                message += `Match by publisher name: ${foundByPublisherName.map(p => p.publisherName).join(", ")} \n`;
            }

            const messageToSend = new MessageWithEmbed(
                message,
                "Multiple Matches Found",
                null,
                `Requested by ${msg.author.username}`,
                new MessageReplyDetails(msg.id, true),
                this.MessageColors.RegularColor,
                null
            );

            this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);

            return;
        }
        else if (foundByPlayerName.length > 0 && foundByPublisherName.length > 0) {
            let inBothLists = [];
            foundByPlayerName.forEach(f => {
                const inOtherList = foundByPublisherName.find(p => p.publisherID === f.publisherID);
                if (inOtherList) {
                    inBothLists.push(f);
                }
            });
            if (inBothLists.length !== foundByPlayerName.length) {
                let message = `Match by player name: ${foundByPlayerName.map(p => p.playerName).join(", ")} \n`;
                message += `Match by publisher name: ${foundByPublisherName.map(p => p.publisherName).join(", ")} \n`;
                const messageToSend = new MessageWithEmbed(
                    message,
                    "Multiple Matches Found",
                    null,
                    `Requested by ${msg.author.username}`,
                    new MessageReplyDetails(msg.id, true),
                    this.MessageColors.RegularColor,
                    null
                );

                this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);

                return;
            }
        }

        //after all that, we should have just one publisher found

        let publisherGuid = null;

        if (foundByPlayerName && foundByPlayerName.length === 1) {
            publisherGuid = foundByPlayerName[0].publisherID;
        }
        else if (foundByPublisherName && foundByPublisherName.length === 1) {
            publisherGuid = foundByPublisherName[0].publisherID;
        }

        if (!publisherGuid) {
            this.MessageSender.sendErrorMessage("Something went wrong.", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const publisherData = await FantasyCriticApi.getPublisher(publisherGuid);

        const pickedGames = publisherData.games.filter(g => !g.counterPick).sort(g => g.slotNumber);
        const counterPickedGames = publisherData.games.filter(g => g.counterPick).sort(g => g.slotNumber);

        const gamesMessage = pickedGames.map(g => this.makeGameMessage(g)).join('\n');
        const counterPickMessage = counterPickedGames.map(g => this.makeGameMessage(g)).join('\n');

        const messageToSend = new MessageWithEmbed(
            `[Visit Publisher Page](${resources.publisherUrl}${publisherGuid}/)`,
            `${publisherData.publisherName} (Player: ${publisherData.playerName})`,
            [
                new EmbedField('Picks', gamesMessage, false),
                new EmbedField('Counterpicks', counterPickMessage, false),
                new EmbedField('Current Score', ScoreRounder.round(publisherData.totalFantasyPoints, 1).toString(), false),
                new EmbedField('Remaining Budget', `$${publisherData.budget.toString()}`, false),
                new EmbedField('Drops Remaining (for games that Will Release)', publisherData.willReleaseDroppableGames, false),
            ],
            `Requested by ${msg.author.username}`,
            new MessageReplyDetails(msg.id, true),
            this.MessageColors.RegularColor,
            null
        );
        this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
    }

    makeGameMessage(g) {
        let gameMsg = `${g.gameName}`;
        if (g.fantasyPoints) {
            gameMsg += ` - Score: ${ScoreRounder.round(g.criticScore, 1)} - Points: ${ScoreRounder.round(g.fantasyPoints, 1)}`;
        }
        else {
            if (g.releaseDate) {
                gameMsg += ` - ${g.releaseDate.substring(0, 10)}`;
            }
            else {
                gameMsg += ` - ${g.estimatedReleaseDate} (est)`;
            }
        }
        return gameMsg;
    }
}
module.exports = new GetPublisher();
