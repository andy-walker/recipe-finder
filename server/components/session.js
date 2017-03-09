/**
 * Session manager class
 * Just contains a dummy function for returning the details of the sole 
 * test user on the system when the currentUser is requested at present, but
 * in real life would contain logic for managing sessions among multiple users
 */

module.exports = class Session {

    getCurrentUser() {

        return require('bluebird').coroutine(function*() {

            var model  = app.entity.model.user;
            var result = yield model.findOne({
                where: {
                    userId: 1
                }
            });

            return result;

        })().catch(app.log.error);

    }

}