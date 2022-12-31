const Eris = require('eris');
const MessageColors = require('discord-helper-lib/MessageColors');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed');
const ScoreRounder = require('../api/ScoreRounder');

module.exports = class DownloadNewBotCommand extends DiscordSlashCommand {
    constructor(name, description) {
        super();
        this.name = name;
        this.description = description;
        this.cooldown = 2;
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;

        this.MessageColors = new MessageColors();
    }

    async execute(interaction) {

        var header = "Bot has been replaced!";
        var message = `This bot has been replaced! You should use the new, **Official Fantasy Critic Discord Bot**, which can be found on the [community page on the website (click here)](https://www.fantasycritic.games/community).`;

        const messageToSend = new MessageWithEmbed(
            message,
            header,
            null,
            null,
            null,
            this.MessageColors.RegularColor,
            null
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
//module.exports = new DownloadNewBotCommand();
