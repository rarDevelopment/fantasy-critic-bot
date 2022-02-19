const CheckTypes = require('../api/CheckTypes.js');
const SocketMessageSender = require('./SocketMessageSender.js');

SocketMessageSender.sendMessageOnSocket(CheckTypes.SCORE_UPDATER_CHECK);
