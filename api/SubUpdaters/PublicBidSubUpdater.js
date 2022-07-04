const { DateTime } = require('luxon');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const MessageColors = require('discord-helper-lib/MessageColors');
const MessageWithEmbed = require('discord-helper-lib/MessageWithEmbed.js');
const DateCleaner = require('../DateCleaner.js');
const ScoreRounder = require('../ScoreRounder.js');

class PublicBidSubUpdater {
    constructor() {
        this.MessageSender = new MessageSender();
        this.MessageColors = new MessageColors();
    }

    async publicBidUpdate(leagueYear, lastCheckDate, channelToSend) {
        if (!leagueYear.publicBiddingGames || leagueYear.publicBiddingGames.masterGames.length === 0) {
            return;
        }

        const posted = DateTime.fromISO(leagueYear.publicBiddingGames.postedTimestamp);

        if (lastCheckDate > posted) {
            return;
        }

        let gameMessages = [];
        for (const publicBid of leagueYear.publicBiddingGames.masterGames) {
            let gameMessage = '';
            const releaseDate = DateCleaner.clean(publicBid.masterGame.estimatedReleaseDate);
            gameMessage += `**${publicBid.masterGame.gameName}**`;

            if (publicBid.counterPick) {
                gameMessage += ' (🎯 Counter Pick Bid)';
            }

            gameMessage += '\n';
            gameMessage += `> Release Date: ${releaseDate}\n`;

            const roundedHypeFactor = ScoreRounder.round(publicBid.masterGame.dateAdjustedHypeFactor, 1);
            gameMessage += `> Hype Factor: ${roundedHypeFactor}\n`;
            gameMessages.push(gameMessage);
        }

        const leagueLink = `https://www.fantasycritic.games/league/${leagueYear.leagueId}/${leagueYear.leagueYear}`;
        const finalMessage = gameMessages.join('\n');
        const footer = `${leagueYear.league.leagueName} (${leagueYear.leagueYear})`;
        const lastSunday = this.getLastSunday(new Date());
        const dateString = lastSunday.toLocaleDateString('en-us', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const header = `Public bids (Week of ${dateString})`;

        const messageToSend = new MessageWithEmbed(
            finalMessage,
            header,
            null,
            footer,
            null,
            this.MessageColors.RegularColor,
            null,
            leagueLink
        );

        this.MessageSender.sendMessage(messageToSend.buildMessage(), channelToSend, null);
    }

    getLastSunday(d) {
        let t = new Date(d);
        t.setDate(t.getDate() - t.getDay());
        return t;
    }
}

module.exports = new PublicBidSubUpdater();
