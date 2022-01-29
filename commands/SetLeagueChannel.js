const Chariot = require('chariot.js');
const MessageReplyDetails = require('discord-lib/MessageReplyDetails.js');
const MessageSender = require('discord-lib/MessageSender.js');
const MessageWithEmbed = require('discord-lib/MessageWithEmbed.js');
const RoleHelper = require('discord-lib/RoleHelper.js');
const MessageColors = require('discord-lib/MessageColors');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const resources = require("../settings/resources.json");

class SetLeagueChannel extends Chariot.Command {
    constructor() {
        super();
        this.name = 'setleague';
        this.cooldown = 2;
        this.help = {
            message: `Sets the league to be associated with the current channel`,
            usage: 'setleague [leagueGuid] [year]',
            example: ['setleague 11111111-aaaa-1111-aaaa-111111111111 2022'],
            inline: false
        }

        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args, chariot) {

        //const messageSender = new MessageSender();

        this.RoleHelper = new RoleHelper(resources.ownerId, [], resources.defaultAllowedPermissionNames);

        if (!this.RoleHelper.canAdministrate(msg.member)) {
            this.MessageSender.sendErrorMessage("You do not have permission to change this setting.", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        if (args.length < 2) {
            this.MessageSender.sendErrorMessage("Please provide both league ID and year.", args.join(" "), msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const leagueId = args[0];
        const year = args[1];

        const leagueYearData = await FantasyCriticApi.getLeague(leagueId);
        if (!leagueYearData) {
            this.MessageSender.sendErrorMessage("No league was found for that league ID and year combination.", args.join(" "), msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const success = await ConfigDataLayer.setLeagueChannel(leagueId, msg.channel.id, msg.guildID, msg.guild.name, year);

        if (success) {
            const messageText = `Channel Configured for ${leagueYearData.leagueName}`;

            const messageWithEmbed = new MessageWithEmbed(messageText,
                "Setting Channel League",
                null,
                `Requested by ${msg.author.username}`,
                new MessageReplyDetails(msg.id, false),
                new MessageColors().RegularColor,
                null);
            this.MessageSender.sendMessage(messageWithEmbed.buildMessage(), msg.channel, null);
        }
        else {
            this.MessageSender.sendErrorMessage("Failed to set league for channel", msg.content, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
        }
    }
}
module.exports = new SetLeagueChannel();