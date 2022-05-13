const Message = require('discord-helper-lib/Message');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const FantasyCriticApi = require('./FantasyCriticApi.js');
const FCDataLayer = require('./FCDataLayer.js');
const resources = require('../settings/resources.json');
const MessageArrayJoiner = require('discord-helper-lib/MessageArrayJoiner.js');
const CheckTypes = require('./CheckTypes.js');
const { DateTime } = require('luxon');
const PublisherScoreSubUpdater = require('./SubUpdaters/PublisherScoreSubUpdater');
const TradeSubUpdater = require('./SubUpdaters/TradeSubUpdater');

exports.sendPublisherScoreUpdatesToLeagueChannels = async function (guilds, leagueChannels) {
    const yearToCheck = new Date().getFullYear();
    const guildsToSend = guilds.filter((g) => leagueChannels.map((l) => l.guildId).includes(g.id));

    for (const leagueChannel of leagueChannels) {
        const leagueYear = await FantasyCriticApi.getLeagueYear(leagueChannel.leagueId, yearToCheck);

        const guildToSend = guildsToSend.find((g) => g.id === leagueChannel.guildId);
        if (!guildToSend) {
            console.log(`Could not find guild with id ${leagueChannel.guildId}`);
            continue;
        }
        const channelToSend = guildToSend.channels.find((c) => c.id === leagueChannel.channelId);
        if (!channelToSend) {
            console.log(`Could not find channel with id ${leagueChannel.channelId}`);
            continue;
        }

        const currentDateToSave = DateTime.now().toISO();
        const lastCheckTime = await FCDataLayer.getLastCheckTime(CheckTypes.LEAGUE_YEAR_UPDATER_CHECK);
        if (!lastCheckTime) {
            console.log('creating');
            await FCDataLayer.updateLastCheckTime({
                checkType: CheckTypes.LEAGUE_YEAR_UPDATER_CHECK,
                checkDate: currentDateToSave,
            });
        }
        const lastCheckDate = DateTime.fromISO(lastCheckTime ? lastCheckTime.checkDate : currentDateToSave);

        await PublisherScoreSubUpdater.scoreUpdate(leagueYear, channelToSend, sendMessages);
        await TradeSubUpdater.tradeUpdate(leagueYear, lastCheckDate, channelToSend, sendMessages);

        await FCDataLayer.updateLastCheckTime({
            checkType: CheckTypes.LEAGUE_YEAR_UPDATER_CHECK,
            checkDate: currentDateToSave,
        });
    }
    console.log('Processed ALL leagues.');
};

function sendMessages(updatesToAnnounce, header, channelToSend) {
    const messageSender = new MessageSender();

    if (updatesToAnnounce.length > 0) {
        const messageArrayJoiner = new MessageArrayJoiner();
        const messageArray = messageArrayJoiner.buildMessageArrayFromStringArray(
            updatesToAnnounce,
            resources.maxMessageLength,
            header
        );

        if (messageArray.length > 10) {
            console.log('Attempting to send more than 10 messages at once', messageArray);
        }

        messageArray.forEach((message) => {
            const messageToSend = new Message(message, null);
            messageSender.sendMessage(messageToSend.buildMessage(), channelToSend, null);
        });
        console.log(`Sent updates to channel ${channelToSend.id}`);
    } else {
        console.log('No updates to announce.', new Date());
    }
}
