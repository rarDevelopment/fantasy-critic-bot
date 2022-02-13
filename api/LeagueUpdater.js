const Message = require('discord-lib/Message');
const MessageSender = require('discord-lib/MessageSender.js');
const FantasyCriticApi = require("../api/FantasyCriticApi.js");
const FCDataLayer = require("../api/FCDataLayer.js");
const CheckTypes = require("../api/CheckTypes.js");
const { DateTime } = require('luxon');
const resources = require("../settings/resources.json");
const MessageArrayJoiner = require('discord-lib/MessageArrayJoiner.js');

exports.sendLeagueUpdatesToLeagueChannels = async function (guilds, leagueChannels) {
    const yearToCheck = new Date().getFullYear();
    const guildsToSend = guilds.filter(g => leagueChannels.map(l => l.guildId).includes(g.id));

    for (const leagueChannel of leagueChannels) {

        const leagueActions = await FantasyCriticApi.getLeagueActions(leagueChannel.leagueId, yearToCheck);
        const lastCheckTime = await FCDataLayer.getLastCheckTime(CheckTypes.LEAGUE_ACTION_CHECK);
        const currentDateToSave = DateTime.now().toISO();
        if (!lastCheckTime) {
            console.log("creating");
            await FCDataLayer.updateLastCheckTime({ checkType: CheckTypes.LEAGUE_ACTION_CHECK, checkDate: currentDateToSave });
        }
        const lastCheckDate = DateTime.fromISO(lastCheckTime ? lastCheckTime.checkDate : currentDateToSave);

        const datedLeagueActions = leagueActions.map(leagueAction => {
            return {
                date: DateTime.fromISO(leagueAction.timestamp),
                publisherName: leagueAction.publisherName,
                actionType: leagueAction.actionType,
                description: leagueAction.description,
                managerAction: leagueAction.managerAction,
            };
        });

        const filteredLeagueActions = datedLeagueActions.filter(l => l.date > lastCheckDate);
        await FCDataLayer.updateLastCheckTime({ checkType: CheckTypes.LEAGUE_ACTION_CHECK, checkDate: currentDateToSave });
        let updatesToAnnounce = filteredLeagueActions.map(l => `**${l.publisherName}** ${l.description} (at ${l.date.toLocaleString(DateTime.DATETIME_FULL)})`);
        const messageSender = new MessageSender();

        const guildToSend = guildsToSend.find(g => g.id === leagueChannel.guildId);
        if (!guildToSend) {
            console.log(`Could not find guild with id ${leagueChannel.guildId}`)
            return;
        }
        const channelToSend = guildToSend.channels.find(c => c.id === leagueChannel.channelId);
        if (!channelToSend) {
            console.log(`Could not find channel with id ${leagueChannel.channelId}`);
            return;
        }

        if (updatesToAnnounce.length > 0) {
            const messageArrayJoiner = new MessageArrayJoiner();
            const messageArray = messageArrayJoiner.buildMessageArrayFromStringArray(updatesToAnnounce, resources.maxMessageLength, `**League Action Updates!**`);

            if (messageArray.length > 10) {
                console.log("Attempting to send more than 10 messages at once", messageArray);
            }

            messageArray.forEach(message => {
                const messageToSend = new Message(
                    message,
                    null
                );
                messageSender.sendMessage(messageToSend.buildMessage(), channelToSend, null);
            });
            console.log(`Sent updates to channel ${channelToSend.id}`);
        }
        else {
            console.log("No updates to announce.", new Date());
        }
    }
    console.log("Processed ALL league actions.");
}
