var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var app = express();

app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// view engine setup
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//session setup
const session = require('express-session');
app.use(session({
    secret: 'this-is-a-secret',     //necessary for encoding
    resave: false,                  //should be set to false, except store needs it
    saveUninitialized: false        //same reason as above.
}));

app.use(flash());

//password hash, for encoding the pw
const passwordHash = require('password-hash');


// Initialisierung der Datenbank
var mysql = require('mysql');

var mysqlConnect = mysql.createConnection({
    host: "www.tetra-jesteburg.de",
    user: "node",
    password: "123456#",
    database: "node"
});

//Webserver starten
app.listen(3000, function () {
    console.log("listening on 3000");
});

// Homepage laden
app.get('/', function (request, response) {

    response.render('index', {
        title: 'Home',
        message: request.flash('message'),
        error: null,
        page: request.url
    });
});

//either go to the landing page (user not logged in) or go to the content page (user logged in)
app.get('/dashboard', function (request, response) {

    // show dashboard for the Admin!!!
    if (request.session.authenticated && request.session.userRole === 'admin') {


        mysqlConnect.connect(function (err) {
            console.log("Connected!");

                mysqlConnect.query("SELECT * FROM article ORDER BY description ASC ", function (err, result, fields) {
                    if (err) throw err;

                console.log(result);

                var articleList = result;

                response.render('dashboard', {
                    articles : articleList,
                    username: request.session.username,
                    authenticated: request.session.authenticated,
                    userRole: request.session.userRole,
                    title: 'Dashboard',
                    message: request.flash('message'),
                    error: null,
                    page: request.url
                });
            });

        });


    } else {
        response.redirect('/');
    }
});





app.post('/register', function (request, response) {
    const username = request.body.username;
    const password = request.body.password;
    const repPassword = request.body.repPassword;
    const role = request.body.role;

    let errors = [];
    if (username === "" || username === undefined) {
        errors.push('Bitte einen Username eingeben.');
    }
    if (password === "" || password === undefined) {
        errors.push('Bitte ein Passwort eingeben.');
    }
    if (repPassword === "" || repPassword === undefined) {
        errors.push('Bitte ein Passwort zur Bestätigung eingeben.');
    }
    if (password !== repPassword) {
        errors.push('Die Passwörter stimmen nicht überein.');
    }

    //connect to mysql

    mysqlConnect.connect(function (err) {
        console.log("Connected!");

        //fist check if user exists
        mysqlConnect.query("SELECT name FROM users WHERE name =" + "'" + username + "'", function (err, result, fields) {

            // if user exists throw error
            if (result.length > 0) {

                errors.push("der Benutzer existiert bereits");

                response.render('dashboard', {
                    username: request.session.username,
                    authenticated: request.session.authenticated,
                    userRole: request.session.userRole,
                    'error': errors,
                    title: 'Dashboard',
                    message: null,
                    page: request.url
                });

            } else {
                if (errors.length === 0) {

                    console.log('encrypting password...');
                    const encryptedPassword = passwordHash.generate(password);

                    console.log('insert into database...');

                    var sql = "INSERT INTO users (name, password, role) VALUES (" + "'" + username + "' , '" + encryptedPassword + "' , '" + role + "' )";
                    mysqlConnect.query(sql, function (err, result) {
                        if (err) throw err;

                        console.log('user added to database');

                        request.flash('message', 'Neuer Benutzer registriert');
                        response.redirect('/dashboard');

                    });

                } else {
                    response.render('dashboard', {
                        username: request.session.username,
                        authenticated: request.session.authenticated,
                        userRole: request.session.userRole,
                        'error': errors,
                        title: 'Dashboard',
                        message: null,
                        page: request.url
                    });
                }
            }
        });
    });
});

app.post('/login', function (request, response) {

    const username = request.body.username;
    const password = request.body.password;

    let errors = [];

    if (username === "" || username === undefined) {
        errors.push('Bitte einen Username eingeben.');
    }
    if (password === "" || password === undefined) {
        errors.push('Bitte ein Passwort eingeben.');
    }

    if (errors.length === 0) {

        mysqlConnect.connect(function (err) {
            console.log("Connected!");

            // find registered user in database
            mysqlConnect.query("SELECT * FROM users WHERE name =" + "'" + username + "'", function (err, result, fields) {

                console.log(result[0]);

                if (result.length < 0 || result[0] === undefined) {
                    // user does not exist
                    errors.push("der Benutzer existiert nicht!");

                    response.render('index', {
                        'error': errors,
                        title: 'Errors',
                        message: null,
                        page: request.url
                    });
                } else {

                    // if user exists
                    // if entered password is equal to the password in the database
                    if (passwordHash.verify(password, result[0].password)) {
                        request.session.authenticated = true;
                        request.session.username = username;
                        request.session.userRole = result[0].role;


                        request.flash('message', 'Sie sind eingeloggt');
                        // redirect to dashboard
                        response.redirect('/dashboard');

                    } else {

                        errors.push('Das Passwort für diesen User stimmt nicht überein.');

                        response.render('index', {
                            'error': errors,
                            title: 'Errors',
                            message: null,
                            page: request.url
                        });
                    }
                }

            });
        });

    } else {
        response.render('index', {
            'error': errors,
            title: 'Errors',
            message: null,
            page: request.url
        });
    }
});


//log the user out again and delete his session, redirect to main page
app.get('/logout', function (request, response) {
    delete request.session.authenticated;
    delete request.session.username;
    delete request.session.userRole;
    request.flash('message', 'Sie sind ausgeloggt');
    response.redirect('/');
});