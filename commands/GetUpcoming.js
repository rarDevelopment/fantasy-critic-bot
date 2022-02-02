const Chariot = require('chariot.js');
const MessageColors = require('discord-lib/MessageColors');
const MessageReplyDetails = require('discord-lib/MessageReplyDetails.js');
const MessageSender = require('discord-lib/MessageSender.js');
const MessageWithEmbed = require('discord-lib/MessageWithEmbed.js');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const DateCleaner = require('../api/DateCleaner.js');

class GetUpcoming extends Chariot.Command {
    constructor() {
        super();
        this.name = 'upcoming';
        this.cooldown = 2;
        this.aliases = ['up']
        this.help = {
            message: `Get upcoming releases for publishers in the league.`,
            usage: 'upcoming',
            example: ['upcoming'],
            inline: true
        }

        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args, chariot) {
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(msg.channel.id, msg.guildID);
        if (!leagueChannel) {
            this.MessageSender.sendErrorMessage("No league configuration found for this channel.", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const year = new Date().getFullYear();
        const upcomingGamesData = await FantasyCriticApi.getLeagueUpcoming(leagueId, year);

        if (!upcomingGamesData) {
            this.MessageSender.sendErrorMessage(`No data found for the league with ID ${leagueId}.`, null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const willReleaseUpcomingGamesData = upcomingGamesData.filter(g => !g.masterGame.isReleased);

        const sorted = willReleaseUpcomingGamesData.sort((g1, g2) => {
            return g1.maximumReleaseDate > g2.maximumReleaseDate ? 1 : -1; //descending
        });
        const message = sorted
            .map(g => `**${DateCleaner.clean(g.estimatedReleaseDate)}** - ${g.gameName} (${g.publisherName})`)
            .join("\n");

        const messageToSend = new MessageWithEmbed(
            message,
            `Upcoming Publisher Releases`,
            null,
            `Requested by ${msg.author.username}`,
            new MessageReplyDetails(msg.id, true),
            this.MessageColors.RegularColor,
            null
        );
        this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
    }
}
module.exports = new GetUpcoming();