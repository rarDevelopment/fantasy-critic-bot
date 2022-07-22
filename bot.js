const Eris = require("eris");
const mongoose = require('mongoose');
const GetLeague = require("./commands/GetLeague.js");
const GetLeagueLink = require("./commands/GetLeagueLink.js");
const GetPublisher = require("./commands/GetPublisher.js");
const GetPublisherGame = require("./commands/GetPublisherGame.js");
const GetUpcoming = require("./commands/GetUpcoming.js");
const SetLeagueChannel = require("./commands/SetLeagueChannel.js");
const Version = require("./commands/Version.js");
require('dotenv').config();
const SocketMessageListener = require('./jobs/SocketMessageListener.js');

const commands = [
    GetLeague,
    GetLeagueLink,
    GetPublisher,
    GetPublisherGame,
    GetUpcoming,
    SetLeagueChannel,
    Version
];

const bot = new Eris.CommandClient(process.env.BOT_TOKEN, {}, {
    getAllUsers: true,
    intents: 32571,
    owner: "rarDevelopment",
    prefix: "fc.",
    description: "Fantasy Critic Bot"
});

bot.on("ready", function (evt) {
    console.log(`Logged in as: ${bot.user.username} (${bot.user.id})`);

    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.MONGO_SUBDOMAIN}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
    mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    mongoose.connection.once('open', function () {
        console.log('Connected to MongoDB');
    });

    this.editStatus('online', { name: 'fc.help', type: 0 });
    SocketMessageListener.listenOnSocket(this.guilds);

    commands.forEach(command => {
        bot.registerCommand(command.name, command.execute.bind(command), {
            description: command.help.usage,
            fullDescription: command.help.message
        });
        if (command.aliases) {
            command.aliases.forEach(alias => {
                bot.registerCommandAlias(alias, command.name);
            });
        }
    });
});

bot.on("error", (err) => {
    console.error(err);
});

bot.connect();
