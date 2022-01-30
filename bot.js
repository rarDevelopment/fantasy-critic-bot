const Chariot = require("chariot.js");
const mongoose = require("mongoose");
require("dotenv").config();
const cron = require('node-cron');
const GameUpdater = require('./api/GameUpdater.js');
const LeagueUpdater = require('./api/LeagueUpdater.js');
const ScoreUpdater = require('./api/ScoreUpdater.js');
const ConfigDataLayer = require('./api/ConfigDataLayer.js');

class FantasyCriticInterim extends Chariot.Client {
    constructor() {
        super(new Chariot.Config(
            process.env.BOT_TOKEN,
            {
                prefix: ["fc.", "Fc.", "FC.", "fC."],
                defaultHelpCommand: true,
                primaryColor: 'ORANGE',
                excludeDirectories: [],
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

        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@discordbots.ywjdt.mongodb.net/fcinterimbot?retryWrites=true&w=majority`;

        mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoose.connection.once('open', function () {
            console.log("Connected to MongoDB");
        });

        this.editStatus('online', { name: 'fc.help', type: 0 });

        cron.schedule(`15 * * * *`, async () => {
            const leagueChannels = await ConfigDataLayer.getLeagueChannels();
            await GameUpdater.sendGameUpdatesToLeagueChannels(this.guilds, leagueChannels);
        });

        // const minutes = new Date().getMinutes() + 1;
        // console.log(minutes);
        // cron.schedule(`${minutes} * * * *`, async () => {
        //     const leagueChannels = await ConfigDataLayer.getLeagueChannels();
        //     await LeagueUpdater.sendLeageUpdatesToLeagueChannels(this.guilds, leagueChannels);
        // });

        cron.schedule(`30 * * * *`, async () => {
            const leagueChannels = await ConfigDataLayer.getLeagueChannels();
            await ScoreUpdater.sendPublisherScoreUpdatesToLeagueChannels(this.guilds, leagueChannels);
        });

    }
}

module.exports = new FantasyCriticInterim();