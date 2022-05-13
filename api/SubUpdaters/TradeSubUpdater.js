const { DateTime } = require('luxon');

class TradeSubUpdater {
    async tradeUpdate(leagueYear, lastCheckDate, channelToSend, sendMessagesFunction) {
        let updatesToAnnounce = [];

        const activeTrades = leagueYear.activeTrades;
        const tradesProposedSinceLastCheck = activeTrades.filter(
            (trade) => DateTime.fromISO(trade.proposedTimestamp) > lastCheckDate
        );

        for (const proposedTrade of tradesProposedSinceLastCheck) {
            let header = `**${proposedTrade.proposerPublisherName}** has proposed a trade with **${proposedTrade.counterPartyPublisherName}**`;
            const message = this.getTradeMessage(proposedTrade, header, true);
            updatesToAnnounce.push(message);
        }

        const tradesAcceptedSinceLastCheck = activeTrades.filter(
            (trade) => trade.acceptedTimestamp && DateTime.fromISO(trade.acceptedTimestamp) > lastCheckDate
        );

        for (const acceptedTrade of tradesAcceptedSinceLastCheck) {
            let header = `**${acceptedTrade.counterPartyPublisherName}** has accepted a trade with **${acceptedTrade.proposerPublisherName}**`;
            const message = this.getTradeMessage(acceptedTrade, header, false);
            updatesToAnnounce.push(message);
        }

        sendMessagesFunction(updatesToAnnounce, '**Trade Updates!**', channelToSend);
    }

    getTradeMessage(trade, header, includeMessage) {
        let message = header + '\n';
        message += `**${trade.proposerPublisherName}** will receive: `;
        const counterPartySendGames = trade.counterPartySendGames
            .map((x) => `**${x.masterGameYear.gameName}**`)
            .join(' and ');
        if (counterPartySendGames) {
            message += counterPartySendGames;
        }

        if (trade.counterPartyBudgetSendAmount) {
            if (counterPartySendGames) {
                message += ' and ';
            }
            message += '**$' + trade.counterPartyBudgetSendAmount + ' of budget**';
        }

        message += `\n**${trade.counterPartyPublisherName}** will receive: `;
        const proposerSendGames = trade.proposerSendGames.map((x) => `**${x.masterGameYear.gameName}**`).join(' and ');
        if (proposerSendGames) {
            message += proposerSendGames;
        }

        if (trade.proposerBudgetSendAmount) {
            if (proposerSendGames) {
                message += ' and ';
            }
            message += '**$' + trade.proposerBudgetSendAmount + '** of budget';
        }

        if (includeMessage) {
            message += `\nMessage from ${trade.proposerPublisherName}: **${trade.message}**`;
        }

        return message;
    }
}

module.exports = new TradeSubUpdater();
