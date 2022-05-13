const Chariot = require('chariot.js');
const MessageReplyDetails = require('discord-helper-lib/MessageReplyDetails.js');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const Message = require('discord-helper-lib/Message.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');

class GetLeagueLink extends Chariot.Command {
    constructor() {
        super();
        this.name = 'link';
        this.cooldown = 2;
        this.help = {
            message: `Get a direct link to your league page.`,
            usage: 'link',
            example: ['link'],
            inline: true,
        };

        this.MessageSender = new MessageSender();
    }

    async execute(msg, args, chariot) {
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(
            msg.channel.id,
            msg.guildID
        );
        if (!leagueChannel) {
            this.MessageSender.sendErrorMessage(
                'No league configuration found for this channel.',
                null,
                msg.author.username,
                msg.channel,
                new MessageReplyDetails(msg.id, true),
                null
            );
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const year = new Date().getFullYear();

        const leagueUrl = `https://www.fantasycritic.games/league/${leagueId}/${year}`;

        const messageToSend = new Message(
            leagueUrl,
            new MessageReplyDetails(msg.id, true)
        );
        this.MessageSender.sendMessage(
            messageToSend.buildMessage(),
            msg.channel,
            null
        );
    }
}
module.exports = new GetLeagueLink();
