const MessageColors = require('discord-helper-lib/MessageColors');
const MessageReplyDetails = require('discord-helper-lib/MessageReplyDetails.js');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const FantasyCriticApi = require('../api/FantasyCriticApi.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const ScoreRounder = require('../api/ScoreRounder.js');
const ranked = require('ranked');

class GetLeague {
    constructor() {
        this.name = 'league';
        this.cooldown = 2;
        this.help = {
            message: `Get league information.`,
            usage: 'league',
            example: ['league'],
            inline: true,
        };

        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args) {
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(msg.channel.id, msg.guildID);
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
        const leagueYearData = await FantasyCriticApi.getLeagueYear(leagueId, year);

        if (!leagueYearData) {
            this.MessageSender.sendErrorMessage(
                `No league found with ID ${leagueId}.`,
                null,
                msg.author.username,
                msg.channel,
                new MessageReplyDetails(msg.id, true),
                null
            );
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
        const footer = `Requested by ${msg.author.username}`;

        const messageToSend = new MessageWithEmbed(
            message,
            header,
            null,
            footer,
            new MessageReplyDetails(msg.id, true),
            this.MessageColors.RegularColor,
            null,
            leagueLink
        );
        this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
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
        publisherLine += `> ${publisher.gamesReleased}/${
            publisher.gamesWillRelease + publisher.gamesReleased
        } games released`;

        return publisherLine;
    }
}
module.exports = new GetLeague();
