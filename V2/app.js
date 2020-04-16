const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const ApplicationError = require('./Shared/Error/ApplicationError');
const globalErrorHandler = require('./Shared/Error/error.controller');

//// ***** Routers
const userRouter = require('./Modules/User/user.router');
const tourRouter = require('./Modules/Tour/tour.router');
const reviewRouter = require('./Modules/Review/review.router');

const app = express();

//// ***** Global Configure
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'Public', 'views'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(cors());
app.options('*', cors());
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.use(express.static(path.join(__dirname, 'Public', 'assets')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('*', limiter);

// TODO: stripe
// // Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
// app.post(
//   '/webhook-checkout',
//   bodyParser.raw({ type: 'application/json' }),
//   bookingController.webhookCheckout
// );

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//// ***** Routers
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

//// ***** Page Not Found 404 Handler
app.all('*', (req, res, next) => {
  next(
    new ApplicationError(`Can't find ${req.originalUrl} on this server!`, 404)
  );
});

//// ***** globalErrorHandler
app.use(globalErrorHandler);

module.exports = app;
