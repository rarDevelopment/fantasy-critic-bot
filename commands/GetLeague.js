const Chariot = require('chariot.js');
const MessageColors = require('discord-lib/MessageColors');
const MessageReplyDetails = require('discord-lib/MessageReplyDetails.js');
const MessageSender = require('discord-lib/MessageSender.js');
const MessageWithEmbed = require('discord-lib/MessageWithEmbed.js');
const Configurer = require('../settings/Configurer.js');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const channelLeagueMap = require("../channelLeagueMap.json");

class GetLeague extends Chariot.Command {
    constructor() {
        super();
        this.name = 'league';
        this.cooldown = 2;
        this.help = {
            message: `Get league information.`,
            usage: 'league',
            example: ['league'],
            inline: true
        }

        this.Configurer = new Configurer();
        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args, chariot) {
        const leagueId = channelLeagueMap[0][msg.channel.id];
        const leagueYearData = await FantasyCriticApi.getLeague(leagueId, new Date().getFullYear());

        let message = leagueYearData.publishers.sort((p1, p2) => {
            return p1.totalFantasyPoints > p2.totalFantasyPoints ? -1 : 1; //descending
        })
            .map(p => `${p.publisherName} (${p.playerName}): **${p.totalFantasyPoints}**`)
            .join("\n");

        const messageToSend = new MessageWithEmbed(
            message,
            leagueYearData.leagueYear,
            null,
            `Requested by ${msg.author.username}`,
            new MessageReplyDetails(msg.id, true),
            this.MessageColors.RegularColor,
            null
        );
        this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
    }
}
module.exports = new GetLeague();