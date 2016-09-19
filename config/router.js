'use strict';

const importer     = require('anytv-node-importer');
const verify_token = require(__dirname+'/../controllers/auth').verify_token;

module.exports = (router) => {
    const __   = importer.dirloadSync(__dirname + '/../controllers');

    router.del = router.delete;

    router.post ('/user',                                  __.user.create);
    router.get  ('/users',                                 __.user.retrieve);
    router.get  ('/user/:id',                              __.user.retrieveById);
    router.put  ('/user/:id',                              __.user.update);
    router.del  ('/user/:id',                              __.user.delete);
    router.post ('/user/change_password',    verify_token, __.user.change_password);

    router.post ('/auth/login',                            __.auth.login);
    router.post ('/auth/logout',             verify_token, __.auth.logout);

    router.all('*', (req, res) => {
        res.status(404)
           .send({message: 'Nothing to do here.'});
    });

    return router;
};