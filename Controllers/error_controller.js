const CustomError = require("./../Utils/custom_error");

const devErrors = (res, error) => {
    res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
        stack: error.stack,
        error: error
    });
};

const defaultErrorHandler = (err) => {
    const msg = "Something went wrong! Please try again later.";
    return new CustomError(msg, 500);
};

const castErrorHandler = (err) => {
    const msg = `Invalid value for ${err.path} : ${err.value}!`;
    return new CustomError(msg, 400);
};

const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const errorMessages = errors.join('. ');
  const msg = `Invalid input data: ${errorMessages} `;

  return new CustomError(msg,400);
}

const handleExpiredJWT = (err) => {
    return new CustomError('JWT has expired. Please login again!');
};

const handleJWTError = (err) => {
    return new CustomError('Invalid token. Please try again later', 401);
};

const prodErrors = (res, error) => {
    if (error.isOperational) {
        res.status(error.statusCode).json({
            status: error.statusCode,
            message: error.message,
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: "Something went wrong! Please try again later.",
        });
    }
};

module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        devErrors(res, error);
    } else if (process.env.NODE_ENV === 'production') {
        if (error.name === 'CastError') error = castErrorHandler(error);
        if (error.name === 'ValidationError') error = validationErrorHandler(error);
        if (error.name === 'TokenExpiredError') error = handleExpiredJWT(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error);

        prodErrors(res, error);
    }
};
