const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const i18n = require('i18n');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

i18n.configure({
    locales: ['en', 'es'],
    directory: __dirname + '/locales',
    defaultLocale: 'en',
    cookie: 'lang',
    register: global,
});

app.use(i18n.init);
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sanitize());
app.use(xss());
app.use(hpp());

app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(cookieParser());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const user_route = require('./Routes/user_route');
const auth_router = require('./Routes/auth_router');
const CustomError = require('./Utils/custom_error');
const globalErrorHandler = require('./Controllers/error_controller');
const file_routes = require('./Routes/file_routes');



app.use('/api', user_route);
app.use('/api', auth_router);
app.use('/api', file_routes);

app.get(' http://84.32.214.42:80/login', function (req, res) {
    res.render('login');
});
app.get(' http://84.32.214.42:80/sign', function (req, res) {
    res.render('sign');
});

app.get(' http://84.32.214.42:80/allusers', function (req, res) {
    res.render('allusers');
});
app.get(' http://84.32.214.42:80/index', function (req, res) {
    res.render('index');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.use(globalErrorHandler);

module.exports = app;


