const { MasterGameListItem } = require("../models/MasterGameListItem");
const { PublisherScore } = require("../models/PublisherScore.js");


exports.getMasterGameList = async function (year) {
    return MasterGameListItem.find({ year: year }).exec();
}

exports.getPublisherScores = async function (leagueId) {
    return PublisherScore.find({ leagueID: leagueId }).exec();
}

function createMasterGameListItem(gameData) {
    return new MasterGameListItem(gameData);
}

function createPublisherScore(publisherScoreData) {
    return new PublisherScore(publisherScoreData);
}

exports.updateMasterGameList = async function (gameData) {
    for (const g of gameData) {
        await MasterGameListItem.findOne({ masterGameID: g.masterGameID }).exec()
            .then(gameFound => {
                if (!gameFound) {
                    gameFound = createMasterGameListItem(g);
                }
                else {
                    gameFound.gameName = g.gameName;
                    gameFound.estimatedReleaseDate = g.estimatedReleaseDate;
                    gameFound.releaseDate = g.releaseDate;
                    gameFound.isReleased = g.isReleased;
                    gameFound.willRelease = g.willRelease;
                    gameFound.criticScore = g.criticScore;
                }
                return gameFound.save().catch(err => {
                    console.log("Error saving game to DB", err);
                });
            });
    }
}

exports.updatePublisherScores = async function (publisherScoreData) {
    for (const p of publisherScoreData) {
        await MasterGameListItem.findOne({ publisherID: p.publisherID, leagueID: p.leagueID }).exec()
            .then(publisherScoreFound => {
                if (!publisherScoreFound) {
                    publisherScoreFound = createPublisherScore(p);
                }
                else {
                    publisherScoreFound.totalFantasyPoints = p.totalFantasyPoints;
                    publisherScoreFound.publisherName = p.publisherName;
                    publisherScoreFound.playerName = p.playerName;
                }
                return publisherScoreFound.save().catch(err => {
                    console.log("Error saving publisher score to DB", err);
                });
            });
    }
}

//for initial loading
exports.initMasterGameList = async function (gameData) {
    let count = 0;
    for (const g of gameData) {
        const gameToAdd = createMasterGameListItem(g);
        await gameToAdd.save().catch(err => {
            console.log("Error saving game to DB", err);
        });
        count += 1;
    }
    console.log("Finished updating!", count);
}

exports.initPublisherScores = async function (publisherScores) {
    let count = 0;
    for (const p of publisherScores) {
        const publisherScoreToAdd = createPublisherScore(p);
        await publisherScoreToAdd.save().catch(err => {
            console.log("Error saving publisher score to DB", err);
        });
        count += 1;
    }
    console.log("Finished saving publisher scores!", count);
}

