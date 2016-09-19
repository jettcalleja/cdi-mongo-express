'use strict';

module.exports = {
    ENV: 'development',

    CORS: {
        allowed_headers: 'Content-Type, Accept, x-access-token',
        allowed_origins_list: [
            'cdi.loc',
            'localhost'
        ],
        allowed_methods: 'GET, POST, PUT, DELETE',
        allow_credentials: true
    },

    MONGODB: {
        host: 'localhost',
        port: 27017,
        database: 'testdb'
    },

    REDISDB: {
        host: 'localhost',
        port: 6379
    }
    
};