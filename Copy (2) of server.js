//  OpenShift sample Node application
var express = require('express'),
    app     = express();
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
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var cookieParser = require('cookie-parser');
var mysql      = require('mysql');
var pool = mysql.createPool(config.database.connectionString);
var domain = require('domain'), d = domain.create();
var  HashMap = require('hashmap');
var timeOutSidMap = new HashMap();
var db = null,
dbDetails = new Object();
 
app.use(bodyParser.urlencoded({
	  extended: true
	}));

//Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
Object.assign=require('object-assign')

//app.engine('html', require('ejs').renderFile);
//app.use(morgan('combined'))
app.engine('html', swig.renderFile); 
//app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'html')
app.use('/static', express.static(__dirname + '/public'));

var forceSsl = require('express-force-ssl');
app.use(forceSsl);
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
			res.render('login', {'appMsg':appMsg });	
			//return res.redirect('/login');
		});
	
});
function getCreatedBy(user){
	return (user == 'sa_superuser@in.ibm.com' ? "select distinct(created_by) from solution_basic_details_trx" : "\'" + user + "\'");
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



// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
