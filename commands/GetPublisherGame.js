const Eris = require('eris');
const MessageColors = require('discord-helper-lib/MessageColors');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const FantasyCriticApi = require('../api/FantasyCriticApi.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const ScoreRounder = require('../api/ScoreRounder.js');
const EmbedField = require('discord-helper-lib/EmbedField');
const resources = require('../settings/resources.json');
const Message = require('discord-helper-lib/Message.js');
const DiscordSlashCommand = require('discord-helper-lib/DiscordSlashCommand.js');

class GetLeague extends DiscordSlashCommand {
    constructor() {
        super();
        this.name = 'game';
        this.description = `Get a game from publishers in the league.`;
        this.cooldown = 2;
        this.help = {
            message: `Get a game from publishers in the league.`,
            usage: 'pubgame [game name]',
            example: ['pubgame Titanfall 2', 'pubgame mario'],
            inline: true,
        };
        this.type = Eris.Constants.ApplicationCommandTypes.CHAT_INPUT;
        this.options = [
            {
                name: 'game_name',
                description: `The game name that you're searching for.`,
                type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
                required: true
            }
        ];

        this.MessageColors = new MessageColors();
    }

    async execute(interaction) {
        const searchArg = interaction.data.options.find(o => o.name === "game_name");
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(interaction.channel.id, interaction.channel.guild.id);
        if (!leagueChannel) {
            const messageToSend = new Message(`No league configuration found for this channel.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        if (!searchArg) {
            const messageToSend = new Message(`You must specify a game name to search.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        let gameNameToSearch = searchArg.value;
        gameNameToSearch = gameNameToSearch.trim().toLowerCase();
        gameNameToSearch = this.stripAccentedCharactersAndStuff(gameNameToSearch);

        if (gameNameToSearch.length <= 2) {
            const messageToSend = new Message(`Please provide at least 3 characters to search with.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const year = new Date().getFullYear();
        const leagueYearData = await FantasyCriticApi.getLeagueYear(leagueId, year);

        if (!leagueYearData) {
            const messageToSend = new Message(`No league found with ID ${leagueId}.`);
            interaction.createMessage(messageToSend.buildMessage());
            return;
        }

        const publishersWithFilteredGames = leagueYearData.publishers.map((p) => {
            return {
                publisherName: p.publisherName,
                playerName: p.playerName,
                games: p.games
                    .filter((g) =>
                        this.stripAccentedCharactersAndStuff(g.gameName.toLowerCase()).includes(gameNameToSearch)
                    )
                    .map((g) => {
                        return {
                            gameName: g.gameName,
                            estimatedReleaseDate: g.estimatedReleaseDate,
                            releaseDate: g.releaseDate,
                            fantasyPoints: g.fantasyPoints,
                            counterPick: g.counterPick,
                            isReleased: g.masterGame.isReleased,
                            masterGameId: g.masterGame.masterGameID,
                        };
                    }),
            };
        });

        const publishersWithMatchingGames = publishersWithFilteredGames.filter((p) => p.games.length > 0);

        const matchingPickedGames = publishersWithMatchingGames.map((p) =>
            this.buildMessageFromGamesArray(p.games, p, false)
        );

        const matchingCounterPickedGames = publishersWithFilteredGames.map((p) =>
            this.buildMessageFromGamesArray(p.games, p, true)
        );

        const picksMessage =
            matchingPickedGames.length >= 0 ? matchingPickedGames.map((m) => m.join('\n')).join('\n') : '';
        const counterPicksMessage =
            matchingCounterPickedGames.length >= 0
                ? matchingCounterPickedGames.map((m) => m.join('\n')).join('\n')
                : '';

        let embedFieldsToAdd = [];

        if (picksMessage.trim() !== '') {
            embedFieldsToAdd.push(new EmbedField('Picks Found', picksMessage, false));
        }
        if (counterPicksMessage.trim() !== '') {
            embedFieldsToAdd.push(new EmbedField('Counterpicks Found', counterPicksMessage, false));
        }

        const messageToSend = new MessageWithEmbed(
            embedFieldsToAdd.length === 0 ? 'No games found.' : null,
            `Games Found`,
            embedFieldsToAdd,
            `Requested by ${interaction.member.user.username}`,
            null,
            this.MessageColors.RegularColor,
            null
        );

        interaction.createMessage(messageToSend.buildMessage());
    }

    buildMessageFromGamesArray(games, publisher, isCounterPick) {
        return games
            .filter((g) => g.counterPick === isCounterPick)
            .map((g) => {
                const scoreOrDate = `${g.isReleased
                    ? (g.fantasyPoints !== null ? ScoreRounder.round(g.fantasyPoints, 1) : '0') + ' points'
                    : g.estimatedReleaseDate
                    }`;
                const gameName = g.masterGameId
                    ? `[${g.gameName}](${resources.masterGameUrl}${g.masterGameId})`
                    : g.gameName;
                const gameString = `${publisher.publisherName} (${publisher.playerName}) - **${gameName}** (${scoreOrDate})`;
                return gameString;
            });
    }

    stripAccentedCharactersAndStuff(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}
module.exports = new GetLeague();
