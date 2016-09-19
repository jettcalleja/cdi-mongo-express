'use strict';

module.exports = {
    ENV: 'production',
    LOG_LEVEL: 'info',

    CORS: {
        allowed_headers: 'Content-Type, Accept, x-access-token',
        allowed_origins: 'http://cdi.ph',
        allowed_methods: 'GET, POST, PUT, OPTIONS, DELETE'
    },

    MONGODB: {
        host: 'localhost',
        port: 27017,
        database: 'testdb'
    },

    REDISDB: {
        host: '',
        port: 6379
    }
};