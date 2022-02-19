const { createServer } = require('http');
const ws = require('ws');
const GameUpdater = require('../api/GameUpdater.js');
const LeagueUpdater = require('../api/LeagueUpdater.js');
const ScoreUpdater = require('../api/ScoreUpdater.js');
const ConfigDataLayer = require('../api/ConfigDataLayer.js');
const resources = require('../settings/resources.json');
const CheckTypes = require('../api/CheckTypes.js');

exports.listenOnSocket = function (guildsToProcess) {
    const server = createServer();
    server.listen(resources.botPort);

    const wsServer = new ws.Server({
        server
    });

    let connections = [];

    wsServer.on('connection', (socket) => {
        connections.push(socket);
        socket.on('message', async (msg) => {
            try {
                const payload = JSON.parse(msg);
                if (payload.checkToDo) {
                    const leagueChannels = await ConfigDataLayer.getLeagueChannels();
                    switch (payload.checkToDo) {
                        case CheckTypes.GAME_UPDATER_CHECK:
                            await GameUpdater.sendGameUpdatesToLeagueChannels(guildsToProcess, leagueChannels);
                            break;
                        case CheckTypes.SCORE_UPDATER_CHECK:
                            await ScoreUpdater.sendPublisherScoreUpdatesToLeagueChannels(guildsToProcess, leagueChannels);
                            break;
                        case CheckTypes.LEAGUE_ACTION_CHECK:
                            await LeagueUpdater.sendLeagueUpdatesToLeagueChannels(guildsToProcess, leagueChannels);
                            break;
                        default:
                            console.log("Received invalid check option", payload.checkToDo);
                    }
                }
                else {
                    console.log("Received invalid payload", payload);
                }
            }
            catch (error) {
                console.log("Error handling message on WebSocket", error);
            }
        });
        socket.on('close', () => {
            connections = connections.filter(s => s !== socket);
        })
    });
}
