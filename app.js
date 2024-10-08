var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var postsRouter = require('./routes/posts');
var commentsRouter = require('./routes/comments');
var profilesRouter = require('./routes/profiles');
var nextRouter = require('./routes/next')

// Loading .env files if not product enviroment
if (process.env.environment != 'production')
  require('dotenv').config()
// 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

require('./controllers/passport.js'); // Passport + JWT configuration

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/profiles', profilesRouter);
app.use('/next', nextRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(async function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 
  if (err.message != 'Not Found') {
    console.log(err)
    await prisma.$disconnect()
    console.log("\n")
    console.log(res.locals.error)
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

if (process.env.NODE_ENV != 'test')
  console.log(`access at : http://localhost:${process.env.PORT}/ `)

module.exports = app;
