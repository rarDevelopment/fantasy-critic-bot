const Chariot = require('chariot.js');
const MessageColors = require('discord-helper-lib/MessageColors');
const MessageReplyDetails = require('discord-helper-lib/MessageReplyDetails.js');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const FantasyCriticApi = require('../api/FantasyCriticApi.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const ScoreRounder = require('../api/ScoreRounder.js');
const ranked = require('ranked');

class GetLeague extends Chariot.Command {
    constructor() {
        super();
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
        const leagueYearData = await FantasyCriticApi.getLeagueYear(
            leagueId,
            year
        );
        const leagueData = await FantasyCriticApi.getLeague(leagueId);

        if (!leagueYearData || !leagueData) {
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

        const rankedPublishers = ranked.ranking(
            leagueYearData.publishers,
            (pub) => pub.totalFantasyPoints
        );

        let message = rankedPublishers
            .sort((p1, p2) => {
                return p1.rank > p2.rank ? 1 : -1;
            })
            .map(
                (p) =>
                    `${p.rank}. ${p.item.publisherName} (${
                        p.item.playerName
                    }): **${ScoreRounder.round(p.item.totalFantasyPoints, 1)}**`
            )
            .join('\n');

        message += `\n\n[Visit League Page](https://www.fantasycritic.games/league/${leagueId}/${year})`;

        const messageToSend = new MessageWithEmbed(
            message,
            `${leagueData.leagueName} (${leagueYearData.leagueYear})`,
            null,
            `Requested by ${msg.author.username}`,
            new MessageReplyDetails(msg.id, true),
            this.MessageColors.RegularColor,
            null
        );
        this.MessageSender.sendMessage(
            messageToSend.buildMessage(),
            msg.channel,
            null
        );
    }
}
module.exports = new GetLeague();
