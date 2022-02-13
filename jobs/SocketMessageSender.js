const Websocket = require('ws');
const resources = require('../settings/resources.json');

exports.sendMessageOnSocket = function (checkTypeToSend) {
    const ws = new Websocket(`ws://127.0.0.1:${resources.botPort}`);
    ws.on('open', () => {
        const message = { checkToDo: checkTypeToSend };
        const json = JSON.stringify(message);
        console.log(json);
        ws.send(json);
        ws.close();
    });

    ws.on('error', () => {
        console.log('server offline');
    });
}
