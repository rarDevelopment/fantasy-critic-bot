const Chariot = require('chariot.js');
const MessageReplyDetails = require('discord-lib/MessageReplyDetails.js');
const MessageSender = require('discord-lib/MessageSender.js');
const Message = require('discord-lib/Message.js');

class Bronson extends Chariot.Command {
    constructor() {
        super();
        this.name = 'bronson';
        this.cooldown = 2;
        this.help = {
            message: `Justice is served.`,
            usage: 'bronson',
            example: ['bronson'],
            inline: true
        }

        this.MessageSender = new MessageSender();
    }

    async execute(msg, args, chariot) {
        const messageToSend = new Message(
            "Just swiped $10 from Bronson's wallet :smirk:",
            new MessageReplyDetails(msg.id, true)
        );
        this.MessageSender.sendMessage(messageToSend.buildMessage(), msg.channel, null);
    }
}
module.exports = new Bronson();