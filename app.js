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

                var articleList = result;

                response.render('dashboard', {
                    articles: articleList,
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


    } else if (request.session.authenticated && request.session.userRole === 'bar') {

        mysqlConnect.connect(function (err) {
            console.log("Connected!");

            mysqlConnect.query("SELECT a_id, description, startstock FROM article ORDER BY description ASC ", function (err, result, fields) {

                var articleList = result;

                response.render('dashboard', {
                    articles: articleList,
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
    }

    else {
        response.redirect('/');
    }


});


//update article
app.post('/update-article', function (request, response) {

    const articleID = request.body.articleID;
    const articleDescription = request.body.articleDescription;
    const articleStockkind = request.body.articleStockkind;
    const articleStartstock = request.body.articleStartstock;
    const articleConsumed = request.body.articleConsumed;

    //console.log('\nArtikel:');
    //console.log(articleDescription + ' ' + articleStockkind + ' ' + articleStartstock + ' ' + articleConsumed + '\n');

    mysqlConnect.connect(function (err) {

        var sql = "UPDATE article SET description=" + "'" + articleDescription + "'" + ", kind=" + "'" + articleStockkind + "'" + ", startstock=" + articleStartstock + ", consumed=" + articleConsumed + " WHERE a_id=" + articleID;

        console.log(sql);

        mysqlConnect.query(sql, function (err, result) {
            if (err) throw err;

            //console.log(result + " record(s) updated");
        });
    });

    request.flash('message', 'Artikel geändert.');
    response.redirect('/dashboard');

});


app.post('/bar-order', function (request, response) {




    //console.log('IDS length : ' + request.body.articleID.length);
    //console.log('IDS: ' + request.body.articleID);
    //console.log('Names length : ' + request.body.articleName.length);
    //console.log('Names: ' + request.body.articleName);

    var idsArray = Array.prototype.slice.call(request.body.articleID);
    var amountArray = Array.prototype.slice.call(request.body.articleValue);
    var articleDescriptionArray = Array.prototype.slice.call(request.body.articleDescription);

    Array.prototype.zip = function (arr) {
        return this.map(function (e, i) {
            //return [e, arr[i]];
            
            //Die Anzahl der bestellten Artikel befinden sich jetzt an der ersten Stelle im inneren Array.
            //Die Artikel ID befindet sich nun an der zweiten Stelle. Das macht das Überprüfen mit der Schleife einfacher. 
            return [arr[i],e ];
        })
    };

    newArray = idsArray.zip(amountArray);
    
    //Die Anfangslänge muss hier schon in einer Variablen abgespeichert werden, damit diese weiter unten von der Schleife genutzt werden kann. 
    var length = newArray.length ;


    
    
    //Array sortieren
    newArray.sort();

    // wenn das erste innere Element eine 0 enthält , wird das komplette Element aus dem Array gelöscht!
    for (var i = 0; i < length; i++){
        //Hier muss immer der erste (nullte) Wert in dem Array geprüft werden und wenn TRUE, gelöscht werden. 
        //Somit wird immer der erste Wert im Array überprüft. Das funktioniert nur, weil wir das Array sortiert haben
        //und z.B. an letzter Stelle keine 0 stehen kann!
        //Sobald die Elemente mit 0 gelöscht wurden, haben wir unser Ziel erreicht.
        if (newArray[0][0] === '0'){
            //Mit splice wird dann das aktuelle Element, welches gerade geprüft wurde, gelöscht. Der Wert 1 im splice
            //Befehl bedeutet, dass nur dieses eine Element gelöscht wird.
            newArray.splice(newArray[0][0],1);
        }      
    }

    console.log(newArray);

    response.redirect('/dashboard');

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