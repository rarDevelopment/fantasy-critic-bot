const Chariot = require('chariot.js');
const MessageColors = require('discord-lib/MessageColors');
const MessageReplyDetails = require('discord-lib/MessageReplyDetails.js');
const MessageSender = require('discord-lib/MessageSender.js');
const MessageWithEmbed = require('discord-lib/MessageWithEmbed.js');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const ScoreRounder = require('../api/ScoreRounder.js');
const EmbedField = require('discord-lib/EmbedField');
const resources = require('../settings/resources.json');

class GetLeague extends Chariot.Command {
    constructor() {
        super();
        this.name = 'pubgame';
        this.cooldown = 2;
        this.help = {
            message: `Get a game from publishers in the league.`,
            usage: 'pubgame [game name]',
            example: ['pubgame Titanfall 2', 'pubgame mario'],
            inline: true
        }

        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async execute(msg, args, chariot) {
        const leagueChannel = await ConfigDataLayer.getLeagueChannel(msg.channel.id, msg.guildID);
        if (!leagueChannel) {
            this.MessageSender.sendErrorMessage("No league configuration found for this channel.", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        if (args.length < 1) {
            this.MessageSender.sendErrorMessage("You must specify a game name to search.", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        let gameNameToSearch = args.join(' ');
        gameNameToSearch = gameNameToSearch.trim().toLowerCase();
        gameNameToSearch = this.stripAccentedCharactersAndStuff(gameNameToSearch);

        if (gameNameToSearch.length <= 2) {
            this.MessageSender.sendErrorMessage("Please provide at least 3 characters to search with", null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const leagueId = leagueChannel.leagueId;
        const year = new Date().getFullYear();
        const leagueYearData = await FantasyCriticApi.getLeagueYear(leagueId, year);

        if (!leagueYearData) {
            this.MessageSender.sendErrorMessage(`No league found with ID ${leagueId}.`, null, msg.author.username, msg.channel, new MessageReplyDetails(msg.id, true), null);
            return;
        }

        const publishersWithFilteredGames = leagueYearData.publishers
            .map(p => {
                return {
                    publisherName: p.publisherName,
                    playerName: p.playerName,
                    games: p.games
                        .filter(g => this.stripAccentedCharactersAndStuff(g.gameName.toLowerCase()).includes(gameNameToSearch))
                        .map(g => {
                            return {
                                gameName: g.gameName,
                                estimatedReleaseDate: g.estimatedReleaseDate,
                                releaseDate: g.releaseDate,
                                fantasyPoints: g.fantasyPoints,
                                counterPick: g.counterPick,
                                isReleased: g.masterGame.isReleased,
                                masterGameId: g.masterGame.masterGameID
                            }
                        })
                }
            });

        const publishersWithMatchingGames = publishersWithFilteredGames
            .filter(p => p.games.length > 0);

        const matchingPickedGames = publishersWithMatchingGames
            .map(p =>
                this.buildMessageFromGamesArray(p.games, p, false)
            );

        const matchingCounterPickedGames = publishersWithFilteredGames
            .map(p =>
                this.buildMessageFromGamesArray(p.games, p, true)
            );

        const picksMessage = matchingPickedGames.length >= 0 ? matchingPickedGames.map(m => m.join("\n")).join("\n") : "";
        const counterPicksMessage = matchingCounterPickedGames.length >= 0 ? matchingCounterPickedGames.map(m => m.join("\n")).join("\n") : "";

        let embedFieldsToAdd = [];

        if (picksMessage.trim() !== "") {
            embedFieldsToAdd.push(new EmbedField("Picks Found", picksMessage, false));
        }
        if (counterPicksMessage.trim() !== "") {
            embedFieldsToAdd.push(new EmbedField("Counterpicks Found", counterPicksMessage, false));
        }

        const messageToSend = new MessageWithEmbed(
            embedFieldsToAdd.length === 0 ? "No games found." : null,
            `Games Found`,
            embedFieldsToAdd,
            `Requested by ${msg.author.username}`,
            new MessageReplyDetails(msg.id, true),
            this.MessageColors.RegularColor,
            null
        );

        this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
    }

    buildMessageFromGamesArray(games, publisher, isCounterPick) {
        return games
            .filter(g => g.counterPick === isCounterPick)
            .map(g => {
                const scoreOrDate = `${g.isReleased ? (g.fantasyPoints !== null ? ScoreRounder.round(g.fantasyPoints, 1) : "0") + " points" : g.estimatedReleaseDate}`;
                const gameName = g.masterGameId ? `[${g.gameName}](${resources.masterGameUrl}${g.masterGameId})` : g.gameName;
                const gameString = `${publisher.publisherName} (${publisher.playerName}) - **${gameName}** (${scoreOrDate})`;
                return gameString;
            });
    }

    stripAccentedCharactersAndStuff(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
}
module.exports = new GetLeague();
