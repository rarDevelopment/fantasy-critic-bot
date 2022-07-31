const Eris = require("eris");
const mongoose = require('mongoose');
const GetLeague = require("./commands/GetLeague.js");
const GetLeagueLink = require("./commands/GetLeagueLink.js");
const GetPublisher = require("./commands/GetPublisher.js");
const GetPublisherGame = require("./commands/GetPublisherGame.js");
const GetUpcoming = require("./commands/GetUpcoming.js");
const SetLeagueChannel = require("./commands/SetLeagueChannel.js");
const Version = require("./commands/Version.js");
const SocketMessageListener = require('./jobs/SocketMessageListener.js');
const CommandRegistration = require('discord-helper-lib/CommandRegistration');
require('dotenv').config();

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
    prefix: ["fc.", "Fc.", "fC.", "FC."],
    description: "Fantasy Critic Bot"
});

bot.once("ready", function (evt) {
    new CommandRegistration().registerCommands(bot, commands);
    SocketMessageListener.listenOnSocket(this.guilds);
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
});

bot.on("error", (err) => {
    console.error(err);
});

bot.connect();
