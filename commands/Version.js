const Eris = require('eris');
const packageJson = require('../package.json');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed');
const MessageColors = require('discord-helper-lib/MessageColors');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand');

class Version extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'version';
        this.description = "See the bot's current version number."
        this.aliases = ['v'];
        this.cooldown = 0;
        this.help = {
            message: `Get the bot's version number.`,
            usage: 'version',
            example: ['version', 'v'],
            inline: true
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;
    }

    async execute(interaction) {
        const messageToSend = new MessageWithEmbed(
            `${packageJson.name} is at version **${packageJson.version}**`,
            "Bot Version",
            null,
            `Requested by ${interaction.member.username}`,
            null,
            new MessageColors().RegularColor,
            null);
        interaction.createMessage(messageToSend.buildMessage());
    }
}

module.exports = new Version();
