const Chariot = require('chariot.js');
const packageJson = require('../package.json');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed');
const MessageReplyDetails = require('discord-helper-lib/MessageReplyDetails');
const MessageSender = require('discord-helper-lib/MessageSender');
const MessageColors = require('discord-helper-lib/MessageColors');

class Version extends Chariot.Command {
    BotDisplayName = 'FC Interim Bot';

    constructor() {
        super();
        this.name = 'version';
        this.aliases = ['v'];
        this.cooldown = 0;
        this.help = {
            message: `Get the bot's version number.`,
            usage: 'version',
            example: ['version', 'v'],
            inline: true,
        };
        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args, chariot) {
        const messageToSend = new MessageWithEmbed(
            `${this.BotDisplayName} is at version **${packageJson.version}**`,
            'Bot Version',
            null,
            `Requested by ${msg.author.username}`,
            new MessageReplyDetails(msg.id, false),
            this.MessageColors.RegularColor,
            null
        );
        this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
    }
}

module.exports = new Version();
