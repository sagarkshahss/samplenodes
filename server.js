//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');

/* Added By saket Starts here ...*/

var bodyParser = require('body-parser');
var fs = require('fs');
var request=require('request');
var swig = require('swig');
var dns = require('dns');
var https = require('https');
var http = require('http');
var util = require('util');
var passport = require("passport");
var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
var openIdSettings = require('./config/openIdSettings.js');
var settings=openIdSettings.openIdConfigObj
//Initialize Passport
/*
app.use(passport.initialize());
//app.use(passport.session());
passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
*/
var timeoutLength = 6000000;
var dbutils = require('./public/js/dbutils');
var iotData = require('./public/data/map_data');
var config = require('./config/configTest');
var configAms = require('./config/configAms');
var session = require('express-session');
var constants = require('./custom-modules/ixmConstants');
var MemoryStore = session.MemoryStore;
var sessionStore = new MemoryStore();
var user = {
	emp_fname: String,
	emp_emailid: String
};

app.use(bodyParser.urlencoded({
  extended: true
}));

//In session.destroy release the db connection 
app.use(session({
		 key: 'soladv_app',	
		 secret: 'anystringoftext',
         saveUninitialized: true,
         store: sessionStore,
         resave: true}));
/*
var forceSsl = require('express-force-ssl');
//app.use(forceSsl);

app.set('forceSSLOptions', {
  enable301Redirects: true,
  trustXFPHeader: false,
  httpsPort: config.httpsPort,
  sslRequiredMessage: 'SSL Required.'
});
*/
var event = { 
    	'Login': 1,
    	'Logout': 2,
    	'Session_Timeout':3,
    	'Initiate_Solution':4,
    	'Create_Solution':5,
    	'Capture_Usecases':6,
    	'Open_Solution':7,
    	'Save_Solution_High':8,
    	'Save_Solution_Low':9,
    	'Download_Requested':10,
    	'Download_Outcome':11,
    	'Estimation_Request_Received':12,
    	'Estimation_Response_Outcome':13,
    	'Download_Request_Received':14,
    	'Download_Response_Outcome':15,
    	'Edit_Opportunity' :16,
    	'Initiate_Modification':17,
    	'Edit_SolArea_Offset':18,
    	'Edit_Sprint_Weeks':19,
    	'Edit_Delivery_Model':20,
    	'Save_Solution':21,
        'Copy_Solution':22,
    	'User_Provided_Efforts':23
    };   

    var ip = require('ip');
    var ipAddress = ip.address();
    var sess;
    var key;
    var cert;
    var ca;
    //var serviceURL = ipAddress+ config.restApiSubString; 
    var serviceURL = config.restApiServer + config.restApiSubString;
    var options = {
      key: key,
      cert: cert,
      ca: ca
    };

    if(config.envCheck == 'prod') {
    	console.log("SSL Certificate used from prod :: Go Ahead!");
    	key = fs.readFileSync('./encryption/soladvisor.prod.key');
    	cert = fs.readFileSync('./encryption/soladvisor.prod.cert');
    	ca = fs.readFileSync('./encryption/soladvisor.prod.csr');
    } else if(config.envCheck == 'test') {
    	console.log("SSL Certificate used from test :: Go Ahead!");
    	key = fs.readFileSync('./encryption/soladvisor.test.key');
    	cert = fs.readFileSync('./encryption/soladvisor.test.cert');
    	ca = fs.readFileSync('./encryption/soladvisor.test.csr');
    } else {
    	console.log("SSL Certificate used from dev :: Go Ahead!");
    	key = fs.readFileSync('./encryption/new.cert.key');
    	cert = fs.readFileSync('./encryption/new.cert.cert');
    	ca = fs.readFileSync('./encryption/new.ssl.csr');
    }
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
    var domain = require('domain'), d = domain.create();

    d.on('error', function(err) {
      console.error(err);
    }); 

    var  HashMap = require('hashmap');
    var timeOutSidMap = new HashMap();
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
/*Added by saket Ends here ...*/
    
Object.assign=require('object-assign')

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


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
		//	console.log("appMsg >>>>>> "+sqlQuery+"\n");
			//console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
			//return res.redirect('/login');
		})
	 //res.render('login.html');// This was just for testing.
});
/* Added by saket2 starts here*/ 


function getCreatedBy(user){
	return (user == 'sa_superuser@in.ibm.com' ? "select distinct(created_by) from solution_basic_details_trx" : "\'" + user + "\'");
};

function arrayUnique(array) {
	var uniqueArr = array.concat();
	for (var i = 0; i < uniqueArr.length; ++i) {
		for (var j = i + 1; j < uniqueArr.length; ++j) {
			if (uniqueArr[i].LOGICAL_COMP_ID === uniqueArr[j].LOGICAL_COMP_ID)
				uniqueArr.splice(j--, 1);
		}
	}
	return uniqueArr;
}
var appEnv = cfenv.getAppEnv();
app.listen(config.port, '0.0.0.0', function() {

	// print a message when the server starts listening
	console.log("server starting on " + config.port + ", Rest API Url: " +serviceURL);

});
https.createServer(options, app).listen(config.httpsPort, '0.0.0.0', function() {

    // print a message when the server starts listening
             console.log("Secure server starting on " + config.httpsPort + ", Rest API Url::::: " +serviceURL);
    
             });    

/*Added by saket ends here2*/

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
