//Satz in der Shell ausgeben:
console.log("Node.js is working!") ;


// Initialisierung des Webservers
//Erst in der Shell installieren: npm install express --save
const express = require('express') ;
const app = express() ;
var mysql = require('mysql');


var con = mysql.createConnection({
    host: "www.tetra-jesteburg.de",
    user: "node",
    password: "123456#",
    database: "node"
});


//Body-Parser initialisieren
//Erst in der Shell installieren: npm install body-parser --save
const bodyParser = require('body-parser') ;
app.use(bodyParser.urlencoded({extended: true})) ;

//EJS Template Engine initialisieren
//Erst in der Shell installieren: npm install ejs --save
app.engine('.ejs', require('ejs').__express) ;
app.set('view engine', 'ejs') ;



//Webserver starten
//"app" ist das Objekt
//"listen" ist die Methode
//Port 3000
//function(){....} ist eine call-back Funktion. Wird auch asynchroner Aufruf genannt. Dh. wenn listen fertig ist.
app.listen(3000, function() {
    console.log("listening on 3000") ;
});

app.get('/' , function(req, res) {
    res.send('Moin Digga, I bims Pc');
});
