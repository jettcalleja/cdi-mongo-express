'use strict';

const redis         = require('redis');
const async         = require('async');
const config        = require(__dirname + '/../config/config').REDISDB;
const client        = redis.createClient(config);

exports.init = () => {

    redis.RedisClient.prototype.delPattern = (key, callback) => {
        
        client.keys(key, (err, rows) => {
            if (err) {
                return callback(err);
            }

            async.each(rows, (row, cbDelete) => {
                client.del(row, cbDelete);
            }, callback);

        });

    };

    client.on('error', (err) =>{
        throw new Error('Error connecting to redis server:' + err);
    });

    return client.on('connect', () => {
        return client;
    });
    
};

exports.connect = (client) => {
    return (req, res, next) => {
        req.redis = client;
        next();
    };
};
