const Chariot = require("chariot.js");
require("dotenv").config();

class FantasyCriticInterim extends Chariot.Client {
    constructor() {
        super(new Chariot.Config(
            process.env.BOT_TOKEN,
            {
                prefix: ["fc.", "Fc."],
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
        this.editStatus('online', { name: 'fc.help', type: 0 });
    }
}

module.exports = new FantasyCriticInterim();