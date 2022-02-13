const Chariot = require("chariot.js");
const mongoose = require("mongoose");
require("dotenv").config();
const GameUpdater = require('./api/GameUpdater.js');
const LeagueUpdater = require('./api/LeagueUpdater.js');
const ScoreUpdater = require('./api/ScoreUpdater.js');
const ConfigDataLayer = require('./api/ConfigDataLayer.js');
const { createServer } = require('http');
const ws = require('ws');
const resources = require('./settings/resources.json');
const CheckTypes = require('./api/CheckTypes.js');

class FantasyCriticInterim extends Chariot.Client {
    constructor() {
        super(new Chariot.Config(
            process.env.BOT_TOKEN,
            {
                prefix: ["fc.", "Fc.", "FC.", "fC."],
                defaultHelpCommand: true,
                primaryColor: 'ORANGE',
                excludeDirectories: ['jobs'],
                owner: [
                    "234356032099450890"
                ]
            },
            {
                messageLimit: 50,
                defaultImageFormat: 'png',
                getAllUsers: true,
                //intents: 32571
            }
        ));

        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@discordbots.ywjdt.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

        mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoose.connection.once('open', function () {
            console.log("Connected to MongoDB");
        });

        this.editStatus('online', { name: 'fc.help', type: 0 });

        const server = createServer();
        server.listen(resources.botPort);

        const wsServer = new ws.Server({
            server
        });
        let connections = [];

        const guildsToProcess = this.guilds;

        wsServer.on('connection', (socket) => {
            connections.push(socket);
            socket.on('message', async (msg) => {
                try {
                    const payload = JSON.parse(msg);
                    console.log(payload);
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
}

module.exports = new FantasyCriticInterim();
