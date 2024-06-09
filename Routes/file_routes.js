const express = require('express');
const file_controller = require('./../Controllers/file_controller');
const auth_controller = require('./../Controllers/auth_controller');

const router = express.Router();

router.get('/user/:userId/files', file_controller.getFilesByUserId);
router.post('/upload', auth_controller.protect, file_controller.uploadAudio, file_controller.handleUpload);

module.exports = router;
