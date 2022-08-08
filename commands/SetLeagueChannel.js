const Eris = require('eris');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const RoleHelper = require('discord-helper-lib/RoleHelper.js');
const MessageColors = require('discord-helper-lib/MessageColors');
const FantasyCriticApi = require('../api/FantasyCriticApi.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const resources = require('../settings/resources.json');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand.js');
const Message = require('discord-helper-lib/Message.js');

class SetLeagueChannel extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'setleague';
        this.description = `Sets the league to be associated with the current channel.`;
        this.cooldown = 2;
        this.help = {
            message: `Sets the league to be associated with the current channel`,
            usage: 'setleague [leagueGuid] [year]',
            example: ['setleague 11111111-aaaa-1111-aaaa-111111111111 2022'],
            inline: false,
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;
        this.options = [
            {
                name: 'league_id',
                description: `The id for your league from the URL - https://www.fantasycritic.games/league/LEAGUE_ID_HERE/2022`,
                type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
                required: true
            },
            {
                name: 'year',
                description: `The year that you're playing for this league.`,
                type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
                required: true
            },
        ];

        this.MessageColors = new MessageColors();
    }

    async execute(interaction) {
        this.RoleHelper = new RoleHelper(process.env.OWNER, [], resources.defaultAllowedPermissionNames);

        if (!this.RoleHelper.canAdministrate(interaction.member)) {
            const messageToSend = new Message(`You do not have permission to change this setting.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        const leagueIdArg = interaction.data.options.find(o => o.name === "league_id");
        const yearArg = interaction.data.options.find(o => o.name === "year");

        if (!leagueIdArg) {
            const messageToSend = new Message(`Please provide a league ID.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        if (!yearArg) {
            const messageToSend = new Message(`Please provide a year.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        const leagueId = leagueIdArg.value;
        const year = yearArg.value;

        const leagueData = await FantasyCriticApi.getLeague(leagueId);
        if (!leagueData) {
            const messageToSend = new Message(`No league was found for that league ID.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        if (!leagueData.years.includes(parseInt(year))) {
            const messageToSend = new Message(`That league is not active in the year requested.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        const success = await ConfigDataLayer.setLeagueChannel(
            leagueId,
            interaction.channel.id,
            interaction.channel.guild.id,
            interaction.channel.guild.name,
            year
        );

        if (success) {
            const messageText = `Channel Configured for ${leagueData.leagueName}`;

            const messageWithEmbed = new MessageWithEmbed(
                messageText,
                'Setting Channel League',
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
module.exports = new SetLeagueChannel();
