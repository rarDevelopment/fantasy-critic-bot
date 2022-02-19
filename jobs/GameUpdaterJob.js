const CheckTypes = require('../api/CheckTypes.js');
const SocketMessageSender = require('./SocketMessageSender.js');

SocketMessageSender.sendMessageOnSocket(CheckTypes.GAME_UPDATER_CHECK);
