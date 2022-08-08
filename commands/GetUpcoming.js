const Eris = require('eris');
const MessageColors = require('discord-helper-lib/MessageColors');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const FantasyCriticApi = require('../api/FantasyCriticApi.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const DateCleaner = require('../api/DateCleaner.js');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand.js');

class GetUpcoming extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'upcoming';
        this.description = `Get upcoming releases for publishers in the league.`;
        this.cooldown = 2;
        this.aliases = ['up'];
        this.help = {
            message: `Get upcoming releases for publishers in the league.`,
            usage: 'upcoming',
            example: ['upcoming'],
            inline: true,
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;

        this.MessageColors = new MessageColors();
    }

    async execute(interaction) {
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(interaction.channel.id, interaction.channel.guild.id);
        if (!leagueChannel) {
            const message = new Message(`No league configuration found for this channel.`);
            interaction.createMessage(message.buildMessage());
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const year = new Date().getFullYear();
        const upcomingGamesData = await FantasyCriticApi.getLeagueUpcoming(leagueId, year);

        if (!upcomingGamesData) {
            const message = new Message(`No data found for the league with ID ${leagueId}.`);
            interaction.createMessage(message.buildMessage());
            return;
        }

        const willReleaseUpcomingGamesData = upcomingGamesData.filter((g) => !g.masterGame.isReleased);

        const sorted = willReleaseUpcomingGamesData.sort((g1, g2) => {
            return g1.maximumReleaseDate > g2.maximumReleaseDate ? 1 : -1; //descending
        });
        const message = sorted
            .map((g) => `**${DateCleaner.clean(g.estimatedReleaseDate)}** - ${g.gameName} (${g.publisherName})`)
            .join('\n');

        const messageToSend = new MessageWithEmbed(
            message,
            `Upcoming Publisher Releases`,
            null,
            `Requested by ${interaction.member.user.username}`,
            null,
            this.MessageColors.RegularColor,
            null
        );
        interaction.createMessage(messageToSend.buildMessage());
    }
}
module.exports = new GetUpcoming();
