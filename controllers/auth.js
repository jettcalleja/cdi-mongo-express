'use strict';

const mongo       = require('cdi-mongo-connect');
const winston     = require('winston');
const jwt         = require('jsonwebtoken');
const util        = require(__dirname + '/../helpers/util');
const config      = require(__dirname + '/../config/config');
const crypto      = require(__dirname + '/../lib/cryptography');

/**
 * @api {post} /auth/login User login
 * @apiGroup Authentication
 * @apiVersion 0.0.1
 *
 * @apiParam {String} email     User's email
 * @apiParam {String} password  User's password
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *          "id": "6e9402a1-f752-4141-a90f-aec19f1d63e5",
 *          "email": "correct@email.com",
 *          "token": "token"
 *    }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "LOG_FAIL",
 *          "message": "Log-In failed",
 *          "context": "Incorrect Password"
 *      }
 *    ]
 * }
 *
 */
exports.login = (req, res, next) => {
    const data = util._get
        .form_data({
            email: '',
            password: ''
        })
        .from(req.body);
   
    const user = mongo.db.collection('user');

    function start () {

        if (data instanceof Error) {
            return res.error('INC_DATA', data.message);
        }

        data.email = data.email.toLowerCase();

        user
        .findOne(
            {'email': data.email},
            send_response
        )
        
    }

    function send_response (err, result) {
        let user,
            token,
            userPassword,
            encrypted = {};

        if (err) {
            winston.error('Error in logging in');
            return next(err);
        }

        if (!result) {
            return res.error('LOG_FAIL', 'Invalid username');
        }

        userPassword = crypto.encryptSync(data.password);

        if (userPassword !== result.password) {
            return res.error('LOG_FAIL', 'Incorrect Password');
        }

        user = {
            id:     result._id,
            email:  result.email
        };

        encrypted.user = crypto.encryptSync(user);

        token = jwt.sign(encrypted, config.SECRET, {
                        algorithm: config.TOKEN_ALGO,
                        expiresIn: config.TOKEN_EXPIRATION
                    });

        user.token = token;

        req.redis.sadd(user.id.toString(), token);

        res.set('x-access-token', token)
           .data(user)
           .send();

    }

    start();
};

/**
 * @api {post} /auth/logout User logout
 * @apiGroup Authentication
 * @apiVersion 0.0.1
 *
 * @apiHeader {String} x-access-token Token from login
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *          "message": "User successfully logged out"
 *    }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "UNAUTH",
 *          "message": "Unauthorized access",
 *          "context": "Failed to authenticate token."
 *      }
 *    ]
 * }
 *
 */
exports.logout = (req, res, next) => {
    let body  = req.body,
        token = body.token,
        id    = body.user.id.toString();

    if (token) {
        req.redis.srem(id, token);
        res.data({message: 'User successfully logged out'})
           .send();
    } else {
        res.error('NO_TOKEN', 'Please provide valid token in body form')
           .status(403)
           .send();
    }
};

exports.verify_token = (req, res, next) => {
    let token = req.headers['x-access-token'];

    if (token) {

        jwt.verify(token, config.SECRET, {algorithms : [config.TOKEN_ALGO]}, (err, user) => {

            if (err) {
                return res.status(404)
                          .error('UNAUTH', 'Failed to authenticate token.')
                          .send();
            } else {

                const decrypted = crypto.decryptSync(user.user),
                      redis     = req.redis,
                      userId    = decrypted.id.toString();

                redis.sismember(userId, token, (err, isMember) => {
                    if (err || !isMember) {
                        return res.status(404)
                                  .error('UNAUTH', 'Failed to authenticate token.')
                                  .send();
                    }
                    req.body.user  = decrypted;
                    req.body.token = token;
                    next();
                });
            }

        });
    } else {
        res.error('NO_TOKEN', 'Please provide valid token in body form')
           .status(403)
           .send();
    }

};