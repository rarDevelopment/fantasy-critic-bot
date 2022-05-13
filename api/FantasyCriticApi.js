const fetch = require('node-fetch');

const baseUrl = 'https://www.fantasycritic.games/api/';

exports.getLeague = async function (leagueId) {
    const response = await fetch(`${baseUrl}league/getLeague/${leagueId}`);
    if (response.status === 200) {
        const data = await response.json();
        if (!data) {
            return null;
        }
        return {
            leagueId: data.leagueID,
            leagueName: data.leagueName,
            players: data.players,
            years: data.years,
        };
    }
    return null;
};

exports.getLeagueYear = async function (leagueId, year) {
    const response = await fetch(`${baseUrl}league/getLeagueYear/?leagueID=${leagueId}&year=${year}`);
    if (response.status === 200) {
        const data = await response.json();
        if (!data) {
            return null;
        }
        return {
            leagueId: data.leagueID,
            leagueYear: data.year,
            league: data.league,
            publishers: data.publishers,
            players: data.players,
            gameNews: data.gameNews,
            activeTrades: data.activeTrades,
            publicBiddingGames: data.publicBiddingGames,
        };
    }
    return null;
};

exports.getLeagueActions = async function (leagueId, year) {
    const response = await fetch(`${baseUrl}league/getLeagueActions/?leagueID=${leagueId}&year=${year}`);
    if (response.status === 200) {
        const data = await response.json();
        if (!data) {
            return null;
        }
        return data;
    }
    return null;
};

exports.getLeagueUpcoming = async function (leagueId, year) {
    const response = await fetch(`${baseUrl}league/LeagueUpcomingGames/?leagueID=${leagueId}&year=${year}`);
    if (response.status === 200) {
        const data = await response.json();
        if (!data) {
            return null;
        }
        return data;
    }
    return null;
};

exports.getPublisher = async function (guid) {
    const response = await fetch(`${baseUrl}league/getPublisher/${guid}`);
    const data = await response.json();
    return data;
};

exports.getMasterGameYear = async function (year) {
    const response = await fetch(`${baseUrl}game/mastergameyear/${year}`);
    const data = await response.json();
    const mgyData = data.map((g) => {
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
        };
    });
    return mgyData;
};
