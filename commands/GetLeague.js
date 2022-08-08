const Eris = require('eris');
const MessageColors = require('discord-helper-lib/MessageColors');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed');
const FantasyCriticApi = require('../api/FantasyCriticApi');
const ConfigDataLayer = require('../api/ConfigDataLayer');
const ScoreRounder = require('../api/ScoreRounder');
const ranked = require('ranked');

class GetLeague extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'league';
        this.description = `Get league information.`;
        this.cooldown = 2;
        this.help = {
            message: `Get league information.`,
            usage: 'league',
            example: ['league'],
            inline: true,
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;

        this.MessageColors = new MessageColors();
    }

    async execute(interaction) {
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(interaction.channel.id, interaction.channel.guild.id);
        if (!leagueChannel) {
            interaction.createMessage('**Something went wrong:** No league configuration found for this channel.');
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const year = new Date().getFullYear();
        const leagueYearData = await FantasyCriticApi.getLeagueYear(leagueId, year);

        if (!leagueYearData) {
            interaction.createMessage(`**Something went wrong:** No league found with ID ${leagueId}.`);
            return;
        }

        const rankedPublishers = ranked.ranking(leagueYearData.players, (pub) => pub.totalFantasyPoints);

        let message = rankedPublishers
            .sort((p1, p2) => {
                return p1.rank > p2.rank ? 1 : -1;
            })
            .map((p) => this.getPublisherLine(p.rank, p.item, p.item.publisher))
            .join('\n');

        const leagueLink = `https://www.fantasycritic.games/league/${leagueId}/${year}`;
        const header = `${leagueYearData.league.leagueName} (${leagueYearData.leagueYear})`;
        const footer = `Requested by ${interaction.member.user.username}`;

        const messageToSend = new MessageWithEmbed(
            message,
            header,
            null,
            footer,
            null,
            this.MessageColors.RegularColor,
            null,
            leagueLink
        );
        interaction.createMessage(messageToSend.buildMessage());
    }

    getPublisherLine(rank, player, publisher) {
        let crownEmoji = '';
        if (player.previousYearWinner) {
            crownEmoji = ' 👑';
        }
        let publisherIcon = '';
        if (publisher.publisherIcon) {
            publisherIcon = publisher.publisherIcon + ' ';
        }
        let publisherLine = `**${rank}.** `;
        publisherLine += `${publisherIcon}**${publisher.publisherName}** `;
        publisherLine += `(${publisher.playerName})${crownEmoji} \n`;
        publisherLine += `> **${ScoreRounder.round(publisher.totalFantasyPoints, 1)} points** `;
        publisherLine += `*(Projected: ${ScoreRounder.round(publisher.totalProjectedPoints, 1)})*\n`;
        publisherLine += `> ${publisher.gamesReleased}/${publisher.gamesWillRelease + publisher.gamesReleased
            } games released`;

        return publisherLine;
    }
}
module.exports = new GetLeague();
