//INITIALIZE WEBSERVICE AND WEBSITE
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var app = express();
var moment = require('moment');
app.locals.moment = moment; // this makes moment available as a variable in every EJS page
app.use('/static', express.static('./static'));
app.set('views', path.join(__dirname, 'views'));

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

//Initialize database
var mysql = require('mysql');

var mysqlConnect = mysql.createConnection({
    host: "www.tetra-jesteburg.de",
    user: "node",
    password: "123456#",
    database: "node"
});

//Start webserver on port 3000
app.listen(3000, function () {
    console.log("listening on 3000");
});

//Load homepage
app.get('/', function (request, response) {

    response.render('index', {
        title: 'Home',
        message: request.flash('message'),
        error: request.flash('error'),
        page: request.url
    });
});

//Either go to landing page (user not logged in) or to content page (user logged in).
app.get('/dashboard', function (request, response) {


    //-->ADMIN<-- GET CONTENTS FOR ADMIN DASHBOARD AND RENDER IT.
    if (request.session.authenticated && request.session.userRole === 'admin') {


        mysqlConnect.connect(function (err) {
            console.log("Connected!");

            mysqlConnect.query("SELECT * FROM article ORDER BY description ASC ", function (err, result, fields) {
                if (err) throw err;

                stockSelectQuery = "SELECT orders.o_id, users.name, orders.datetime, orders.status FROM orders, users WHERE orders.id = users.id ORDER BY orders.status DESC";
                mysqlConnect.query(stockSelectQuery, function (err, stockResult, fields) {                
                    positionsSelectQuery = "SELECT positions.a_id, article.description, positions.amount, positions.o_id, article.kind FROM article, orders, positions WHERE positions.a_id = article.a_id AND positions.o_id = orders.o_id";
                    console.log(stockResult) ;
                    mysqlConnect.query(positionsSelectQuery, function (err, positionsOrdersResult, fields) {

                        var articleList = result;

                        response.render('dashboard', {
                            articles: articleList,
                            username: request.session.username,
                            authenticated: request.session.authenticated,
                            stock: stockResult,
                            moment: moment,
                            userRole: request.session.userRole,
                            positions: positionsOrdersResult,
                            title: 'Dashboard',
                            message: request.flash('message'),
                            error: request.flash('error'),
                            page: request.url
                        });
                    });
                });
            });
        });

    //-->BAR<-- GET CONTENTS FOR BAR DASHBOARD AND RENDER IT.
    } else if (request.session.authenticated && request.session.userRole === 'bar') {
        var currentUserId = request.session.userId;
        
        mysqlConnect.connect(function (err) {
            // console.log("Connected!");
            
            mysqlConnect.query("SELECT * FROM article ORDER BY description ASC ", function (err, result, fields) {
                stockSelectQuery = "SELECT orders.o_id, users.name, orders.datetime, orders.status FROM orders, users WHERE orders.id = users.id AND orders.id = " +currentUserId+ " AND orders.status != 'Storniert' ORDER BY orders.status DESC";
                // console.log(stockSelectQuery);
                
                mysqlConnect.query(stockSelectQuery, function (err, stockResult, fields) {                
                    positionsSelectQuery = "SELECT positions.a_id, article.description, positions.amount, positions.o_id, article.kind FROM article, orders, positions WHERE positions.a_id = article.a_id AND positions.o_id = orders.o_id";
                    
                    mysqlConnect.query(positionsSelectQuery, function (err, positionsOrdersResult, fields) {
                        // console.log('positionsOrdersResult', positionsOrdersResult);
                        var articleList = result;
                        response.render('dashboard', {
                            articles: articleList,
                            positions: positionsOrdersResult,
                            stock: stockResult,
                            username: request.session.username,
                            authenticated: request.session.authenticated,
                            userRole: request.session.userRole,
                            title: 'Dashboard',
                            message: request.flash('message'),
                            error: request.flash('error'),
                            page: request.url
                        });
                    });                    
                });                
            });
        });

    //-->LAGER<-- GET CONTENTS FOR LAGER DASHBOARD AND RENDER IT.
    } else if (request.session.authenticated && request.session.userRole === 'lager') {

        mysqlConnect.connect(function (err) {
            console.log("Mit Lager verbunden!");

            //Ausgabe der orders Liste für das Lager
            stockSelectQuery = "SELECT orders.o_id, users.name, orders.datetime, orders.status FROM orders, users WHERE orders.id = users.id AND orders.status != 'Storniert' ORDER BY orders.status DESC";
            mysqlConnect.query(stockSelectQuery, function (err, stockResult, fields) {

                positionsSelectQuery = "SELECT article.description, positions.amount, positions.o_id, article.kind FROM article, orders, positions WHERE positions.a_id = article.a_id AND positions.o_id = orders.o_id";
                mysqlConnect.query(positionsSelectQuery, function (err, positionsOrdersResult, fields) {

                    console.log('positionsOrdersResult', positionsOrdersResult);
                    //console.log('stockResult',stockResult[0].datetime);

                    response.render('dashboard', {
                        positions: positionsOrdersResult,
                        stock: stockResult,
                        username: request.session.username,
                        authenticated: request.session.authenticated,
                        userRole: request.session.userRole,
                        title: 'Dashboard',
                        message: request.flash('message'),
                        error: request.flash('error'),
                        page: request.url
                    });
                });
            });
        });
    }
    else {
        response.redirect('/');
    }
});






//EXECUTE DASHBOARD COMMANDS
//Update order status from LAGER
app.post('/update-order', function (request, response) {

    const orderID = request.body.orderID;
    var changestatus = request.body.changestatus;

    console.log('changestatus',changestatus);

    if(changestatus == undefined) {
        request.flash('error', 'Bitte den Status auswählen um ihn zu ändern');
        response.redirect('/dashboard');
    }
    else {
        mysqlConnect.connect(function (err) {
            var sql = "UPDATE orders SET status = " + "'" + changestatus + "'" + " WHERE o_id = " + orderID + "";
            console.log(sql);

            mysqlConnect.query(sql, function (err, result) {
                if (err) throw err;
                else {
                    console.log(result + " geändert");
                    request.flash('message', 'Status geändert.');
                    response.redirect('/dashboard');
                }
            });
        });
    }
});

//Cancel order from BAR
app.post('/storn_order', function (request, response) {
    
    console.log(request.body.articleIDcancel);
    console.log(request.body.articleAMOUNTcancel);
    
    //Variable for SQl loop
    var y = 0 ;
    
    const orderID = request.body.orderID;
    var changestatus = request.body.changestatus; 
    var articleIDcancel1 = request.body.articleIDcancel

    if (Array.isArray(articleIDcancel1)== true) {
        var articleIDcancel = request.body.articleIDcancel;
        var articleAMOUNTcancel = request.body.articleAMOUNTcancel;
    }
    
    else {
        var articleIDcancel = [request.body.articleIDcancel];
        var articleAMOUNTcancel = [request.body.articleAMOUNTcancel];
    }

    mysqlConnect.connect(function (err) {
        var sql = "UPDATE orders SET status = 'Storniert'" + " WHERE o_id = " + orderID + "";
        console.log(sql);
     
        mysqlConnect.query(sql, function (err, result) {
            if (err) throw err;
            else {
                console.log(result + " geändert");
                request.flash('message', 'Order storniert!');
                //response.redirect('/dashboard');
            }
        });
        
        for (var z = 0; z < articleIDcancel.length; z++) {   
            mysqlConnect.query("SELECT consumed FROM article WHERE a_id = " + articleIDcancel[z] + "", function (err, resultcon, fields) {
                console.log(resultcon) ;
                console.log('Z=', z) ;
                if (err) throw err;       

                //Variables for claculate new consumed value.
                var artnr = parseInt(articleIDcancel[y]);
                var orderconsumed = parseInt(articleAMOUNTcancel[y]);
                y++ ;
  
                //Claculate new consumed value and save it in variable.
                var newconsumed = parseInt(resultcon[0].consumed) - orderconsumed;
                console.log("Alt", resultcon[0].consumed, '-', 'storniert',orderconsumed, '=',newconsumed );
        
                //Draw new consumed value in database.
                var articleconsumedSQLinsert = "UPDATE article SET consumed = " + newconsumed + " WHERE a_id = " + artnr + "";
                console.log(articleconsumedSQLinsert);
                
                mysqlConnect.query(articleconsumedSQLinsert, function (err, result_id_a_insert, fields) {
                    if (err) throw err;
                    console.log("Consumed erfolgreich aktualisiert:", newconsumed);
                });            
            });
        }
    });

    request.flash('message', 'Bestellung storniert!');
    response.redirect('/dashboard');
});



//Change article from ADMIN
app.post('/update-article', function (request, response) {

    const articleID = request.body.articleID;
    const articleDescription = request.body.articleDescription;
    const articleStockkind = request.body.articleStockkind;
    const articleStartstock = request.body.articleStartstock;
    const articleConsumed = request.body.articleConsumed;

    mysqlConnect.connect(function (err) {
        var sql = "UPDATE article SET description=" + "'" + articleDescription + "'" + ", kind=" + "'" + articleStockkind + "'" + ", startstock=" + articleStartstock + ", consumed=" + articleConsumed + " WHERE a_id=" + articleID;

        mysqlConnect.query(sql, function (err, result) {
            if (err) throw err;
        });
    });
    request.flash('message', 'Artikel geändert.');
    response.redirect('/dashboard');
});


//Delete article from ADMIN
app.post('/delete-article', function (request, response) {
 const articleID = request.body.articleID;

    mysqlConnect.connect(function (err) {
        var sql = "DELETE FROM article WHERE a_id=" + articleID;
        mysqlConnect.query(sql, function (err, result) {
            if (err) {
                request.flash('error', 'Atrikel kann nicht gelöscht werden, da dieser in einer Bestellung vorhanden ist!');
                response.redirect('/dashboard');
            }
            else {
                console.log(result + " gelöscht");
                request.flash('message', 'Artikel gelöscht.');
                response.redirect('/dashboard');
            }    
        });
    });
});

//Create order from BAR
//Description in german.
app.post('/bar-order', function (request, response) {

    var idsArray = Array.prototype.slice.call(request.body.articleID);
    var amountArray = Array.prototype.slice.call(request.body.articleValue);
    var currentUserId = request.session.userId;

    Array.prototype.zip = function (arr) {
        return this.map(function (e, i) {
            //Die Anzahl der bestellten Artikel befinden sich jetzt an der ersten Stelle im inneren Array.
            //Die Artikel ID befindet sich nun an der zweiten Stelle. Das macht das Überprüfen mit der Schleife einfacher.
            return [arr[i], e];
        })
    };
    //Die beiden Arrays werden nun zu einem neuen zusammengefasst
    newArray = idsArray.zip(amountArray);

    //Die Anfangslänge muss hier schon in einer Variablen abgespeichert werden, damit diese weiter unten von der Schleife genutzt werden kann.
    var length = newArray.length;

    //Array sortieren
    newArray.sort();

    //Wenn das erste innere Element eine 0 enthält , wird das komplette Element aus dem Array gelöscht!
    for (var i = 0; i < length; i++) {
        //Hier muss immer der erste (nullte) Wert in dem Array geprüft werden und wenn TRUE, gelöscht werden.
        //Somit wird immer der erste Wert im Array überprüft. Das funktioniert nur, weil wir das Array sortiert haben
        //und z.B. an letzter Stelle keine 0 stehen kann!
        //Sobald die Elemente mit 0 gelöscht wurden, haben wir unser Ziel erreicht.
        if (newArray[0][0] === '0') {
            //Mit splice wird dann das aktuelle Element, welches gerade geprüft wurde, gelöscht. Der Wert 1 im splice
            //Befehl bedeutet, dass nur dieses eine Element gelöscht wird.
            newArray.splice(newArray[0][0], 1);
        }
    }

    // Absicherung um keine leeren Bestellungen abzuschicken
    if (newArray.length !== 0) {
        
        //Variable für SQl Select Schleife (für consumed Wert)
        var i = 0 ;

        mysqlConnect.connect(function (err) {

            //Zuerst die bestehenden Bestellungen abfragen
            mysqlConnect.query("SELECT id FROM orders", function (err, result, fields) {
                if (err) throw err;

                //Zählen wie viele Bestellungen es gibt
                //Ergebnis in variable Speichern
                var countOrders = result.length;

                //Hier muss bei der Order ID mit der Variablen hochgezählt werden einen hochgezählt werden.
                //Als id muss die User ID des aktuell bearbeitenden Benutzer eingetragen werden z.B. in die Variable $id!

                var newCountOrders = countOrders + 1; // erledigt

                //verbinde mit SQL und übergebe Order
                var orderSql = "INSERT INTO orders (o_id,status,id,datetime) VALUES(" + newCountOrders + ',' + " 'Nicht bearbeitet' " + ',' + currentUserId + ',' + " CURRENT_TIMESTAMP " + ")";

                mysqlConnect.query(orderSql, function (err, result, fields) {
                    console.log('order added to database o_id =',newCountOrders);
                });
                      
                //Zählschleife um jede Bestellung nacheinander in die Datenbank einzutragen
                for (var h = 0; h < newArray.length; h++) {   
                    console.log('Amount=' + newArray[h][0]);
                    console.log('Article Nr. =' + newArray[h][1]);

                    var newOrderID = newCountOrders;
                    console.log('newOrderID ' + newOrderID);
                    //o_id muss aus der Variablen ausgelesen werden. -> hab ich übernommen,  amount ist die Anzahl der Artikel die bestellt wird. hier ist das newArray[k][0]
                    var positionSQL = "INSERT INTO positions (o_id,a_id,amount) VALUES (" + newOrderID + ',' + newArray[h][1] + ',' + newArray[h][0] + ")";

                    mysqlConnect.query(positionSQL, function (err, result_id, fields) {
                        if (err) throw err;
                    });
                }
            });    
                
            // Zählschleife um für jeden bestellten Artikel die consumed Zahl zu updaten.
            for (var k = 0; k < newArray.length; k++) { 
                
                //Consumed Wert zur errechnung des neuen Wertes auslesen.
                var articleconsumedSQLselect = "SELECT consumed FROM article WHERE a_id = " + newArray[k][1] + "";
                    
                mysqlConnect.query(articleconsumedSQLselect, function (err, result_id_a, fields) {
                    if (err) throw err;                     
                    
                    //Variablen zu Berechnung des neuen Consumed-Wert
                    var orderconsumed = parseInt(newArray[i][0]);
                    var artnr = newArray[i][1];
                    i ++ ;

                    //Neuen Wert für Consumed errechnen und in Variable speichern.
                    var newconsumed = result_id_a[0].consumed + orderconsumed;
                    console.log('Consumed aktuell ',result_id_a[0].consumed, ' + Consumed order = ',orderconsumed, 'new consumed ',newconsumed);

                    //Neuen Comsumed-Wert in die Datenbank schreiben.
                    var articleconsumedSQLinsert = "UPDATE article SET consumed = " + newconsumed + " WHERE a_id = " + artnr + "";
                    console.log(articleconsumedSQLinsert);
                    mysqlConnect.query(articleconsumedSQLinsert, function (err, result_id_a_insert, fields) {
                        if (err) throw err;
                        console.log("Consumed erfolgreich aktualisiert:", newconsumed);
                    });                                    
                });
            }            
        });
        request.flash('message', 'Neue Bestellung ist eingegangen');
        response.redirect('/dashboard');
    } 
    else {
        request.flash('error', 'Sie haben nichts ausgewählt');
        response.redirect('/dashboard');
    }
});

//Add user from ADMIN
app.post('/register', function (request, response) {
    const username = request.body.username;
    const password = request.body.password;
    const repPassword = request.body.repPassword;
    const role = request.body.role;
    let errors = [];

    if(role == undefined) {
        request.flash('error', 'Bitte wählen Sie eine Rolle aus!');
        response.redirect('/dashboard');
    }
    else {
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

        mysqlConnect.connect(function (err) {
            console.log("Connected!");
    
            //Fist check if user exists.
            mysqlConnect.query("SELECT name FROM users WHERE name =" + "'" + username + "'", function (err, result, fields) {
    
                //If user exists throw error.
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
                } 
                else {
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
                    } 
                    else {
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
    } 
});

//Add article from ADMIN 
app.post('/addaticle', function (request, response) {
    const description = request.body.description;
    const startstock = request.body.startstock;
    const kind = request.body.kind;
    let errors = [];

    if(kind == undefined) {
        request.flash('error', 'Bitte wählen Sie eine Art aus!');
        response.redirect('/dashboard');
    }
    else {
        mysqlConnect.connect(function (err) {
        console.log("Connected!");
            //Fist check if article exists.
            mysqlConnect.query("SELECT description FROM article WHERE description =" + "'" + description + "'", function (err, result, fields) {

                //If article exists throw error.
                if (result.length > 0) {
                    errors.push("der Artikel existiert bereits");

                    response.render('dashboard', {
                        username: request.session.username,
                        title: 'Dashboard',
                        message: null,
                        page: request.url
                    });
                } 
                else {
                    if (errors.length === 0) {

                        console.log('insert into database...');

                        var sql = "INSERT INTO article (description, kind, startstock) VALUES (" + "'" + description + "' , '" + kind + "' , '" + startstock + "' )";
                        
                        mysqlConnect.query(sql, function (err, result) {
                            if (err) throw err;

                            console.log('article added to database');

                            request.flash('message', 'Neuer Artikel eingepflegt');
                            response.redirect('/dashboard');

                        });
                    } 
                    else {
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
    }    
});


//Login for all users
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

            //Find registered user in database.
            mysqlConnect.query("SELECT * FROM users WHERE name =" + "'" + username + "'", function (err, result, fields) {
                if (result.length < 0 || result[0] === undefined) {
                    // user does not exist
                    errors.push("der Benutzer existiert nicht!");

                    response.render('index', {
                        'error': errors,
                        title: 'Errors',
                        message: null,
                        page: request.url
                    });
                } 
                else {
                    //If user exists
                    //If entered password is equal to the password in the database
                    if (passwordHash.verify(password, result[0].password)) {
                        request.session.authenticated = true;
                        request.session.username = username;
                        request.session.userRole = result[0].role;
                        request.session.userId = result[0].id;
                        request.flash('message', 'Sie sind eingeloggt');
                        //Redirect to dashboard
                        response.redirect('/dashboard');
                    } 
                    else {
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
    } 
    else {
        response.render('index', {
            'error': errors,
            title: 'Errors',
            message: null,
            page: request.url
        });
    }
});

app.get('/login', function (request, response) {
    response.redirect('/');
});

//Logout and delete his session, redirect to main page.
app.get('/logout', function (request, response) {
    delete request.session.authenticated;
    delete request.session.username;
    delete request.session.userRole;
    request.flash('message', 'Sie sind ausgeloggt');
    response.redirect('/');
});