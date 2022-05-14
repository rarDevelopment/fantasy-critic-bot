const mongoose = require('mongoose');

const publisherScoreSchema = new mongoose.Schema(
    {
        publisherID: String,
        leagueID: String,
        publisherName: String,
        playerName: String,
        totalFantasyPoints: Number,
    },
    { collection: 'publisherscore' }
);

module.exports = {
    PublisherScore: mongoose.model('publisherscore', publisherScoreSchema, 'publisherscore'),
};
