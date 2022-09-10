const Eris = require('eris');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const RoleHelper = require('discord-helper-lib/RoleHelper.js');
const MessageColors = require('discord-helper-lib/MessageColors');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const resources = require('../settings/resources.json');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand.js');
const Message = require('discord-helper-lib/Message.js');

class UnsetLeagueChannel extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'unsetleague';
        this.description = `Unsets the league associated with the current channel.`;
        this.cooldown = 2;
        this.help = {
            message: `Unsets the league associated with the current channel.`,
            usage: 'unsetleague',
            example: ['unsetleague'],
            inline: false,
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;

        this.MessageColors = new MessageColors();
    }

    async execute(interaction) {
        this.RoleHelper = new RoleHelper(process.env.OWNER, [], resources.defaultAllowedPermissionNames);

        if (!this.RoleHelper.canAdministrate(interaction.member)) {
            const messageToSend = new Message(`You do not have permission to change this setting.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        const success = await ConfigDataLayer.unsetLeagueChannel(
            interaction.channel.id,
            interaction.channel.guild.id
        );

        if (success) {
            const messageText = `Channel Configuration removed for this channel. Messages will no longer be posted here.`;
            const messageWithEmbed = new MessageWithEmbed(
                messageText,
                'Unsetting Channel League',
                null,
                `Requested by ${interaction.member.user.username}`,
                null,
                new MessageColors().RegularColor,
                null
            );
            interaction.createMessage(messageWithEmbed.buildMessage());
        } else {
            const messageToSend = new Message(`Failed to set league for channel.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }
    }
}
module.exports = new UnsetLeagueChannel();
