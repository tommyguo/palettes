// app.js

// set up models and connect to database
require('./db');

// set up file serving, body parser, hbs
const express = require('express');
const app = express();
const path = require("path");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(cookieParser());

// set up session handling
const session = require('express-session');
const sessionOptions = {
  secret: 'so super secret',
  resave: true,
  saveUninitialized: true
};
app.use(session(sessionOptions));


// set up mongoose
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Palette = mongoose.model('Palette');
const Color = mongoose.model('Color');

// set up passport
// passport set up code based off of http://passportjs.org/docs
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// checks if login is valid
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({
      username: username
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      const isValidPassword = function(user, password) {
        return bcrypt.compareSync(password, user.password);
      };
      if (!isValidPassword(user, password)) {
        return done(null, false);
      }
      else {
        return done(null, user);
      }
    });
  }
));

let errorSignup;

passport.use('signup',
  new LocalStrategy({
    passReqToCallback: true
  }, (req, username, password, done) => {
    User.findOne({
      username: username
    }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (user) {
        errorSignup = "Username is already being used.";
        return done(null, false);
      }
      else {
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(password, salt, function(err, hash) {
            const newUser = new User({
              username: username,
              password: hash,
            });
            newUser.save(function(err) {
              if (err) {
                console.log(err);
                throw err;
              }
              return done(null, newUser);
            });
          });
        });
      }
    });
  })
);


// route handlers start here
let colors;
const numberOfColors = 15;
let errorLogin;
let errorPalette;


// home page
app.get('/', (req, res) => {
  // clear errors when user goes to home screen
  errorLogin = "";
  errorPalette = "";
  errorSignup = "";
  let username;
  if (req.user) {
    username = req.user.username;
  }
  else {
    username = undefined;
  }
  // display all palettes
  Palette.find(function(err, palettes) {
    res.render('home', {
      palettes: palettes,
      name: username
    });
  });
});

app.get('/palette/create', (req, res) => {
  errorSignup = "";
  // only allow registered users to create palette
  if (!req.user) {
    errorLogin = "You must log in or register to create a palette";
    res.redirect('/login');
  }
  else {
    // clear log in error
    errorLogin = "";
    colors = [];
    const hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    // randomly create colors
    for (let i = 0; i < numberOfColors; i++) {
      let color = '';
      for (let j = 0; j < 6; j++) {
        color += hex[Math.floor(Math.random() * 16)];
      }
      colors.push(color);
    }
    colors = colors.map(color => {
      return '#' + color;
    });
    // display colors
    res.render('create', {
      colors: colors,
      error: errorPalette,
      name: req.user.username,
    });
  }
});

// handles creation of palette
app.post('/palette/create', (req, res) => {
  // clear error palette
  errorPalette = "";

  const narrowedColors = colors.filter((color, i) => {
    return req.body[i] === "on";
  });

  const chosenColors = narrowedColors.map(color => {
    const colorDoc = new Color({
      hex: color
    });
    return colorDoc;
  });


  if (req.body.name === "") {
    errorPalette = "Choose a name for your palette!";
    res.redirect('/palette/create');
  }
  else if (chosenColors.length !== 5) {
    errorPalette = "Choose exactly 5 colors to be in the palette!";
    res.redirect('/palette/create');
  }
  else {
    new Palette({
      name: req.body.name,
      colors: chosenColors,
      user: req.user.username,
    }).save(function(err) {
      if (err) {
        console.log(err);
        res.render('error');
      }
    });
    User.findOneAndUpdate({
      username: req.user.username
    }, {
      $push: {
        palettes: {
          name: req.body.name,
          colors: chosenColors,
          user: req.user.username
        }
      }
    }, function(err) {
      if (err) {
        console.log(err);
        res.render('error');
      }
      else {
        res.redirect('/');
      }
    });

  }
});

// handles getting user page
app.get('/user/:slug', (req, res) => {
  let usernameLoggedIn;
  if (req.user) {
    usernameLoggedIn = req.user.username;
  }
  else {
    usernameLoggedIn = undefined;
  }

  // checks if user page is same as logged in user
  let same = false;
  if (req.params.slug === usernameLoggedIn) {
    same = true;
  }

  User.find({
    username: req.params.slug
  }, function(err, user) {
    if (user[0]) {
      res.render('user', {
        user: user[0],
        name: usernameLoggedIn,
        same: same,
      });
    }
    else {
      res.render('notFound');
    }
  });
});

// handles deleting of palette
app.post('/user/:slug', (req, res) => {
  const i = Object.keys(req.body)[0];

  User.find({
    username: req.params.slug
  }, function(err, user) {
    const palName = user[0].palettes[i].name;
    // deletes palette from user subarray
    User.findOneAndUpdate({username: req.params.slug}, {$pull: {palettes: {name: palName}}}, function(err) {
      if (err) {
        console.log(err);
        res.render('error');
      }
    });
    // deletes array from palettes collection
    if (user[0]) {
      Palette.remove({
        name: palName,
        user: req.params.slug,
      }).exec();

      res.redirect('/user/' + req.params.slug);
    }
    else {
      res.render('notFound');
    }
  });

});

// handles log in
app.get('/login', (req, res) => {
  errorSignup = "";
  res.render('login', {
    error: errorLogin
  });
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/error'
  })
);

app.get('/logout', function(req, res) {
  errorSignup = "";
  req.logout();
  res.redirect('/');
});

app.get('/error', (req, res) => {
  errorLogin = "Incorrect username or password.";
  res.redirect('/login');
});

// handles sign up
app.get('/signup', (req, res) => {
  res.render('signup', {
    error: errorSignup
  });
});

app.post('/signup', passport.authenticate('signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
}));


const port = Number(process.env.PORT || 3000);

app.listen(port);
