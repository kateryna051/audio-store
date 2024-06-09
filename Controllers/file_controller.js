const AudioFile = require('./../Models/file_model');
const User = require('./../Models/user_model'); 
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

exports.uploadAudio = upload.single('audioFile');

exports.handleUpload = async (req, res) => {
    try {
        const newAudioFile = await AudioFile.create({
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            user: req.user._id,
            email: req.user.email
        });

        await User.findByIdAndUpdate(req.user._id, { $push: { audioFiles: newAudioFile._id } });

        res.redirect('/allusers'); // Redirect to the allusers page
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getFilesByUserId = async (req, res) => {
    try {
        const files = await AudioFile.find({ user: req.params.userId });
        res.status(200).json({
            status: 'success',
            data: {
                files
            }
        });
    } catch (err) {
        console.error('Error fetching files:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


