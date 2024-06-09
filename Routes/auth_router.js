const express = require('express');
const auth_controller = require('./../Controllers/auth_controller');

const router = express.Router();

router.post('/signup', auth_controller.signup);
router.post('/login', auth_controller.login);
router.post('/forgotPassword', auth_controller.forgotPassword);
router.patch('/resetPassword/:token', auth_controller.resetPassword);

module.exports = router;
