const express = require('express');
const router = express.Router();
const auth_controller = require('./../Controllers/auth_controller');
const user_controller = require('./../Controllers/user_controller');
const file_controller = require('./../Controllers/file_controller')

router.get('/allusers', user_controller.getAllUsers);



router.route('/updatePassword').patch(
    auth_controller.protect, 
    user_controller.updatePassword
);

router.route('/updateMe').patch(
    auth_controller.protect, 
    user_controller.updateMe
);

router.route('/deleteMe').delete(
    auth_controller.protect, 
    user_controller.deleteMe
);

module.exports = router;