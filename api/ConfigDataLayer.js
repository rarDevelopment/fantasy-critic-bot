const { LeagueChannel } = require('../models/LeagueChannel');

function createLeagueChannelConfig(leagueId, channelId, guildId, guildName, year) {
    return new LeagueChannel({
        leagueId: leagueId,
        channelId: channelId,
        guildId: guildId,
        guildName: guildName,
        year: year,
    });
}

exports.getLeagueChannels = function () {
    return LeagueChannel.find().exec();
};

exports.getLeagueChannel = function (channelId, guildId) {
    return LeagueChannel.findOne({
        channelId: channelId,
        guildId: guildId,
    }).exec();
};

exports.setLeagueChannel = function (leagueId, channelId, guildId, guildName, year) {
    return LeagueChannel.findOne({ channelId: channelId, guildId: guildId })
        .exec()
        .then((leagueChannelFound) => {
            if (!leagueChannelFound) {
                leagueChannelFound = createLeagueChannelConfig(leagueId, channelId, guildId, guildName, year);
            } else {
                leagueChannelFound.leagueId = leagueId;
                leagueChannelFound.channelId = channelId;
                leagueChannelFound.guildName = guildName;
                leagueChannelFound.year = year;
            }

            return leagueChannelFound
                .save()
                .then(() => {
                    return true;
                })
                .catch((err) => {
                    console.error('Error saving league channel setting.', err);
                    return false;
                });
        });
};

exports.unsetLeagueChannel = function (channelId, guildId) {
    return LeagueChannel.deleteOne({ channelId: channelId, guildId: guildId })
        .exec()
        .then((response) => {
            return response;
        }).catch(err => {
            console.log("Error deleting channel", err);
        });
};
