const Eris = require("eris");
const mongoose = require('mongoose');
const GetLeague = require("./commands/GetLeague");
const GetLeagueLink = require("./commands/GetLeagueLink");
const GetPublisher = require("./commands/GetPublisher");
const GetPublisherGame = require("./commands/GetPublisherGame");
const GetUpcoming = require("./commands/GetUpcoming");
const SetLeagueChannel = require("./commands/SetLeagueChannel");
const DownloadNewBotCommand = require("./commands/DownloadNewBotCommand");
const Version = require("./commands/Version");
const SocketMessageListener = require('./jobs/SocketMessageListener');
const CommandRegistration = require('discord-helper-lib/CommandRegistration');
const EventRegistration = require('discord-helper-lib/EventRegistration');
const MessageCreate = require("./events/MessageCreate");
const UnSetLeagueChannel = require("./commands/UnSetLeagueChannel");
require('dotenv').config();

const bot = new Eris.CommandClient(process.env.BOT_TOKEN, {}, {
    getAllUsers: true,
    intents: 32571,
    owner: "rarDevelopment",
    prefix: ["fc.", "Fc.", "fC.", "FC."],
    description: "Fantasy Critic Bot"
});

const commands = [
    new DownloadNewBotCommand(GetLeague.name, GetLeague.description),
    new DownloadNewBotCommand(GetLeagueLink.name, GetLeagueLink.description),
    new DownloadNewBotCommand(GetPublisher.name, GetPublisher.description),
    new DownloadNewBotCommand(GetPublisherGame.name, GetPublisherGame.description),
    new DownloadNewBotCommand(GetUpcoming.name, GetUpcoming.description),
    new DownloadNewBotCommand(SetLeagueChannel.name, SetLeagueChannel.description),
    new DownloadNewBotCommand(UnSetLeagueChannel.name, UnSetLeagueChannel.description),
    new DownloadNewBotCommand(Version.name, Version.description),
];

const events = [
    new MessageCreate(bot)
];

bot.once("ready", async function (evt) {
    await new CommandRegistration().registerSlashCommands(bot, commands);
    SocketMessageListener.listenOnSocket(this.guilds);
});

new EventRegistration().registerEvents(bot, events);


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
});

bot.on("interactionCreate", (interaction) => {
    if (interaction instanceof Eris.CommandInteraction) {
        new CommandRegistration().setUpSlashCommand(interaction, commands);
    }
});

bot.on("error", (err) => {
    console.error(err);
});

bot.connect();
