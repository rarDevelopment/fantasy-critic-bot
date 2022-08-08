const Eris = require('eris');
const MessageColors = require('discord-helper-lib/MessageColors');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const EmbedField = require('discord-helper-lib/EmbedField.js');
const FantasyCriticApi = require('../api/FantasyCriticApi.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const ScoreRounder = require('../api/ScoreRounder.js');
const resources = require('../settings/resources.json');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand.js');
const Message = require('discord-helper-lib/Message.js');

class GetPublisher extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'pub';
        this.description = `Get publisher information. You can search with just a portion of the name.`;
        this.cooldown = 0;
        this.help = {
            message: `Get publisher information. You can search with just a portion of the name`,
            usage: 'pub [player name | publisher name]',
            example: ['pub jeff', 'pub rar'],
            inline: true,
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;
        this.options = [
            {
                name: 'publisher_or_player_name',
                description: `The publisher name or player name that you're searching for.`,
                type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
                required: true
            }
        ];

        this.MessageColors = new MessageColors();
    }

    async execute(interaction) {
        const searchArg = interaction.data.options.find(o => o.name === "publisher_or_player_name");
        if (!searchArg) {
            const message = new Message(`You must provide a publisher search term.`);
            interaction.createMessage(message.buildMessage());
            return;
        }

        const termToSearch = searchArg.value.toLowerCase().trim();

        if (termToSearch.length < 2) {
            const message = new Message(`Please provide at least 3 characters to search with.`);
            interaction.createMessage(message.buildMessage());
            return;
        }

        const leagueChannel = await ConfigDataLayer.getLeagueChannel(interaction.channel.id, interaction.channel.guild.id);
        if (!leagueChannel) {
            const message = new Message(`No league configuration found for this channel.`);
            interaction.createMessage(message.buildMessage());
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const leagueYearData = await FantasyCriticApi.getLeagueYear(leagueId, new Date().getFullYear());

        const foundByPlayerName = leagueYearData.publishers.filter((p) =>
            p.playerName.toLowerCase().includes(termToSearch)
        );
        const foundByPublisherName = leagueYearData.publishers.filter((p) =>
            p.publisherName.toLowerCase().includes(termToSearch)
        );

        if (foundByPlayerName.length == 0 && foundByPublisherName.length == 0) {
            const messageToSend = new MessageWithEmbed(
                'No matches were found for your query.',
                'No Matches Found',
                null,
                `Requested by ${interaction.member.user.username}`,
                null,
                this.MessageColors.RegularColor,
                null
            );

            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        if (foundByPlayerName.length > 1 || foundByPublisherName.length > 1) {
            let message = '';

            if (foundByPlayerName.length > 0) {
                message += `Match by player name: ${foundByPlayerName.map((p) => p.playerName).join(', ')} \n`;
            }
            if (foundByPublisherName.length > 0) {
                message += `Match by publisher name: ${foundByPublisherName.map((p) => p.publisherName).join(', ')} \n`;
            }

            const messageToSend = new MessageWithEmbed(
                message,
                'Multiple Matches Found',
                null,
                `Requested by ${interaction.member.user.username}`,
                null,
                this.MessageColors.RegularColor,
                null
            );

            interaction.createMessage(messageToSend.buildMessage());

            return;
        }
        else if (foundByPlayerName.length > 0 && foundByPublisherName.length > 0) {
            let inBothLists = [];
            foundByPlayerName.forEach((f) => {
                const inOtherList = foundByPublisherName.find((p) => p.publisherID === f.publisherID);
                if (inOtherList) {
                    inBothLists.push(f);
                }
            });
            if (inBothLists.length !== foundByPlayerName.length) {
                let message = `Match by player name: ${foundByPlayerName.map((p) => p.playerName).join(', ')} \n`;
                message += `Match by publisher name: ${foundByPublisherName.map((p) => p.publisherName).join(', ')} \n`;
                const messageToSend = new MessageWithEmbed(
                    message,
                    'Multiple Matches Found',
                    null,
                    `Requested by ${interaction.member.user.username}`,
                    null,
                    this.MessageColors.RegularColor,
                    null
                );

                interaction.createMessage(messageToSend.buildMessage());
                return;
            }
        }

        //after all that, we should have just one publisher found

        let publisherGuid = null;

        if (foundByPlayerName && foundByPlayerName.length === 1) {
            publisherGuid = foundByPlayerName[0].publisherID;
        } else if (foundByPublisherName && foundByPublisherName.length === 1) {
            publisherGuid = foundByPublisherName[0].publisherID;
        }

        if (!publisherGuid) {
            const messageToSend = new Message('Something went wrong.');
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        const publisherData = await FantasyCriticApi.getPublisher(publisherGuid);

        const pickedGames = publisherData.games.filter((g) => !g.counterPick).sort((g) => g.slotNumber);
        const counterPickedGames = publisherData.games.filter((g) => g.counterPick).sort((g) => g.slotNumber);

        const gamesMessage = pickedGames.map((g) => this.makeGameMessage(g)).join('\n');
        const counterPickMessage = counterPickedGames.map((g) => this.makeGameMessage(g)).join('\n');

        const remainingWillReleaseDrops = publisherData.willReleaseDroppableGames === -1 ? '♾️' : publisherData.willReleaseDroppableGames - publisherData.willReleaseGamesDropped;
        const remainingWillNotReleaseDrops = publisherData.willNotReleaseDroppableGames === -1 ? '♾️' : publisherData.willNotReleaseDroppableGames - publisherData.willNotReleaseGamesDropped;
        const remainingFreeDrops = publisherData.freeDroppableGames === -1 ? '♾️' : publisherData.freeDroppableGames - publisherData.freeGamesDropped;

        const messageToSend = new MessageWithEmbed(
            `[Visit Publisher Page](${resources.publisherUrl}${publisherGuid}/)`,
            `${publisherData.publisherName} (Player: ${publisherData.playerName})`,
            [
                new EmbedField('Picks', gamesMessage, false),
                new EmbedField('Counterpicks', counterPickMessage, false),
                new EmbedField(
                    'Current Score',
                    ScoreRounder.round(publisherData.totalFantasyPoints, 1).toString(),
                    false
                ),
                new EmbedField('Remaining Budget', `$${publisherData.budget.toString()}`, false),
                new EmbedField(
                    `'Will Release' Drops Remaining`,
                    this.makeDropDisplay(remainingWillReleaseDrops, publisherData.willReleaseDroppableGames),
                    false
                ),
                new EmbedField(
                    `'Will Not Release' Drops Remaining`,
                    this.makeDropDisplay(remainingWillNotReleaseDrops, publisherData.willNotReleaseDroppableGames),
                    false
                ),
                new EmbedField(
                    `'Unrestricted' Drops Remaining`,
                    this.makeDropDisplay(remainingFreeDrops, publisherData.freeDroppableGames),
                    false
                ),
            ],
            `Requested by ${interaction.member.user.username}`,
            null,
            this.MessageColors.RegularColor,
            null
        );
        interaction.createMessage(messageToSend.buildMessage());
    }

    makeDropDisplay(remaining, total) {
        if (total === 0) {
            return 'N/A';
        }
        if (total === -1) {
            return '♾️';
        }
        return `${remaining}/${total}`;
    }

    makeGameMessage(g) {
        let gameMsg = `${g.gameName}`;
        if (g.fantasyPoints) {
            gameMsg += ` - Score: ${ScoreRounder.round(g.criticScore, 1)} - Points: ${ScoreRounder.round(
                g.fantasyPoints,
                1
            )}`;
        } else {
            if (g.releaseDate) {
                gameMsg += ` - ${g.releaseDate.substring(0, 10)}`;
            } else {
                gameMsg += ` - ${g.estimatedReleaseDate} (est)`;
            }
        }
        return gameMsg;
    }
}
module.exports = new GetPublisher();
