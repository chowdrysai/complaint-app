const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const Handlebars = require('handlebars');
const app = express();
const cors=require("cors")

const port = process.env.PORT || 3000;
const index = require('./routes/index');

app.use(cors({
  origin: "http:///deploy-mern-1whq.vercel.app",
  methods: ['POST', 'GET', 'DELETE', 'PUT', 'PATCH'],
  credentials: true
}))

// View Engine
const hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    changeStatus: function (value) {
      console.log(value);
    }
  }
});

Handlebars.registerHelper('includes', function (string, substring) {
  return string.includes(substring);
});

Handlebars.registerHelper('or', function (v1, v2) {
  return v1 || v2;
});

Handlebars.registerHelper('eq', function (val1, val2) {
  return val1 === val2;
});
Handlebars.registerHelper('uuidToNumber', function(uuid) {
  let number = 0;
  for (let i = 0; i < uuid.length; i++) {
    number += uuid.charCodeAt(i);
  }
  return number;
});


app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars');


// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Express Session
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true,
  maxAge: null,
  cookie: { httpOnly: true, maxAge: 2419200000 } // configure when sessions expires
}));


// Init passport
app.use(passport.initialize());
app.use(passport.session());

// Express messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Express Validator
app.use(expressValidator({
  errorFormatter: (param, msg, value) => {
    let namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

    while (namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg: msg,
      value: value
    };
  }
}));

app.use('/', index);


// Start Server
app.listen(port, () => {
  console.log('Server started on port ' + port);
});
