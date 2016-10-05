'use strict';

const mongo     = require('cdi-mongo-connect');
const winston   = require('winston');
const util      = require(__dirname + '/../helpers/util');
const config    = require(__dirname + '/../config/config');
const crypto    = require(__dirname + '/../lib/cryptography');
const ObjectId  = require('mongodb').ObjectID;


/**
 * @api {post} /user Create user
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} email         User's email
 * @apiParam {String} password      User's password
 * @apiParam {String} fullname      User's fullname
 *
 * @apiSuccess {String} id            User's unique ID
 * @apiSuccess {String} fullname      User's last name
 * @apiSuccess {String} email         User's email
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *         "message": "Successfully created user",
 *         "id": "1"
 *         "fullName": "John Lloyd Cruz",
 *         "email": "johnlcruz@domain.com"    
 *    }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "INC_DATA",
 *          "message": "Incomplete request data",
 *          "context": "firstName is missing"
 *      }
 *    ]
 * }
 *
 */
exports.create = (req, res, next) => {
    const data = util._get
        .form_data({
            email: '',
            password: '',
            fullname: ''
        })
        .from(req.body);

    const user = mongo.db.collection('user');

    function start() {

        if (data instanceof Error) {
            return res.error('INC_DATA', data.message);
        }

        data.email = data.email.toLowerCase();

        user
        .findOne(
            {'email': data.email},
            create_user
        )
    }

    function create_user (err, result) {
        if (err) {
            winston.error('Error in getting user', err, last_query);
            return next(err);
        }

        if (result) {
            return res.error('INVALID_EMAIL', 'Please insert another email');
        }

        data.password = crypto.encryptSync(data.password);

        user
        .insertOne(
            data, 
            send_response
        );

    }

    function send_response (err, result) {
        if (err) {
            winston.error('Error in creating user');
            return next(err);
        }

        res.data({
            message: 'Successfully added user',
            id:       result.ops[0]._id,
            email:    data.email,
            fullname: data.fullname
        })
        .send();
    }

    start();
};

/**
 * @api {get} /users Get users
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiHeader {String} x-access-token Token from login
 *
 * @apiParam {String} id User's unique ID
 *
 * @apiSuccess {String} id            User's unique ID
 * @apiSuccess {String} fullname      User's full name
 * @apiSuccess {String} email         User's email
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *      "items": [
 *          "fullName": "John Lloyd Cruz",
 *          "email": "johndlcruz@domain.com",
 *          "password": "*SADSADMS123"
 *      ]
 *     }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 404 Not Found
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "ZERO_RES",
 *          "message": "Database returned no result",
 *          "context": "User not found"
 *      }
 *    ]
 * }
 */
exports.retrieve = (req, res, next) => {
    let query  = req.query;
    query.page = parseInt(query.page) || 1;
    query.size = parseInt(query.size) || 5;

    function start () {

        const user = mongo.db.collection('user');

        user.find()
            .skip((query.page - 1) * query.size)
            .limit(query.size).toArray(
                send_response
            );
    }

    function send_response (err, result) {
        if (err) {
            winston.error('Error in selecting users', last_query);
            return next(err);
        }

        if (!result.length) {
            return res.status(404)
                .error('ZERO_RES', 'User not found')
                .send();
        }

        res.item(result)
           .send();
    }

    start();
};

/**
 * @api {get} /user/:id Get user by Id
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiHeader {String} x-access-token Token from login
 *
 * @apiParam {String} id User's unique ID
 *
 * @apiSuccess {String} id            User's unique ID
 * @apiSuccess {String} fullname      User's full name
 * @apiSuccess {String} email         User's email
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *          "fullName": "John Lloyd Cruz",
 *          "email": "johndlcruz@domain.com",
 *          "password": "*SADSADMS123"
 *    }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 404 Not Found
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "ZERO_RES",
 *          "message": "Database returned no result",
 *          "context": "User not found"
 *      }
 *    ]
 * }
 */
exports.retrieveById = (req, res, next) => {
    const id = req.params.id;

    let userId;

    try {
        userId = new ObjectId(id);
    } catch (e) {
        winston.error('Error in id parameter');
        return next(e);
    }

    function start () {

        const user = mongo.db.collection('user');

        user
        .findOne(
            {_id: userId},
            send_response
        );
    }

    function send_response (err, result) {
        if (err) {
            winston.error('Error in selecting users');
            return next(err);
        }

        if (!result) {
            return res.status(404)
                .error('ZERO_RES', 'User not found')
                .send();
        }

        res.data(result)
           .send();
    }

    start();
};

/**
 * @api {put} /user/:id Update User
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} id              User's unique ID
 * @apiParam {String} [fullName]      User's full name
 * @apiParam {String} email           User's email
 *
 * @apiSuccess {String} id            User's unique ID
 * @apiSuccess {String} fullname      User's full name
 * @apiSuccess {String} email         User's email
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *          "id": "57e0013070c8f70790749bc6",
 *          "fullName": "John Lloyd Cruz",
 *          "email": "johndlcruz@domain.com"
 *    }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "NO_RECORD_UPDATED",
 *          "message": "No record was updated",
 *          "context": "No user was updated"
 *      }
 *    ]
 * }
 *
 */
 exports.update = (req, res, next) => {
    const data = util._get
        .form_data({
            email: '',
            _fullname: ''
        })
        .from(req.body);

    const user   = mongo.db.collection('user'),
          id     = req.params.id;

    let userId;

    try {
        userId = new ObjectId(id);
    } catch (e) {
        winston.error('Error in id parameter');
        return next(e);
    }

    function start() {

        if (data instanceof Error) {
            return res.error('INC_DATA', data.message);
        }

        data.email = data.email.toLowerCase();

        user
        .findOne(
            {'email': data.email,
             '_id': {$ne:  userId}},
            update_user
        )
    }

    function update_user (err, result) {
        if (err) {
            winston.error('Error in getting user');
            return next(err);
        }

        if (result) {
            return res.error('INVALID_EMAIL', 'Please insert another email');
        }

        user
        .updateOne(
            {_id: userId},
            {$set: data},
            send_response
        );

    }

    function send_response (err, result) {
        if (err) {
            winston.error('Error in update user');
            return next(err);
        }

        if (result.matchedCount === 0) {
            return res.error('NO_RECORD_UPDATED', 'No user was updated');
        }

        data.id = req.params.id;

        res.data(data)
           .send();
    }

    start();
};


/**
 * @api {delete} /user/:id Delete User
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 *
 * @apiParam {String} id User's unique ID
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *          "message": "Successfully deleted user"
 *    }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "NO_RECORD_DELETED",
 *          "message": "No record was deleted",
 *          "context": "No user was deleted"
 *      }
 *    ]
 * }
 *
 */
exports.delete = (req, res, next) => {

    const user   = mongo.db.collection('user'),
          id     = req.params.id;

    let userId;

    try {
        userId = new ObjectId(id);
    } catch (e) {
        winston.error('Error in id parameter');
        return next(e);
    }

    function start () {

        user
        .removeOne(
            {_id: userId},
            send_response
        )
    }

    function send_response (err, result) {
        if (err) {
            winston.error('Error in retrieving user');
            return next(err);
        }

        if (result.deletedCount === 0) {
            return res.error('NO_RECORD_DELETED', 'No User was deleted');
        }

        res.data({message: 'Successfully deleted user'})
           .send();
    }

    start();

};

/**
 * @api {post} /user/change_password User update password
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiHeader {String} x-access-token Token from login
 *
 * @apiParam {String} currentPassword    User's old password
 * @apiParam {String} newPassword        User's new password
 * @apiParam {String} [confirmPassword]  User's new password confirmation
 *
 * @apiSuccessExample Sample-Response:
 * HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *          "message": "Password successfully updated"
 *    }
 * }
 *
 * @apiErrorExample Sample-Response:
 * HTTP/1.1 400 Bad Request
 * {
 *    "success": false,
 *    "errors": [
 *      {
 *          "code": "NO_PASS",
 *          "message": "No password is found",
 *          "context": "Please check current password"
 *      }
 *    ]
 * }
 *
 */
exports.change_password = (req, res, next) => {
    const body   = req.body,
          redis  = req.redis,
          id     = body.user.id,
          userId = ObjectId(id),
          user   = mongo.db.collection('user'),
          data   = util._get
                    .form_data({
                        currentPassword: '',
                        newPassword: '',
                        _confirmPassword: ''
                    })
                    .from(req.body);
          

    function start () {

        if (data instanceof Error) {
            return res.error('INC_DATA', data.message);
        }

        if (data.confirmPassword &&
            data.newPassword != data.confirmPassword) {
            return res.error('INV_PASS', 'Invalid password confirmation');
        }

        data.newPassword     = crypto.encryptSync(data.newPassword);
        data.currentPassword = crypto.encryptSync(data.currentPassword);
        user
        .updateOne(
            {_id: userId,
             password: data.currentPassword},
            {$set: {password: data.newPassword}},
            send_response
        );


    }

    function send_response (err, result) {
        if (err) {
            winston.error('Error in retrieving user');
            return next(err);
        }

        if (result.matchedCount === 0) {
            return res.error('NO_PASS', 'Please check current password');
        }

        // Delete all active tokens
        // and remain the current one
        redis.del(id.toString());
        redis.sadd(id.toString(), body.token);

        res.data({message: 'Password successfully updated'})
           .send();
    }

    start();
};