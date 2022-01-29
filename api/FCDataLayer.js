const { MasterGameListItem } = require("../models/MasterGameListItem");

function createMasterGameListItem(gameData) {
    return new MasterGameListItem(gameData);
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

exports.getMasterGameList = async function (year) {
    return MasterGameListItem.find({ year: year }).exec();
}