const Eris = require('eris');
const Message = require('discord-helper-lib/Message.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand.js');

class GetLeagueLink extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'link';
        this.description = `Get a direct link to your league page.`;
        this.cooldown = 2;
        this.help = {
            message: `Get a direct link to your league page.`,
            usage: 'link',
            example: ['link'],
            inline: true,
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;
    }

    async execute(interaction) {
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(interaction.channel.id, interaction.channel.guild.id);
        if (!leagueChannel) {
            interaction.createMessage('**Something went wrong:** No league configuration found for this channel.');
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const year = new Date().getFullYear();

        const leagueUrl = `https://www.fantasycritic.games/league/${leagueId}/${year}`;

        const messageToSend = new Message(leagueUrl);
        interaction.createMessage(messageToSend.buildMessage());
    }
}
module.exports = new GetLeagueLink();
