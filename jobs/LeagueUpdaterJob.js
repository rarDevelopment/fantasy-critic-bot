const CheckTypes = require('../api/CheckTypes.js');
const SocketMessageSender = require('./SocketMessageSender.js');

SocketMessageSender.sendMessageOnSocket(CheckTypes.LEAGUE_ACTION_CHECK);
