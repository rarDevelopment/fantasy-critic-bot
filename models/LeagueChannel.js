const mongoose = require('mongoose');

const leagueChannelSchema = new mongoose.Schema(
    {
        leagueId: String,
        channelId: String,
        guildId: String,
        guildName: String,
        year: Number,
    },
    { collection: 'leaguechannel' }
);

module.exports = {
    LeagueChannel: mongoose.model(
        'leaguechannel',
        leagueChannelSchema,
        'leaguechannel'
    ),
};
