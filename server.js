//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');

//Added by saket start here

var bodyParser = require('body-parser');
var fs = require('fs');
var request=require('request');
var swig = require('swig');
var dns = require('dns');
var https = require('https');
var http = require('http');
//var http = require('follow-redirects').http;
var util = require('util');
var passport = require("passport");
var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
var openIdSettings = require('./config/openIdSettings.js');
var settings=openIdSettings.openIdConfigObj;

var timeoutLength = 6000000;
var dbutils = require('./public/js/dbutils');

var iotData = require('./public/data/map_data');

var config = require('./config/configTest');
var configAms = require('./config/configAms');
var session = require('express-session');
var constants = require('./custom-modules/ixmConstants');

app.engine('html', swig.renderFile); 
var cfenv = require('cfenv');
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'html')
app.use('/static', express.static(__dirname + '/public'));

var cookieParser = require('cookie-parser');

var mysql      = require('mysql');

var pool = mysql.createPool(config.database.connectionString);


// Added by saket ends here


    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
/*
if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

  // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('login.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('login.html', { pageCountMessage : null});
  }
});*/

//var validator = function(req, res, next) {
function ensureAuthenticated(req, res, next) {
	//console.log("req.session.user: "+req.session.user);
	//console.log(" req ::---- "+util.inspect(req));
	
    if (req.isAuthenticated() || req.session.UsingSSO || typeof req.session.passport != 'undefined') {
    	console.log("req  is already authenticated ");
        return next();
    } else {
    	console.log("req not authenticated ");
    	//check for SSO token
    	if(typeof req.query.token != 'undefined'){
  		  Check(req, function(err) {
  		    // Validation failed, or an error occurred during the external request.
  		    if (err) return res.sendStatus(400);
  		    // Validation passed.
  		    return next();
  		  });
    	} else{
    		res.redirect('/');
    	}
    }
  
};
function Check(req, callback) {
	console.log(" req.body ::>>>>> "+util.inspect(req.body));
	
	
	var introspect_url = settings.introspect_url;
	
	var url = introspect_url + "?token=" + req.query.token + "&client_id=" + settings.client_id + "&client_secret=" + settings.client_secret;
	
	console.log("url:"+url);
	
	https.get(url, (resp) => {
		  let data = '';
		  // A chunk of data has been recieved.
		  resp.on('data', (chunk) => {
		    data += chunk;
		  });

		  // The whole response has been received. Print out the result.
		  resp.on('end', () => {
		    console.log("---------->"+util.inspect(data));
		    console.log("req.session: "+req.session);
		    var claims = JSON.parse(data);
		    //now set the session
			 user.name=" ";
			 user.firstName = " ";
			 user.lastName = " ";
			 user.emailAddress	=claims.sub;
			 req.session.user = user;

			 req.session.claims = claims;
			 req.session.userEmail=user.emailAddress;
			 req.session.originalUrl = req.originalUrl;
			 console.log("::::::::::::->"+util.inspect(req.session.user));
			 req.session.UsingSSO=true;
		     return callback(null, true);
		  });

		}).on("error", (err) => {
			//return callback(new Error());		 
		     return callback(null, true);
		});
};
app.get('/', function(req, res) {
	if(req.session) {
		req.session.destroy();

	}
	else {
		console.log("This must be session timeout");
	}
	
	console.log("This is my login page============================================================================================");
	
	sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('advisorHome', {'appMsg':appMsg });	
			//return res.redirect('/login');
		});
	
});
app.post('/login', function(req, res) {
	
	console.log('*** Entered route POST /login 2 **** \n');
	
	console.log(JSON.stringify(req.body));
	
	sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg, 'user' : req.session.user });	
	});
	
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});


/*
// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});
*/
app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;

