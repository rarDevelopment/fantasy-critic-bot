const fetch = require('node-fetch');

const baseUrl = "https://www.fantasycritic.games/api/";

exports.getLeague = async function (leagueId, year) {
    const response = await fetch(`${baseUrl}league/getLeagueYear/?leagueID=${leagueId}&year=${year}`);
    const data = await response.json();
    const publishers = data.publishers;
    return {
        leagueId: data.leagueID,
        leagueYear: data.year,
        publishers: publishers
    };
}

exports.getPublisher = async function (guid, year) {
    const response = await fetch(`${baseUrl}league/getPublisher/${guid}`);
    const data = await response.json();
    return data;
}

exports.getMasterGameYear = async function (year) {
    const response = await fetch(`${baseUrl}game/mastergameyear/${year}`);
    const data = await response.json();
    const mgyData = data.map(g => {
        return {
            masterGameID: g.masterGameID,
            year: g.year,
            gameName: g.gameName,
            estimatedReleaseDate: g.estimatedReleaseDate,
            releaseDate: g.releaseDate,
            isReleased: g.isReleased,
            willRelease: g.willRelease,
            criticScore: g.criticScore,
            addedTimestamp: g.addedTimestamp,
        }
    });
    return mgyData;
}