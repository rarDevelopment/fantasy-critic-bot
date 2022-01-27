const fetch = require('node-fetch');

const baseUrl = "https://www.fantasycritic.games/api/";

exports.getLeague = async function (leagueId, year) {
    const response = await fetch(`${baseUrl}league/getLeagueYear/?leagueID=${leagueId}&year=${year}`);
    const data = await response.json();
    // console.log(data.players);
    const publishers = data.publishers;
    //console.log(players);
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