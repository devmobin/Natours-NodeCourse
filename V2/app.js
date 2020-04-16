const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('rateLimit');
const cookieParser = require('cookieParser');
const mongoSanitize = require('mongoSanitize');
const xss = require('xss');
const hpp = require('hpp');
const compression = require('compression');

const app = express();

//// ***** Global Configure
app.enable('trust proxy');

// TODO: set view engine
// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'views'));

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

// TODO: set statics folder
//app.use(express.static(path.join(__dirname, 'public')));

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

//// ***** Page Not Found 404 Handler

//// ***** globalErrorHandler

module.exports = app;
