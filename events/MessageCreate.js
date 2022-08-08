const MessageSender = require("discord-helper-lib/MessageSender");
const MessageWithEmbed = require("discord-helper-lib/MessageWithEmbed");
const MessageReplyDetails = require("discord-helper-lib/MessageReplyDetails");
const MessageColors = require("discord-helper-lib/MessageColors");
const DiscordEvent = require("discord-helper-lib/DiscordEvent");

module.exports = class MessageCreate extends DiscordEvent {
    constructor(bot) {
        super('messageCreate', bot);
    }

    async execute(msg) {
        if (msg.author.bot) {
            return;
        }

        const messageSender = new MessageSender();

        if (msg.content.toLowerCase().startsWith('fc.')) {
            const messageToSend = new MessageWithEmbed(
                `Commands will now be run with **slash commands**! Type \`/\` at the start of your message and choose from the commands that display. If this bot's commands still aren't showing in the list, you might have to kick and [reinvite the bot by clicking here](https://discord.com/api/oauth2/authorize?client_id=936106026695028807&permissions=139586947136&scope=bot%20applications.commands)`,
                'Commands Have Changed!',
                null,
                `Requested by ${msg.author.username}`,
                new MessageReplyDetails(msg.id, false),
                new MessageColors().RegularColor,
                "https://rardk.com/bot-assets/fc-slash-commands.png"
            );
            messageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
        }
    }
}
