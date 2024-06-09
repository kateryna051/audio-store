const User = require('./../Models/user_model');
const jwt = require('jsonwebtoken');
const async_error_handler = require('./../Utils/async_error_handler');
const CustomError = require('./../Utils/custom_error');

/*exports.getAllUsers = async_error_handler(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        result: users.length,
        data: {
            users
        }
    });
});*/
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            status: 'success',
            data: {
                users
            }
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updatePassword = async_error_handler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePasswordInDb(req.body.currentPassword, user.password))) {
        return next(new CustomError('Current password provided is wrong', 401));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    res.status(200).json({
        status: "success",
        message: "Password updated successfully"
    });
});

exports.updateMe = async_error_handler(async (req, res, next) => {
    if (req.body.password || req.body.confirmPassword) {
        return next(new CustomError('You cannot update your password using this endpoint', 400));
    }

    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { runValidators: true, new: true });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = async_error_handler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: "success",
        data: null
    });
});
