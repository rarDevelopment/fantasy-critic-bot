const Chariot = require('chariot.js');

class Error extends Chariot.Event {
    /**
     * Instantiating the superclass with the appropriate event name
     */
    constructor() {
        super('error');
    }

    /**
     * No parameters since the "ready" event doesn't emit any
     */
    async execute(code, message) {
        Chariot.Logger.event(`${code} - ${message}`);
    }
}

module.exports = new Error();