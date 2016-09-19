'use strict';

const url      = require('url');
const config   = require(__dirname + '/../config/config');
const winston  = require('winston');

module.exports = (wss) => {

    wss.on('connection', (ws) => {
        
        let location = url.parse(ws.upgradeReq.url, true);

        ws.on('message', (message) => {
            try {

                message = JSON.parse(message);

                if (message.join) {

                }

                if (message.logout) {
                    ws.close();
                }

                winston.info('received: %s', JSON.stringify(message, 2, null));

            } catch (e) {
                winston.info('received: %s', message);
            }
            
        });

        ws.on('error', (err) => {
            winston.error(err);
        });

        ws.on('close', () => {
            winston.info('Connection closed');
        });

        ws.send('User Connected');
    });

    function broadcast(message) {
        wss.clients.forEach( (client) => {
            if (client.room.indexOf(message.room) > -1 || message.room == 'all') {
                client.send(message.msg);
            }
        });
    }


};