const User = require('./../Models/user_model');
const jwt = require('jsonwebtoken');
const CustomError = require('./../Utils/custom_error');
const util = require('util');
const sendEmail = require('./../Utils/email');
const crypto = require('crypto');
const async_error_handler = require('./../Utils/async_error_handler');

const signToken = id => {
    return jwt.sign({id}, process.env.SECRET_STR,{
        expiresIn: process.env.LOGIN_EXPIRES
       })
    
}

const createSendResponse = (user, statusCode, res) => {
    const token = signToken(user.id);

    const options = {
        maxAge: process.env.LOGIN_EXPIRES,
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.cookie('jwt', token, options);
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
};

exports.signup = async_error_handler(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
        console.log('Password and confirmPassword do not match');
        req.flash('error_msg', 'Password and confirmPassword do not match');
        return res.redirect('/sign');
    }

    try {
        // Create new user in the database
        const newUser = await User.create({ name, email, password });

        console.log('User created successfully:', newUser);
        req.flash('success_msg', 'You are now signed up');
        return res.redirect('/login');
    } catch (err) {
        console.error('Error during signup:', err);
        req.flash('error_msg', 'Something went wrong');
        return res.redirect('/sign');
    }
});

/*exports.signup = async_error_handler(async (req, res) => {
    try {
        const { name, email, password, confirmPassword} = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Password and confirmPassword do not match' });
        }

        // Create new user in the database
        const newUser = await User.create({ name, email, password});

        // Send success response
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});*/


/*exports.login = async_error_handler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return next(new CustomError('Please provide email and password', 400));
    }

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePasswordInDb(password, user.password))) {
        return next(new CustomError('Incorrect email or password', 401));
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Send token in response
    res.status(200).json({
        status: 'success',
        token,
    });
});*/
exports.login = async_error_handler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with email
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePasswordInDb(password, user.password))) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/login');
    }

    // Create token
    const token = signToken(user._id);

    // Set token in cookie (or you can use session)
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge:  24 * 60 * 60 * 1000,
    });

    req.flash('success_msg', 'You are now logged in');
    res.redirect('/index');
});

/*exports.protect = async_error_handler(async (req, res, next) => {
    const testToken = req.headers.authorization;
    console.log('Authorization Header:', testToken);
    let token;
    if (testToken && testToken.startsWith('Bearer')) {
        token = testToken.split(' ')[1];
    }
    if (!token) {
        return next(new CustomError('You are not logged in!', 401));
    }
    console.log('Extracted Token:', token);
    try {
        const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);
        const user = await User.findById(decodedToken.id);

        if (!user) {
            return next(new CustomError('The user with given token does not exist', 401));
        }

        const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);

        if (isPasswordChanged) {
            return next(new CustomError('The password has been changed recently. Please log in again', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new CustomError('Invalid token. Please log in again', 401));
    }
});*/
exports.protect = async_error_handler(async (req, res, next) => {
    const token = req.cookies.jwt; // Extract token from cookie

    if (!token) {
        return next(new CustomError('You are not logged in!', 401));
    }

    try {
        const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);
        const user = await User.findById(decodedToken.id);
        req.user = user;
        if (!user) {
            return next(new CustomError('The user with given token does not exist', 401));
        }

        const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);

        if (isPasswordChanged) {
            return next(new CustomError('The password has been changed recently. Please log in again', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new CustomError('Invalid token. Please log in again', 401));
    }
});


exports.restrict = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            const error = new CustomError('You do not have permission to perform this action', 403);
            return next(error);
        }
        next();
    };
};

exports.forgotPassword = async_error_handler(async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            const error = new CustomError('We could not find the user with the given email', 404);
            return next(error);
        }

        const resetToken = user.createResetPasswordToken();
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        const message = `We have received a password reset request. Please use the below link to reset your password\n\n${resetUrl}\n\nThis reset password link will be valid only for 10 minutes`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password change request received',
                message: message
            });

            res.status(200).json({
                status: "success",
                message: "password reset link sent to the user email"
            });
        } catch (err) {
            console.error('Error sending email:', err);
            throw new CustomError('There was an error sending the password reset email. Please try again later', 500);
        }
    } catch (error) {
        next(error);
    }
});

exports.resetPassword = async_error_handler(async (req, res, next) => {
    const token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        const error = new CustomError('Token is invalid or has expired', 400);
        return next(error);
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    createSendResponse(user, 200, res);
});
