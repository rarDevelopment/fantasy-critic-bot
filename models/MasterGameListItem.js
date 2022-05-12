const mongoose = require('mongoose');

const masterGameListItemSchema = new mongoose.Schema(
    {
        masterGameID: String,
        year: Number,
        gameName: String,
        estimatedReleaseDate: String,
        releaseDate: String,
        isReleased: Boolean,
        willRelease: Boolean,
        criticScore: Number,
        addedTimestamp: String,
    },
    { collection: 'mastergamelistitem' }
);

module.exports = {
    MasterGameListItem: mongoose.model(
        'mastergamelistitem',
        masterGameListItemSchema,
        'mastergamelistitem'
    ),
};
