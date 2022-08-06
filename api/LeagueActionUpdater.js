const Message = require('discord-helper-lib/Message');
const MessageSender = require('discord-helper-lib/MessageSender.js');
const FantasyCriticApi = require('./FantasyCriticApi.js');
const FCDataLayer = require('./FCDataLayer.js');
const CheckTypes = require('./CheckTypes.js');
const { DateTime } = require('luxon');
const resources = require('../settings/resources.json');
const MessageArrayJoiner = require('discord-helper-lib/MessageArrayJoiner.js');

exports.sendLeagueUpdatesToLeagueChannels = async function (guilds, leagueChannels) {
    const yearToCheck = new Date().getFullYear();
    const guildsToSend = guilds.filter((g) => leagueChannels.map((l) => l.guildId).includes(g.id));

    const currentDateToSave = DateTime.now().toISO();

    for (const leagueChannel of leagueChannels) {
        const leagueActions = await FantasyCriticApi.getLeagueActions(leagueChannel.leagueId, yearToCheck);
        if (!leagueActions) {
            console.error(`Could not find league actions for league ${leagueChannel.leagueId} for channel ${leagueChannel.channelId} in guild ${leagueChannel.guildId} (${leagueChannel.guildName})`);
            continue;
        }
        const lastCheckTime = await FCDataLayer.getLastCheckTime(CheckTypes.LEAGUE_ACTION_CHECK);
        if (!lastCheckTime) {
            console.log('creating last check time for league action checks for the first time');
            await FCDataLayer.updateLastCheckTime({
                checkType: CheckTypes.LEAGUE_ACTION_CHECK,
                checkDate: currentDateToSave,
            });
        }
        const lastCheckDate = DateTime.fromISO(lastCheckTime ? lastCheckTime.checkDate : currentDateToSave);
        const datedLeagueActions = leagueActions.map((leagueAction) => {
            return {
                date: DateTime.fromISO(leagueAction.timestamp),
                publisherName: leagueAction.publisherName,
                actionType: leagueAction.actionType,
                description: leagueAction.description,
                managerAction: leagueAction.managerAction,
            };
        });

        const filteredLeagueActions = datedLeagueActions.filter((l) => l.date > lastCheckDate);
        let updatesToAnnounce = filteredLeagueActions.map(
            (l) => `**${l.publisherName}** ${l.description} (at ${l.date.toLocaleString(DateTime.DATETIME_FULL)})`
        );
        const messageSender = new MessageSender();

        const guildToSend = guildsToSend.find((g) => g.id === leagueChannel.guildId);
        if (!guildToSend) {
            console.error(`Could not find guild with id ${leagueChannel.guildId}`);
            continue;
        }
        const channelToSend = guildToSend.channels.find((c) => c.id === leagueChannel.channelId);
        if (!channelToSend) {
            console.error(`Could not find channel with id ${leagueChannel.channelId}`);
            continue;
        }

        if (updatesToAnnounce.length > 0) {
            const messageArrayJoiner = new MessageArrayJoiner();
            const messageArray = messageArrayJoiner.buildMessageArrayFromStringArray(
                updatesToAnnounce,
                resources.maxMessageLength,
                `**League Action Updates!**`
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
    await FCDataLayer.updateLastCheckTime({
        checkType: CheckTypes.LEAGUE_ACTION_CHECK,
        checkDate: currentDateToSave,
    });
    console.log('Processed ALL league actions.');
};
