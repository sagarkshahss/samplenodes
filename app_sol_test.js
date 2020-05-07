var express = require('express');
var app = express();
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
var settings=openIdSettings.openIdConfigObj








//Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

var timeoutLength = 6000000;
var dbutils = require('./public/js/dbutils');

var iotData = require('./public/data/map_data');

var config = require('./config/configTest');
var configAms = require('./config/configAms');
var session = require('express-session');
var constants = require('./custom-modules/ixmConstants');

//var MySQLStore = require('express-mysql-session');

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
var saml2 = require('saml2-js');

// Create service provider
var sp_options = {
  entity_id: "https://" + config.restApiServer + ":" + config.httpsPort,
  private_key: fs.readFileSync("./saml/https_"+config.restApiServer + "_" + config.httpsPort+".key", 'utf-8').toString(),
  certificate: fs.readFileSync("./saml/https_"+config.restApiServer + "_" + config.httpsPort+".cert", 'utf-8').toString(),
  sign_get_request: true,
  allow_unencrypted_assertion: true,  
  assert_endpoint: "https://" + config.restApiServer + ":" + config.httpsPort + "/dashboard"
};
var sp = new saml2.ServiceProvider(sp_options);

// Create identity provider
var idp_options = {
  sso_login_url: "https://w3id.alpha.sso.ibm.com/auth/sps/samlidp2/saml20/login",
  sso_logout_url: "https://w3id.alpha.sso.ibm.com/auth/sps/samlidp2/saml20/slo",
  certificates: [fs.readFileSync("./saml/w3idprofilessoibmcom1.crt", 'utf-8').toString()]
};
var idp = new saml2.IdentityProvider(idp_options);

// ------ Define express endpoints ------
//  
//  // Endpoint to retrieve metadata
app.get("/metadata.xml", function(req, res) {
  res.type('application/xml');
  console.log("metadata requested\n\n");  
console.log(sp.create_metadata());
  res.send(sp.create_metadata());
});

// Starting point for login
app.get("/login", function(req, res) {
	console.log("Entered GET /login"); 
	var prevUrl = req.query.prevUrl; 
	req.session.requestedURL =prevUrl;
	console.log("prevRequested Url "+prevUrl);
sp.create_login_request_url(idp, {}, function(err, login_url, request_id) {
    if (err != null)
      return res.send(500);

	console.log("login_url: "+login_url);  
	return res.redirect(login_url);
  
  });
});

// Assert endpoint for when login completes
app.post("/dashboard", function(req, res) {

	console.log("entered assert flow in /postResponse"); 
    console.log("prevRequested Url in dashboard "+req.session.requestedURL); 	
	
	sess=req.session;
	console.log("postResponse Response: " + JSON.stringify(sess));
	var options = {request_body: req.body};
	sp.post_assert(idp, options, function(err, saml_response) {
	    if (err != null)
	      return res.send(500);
    
	    console.log("\n\n\nSAML Response: " + JSON.stringify(saml_response));
	        // Save name_id and session_index for logout
	        //     // Note:  In practice these should be saved in the user session, not globally.
	        //
	    name_id = saml_response.user.name_id;
	    session_index = saml_response.user.session_index;
		console.log("\n\nname_id: " +name_id);
		console.log("session_index: " +session_index); 
	    //return res.send("Hello #{saml_response.user.name_id}!"+name_id+ " : " +  session_index);
				
		req.session.user = saml_response.user; 
		
		console.log("session    ::::->>>>>>>>>>>>>>  "+ JSON.stringify(req.session));
		processLogin(req, res);
	});
});

// Starting point for logout
app.get("/logout", function(req, res) {
  var options = {
    name_id: name_id,
    session_index: session_index
  };
 
  sp.create_logout_request_url(idp, options, function(err, logout_url) {
    if (err != null)
      return res.send(500);
    res.redirect(logout_url);
  });
});
*/

var forceSsl = require('express-force-ssl');
app.use(forceSsl);

app.set('forceSSLOptions', {
  enable301Redirects: true,
  trustXFPHeader: false,
  httpsPort: config.httpsPort,
  sslRequiredMessage: 'SSL Required.'
});


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

//var path = require('path');
//var serviceURL = "http://ixm-solution-advisor-api.stage1.mybluemix.net";
//var serviceURL = "http://localhost:8080/ixm";
var ip = require('ip');
var ipAddress = ip.address();
var sess;

/*var log4js = require('log4js');
//log4js.configure('ixm_log4js_config.json', { reloadSecs: 3600 });

//logger.setLevel('OFF');

log4js.configure({
	  appenders: { fileapp: { type: 'file', filename: 'logs/ixm_sol_adv.log' } },
	  categories: { default: { appenders: ['fileapp'], level: 'debug' } }
	}, { reloadSecs: 3600 });*/

//var logger = log4js.getLogger('default');
var key;
var cert;
var ca;

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
  
//var serviceURL = ipAddress+ config.restApiSubString; 
var serviceURL = config.restApiServer + config.restApiSubString;

var options = {
  key: key,
  cert: cert,
  ca: ca
};

console.log("serviceURL  @@@@@@@@@@@@@@@@@@ :::: "+serviceURL);

//Start of OpenId Logic
//app.get('/login', passport.authenticate('openidconnect', {}));

app.get('/login', function (req, res, next) {
	var prevUrl = req.query.prevUrl; 
	req.session.requestedURL =prevUrl;
	   passport.authenticate('openidconnect', {})(req, res, next);
	});

app.get('/rfp/auth/sso/callback', function (req, res, next) {
	   passport.authenticate('openidconnect', {
		    successRedirect:'/processLogin', //redirect_url
		    failureRedirect: '/errorPage',
		})(req, res, next);
	});

//Configure the OpenId Connect Strategy with credentials obtained from OneLogin
var Strategy = new OpenIDConnectStrategy({
    authorizationURL: settings.authorization_url,
    tokenURL: settings.token_url,
    clientID: settings.client_id,
    scope: 'openid profile email',
    response_type: 'code',
    clientSecret: settings.client_secret,
    callbackURL: settings.callback_id,
    skipUserProfile: true,
    addCACert: true,
    CACertPathList: ['/cert/oidc_w3id_staging.cer','/encryption/soladvisor.prod.cert'],
    issuer: settings.issuer_id
},
    function (iss, sub, profile, jwtClaims,accessToken, refreshToken, params, done) {
        process.nextTick(function () {
        	profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            done(null, profile);
        })
    });

passport.use(Strategy);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//End of OpenId Logic

/*
dns.lookup("ixm-sol-adv-server", function onLookup(err, address, family) {
	if(err) {
		console.log("Error looking up host ixm-sol-adv-server:"+err);
		return;
	}
	ipAddress = address;
	//serviceURL = "http://" + ipAddress + ":8080/ixm";
	serviceURL = ipAddress+ config.restApiSubString; 
});
*/

app.engine('html', swig.renderFile); 
var cfenv = require('cfenv');
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'html')
app.use('/static', express.static(__dirname + '/public'));

var cookieParser = require('cookie-parser');

var mysql      = require('mysql');

/*var pool = mysql.createPool({
	connectionLimit : 100, // important
	host : 'localhost',
	user : 'scott',
	password : 'Sc0tty!xm',
	database : 'soladvisor',
	debug : false
});*/

var pool = mysql.createPool(config.database.connectionString);


/*var sessionStore = new MySQLStore({},pool.getConnection(function(err, connection) {
						if (err) {
							console
									.log("Error obtaining connection from pool: "
											+ err);
							connection.release();
							throw err;
						}
					})
				);*/



var domain = require('domain'), d = domain.create();

d.on('error', function(err) {
  console.error(err);
}); 

/*
var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'us-cdbr-iron-east-03.cleardb.net',
	user     : 'bba88f50c29c53',
	password : '2798f689',
	database : 'ad_31a44fb3eb596b9',
	debug    :  true
});

*/
var  HashMap = require('hashmap');
var timeOutSidMap = new HashMap();


//var validator = function(req, res, next) {
function ensureAuthenticated(req, res, next) {
	//console.log("req.session.user: "+req.session.user);
	
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

//require('./controller/routes.js')(app,pool);

//require('./controller/routesPost.js')(app,pool,ipAddress);
var handleTimeOut = function(clientSessionId) {
			if(clientSessionId) {
			pool.getConnection(function(err, connection) {
				if (err) {
					console
							.log("Error obtaining connection from pool: "
									+ err);
					connection.release();
					throw err;
				}
		
				var sessionQuery = "insert into session_log (session_id, event_type) values ('"+clientSessionId +"',"+ event.Session_Timeout+")";
				console.log(sessionQuery);
				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
					if (err) {
						//connection.release();
						console.log(err);
					}
					
					
					sessionStore.destroy(clientSessionId);
				//res.render('login');
				//logger.info('Exiting route /logout');				
				});	
			});
			}	

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

app.get('/c-intg/:indusId',  ensureAuthenticated, function(req, res) {
	var indusId=req.params.indusId;
	console.log("indusId: "+indusId);
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		console.log("connection>>"+config.database.connectionString.database);
		
		//ju for now picking user-caseid for Banking
		//var query = pool.query('select (select use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id_system_3 and iucm.sol_area_id=105 and iucm.Indus_id=7) as usecaseId, id_system_1,id_system_2,id_system_3, num_simple, num_medium, num_complex, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_1) as name_1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_2) as name_2, (select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id_system_3 and iucm.sol_area_id=105) as name_3 from system_integration', function(err, result) {
		var query = pool.query('select  id_system_1,id_system_2,num_simple, num_medium, num_complex, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_1) as name_1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_2) as name_2 from system_integration where industry_id=101 or industry_id='+indusId , function(err, result) {	
			console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

//app.get('/mware-subcat/:indusId', function(req, res) {
app.get('/mware-subcat', ensureAuthenticated, function(req, res) {
	var indusId=req.params.indusId;
	console.log("indusId: "+indusId);
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		
		//var selQuery = "select distinct ReqSubCategoryId, ReqSubCategory, use_case_id from industry_use_cases_master where Indus_id=" + indusId + " and Sol_area_id = (Select Sol_area_id from solution_area_info where Sol_area_Name='System Integration - Interfaces') order by ReqSubCategoryId ASC";
		var selQuery = "select Technology_id, Technology_name from system_integration_technology_master order by Technology_id ASC";
		console.log("selQuery: "+selQuery);
		var query = pool.query(selQuery, function(err, result) {
			console.log(JSON.stringify(result));
			res.send(result);
			connection.release();
		});
	});
});

/*
app.post('/logout', function(req, res) {
	logger.info('Entered route /logout');
	var post = req.body;
	var timeSaved= post.timeSaved;
	var timeSavedIn  = post.timeSavedIn;
	
	console.log("--------------");
	console.log(timeSaved);
	console.log(timeSavedIn);
	pool.getConnection(function(err, connection) {
					if (err) {
						console
								.log("Error obtaining connection from pool: "
										+ err);
						connection.release();
						throw err;
					}
					if(post.closeBtn != 'Close'){
						var totalTime=0;
						if(timeSavedIn == '' && !(typeof timeSaved === "undefined")){
							totalTime = parseInt(timeSaved);
						}else if(timeSavedIn != '' ){
							totalTime = 8*parseInt(timeSavedIn);
						}
						
						var sessionUpdateQuery = "update session_master set user_perception="+totalTime+" where session_id='"+req.session.id+"'";
						console.log(sessionUpdateQuery);
						var updateRes=pool.query(sessionUpdateQuery, function(err, sessionResult) {
							if (err) {
								connection.release();
								throw err;	
							}
							console.log("Just after update session master: " +sessionResult );
						});	
						}
					if(req.session.user) {
						var sessionQuery = "insert into session_log (session_id, event_type) values ('"+req.session.id +"',"+ event.Logout+")";
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								console.log(err);
							}
							
						});	
						req.session.destroy();
					}	
					
					sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
					sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
						if (err) {
							console.log("error while executionapp msg"); 
							console.log(err);	
						}
						console.log("appMsg >>>>>> "+sqlQuery+"\n");
						console.log(JSON.stringify(appMsg));
						res.render('login', {'appMsg':appMsg });	
					});
					
					
					
					logger.info('Exiting route /logout');				
						

				});
	
});

*/

app.post('/logout', function(req, res) {
	console.log('Entered route get /logout');
	pool.getConnection(function(err, connection) {
					if (err) {
						console
								.log("Error obtaining connection from pool: "
										+ err);
						connection.release();
						throw err;
					}

					req.session.destroy();
					
					sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
					sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
						if (err) {
							console.log("error while executionapp msg"); 
							console.log(err);	
						}
						console.log("appMsg >>>>>> "+sqlQuery+"\n");
						console.log(JSON.stringify(appMsg));
						res.render('login', {'appMsg':appMsg });	
					});
					
					
					
					//logger.info('Exiting get /logout');				
						

				});
	
});

app.post('/captureRequirements', ensureAuthenticated, function(req, res) {

	console.log('*** Entered route POST /captureRequirements **** \n');
	console.log("req.session: " +req.session);

	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);

		pool.getConnection(function(err, connection) {
					if (err) {
						console
								.log("Error obtaining connection from pool: "
										+ err);
						connection.release();
						throw err;
					}
					var solId;
					if(req.body.solutionId==undefined){
						if(req.query.solId)
							solId=req.query.solId;
						else
							solId=req.body.solId;
						console.log("getting solid from queryParam "+solId);
					}
					else{
						solId=req.body.solutionId;
						console.log("getting solid from requestbody "+solId);
					}
					
					if(solId==undefined || solId<=0){
						solId = -1;
					}
					
					if (solId != -1) {
					//	var querySolutionDtls solutionId;
						//var sqlQuery = "select sol_id, indus_id, PROPOSED_DELIVERY_CENTER, opportunity_id, Customer_Name from solution_basic_details_trx where SOL_ID="+req.body.solutionId ;
						  // query modified for WorkItem #5215 Adding sales connect info pop up 
						  var sqlQuery = "select sol_id, indus_id, PROPOSED_DELIVERY_CENTER, opportunity_id, Customer_Name,smr_number,IFNULL(imt_id,0) as imt_id,IFNULL(iot_id,0) as iot_id,IFNULL(COUNTRY_ID,0) as country_id,opportunity_owner_email, IFNULL(risk_rating, 0) as risk_rating from solution_basic_details_trx where SOL_ID="+solId;
						  console.log("sqlQuery>>>>>>>>>>."+sqlQuery);
						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solInfo){
						if (err) {
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
							console.log(err);
							res.render('ErrorPage');
						}
						
							//console.log("solInfo.imt_id::::::::::::::::"+solInfo[0].imt_id);
							sqlQuery = "select sadt.Sol_area_id sol_area_id,  DATE_FORMAT(sadt.creation_date,'%d-%m-%Y') creation_date, sol_area_name from solution_area_details_trx sadt, solution_area_info sai where SOL_ID="+solId+" and nfr_type=0 and sadt.Sol_area_id = sai.Sol_area_id";	
							sqlSolutionDetails = pool.query(sqlQuery, function(err, solAreaDetails){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								console.log(err);	
								res.render('ErrorPage');
							}
							
							console.log("sqlQuery >>>>>> "+sqlQuery+"\n");
							console.log(solAreaDetails);
					
							var sessionQuery = "insert into session_log (session_id, event_type,sol_id) values ('"+req.session.id +"',"+ event.Initiate_Modification  +","+solId+")";
							console.log(sessionQuery);
							var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								//console.log(err);
								console.log("Table 'session_log' doesn't exist");
							}
							});//session logging ends here	
							console.log(solInfo);
							//adding share Opty delete logic
							sqlQuery = "select OWNER_ID,SHARED_WITH_ID,EDIT_RIGHTS from SHARED_OPTY_INFO where SOL_ID="+solId;
							console.log("1 edit opty "+sqlQuery);
							sqlSolutionDetails = pool.query(sqlQuery, function(err, shareOptyDetail){
								if (err) {
									console.log("error while execution of SHARED_OPTY_INFO select  query"); 
									console.log(err);	
									res.render('ErrorPage');
								}
								var showDelete=0;
								if(shareOptyDetail.length==0)
									showDelete=1;
								for (var i = 0; i < shareOptyDetail.length; i++) {
									if(shareOptyDetail[i].OWNER_ID==req.session.user.emailAddress){
										showDelete=1;
									}
									else
										showDelete=0;
								}
								console.log("showDelete "+showDelete);
								res.render('editOpportunityDetails', {'user' : req.session.user, 'solInfo' :solInfo, 'solAreaDetails':solAreaDetails ,'showDelete':showDelete});	
							});
						});
				
				
									
				});	
			}
	
		else {

				var sessionQuery = "insert into session_log (session_id, event_type) values ('"+req.session.id +"',"+ event.Initiate_Solution  +")";
				console.log(sessionQuery);
				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
				if (err) {
						//connection.release();
						//console.log(err);
						console.log("Table 'session_log' doesn't exist");
					}
				});
				res.render('captureOpportunityDetails', {'user' : req.session.user});
			}	
			connection.release();
		});
		
	}

	else {
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		var postLoginRedirectUrl = req.originalUrl+"?solId="+req.body.solId;
		console.log("requested url *************"+postLoginRedirectUrl);
		//console.log("body incoming "+"")
		 sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			//res.render('login', {'appMsg':appMsg });	
			res.render('login', {'appMsg':appMsg ,'prevUrl':postLoginRedirectUrl });
		});
	}
});



app.get('/captureRequirements', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /captureRequirements **** \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
	//	res.render('captureRequirements', {'user' : req.session.user,"serviceLineInfo":req.body.serviceLineInfo});	
		res.render('captureOpportunityDetails', {'user' : req.session.user,"serviceLineInfo":req.body.serviceLineInfo});	
	
	}

	else {
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		console.log("requested url *************"+req.originalUrl);
		var postLoginRedirectUrl = req.originalUrl;
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			//res.render('login', {'appMsg':appMsg });
			res.render('login', {'appMsg':appMsg ,'prevUrl':postLoginRedirectUrl });	
		});
	}
	
	
});

app.get('/captureRequirements1', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /captureRequirements1 **** \n');
	
	res.render('specify_requirement', {'user' : req.session.user});
});

app.get('/d1', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /d1 **** \n');
	res.render('d1', {'user' : req.session.user});
});

app.get('/test', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /test **** \n');
	res.render('test', {'user' : req.session.user});
});

function getCreatedBy(user){
	return (user == 'sa_superuser@in.ibm.com' ? "select distinct(created_by) from solution_basic_details_trx" : "\'" + user + "\'");
};

//app.get('/advisorHome', function(req, res) {
app.get('/OpportunityDashboard', ensureAuthenticated, function(req, res) {	
	
	console.log('*** Entered route GET /OpportunityDashboard **** \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		

	//	var sqlQuery = "select solution_basic_details_trx.sl_id, sl_name, count(1) num_of_solutions from solution_basic_details_trx , service_line_info where solution_basic_details_trx.created_by='"+req.session.user.emailAddress +"' and solution_basic_details_trx.sl_id = service_line_info.sl_id group by sl_id order by sl_id;";
		var created_by = getCreatedBy(req.session.user.emailAddress);
		var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by in ( "+ created_by +" ) group by sl_id order by sl_id desc;";
		//var sqlQuery = "select solution_basic_details_trx.sol_id, sl_name, customer_name from solution_basic_details_trx , service_line_info  where solution_basic_details_trx.created_by='"+req.session.user.emailAddress +"'and solution_basic_details_trx.sl_id = service_line_info.sl_id";
		console.log("++++++++++++++++++++sqlQuery solDashboardResult in OpportunityDashboard ###: "+sqlQuery);
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			var query = pool.query(sqlQuery, function(err, solDashboardResult) {
				if (err) throw err;	
				console.log(solDashboardResult);
			//	res.render('advisorHome', {'user' : req.session.user,"solDashboardResult":solDashboardResult});
				res.render('OpportunityDashboard', {'user' : req.session.user,"solDashboardResult":solDashboardResult});
			});
			connection.release();
		});
	}
	else { 
		
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});
	
	}

	
	//res.render('advisorHome', {'user' : req.session.user});
});

//app.get('/dashboard', ensureAuthenticated, handleDashboard);
app.get('/dashboard', ensureAuthenticated, function(req, res, next) {
	
	console.log('*** Entered route GET /dashboard **** \n');
	console.log('*** Entered dashboard **** \n');
	
	var jsonObj = {};
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
	
		var sqlQuery;

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}	
		
		console.log("metrics: Last login, Oppys created in current month, Oppys created in this year, " +
		"Total time spent on the tool in current month, Total time spent in current year *** GET /dashboard *** ");

var sqlQueryLastLogin = "select DATE_FORMAT(session_date,'%d-%b-%Y %T') T from session_master where user_email = '"+req.session.user.emailAddress+"' Order by session_date desc  LIMIT 1";

console.log("User LAST Log in ##### : "+sqlQueryLastLogin);

query = pool.query(sqlQueryLastLogin, function(err, sqlQueryLastLoginResult) {
	
	if (err) {
		//console.log(err);
		console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
	}
	
	 if(typeof sqlQueryLastLoginResult!=='undefined' && typeof sqlQueryLastLoginResult[0] !== 'undefined' && sqlQueryLastLoginResult[0] !== null) {
		 p = JSON.stringify(sqlQueryLastLoginResult[0].T).replace(/['"]+/g, '') ;
			
			jsonObj["sqlQueryLastLoginResult"] = p ;
	 }
	
	 
	
	var sqlQueryOppCreateCurrMonth = "select   count( DISTINCT SOL_BASIC.SOL_ID) C from solution_basic_details_trx  " +
	"SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
	" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  " +
	"YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) AND MONTH(SOL_BASIC.creation_date) = MONTH(NOW())" ; 

	console.log("Number of Opportunities  created by the User for this month  ##### : "+sqlQueryOppCreateCurrMonth);

query = pool.query(sqlQueryOppCreateCurrMonth, function(err, sqlQueryOppCreateCurrMonthResult) {

	if (err) {
		console.log(err);
	}

	 if(typeof sqlQueryOppCreateCurrMonthResult[0] !== 'undefined' && sqlQueryOppCreateCurrMonthResult[0] !== null) {
		 p = JSON.stringify(sqlQueryOppCreateCurrMonthResult[0].C);

			jsonObj["sqlQueryOppCreateCurrMonthResult"] = p;
	 }

	
	
	
	var sqlQueryOppCreateCurrYear = "select   count( DISTINCT SOL_BASIC.SOL_ID) C  from solution_basic_details_trx  " +
	"				SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
	" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) " ;

	console.log("Number of Opportunities  created by the User for this Year  ##### : "+sqlQueryOppCreateCurrYear);

	 query = pool.query(sqlQueryOppCreateCurrYear, function(err, sqlQueryOppCreateCurrYearResult) {

		if (err) {
			console.log(err);
		}
		 if(typeof sqlQueryOppCreateCurrYearResult[0] !== 'undefined' && sqlQueryOppCreateCurrYearResult[0] !== null) {
				p = JSON.stringify(sqlQueryOppCreateCurrYearResult[0].C) ;

		 		jsonObj["sqlQueryOppCreateCurrYearResult"] = p;
		 }


 		
 		var sqlQueryTimeSptCurrentMonth ="select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from " +
		"( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
		"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())" +
		"  AND MONTH(s_l.`event_time`) = MONTH(NOW())  group by s_l.`session_id`) A";   	

 		console.log("Total time spent on the tool in current month  ##### : "+sqlQueryTimeSptCurrentMonth);

	  query = pool.query(sqlQueryTimeSptCurrentMonth, function(err, sqlQueryTimeSptCurrentMonthResult) {
	
		 if (err) {
			// console.log(err);
			 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
		 }
	
		 if(typeof sqlQueryTimeSptCurrentMonthResult !=='undefined' && typeof sqlQueryTimeSptCurrentMonthResult[0] !== 'undefined' && sqlQueryTimeSptCurrentMonthResult[0] !== null) {
			 p = JSON.stringify(sqlQueryTimeSptCurrentMonthResult[0].T).replace(/['"]+/g, '');
				
				
			 	jsonObj["sqlQueryTimeSptCurrentMonthResult"] = p ; 
		 }
	
		 
		 	
		 	var sqlQueryTimeSptCurrentYear = "select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from" +
			" ( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
			"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())  " +
			"  group by s_l.`session_id`) A";
	
		 	console.log("Total time spent on the tool in current Year  ##### : "+sqlQueryTimeSptCurrentYear);
	
		 	 query = pool.query(sqlQueryTimeSptCurrentYear, function(err, sqlQueryTimeSptCurrentYearResult) {
		
		 		if (err) {
		 			//console.log(err);
		 			console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
		 		}
		
				 if(typeof sqlQueryTimeSptCurrentYearResult !=='undefined' && typeof sqlQueryTimeSptCurrentYearResult[0] !== 'undefined' && sqlQueryTimeSptCurrentYearResult[0] !== null) {
					 p = JSON.stringify(sqlQueryTimeSptCurrentYearResult[0].T).replace(/['"]+/g, '') ;
						
						
				 		jsonObj["sqlQueryTimeSptCurrentYearResult"] = p ;
				 		
				 }
		
		 		
		
		var sqlQueryTimeSaveCurrMonth = "SELECT COALESCE((select sum(user_perception)  from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
		" YEAR(session_date) = YEAR(NOW()) AND MONTH(session_date) = MONTH(NOW()) group by user_email),0) A";
		
		console.log("Total time saved in current Month  ##### : "+sqlQueryTimeSaveCurrMonth);

		 query = pool.query(sqlQueryTimeSaveCurrMonth, function(err, sqlQueryTimeSaveCurrMonthResult) {

			 if (err) {
				// console.log(err);
				 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
			 }

			 if(typeof sqlQueryTimeSaveCurrMonthResult !=='undefined' && typeof sqlQueryTimeSaveCurrMonthResult[0] !== 'undefined' && sqlQueryTimeSaveCurrMonthResult[0] !== null) {
				  p = JSON.stringify(sqlQueryTimeSaveCurrMonthResult[0].A) ;


					 jsonObj["sqlQueryTimeSaveCurrMonthResult"] = p ;
			 }
			
			 
			 
			 var sqlQueryTimeSaveCurrYear = "select sum(user_perception) A from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
				" YEAR(session_date) = YEAR(NOW()) group by user_email";

				console.log("Total time saved in current Year  ##### : "+sqlQueryTimeSaveCurrYear);

				 query = pool.query(sqlQueryTimeSaveCurrYear, function(err, sqlQueryTimeSaveCurrYearResult) {

					if (err) {
						console.log(err);
					}
					
					 if(typeof sqlQueryTimeSaveCurrYearResult !== 'undefined' && typeof sqlQueryTimeSaveCurrYearResult[0] !== 'undefined' && sqlQueryTimeSaveCurrYearResult[0] !== null) {
						 p = JSON.stringify(sqlQueryTimeSaveCurrYearResult[0].A) ;
							
							
							jsonObj["sqlQueryTimeSaveCurrYearResult"] = p ;
					 }
					
						
		var created_by = getCreatedBy(req.session.user.emailAddress);
		//sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id DESC";
		sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, null as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id DESC";
	
			var query = pool.query(sqlQuery, function(err, solDashboardResult) {
				if (err) throw err;	
				//console.log(solDashboardResult);
				//console.log("printing each element");
				var opportunityList = [];
				var solAreaList = [];
				var opportunity = {};
				var solArea = {};

				for (var i = 0; i < solDashboardResult.length; i++) {

					solAreaList = [];
				
					opportunity = {sol_id: solDashboardResult[i].sol_id, 
								   opportunity_name: solDashboardResult[i].opportunity_name,
								   customer_name:solDashboardResult[i].customer_name,
								   industry_name : solDashboardResult[i].indus_name,
								   total_efforts : solDashboardResult[i].totalEfforts,
								   sol_status : solDashboardResult[i].sol_status,
								   creation_date : solDashboardResult[i].creation_date,
								   last_edit_date : solDashboardResult[i].last_edit_date
								   };
					solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
								sol_area_id: solDashboardResult[i].sol_area_id,
								creation_date: solDashboardResult[i].creation_date};
					solAreaList.push(solArea);				
					while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
						i++;
						solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
								sol_area_id: solDashboardResult[i].sol_area_id,
								creation_date: solDashboardResult[i].creation_date};
					//	console.log("Sol  ID1" + solDashboardResult[i].sol_id)		
						
						solAreaList.push(solArea);	
						
					}

					opportunity.solAreaList = solAreaList;
					opportunityList.push(opportunity);


				}
//				console.log(opportunityList);
				
				//for tab2 data 
				var sqlShareByMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
				"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.created_by in ("+ created_by +") and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.OWNER_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
				console.log("solDashboardResult sqlShareByMe: "+sqlShareByMe);
				var optyShareByMeList = [];
				var query = pool.query(sqlShareByMe, function(err, solDashboardResult) {
					if (err) throw err;	
					var solAreaList = [];
					var opportunity = {};
					var solArea = {};
					for (var i = 0; i < solDashboardResult.length; i++) {
						solAreaList = [];
						opportunity = {sol_id: solDashboardResult[i].sol_id, 
								   opportunity_name: solDashboardResult[i].opportunity_name,
								   customer_name:solDashboardResult[i].customer_name,
								   industry_name : solDashboardResult[i].indus_name,
								   total_efforts : solDashboardResult[i].totalEfforts,
								   sol_status : solDashboardResult[i].sol_status,
								   creation_date : solDashboardResult[i].creation_date,
								   last_edit_date : solDashboardResult[i].last_edit_date
								   };
						solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
									sol_area_id: solDashboardResult[i].sol_area_id,
									creation_date: solDashboardResult[i].creation_date};
						solAreaList.push(solArea);				
						while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
							i++;
							solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
										sol_area_id: solDashboardResult[i].sol_area_id,
										creation_date: solDashboardResult[i].creation_date};
							
							solAreaList.push(solArea);	
						
						}
					opportunity.solAreaList = solAreaList;
					optyShareByMeList.push(opportunity);
					}
					//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareByMeList));
					//end of tab2 data 
					
					//for tab3 data 
					var sqlShareWithMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
					"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.SHARED_WITH_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
					console.log("solDashboardResult optyShareWithMe: "+sqlShareWithMe);
					var optyShareWithMeList = [];
					var query = pool.query(sqlShareWithMe, function(err, solDashboardResult) {
						if (err) throw err;	
						var solAreaList = [];
						var opportunity = {};
						var solArea = {};
						for (var i = 0; i < solDashboardResult.length; i++) {
							solAreaList = [];
							opportunity = {sol_id: solDashboardResult[i].sol_id, 
									   opportunity_name: solDashboardResult[i].opportunity_name,
									   customer_name:solDashboardResult[i].customer_name,
									   industry_name : solDashboardResult[i].indus_name,
									   total_efforts : solDashboardResult[i].totalEfforts,
									   sol_status : solDashboardResult[i].sol_status,
									   creation_date : solDashboardResult[i].creation_date,
									   last_edit_date : solDashboardResult[i].last_edit_date
									   };
							solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
									sol_area_id: solDashboardResult[i].sol_area_id,
									creation_date: solDashboardResult[i].creation_date};
							solAreaList.push(solArea);				
							while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
								i++;
								solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
								sol_area_id: solDashboardResult[i].sol_area_id,
								creation_date: solDashboardResult[i].creation_date};
								solAreaList.push(solArea);	
							
							}
							opportunity.solAreaList = solAreaList;
							optyShareWithMeList.push(opportunity);
						}
						//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareWithMeList));
						//end of tab3 data 
						
						console.log("value =configAms.displayAms "+configAms.displayAms);
						if(configAms.displayAms===true){
							sqlQuery = "SELECT ams.sol_id,DATE_FORMAT(sol_basic.creation_date, '%d-%m-%Y') creation_date,sol_basic.Created_by,sol_basic.opportunity_id,sol_basic.Customer_Name,ams_country.country_id AS country_id,ams_country.country_name,indus.indus_id,indus.indus_name,ams.TICKET_VOLUME,ams.CLIENT_MNGD_TKTS,sec.sector_id,sec.sector_name,ams.AMS_LOCATION,ams.AMS_YRS,ams.MINOR_ENHANCEMENT_HRS,ams.L1_5_TKTS,ams.L2_TKTS,ams.L3_TKTS FROM " +
									"AMS_DETAILS ams,solution_basic_details_trx sol_basic,LEAD_COUNTRY ams_country,industry_info indus,SECTORS sec WHERE ams.sol_id = sol_basic.sol_id AND ams_country.country_id = sol_basic.country_id AND indus.indus_id = sol_basic.indus_id AND sec.sector_id = ams.SECTOR_ID order by sol_basic.creation_date DESC";
							console.log(" SQL FOR AMS  :::::: "+sqlQuery);
							var query = pool.query(sqlQuery, function(err, amsDashboardResult) {
								if (err) throw err;	
								
								//console.log("FINAL OBJECT ######### inside DASHBOARD :::::: "+JSON.stringify(amsDashboardResult));
								
								res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList,'jsonObj':jsonObj,'displayAms':configAms.displayAms,'amsDashboardResult':amsDashboardResult});
									});	
							}
						else
							res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList,'optyShareByMeList':optyShareByMeList,'optyShareWithMeList':optyShareWithMeList,'jsonObj':jsonObj,'displayAms':configAms.displayAms});
										});//end of tab3 
									});//end of tab2 
								});//end of tab1 
							});
				 		});
		 			});
		 	 	});
	  		});
	 	});
	});
			connection.release();
		});
	
	}
	else { 
		
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); 
	}

});
app.get('/users', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /users **** \n');
	
	var list=[];
	for(var i=1;i<10;i++){
		list.push({'user' : req.session.user});
	}
	res.send(list);
});

/*
app.post('/login', function(req, res) {
	
	console.log('*** Entered route POST /login 1 **** \n');
	
	console.log(JSON.stringify(req.body));
	//res.render('advisorHome', {'user' : req.session.user});
	res.render('OpportunityDashboard', {'user' : req.session.user});
});
*/

app.get('/launchUrl', ensureAuthenticated, function(req, res) {	
console.log('*** Entered route POST /login **** \n');
	
	console.log(JSON.stringify(req.body));
	//res.render('advisorHome', {'user' : req.session.user});
	res.render('cogArchLaunchButton');
	
});

app.post('/register', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route POST /register **** \n');
	
	console.log(JSON.stringify(req.body));
	res.render('advisorHome', {'user' : req.session.user});
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


app.get('/serviceLineInfo', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /serviceLineInfo  **** \n');
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}	
		var query = pool.query('select sl_id,sl_name,sl_name_shortname from service_line_info order by sl_id', function(err, result) {
	//		console.log(JSON.stringify(result));
			res.send(result);
			connection.release();
		});
	});
});


app.get('/solutionAreaInfo/:id', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /solutionAreaInfo/:id  **** \n');
	
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select sol_area_id, sl_id,sol_area_name from solution_area_info where sl_id='+id+' order by sol_area_id ', function(err, result) {
	//		console.log(JSON.stringify(result));
			res.send(result);
			connection.release();
		});
	});
});

app.get('/solutionAreaForIndustry/:id', ensureAuthenticated, function (req, res) {

	console.log('*** Entered route GET /solutionAreaForIndustry/:id **** \n');

	var id = req.params.id;
	pool.getConnection(function (err, connection) {
		if (err) {
			console
				.log("Error obtaining connection from pool: "
				+ err);
			connection.release();
			throw err;
		}
			//Making changes for popluating all solution areas for #142
		var sqlQueryCrossindus = "SELECT SolArea.Sol_area_id sol_area_id, SolArea.Sol_area_Name sol_area_name, Indus.Indus_id, Indus.Indus_Name," +
		" LOGMAST.LOGICAL_COMP_ID, LOGMAST.LOGICAL_COMP_NAME, LOGMAST.SORT_ORDER " +
		"FROM solution_area_info SolArea, industry_use_cases_master " +
		"IndusUC, LOGICAL_COMP_MASTER LOGMAST, industry_info Indus" +
		" where IndusUC.indus_id= Indus.Indus_id and " +
		"SolArea.LOGICAL_COMP_ID = LOGMAST.LOGICAL_COMP_ID and IndusUC.indus_id = 101 group by SolArea.Sol_area_id, SolArea.Sol_area_Name, Indus.Indus_id, Indus.Indus_Name, LOGMAST.LOGICAL_COMP_ID, LOGMAST.LOGICAL_COMP_NAME  order by Indus.Indus_id , LOGMAST.LOGICAL_COMP_ID";


		var query = pool.query(sqlQueryCrossindus, function (err, result) {
			if (err) {

				console.log(" Error Inside getAllLogicalComponent() cross Indus @@@ " + err);
				throw err;
			}

			console.log("Inside getAllLogicalComponent After Query cross Indus @@@@ 1" + JSON.stringify(result));

			var logicalCompCrossIndusList = [];

			var industryList = [];
			var industryId = -1;
			for (var i = 0; i < result.length; i++) {
				var industryDetails = {};
				if (industryId !== result[i].Indus_id) {
					industryId = result[i].Indus_id;
					industryDetails['Indus_id'] = result[i].Indus_id;
					industryDetails['Indus_Name'] = result[i].Indus_Name;

					var logicalCompList = [];
					var logicalCompId = -1;

					for (var j = i; j < result.length; j++) {
						var logicalCompListObj = {};
						if (industryId === result[j].Indus_id && logicalCompId !== result[j].LOGICAL_COMP_ID) {
							logicalCompId = result[j].LOGICAL_COMP_ID;
							logicalCompListObj['LOGICAL_COMP_ID'] = result[j].LOGICAL_COMP_ID;
							logicalCompListObj['LOGICAL_COMP_NAME'] = result[j].LOGICAL_COMP_NAME;
							logicalCompListObj['SORT_ORDER'] = result[j].SORT_ORDER;
							logicalCompList.push(logicalCompListObj);

							var solutionAreaList = [];

							for (k = j; k < result.length; k++) {
								var solutionAreaListObj = {};
								if (industryId === result[k].Indus_id && logicalCompId === result[k].LOGICAL_COMP_ID) {

									solutionAreaListObj['sol_area_id'] = result[k].sol_area_id;
									solutionAreaListObj['sol_area_name'] = result[k].sol_area_name;
									solutionAreaList.push(solutionAreaListObj);
									logicalCompListObj['solutionAreaList'] = solutionAreaList;
								}
								else {
									break;
								}
							}
						}
					}
					industryDetails['logicalCompList'] = logicalCompList;
					industryList.push(industryDetails);
				}
			}
			finalObject = { 'industryList': industryList };

			console.log("Final cross Indus JSON @@@@ ----> 1" + JSON.stringify(finalObject));

			if(industryList.length >0) {
				logicalCompCrossIndusList = finalObject.industryList[0].logicalCompList;
			}
			

			finalObject = {};


			var sqlQuery = "SELECT Indus.Indus_id,Indus.Indus_Name,SolArea.Sol_area_id sol_area_id,  SolArea.Sol_area_Name sol_area_name, LOGMAST.LOGICAL_COMP_ID, LOGMAST.LOGICAL_COMP_NAME, LOGMAST.SORT_ORDER FROM  industry_use_cases_master IndusUC RIGHT JOIN industry_info Indus ON  Indus.Indus_id = IndusUC.indus_id LEFT JOIN solution_area_info SolArea  ON  IndusUC.Sol_area_id  = SolArea.Sol_area_id LEFT JOIN LOGICAL_COMP_MASTER LOGMAST ON SolArea.LOGICAL_COMP_ID  = LOGMAST.LOGICAL_COMP_ID where Indus.DISPLAYFLAG = 'Y' and Indus.indus_id in (" + id + ") group by IndusUC.sol_area_id,Indus.Indus_id order by Indus.Indus_id , LOGMAST.LOGICAL_COMP_ID";
			console.log(sqlQuery);
			var query = pool.query(sqlQuery, function (err, result) {
				console.log("Inside solutionAreaForIndustry :--->" + JSON.stringify(result));
				

				var industryList = [];
				var industryId = -1;
				for (var i = 0; i < result.length; i++) {
					var industryDetails = {};
					if (industryId !== result[i].Indus_id) {
						industryId = result[i].Indus_id;
						industryDetails['Indus_id'] = result[i].Indus_id;
						industryDetails['Indus_Name'] = result[i].Indus_Name;

						var logicalCompList = [];
						var logicalCompId = -1;

						for (var j = i; j < result.length; j++) {
							var logicalCompListObj = {};
							console.log("result[j] "+JSON.stringify(result[j]));
							if (industryId === result[j].Indus_id && logicalCompId !== result[j].LOGICAL_COMP_ID && result[j].LOGICAL_COMP_ID !== null) {
								logicalCompId = result[j].LOGICAL_COMP_ID;
								logicalCompListObj['LOGICAL_COMP_ID'] = result[j].LOGICAL_COMP_ID;
								logicalCompListObj['LOGICAL_COMP_NAME'] = result[j].LOGICAL_COMP_NAME;
								logicalCompListObj['SORT_ORDER'] = result[j].SORT_ORDER;
								logicalCompList.push(logicalCompListObj);

								var solutionAreaList = [];

								for (k = j; k < result.length; k++) {
									var solutionAreaListObj = {};
									if (industryId === result[k].Indus_id && logicalCompId === result[k].LOGICAL_COMP_ID && result[k].sol_area_id !== null) {

										solutionAreaListObj['sol_area_id'] = result[k].sol_area_id;
										solutionAreaListObj['sol_area_name'] = result[k].sol_area_name;
										solutionAreaList.push(solutionAreaListObj);
										logicalCompListObj['solutionAreaList'] = solutionAreaList;
									}
									else {
										break;
									}
								}
							}
						}
						console.log("############################################################## 1" + JSON.stringify(logicalCompCrossIndusList));
						console.log("logicalCompList ########################### " + JSON.stringify(logicalCompList));
						//merging Cross Industry specific Logical Component list with rest of the Industry specific Logical component list 
						//var temp = logicalCompList.concat(logicalCompCrossIndusList);
						//Ensuring unique Logical components within Industry
						//console.log("temp ######  " + JSON.stringify(temp));
						//var uniqeList = arrayUnique(temp);
						var uniqeList = arrayUnique(logicalCompCrossIndusList);
						console.log("uniqeList ######  " + JSON.stringify(uniqeList));
						industryDetails['logicalCompList'] = uniqeList;
						industryList.push(industryDetails);
					}
				}
				finalObject = { 'industryList': industryList };
				res.send(finalObject);
				connection.release();

				console.log("FINAL solutionAreaForIndustry ######  " + JSON.stringify(finalObject));


			});

		

		});

	});
});


app.get('/getSolutionAreaInfo', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /getSolutionAreaInfo **** \n');
	
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select sol_area_id, sl_id,sol_area_name from solution_area_info order by sol_area_id ', function(err, result) {
			console.log(JSON.stringify(result));
			res.send(result);
			connection.release();
		});
	});
});

app.get('/captureExistingSolInfo', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route GET /captureExistingSolInfo **** \n');
	
	console.log(JSON.stringify(req.body));
	if(req.session.user) {
	 res.render('captureExistingSolInfo', {'user' : req.session.user});
	}
	else {
		
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
		
	}

});

app.post('/getSolRequirements', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route POST /getSolRequirements **** \n');
	
	if(req.session.user) {
	var sid = req.session.id;
	var timeOut = timeOutSidMap.get(sid);
	
	if(timeOut) { 
		clearTimeout(timeOut);
	}
	timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
	timeOutSidMap.set(sid, timeOut);
	var sol_id = req.body.SOL_ID;
	var indus_id=req.body.INDUS_ID;
	var sol_area_id= req.body.SOL_AREA_ID;
	console.log('***************************** body: '+sol_id );
	//console.log('body: ' + JSON.stringify(post));
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select use_case_id, line_of_business,reqsubcategory,use_case_description from industry_use_cases_master  where use_case_id in (select use_case_id from solution_requirement_matrix where sol_id='+sol_id+')', function(err, result) {
			if (err) throw err;	
			console.log(result);
			var querySolutionAreaInfo = pool.query('select sol_area_id,sl.sl_id sl_id,sl_name,sol_area_name from solution_area_info sol_area, service_line_info sl where sl.sl_id=sol_area.sl_id and sol_area_id='+sol_area_id, function(err, resultSolAreaInfo) {				
				if (err) throw err;	
				var queryIndustryInfo = pool.query('select indus_id,indus_name,indus_description from industry_info where indus_id='+indus_id, function(err, resultIndustryInfo) {
					res.render('getSolRequirements', {'user' : req.session.user,"data":result,solutionAreaInfo:resultSolAreaInfo,"serviceURL":serviceURL,"sol_id":sol_id,"industryInfo":resultIndustryInfo, "sid":req.session.id});
				});
			});
			connection.release();
		});
	});

	}
	else {
		
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); 
	}

});


app.post('/getSolAreaRequirements', ensureAuthenticated, function(req, res) {
	
	console.log('*** Entered route POST /getSolAreaRequirements **** \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var solId = req.body.solId;
		var solAreaId= req.body.solAreaId;
		var indus_id = req.body.industryId;
		
		console.log('***************************** sol_id: '+solId );
		console.log('***************************** solAreaId: '+solAreaId );
		console.log('***************************** Indus ID: '+indus_id );

		//console.log('body: ' + JSON.stringify(post));
		
		var sqlQuery="";	
		
		if(solAreaId == constants.SIInterfaces){
			//sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id,  sol_area.sol_area_name,  indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name,sol_basic_details.sol_id,sol_basic_details.is_perf_test_in_scope as test_in_scope,sol_basic_details.is_soak_test_in_scope, complexity_master.complexity_title, sol_req_matrix.is_perf_test_in_scope, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech1) as tech1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech2) as tech2, esb_est.new_simple new_simple_complexity_count, esb_est.new_medium new_medium_complexity_count, esb_est.new_complex new_complex_complexity_count, esb_est.new_vcomplex new_very_complex_complexity_count from esb_integration_estimations esb_est, industry_use_cases_master indus_master, solution_requirement_matrix sol_req_matrix, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where esb_est.use_case_id = sol_req_matrix.use_case_id and esb_est.sol_id = sol_req_matrix.sol_id and indus_master.use_case_id = sol_req_matrix.use_case_id and sol_area.sol_area_id = indus_master.sol_area_id and sol_basic_details.indus_id = indus_info.indus_id and sol_basic_details.indus_id = indus_master.indus_id and sl_info.sl_id = sol_area.sl_id and complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.sol_id = sol_req_matrix.sol_id and sol_req_matrix.sol_id =" +solId+ " and sol_area.sol_area_id ="+solAreaId;
			//sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id, sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id,  sl_info.sl_name, sol_basic_details.sol_id, sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope, sol_basic_details.is_perf_test_in_scope, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech1) as tech1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech2) as tech2, esb_est.new_simple new_simple_complexity_count, esb_est.new_medium new_medium_complexity_count, esb_est.new_complex new_complex_complexity_count, esb_est.new_vcomplex new_very_complex_complexity_count from esb_integration_estimations esb_est, industry_use_cases_master indus_master, industry_info indus_info, service_line_info sl_info, solution_basic_details_trx sol_basic_details, solution_area_info  sol_area where esb_est.sol_id = sol_basic_details.sol_id and indus_master.use_case_id = esb_est.use_case_id and  indus_info.indus_id = sol_basic_details.indus_id and sl_info.sl_id = sol_area.sl_id and sol_area.sol_area_id = " +solAreaId+ "   and sol_basic_details.sol_id =  "+solId+" and indus_master.Indus_id in ( "+ indus_id + " , 101)";
			  sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id, sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id,  sl_info.sl_name, sol_basic_details.sol_id, sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope, sol_basic_details.is_perf_test_in_scope, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech1) as tech1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech2) as tech2, esb_est.new_simple new_simple_complexity_count, esb_est.new_medium new_medium_complexity_count, esb_est.new_complex new_complex_complexity_count, esb_est.new_vcomplex new_very_complex_complexity_count from esb_integration_estimations esb_est, industry_use_cases_master indus_master, industry_info indus_info, service_line_info sl_info, solution_basic_details_trx sol_basic_details, solution_area_info  sol_area where esb_est.sol_id = sol_basic_details.sol_id  and  indus_info.indus_id = sol_basic_details.indus_id and sl_info.sl_id = sol_area.sl_id and sol_area.sol_area_id = " +solAreaId+ "   and sol_basic_details.sol_id =  "+solId+" and indus_master.Indus_id in ( "+ indus_id + " , 101)";

		} else if(solAreaId == constants.SIAdapters){
			sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, 'System Integration Adapters Count' as use_case_description, sol_area.sol_area_id, sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name, sol_basic_details.sol_id, sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope, IFNULL((select SIMPLE from esb_adapters_estimations where SOL_ID=sol_basic_details.SOL_ID), '0') as simple_count, IFNULL((select MEDIUM from esb_adapters_estimations where SOL_ID=sol_basic_details.SOL_ID), '0') as medium_count, IFNULL((select COMPLEX from esb_adapters_estimations where SOL_ID=sol_basic_details.SOL_ID), '0') as complex_count from industry_use_cases_master indus_master, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where sol_basic_details.indus_id = indus_info.indus_id and sol_area.sol_area_id = indus_master.sol_area_id and	complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.indus_id = indus_info.indus_id and sl_info.sl_id = sol_area.sl_id and sol_basic_details.sol_id = " +solId+ " and sol_area.sol_area_id ="+solAreaId+" and indus_master.Indus_id in ( "+ indus_id + " , 101)";
		} else if(solAreaId == constants.AnalyticsSPSS){
			//sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id,  sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name,sol_basic_details.sol_id,sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope, IFNULL((select complexity_title from complexity_master where complexity_master.complexity_id=(select complexity_id from spss_estimations where group_id=indus_master.reqsubcategoryId and sol_id=sol_basic_details.sol_id)), 'N/A') as complexity_title from industry_use_cases_master indus_master, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where sol_basic_details.indus_id = indus_info.indus_id and sol_area.sol_area_id = indus_master.sol_area_id and	complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.indus_id = indus_info.indus_id and sol_basic_details.indus_id = indus_master.indus_id and sl_info.sl_id = sol_area.sl_id and sol_basic_details.sol_id = " +solId+ "  and sol_area.sol_area_id = "+solAreaId+" and indus_master.Indus_id in ( "+ indus_id + " , 101 )";
			sqlQuery="select indus_master.use_case_description,sol_area.sol_area_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.indus_id, sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name, sol_basic_details.sol_id, sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope,  IFNULL((select complexity_title from complexity_master where complexity_master.complexity_id=(select complexity_id from spss_estimations where group_id=indus_master.reqsubcategoryId and sol_id=sol_basic_details.sol_id)), 'N/A') as complexity_title from industry_use_cases_master indus_master, solution_basic_details_trx sol_basic_details, solution_area_info sol_area, industry_info indus_info, service_line_info sl_info where indus_master.sol_area_id = "+solAreaId+" and indus_master.indus_id in ( " + indus_id + ", 101 ) and sol_basic_details.sol_id = " +solId+ " and  sol_area.sol_area_id =indus_master.sol_area_id and indus_info.indus_id=sol_basic_details.indus_id and sl_info.sl_id = sol_area.sl_id";
		}else if(solAreaId == constants.DatawareHouse){
			sqlQuery="SELECT sol_area.sol_area_id,sol_area.sol_area_name,dw_est.group_id,dw_details.title AS use_case_description,indus_info.indus_name AS line_of_business,dw_details.title AS reqsubcategory, dw_est.complexity_id, comp_mast.Complexity_title as complexity_title, indus_info.indus_name,indus_info.indus_id,sl_info.sl_id, sl_info.sl_name,sol_basic.sol_id,sol_basic.is_perf_test_in_scope AS test_in_scope,sol_basic.is_soak_test_in_scope FROM dw_estimations dw_est, dw_details, complexity_master comp_mast,solution_basic_details_trx sol_basic,industry_info indus_info,service_line_info sl_info ,solution_area_info sol_area WHERE dw_est.sol_id ="+solId+" AND dw_details.id = dw_est.group_id  AND comp_mast.complexity_id = dw_est.complexity_id AND sol_basic.sol_id = dw_est.sol_id AND indus_info.indus_id = sol_basic.indus_id AND sl_info.sl_id = sol_basic.sl_id AND sol_area.sol_area_id = "+solAreaId;
		}		
		else{
			sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id,  sol_area.sol_area_name,  indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name,sol_basic_details.sol_id,sol_basic_details.is_perf_test_in_scope as test_in_scope,sol_basic_details.is_soak_test_in_scope, complexity_master.complexity_title, sol_req_matrix.is_perf_test_in_scope from industry_use_cases_master indus_master, solution_requirement_matrix sol_req_matrix, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where indus_master.use_case_id = sol_req_matrix.use_case_id and sol_area.sol_area_id = indus_master.sol_area_id and sol_basic_details.indus_id = indus_info.indus_id and sl_info.sl_id = sol_area.sl_id and complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.sol_id = sol_req_matrix.sol_id and sol_req_matrix.sol_id = " +solId+ " and sol_area.sol_area_id ="+solAreaId+" and indus_master.Indus_id in ( "+ indus_id + " , 101 )";
		}
 
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}

			var countVal=0;
			var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +solId+" and is_perf_test_in_scope = 1", function(err, countResult) {
				if (err) throw err;	
				countVal = countResult[0].count;
				console.log("The count is -> "+countResult[0].count);
			});
			
			console.log("sqlQuery :: "+sqlQuery);
			var query = pool.query(sqlQuery, function(err, solRequirementResult) {
				if (err) throw err;	
				console.log("solRequirementResult: "+JSON.stringify(solRequirementResult));

				res.render('getSolRequirements', {'user' : req.session.user,"solRequirementResult":solRequirementResult,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal});

			});
			connection.release();
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}

});




app.post('/captureSolAreaUseCases', ensureAuthenticated, function(req, res) {
	
	console.log('------- Entered route POST /captureSolAreaUseCases ----- \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var useCaseInfoType = post.useCaseInfoType;
		var currentSolAreaId= post.currentSolAreaId;
		var solId = post.solId;
		var testSolId=post.testSolId;
		var soakTestId=post.soakTestId;
		var model = post.model;
		var sprintWeeks;
		var isedit = post.isedit;
		
		if(post.sprintWeeks) {
			sprintWeeks = post.sprintWeeks;
		}
		else
			sprintWeeks = 0;
		
		
		
		console.log("isedit:::::::::::+++"+isedit);
		console.log("typeof isedit>>>>>>>"+typeof isedit);
		console.log("post.edit_delivery_model:::::::::::"+post.edit_delivery_model);
		console.log("post.edit_sprint_weeks:::::::::::"+post.edit_sprint_weeks);
		console.log("post.edit_usecase_info_type:::::::::::"+post.edit_usecase_info_type);
		console.log("post.useCaseInfoType:::::::::::"+post.useCaseInfoType);
		console.log("post.model:::::::::::"+post.model);
		console.log("post.sprintWeeks:::::::::::"+post.sprintWeeks);
		
		if(isedit=="true"){
			if(!post.model){
				model = post.edit_delivery_model;
			}
			
			if(!post.sprintWeeks) {
				sprintWeeks = post.edit_sprint_weeks;
			}
			
			if(!post.useCaseInfoType) {
				useCaseInfoType = post.edit_usecase_info_type;
			}
			
			
			if(post.is_perf_test_in_scope ==1){
				testSolId = "Y"
			} else{
				testSolId = "N"
			}

			if(post.is_soak_test_in_scope ==1){
				soakTestId = "Y"
			} else{
				soakTestId = "N"
			}
		} else{						
			
			if(!post.useCaseInfoType){
				useCaseInfoType = post.edit_usecase_info_type;
				if(post.is_perf_test_in_scope ==1){
					testSolId = "Y"
				} else{
					testSolId = "N"
				}

				if(post.is_soak_test_in_scope ==1){
					soakTestId = "Y"
				} else{
					soakTestId = "N"
				}
			}
			
			if(!post.model){
				model = post.edit_delivery_model;
			}
			
			//if(!post.sprintWeeks){
			//	sprintWeeks = post.edit_sprint_weeks;
			//}			
		}
		
		//reset sprintweeks for waterfall model
		if(model == 1){
			sprintWeeks = 0;
		}
		
		console.log("finally :::::::::::+++");
		console.log("useCaseInfoType:::::::::::"+useCaseInfoType);
		console.log("model:::::::::::"+model);
		console.log("sprintWeeks:::::::::::"+sprintWeeks);
		console.log("testSolId:::::::::::+++"+testSolId);
		console.log("soakTestId:::::::::::+++"+soakTestId);
		
		
		if((typeof useCaseInfoType == 'undefined') && (currentSolAreaId ==constants.SIInterfaces)){
			useCaseInfoType = 1;
		}
		
		console.log(":::::::::::::::::::::::model:::::::::"+model);
		console.log(":::::::::::::::::::::::sprintWeeks:::::::::"+sprintWeeks);
		console.log(":::::::::::::::::::::::useCaseInfoType:::::::::"+useCaseInfoType);
		console.log(":::::::::::::::::::::::currentSolAreaId:::::::::"+currentSolAreaId);
		

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}

			//var sqlUpdateQuery = "update solution_area_details_trx set delivery_model = " +model +",sprint_weeks=" +sprintWeeks+",usecase_info_type = "+useCaseInfoType +" where sol_id="+solId+" and sol_area_id="+currentSolAreaId+" and nfr_type =0" ;
			var sqlUpdateQuery = "update solution_area_details_trx set delivery_model = " +model +",sprint_weeks=" +sprintWeeks+",usecase_info_type = "+useCaseInfoType +" where sol_id="+solId ;
			console.log("Inside the captrureSolAreaUseCases  SQLUPDATE Query:" + sqlUpdateQuery);
				var insertQuery = pool.query(sqlUpdateQuery, function(err, solAreaResult) {
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query for Perf Test Estimation"); 
								throw err;	
							}
				});

			if(testSolId == 'Y'){
				var soak = 0;
				if(soakTestId == 'Y')
					soak = 1;
				var sqlUpdateQuery = pool.query("update solution_basic_details_trx set is_perf_test_in_scope = 1,is_soak_test_in_scope="+soak+" where sol_id = "+solId, function(err,resultUpdateUseCases) {
					if (err)  throw err;	
				});
//				var sqlSelectQuery = "select sol_id,sol_area_id from solution_area_details_trx where sol_id="+solId+" and sol_area_id="+currentSolAreaId+ " and nfr_type=1";
//				
//				var selectQuery = pool.query(sqlSelectQuery, function(err, solAreaResultCheck) {
//					if(solAreaResultCheck.length == 0){
//						var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id,nfr_type) values("+solId+","+currentSolAreaId+",1)";
//						var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
//							if (err) {
//								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query for Perf Test Estimation"); 
//								throw err;	
//							}
//						});
//					}
//				});
			}
			if (useCaseInfoType==1){	//High level View
				console.log(" ++++++Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);
//				var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";	
				//var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select is_perf_test_in_scope from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";
				//var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select is_perf_test_in_scope from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";
				
				var sqlQuery= "";
				if((post.currentSolAreaId==constants.AnalyticsSPSS) || (post.currentSolAreaId==constants.SIInterfaces) || (post.currentSolAreaId==constants.DatawareHouse)){
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name,  " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId;
				}else{					
					//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name,  " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select distinct(is_perf_test_in_scope) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";
					//changing service line to ADMI if only AMS oppy
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name,  " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select distinct(is_perf_test_in_scope) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry ,solution_basic_details_trx sol_basic where uc_master.active=1 and sl.sl_id = sol_basic.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId+" and sol_basic.sol_id="+post.solId+" group by reqsubcategoryid";
					
				}
				console.log(" ***** sqlQuery>>"+sqlQuery);
				var query = pool.query(sqlQuery, function(err, solAreaResult) {
					if (err) throw err;	
					if(solAreaResult.length > 0) {
							console.log(" ***** Inside captureSolAreaUseCases, currentSolAreaId:: "+currentSolAreaId);
							console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
							console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
						if(currentSolAreaId ==constants.AnalyticsSPSS){														
							var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
	
							var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								
								console.log("Page is ##### getSPSSUseCaseInfo.html");
								
								res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
							});	
						}else if(currentSolAreaId ==constants.DatawareHouse){														
							//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
							var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
							var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								
								console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
								res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
							});	
						}else if(currentSolAreaId ==constants.WatsonCustomerAssist){
							//var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
							var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
							
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getWatsonCustomerAssistInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}else if(currentSolAreaId ==constants.SIInterfaces){														
								//var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1),'TBD') as name1, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2),'TBD') as name2, IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=constants.SIInterfaces),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=constants.SIInterfaces and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
								var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1),'TBD') as name1, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2),'TBD') as name2, IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105 and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
				     								
								var defValuesQuery = pool.query(sqlDefaultESBValues, function(err, sqlDefaultESBValuesQResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									var sqlPerfValQuery = "select IFNULL(Flex_Field_1,0) as perfPercent from solution_area_details_trx where SOL_ID="+solId +" and Sol_area_id="+post.currentSolAreaId;
     								console.log("sqlPerfValQuery: "+sqlPerfValQuery);
     								
									var perfVal = pool.query(sqlPerfValQuery, function(err, sqlPerfValQueryResults) {
										if (err) {
											console.log("error while execution of sqlPerfValQuery select  query"); 
											throw err;	
										}
										console.log("sqlPerfValQueryResults[0].perfPercent: "+sqlPerfValQueryResults[0].perfPercent);
										
										var sqlAdaptersQuery = "select SIMPLE, MEDIUM, COMPLEX from esb_adapters_estimations where SOL_ID="+solId;
										var query = pool.query(sqlAdaptersQuery, function(err, sqlAdaptersResult) {
											if (err) throw err;	
											
											console.log("Page is ##### getSystemIntegrationUseCaseInfo.html");
											res.render('getSystemIntegrationUseCaseInfo', {'adapters':sqlAdaptersResult,'perfPercent':sqlPerfValQueryResults[0].perfPercent, 'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
										});																				
									});									
								});	
						}else if(currentSolAreaId ==constants.SIAdapters){														
							var sqlAdaptersQuery = "select SIMPLE, MEDIUM, COMPLEX from esb_adapters_estimations where SOL_ID="+solId;
							var query = pool.query(sqlAdaptersQuery, function(err, sqlAdaptersResult) {
								if (err) throw err;	
								
								console.log("Page is ##### getSystemIntegrationAdaptersInfo.html");
								res.render('getSystemIntegrationAdaptersInfo', {'adapters':sqlAdaptersResult,'useCaseInfoType': useCaseInfoType, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
							});
						}
						else if(currentSolAreaId ==constants.AMSTicketBased){
							var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
							
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}else if(currentSolAreaId ==constants.AMSResourceBased){
							var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
							
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}
						else if(currentSolAreaId ==constants.AMSProductBased){
							var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;

							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}
						
						else{
							
							console.log("Page is ##### getHLUseCaseInfo.html");
							res.render('getHLUseCaseInfo', {'isedit' : post.isedit, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});
						}
												
						//Session logging info
						var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",0,'Success',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
						
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
							//	connection.release();
								//console.log(err);
								console.log("Table 'session_log' doesn't exist");
								
							}
						});//session logging ends here	
					}
					else {
						console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
						console.log("2");
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_basic_details_trx.opportunity_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								throw err;	
							}
							console.log("Error no use cases."); 
							var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",1,'Failure: No use cases available',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
							console.log(sessionQuery);
							var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								//console.log(err);
								console.log("Table 'session_log' doesn't exist");

							}
							});//session logging ends here	
							var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
							connection.query(screenFieldQry, function(error, scrnFldRes, fields){
								if(error){
									throw error;
								}
								var screenField = {};
								for(var i = 0; i < scrnFldRes.length; i++){
									var rec = scrnFldRes[i];
								console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
								if(rec.IS_USE_CASES_VIEW_HIDDEN){
									if(i===0){
										screenField["isUsecaseHidden"] = 1;
									}
									screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isUsecaseHidden;
								}
								if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
									if(i===0){
										screenField["isPerfTestHidden"] = 1;
									}
									screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isPerfTestHidden;
								}
								if(rec.IS_MODEL_HIDDEN){
									if(i===0){
										screenField["isModelHidden"] = 1;
									}
									screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
								}
								else{
									delete screenField.isModelHidden;
								}
								if(rec.IS_SPRINT_WEEKS_HIDDEN){
									if(i===0){
										screenField["isSprintWeeksHidden"] = 1;
									}
									screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isSprintWeeksHidden;
								}
							}
							console.log("screenField : ");
							console.log(screenField);
							
							console.log("Page is ##### solutionDetails.html");
							res.render('solutionDetails', {'isedit' : isedit, 'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
						});
						});

					}
				});
			}
			else{   //Detailed View
				console.log(" ***** Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);
				var sqlQuery= "";
				if((post.currentSolAreaId==constants.SIInterfaces) || (post.currentSolAreaId==constants.AnalyticsSPSS)|| (post.currentSolAreaId==constants.DatawareHouse)){
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name,  " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId;
				}
				else if(post.currentSolAreaId==constants.SAPAriba){
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select distinct(is_perf_test_in_scope) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId;
				}
				/*else if(post.currentSolAreaId==constants.AMSTicketBased){
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select distinct(is_perf_test_in_scope) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId;
				}*/
				else{					
					//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, uc_master.IS_ALWAYS_INSCOPE, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select distinct(is_perf_test_in_scope) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId;
					//changing service line to ADMI if only AMS oppy
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + post.industryId + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, uc_master.IS_ALWAYS_INSCOPE, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select distinct(is_perf_test_in_scope) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry,solution_basic_details_trx sol_basic where uc_master.active=1 and sl.sl_id = sol_basic.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+post.currentSolAreaId+" and sol_basic.sol_id="+post.solId ;
					
				}
								
				console.log("sqlQuery:::::::::::::::<>>>>"+sqlQuery);
				var query = pool.query(sqlQuery, function(err, solAreaResult) {
					if (err) throw err;	
					if(solAreaResult.length > 0) {
						console.log(" ***** Inside captureSolAreaUseCases, Success and forward to captureSolAreaUseCases ");
						var isAddlParamQry = "select IS_ADD_PARAM from solution_area_info where Sol_area_id = " + currentSolAreaId;
						console.log(isAddlParamQry);
						connection.query(isAddlParamQry, function(err, addlParamCheckRes, fields){
							if (err) throw err;
							var isAddlParam = addlParamCheckRes[0].IS_ADD_PARAM;
							console.log('DB response  addlParam : ' + isAddlParam); 
							if(currentSolAreaId ==constants.AnalyticsSPSS){														
								var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
		
								var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									
									console.log("Page is ##### getSPSSUseCaseInfo.html");
									res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
								});	
							}
							else if(currentSolAreaId ==constants.DatawareHouse){														
								//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
								var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
								var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									
									console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
									res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
								});	
							}
							else if(currentSolAreaId ==constants.WatsonCustomerAssist){														
								//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
								//var sqlWatsonValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
								var sqlWatsonValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
								console.log("sqlWatsonValues:: "+sqlWatsonValues);
								var defValuesQuery = pool.query(sqlWatsonValues, function(err, sqlWatsonValuesResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									console.log("sqlWatsonValuesResults:: "+sqlWatsonValuesResults[0]);
									console.log("Page is ##### getWatsonCustomerAssistInfo.html");
									res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlWatsonValuesResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
								});	
							}else if(currentSolAreaId ==constants.SIInterfaces){
								//var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1),'TBD') as name1, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2),'TBD') as name2, IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105 and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
								//var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1),'TBD') as name1, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2),'TBD') as name2, IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105 and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
								var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IF(tech1=1000,userdefined_system_1,(select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1)) as name1,IF(tech2=1000,userdefined_system_2,(select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2)) as name2,IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105 and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
								
								console.log("sqlDefaultESBValues >>"+sqlDefaultESBValues);
								var defValuesQuery = pool.query(sqlDefaultESBValues, function(err, sqlDefaultESBValuesQResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									console.log("sqlDefaultESBValuesQResults:: "+sqlDefaultESBValuesQResults);
									var sqlPerfValQuery = "select IFNULL(Flex_Field_1,0) as perfPercent from solution_area_details_trx where SOL_ID="+solId +" and Sol_area_id="+post.currentSolAreaId;
									console.log("sqlPerfValQuery: "+sqlPerfValQuery);
									
									var perfVal = pool.query(sqlPerfValQuery, function(err, sqlPerfValQueryResults) {
										if (err) {
											console.log("error while execution of sqlPerfValQuery select  query"); 
											throw err;	
										}
										console.log("sqlPerfValQueryResults[0].perfPercent: "+sqlPerfValQueryResults[0].perfPercent);
										var sqlAdaptersQuery = "select SIMPLE, MEDIUM, COMPLEX from esb_adapters_estimations where SOL_ID="+solId;
										var query = pool.query(sqlAdaptersQuery, function(err, sqlAdaptersResult) {
											if (err) throw err;		
											
											console.log("Page is ##### getSystemIntegrationUseCaseInfo.html");
											res.render('getSystemIntegrationUseCaseInfo', {'adapters':sqlAdaptersResult,'perfPercent':sqlPerfValQueryResults[0].perfPercent, 'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
										});	
										//res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':sqlPerfValQueryResults[0].perfPercent, 'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});
									});	
									//res.render('getSystemIntegrationUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});
								});	
							}else if(currentSolAreaId ==constants.SIAdapters){														
								var sqlAdaptersQuery = "select SIMPLE, MEDIUM, COMPLEX from esb_adapters_estimations where SOL_ID="+solId;
								var query = pool.query(sqlAdaptersQuery, function(err, sqlAdaptersResult) {
									if (err) throw err;		
									
									console.log("Page is ##### getSystemIntegrationAdaptersInfo.html");
									res.render('getSystemIntegrationAdaptersInfo', {'adapters':sqlAdaptersResult,'useCaseInfoType': useCaseInfoType, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
								});
							}else if(currentSolAreaId ==constants.AMSTicketBased){
								var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
								
								console.log("sqlDefaultValues >>"+sqlDefaultValues);
								var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
									console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
									if (sqlDefaultValuesQResults.length === 0)
										res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
									else 
										res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								
								});	
							}
							else if(currentSolAreaId ==constants.AMSResourceBased){
								var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
								
								console.log("sqlDefaultValues >>"+sqlDefaultValues);
								var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
									console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
									if (sqlDefaultValuesQResults.length === 0)
										res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
									else 
										res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								
								});	
							}
							else if(currentSolAreaId ==constants.AMSProductBased){
								var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;
								
								console.log("sqlDefaultValues >>"+sqlDefaultValues);
								var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
									if (err) {
										console.log("error while execution of sqlDefaultValues select  query"); 
										throw err;	
									}
									console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
									console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
									if (sqlDefaultValuesQResults.length === 0)
										res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
									else 
										res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								
								});	
							}
							else{								
								
								if(post.currentSolAreaId==constants.IBMDigitalExperience && isAddlParam === 1){
									var sql = "select distinct trx.SOL_ID, (select count(aptrx.ADDNL_PARAM_ID) from SOL_AREA_ADDNLPARAM_TX aptrx, SOL_AREA_ADDNLPARAM_MASTER apm where aptrx.ADDNL_PARAM_ID = apm.ADDNL_PARAM_ID and aptrx.SOL_ID = " + post.solId + " and apm.ADDNLPARAM_GROUP_NAME = 'Portal') as count_portal, (select count(aptrx.ADDNL_PARAM_ID) from SOL_AREA_ADDNLPARAM_TX aptrx, SOL_AREA_ADDNLPARAM_MASTER apm where aptrx.ADDNL_PARAM_ID = apm.ADDNL_PARAM_ID and aptrx.SOL_ID = " + post.solId + " and apm.ADDNLPARAM_GROUP_NAME = 'WCM') as count_wcm from SOL_AREA_ADDNLPARAM_TX trx where trx.SOL_ID = " + post.solId;
									connection.query(sql, function(err, results, fields){
										if (err) throw err;	
										var param = "";
										console.log("results : " + results);
										if(results.length > 0 && results[0].count_portal === 0){
											param = "WCM";
										}
										else if(results.length > 0 && results[0].count_wcm === 0){
											param = "Portal";
										}
										console.log("PARAM : " + param);
										console.log("Page is ##### getUseCaseInfo.html");
										res.render('getUseCaseInfo', {'isedit' : isedit, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId, "model":model, "sprintWeeks": sprintWeeks, "isAddlParam": isAddlParam, "param": param});
									})

									
								}else{
									console.log("Page is ##### getUseCaseInfo.html");
									res.render('getUseCaseInfo', {'isedit' : isedit, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId, "model":model, "sprintWeeks": sprintWeeks, "isAddlParam": isAddlParam});
								}
							
							}
						});
						var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",0,'Success',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
						
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								//console.log(err);
								console.log(" Table 'session_log' doesn't exist");
							}
						});//session logging ends here	

					}
					else {
						console.log(" ***** Inside captureSolAreaUseCases, No result and forward to solution details page");
						console.log("3");
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_basic_details_trx.opportunity_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";

						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								throw err;	
							}
							console.log("Error no use cases available.");
							var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",0,'Failure: No use cases available',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
							
							console.log(sessionQuery);
							var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								//console.log(err);
								console.log(" Table 'session_log' doesn't exist");

							}
							});//session logging ends here	 
							var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
							connection.query(screenFieldQry, function(error, scrnFldRes, fields){
								if(error){
									throw error;
								}
								var screenField = {};
								for(var i = 0; i < scrnFldRes.length; i++){
									var rec = scrnFldRes[i];
								console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
								if(rec.IS_USE_CASES_VIEW_HIDDEN){
									if(i===0){
										screenField["isUsecaseHidden"] = 1;
									}
									screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isUsecaseHidden;
								}
								if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
									if(i===0){
										screenField["isPerfTestHidden"] = 1;
									}
									screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isPerfTestHidden;
								}
								if(rec.IS_MODEL_HIDDEN){
									if(i===0){
										screenField["isModelHidden"] = 1;
									}
									screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
								}
								else{
									delete screenField.isModelHidden;
								}
								if(rec.IS_SPRINT_WEEKS_HIDDEN){
									if(i===0){
										screenField["isSprintWeeksHidden"] = 1;
									}
									screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isSprintWeeksHidden;
								}
							}
							console.log("screenField : ");
							console.log(screenField);
							
							console.log("Page is ##### solutionDetails.html");
							res.render('solutionDetails', {'isedit' : isedit, 'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
						});
						});

					}			
				});
			}
			connection.release();
		});
		
	}

	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
}); 


app.post('/similarSolutions',ensureAuthenticated, function(req, res){
    
	 console.log('route called with post /similarSolutions');
	 
	 if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
	 
		if(timeOut) {
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
	 
		var post = req.body;
		var solutionAreaInfo = [];
		// Changes for workitem #5215 sales connect info popup
		if(post.imt_id=='') post.imt_id = null;
		if(post.iot_id=='') post.iot_id = null;
		if(post.risk_rating=='') post.risk_rating = null;
		if(post.country_id=='') post.country_id = null;
		
		console.log('Req Body : ');
		console.log(post);
	 
		//Check if there is only one solution area selected, then create array
		if(util.isArray(post.solutionAreaInfo)) {
			solutionAreaInfo = post.solutionAreaInfo;
	 
		} else {
			solutionAreaInfo.push(post.solutionAreaInfo);
		}
	 
		console.log("solutionAreaInfo:::::::::::"+solutionAreaInfo);
		console.log("post.industryInfo::::::::::" + post.industryInfo);  
		console.log("post.IOTInfo :::::::: "+post.IOTInfo);
		console.log("post.LeadCountryInfo :::::::: "+post.LeadCountryInfo);

		var solutionAreaInfoString = solutionAreaInfo.join(",");
		 
		var sqlQuery="SELECT DISTINCT sadt.SOL_ID FROM solution_area_details_trx sadt, solution_basic_details_trx sbdt WHERE sadt.Sol_area_id IN (" + solutionAreaInfoString  + ") AND sadt.nfr_type=0 AND sadt.sol_status='COMPLETE' AND sadt.SOL_ID = sbdt.SOL_ID AND sbdt.indus_id = " + post.industryInfo + " AND IF((SELECT COUNT(*) FROM solution_area_details_trx WHERE solution_area_details_trx.SOL_ID=sbdt.SOL_ID AND SOL_STATUS='INCOMPLETE') > 0, 0, 1) = 1 ORDER BY sadt.SOL_ID desc";
       
		console.log(sqlQuery);
      
		pool.getConnection(function(err, connection){
			if (err) {
				console.log("Error obtaining connection from pool: "+ err);
				//connection.release();
				throw err;
			}

			connection.query(sqlQuery, function(err, result1, fields){
				if (err) throw err;
				console.log('DB response  result1 : ');
				console.log("result1.length"+result1.length);
				
				if(result1.length == 0){
					processNewSolutionReq(req, res);
				} else{
								
					var categorizedSolIdList = {};

					loopSolIds(result1, solutionAreaInfo, 0, connection, res, req, post, categorizedSolIdList, solutionAreaInfoString, post.IOTInfo);	
				}
			});
								  
		});
      
    }
    else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }

});

function renderSortedOpportunityList(sortedSolIdList, connection, res, req, post, solutionAreaInfoString, IOTInfo){
	console.log('sortedSolIdList : '+sortedSolIdList);
	console.log("Inside renderSortedOpportunityList ::: "+IOTInfo);
	var param = sortedSolIdList.join(",");
	/*for (let d = 0; d < sortedSolIdList.length; d++){
		if(d===0){
			param = param + sortedSolIdList[d];
		}
		else{
			param = param + ", " + sortedSolIdList[d];
		}
	}*/
	
	//var qry = "SELECT sol_details.SOL_ID, sol_area.Sol_area_Name,indus_info.Indus_Name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, IF(sol_details.Customer_Name IS NULL OR sol_details.Customer_Name='' ,'Not available',sol_details.Customer_Name ) customer_name, IF(sol_details.opportunity_id IS NULL OR sol_details.opportunity_id='' ,'Not available',sol_details.opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) AS totalEfforts, IF(sol_area_trx.SOL_STATUS = 'COMPLETE', 1, 0) as sol_status, DATE_FORMAT((SELECT MAX(event_time) FROM session_log WHERE session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') AS last_edit_date FROM solution_basic_details_trx sol_details, solution_area_info	sol_area, industry_info indus_info, solution_area_details_trx sol_area_trx WHERE sol_details.sol_id IN (" + param + ") AND sol_details.sol_id = sol_area_trx.sol_id AND indus_info.indus_id = sol_details.indus_id AND sol_details.indus_id = " + post.industryInfo  + " AND sol_area.sol_area_id = sol_area_trx.sol_area_id AND sol_area_trx.nfr_type=0 AND sol_area_trx.sol_status='COMPLETE'";
	var qry = "SELECT sol_details.SOL_ID, sol_area.Sol_area_Name,indus_info.Indus_Name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, IF(sol_details.Customer_Name IS NULL OR sol_details.Customer_Name='' ,'Not available',sol_details.Customer_Name ) customer_name, IF(sol_details.opportunity_id IS NULL OR sol_details.opportunity_id='' ,'Not available',sol_details.opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) AS totalEfforts, IF(sol_area_trx.SOL_STATUS = 'COMPLETE', 1, 0) as sol_status, null AS last_edit_date FROM solution_basic_details_trx sol_details, solution_area_info	sol_area, industry_info indus_info, solution_area_details_trx sol_area_trx WHERE sol_details.sol_id IN (" + param + ") AND sol_details.sol_id = sol_area_trx.sol_id AND indus_info.indus_id = sol_details.indus_id AND sol_details.indus_id = " + post.industryInfo  + " AND sol_area.sol_area_id = sol_area_trx.sol_area_id AND sol_area_trx.nfr_type=0 AND sol_area_trx.sol_status='COMPLETE'";
	
	console.log('Similar Solution Query : ', qry);
	
	connection.query(qry, function(e, similarSolutionsResult, fields){
		connection.release();
		if (e) throw e;
//		console.log('DB response similarSolutionsResult : ');
//		console.log(similarSolutionsResult);
		var opportunityList = [];
		var solAreaList = [];
		var opportunity = {};
		var solArea = {};
		
		var sortedSolIdListTemp = sortedSolIdList;
		  
		while(sortedSolIdListTemp.length > 0){
			var id = sortedSolIdListTemp[0];
		
			for (var i = 0; i < similarSolutionsResult.length; i++) {
			
				if(similarSolutionsResult[i].SOL_ID === id){
					solAreaList = [];
					
					opportunity = {
						sol_id : similarSolutionsResult[i].SOL_ID,
						opportunity_name : similarSolutionsResult[i].opportunity_name,
						customer_name : similarSolutionsResult[i].customer_name,
						industry_name : similarSolutionsResult[i].Indus_name,
						total_efforts : similarSolutionsResult[i].totalEfforts,
						sol_status : similarSolutionsResult[i].sol_status,
						creation_date : similarSolutionsResult[i].creation_date,
						last_edit_date : similarSolutionsResult[i].last_edit_date
					};
					solArea = { 
						sol_area_name : similarSolutionsResult[i].Sol_area_Name,
						sol_area_id : similarSolutionsResult[i].Sol_area_id,
						creation_date : similarSolutionsResult[i].creation_date
					};

					solAreaList.push(solArea);
					while (i < similarSolutionsResult.length -1 && similarSolutionsResult[i].SOL_ID === similarSolutionsResult[i+1].SOL_ID ) {
						i++;
						solArea = { 
							sol_area_name : similarSolutionsResult[i].Sol_area_Name,
							sol_area_id : similarSolutionsResult[i].sol_area_id,
							creation_date : similarSolutionsResult[i].creation_date
						};
						solAreaList.push(solArea);
					  
					}
					
					opportunity.solAreaList = solAreaList;
					opportunityList.push(opportunity);
					
					sortedSolIdListTemp.splice(0,1);
					break;
				}
			}
		}
		console.log("Final opportunity list : ");
		console.log(JSON.stringify(opportunityList));

		res.render('similarSolutions', {'user' : req.session.user,"similarSolutionsResult":opportunityList,"userRequirements":post,"solutionAreaInfoString":solutionAreaInfoString,"IOTInfo":IOTInfo});
	});
}

function loopSolIds(solIdList, solutionAreaInfo, countSolId, connection, res, req, post, categorizedSolIdList, solutionAreaInfoString, IOTInfo){
	console.log("loopSolIds "+ countSolId);
	console.log("Inside loopSolIds IOTInfo "+IOTInfo);
	loopSolArea(solIdList[countSolId].SOL_ID, solutionAreaInfo, connection, res, countSolId, solIdList, req, post, categorizedSolIdList, solutionAreaInfoString, IOTInfo);
	
}

function loopSolArea(solId, solutionAreaInfo, connection, res, countSolId, solIdList, req, post, categorizedSolIdList, solutionAreaInfoString, IOTInfo) {
	console.log("loopSolArea for sol id " + solId);
	console.log("Inside loopSolArea IOTInfo "+IOTInfo);
	
	var solquery = "SELECT DISTINCT Sol_area_id FROM solution_area_details_trx WHERE SOL_ID = " + solId + " AND nfr_type=0 AND sol_status='COMPLETE'";
	console.log("solquery : "+solquery);
						
	connection.query(solquery, function(err, result2, fields){
		if (err) throw err;
		console.log('DB response  result2 : ');
		console.log(result2);
		console.log('solutionAreaInfo : ' + solutionAreaInfo);
		
		var areaMatch = 0;
		for (var c = 0; c < result2.length; c++){
			if(solutionAreaInfo.indexOf(result2[c].Sol_area_id.toString()) >= 0){
				areaMatch++;
			}			
		}
		
		console.log("Area match for sol id " + solId + " : " + areaMatch);
		
		if(!categorizedSolIdList[solutionAreaInfo.length+100]){
			categorizedSolIdList[solutionAreaInfo.length+100] = [];
		}
		console.log('categorizedSolIdList[solutionAreaInfo.length] : ' + categorizedSolIdList[solutionAreaInfo.length]);
		
		if(solutionAreaInfo.length === areaMatch && result2.length === areaMatch){
			categorizedSolIdList[areaMatch+100].push(solIdList[countSolId].SOL_ID);
		}
		else{
			if(!categorizedSolIdList[areaMatch]){
				categorizedSolIdList[areaMatch] = [];
			}
			categorizedSolIdList[areaMatch].push(solIdList[countSolId].SOL_ID);
		}
		
		console.log("categorizedSolIdList : " + JSON.stringify(categorizedSolIdList));
		
		if(countSolId < solIdList.length-1 && categorizedSolIdList[solutionAreaInfo.length+100].length < 10){
			loopSolIds(solIdList, solutionAreaInfo, countSolId + 1, connection, res, req, post, categorizedSolIdList, solutionAreaInfoString, IOTInfo);
		}
		else{
			var sortedSolIdList = [];
			sortedSolIdList = sortedSolIdList.concat(categorizedSolIdList[solutionAreaInfo.length+100]);
			if(sortedSolIdList.length < 10){
			for(var i = Object.keys(categorizedSolIdList).length; i > 0; i--){
					if(categorizedSolIdList[i]){
						sortedSolIdList = sortedSolIdList.concat(categorizedSolIdList[i]);
						if(sortedSolIdList.length >= 10){
							break;
						}
					}
				}
			}
			var topSortedSolIdList = sortedSolIdList.slice(0,10);
			console.log('topSortedSolIdList : '+JSON.stringify(topSortedSolIdList));

			renderSortedOpportunityList(topSortedSolIdList, connection, res, req, post, solutionAreaInfoString, IOTInfo);
		}

	});
}

app.post('/submitCostingRequest', ensureAuthenticated, function(req, res) {
	console.log("Entered submitCostingRequest for solId: " + req.body.solId);
	setTimeout(function() {
		var gpeurl = "http://"+serviceURL+'/downloadgpe/csstaffinggen?sessionId='+req.session.id+'&solId='+req.body.solId;
		console.log("gpeurl: "+gpeurl);
		request.get(gpeurl,{  },
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					console.log("Processed submitCostingRequest successfully for solId: " + req.body.solId);
				}
				else {
					console.log("Failed to process submitCostingRequest for solId: " + req.body.solId + "with error: " +error);
				}
			}
		);
	}, 300);
		
	res.send("OK");
});

app.post('/submitSolutionDetails', ensureAuthenticated, function(req, res) {
	processNewSolutionReq(req, res);
});

function processNewSolutionReq(req, res) {
         
	console.log('Request Object : ');
	console.log(req.session.user);
        
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) {
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);

		var post = req.body;
		var solutionAreaInfo = [];
        // Changes for workitem #5215 sales connect info popup
        if(post.imt_id=='') post.imt_id = null;
        if(post.iot_id=='') post.iot_id = null;
        if(post.risk_rating=='') post.risk_rating = null;
        if(post.country_id=='') post.country_id = null;
		
        //Check if there is only one solution area selected, then create array
		if(util.isArray(post.solutionAreaInfo)) {
			solutionAreaInfo = post.solutionAreaInfo;

		} else {
            if(typeof post.solutionAreaInfo == "string" | post.solutionAreaInfo instanceof String){
                solutionAreaInfo = post.solutionAreaInfo.split(",");
            }else{
                solutionAreaInfo.push(post.solutionAreaInfo);
            }
		}
		
		console.log("solutionAreaInfo:::::::::::"+solutionAreaInfo);
		console.log("post.industryInfo::::::::::" + post.industryInfo);
		console.log("post.IOTInfo :::::::: "+post.IOTInfo);
		console.log("post.LeadCountryInfo :::::::: "+post.LeadCountryInfo);

		var sqlValidation= "select distinct industry_use_cases_master.sol_area_id, sol_area_info.sol_area_name,industry_info.indus_name from industry_use_cases_master, solution_area_info	sol_area_info, industry_info where sol_area_info.sol_area_id = industry_use_cases_master.sol_area_id and industry_info.indus_id = industry_use_cases_master.indus_id and (industry_use_cases_master.indus_id = "+post.industryInfo+" or industry_use_cases_master.indus_id =101) order by sol_area_id";
		console.log("sqlValidation:: "+sqlValidation);
		var invalidIndustry =""; 
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			var query = pool.query(sqlValidation, function(err, sqlValidResult) {
				invalidIndustry ="(0";
				//var solAreaFlag = true;
				for (var i = 0; i <solutionAreaInfo.length ; i++) {
					var	solAreaFlag = true;
					for (var j = 0; j <sqlValidResult.length ; j++){
						console.log("solutionAreaInfo[i]"+solutionAreaInfo[i]);
						console.log("sqlValidResult[j].sol_area_id"+sqlValidResult[j].sol_area_id);
						if(solutionAreaInfo[i] == sqlValidResult[j].sol_area_id) {
							solAreaFlag = false;
							break;
						}
					}
					if(solAreaFlag)
						invalidIndustry = invalidIndustry + ","+ solutionAreaInfo[i];
				}
				invalidIndustry = invalidIndustry+")";	
				var industryName ="";
				var sqlIndusNamequery = pool.query("select indus_name from industry_info where indus_id="+post.industryInfo, function(err, resultIndusName) {
					industryName = resultIndusName[0].indus_name;
				});

				console.log("invalidIndustry : - "+invalidIndustry);

				var sqlIndusValid= "select distinct sol_area_name from solution_area_info where sol_area_id in "+invalidIndustry;
				var query = pool.query(sqlIndusValid, function(err, sqlIndusValidResult) {
					/*if(sqlIndusValidResult.length>0)
					{
						
						var errorMessage = "Ooooops !!! Use cases for ";
						for (var j = 0; j <sqlIndusValidResult.length ; j++) {	
							if (j>0)
								errorMessage = errorMessage +", ";
							errorMessage = errorMessage + sqlIndusValidResult[j].sol_area_name ;
						}
						errorMessage = errorMessage + " in "+industryName+" are currently unavailable in iXM Solution Advisor. Please select different solution areas to proceed further."
						
						var solAreaSelectedValue ="0";
					
						for (var i = 0; i <post.solutionAreaInfo.length ; i++) {
							solAreaSelectedValue = solAreaSelectedValue + ","+ solutionAreaInfo[i];
						}
				 		
				 		var sessionQuery = "insert into session_log (session_id, event_type, status_code,status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +",1,'"+errorMessage+"')";
					
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								console.log(err);
							}
						});	
						var sid2 = req.session.id;
						var timeOut2 = timeOutSidMap.get(sid);
						
						if(timeOut2) { 
							clearTimeout(timeOut2);
						}
						timeOut2 = setTimeout (handleTimeOut,timeoutLength,sid2 );
						timeOutSidMap.set(sid2, timeOut2); 
						res.render('captureOpportunityDetails', {'user' : req.session.user, "errorMessage":errorMessage});	
					//	res.render('captureRequirements', {'user' : req.session.user,"errorMessage":errorMessage,"industryInfo":post.industryInfo, "clientName":post.clientName,"opportunityId":post.opportunityId,"deliveryCenterInfo":post.deliveryCenterInfo,"solAreaSelectedValue":solAreaSelectedValue});
					}
					else
					{*/
						//var sqlSolId= "insert into solution_basic_details_trx  (indus_id,proposed_delivery_center,opportunity_id,customer_name,created_by,business_language) values ("+post.industryInfo+","+post.deliveryCenterInfo+",'"+post.opportunityId.trim()+"','"+post.clientName.trim()+"','" +req.session.user.emailAddress +"','English')";
                        // Changes for workitem #5215 sales connect info popup  
						var sqlSolId= "insert into solution_basic_details_trx  (indus_id,proposed_delivery_center,opportunity_id,customer_name,created_by,business_language,opportunity_owner_email,smr_number,imt_id,risk_rating,iot_id,COUNTRY_ID,SL_ID, SOLUTION_TYPE_ID) values ("+post.industryInfo+","+post.deliveryCenterInfo+",'"+post.opportunityId.trim()+"','"+post.clientName.trim()+"','" +req.session.user.emailAddress +"','English','"+post.opportunity_owner_email.trim()+"','"+post.smr_number.trim()+"',"+post.imt_id+","+post.risk_rating+","+post.IOTInfo+","+post.LeadCountryInfo+",1, " + post.SolutionTypeInfo + ")";
						console.log("INSERT QUERY INTO   solution_basic_details_trx @@@ "+sqlSolId);
						var query = pool.query(sqlSolId, function(err, solResult) {
							console.log("sqlSolId Query : - "+sqlSolId);
							if (err) throw err;	
							var solId= solResult.insertId;//result[0].SOL_ID;
							
							var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id) values"; 
							for (var i = 0; i <solutionAreaInfo.length ; i++) {
								if(i>0)	
									sqlInsertQuery = sqlInsertQuery +",";						
								sqlInsertQuery =sqlInsertQuery +"("+solId+","+solutionAreaInfo[i]+")";
								
							}
							console.log("--------------- Select use cases Query "+sqlInsertQuery ); 
							
							var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
								if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query"); 
									throw err;	
								}
								//changing service line to ADMI if only AMS oppy
								updateServiceLineInfo(solId);
								
								for (var i = 0; i <solutionAreaInfo.length ; i++) {
									var sqlUpdateQuery = "update solution_area_details_trx set" 
										+" use_provided_efforts = CASE WHEN ((select count(*) from industry_use_cases_master where sol_area_id=" +solutionAreaInfo[i]+" and"
										+" indus_id in (101,"+post.industryInfo+") and active=1)>0) THEN 0 ELSE 1 END"
										+" where sol_id="+solId+" and sol_area_id="+solutionAreaInfo[i];
									console.log("\n\n\n\nupdateSqlQuery: "+sqlUpdateQuery);
						            var query = pool.query(sqlUpdateQuery, function(err, solResult) {
										if(err) {
											console.log(err);
										}
									});
								}
							
	//								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_area_details_trx.nfr_type=0 and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
									var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.delivery_model,solution_basic_details_trx.opportunity_id, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.use_provided_efforts, solution_area_details_trx.provided_efforts, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_area_details_trx.nfr_type=0 and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
									var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											throw err;	
										}
										console.log("Success and passing the control to submitSolutionDetails Page." + JSON.stringify(solDetailsInfo)); 
										console.log("Success ::" + solDetailsInfo); 
										//var sessionQuery = "insert into session_log (session_id, event_type, status_code,status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +")";
										var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +","+solDetailsInfo[0].sol_id+","+solDetailsInfo[0].sol_area_id+",0,'Success')";
										console.log(sessionQuery);
										var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
											if (err) {
												//connection.release();
												//console.log(err);
												console.log(" Table 'session_log' doesn't exist");
	
											}
										});	
										var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+solDetailsInfo[0].sol_id+"'";
										connection.query(screenFieldQry, function(error, scrnFldRes, fields){
											if(error){
												throw error;
											}
											var screenField = {};
											for(var i = 0; i < scrnFldRes.length; i++){
												var rec = scrnFldRes[i];
											console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
											if(rec.IS_USE_CASES_VIEW_HIDDEN){
												if(i===0){
													screenField["isUsecaseHidden"] = 1;
												}
												screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isUsecaseHidden;
											}
											if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
												if(i===0){
													screenField["isPerfTestHidden"] = 1;
												}
												screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isPerfTestHidden;
											}
											if(rec.IS_MODEL_HIDDEN){
												if(i===0){
													screenField["isModelHidden"] = 1;
												}
												screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
											}
											else{
												delete screenField.isModelHidden;
											}
											if(rec.IS_SPRINT_WEEKS_HIDDEN){
												if(i===0){
													screenField["isSprintWeeksHidden"] = 1;
												}
												screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isSprintWeeksHidden;
											}
										}
										console.log("screenField : ");
										console.log(screenField);
										res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "screenField":screenField});
									});
						//				res.render('saveSolutionInfo', {SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
									});
	
									//Log session here
										
								
							});
						});
			//}
				});
				connection.release();
			});
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
};


app.post('/modifySolutionDetails', ensureAuthenticated, function(req, res) {
	
	console.log('------- Entered route POST /modifySolutionDetails ----- \n');

	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);

		var post = req.body;
        if(post.imt_id=='') post.imt_id = null;
        if(post.iot_id=='') post.iot_id = null;
        if(post.risk_rating=='') post.risk_rating = null;
        if(post.country_id=='') post.country_id = null;
        
      console.log(" Country ID -- in  modify Solution --------->>>>>>>>>>>>> " + post.country_id);
		
		console.log(" Control is inside modifySolutionDetails() ");
	//	console.log('************* Solution Id ' + sqlSolId);
	
		var sqlValidation= "select distinct industry_use_cases_master.sol_area_id, sol_area_info.sol_area_name,industry_info.indus_name from industry_use_cases_master, solution_area_info	sol_area_info, industry_info where sol_area_info.sol_area_id = industry_use_cases_master.sol_area_id and industry_info.indus_id = industry_use_cases_master.indus_id and (industry_use_cases_master.indus_id = "+post.industryInfo+" or industry_use_cases_master.indus_id =101) order by sol_area_id";
		var invalidIndustry =""; 
		console.log(sqlValidation);
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}

			//var sqlSolId= "update solution_basic_details_trx  set proposed_delivery_center = '"+post.deliveryCenterInfo+"',opportunity_id = '"+post.opportunityId.trim()+"',customer_name = '"+post.clientName.trim()+"' where SOL_ID="+post.sol_id;
            //sql modified for workitem #5215 sales connect info pop up 
            var sqlSolId= "update solution_basic_details_trx  set proposed_delivery_center = '"+post.deliveryCenterInfo+"',opportunity_id = '"+post.opportunityId.trim()+"',customer_name = '"+post.clientName.trim()+"',smr_number='"+post.smr_number+"',imt_id='"+post.imt_id+"',iot_id='"+post.iot_id+"',COUNTRY_ID='"+post.country_id+"', opportunity_owner_email='"+post.opportunity_owner_email+"',risk_rating='"+post.risk_rating+"' where SOL_ID="+post.sol_id;
			console.log("sqlSolId>>>>>>>>>>"+sqlSolId);
            var query = pool.query(sqlSolId, function(err, solResult) {
				if(err) {
					console.log(err);
				}
			});
        	//setting is_staffing_dirty only when sol area is modified flag to 1 #143
			setStaffingFlagDirty(req,res);
			
            console.log("::::::::post.solutionAreaInfo>"+post.solutionAreaInfo);
			if(!post.solutionAreaInfo) {

				var solId= post.sol_id;

				console.log("No solution area selected");
				var created_by = getCreatedBy(req.session.user.emailAddress);
			//	var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
				var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.opportunity_id,solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts, solution_area_details_trx.use_provided_efforts, solution_area_details_trx.provided_efforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by in ( "+ created_by +" ) and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
				console.log(sqlQuery);
								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query" +err); 
										throw err;	
									}
									console.log("SqlQuery: "+sqlQuery);
									console.log(JSON.stringify(solDetailsInfo));
									var countVal=0;
									var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +solId+" and is_perf_test_in_scope = 1", function(err, countResult) {
										if (err) throw err;	
										countVal = countResult[0].count;
										
								
									var priceSubmitStatus;
									sqlQuery = "SELECT DATE_FORMAT(PRICING_REQUEST_TIMESTAMP, '%D %M %Y  at  %h:%m:%s') as time  FROM staffing_estimates where sol_id = "+solId;	
									sqlpriceSubmitStatus = pool.query(sqlQuery, function(err, priceSubmitDate){
										if (err) {
											console.log("error while executionapp msg"); 
											console.log(err);	
										}
										
										
										if(typeof priceSubmitDate[0] !== 'undefined' && priceSubmitDate[0] !== null) {
											
											if(priceSubmitDate[0].time == null || priceSubmitDate[0].time == "") {
												priceSubmitStatus = "The costing request yet to be submitted!";

											} else {
												priceSubmitStatus = "The last costing request was submitted on - "  + priceSubmitDate[0].time + " CDT";
											}
						
										} else {
											//priceSubmitStatus = "The costing request never be submitted!";
											//priceSubmitStatus = "The costing request yet to be submitted!";
											priceSubmitStatus = "The costing request not yet submitted";
										}
										
									
									console.log("Success and passing the control to submitSolutionDetails Page."); 
									
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Edit_Opportunity  +","+solDetailsInfo[0].sol_id+","+solDetailsInfo[0].sol_area_id+",0,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											//console.log(err);
											console.log(" Table 'session_log' doesn't exist");

										}
									});	
									var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+solDetailsInfo[0].sol_id+"'";
									connection.query(screenFieldQry, function(error, scrnFldRes, fields){
										if(error){
											throw error;
										}
										var screenField = {};
										for(var i = 0; i < scrnFldRes.length; i++){
											var rec = scrnFldRes[i];
										console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
										if(rec.IS_USE_CASES_VIEW_HIDDEN){
											if(i===0){
												screenField["isUsecaseHidden"] = 1;
											}
											screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isUsecaseHidden;
										}
										if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
											if(i===0){
												screenField["isPerfTestHidden"] = 1;
											}
											screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isPerfTestHidden;
										}
										if(rec.IS_MODEL_HIDDEN){
											if(i===0){
												screenField["isModelHidden"] = 1;
											}
											screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
										}
										else{
											delete screenField.isModelHidden;
										}
										if(rec.IS_SPRINT_WEEKS_HIDDEN){
											if(i===0){
												screenField["isSprintWeeksHidden"] = 1;
											}
											screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isSprintWeeksHidden;
										}
									}
									console.log("screenField : ");
									console.log(screenField);
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal, "screenField":screenField, "priceSubmitStatus":priceSubmitStatus});
								});
									
									});
									
								});
									
								
							});

			}
			else { 
				console.log("more solution area selected");
				var solutionAreaInfo = [];
				if(util.isArray(post.solutionAreaInfo)) {
					solutionAreaInfo = post.solutionAreaInfo;
					console.log(solutionAreaInfo[0]);
					console.log(solutionAreaInfo[1]);
				} else {
					solutionAreaInfo.push(post.solutionAreaInfo);
					console.log(post.solutionAreaInfo);
					console.log(solutionAreaInfo[0]);
				}
				var query = pool.query(sqlValidation, function(err, sqlValidResult) {
				invalidIndustry ="(0";
				if (err) {
								//connection.release();
								console.log(err);
							}
				console.log("The SQL valid result: "+sqlValidResult);
				console.log("The solutionInfo: "+solutionAreaInfo);
				
					for (var i = 0; i <solutionAreaInfo.length ; i++) {
						//var	solAreaFlag = true;
						//Defect fix for #142
						var	solAreaFlag = false;
						/*for (var j = 0; j <sqlValidResult.length ; j++) {	
							if(solutionAreaInfo[i] == sqlValidResult[j].sol_area_id) {
								solAreaFlag = false;
								break;
							}
						}*/
						if(solAreaFlag)
							invalidIndustry = invalidIndustry + ","+ solutionAreaInfo[i];
					}
					invalidIndustry = invalidIndustry+")";	
					var industryName ="";
					var sqlIndusNamequery = pool.query("select indus_name from industry_info where indus_id="+post.industryInfo, function(err, resultIndusName) {
					industryName = resultIndusName[0].indus_name;
				});

				console.log("invalidIndustry : - "+invalidIndustry);

				var sqlIndusValid= "select distinct sol_area_name from solution_area_info where sol_area_id in "+invalidIndustry;
				var query = pool.query(sqlIndusValid, function(err, sqlIndusValidResult) {
					if(sqlIndusValidResult.length>0)
					{
						
						var errorMessage = "Ooooops !!! Use cases for ";
						for (var j = 0; j <sqlIndusValidResult.length ; j++) {	
							if (j>0)
								errorMessage = errorMessage +", ";
							errorMessage = errorMessage + sqlIndusValidResult[j].sol_area_name ;
						}
						errorMessage = errorMessage + " in "+industryName+" are currently unavailable in iXM Solution Advisor. Please choose different solution area to proceed further."
						
						var solAreaSelectedValue ="0";
						

						for (var i = 0; i <post.solutionAreaInfo.length ; i++) {
							solAreaSelectedValue = solAreaSelectedValue + ","+ solutionAreaInfo[i];
						}
				 		
				 		var sessionQuery = "insert into session_log (session_id, event_type, status_code,status_message) values ('"+req.session.id +"',"+ event.Edit_Opportunity  +",1,'"+errorMessage+"')";
					
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								//console.log(err);
								console.log(" Table 'session_log' doesn't exist");

							}
						});	
						var sid2 = req.session.id;
						var timeOut2 = timeOutSidMap.get(sid);
						
						if(timeOut2) { 
							clearTimeout(timeOut2);
						}
						timeOut2 = setTimeout (handleTimeOut,timeoutLength,sid2 );
						timeOutSidMap.set(sid2, timeOut2); 
//Can be put into seperate function as well

						var sqlQuery = "select sol_id, indus_id, PROPOSED_DELIVERY_CENTER, opportunity_id, Customer_Name from solution_basic_details_trx where SOL_ID="+post.sol_id ;
				
			
						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solInfo){
						if (err) {
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
							console.log(err);	
						}
						console.log(solInfo);
						
							sqlQuery = "select sadt.Sol_area_id sol_area_id,  DATE_FORMAT(sadt.creation_date,'%d-%m-%Y') creation_date, sol_area_name from solution_area_details_trx sadt, solution_area_info sai where SOL_ID="+post.sol_id+" and nfr_type=0 and sadt.Sol_area_id = sai.Sol_area_id";	
							sqlSolutionDetails = pool.query(sqlQuery, function(err, solAreaDetails){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								console.log(err);	
							}
							console.log(solAreaDetails);
					
							var sessionQuery = "insert into session_log (session_id, event_type,sol_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Edit_Opportunity  +","+post.sol_id+",1,'"+errorMessage+"')";
							console.log(sessionQuery);
							var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								//console.log(err);
								console.log(" Table 'session_log' doesn't exist");

							}
							});//session logging ends here	
							console.log(solInfo);
							
							//adding share Opty delete logic
							sqlQuery = "select OWNER_ID,SHARED_WITH_ID,EDIT_RIGHTS from SHARED_OPTY_INFO where SOL_ID="+solId;
							console.log("1 edit opty "+sqlQuery);
							sqlSolutionDetails = pool.query(sqlQuery, function(err, shareOptyDetail){
								if (err) {
									console.log("error while execution of SHARED_OPTY_INFO select  query"); 
									console.log(err);	
									res.render('ErrorPage');
								}
								var showDelete=0;
								if(shareOptyDetail.length==0)
									showDelete=1;
								for (var i = 0; i < shareOptyDetail.length; i++) {
									if(shareOptyDetail[i].OWNER_ID==req.session.user.emailAddress){
										showDelete=1;
									}
									else
										showDelete=0;
								}
								console.log("showDelete "+showDelete);
							res.render('editOpportunityDetails', {'user' : req.session.user, "errorMessage":errorMessage, 'solInfo' :solInfo, 'solAreaDetails':solAreaDetails,'showDelete':showDelete });
							});
						});
						});
										
					}
					else {	
						 
						var solId= post.sol_id;//99;
						var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id) values"; 
						for (var i = 0; i <solutionAreaInfo.length ; i++) {
							if(i>0)	
								sqlInsertQuery = sqlInsertQuery +",";				
								sqlInsertQuery =sqlInsertQuery +"("+solId+","+solutionAreaInfo[i]+")";
						}
						console.log("::--------------- Select use cases Query "+sqlInsertQuery ); 
						
						var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
						if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query"); 
									throw err;	
								}
								
							//	var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_area_details_trx.nfr_type=0 and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
						
								// modify proceed button logic #142 
								for (var i = 0; i <solutionAreaInfo.length ; i++) {
									var updateSqlQuery = "update solution_area_details_trx set" 
											+" use_provided_efforts = CASE WHEN ((select count(*) from industry_use_cases_master where sol_area_id=" +solutionAreaInfo[i]+" and"
											+" indus_id in (101,"+post.industryInfo+") and active=1)>0) THEN 0 ELSE 1 END"
											+" where sol_id="+solId+" and sol_area_id="+solutionAreaInfo[i];
									console.log("updateSqlQuery ----- "+updateSqlQuery);
									var updateQuery=pool.query(updateSqlQuery, function(err, result) {
										if (err) {
											console.log("error while updating the solution area in MOdify of  solution_area_details_trx"); 
											throw err;	
										}
										//changing service line to ADMI if only AMS oppy
										updateServiceLineInfo(solId);
									});
								}
								console.log("updateSqlQuery ----- COMPLETED");
						
								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.opportunity_id,solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, ifnull(solution_area_details_trx.usecase_info_type, (select max(usecase_info_type) from solution_area_details_trx where sol_id="+solId+")) as usecase_info_type, ifnull(solution_area_details_trx.sprint_weeks, (select max(sprint_weeks) from solution_area_details_trx where sol_id="+solId+")) as sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts, solution_area_details_trx.use_provided_efforts, solution_area_details_trx.provided_efforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
								console.log("::::::::::sqlQuery>"+sqlQuery);
								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									console.log("solDetailsInfo:: "+JSON.stringify(solDetailsInfo));
									var countVal=0;
									var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +solId+" and is_perf_test_in_scope = 1", function(err, countResult) {
										if (err) throw err;	
										countVal = countResult[0].count;
										console.log("The count is -> "+countResult[0].count);
									
										
										var priceSubmitStatus;
										sqlQuery = "SELECT DATE_FORMAT(PRICING_REQUEST_TIMESTAMP, '%D %M %Y  at  %h:%m:%s') as time  FROM staffing_estimates where sol_id = "+solId;	
										sqlpriceSubmitStatus = pool.query(sqlQuery, function(err, priceSubmitDate){
											if (err) {
												console.log("error while executionapp msg"); 
												console.log(err);	
											}
											
											if(typeof priceSubmitDate[0] !== 'undefined' && priceSubmitDate[0] !== null) {
												
												if(priceSubmitDate[0].time == null || priceSubmitDate[0].time == "") {
													priceSubmitStatus = "The costing request yet to be submitted!";

												} else {
													priceSubmitStatus = "The last costing request was submitted on - "  + priceSubmitDate[0].time;
												}
							
											} else {
												//priceSubmitStatus = "The costing request never be submitted!";
												priceSubmitStatus = "The costing request not yet submitted";
												
											}

										
			
									console.log("Success and passing the control to submitSolutionDetails Page."); 
									//var sessionQuery = "insert into session_log (session_id, event_type, status_code,status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +")";
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Edit_Opportunity  +","+solDetailsInfo[0].sol_id+","+solDetailsInfo[0].sol_area_id+",0,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											//console.log(err);
											console.log(" Table 'session_log' doesn't exist");

										}
									});	
									var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+solDetailsInfo[0].sol_id+"'";
									connection.query(screenFieldQry, function(error, scrnFldRes, fields){
										if(error){
											throw error;
										}
										var screenField = {};
										for(var i = 0; i < scrnFldRes.length; i++){
											var rec = scrnFldRes[i];
										console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
										if(rec.IS_USE_CASES_VIEW_HIDDEN){
											if(i===0){
												screenField["isUsecaseHidden"] = 1;
											}
											screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isUsecaseHidden;
										}
										if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
											if(i===0){
												screenField["isPerfTestHidden"] = 1;
											}
											screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isPerfTestHidden;
										}
										if(rec.IS_MODEL_HIDDEN){
											if(i===0){
												screenField["isModelHidden"] = 1;
											}
											screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
										}
										else{
											delete screenField.isModelHidden;
										}
										if(rec.IS_SPRINT_WEEKS_HIDDEN){
											if(i===0){
												screenField["isSprintWeeksHidden"] = 1;
											}
											screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isSprintWeeksHidden;
										}
									}
									console.log("screenField : ");
									console.log(screenField);
									res.render('solutionDetails', {'isedit' : "true", 'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal, "screenField":screenField, "priceSubmitStatus":priceSubmitStatus});
								});
					
								});
								});

								
						});
								//Log session here

		
							});
						
				
				}
			});
				connection.release();
			});
		}
	});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});


app.post('/deleteOpportunity', ensureAuthenticated, function(req, res) {
	
	console.log('------- Entered route POST /deleteOpportunity ----- \n');
	var jsonObj = {};

	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);

		var post = req.body;
		
		console.log(" Control is inside deleteOpportunity() ");
	
	
	
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}

			var sqlSolId= "delete FROM solution_requirement_matrix where SOL_ID="+post.sol_id;
			var sqlSolId2= "delete FROM solution_area_details_trx where SOL_ID="+post.sol_id;
			var sqlSolId3= "delete FROM solution_basic_details_trx where SOL_ID="+post.sol_id;
			var sqlSolId4= "delete FROM PRODUCTIVITY_LEVERS where SOL_ID="+post.sol_id;
			var query = pool.query(sqlSolId, function(err, solResult) {
				if(err) {
					console.log(err);
				}
				var query2 = pool.query(sqlSolId2, function(err, solResult) {
					if(err) {
						console.log(err);
					}
					

					console.log(sqlSolId3);
					var query3 = pool.query(sqlSolId3, function(err, solResult) {
						if(err) {
							console.log(err);
						}
						console.log(sqlSolId4);
						var query4 = pool.query(sqlSolId4, function(err, solResult) {
							if(err) {
								console.log(err);
							}
					//dbutils.populateDashboard(pool,connection, res, req);	
			        console.log("metrics: Last login, Oppys created in current month, Oppys created in this year, " +
					"Total time spent on the tool in current month, Total time spent in current year *** GET /dashboard *** ");

			var sqlQueryLastLogin = "select DATE_FORMAT(session_date,'%d-%b-%Y %T') T from session_master where user_email = '"+req.session.user.emailAddress+"' Order by session_date desc  LIMIT 1";

			console.log("User LAST Log in ##### : "+sqlQueryLastLogin);

			query = pool.query(sqlQueryLastLogin, function(err, sqlQueryLastLoginResult) {
				
				if (err) {
					//console.log(err);
					console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
				}
				
				if(typeof sqlQueryLastLoginResult!=='undefined'){
						console.log("sqlQueryLastLoginResult :: "+JSON.stringify(sqlQueryLastLoginResult[0].T));
					
						p = JSON.stringify(sqlQueryLastLoginResult[0].T).replace(/['"]+/g, '') ;
					
						jsonObj["sqlQueryLastLoginResult"] = p ;
			}
				var sqlQueryOppCreateCurrMonth = "select   count( DISTINCT SOL_BASIC.SOL_ID) C from solution_basic_details_trx  " +
				"SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
				" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  " +
				"YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) AND MONTH(SOL_BASIC.creation_date) = MONTH(NOW())" ; 

				console.log("Number of Opportunities  created by the User for this month  ##### : "+sqlQueryOppCreateCurrMonth);

			query = pool.query(sqlQueryOppCreateCurrMonth, function(err, sqlQueryOppCreateCurrMonthResult) {

				if (err) {
					console.log(err);
				}

				console.log("sqlQueryOppCreateCurrMonthResult :: "+JSON.stringify(sqlQueryOppCreateCurrMonthResult[0].C));

				 p = JSON.stringify(sqlQueryOppCreateCurrMonthResult[0].C);

				jsonObj["sqlQueryOppCreateCurrMonthResult"] = p;
				
				
				var sqlQueryOppCreateCurrYear = "select   count( DISTINCT SOL_BASIC.SOL_ID) C  from solution_basic_details_trx  " +
				"				SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
				" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) " ;

				console.log("Number of Opportunities  created by the User for this Year  ##### : "+sqlQueryOppCreateCurrYear);

				 query = pool.query(sqlQueryOppCreateCurrYear, function(err, sqlQueryOppCreateCurrYearResult) {

					if (err) {
						console.log(err);
					}
					console.log(" sqlQueryOppCreateCurrYearResult :: "+JSON.stringify(sqlQueryOppCreateCurrYearResult[0].C));

						p = JSON.stringify(sqlQueryOppCreateCurrYearResult[0].C) ;

			 		jsonObj["sqlQueryOppCreateCurrYearResult"] = p;
			 		
			 		var sqlQueryTimeSptCurrentMonth ="select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from " +
					"( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
					"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())" +
					"  AND MONTH(s_l.`event_time`) = MONTH(NOW())  group by s_l.`session_id`) A";   	

			 		console.log("Total time spent on the tool in current month  ##### : "+sqlQueryTimeSptCurrentMonth);

				  query = pool.query(sqlQueryTimeSptCurrentMonth, function(err, sqlQueryTimeSptCurrentMonthResult) {
				
					 if (err) {
						// console.log(err);
						 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
					 }
				
					 if(typeof sqlQueryTimeSptCurrentMonthResult!=='undefined'){
						 console.log(" sqlQueryTimeSptCurrentMonthResult :: "+JSON.stringify(sqlQueryTimeSptCurrentMonthResult[0].T));
				
						 p = JSON.stringify(sqlQueryTimeSptCurrentMonthResult[0].T).replace(/['"]+/g, '');
				
					 	jsonObj["sqlQueryTimeSptCurrentMonthResult"] = p ;
					 }	
					 	var sqlQueryTimeSptCurrentYear = "select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from" +
						" ( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
						"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())  " +
						"  group by s_l.`session_id`) A";
				
					 	console.log("Total time spent on the tool in current Year  ##### : "+sqlQueryTimeSptCurrentYear);
				
					 	 query = pool.query(sqlQueryTimeSptCurrentYear, function(err, sqlQueryTimeSptCurrentYearResult) {
					
					 		if (err) {
					 			console.log(err);
					 		}
					
					 		if(typeof sqlQueryTimeSptCurrentYearResult!=='undefined'){
						 		console.log(" sqlQueryTimeSptCurrentYearResult :: "+JSON.stringify(sqlQueryTimeSptCurrentYearResult[0].T));
						
						 		 p = JSON.stringify(sqlQueryTimeSptCurrentYearResult[0].T).replace(/['"]+/g, '') ;
						
						
						 		jsonObj["sqlQueryTimeSptCurrentYearResult"] = p ;
					 		}
					var sqlQueryTimeSaveCurrMonth = "select sum(user_perception) A from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
							" YEAR(session_date) = YEAR(NOW()) AND MONTH(session_date) = MONTH(NOW()) group by user_email";

					console.log("Total time saved in current Month  ##### : "+sqlQueryTimeSaveCurrMonth);

					 query = pool.query(sqlQueryTimeSaveCurrMonth, function(err, sqlQueryTimeSaveCurrMonthResult) {

						 if (err) {
							// console.log(err);
							 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
						 }

						 if(typeof sqlQueryTimeSaveCurrMonthResult!=='undefined'){
							 console.log("sqlQueryTimeSaveCurrMonthResult :: "+JSON.stringify(sqlQueryTimeSaveCurrMonthResult[0].A)) ;
							 p = JSON.stringify(sqlQueryTimeSaveCurrMonthResult[0].A) ;
							 jsonObj["sqlQueryTimeSaveCurrMonthResult"] = p ;
						 }
						 
						 var sqlQueryTimeSaveCurrYear = "select sum(user_perception) A from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
							" YEAR(session_date) = YEAR(NOW()) group by user_email";

							console.log("Total time saved in current Year  ##### : "+sqlQueryTimeSaveCurrYear);

							 query = pool.query(sqlQueryTimeSaveCurrYear, function(err, sqlQueryTimeSaveCurrYearResult) {

								if (err) {
									//console.log(err);
									console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
								}
								if(typeof sqlQueryTimeSaveCurrYearResult!=='undefined'){
									console.log("sqlQueryTimeSaveCurrYearResult :: "+JSON.stringify(sqlQueryTimeSaveCurrYearResult[0].A)) ;
									p = JSON.stringify(sqlQueryTimeSaveCurrYearResult[0].A) ;
									jsonObj["sqlQueryTimeSaveCurrYearResult"] = p ;
								}
									
					var created_by = getCreatedBy(req.session.user.emailAddress);
					//sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id DESC";
					sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, null as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id DESC";
					
						var query = pool.query(sqlQuery, function(err, solDashboardResult) {
							if (err) throw err;	
							//console.log(solDashboardResult);
							//console.log("printing each element");
							var opportunityList = [];
							var solAreaList = [];
							var opportunity = {};
							var solArea = {};

							for (var i = 0; i < solDashboardResult.length; i++) {

								solAreaList = [];
							
								opportunity = {sol_id: solDashboardResult[i].sol_id, 
											   opportunity_name: solDashboardResult[i].opportunity_name,
											   customer_name:solDashboardResult[i].customer_name,
											   industry_name : solDashboardResult[i].indus_name,
											   total_efforts : solDashboardResult[i].totalEfforts,
											   sol_status : solDashboardResult[i].sol_status,
											   creation_date : solDashboardResult[i].creation_date,
											   last_edit_date : solDashboardResult[i].last_edit_date
											   };
								solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
											sol_area_id: solDashboardResult[i].sol_area_id,
											creation_date: solDashboardResult[i].creation_date};
								solAreaList.push(solArea);				
								while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
									i++;
									solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
											sol_area_id: solDashboardResult[i].sol_area_id,
											creation_date: solDashboardResult[i].creation_date};
								//	console.log("Sol  ID1" + solDashboardResult[i].sol_id)		
									
									solAreaList.push(solArea);	
									
								}

								opportunity.solAreaList = solAreaList;
								opportunityList.push(opportunity);

//								console.log(solDashboardResult[i].sol_id);
//								console.log(solDashboardResult[i].sol_area_name);
							}
//							console.log(opportunityList);
							
							//for tab2 data 
							var sqlShareByMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
							"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.created_by in ("+ created_by +") and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.OWNER_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
							console.log("solDashboardResult sqlShareByMe: "+sqlShareByMe);
							var optyShareByMeList = [];
							var query = pool.query(sqlShareByMe, function(err, solDashboardResult) {
								if (err) throw err;	
								var solAreaList = [];
								var opportunity = {};
								var solArea = {};
								for (var i = 0; i < solDashboardResult.length; i++) {
									solAreaList = [];
									opportunity = {sol_id: solDashboardResult[i].sol_id, 
											   opportunity_name: solDashboardResult[i].opportunity_name,
											   customer_name:solDashboardResult[i].customer_name,
											   industry_name : solDashboardResult[i].indus_name,
											   total_efforts : solDashboardResult[i].totalEfforts,
											   sol_status : solDashboardResult[i].sol_status,
											   creation_date : solDashboardResult[i].creation_date,
											   last_edit_date : solDashboardResult[i].last_edit_date
											   };
									solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
												sol_area_id: solDashboardResult[i].sol_area_id,
												creation_date: solDashboardResult[i].creation_date};
									solAreaList.push(solArea);				
									while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
										i++;
										solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
													sol_area_id: solDashboardResult[i].sol_area_id,
													creation_date: solDashboardResult[i].creation_date};
										
										solAreaList.push(solArea);	
									
									}
								opportunity.solAreaList = solAreaList;
								optyShareByMeList.push(opportunity);
								}
								//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareByMeList));
								//end of tab2 data 
								
								//for tab3 data 
								var sqlShareWithMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
								"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.SHARED_WITH_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
								console.log("solDashboardResult optyShareWithMe: "+sqlShareWithMe);
								var optyShareWithMeList = [];
								var query = pool.query(sqlShareWithMe, function(err, solDashboardResult) {
									if (err) throw err;	
									var solAreaList = [];
									var opportunity = {};
									var solArea = {};
									for (var i = 0; i < solDashboardResult.length; i++) {
										solAreaList = [];
										opportunity = {sol_id: solDashboardResult[i].sol_id, 
												   opportunity_name: solDashboardResult[i].opportunity_name,
												   customer_name:solDashboardResult[i].customer_name,
												   industry_name : solDashboardResult[i].indus_name,
												   total_efforts : solDashboardResult[i].totalEfforts,
												   sol_status : solDashboardResult[i].sol_status,
												   creation_date : solDashboardResult[i].creation_date,
												   last_edit_date : solDashboardResult[i].last_edit_date
												   };
										solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
												sol_area_id: solDashboardResult[i].sol_area_id,
												creation_date: solDashboardResult[i].creation_date};
										solAreaList.push(solArea);				
										while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
											i++;
											solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
											sol_area_id: solDashboardResult[i].sol_area_id,
											creation_date: solDashboardResult[i].creation_date};
											solAreaList.push(solArea);	
										
										}
										opportunity.solAreaList = solAreaList;
										optyShareWithMeList.push(opportunity);
									}
									//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareWithMeList));
									//end of tab3 data 
									console.log("FINAL OBJECT ######### inside DASHBOARD :::::: "+JSON.stringify(jsonObj));
									res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList,'optyShareByMeList':optyShareByMeList,'optyShareWithMeList':optyShareWithMeList,'jsonObj':jsonObj});
													});//end tab3
												});//end tab2
											});//end tab1
										});
							 		});
					 			});
					 	 	});
				  		});
				 	});
				});
					
					
					
					

						});//end of sqlSolId4
					
					});//end of sqlSolId3
				});
				

			});
			
			connection.release();

		});

				
			
		
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});

app.post('/deleteSolArea', ensureAuthenticated, function(req, res) {
	
	console.log('------- Entered route POST /deleteSolArea ----- \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);

		var post = req.body;
		var solId = post.sol_id;
		var solAreaId=post.sol_area_id;
		console.log(" Control is inside deleteSolArea() ");
		
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}					
			
			//delete query for solution_requirement_matrix table
			var sqlSolId= "delete from solution_requirement_matrix where sol_id="+solId + " and use_case_id in (select use_case_id from industry_use_cases_master where Sol_area_id="+solAreaId+" )";
			
			console.log("Query sqlSolId --------> "+sqlSolId);
			
			//delete query for solution_basic_details_trx table
			//not req
			
			var query = pool.query(sqlSolId, function(err, solResult) {
				if(err) {
					console.log(err);
				}
				
				//delete query for solution_area_details_trx table
				var sqlSolId2= "delete from solution_area_details_trx where Sol_area_id="+solAreaId+" and sol_id="+solId;
				
				console.log("Query sqlSolId2 --------> "+sqlSolId2);
				var query2 = pool.query(sqlSolId2, function(err, solResult) {
					if(err) {
						console.log(err);
					}
					if(solAreaId==constants.AMSTicketBased || solAreaId==constants.AMSResourceBased ||solAreaId==constants.AMSProductBased){
						pool.query("delete from PRODUCTIVITY_LEVERS where  sol_id="+solId, function(err, solResult) {
							if(err) {
								console.log(err);
							}
							console.log("delete from PRODUCTIVITY_LEVERS where  sol_id="+solId);
						});
					}
					//delete entry from staffing_estimates
					var sqlStaffing = "";
					
					if(solAreaId == constants.SIInterfaces){
						sqlStaffing = "delete from staffing_estimates where sol_id=" + solId + " and sol_area_id in (select distinct(iucm.ReqSubCategoryId) from industry_use_cases_master iucm where iucm.sol_area_id=" + solAreaId + ")";
						
						console.log("Query sqlStaffing --------> "+sqlStaffing);
					} else{
						sqlStaffing = "delete from staffing_estimates where sol_id=" + solId + " and sol_area_id=" + solAreaId;
						
						console.log("Query sqlStaffing --------> "+sqlStaffing);
					}
					
					//make a call to backend to delete the staffing plan for that soln area
					var query = pool.query(sqlStaffing, function(err, sqlStaffingResult) {
						if(err) {
							console.log(err);
						}
						
						if(solAreaId == constants.SIInterfaces){							
							var sqlESBEstimates = "delete from esb_integration_estimations where SOL_ID=" + solId + " and SOL_AREA_ID in (select distinct(iucm.ReqSubCategoryId) from industry_use_cases_master iucm where iucm.sol_area_id=" + solAreaId + ")";
							var query = pool.query(sqlESBEstimates, function(err, sqlESBEstimatesResult) {
								if(err) {
									console.log(err);
								}
							});
						}
						
						//delete merged plan
						var sqlDeleteMergedPlan="delete from staffing_estimates where is_merged=1 and sol_id="+solId;
						var query = pool.query(sqlDeleteMergedPlan, function(err, sqlDeleteMergedPlanResult) {
							if(err) {
								console.log(err);
							}
						});
                        
                        
                        //make a call to backend for delete staffing plan
							console.log(">>>>>>>>>>>>>>.......making a tomcat req for delete staffing plan");
							
							setTimeout(function() {
								request.post("http://"+serviceURL+"/estimate/deleteplan?sessionId='" +req.session.id +"'&solId="+solId+"&solAreaId="+solAreaId,{  },
									function (error, response, body) {									
									console.log("response status Code ---> "+response);
									
										if (!error && response.statusCode == 200) {
											var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+solAreaId+",0,'Success')";
											console.log(sessionQuery);
											var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
												if (err) {
													//connection.release();
													console.log(err);
												}
											});//session logging ends here	

											console.log(">>>>>>After Deleting merged plan for solnId: " + solId);
											
										}
										else {
												console.log(">>>>> Error --- "+error);
										}
									}
								);
							}, 1000);		
							
						//}
					
						
					/*	//make a call to backend to recompute the merged staffing plan
						console.log(">>>>>>>....making tomcat req for merged plan");
						//make a call to tomcat to generate the merged plan
						setTimeout(function() {
							request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId+"&solAreaId="+solAreaId,{  },
								function (error, response, body) {
									if (!error && response.statusCode == 200) {
										var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+solAreaId+",0,'Success')";
										console.log(sessionQuery);
										var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
											if (err) {
												//connection.release();
												console.log(err);
											}
										});//session logging ends here	

										console.log(">>>>>>After Creating merged plan for solnId: " + solId);
										
									}
									else {
											//tbd
									}
								}
							);
						}, 1000);	*/
						
						//make a call to backend to recompute the merged staffing plan
//						console.log(">>>>>>>....making tomcat req for merged plan");
						//make a call to tomcat to generate the merged plan
//						setTimeout(function() {
//							request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//								function (error, response, body) {
//									if (!error && response.statusCode == 200) {
//										var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+solAreaId+",0,'Success')";
//										console.log(sessionQuery);
//										var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//											if (err) {
//												//connection.release();
//												console.log(err);
//											}
//										});//session logging ends here	
//
//										console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//										
//									}
//									else {
//											//tbd
//									}
//								}
//							);
//						}, 1000);					
						res.send("Yes");
					});
				});				

			});
			//setting is_staffing flag to 1 #143
			setStaffingFlagDirty(req,res);
			connection.release();

		});		
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});

app.get('/getServiceLineSolutions', ensureAuthenticated, function(req, res) {
	
	console.log('------- Entered route GET /getServiceLineSolutions ----- \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
	//	var searchSolId = req.body.searchSolId.replace(/[^a-zA-Z ]/g, "");
		//var searchSolId = req.body.searchSolId;
		var sl_Id = req.param('sl_id');
		console.log("Sol Id received is ------- " +req.body.aSolId);
		console.log("Sol Id received is ------- " +req.param('sl_Id') );


	//	var sqlQuery = "select solution_basic_details_trx.sol_id, sl_name, customer_name from solution_basic_details_trx , service_line_info  where solution_basic_details_trx.created_by='"+req.session.user.emailAddress +"'and solution_basic_details_trx.sl_id = '"+serviceId+"' and solution_basic_details_trx.sl_id = service_line_info.sl_id";

		//var sqlQuery = "SELECT sol_area_trx.Seq_id seq_id,sol_details.sol_id, sl_name, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_id FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, service_line_info	sl_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emailAddress +"' and sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and sl_name.sl_id= sol_details.sl_id and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0";
		var sqlQuery;
		var created_by = getCreatedBy(req.session.user.emailAddress);
		sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, Flex_Field_3 as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=solution_basic_details_trx.SOL_ID) > 0,1,0) as sol_status FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
		
		//sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emailAddress +"' and sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";

		console.log("sqlQuery: "+sqlQuery);
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();k
				throw err;
			}
			var query = pool.query(sqlQuery, function(err, solDashboardResult) {
				if (err) throw err;	
				console.log(solDashboardResult);
				console.log("printing each element");
				console.log(JSON.stringify(solDashboardResult));
				var opportunityList = [];
				var solAreaList = [];
				var opportunity = {};
				var solArea = {};

				for (var i = 0; i < solDashboardResult.length; i++) {

					solAreaList = [];
				
					opportunity = {sol_id: solDashboardResult[i].sol_id, 
								   opportunity_name: solDashboardResult[i].opportunity_name,
								   customer_name:solDashboardResult[i].customer_name,
								   industry_name : solDashboardResult[i].indus_name,
								   total_efforts : solDashboardResult[i].totalEfforts,
								   sol_status : solDashboardResult[i].sol_status,
								   creation_date : solDashboardResult[i].creation_date
								   };
					console.log("creation_date: "+creation_date);
					solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
								sol_area_id: solDashboardResult[i].sol_area_id,
								creation_date: solDashboardResult[i].creation_date};
					solAreaList.push(solArea);				
					while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
						solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
								sol_area_id: solDashboardResult[i].sol_area_id,
								creation_date: solDashboardResult[i].creation_date};
					//	console.log("Sol  ID1" + solDashboardResult[i].sol_id)		
					//	console.log("Sol  ID2" + solDashboardResult[i+1].sol_id)		
						solAreaList.push(solArea);	
						i++;
					}

					opportunity.solAreaList = solAreaList;
					opportunityList.push(opportunity);

					console.log(solDashboardResult[i].sol_id);
					console.log(solDashboardResult[i].sol_area_name);
				}
				console.log("opportunityList>> "+opportunityList);
				//for tab2 data 
				var sqlShareByMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
				"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.created_by in ("+ created_by +") and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.OWNER_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
				console.log("solDashboardResult sqlShareByMe: "+sqlShareByMe);
				var optyShareByMeList = [];
				var query = pool.query(sqlShareByMe, function(err, solDashboardResult) {
					if (err) throw err;	
					var solAreaList = [];
					var opportunity = {};
					var solArea = {};
					for (var i = 0; i < solDashboardResult.length; i++) {
						solAreaList = [];
						opportunity = {sol_id: solDashboardResult[i].sol_id, 
								   opportunity_name: solDashboardResult[i].opportunity_name,
								   customer_name:solDashboardResult[i].customer_name,
								   industry_name : solDashboardResult[i].indus_name,
								   total_efforts : solDashboardResult[i].totalEfforts,
								   sol_status : solDashboardResult[i].sol_status,
								   creation_date : solDashboardResult[i].creation_date,
								   last_edit_date : solDashboardResult[i].last_edit_date
								   };
						solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
									sol_area_id: solDashboardResult[i].sol_area_id,
									creation_date: solDashboardResult[i].creation_date};
						solAreaList.push(solArea);				
						while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
							i++;
							solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
										sol_area_id: solDashboardResult[i].sol_area_id,
										creation_date: solDashboardResult[i].creation_date};
							
							solAreaList.push(solArea);	
						
						}
					opportunity.solAreaList = solAreaList;
					optyShareByMeList.push(opportunity);
					}
					//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareByMeList));
					//end of tab2 data 
					
					//for tab3 data 
					var sqlShareWithMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
					"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.SHARED_WITH_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
					console.log("solDashboardResult optyShareWithMe: "+sqlShareWithMe);
					var optyShareWithMeList = [];
					var query = pool.query(sqlShareWithMe, function(err, solDashboardResult) {
						if (err) throw err;	
						var solAreaList = [];
						var opportunity = {};
						var solArea = {};
						for (var i = 0; i < solDashboardResult.length; i++) {
							solAreaList = [];
							opportunity = {sol_id: solDashboardResult[i].sol_id, 
									   opportunity_name: solDashboardResult[i].opportunity_name,
									   customer_name:solDashboardResult[i].customer_name,
									   industry_name : solDashboardResult[i].indus_name,
									   total_efforts : solDashboardResult[i].totalEfforts,
									   sol_status : solDashboardResult[i].sol_status,
									   creation_date : solDashboardResult[i].creation_date,
									   last_edit_date : solDashboardResult[i].last_edit_date
									   };
							solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
									sol_area_id: solDashboardResult[i].sol_area_id,
									creation_date: solDashboardResult[i].creation_date};
							solAreaList.push(solArea);				
							while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
								i++;
								solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
								sol_area_id: solDashboardResult[i].sol_area_id,
								creation_date: solDashboardResult[i].creation_date};
								solAreaList.push(solArea);	
							
							}
							opportunity.solAreaList = solAreaList;
							optyShareWithMeList.push(opportunity);
						}
						//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareWithMeList));
						//end of tab3 data 
				
				res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList,'optyShareByMeList':optyShareByMeList,'optyShareWithMeList':optyShareWithMeList});
					});//end tab3
				});//end tab2
			});//end tab1
			connection.release();
		});
	
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}

});


app.get('/getSolutionInfo', ensureAuthenticated, function(req, res) {
	
	console.log('------- Entered route GET /getSolutionInfo ----- \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
	//	var searchSolId = req.body.searchSolId.replace(/[^a-zA-Z ]/g, "");
		//var searchSolId = req.body.searchSolId;
		var searchSolId = req.param('searchSolId');
		console.log("Sol Id received is ------- " +req.body.aSolId);
		console.log("Sol Id received is ------- " +req.param('searchSolId') );

		var opportunityId = "";
	//	searchSolId.replace(/[^a-zA-Z ]/g, "")
	//	searchSolId= searchSolId.replace(/[^\w\s]/gi, '')
		pool.getConnection(function(err, connection) {
			if (err) {
				console.log("Error obtaining connection from pool: "+ err);
				connection.release();
				throw err;
			}
			
			var created_by = getCreatedBy(req.session.user.emailAddress);
			//var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts , solution_area_details_trx.use_provided_efforts, solution_area_details_trx.provided_efforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by in ( "+ created_by +" ) and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.opportunity_id,solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts , solution_area_details_trx.use_provided_efforts, solution_area_details_trx.provided_efforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by in ( "+ created_by +",(select OWNER_ID from SHARED_OPTY_INFO where sol_id="+searchSolId+" LIMIT 1)) and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			//var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.opportunity_id,solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID="+searchSolId+" and SOL_STATUS='INCOMPLETE') > 0,'INCOMPLETE','COMPLETE') as sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts , solution_area_details_trx.use_provided_efforts, solution_area_details_trx.provided_efforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by in ( "+ created_by +",(select OWNER_ID from SHARED_OPTY_INFO where sol_id="+searchSolId+" LIMIT 1)) and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			if(opportunityId != null && opportunityId !="")	{
				var opportunityId = req.body.opportunityId.replace(/[^a-zA-Z ]/g, "");
				sqlQuery=sqlQuery+' and opportunity_id=\'TRIM('+opportunityId+')\'';
			}
			sqlQuery=sqlQuery+ " order by solution_area_details_trx.sol_area_id";
			var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
				if (err) {
					console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
					throw err;	
				}

				console.log("Success and passing the control to getSolutionInfo() Page.");
				console.log("SqlQuery: "+sqlQuery);
				console.log(JSON.stringify(solDetailsInfo));

				if(solDetailsInfo.length>0)
				{
					
				
					console.log(" IP Address in getSolutionInfo(): "+ipAddress);
					
					var sessionQuery = "insert into session_log (session_id, event_type,sol_id) values ('"+req.session.id +"',"+ event.Open_Solution  +","+searchSolId+")";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							//connection.release();
							//console.log(err);
							console.log("Error: ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist")
						}
					});//session logging ends here	

					
				var priceSubmitStatus;
				sqlQuery = "SELECT DATE_FORMAT(PRICING_REQUEST_TIMESTAMP, '%D %M %Y  at  %h:%m:%s') as time  FROM staffing_estimates where sol_id = "+searchSolId;	
				sqlpriceSubmitStatus = pool.query(sqlQuery, function(err, priceSubmitDate){
					if (err) {
						console.log("error while executionapp msg"); 
						console.log(err);	
					}
					
					
					if(typeof priceSubmitDate[0] !== 'undefined' && priceSubmitDate[0] !== null) {
						
						if(priceSubmitDate[0].time == null || priceSubmitDate[0].time == "") {
							priceSubmitStatus = "The costing request yet to be submitted!";

						} else {
							priceSubmitStatus = "The last costing request was submitted on - "  + priceSubmitDate[0].time;
						}
	
					} else {
						//priceSubmitStatus = "The costing request never be submitted!";
						priceSubmitStatus = "The costing request not yet submitted";
					}
					
					console.log("appMsg >>>>>> "+sqlQuery+"\n");
					//console.log(JSON.stringify(priceSubmitDate[0].time));
					
					var countVal;
					var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +searchSolId+" and is_perf_test_in_scope = 1", function(err, countResult) {
						if (err) {
							throw err;	
						}
						countVal = countResult[0].count;
						var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+searchSolId+"'";
						console.log("screenFieldQry : " + screenFieldQry);
						connection.query(screenFieldQry, function(error, scrnFldRes, fields){
							if(error){
								throw error;
							}
							var screenField = {};
							for(var i = 0; i < scrnFldRes.length; i++){
									var rec = scrnFldRes[i];
								console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
								if(rec.IS_USE_CASES_VIEW_HIDDEN){
									if(i===0){
										screenField["isUsecaseHidden"] = 1;
									}
									screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isUsecaseHidden;
								}
								if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
									if(i===0){
										screenField["isPerfTestHidden"] = 1;
									}
									screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isPerfTestHidden;
								}
								if(rec.IS_MODEL_HIDDEN){
									if(i===0){
										screenField["isModelHidden"] = 1;
									}
									screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
								}
								else{
									delete screenField.isModelHidden;
								}
								if(rec.IS_SPRINT_WEEKS_HIDDEN){
									if(i===0){
										screenField["isSprintWeeksHidden"] = 1;
									}
									screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + " Sprint weeks not considered for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isSprintWeeksHidden;
								}
							}

							console.log("screenField : ");
							console.log(screenField);

							res.render('displaySolutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal, "screenField": screenField, "priceSubmitStatus": priceSubmitStatus});
						});
					});
					
				});
				}
				else {
					res.render('captureExistingSolInfo', {'user' : req.session.user,errorMessage:"There is no record for selected search parameters.","searchSolId":searchSolId,"opportunityId":opportunityId});
				}
				connection.release();
			});
		});
		}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});


app.post('/getSolutionInfo', ensureAuthenticated, function(req, res) {

	console.log('------- Entered route POST /getSolutionInfo ----- \n');
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
	//	var searchSolId = req.body.searchSolId.replace(/[^a-zA-Z ]/g, "");
		var searchSolId = req.body.searchSolId;
		
		var opportunityId = "";
	//	searchSolId.replace(/[^a-zA-Z ]/g, "")
	//	searchSolId= searchSolId.replace(/[^\w\s]/gi, '')
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			//var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by='"+req.session.user.emailAddress +"' and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			
			var created_by = getCreatedBy(req.session.user.emailAddress);
			var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.opportunity_id,solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by in ( "+ created_by +" ) and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			
			if(opportunityId != null && opportunityId !="")	
			{
				var opportunityId = req.body.opportunityId.replace(/[^a-zA-Z ]/g, "");
				sqlQuery=sqlQuery+' and opportunity_id=\'TRIM('+opportunityId+')\'';
			}
			sqlQuery=sqlQuery+ " order by solution_area_details_trx.sol_area_id";
			var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
				if (err) {
					console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
					throw err;	
				}
				console.log("SqlQuery: "+sqlQuery);
				console.log(JSON.stringify(solDetailsInfo));

				console.log("Success and passing the control to getSolutionInfo() Page.");
				if(solDetailsInfo.length>0)
				{
					/*
					setTimeout(function() {
						request.post(serviceURL+'/estimate/request?solId='+searchSolId+"&solAreaId="+solDetailsInfo[0].SOL_AREA_ID,{  },
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
								console.log(body)
									res.render('displaySolutionDetails', {"solDetailsInfo":solDetailsInfo});
								}
							}
						); 
					}, 3000);*/
					console.log(" IP Address in getSolutionInfo(): "+ipAddress);
					var sessionQuery = "insert into session_log (session_id, event_type,sol_id) values ('"+req.session.id +"',"+ event.Open_Solution  +","+searchSolId+")";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							//connection.release();
							//console.log(err);
							console.log("Error: ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist")
						}
					});//session logging ends here	

					var countVal=0;
					var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +searchSolId+" and is_perf_test_in_scope = 1", function(err, countResult) {
						if (err) throw err;	
						countVal = countResult[0].count;
						var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+searchSolId+"'";
						connection.query(screenFieldQry, function(error, scrnFldRes, fields){
							if(error){
								throw error;
							}
							var screenField = {};
							for(var i = 0; i < scrnFldRes.length; i++){
								var rec = scrnFldRes[i];
							console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
							if(rec.IS_USE_CASES_VIEW_HIDDEN){
								if(i===0){
									screenField["isUsecaseHidden"] = 1;
								}
								screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
							}
							else{
								delete screenField.isUsecaseHidden;
							}
							if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
								screenField["isPerfTestHidden"] = 1;
								screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
							}
							else{
								delete screenField.isPerfTestHidden;
							}
							if(rec.IS_MODEL_HIDDEN){
								screenField["isModelHidden"] = 1;
								screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
							}
							else{
								delete screenField.isModelHidden;
							}
							if(rec.IS_SPRINT_WEEKS_HIDDEN){
								screenField["isSprintWeeksHidden"] = 1;
								screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
							}
							else{
								delete screenField.isSprintWeeksHidden;
							}
						}
						console.log("screenField : ");
						console.log(screenField);
					
							res.render('displaySolutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal, "screenField": screenField});
						});
					});
				}
				else {
					res.render('captureExistingSolInfo', {'user' : req.session.user,errorMessage:"There is no record for selected search parameters.","searchSolId":searchSolId,"opportunityId":opportunityId});
				}
				connection.release();
			});
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});


app.post('/searchOpportunity', ensureAuthenticated, function(req, res) {
	
	console.log('<>>>>>>>> Entered route POST /searchOpportunity <>>>>>> \n');
	
	var jsonObj = {};
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
	
		var searchOpportunity = req.body.searchOpportunity;
		
		var opportunityId = "";
	
			
		pool.getConnection(function(err, connection) {
			if (err) {
				console.log("Error obtaining connection from pool: "+ err);
				connection.release();
				throw err;
			}
			
			if(isNaN(searchOpportunity)){
				
				console.log("metrics: Last login, Oppys created in current month, Oppys created in this year, " +
				"Total time spent on the tool in current month, Total time spent in current year *** GET /dashboard *** ");

		var sqlQueryLastLogin = "select DATE_FORMAT(session_date,'%d-%b-%Y %T') T from session_master where user_email = '"+req.session.user.emailAddress+"' Order by session_date desc  LIMIT 1";

		console.log("User LAST Log in ##### : "+sqlQueryLastLogin);

		query = pool.query(sqlQueryLastLogin, function(err, sqlQueryLastLoginResult) {
			
			if (err) {
				//console.log(err);
				console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
			}
			if(typeof sqlQueryLastLoginResult!=='undefined'){
				console.log("sqlQueryLastLoginResult :: "+JSON.stringify(sqlQueryLastLoginResult[0].T));
				
				 p = JSON.stringify(sqlQueryLastLoginResult[0].T).replace(/['"]+/g, '') ;
				
				jsonObj["sqlQueryLastLoginResult"] = p ;
			}
			var sqlQueryOppCreateCurrMonth = "select   count( DISTINCT SOL_BASIC.SOL_ID) C from solution_basic_details_trx  " +
			"SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
			" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  " +
			"YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) AND MONTH(SOL_BASIC.creation_date) = MONTH(NOW())" ; 

			console.log("Number of Opportunities  created by the User for this month  ##### : "+sqlQueryOppCreateCurrMonth);

		query = pool.query(sqlQueryOppCreateCurrMonth, function(err, sqlQueryOppCreateCurrMonthResult) {

			if (err) {
				console.log(err);
			}

			console.log("sqlQueryOppCreateCurrMonthResult :: "+JSON.stringify(sqlQueryOppCreateCurrMonthResult[0].C));

			 p = JSON.stringify(sqlQueryOppCreateCurrMonthResult[0].C);

			jsonObj["sqlQueryOppCreateCurrMonthResult"] = p;
			
			
			var sqlQueryOppCreateCurrYear = "select   count( DISTINCT SOL_BASIC.SOL_ID) C  from solution_basic_details_trx  " +
			"				SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
			" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) " ;

			console.log("Number of Opportunities  created by the User for this Year  ##### : "+sqlQueryOppCreateCurrYear);

			 query = pool.query(sqlQueryOppCreateCurrYear, function(err, sqlQueryOppCreateCurrYearResult) {

				if (err) {
					console.log(err);
				}
				console.log(" sqlQueryOppCreateCurrYearResult :: "+JSON.stringify(sqlQueryOppCreateCurrYearResult[0].C));

					p = JSON.stringify(sqlQueryOppCreateCurrYearResult[0].C) ;

		 		jsonObj["sqlQueryOppCreateCurrYearResult"] = p;
		 		
		 		var sqlQueryTimeSptCurrentMonth ="select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from " +
				"( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
				"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())" +
				"  AND MONTH(s_l.`event_time`) = MONTH(NOW())  group by s_l.`session_id`) A";   	

		 		
		 		console.log("Total time spent on the tool in current month  ##### : "+sqlQueryTimeSptCurrentMonth);

			  query = pool.query(sqlQueryTimeSptCurrentMonth, function(err, sqlQueryTimeSptCurrentMonthResult) {
			
				 if (err) {
					 //console.log(err);
					 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
				 }
	
				if(typeof sqlQueryTimeSptCurrentMonthResult!=='undefined'){
					 console.log(" sqlQueryTimeSptCurrentMonthResult :: "+JSON.stringify(sqlQueryTimeSptCurrentMonthResult[0].T));
				
					  p = JSON.stringify(sqlQueryTimeSptCurrentMonthResult[0].T).replace(/['"]+/g, '');
					
					 	jsonObj["sqlQueryTimeSptCurrentMonthResult"] = p ;
				}	 	
				
				var sqlQueryTimeSptCurrentYear = "select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from" +
					" ( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
					"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())  " +
					"  group by s_l.`session_id`) A";
			
				 	console.log("Total time spent on the tool in current Year  ##### : "+sqlQueryTimeSptCurrentYear);
			
				 	 query = pool.query(sqlQueryTimeSptCurrentYear, function(err, sqlQueryTimeSptCurrentYearResult) {
				
				 		if (err) {
				 			//console.log(err);
				 			console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
				 		}
				
				 		if(typeof sqlQueryTimeSptCurrentYearResult!=='undefined'){
					 		console.log(" sqlQueryTimeSptCurrentYearResult :: "+JSON.stringify(sqlQueryTimeSptCurrentYearResult[0].T));
					
					 		 p = JSON.stringify(sqlQueryTimeSptCurrentYearResult[0].T).replace(/['"]+/g, '') ;
					
					
					 		jsonObj["sqlQueryTimeSptCurrentYearResult"] = p ;
				 		}
				
				var sqlQueryTimeSaveCurrMonth = "SELECT COALESCE((select sum(user_perception)  from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
				" YEAR(session_date) = YEAR(NOW()) AND MONTH(session_date) = MONTH(NOW()) group by user_email),0) A";
				
				console.log("Total time saved in current Month  ##### : "+sqlQueryTimeSaveCurrMonth);

				 query = pool.query(sqlQueryTimeSaveCurrMonth, function(err, sqlQueryTimeSaveCurrMonthResult) {

					 if (err) {
						 console.log(err);
						 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
					 }
					 if(typeof sqlQueryTimeSaveCurrMonthResult!=='undefined'){

					 console.log("sqlQueryTimeSaveCurrMonthResult :: "+JSON.stringify(sqlQueryTimeSaveCurrMonthResult[0].A)) ;
					  p = JSON.stringify(sqlQueryTimeSaveCurrMonthResult[0].A) ;


					 jsonObj["sqlQueryTimeSaveCurrMonthResult"] = p ;
					 
					 }
					 var sqlQueryTimeSaveCurrYear = "select sum(user_perception) A from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
						" YEAR(session_date) = YEAR(NOW()) group by user_email";

						console.log("Total time saved in current Year  ##### : "+sqlQueryTimeSaveCurrYear);

						 query = pool.query(sqlQueryTimeSaveCurrYear, function(err, sqlQueryTimeSaveCurrYearResult) {

							if (err) {
								console.log(err);
							}
							if(typeof sqlQueryTimeSaveCurrYearResult!=='undefined'){
							console.log("sqlQueryTimeSaveCurrYearResult :: "+JSON.stringify(sqlQueryTimeSaveCurrYearResult[0].A)) ;
							 p = JSON.stringify(sqlQueryTimeSaveCurrYearResult[0].A) ;
							
							
								jsonObj["sqlQueryTimeSaveCurrYearResult"] = p ;
							}
								
				var created_by = getCreatedBy(req.session.user.emailAddress);
				//var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name , IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts,if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status,DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date  FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and ( opportunity_id like trim('%" +searchOpportunity+"%') or sol_details.sol_id = '"+searchOpportunity+"') and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
				var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name , IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts,if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status,null as last_edit_date  FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and ( opportunity_id like trim('%" +searchOpportunity+"%') or sol_details.sol_id = '"+searchOpportunity+"') and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
			
					var query = pool.query(sqlQuery, function(err, solDashboardResult) {
						if (err) throw err;	
						//console.log(solDashboardResult);
						//console.log("printing each element");
						var opportunityList = [];
						var solAreaList = [];
						var opportunity = {};
						var solArea = {};

						for (var i = 0; i < solDashboardResult.length; i++) {

							solAreaList = [];
						
							opportunity = {sol_id: solDashboardResult[i].sol_id, 
										   opportunity_name: solDashboardResult[i].opportunity_name,
										   customer_name:solDashboardResult[i].customer_name,
										   industry_name : solDashboardResult[i].indus_name,
										   total_efforts : solDashboardResult[i].totalEfforts,
										   sol_status : solDashboardResult[i].sol_status,
										   creation_date : solDashboardResult[i].creation_date,
										   last_edit_date : solDashboardResult[i].last_edit_date
										   };
							solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
										sol_area_id: solDashboardResult[i].sol_area_id,
										creation_date: solDashboardResult[i].creation_date};
							solAreaList.push(solArea);				
							while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
								i++;
								solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
										sol_area_id: solDashboardResult[i].sol_area_id,
										creation_date: solDashboardResult[i].creation_date};
							//	console.log("Sol  ID1" + solDashboardResult[i].sol_id)		
								
								solAreaList.push(solArea);	
								
							}

							opportunity.solAreaList = solAreaList;
							opportunityList.push(opportunity);

						}
						//console.log(opportunityList);
						//console.log("FINAL OBJECT ######### inside searchOpportunity :::::: "+JSON.stringify(jsonObj));
						
						//for tab2 data 
						var sqlShareByMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
						"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.created_by in ("+ created_by +") and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.OWNER_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
						console.log("solDashboardResult sqlShareByMe: "+sqlShareByMe);
						var optyShareByMeList = [];
						var query = pool.query(sqlShareByMe, function(err, solDashboardResult) {
							if (err) throw err;	
							var solAreaList = [];
							var opportunity = {};
							var solArea = {};
							for (var i = 0; i < solDashboardResult.length; i++) {
								solAreaList = [];
								opportunity = {sol_id: solDashboardResult[i].sol_id, 
										   opportunity_name: solDashboardResult[i].opportunity_name,
										   customer_name:solDashboardResult[i].customer_name,
										   industry_name : solDashboardResult[i].indus_name,
										   total_efforts : solDashboardResult[i].totalEfforts,
										   sol_status : solDashboardResult[i].sol_status,
										   creation_date : solDashboardResult[i].creation_date,
										   last_edit_date : solDashboardResult[i].last_edit_date
										   };
								solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
											sol_area_id: solDashboardResult[i].sol_area_id,
											creation_date: solDashboardResult[i].creation_date};
								solAreaList.push(solArea);				
								while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
									i++;
									solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
												sol_area_id: solDashboardResult[i].sol_area_id,
												creation_date: solDashboardResult[i].creation_date};
									
									solAreaList.push(solArea);	
								
								}
							opportunity.solAreaList = solAreaList;
							optyShareByMeList.push(opportunity);
							}
							//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareByMeList));
							//end of tab2 data 
							
							//for tab3 data 
							var sqlShareWithMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
							"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.SHARED_WITH_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
							console.log("solDashboardResult optyShareWithMe: "+sqlShareWithMe);
							var optyShareWithMeList = [];
							var query = pool.query(sqlShareWithMe, function(err, solDashboardResult) {
								if (err) throw err;	
								var solAreaList = [];
								var opportunity = {};
								var solArea = {};
								for (var i = 0; i < solDashboardResult.length; i++) {
									solAreaList = [];
									opportunity = {sol_id: solDashboardResult[i].sol_id, 
											   opportunity_name: solDashboardResult[i].opportunity_name,
											   customer_name:solDashboardResult[i].customer_name,
											   industry_name : solDashboardResult[i].indus_name,
											   total_efforts : solDashboardResult[i].totalEfforts,
											   sol_status : solDashboardResult[i].sol_status,
											   creation_date : solDashboardResult[i].creation_date,
											   last_edit_date : solDashboardResult[i].last_edit_date
											   };
									solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
											sol_area_id: solDashboardResult[i].sol_area_id,
											creation_date: solDashboardResult[i].creation_date};
									solAreaList.push(solArea);				
									while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
										i++;
										solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
										sol_area_id: solDashboardResult[i].sol_area_id,
										creation_date: solDashboardResult[i].creation_date};
										solAreaList.push(solArea);	
									
									}
									opportunity.solAreaList = solAreaList;
									optyShareWithMeList.push(opportunity);
								}
								//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareWithMeList));
								//end of tab3 data 
								
										res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList,'optyShareByMeList':optyShareByMeList,'optyShareWithMeList':optyShareWithMeList,'jsonObj':jsonObj});

												});//end tab3
											});//end tab2
										});//end tab1
									});
						 		});
				 			});
				 	 	});
			  		});
			 	});
			});
				
			}else{
                   res.redirect('/getSolutionInfo?searchSolId='+searchOpportunity);    //getSolutionInfo			
                }
   			connection.release();
		});	
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});
//Saket till here++++++++++++++

app.post('/getSolutionArtifacts', ensureAuthenticated, function(req, res) {
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		//console.log('body: ' + JSON.stringify(post));
	//	console.log("^^^^^^^^^^^^ Existing Solution - Solution Id : "+post.opportunityId.trim());
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			var sqlQuery= "select basic_details.sl_id, basic_details.sol_id, sol_area_details.sol_area_id, basic_details.indus_id, basic_details.proposed_delivery_center,basic_details.opportunity_id, basic_details.customer_name from solution_basic_details_trx basic_details, solution_area_details_trx sol_area_details where sol_area_details.sol_id = basic_details.sol_id and basic_details.sol_id ="+ post.solId+ " and sol_area_details.sol_area_id =" +post.searchSolAreaId;
			if(post.opportunityId != null && post.opportunityId.trim()!="")	
				sqlQuery=sqlQuery+' and opportunity_id=\'TRIM('+post.opportunityId.trim()+')\'';
			console.log(sqlQuery);
			var query = pool.query(sqlQuery, function(err, result) {
				console.log(query);
				if (err) throw err;
				
				if(result.length>0)				
				{
					setTimeout(function() {
						var javaRequest = "http://"+serviceURL+"/estimate/request?sessionId="+req.session.id+"&solId="+post.searchSolId.trim()+"&solAreaId="+result[0].sol_area_id;
						request.post(javaRequest,{  },
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
								console.log(body)
								res.render('saveSolutionInfo', {'user' : req.session.user,SOL_ID:result[0].sol_id,SOL_AREA_ID:result[0].sol_area_id,INDUS_ID:result[0].indus_id});
								}
							}
						); 
					}, 3000);
					console.log("One record found");
				}
				res.render('saveSolutionInfo', {'user' : req.session.user, SOL_ID:result[0].sol_id,SOL_AREA_ID:result[0].sol_area_id,INDUS_ID:result[0].indus_id});
				
				connection.release();
			});
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});


app.post('/saveSolutionUseCasesInfo', ensureAuthenticated, function(req, res) {

	console.log('<>>>>>>>> Entered route POST /saveSolutionUseCasesInfo <>>>>>> \n');
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;
		var useCaseId  = post.useCaseId;
		var testSolId = post.testSolId;
		var soakTestId=post.soakTestId;
		var testFlagId = post.testFlagId;
		var model = post.model;
		var sol_area_id = post.SOL_AREA_ID;
		var arrAlluseCaseIds = post.useCaseId2Fixed;
		var indus_id = post.INDUS_ID;
		var useCaseId2  = post.useCaseId2;
		
		var sprintWeeks;
		var useCaseInfoType = post.useCaseInfoType;
		var radio = post.radioSel;
		console.log("got indusId from POSt as @@@@ :::: "+indus_id);
		console.log("testSolId @@@@ :::: "+testSolId);
		console.log(" post.useCaseId2 :: "+post.useCaseId2Fixed);
		console.log(" req :: "+util.inspect(post));
		
		if(post.sprintWeeks) {
			sprintWeeks = post.sprintWeeks;
		} 
		else
			sprintWeeks = 0;

		
		if(post.isedit == 'true'){
			useCaseInfoType = post.edit_usecase_info_type;
			sprintWeeks = post.edit_sprint_weeks;
		}
		
		var arr = new Array();
		if(util.isArray(testFlagId)){
			arr = testFlagId;
		}else{
			arr.push(testFlagId);
		}
		
		var currentSolAreaId = 0;
		
		if(sol_area_id == constants.IBMUnica){
			
			pool.getConnection(function(err, connection) {
				if (err) {
					console
							.log("Error obtaining connection from pool: "
									+ err);
					connection.release();
					throw err;
				}
				
				var sqlInsertQuery = "insert into solution_requirement_matrix  (sol_id, use_case_id, is_perf_test_in_scope) values ";
				var testScope = 0;
				
				
				if(util.isArray(useCaseId)) {		
					for (var i = 0; i <useCaseId.length ; i++) {
						testScope = 0;
					//    if(testSolId=='Y' && testFlagId[i] == 1){
						if(testSolId=='Y' && arr.indexOf(useCaseId[i]) > -1){
							testScope = 1;
						}
						if(i>0)	
							sqlInsertQuery = sqlInsertQuery +",";				
						sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId[i]+","+testScope+")";
						
					/*    if(useCaseId[i] != 0){
							arrAlluseCaseIds = arrAlluseCaseIds +","+useCaseId[i];
						}*/
					}
					
					sqlInsertQuery =sqlInsertQuery +",("+solId+","+arrAlluseCaseIds+","+testScope+")";
				}
				else {
						if(testSolId=='Y' && arr.indexOf(useCaseId) > -1){
							testScope = 1;
						}
					sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId+","+testScope+")";
					//sqlInsertQuery =sqlInsertQuery +",("+solId+","+arrAlluseCaseIds+","+testScope+")";
					
					//arrAlluseCaseIds = arrAlluseCaseIds +","+useCaseId;
				}
				
				
				//ju define a custom insertQuery here for Enterprise Application Integration as we would be getting different input from UI & saving in a different table 
				
				
				if (typeof useCaseId == 'undefined'){
					
					arrAlluseCaseIds = post.useCaseId2Fixed;
					
					sqlInsertQuery = "insert into solution_requirement_matrix  (sol_id, use_case_id, is_perf_test_in_scope) values "+"("+solId+","+arrAlluseCaseIds+","+testScope+")";
					
				}else{
                    arrAlluseCaseIds = arrAlluseCaseIds+","+useCaseId;
                }
				console.log("Final use cases Insert Query for detailed UseCase: "+sqlInsertQuery);
				console.log("arrAlluseCaseIds ----- > "+arrAlluseCaseIds);
				
				//first delete what already exists
				var sqlDeleteQuery = "delete from solution_requirement_matrix where sol_id="+solId + " and use_case_id in (select use_case_id from industry_use_cases_master where Sol_area_id="+post.SOL_AREA_ID+" )";
				var sqlDeleteQueryExec = pool.query(sqlDeleteQuery, function(err, sqlDeleteQueryResult) {
					console.log("sqlDeleteQuery >> "+sqlDeleteQuery);
					if(err){
						console.log("error while deleting old values for soln Id "+solId+" & solAreaId  "+post.SOL_AREA_ID+" from industry_use_cases_master"); 
						throw err;	
					}
					console.log("--------------- before the insert query ");
					
					var querySaveUseCases = pool.query(sqlInsertQuery, function(err) {
						if (err) {
							console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
							throw err;	
						}
						console.log("++++++++++++++++++++++++++ Insert query exectued ");	
						
						/*var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
							if (err)  throw err;	
						});*/
						var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +")";
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								console.log(err);
							}
						});//session logging ends here	

						var addlParamCheckQry = "select IS_ADD_PARAM from solution_area_info where Sol_area_id = " + post.SOL_AREA_ID;
						console.log(sessionQuery);
						connection.query(addlParamCheckQry, function(err, addlParamCheckRes, fields){
							if (err) throw err;
							var isAddlParam = addlParamCheckRes[0].IS_ADD_PARAM;
							console.log('DB response  addlParam : ' + isAddlParam);
							
							if(isAddlParam === 1){
								var addlParamQuery = "SELECT apm.ADDNL_PARAM_ID, apm.ADDNLPARAM_SHEET_NAME, apm.ADDNLPARAM_SHEET_TITLE, apm.ADD_MSG_DESC , apm.ADDNLPARAM_LABEL, apm.ADDNLPARAM_INPUT_TYPE, apm.IS_PARAM_MANDATORY_UI, apm.ADDNLPARAM_DEFAULT_VALUE, apm.ADDNLPARAM_UPPER_LMT, apm.ADDNLPARAM_LOWER_LMT, apm.ADDNLPARAM_UNIT, apm.ADDNLPARAM_UI_ID, apm.SUB_ADDPARAM_LAYOUT, apm.ADDNLPARAM_CELL_NO, apm.ADDNLPARAM_GROUP_NAME, apm.ADDNLPARAM_SELECT_VALUES, sapm.SUB_ADDNL_PARAM_ID, sapm.SUB_ADDNLPARAM_INPUT_TYPE, sapm.IS_SUB_PARAM_MANDATORY_UI, sapm.SUB_ADDNLPARAM_DEFAULT_VALUE, sapm.SUB_ADDNLPARAM_UPPER_LMT, sapm.SUB_ADDNLPARAM_LOWER_LMT, sapm.SUB_ADDNLPARAM_UNIT, sapm.SUB_ADDNLPARAM_LABEL, (SELECT ADDNL_PARAM_VALUE FROM SOL_AREA_ADDNLPARAM_TX aptrx WHERE apm.ADDNL_PARAM_ID = aptrx.ADDNL_PARAM_ID AND aptrx.SUB_ADDNL_PARAM_ID = IF (sapm.SUB_ADDNL_PARAM_ID IS NULL, -1, sapm.SUB_ADDNL_PARAM_ID) AND aptrx.SOL_ID = "+ solId +") ADDNL_PARAM_VALUE, apm.ADD_DECIMAL_PLACES, sapm.SUB_ADD_DECIMAL_PLACES FROM SOL_AREA_ADDNLPARAM_MASTER apm LEFT JOIN SOL_AREA_SUB_ADDNLPARAM_MASTER sapm ON apm.ADDNL_PARAM_ID = sapm.ADDNL_PARAM_ID WHERE apm.use_case_id in ("+arrAlluseCaseIds+")  and  apm.SOL_AREA_ID = " + post.SOL_AREA_ID +" ORDER BY apm.SHEET_ORDER, apm.ADD_LABEL_ORDER,sapm.SUB_ADD_LABEL_ORDER";
								
								console.log(" addlParamQuery :: "+addlParamQuery);
								
								connection.query(addlParamQuery, function(e, addlParamRes, fields){
									if (e) throw e;
									var prevParamId = 0;
									var subParamList = [];
									var param = null;
									var paramList = [];
									var prevGroupName = "";
									var paramJson = {};
									console.log(addlParamRes[0]);

									for(var i = 0; i < addlParamRes.length; i++){
										var record = addlParamRes[i];

										
										if(prevParamId !== 0 && prevParamId !== record.ADDNL_PARAM_ID){
											if(subParamList.length > 0){
												param.subParamList = subParamList;
											}
											paramList.push(param);
											param = null;
											subParamList = [];
										}
										if(prevGroupName && prevGroupName !== record.ADDNLPARAM_GROUP_NAME){
											paramJson[prevGroupName] = paramList;
											paramList = [];
										}

										if(!param || record.ADDNLPARAM_CELL_NO){
											param = {
												"addlParamId": record.ADDNL_PARAM_ID,
												"addlParamSheetName": record.ADDNLPARAM_SHEET_NAME,
												"addlParamLabel": record.ADDNLPARAM_LABEL,
												"addlParamUIStyle": record.SUB_ADDPARAM_LAYOUT,
												"addlParamUIId": record.ADDNLPARAM_UI_ID,
												"addlParamSheetTitle": record.ADDNLPARAM_SHEET_TITLE,
												"addlParamInputDataType": record.ADDNLPARAM_INPUT_TYPE || "",
												"addlParamIsMandatory": record.IS_PARAM_MANDATORY_UI || "",
												"addlParamDefaultVal": record.ADDNL_PARAM_VALUE || record.ADDNLPARAM_DEFAULT_VALUE || "",
												"addlParamUpperLimit": record.ADDNLPARAM_UPPER_LMT || "",
												"addlParamLowerLimit": record.ADDNLPARAM_LOWER_LMT || "",
												"addlParamInputUnit": record.ADDNLPARAM_UNIT || "",
												"addlParamCellNo": record.ADDNLPARAM_CELL_NO || "",
												"addlParamValue": record.ADDNLPARAM_SELECT_VALUES || "",
												"message": record.ADD_MSG_DESC,
												"addlDecimalPlace": record.ADD_DECIMAL_PLACES,
												
											};
										}

										if(!record.ADDNLPARAM_CELL_NO){
											var subParam = {
												"addSubParamId": record.SUB_ADDNL_PARAM_ID,
												"addlSubParamLabel": record.SUB_ADDNLPARAM_LABEL,
												"addlSubParamInputDataType": record.SUB_ADDNLPARAM_INPUT_TYPE,
												"addlSubParamIsMandatory": record.IS_SUB_PARAM_MANDATORY_UI,
												"addlSubParamDefaultVal": record.ADDNL_PARAM_VALUE || record.SUB_ADDNLPARAM_DEFAULT_VALUE,
												"addlSubParamUpperLimit": record.SUB_ADDNLPARAM_UPPER_LMT,
												"addlSubParamLowerLimit": record.SUB_ADDNLPARAM_LOWER_LMT,
												"addlSubParamInputUnit": record.SUB_ADDNLPARAM_UNIT,
												"addlSubDecimalPlace": record.SUB_ADD_DECIMAL_PLACES,
											}
											subParamList.push(subParam);
										}

										prevParamId = record.ADDNL_PARAM_ID;
										prevGroupName = record.ADDNLPARAM_GROUP_NAME;
									}
									paramList.push(param);
									paramJson[prevGroupName] = paramList;

									console.log('Param JSON : ' + JSON.stringify(paramJson));
									connection.release();
															
									res.render('getAddlParamSAPAriba', {'user' : req.session.user, "solId" : post.solId, "testSolId" : testSolId, "solAreaId" : post.SOL_AREA_ID,"indus_id":indus_id , "addlParamJson" : JSON.stringify(paramJson)});
								});
							}
							else{					
								callUseCaseInfoEstimation(req, res, connection, indus_id);
							}
						});
					});
					
				});

			
			});
			
		
		}else{
		
			console.log("Inside saveSolutionUseCasesInfo(), Industry ID: "+ indus_id);
		console.log("Inside saveSolutionUseCasesInfo(), useCaseId.length: "+useCaseId.length);
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			
			var sqlInsertQuery = "insert into solution_requirement_matrix  (sol_id, use_case_id, is_perf_test_in_scope) values ";
			var testScope = 0;
			
			
			if(util.isArray(useCaseId)) {		
				for (var i = 0; i <useCaseId.length ; i++) {
					testScope = 0;
				//    if(testSolId=='Y' && testFlagId[i] == 1){
					if(testSolId=='Y' && arr.indexOf(useCaseId[i]) > -1){
						testScope = 1;
					}
					if(i>0)	
						sqlInsertQuery = sqlInsertQuery +",";				
					sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId[i]+","+testScope+")";
				}
			}
			else {
					if(testSolId=='Y' && arr.indexOf(useCaseId) > -1){
						testScope = 1;
					}
				sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId+","+testScope+")";
			}
			
			
			
			//ju define a custom insertQuery here for Enterprise Application Integration as we would be getting different input from UI & saving in a different table 
			
			
			
			console.log("Final use cases Insert Query for detailed UseCase: "+sqlInsertQuery);
			console.log("arrAlluseCaseIds ----- > "+arrAlluseCaseIds);
			
			//first delete what already exists
			var sqlDeleteQuery = "delete from solution_requirement_matrix where sol_id="+solId + " and use_case_id in (select use_case_id from industry_use_cases_master where Sol_area_id="+post.SOL_AREA_ID+" )";
			var sqlDeleteQueryExec = pool.query(sqlDeleteQuery, function(err, sqlDeleteQueryResult) {
				console.log("sqlDeleteQuery >> "+sqlDeleteQuery);
				if(err){
					console.log("error while deleting old values for soln Id "+solId+" & solAreaId  "+post.SOL_AREA_ID+" from industry_use_cases_master"); 
					throw err;	
				}
				console.log("--------------- before the insert query ");
				
				var querySaveUseCases = pool.query(sqlInsertQuery, function(err) {
					if (err) {
						console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
						throw err;	
					}
					console.log("++++++++++++++++++++++++++ Insert query exectued ");	
					
					/*var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
						if (err)  throw err;	
					});*/
					var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +")";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							//connection.release();
							console.log(err);
						}
					});//session logging ends here	

					var addlParamCheckQry = "select IS_ADD_PARAM from solution_area_info where Sol_area_id = " + post.SOL_AREA_ID;
					console.log(addlParamCheckQry);
					connection.query(addlParamCheckQry, function(err, addlParamCheckRes, fields){
						if (err) throw err;
						var isAddlParam = addlParamCheckRes[0].IS_ADD_PARAM;
						console.log('DB response  addlParam : ' + isAddlParam);
						
						if(isAddlParam === 1){
							var addlParamQuery = "SELECT apm.ADDNL_PARAM_ID, apm.ADDNLPARAM_SHEET_NAME, apm.ADDNLPARAM_SHEET_TITLE, apm.ADD_MSG_DESC, apm.ADDNLPARAM_LABEL, apm.ADDNLPARAM_INPUT_TYPE, apm.IS_PARAM_MANDATORY_UI, apm.ADDNLPARAM_DEFAULT_VALUE, apm.ADDNLPARAM_UPPER_LMT, apm.ADDNLPARAM_LOWER_LMT, apm.ADDNLPARAM_UNIT, apm.ADDNLPARAM_UI_ID, apm.SUB_ADDPARAM_LAYOUT, apm.ADDNLPARAM_CELL_NO, apm.ADDNLPARAM_GROUP_NAME, apm.ADDNLPARAM_SELECT_VALUES, sapm.SUB_ADDNL_PARAM_ID, sapm.SUB_ADDNLPARAM_INPUT_TYPE, sapm.IS_SUB_PARAM_MANDATORY_UI, sapm.SUB_ADDNLPARAM_DEFAULT_VALUE, sapm.SUB_ADDNLPARAM_UPPER_LMT, sapm.SUB_ADDNLPARAM_LOWER_LMT, sapm.SUB_ADDNLPARAM_UNIT, sapm.SUB_ADDNLPARAM_LABEL, sapm.SUB_ADDNLPARAM_SELECT_VALUES, sapm.ADDNLPARAM_UI_ID as SUB_ADDNLPARAM_UI_ID, (SELECT ADDNL_PARAM_VALUE FROM SOL_AREA_ADDNLPARAM_TX aptrx WHERE apm.ADDNL_PARAM_ID = aptrx.ADDNL_PARAM_ID AND aptrx.SUB_ADDNL_PARAM_ID = IF (sapm.SUB_ADDNL_PARAM_ID IS NULL, -1, sapm.SUB_ADDNL_PARAM_ID) AND aptrx.SOL_ID = "+ solId +") ADDNL_PARAM_VALUE, apm.ADD_DECIMAL_PLACES, sapm.SUB_ADD_DECIMAL_PLACES FROM SOL_AREA_ADDNLPARAM_MASTER apm LEFT JOIN SOL_AREA_SUB_ADDNLPARAM_MASTER sapm ON apm.ADDNL_PARAM_ID = sapm.ADDNL_PARAM_ID WHERE apm.SOL_AREA_ID = " + post.SOL_AREA_ID;
							 
							if(post.SOL_AREA_ID === constants.IBMDigitalExperience || post.SOL_AREA_ID === "165"){
								addlParamQuery = addlParamQuery + " AND apm.ADDNLPARAM_GROUP_NAME IN('" + radio + "', 'Common')";
							}
							addlParamQuery = addlParamQuery +" ORDER BY apm.SHEET_ORDER, apm.ADD_LABEL_ORDER,sapm.SUB_ADD_LABEL_ORDER";
							console.log(" addlParamQuery :: "+addlParamQuery);
							
							connection.query(addlParamQuery, function(e, addlParamRes, fields){
								if (e) throw e;
								var prevParamId = 0;
								var subParamList = [];
								var param = null;
								var paramList = [];
								var prevGroupName = "";
								var paramJson = {};
								console.log(addlParamRes[0]);

								for(var i = 0; i < addlParamRes.length; i++){
									var record = addlParamRes[i];

									
									if(prevParamId !== 0 && prevParamId !== record.ADDNL_PARAM_ID){
										if(subParamList.length > 0){
											param.subParamList = subParamList;
										}
										paramList.push(param);
										param = null;
										subParamList = [];
									}
									if(prevGroupName && prevGroupName !== record.ADDNLPARAM_GROUP_NAME){
										paramJson[prevGroupName] = paramList;
										paramList = [];
									}

									if(!param || record.ADDNLPARAM_CELL_NO){
										param = {
											"addlParamId": record.ADDNL_PARAM_ID,
											"addlParamSheetName": record.ADDNLPARAM_SHEET_NAME,
											"addlParamLabel": record.ADDNLPARAM_LABEL,
											"addlParamUIStyle": record.SUB_ADDPARAM_LAYOUT,
											"addlParamUIId": record.ADDNLPARAM_UI_ID,
											"addlParamSheetTitle": record.ADDNLPARAM_SHEET_TITLE,
											"addlParamInputDataType": record.ADDNLPARAM_INPUT_TYPE || "",
											"addlParamIsMandatory": record.IS_PARAM_MANDATORY_UI || "",
											"addlParamDefaultVal": record.ADDNL_PARAM_VALUE || record.ADDNLPARAM_DEFAULT_VALUE || "",
											"addlParamUpperLimit": record.ADDNLPARAM_UPPER_LMT || "",
											"addlParamLowerLimit": record.ADDNLPARAM_LOWER_LMT || "",
											"addlParamInputUnit": record.ADDNLPARAM_UNIT || "",
											"addlParamCellNo": record.ADDNLPARAM_CELL_NO || "",
											"addlParamValue": record.ADDNLPARAM_SELECT_VALUES || "",
											"addlDecimalPlace": record.ADD_DECIMAL_PLACES,
											"message": record.ADD_MSG_DESC,
											
										};
									}
									
									if(!record.ADDNLPARAM_CELL_NO){
										var subParam = {
											"addSubParamId": record.SUB_ADDNL_PARAM_ID,
											"addlSubParamLabel": record.SUB_ADDNLPARAM_LABEL,
											"addlSubParamInputDataType": record.SUB_ADDNLPARAM_INPUT_TYPE,
											"addlSubParamIsMandatory": record.IS_SUB_PARAM_MANDATORY_UI,
											"addlSubParamDefaultVal": record.ADDNL_PARAM_VALUE || record.SUB_ADDNLPARAM_DEFAULT_VALUE,
											"addlSubParamUpperLimit": record.SUB_ADDNLPARAM_UPPER_LMT,
											"addlSubParamLowerLimit": record.SUB_ADDNLPARAM_LOWER_LMT,
											"addlSubParamInputUnit": record.SUB_ADDNLPARAM_UNIT,
											"addlSubParamValue": record.SUB_ADDNLPARAM_SELECT_VALUES,
											"addlSubParamUIId": record.SUB_ADDNLPARAM_UI_ID,
											"addlSubDecimalPlace": record.SUB_ADD_DECIMAL_PLACES,
										}
										subParamList.push(subParam);
									}

									prevParamId = record.ADDNL_PARAM_ID;
									prevGroupName = record.ADDNLPARAM_GROUP_NAME;


									/* var subParam = {
										"addlParamUIId": record.ADDNLPARAM_UI_ID,
										"addlParamHeading": "sadfdsf",//record.
										"addlParamInputDataType": record.ADDNLPARAM_INPUT_TYPE,
										"addlParamIsMandatory": record.IS_PARAM_MANDATORY_UI,
										"addlParamDefaultVal": record.ADDNLPARAM_DEFAULT_VALUE,
										"addlParamUpperLmt": record.ADDNLPARAM_UPPER_LMT,
										"addlParamLowerLimit": record.ADDNLPARAM_LOWER_LMT,
										"addlParamInputUnit": record.ADDNLPARAM_UNIT
									};
									if(prevParamId === 0 || prevParamId !== record.ADDNL_PARAM_ID){
										paramList.push(param);
										param = {};
										param = {
											"addlParamId": record.ADDNL_PARAM_ID,
											"addlParamSheetName": record.ADDNLPARAM_SHEET_NAME,
											"addlParamLabel": record.ADDNLPARAM_LABEL,
											"addlParamUIStyle": "Horizontal",//record.
											"addlParamSheetTitle": record.ADDNLPARAM_SHEET_TITLE
											"addlSubParam": subParamList
										};
										subParamList = [];
									}
									prevParamId = record.ADDNL_PARAM_ID;
									subParamList.push(subParam); */
								}
								paramList.push(param);
								paramJson[prevGroupName] = paramList;

								console.log('Param JSON : ' + JSON.stringify(paramJson));
								connection.release();
														
								res.render('getAddlParamSAPAriba', {'user' : req.session.user, "solId" : post.solId, "testSolId" : testSolId, "solAreaId" : post.SOL_AREA_ID, "indus_id":indus_id,"addlParamJson" : JSON.stringify(paramJson)});
							});
						}
						else{					
							callUseCaseInfoEstimation(req, res, connection, indus_id);
						}
					});
				});
				
			});

		
			});
		}
		//setting is_staffing flag to 1 #143
		setStaffingFlagDirty(req,res);
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});
app.post('/saveSolutionCustomUseCasesInfo', ensureAuthenticated, function(req, res) {
	console.log("*** Inside saveSolutionCustomUseCasesInfo******");
	//ju submission of ESB values will be done here
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;
		var useCaseId  = post.useCaseId;
		var indusId  = post.INDUS_ID;
		var username  = post.username;
		var testSolId = post.testSolId;
		var soakTestId=post.soakTestId;
		var testFlagId = post.testFlagId;
		var useCaseInfoType = post.useCaseInfoType;
		var siValJSON = JSON.parse(post.siValJSON);
		var perfPercent = siValJSON.perfPercent;
		console.log("siValJSON=="+post.siValJSON);
		
		if(post.isedit == 'true'){
			useCaseInfoType = post.edit_usecase_info_type;
		}
		
		
		//Add perfPercent in Flex_Field_1 of solution_area_details_trx table
		var sqlPerfInsert = "update solution_area_details_trx set Flex_Field_1=" + perfPercent + " where SOL_ID=" + solId + " and Sol_area_id=" + post.SOL_AREA_ID;
		console.log("sqlPerfInsert: "+sqlPerfInsert);
		pool.query(sqlPerfInsert, function(err, resultPerfInsert) {
			if (err) {
				console.log("++++++++++++++++++++++++++ Error in sqlPerfInsert query");
				throw err;	
			}
		});
		//var sqlCustomIntegrationInsertQuery = "insert into esb_integration_estimations (SOL_ID, tech1, tech2, SOL_AREA_ID, USE_CASE_ID, SOL_TYPE, NEW_SIMPLE, NEW_MEDIUM, NEW_COMPLEX, NEW_VCOMPLEX,userdefined_system_1, userdefined_system_2) values ";
		var sqlCustomIntegrationInsertQuery = "insert into esb_integration_estimations (SOL_ID, tech1, tech2, SOL_AREA_ID, SOL_TYPE, NEW_SIMPLE, NEW_MEDIUM, NEW_COMPLEX, NEW_VCOMPLEX,userdefined_system_1, userdefined_system_2) values ";
			
		var testSolId = post.testSolId;
		var soakTestId=post.soakTestId;
		var testFlagId = post.testFlagId;
		var counter = 0;
		for (var j = 0; j < siValJSON.entries.length ; j++) {
			console.log("siValJSON::"+siValJSON);
			console.log(">>>>"+j-1);
			console.log("siValJSON.entries .."+siValJSON.entries[j]);
			console.log("siValJSON.entries .."+siValJSON.entries[0].simple);
			var simple = siValJSON.entries[j].simple;
			var medium = siValJSON.entries[j].medium;
			var complex = siValJSON.entries[j].complex;
			var subcategoryId = siValJSON.entries[j].tech3;
			var tech1 = siValJSON.entries[j].tech1;
			var tech2 = siValJSON.entries[j].tech2;
			var tech3 = siValJSON.entries[j].tech3;
			var tech1_name = siValJSON.entries[j].tech1_name;
			var tech2_name = siValJSON.entries[j].tech2_name;
			var tech3_name = siValJSON.entries[j].tech3_name;
			//var usecaseId = siValJSON.entries[j].usecaseId;
					
			/*if(tech1.length==0 && tech2.length==0)
				var sqlUserDefinedInsertQuery = "insert into system_integration (industry_id, userdefined_system_1, userdefined_system_2, id_system_1, id_system_2, num_simple,num_medium, num_complex) values ("+
										indusId+", '"+tech1_name+"', '"+tech2_name+"', 1000, 1000, "+simple+", "+medium+", "+complex+")";
			else {
				if(tech1.length==0)
					var sqlUserDefinedInsertQuery = "insert into system_integration (industry_id, userdefined_system_1,id_system_1, id_system_2, num_simple,num_medium, num_complex) values ("+
														indusId+", '"+tech1_name+"', 1000, "+tech2+", "+simple+", "+medium+", "+complex+")";
				else if(tech2.length==0)
					var sqlUserDefinedInsertQuery = "insert into system_integration (industry_id, userdefined_system_2,id_system_1, id_system_2, num_simple,num_medium, num_complex) values ("+
														indusId+", '"+tech2_name+"', "+tech1+", 1000, "+simple+", "+medium+", "+complex+")";
			}			
			console.log("sqlUserDefinedInsertQuery "+sqlUserDefinedInsertQuery);*/
		
			if(tech3.length==0){
				var sqlTech3UserDefinedInsertQuery = "insert into system_integration_technology_master (Technology_name, Created_by, Modified_by) values ('"+
					tech3_name+"', '"+username+"', '"+username+"')";
					console.log("sqlTech3UserDefinedInsertQuery "+sqlTech3UserDefinedInsertQuery);														
			}
					
			console.log("simple="+simple+" & medium="+medium+" & complex="+complex+" &subcategoryId="+subcategoryId);
			var vcomplex = 0;
			if(counter > 0)
				sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + ",";
			//sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + "(" + solId + ", " + tech1 + ", " + tech2 + ", " + subcategoryId+ ", " + siValJSON.entries[j].usecaseId+",1,"+ simple+","+medium+","+complex+","+vcomplex +" )";
			if(tech1.length==0 || tech1==1000){
					tech1=1000;
					//tech2_name='null';
			}
			if(tech2.length==0 || tech2==1000){
					tech2=1000;
					//tech1_name='null';
			}
			if(tech1!=1000 && tech2!=1000){
					//tech1_name='null';
					//tech2_name='null';
			 } 
			
			console.log("tech1= "+tech1+" tech2= "+tech2+" tech1_name= "+tech1_name+" tech2_name= "+tech2_name);
			//sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + "(" + solId + ", " + tech1 + ", " + tech2 + ", " + subcategoryId+ ", " + usecaseId +" , 1,"+ simple+","+medium+","+complex+","+vcomplex +" )";
			sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + "(" + solId + ", " + tech1 + ", " + tech2 + ", " + subcategoryId+ ", 1,"+ simple+","+medium+","+complex+","+vcomplex +",'"+tech1_name+"','"+tech2_name+"' )";
			counter++;
			}
			
			console.log("++++++++++++++++++++++++++ final sqlCustomIntegrationInsertQuery::  "+sqlCustomIntegrationInsertQuery);
			
			setEstimationFlagDirty(solId,post.SOL_AREA_ID);
			
			//first delete what already exists..passing just solId shd be enough as all entries are for SystemINtegration solArea
			var sqlESBDeleteQuery = "delete from esb_integration_estimations where sol_id="+solId;
			var sqlESBDeleteQueryExec = pool.query(sqlESBDeleteQuery, function(err, sqlESBDeleteQueryResult) {	
				if(err){
					console.log("error while deleting old values for soln Id "+solId+" & solAreaId  "+post.SOL_AREA_ID+" from esb_integration_estimations"); 
					throw err;	
				}
				console.log("--------------- before the insert query ");
				var queryOracleInsertQuery = pool.query(sqlCustomIntegrationInsertQuery, function(err, result) {
					if (err) {
						console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
						throw err;	
					}
					console.log("++++++++++++++++++++++++++ Insert query exectued ");
					
				/*	
					if(sqlUserDefinedInsertQuery!=undefined ){
						console.log("before executing sqlUserDefinedInsertQuery")
						var sqlESBDeleteQueryExec = pool.query(sqlUserDefinedInsertQuery, function(err, result) {	
							if(err){
								console.log("error in executing  sqlUserDefinedInsertQuery from esb_integration_estimations"); 
								throw err;	
							}
						});
						console.log("after executing sqlUserDefinedInsertQuery")
					}
					if(sqlTech3UserDefinedInsertQuery!=undefined){
						console.log("before executing sqlTech3UserDefinedInsertQuery")
						var sqlESBDeleteQueryExec = pool.query(sqlTech3UserDefinedInsertQuery, function(err, result) {	
							if(err){
								console.log("error in executing sqlTech3UserDefinedInsertQuery  from system_integration_technology_master"); 
								throw err;	
							}
						});
						console.log("after executing sqlTech3UserDefinedInsertQuery")
					}
					*/
					
					/*var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
						if (err)  throw err;	
					});*/
					
					
					setTimeout(function() {
						request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											console.log(err);
										}
									});//session logging ends here	
								//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
									console.log("body inside  "+body);
									console.log("testSolId::::"+testSolId);
									//console.log("arr.length::::"+arr.length);
									
//									if('N'=='Y'){ //no need to call perf estimation here 
//										setTimeout(function() {
//											request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
//												function (error, response, body) {
//													if (!error && response.statusCode == 200) {
//														//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
//														var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//														console.log(sessionQuery);
//														var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//															if (err) {
//																//connection.release();
//																console.log(err);
//															}
//														});//session logging ends here	
//													//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//														console.log(body)
//													}
//													else {
//														var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
//														console.log(sessionQuery);
//														var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//															if (err) {
//																//connection.release();
//																console.log(err);
//															}
//														});//session logging ends here	
//													}
//												}
//											);
//										}, 300);
//										}
									
									var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
									console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
									var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
										if (err) {
											console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
											throw err;	
										}
										console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
										console.log("isedit:::::::::---"+post.isedit);
										
										if(resultSolAreaId.length <= 0)	{
											if(testSolId=='Y'){
												setTimeout(function() {
													request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
														function (error, response, body) {
															if (!error && response.statusCode == 200) {
																//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
																console.log(sessionQuery);
																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																	if (err) {
																		//connection.release();
																		console.log(err);
																	}
																});//session logging ends here	
															//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//																console.log(body);
//																console.log(">>>>>>>....making tomcat req for merged plan");
																//make a call to tomcat to generate the merged plan
//																setTimeout(function() {
//																	request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//																		function (error, response, body) {
//																			if (!error && response.statusCode == 200) {
//																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																				console.log(sessionQuery);
//																				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																					if (err) {
//																						//connection.release();
//																						console.log(err);
//																					}
//																				});//session logging ends here	
//
//																				console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//																				
//																			}
//																			else {
//																				console.log(":::error while calling merge plans for solId: "+solId);
//																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//																				console.log(sessionQuery);
//																				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																					if (err) {
//																						//connection.release();
//																						console.log(err);
//																					}
//																				});//session logging ends here	
//																			}
//																		}
//																	);
//																}, 500);
															}
															else {
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
																console.log(sessionQuery);
																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																	if (err) {
																		//connection.release();
																		console.log(err);
																	}
																});//session logging ends here	
															}
														}
													);
												}, 300);
											} else{
//												console.log(">>>>>>>....making tomcat req for merged plan");
												//make a call to tomcat to generate the merged plan
//												setTimeout(function() {
//													request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//														function (error, response, body) {
//															if (!error && response.statusCode == 200) {
//																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																console.log(sessionQuery);
//																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																	if (err) {
//																		//connection.release();
//																		console.log(err);
//																	}
//																});//session logging ends here	
//
//																console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//																
//															}
//															else {
//																console.log(":::error while calling merge plans for solId: "+solId);
//																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//																console.log(sessionQuery);
//																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																	if (err) {
//																		//connection.release();
//																		console.log(err);
//																	}
//																});//session logging ends here	
//															}
//														}
//													);
//												}, 500);
											}

										}
									});
								}//end of success if for success from java
								else {
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",1,'"+error+"')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											console.log(err);
										}
									});//session logging ends here	
								}

							}
						);
					}, 300);
					
					var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and use_provided_efforts=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
					console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
					var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
						if (err) {
							console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
							throw err;	
						}
						console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
						console.log("isedit:::::::::---"+post.isedit);
						
						if(resultSolAreaId.length > 0)	{
							
							var currentSolAreaId = resultSolAreaId[0].sol_area_id;	
							console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
							var sqlQuery;
							if(currentSolAreaId === constants.SAPAriba){
								//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;
								sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;
							}
							else{
								//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id,uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;	
								sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id,uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;	
							}
							console.log("sqlQuery ::::::::: "+sqlQuery);
							var query = pool.query(sqlQuery, function(err, solAreaResult) {
								if (err) throw err;	
								
								console.log("new currentSolAreaId ::::::::: 0000000000000000000000000000000000000000000000000000000000000000000000000 "+currentSolAreaId);
								
								if(solAreaResult.length > 0) {
//									if(testSolId == 'Y'){
//										
//										var sqlSelectQuery = "select sol_id,sol_area_id from solution_area_details_trx where sol_id="+solId+" and sol_area_id="+currentSolAreaId+ " and nfr_type=1";
//										
//										var selectQuery = pool.query(sqlSelectQuery, function(err, solAreaResultCheck) {
//											if(solAreaResultCheck.length == 0){
//												var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id,nfr_type) values("+solId+","+currentSolAreaId+",1)";
//												var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
//													if (err) {
//														console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query for Perf Test Estimation"); 
//														throw err;	
//													}
//												});
//											}
//										});
//									}
									console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo1 ");
									//console.log("solAreaResult.sol_area_id:::::::>>>"+solAreaResult.sol_area_id);

									if(currentSolAreaId ==constants.SIInterfaces){
										res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
									} else if(currentSolAreaId ==constants.AnalyticsSPSS){
										var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
										
										var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
										});								
									} else if(currentSolAreaId ==constants.DatawareHouse){														
										//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
										var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
										var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											
											console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
											res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
										});	
									}else if(currentSolAreaId ==constants.WatsonCustomerAssist){
										//var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
										var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getWatsonCustomerAssistInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user, 'defaultValues':sqlDefaultValuesQResults, "solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										
										});	
									}else if(currentSolAreaId ==constants.SIAdapters){
										res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
									} else if(currentSolAreaId ==constants.AMSTicketBased){
										var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
										
										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										
										});	
									}else if(currentSolAreaId ==constants.AMSResourceBased){
										var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
										
										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										
										});	
									}
									else if(currentSolAreaId ==constants.AMSProductBased){
										var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;
										
										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										
										});	
									}else {
										if(useCaseInfoType == 1){
											res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
										} else{
											res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
										}										
									}	
								}
								else {
									console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
									console.log("4");
									var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.opportunity_id,solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
									var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											throw err;	
										}
										var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
										connection.query(screenFieldQry, function(error, scrnFldRes, fields){
											if(error){
												throw error;
											}
											var screenField = {};
											for(var i = 0; i < scrnFldRes.length; i++){
												var rec = scrnFldRes[i];
											console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
											if(rec.IS_USE_CASES_VIEW_HIDDEN){
												if(i===0){
													screenField["isUsecaseHidden"] = 1;
												}
												screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isUsecaseHidden;
											}
											if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
												if(i===0){
													screenField["isPerfTestHidden"] = 1;
												}
												screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isPerfTestHidden;
											}
											if(rec.IS_MODEL_HIDDEN){
												if(i===0){
													screenField["isModelHidden"] = 1;
												}
												screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
											}
											else{
												delete screenField.isModelHidden;
											}
											if(rec.IS_SPRINT_WEEKS_HIDDEN){
												if(i===0){
													screenField["isSprintWeeksHidden"] = 1;
												}
												screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isSprintWeeksHidden;
											}
										}
										console.log("screenField : ");
										console.log(screenField);
										console.log("Success and passing the control to saveSolutionCustomUseCasesInfo Page."); 
										res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
									});
									});

								}
							});
						}
						else {
//							console.log("making request to generate Perf Test Estimation.");
//							if(testSolId=='Y'){
//								setTimeout(function() {
//									request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
//										function (error, response, body) {
//											//do nthg
//										}
//									);
//								}, 300);
//							}
						}




					});
				
				});
			});						
		
				

			//	connection.release();
			
	}
	else {sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});

app.post('/saveSolutionSIAdaptersInfo', ensureAuthenticated, function(req, res) {
	console.log("*** Inside saveSolutionSIAdaptersInfo ****");
	//ju submission of ESB values will be done here
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;
		var useCaseId  = post.useCaseId;
		var testSolId = post.testSolId;
		var soakTestId=post.soakTestId;
		var testFlagId = post.testFlagId;
		var useCaseInfoType = post.useCaseInfoType;
		
		if(post.isedit == 'true'){
			useCaseInfoType = post.edit_usecase_info_type;
		}
		
		var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Save_Solution  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +")";
		console.log(sessionQuery);
		var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
			if (err) {
				//connection.release();
				//console.log(err);
				console.log("ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
			}
		});
		
		
		
		var sqlDeleteAdaptersQuery = "delete from esb_adapters_estimations where sol_id="+solId;
		console.log("sqlDeleteAdaptersQuery:: "+sqlDeleteAdaptersQuery);
		var sqlDeleteAdaptersQueryExec = pool.query(sqlDeleteAdaptersQuery, function(err, sqlDeleteAdaptersQueryResult) {
			console.log("sqlDeleteAdaptersQueryResult >> "+sqlDeleteAdaptersQueryResult);
			if(err){
				console.log("error while deleting old values for soln Id "+solId + " from esb_adapters_estimations"); 
				throw err;	
			}
			//Add adapters info in esb_adapters_estimations table
			var sqlAdaptersInsert = "insert into esb_adapters_estimations (SOL_ID, SIMPLE, MEDIUM, COMPLEX, VCOMPLEX) values (" + solId + "," + post.scount + "," + post.mcount + "," + post.ccount + ",0)";
			console.log("sqlAdaptersInsert: "+sqlAdaptersInsert);
			pool.query(sqlAdaptersInsert, function(err, resultSqlAdaptersInsert) {
				if (err) {
					console.log("++++++++++++++++++++++++++ Error in sqlAdaptersInsert query");
					throw err;	
				}

				setTimeout(function() {
					setEstimationFlagDirty(solId,post.SOL_AREA_ID);
					request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
								console.log(sessionQuery);
								var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
									if (err) {
										//connection.release();
										//console.log(err);
										console.log("ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
									}
								});//session logging ends here	
							//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
								console.log(body);
								console.log("testSolId::::"+testSolId);
								//console.log("arr.length::::"+arr.length);
								
//								if('N'=='Y'){ //no need to call perf estimation here 
//									setTimeout(function() {
//										request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
//											function (error, response, body) {
//												if (!error && response.statusCode == 200) {
//													//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
//													var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//													console.log(sessionQuery);
//													var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//														if (err) {
//															//connection.release();
//															console.log(err);
//														}
//													});//session logging ends here	
//												//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//													console.log(body)
//												}
//												else {
//													var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
//													console.log(sessionQuery);
//													var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//														if (err) {
//															//connection.release();
//															console.log(err);
//														}
//													});//session logging ends here	
//												}
//											}
//										);
//									}, 300);
//									}
								
								var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
								console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
								var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
									if (err) {
										console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
										throw err;	
									}
									console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
									console.log("isedit:::::::::---"+post.isedit);
									
									if(resultSolAreaId.length <= 0)	{
										if(testSolId=='Y'){
											setTimeout(function() {
												request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
													function (error, response, body) {
														if (!error && response.statusCode == 200) {
															//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
															console.log(sessionQuery);
															var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																if (err) {
																	//connection.release();
																	//console.log(err);
																	console.log("ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
																}
															});//session logging ends here	
														//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//															console.log(body);
//															console.log(">>>>>>>....making tomcat req for merged plan");
															//make a call to tomcat to generate the merged plan
//															setTimeout(function() {
//																request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//																	function (error, response, body) {
//																		if (!error && response.statusCode == 200) {
//																			var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																			console.log(sessionQuery);
//																			var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																				if (err) {
//																					//connection.release();
//																					console.log(err);
//																				}
//																			});//session logging ends here	
//
//																			console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//																			
//																		}
//																		else {
//																			console.log(":::error while calling merge plans for solId: "+solId);
//																			var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//																			console.log(sessionQuery);
//																			var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																				if (err) {
//																					//connection.release();
//																					console.log(err);
//																				}
//																			});//session logging ends here	
//																		}
//																	}
//																);
//															}, 500);
														}
														else {
															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
															console.log(sessionQuery);
															var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																if (err) {
																	//connection.release();
																	//console.log(err);
																	console.log("ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
																}
															});//session logging ends here	
														}
													}
												);
											}, 300);
										} else{
											console.log(">>>>>>>....making tomcat req for merged plan");
											//make a call to tomcat to generate the merged plan
//											setTimeout(function() {
//												request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//													function (error, response, body) {
//														if (!error && response.statusCode == 200) {
//															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//															console.log(sessionQuery);
//															var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																if (err) {
//																	//connection.release();
//																	console.log(err);
//																}
//															});//session logging ends here	
//
//															console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//															
//														}
//														else {
//															console.log(":::error while calling merge plans for solId: "+solId);
//															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//															console.log(sessionQuery);
//															var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																if (err) {
//																	//connection.release();
//																	console.log(err);
//																}
//															});//session logging ends here	
//														}
//													}
//												);
//											}, 500);
										}
									}
								});
							}//end of success if for success from java
							else {
								var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",1,'"+error+"')";
								console.log(sessionQuery);
								var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
									if (err) {
										//connection.release();
										//console.log(err);
										console.log("ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
									}
								});//session logging ends here	
							}

						}
					);
				}, 300);
				
				var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and use_provided_efforts=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
				console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
				var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
					if (err) {
						console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
						throw err;	
					}
					console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
					console.log("isedit:::::::::---"+post.isedit);
					
					if(resultSolAreaId.length > 0)	{
						
						var currentSolAreaId = resultSolAreaId[0].sol_area_id;	
						console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
						var sqlQuery;
						if(currentSolAreaId === constants.SAPAriba){
							sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
						}
						else{
							sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
						}
						console.log("sqlQuery ::::::::: "+sqlQuery);
						var query = pool.query(sqlQuery, function(err, solAreaResult) {
							if (err) throw err;	
							
							console.log("new currentSolAreaId ::::::::: "+currentSolAreaId);
							
							if(solAreaResult.length > 0) {
//								if(testSolId == 'Y'){
//									
//									var sqlSelectQuery = "select sol_id,sol_area_id from solution_area_details_trx where sol_id="+solId+" and sol_area_id="+currentSolAreaId+ " and nfr_type=1";
//									
//									var selectQuery = pool.query(sqlSelectQuery, function(err, solAreaResultCheck) {
//										if(solAreaResultCheck.length == 0){
//											var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id,nfr_type) values("+solId+","+currentSolAreaId+",1)";
//											var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
//												if (err) {
//													console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query for Perf Test Estimation"); 
//													throw err;	
//												}
//											});
//										}
//									});
//								}
								console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo 2");
								//console.log("solAreaResult.sol_area_id:::::::>>>"+solAreaResult.sol_area_id);

								
								if(currentSolAreaId ==constants.SIInterfaces){
									res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
								} else if(currentSolAreaId ==constants.AnalyticsSPSS){
									var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
									
									var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
										if (err) {
											console.log("error while execution of sqlDefaultValues select  query"); 
											throw err;	
										}
										res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
									});								
								} else if(currentSolAreaId ==constants.DatawareHouse){														
									//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
									var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
									var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
										if (err) {
											console.log("error while execution of sqlDefaultValues select  query"); 
											throw err;	
										}
										
										console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
										res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
									});	
								}else if(currentSolAreaId ==constants.WatsonCustomerAssist){														
									//var sqlWatsonValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
									var sqlWatsonValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
									console.log("sqlWatsonValues:: "+sqlWatsonValues);
									var defValuesQuery = pool.query(sqlWatsonValues, function(err, sqlWatsonValuesResults) {
										if (err) {
											console.log("error while execution of sqlDefaultValues select  query"); 
											throw err;	
										}
										console.log("sqlWatsonValuesResults:: "+sqlWatsonValuesResults);
										console.log("Page is ##### getWatsonCustomerAssistInfo.html");
										res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlWatsonValuesResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
									});	
								}else if(currentSolAreaId ==constants.SIAdapters){
									res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
								} else if(currentSolAreaId ==constants.AMSTicketBased){
									var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
									
									console.log("sqlDefaultValues >>"+sqlDefaultValues);
									var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
										if (err) {
											console.log("error while execution of sqlDefaultValues select  query"); 
											throw err;	
										}
										console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
										console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
										if (sqlDefaultValuesQResults.length === 0)
											res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										else 
											res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
									
									});	
								}else if(currentSolAreaId ==constants.AMSResourceBased){
									var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
									
									console.log("sqlDefaultValues >>"+sqlDefaultValues);
									var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
										if (err) {
											console.log("error while execution of sqlDefaultValues select  query"); 
											throw err;	
										}
										console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
										console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
										if (sqlDefaultValuesQResults.length === 0)
											res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										else 
											res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
									
									});	
								}
								else if(currentSolAreaId ==constants.AMSProductBased){
									var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;

									console.log("sqlDefaultValues >>"+sqlDefaultValues);
									var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
										if (err) {
											console.log("error while execution of sqlDefaultValues select  query"); 
											throw err;	
										}
										console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
										console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
										if (sqlDefaultValuesQResults.length === 0)
											res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										else 
											res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
									
									});	
								}else {
									if(useCaseInfoType == 1){
										res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
									} else{
										res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
									}										
								}		
							}
							else {
								console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
								console.log("5");
								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.opportunity_id,solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
									connection.query(screenFieldQry, function(error, scrnFldRes, fields){
										if(error){
											throw error;
										}
										var screenField = {};
										for(var i = 0; i < scrnFldRes.length; i++){
											var rec = scrnFldRes[i];
										console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
										if(rec.IS_USE_CASES_VIEW_HIDDEN){
											if(i===0){
												screenField["isUsecaseHidden"] = 1;
											}
											screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isUsecaseHidden;
										}
										if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
											if(i===0){
												screenField["isPerfTestHidden"] = 1;
											}
											screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isPerfTestHidden;
										}
										if(rec.IS_MODEL_HIDDEN){
											if(i===0){
												screenField["isModelHidden"] = 1;
											}
											screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only" ;
										}
										else{
											delete screenField.isModelHidden;
										}
										if(rec.IS_SPRINT_WEEKS_HIDDEN){
											if(i===0){
												screenField["isSprintWeeksHidden"] = 1;
											}
											screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
										}
										else{
											delete screenField.isSprintWeeksHidden;
										}
									}
									console.log("screenField : ");
									console.log(screenField);
									console.log("Success and passing the control to saveSolutionCustomUseCasesInfo Page."); 
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
								});
								});

							}
						});
					}
					else {
//						console.log("making request to generate Perf Test Estimation.");
//						if(testSolId=='Y'){
//							setTimeout(function() {
//								request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
//									function (error, response, body) {
//										//do nthg
//									}
//								);
//							}, 300);
//						}
					}
				});
			});
		});						
			//	connection.release();			
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});

app.post('/saveSolutionHLUseCasesInfo', ensureAuthenticated, function(req, res) {
	
	//ju submission of ESB values will be done here
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;
		var useCaseId  = post.useCaseId;
		var testSolId = post.testSolId;
		var soakTestId=post.soakTestId;
		var testFlagId = post.testFlagId;
		var useCaseInfoType = post.useCaseInfoType;
		console.log("testFlagId:::::::::"+testFlagId);
		console.log("useCaseId:::::::::"+useCaseId);
		console.log("testSolId:::::::::"+testSolId);
		
		
		if(post.isedit == 'true'){
			useCaseInfoType = post.edit_usecase_info_type;
		}
		
		var arr = new Array();
		if(util.isArray(testFlagId)){
			arr = testFlagId;
		}else{
			arr.push(testFlagId);
		}
		var sqlQuery = "select use_case_id,reqsubcategoryid from industry_use_cases_master where (indus_id="+post.INDUS_ID+" or indus_id=101) and sol_area_id ="+post.SOL_AREA_ID+" and reqsubcategoryid in (";
		if(util.isArray(useCaseId)) {	
			for (var i = 0; i <useCaseId.length ; i++) {
//				if((util.isArray(testFlagId) ? testFlagId[i] : testFlagId) == 1){
//					arr.push(useCaseId[i]);
//				}
				
				if(i>0)	
					sqlQuery=sqlQuery+",";				
				sqlQuery=sqlQuery+useCaseId[i];
			}
			
		}
		else {
//				if((util.isArray(testFlagId) ? testFlagId[i] : testFlagId) == 1){
					//arr.push(useCaseId);
//				}
			sqlQuery=sqlQuery+useCaseId;
		}	

		sqlQuery=sqlQuery+");";


		console.log("-------Inside saveSolutionHLUseCasesInfo() - Select use cases Query : "+sqlQuery);

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
				var query = pool.query(sqlQuery, function(err, resultUseCasesList) {
					if (err) throw err;	
					
					//first delete what already exists
					var sqlDeleteQuery = "delete from solution_requirement_matrix where sol_id="+solId + " and use_case_id in (select use_case_id from industry_use_cases_master where Sol_area_id="+post.SOL_AREA_ID+" )";
					setEstimationFlagDirty(solId,post.SOL_AREA_ID);
					var sqlDeleteQueryExec = pool.query(sqlDeleteQuery, function(err, sqlDeleteQueryResult) {
						console.log("sqlDeleteQuery >> "+sqlDeleteQuery);
						if(err){
							console.log("error while deleting old values for soln Id "+solId+" & solAreaId  "+post.SOL_AREA_ID+" from industry_use_cases_master"); 
							throw err;	
						}
						console.log("--------------- before the insert query ");
						
						var sqlInsertQuery = "insert into solution_requirement_matrix  (sol_id, use_case_id, is_perf_test_in_scope) values ";
						for (var j = 0; j <resultUseCasesList.length ; j++) {
//							console.log("arr::"+arr);
//							console.log("typeOf arr[0]>>>>>>"+typeof arr[0]);
//							console.log("resultUseCasesList[j].reqsubcategoryid::"+resultUseCasesList[j].reqsubcategoryid);
//							console.log("arr.indexOf(resultUseCasesList[j].reqsubcategoryid)>>"+arr.indexOf(""+resultUseCasesList[j].reqsubcategoryid));
							var testScope = 0;					
							if(testSolId=='Y' && arr.indexOf(""+resultUseCasesList[j].reqsubcategoryid) > -1)
								testScope = 1;
							if(j > 0)
								sqlInsertQuery = sqlInsertQuery + ",";
							sqlInsertQuery = sqlInsertQuery + "(" +  solId + "," + resultUseCasesList[j].use_case_id+"," + testScope+")";
						}
						console.log("Final use cases Insert Query : "+sqlInsertQuery);
						
						var querySaveUseCases = pool.query(sqlInsertQuery, function(err) {
							if (err) {
								console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
								throw err;	
							}
							console.log("++++++++++++++++++++++++++ Insert query exectued ");	
							
							/*var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
								if (err)  throw err;	
							});*/
					/*	var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+")";
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								console.log(err);
							}
						});//session logging ends here	
						*/
							setTimeout(function() {
								request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
									function (error, response, body) {
										if (!error && response.statusCode == 200) {
											var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
											console.log(sessionQuery);
											var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
												if (err) {
													//connection.release();
													console.log(err);
												}
											});//session logging ends here	
										//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
											console.log(body);
											//if(testSolId=='Y' && arr.length > 0){
//											if('N'=='Y' && arr.length > 0){ //no need to call perf individually now
//												setTimeout(function() {
//													request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
//														function (error, response, body) {
//															if (!error && response.statusCode == 200) {
//																//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
//																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																console.log(sessionQuery);
//																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																	if (err) {
//																		//connection.release();
//																		console.log(err);
//																	}
//																});//session logging ends here	
//															//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//																console.log(body)
//															}
//															else {
//																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
//																console.log(sessionQuery);
//																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																	if (err) {
//																		//connection.release();
//																		console.log(err);
//																	}
//																});//session logging ends here	
//															}
//														}
//													);
//												}, 300);
//												}
											
											var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
											
											console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
											var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
												if (err) {
													console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
													throw err;	
												}
												console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
												console.log("isedit:::::::::---"+post.isedit);
												
												if(resultSolAreaId.length <= 0)	{
													if(testSolId=='Y'){
														setTimeout(function() {
															request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
																function (error, response, body) {
																	if (!error && response.statusCode == 200) {
																		//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
																		var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
																		console.log(sessionQuery);
																		var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																			if (err) {
																				//connection.release();
																				console.log(err);
																			}
																		});//session logging ends here	
																	//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//																		console.log(body);
//																		console.log(">>>>>>>....making tomcat req for merged plan");
																		//make a call to tomcat to generate the merged plan
//																		setTimeout(function() {
//																			request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//																				function (error, response, body) {
//																					if (!error && response.statusCode == 200) {
//																						var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																						console.log(sessionQuery);
//																						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																							if (err) {
//																								//connection.release();
//																								console.log(err);
//																							}
//																						});//session logging ends here	
//
//																						console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//																						
//																					}
//																					else {
//																						console.log(":::error while calling merge plans for solId: "+solId);
//																						var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//																						console.log(sessionQuery);
//																						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																							if (err) {
//																								//connection.release();
//																								console.log(err);
//																							}
//																						});//session logging ends here	
//																					}
//																				}
//																			);
//																		}, 500);
																	}
																	else {
																		var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
																		console.log(sessionQuery);
																		var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																			if (err) {
																				//connection.release();
																				//console.log(err);
																				console.log("Table 'session_log' doesn't exist");
																				
																			}
																		});//session logging ends here	
																	}
																}
															);
														}, 300);
													} else{
//														console.log(">>>>>>>....making tomcat req for merged plan");
														//make a call to tomcat to generate the merged plan
//														setTimeout(function() {
//															request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//																function (error, response, body) {
//																	if (!error && response.statusCode == 200) {
//																		var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																		console.log(sessionQuery);
//																		var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																			if (err) {
//																				//connection.release();
//																				console.log(err);
//																			}
//																		});//session logging ends here	
//
//																		console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//																		
//																	}
//																	else {
//																		console.log(":::error while calling merge plans for solId: "+solId);
//																		var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//																		console.log(sessionQuery);
//																		var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																			if (err) {
//																				//connection.release();
//																				console.log(err);
//																			}
//																		});//session logging ends here	
//																	}
//																}
//															);
//														}, 500);
													}

												}
											});
										}//end of success if for success from java
										else {
											var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",1,'"+error+"')";
											console.log(sessionQuery);
											var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
												if (err) {
													//connection.release();
													//console.log(err);
													console.log("Table 'session_log' doesn't exist");

												}
											});//session logging ends here	
										}

									}
								);
							}, 300);
							
							// sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and use_provided_efforts=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
							var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
							var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
								if (err) {
									console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
									throw err;	
								}
								console.log("isedit:::::::::---"+post.isedit);
								
								if(resultSolAreaId.length > 0)	{
									
									var currentSolAreaId = resultSolAreaId[0].sol_area_id;	
									console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
									var sqlQuery;
									if(currentSolAreaId === constants.SAPAriba){
										sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
									}
									else{
										sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
									}
									var query = pool.query(sqlQuery, function(err, solAreaResult) {
										if (err) throw err;	
										if(solAreaResult.length > 0) {
//											if(testSolId == 'Y'){
//												
//												var sqlSelectQuery = "select sol_id,sol_area_id from solution_area_details_trx where sol_id="+solId+" and sol_area_id="+currentSolAreaId+ " and nfr_type=1";
//												
//												var selectQuery = pool.query(sqlSelectQuery, function(err, solAreaResultCheck) {
//													if(solAreaResultCheck.length == 0){
//														var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id,nfr_type) values("+solId+","+currentSolAreaId+",1)";
//														var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
//															if (err) {
//																console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query for Perf Test Estimation"); 
//																throw err;	
//															}
//														});
//													}
//												});
//											}
											console.log(" ***** Inside captureSolAreaUseCases, Success and forward to get next	UseCaseInfo ");
											console.log("currentSolAreaId>>>>>>>>"+currentSolAreaId);
											//console.log("solAreaResult.sol_area_id:::::::"+solAreaResult.sol_area_id);
											if(currentSolAreaId ==constants.SIInterfaces){
												res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
											} else if(currentSolAreaId ==constants.AnalyticsSPSS){
												var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
												
												var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
													if (err) {
														console.log("error while execution of sqlDefaultValues select  query"); 
														throw err;	
													}
													res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
												});								
											} else if(currentSolAreaId ==constants.DatawareHouse){														
												//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
												var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
												var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
													if (err) {
														console.log("error while execution of sqlDefaultValues select  query"); 
														throw err;	
													}
													
													console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
													res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
												});	
											}else if(currentSolAreaId ==constants.WatsonCustomerAssist){
												
												//var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
												var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
												console.log("sqlDefaultValues >>"+sqlDefaultValues);
												var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
													if (err) {
														console.log("error while execution of sqlDefaultValues select  query"); 
														throw err;	
													}
													console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
													console.log("Page is ##### getWatsonCustomerAssistInfo.html "+typeof sqlDefaultValuesQResults);
													if (sqlDefaultValuesQResults.length === 0)
														res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
													else 
														res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
													
												});	
											}else if(currentSolAreaId ==constants.SIAdapters){
												res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
											}
											else if(currentSolAreaId ==constants.AMSTicketBased){
												var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
												
												console.log("sqlDefaultValues >>"+sqlDefaultValues);
												var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
													if (err) {
														console.log("error while execution of sqlDefaultValues select  query"); 
														throw err;	
													}
													console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
													console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
													if (sqlDefaultValuesQResults.length === 0)
														res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
													else 
														res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
													
												});	
											}else if(currentSolAreaId ==constants.AMSResourceBased){
												var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
												
												console.log("sqlDefaultValues >>"+sqlDefaultValues);
												var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
													if (err) {
														console.log("error while execution of sqlDefaultValues select  query"); 
														throw err;	
													}
													console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
													console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
													if (sqlDefaultValuesQResults.length === 0)
														res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
													else 
														res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
												
												});	
											}
											else if(currentSolAreaId ==constants.AMSProductBased){
												var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;

												console.log("sqlDefaultValues >>"+sqlDefaultValues);
												var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
													if (err) {
														console.log("error while execution of sqlDefaultValues select  query"); 
														throw err;	
													}
													console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
													console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
													if (sqlDefaultValuesQResults.length === 0)
														res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
													else 
														res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
												
												});	
											}
											else {
												if(useCaseInfoType == 1){
													res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
												} else{
													res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
												}										
											}											
										}
										else {
											console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
											console.log("6");
											var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope,solution_basic_details_trx.opportunity_id, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
											var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
												if (err) {
													console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
													throw err;	
												}
												var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
												connection.query(screenFieldQry, function(error, scrnFldRes, fields){
													if(error){
														throw error;
													}
													var screenField = {};
													var currenSolAreaName=" ";
													for(var i = 0; i < scrnFldRes.length; i++){
														var rec = scrnFldRes[i];
													console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
													if(rec.Sol_area_id==currentSolAreaId){
														currenSolAreaName=rec.Sol_area_Name;
													}
													
													if(rec.IS_USE_CASES_VIEW_HIDDEN){
														if(i===0){
															screenField["isUsecaseHidden"] = 1;
														}
														screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
													}
													else{
														delete screenField.isUsecaseHidden;
													}
													if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
														if(i===0){
															screenField["isPerfTestHidden"] = 1;
														}
														screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
													}
													else{
														delete screenField.isPerfTestHidden;
													}
													if(rec.IS_MODEL_HIDDEN){
														if(i===0){
															screenField["isModelHidden"] = 1;
														}
														screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
													}
													else{
														delete screenField.isModelHidden;
													}
													if(rec.IS_SPRINT_WEEKS_HIDDEN){
														if(i===0){
															screenField["isSprintWeeksHidden"] = 1;
														}
														screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
													}
													else{
														delete screenField.isSprintWeeksHidden;
													}
												}
												console.log("screenField : ");
												
												console.log("Success and passing the control to saveSolutionHLUseCasesInfo Page."); 
												console.log("currenSolAreaName "+currenSolAreaName);
												console.log("currentSolAreaId: "+currentSolAreaId);
												//res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
												res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+currenSolAreaName+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
												
												});
											});

										}
									});
								}
								else {
									
//									console.log("making request to generate Perf Test Estimation.");
//									if(testSolId=='Y'){
//										setTimeout(function() {
//											request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
//												function (error, response, body) {
//													//do nthg
//												}
//											);
//										}, 300);
//									}
									/*var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

									var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											throw err;	
										}
										res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"Selected use cases have been saved successfully.", "sid":req.session.id, "enbTestBtn":arr.length});
									});	*/				
								}




							});
						
						});
					
					});
				//	connection.release();
				});
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});

app.post('/gotoSolutionDetails', ensureAuthenticated, function(req, res) {
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;
		var enbTestBtn = post.enbTestBtn;
		console.log("In gotoSolutionDetails enbTestBtn is ---> "+enbTestBtn);
		setTimeout(function() {
		console.log("after a timeout of 10 sec");
		pool.getConnection(function(err, connection) {
			if (err) {
				console.log("Error obtaining connection from pool: "+ err);
				connection.release();
				throw err;
			}
			var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.opportunity_id,solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

			var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
				if (err) {
					console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
					throw err;	
				}
				var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+solId+"'";
				connection.query(screenFieldQry, function(error, scrnFldRes, fields){
					if(error){
						throw error;
					}
					var screenField = {};
					for(var i = 0; i < scrnFldRes.length; i++){
						var rec = scrnFldRes[i];
					console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
					if(rec.IS_USE_CASES_VIEW_HIDDEN){
						if(i===0){
							screenField["isUsecaseHidden"] = 1;
						}
						screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
					}
					else{
						delete screenField.isUsecaseHidden;
					}
					if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
						if(i===0){
							screenField["isPerfTestHidden"] = 1;
						}
						screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
					}
					else{
						delete screenField.isPerfTestHidden;
					}
					if(rec.IS_MODEL_HIDDEN){
						if(i===0){
							screenField["isModelHidden"] = 1;
						}
						screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
					}
					else{
						delete screenField.isModelHidden;
					}
					if(rec.IS_SPRINT_WEEKS_HIDDEN){
						if(i===0){
							screenField["isSprintWeeksHidden"] = 1;
						}
						screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
					}
					else{
						delete screenField.isSprintWeeksHidden;
					}
				}
				console.log("screenField : ");
				console.log(screenField);
				console.log("sweeks:::::"+solDetailsInfo[0].sprint_weeks);
				res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"Selected use cases have been saved successfully.", "sid":req.session.id, "enbTestBtn":parseInt(enbTestBtn), "saveFlg":"Yes", "screenField":screenField});
			});
			});
		});		
			
		}, 20000);

	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});

app.post('/checkSaveStatus', ensureAuthenticated, function(req, res) {
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;
		var testSolId = post.testSolId;
		var solAreaId = post.solAreaId;
		var enbTestBtn = post.enbTestBtn;
		var artifactType = post.artifactType;
		var urlString = "";
		if(artifactType){
			urlString = "http://"+serviceURL+'/download/query?sessionId='+sid+'&solId='+solId+'&solAreaId='+solAreaId+'&artifactType='+artifactType;
		}
		else{
			urlString = "http://"+serviceURL+'/download/query?sessionId='+sid+'&solId='+solId+'&solAreaId='+solAreaId;
		}
		console.log("entered /checkSaveStatus with url" +urlString);
		
		request.get(urlString,{  },function (error, response, body) {
					if (!error && response.statusCode == 200) {	
						console.log("/checkSaveStatus body:: "+body);
						if(body.split(',')[2].split(':')[1].split('"')[1].charCodeAt(0) == 48){
							console.log("/checkSaveStatus testSolId   "+testSolId+"   enbTestBtn" +enbTestBtn);
							if(testSolId=='Y' && parseInt(enbTestBtn) > 0){
								request.get("http://"+serviceURL+'/download/query?solId='+solId+'&nfrType=performance&solAreaId='+solAreaId,{  },
										function (error, response, body) {
											if (!error && response.statusCode == 200) {
												console.log("checkSave result test ---> "+body);
												if(body.split(',')[2].split(':')[1].split('"')[1].charCodeAt(0) == 48){
													res.send("Yes");
												}else{			
													res.send("No");	
												}
											}
								});
							}else{
								console.log("returning YES..........");
								res.send("Yes");
							}
						}else{
							res.send("No");
						}
					}else{						
						console.log("/checkSaveStatus error -> "+error);
						res.send(""+error+"");
					}
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});

app.post('/checkSolutionStatus', ensureAuthenticated, function(req, res) {
	console.log("*** Inside /checkSolutionStatus ******");
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			
			var sqlQuery = "select count(*) as total, SUM(IFNULL(FLEX_FIELD_5,0)) sum from solution_area_details_trx where sol_id="+solId+ " and sol_status= 'COMPLETE'";
			console.log("sqlQuery::>>"+sqlQuery);
			var query = pool.query(sqlQuery, function(err, sqlQueryResult) {
				if( sqlQueryResult!=='undefined' && sqlQueryResult!==null){
					console.log("sqlQueryResult::>>"+JSON.stringify(sqlQueryResult));
					if(sqlQueryResult[0].sum>0){
						var sum = sqlQueryResult[0].sum;
						var total = sqlQueryResult[0].total;
						console.log("sum:: "+sum);
						console.log("total:: "+total);
						console.log("sum/total:: "+sum/total);
						if(sum/total == 1){
							res.send("YES");
						}else{
							res.send("NO");
						}
					}
					else
						{
						 res.send("YES");
						}
				}
				else{
					console.log("sqlQueryResult:: is undefined and null >>");
					res.send("YES");
				}
					
			});
			connection.release();
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});


/*app.post('/setSolAreaIncomplete', function(req, res) {
	setSolAreaAsIncomplete(req,res);
});

app.get('/checkProceedStatus/:industryId/:solId', function(req, res) {
	console.log("*** Inside /checkProceedStatus ******");
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
			
		var solId=req.params.solId;
		var industryId=req.params.industryId;
		console.log("sol ID "+solId+" industryID "+ industryId);

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			
			var sqlQuery = "select count(*) as total, SUM(IFNULL(FLEX_FIELD_5,0)) sum from solution_area_details_trx where sol_id="+solId;
			console.log("sqlQuery::>>"+sqlQuery);
			var query = pool.query(sqlQuery, function(err, sqlQueryResult) {
				if( sqlQueryResult!=='undefined' && sqlQueryResult!==null){
					console.log("sqlQueryResult::>>"+JSON.stringify(sqlQueryResult));
					if(sqlQueryResult[0].sum>0){
						var sum = sqlQueryResult[0].sum;
						var total = sqlQueryResult[0].total;
						console.log("sum:: "+sum);
						console.log("total:: "+total);
						console.log("sum/total:: "+sum/total);
						if(sum/total == 1){
							res.send("YES");
						}else{
							res.send("NO");
						}
					}
					else
						{
						 res.send("YES");
						}
				}
				else{
					console.log("sqlQueryResult:: is undefined and null >>");
					res.send("YES");
				}
					
			});
			connection.release();
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});*/


app.post('/validateLoginInfo', function(req, res) {


	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var sqlLoginQuery = "select emp_emailid,emp_id,emp_fname,emp_lname from users WHERE emp_EmailId='"+req.body.userName.trim()+"' AND password='"+req.body.password.trim()+"';"
		//var sqlLoginQuery = "select emp_emailid,emp_id,emp_fname,emp_lname from users WHERE emp_EmailId='ajay.thakral@in.ibm.com' AND password='test'";
		
		var loginQuery = pool.query(sqlLoginQuery, function(err, loginResult) {
			//Pass the user information in session
			if (err){
				connection.release();
				throw err;
				
			} 		
				
			if(loginResult.length>0){
				//Pass the user details in the session
				sess=req.session;
				sess.user= loginResult[0];

				var created_by = getCreatedBy(req.session.user.emailAddress);
				var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by in ( "+ created_by +" ) group by sl_id order by sl_id DESC;";
			//	console.log("userName----------" +sess.userName + "LoginResult" + loginResult);
				//var sqlQuery = "select solution_basic_details_trx.sol_id, sl_name, customer_name from solution_basic_details_trx , service_line_info  where solution_basic_details_trx.created_by='"+req.session.user.emailAddress +"'and solution_basic_details_trx.sl_id = service_line_info.sl_id"
				var query = pool.query(sqlQuery, function(err, solDashboardResult) {
					if (err) {
						connection.release();
						throw err;	
					}
					console.log(solDashboardResult);
					//res.render('advisorHome', {"solDashboardResult":solDashboardResult,'loginResult': loginResult,'userName':req.body.userName, 'user':req.session.user});
					res.render('OpportunityDashboard', {"solDashboardResult":solDashboardResult,'loginResult': loginResult,'userName':req.body.userName, 'user':req.session.user});
				});
			//	res.render('advisorHome', {'loginResult': loginResult,'userName':req.body.userName});
			}
			else {
				res.render('login', {errorMessage:"User credential are not verified. Please provide correct user name and password."});
			}

		});
		connection.release();
	});
});



app.get('/consentCheck/:userid', ensureAuthenticated, function(req, res) {
	
	var userid=req.params.userid;
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		
		var consentQuery = "SELECT privacy_consent_obtained from  users where Emp_EmailId ='"+ userid +"'";
		
		var query = pool.query(consentQuery , function(err, result) {
			res.send(result);
		});
		connection.release();
	});
});

app.post('/validateLoginBluePages', function(req, res) {

	console.log("Inside validateLoginBluePages::::::" );
	
	console.log("Inside validateLoginBluePages:::::::::-" + config.authHostString );
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var sqlLoginQuery = "select emp_emailid,emp_id,emp_fname,emp_lname from users WHERE emp_EmailId='"+req.body.userName.trim()+"' AND password='"+req.body.password.trim()+"';"
		//var sqlLoginQuery = "select emp_emailid,emp_id,emp_fname,emp_lname from users WHERE emp_EmailId='ajay.thakral@in.ibm.com' AND password='test'";

		var loginQuery = pool.query(sqlLoginQuery, function(err, loginResult) {
			//Pass the user information in session
			if (err){
				connection.release();
				throw err;
				
			} 		
				
			if(loginResult.length>0){
				//Pass the user details in the session
				sess=req.session;
				sess.user = user;
				console.log("loginResult[0]: "+loginResult[0]);
				//req.session.user.attributes = loginResult[0];
				//req.session.user.emailAddress = req.body.userName.trim();
		    	var var1 = {'emailaddress': req.body.userName.trim()};						    	
		    	req.session.user.attributes = var1;
				processLogin(req, res);
			//	res.render('advisorHome', {'loginResult': loginResult,'userName':req.body.userName});
				
				
			}
			else {											
				
				var base64uid = req.body.userName.trim() + ":" + req.body.password.trim();
				var options = {

				  //hostname: 'adikbservices.mybluemix.net',
				  hostname: config.authHostString,
				  method: 'GET',
				  auth: base64uid, 	
				  path: '/kbsso'

				};
				
				var httprequest = https.get(options, function(responseHttp) {
					console.log("HTTP Response code for the authentication -------- "+ responseHttp.statusCode );

					if(responseHttp.statusCode===200) {
						var url = 'http://bluepages.ibm.com/BpHttpApisv3/slaphapi?ibmperson/(mail=' + req.body.userName.trim()+').list,printable/byjson';

						request({
						    url: url,
						    json: true
						}, function (error, response, body) {

						    if (!error && response.statusCode === 200) {
						    	sess=req.session;
						    	sess.user = user;
						    	//console.log(JSON.stringify(req.session.user));						    	
						    	var var1 = {'emailaddress': req.body.userName};						    	
						    	req.session.user.attributes = var1;
						    	console.log("req.session.user.emailAddress-->"+req.session.user.emailAddress);
						    	for (var i = body.search.entry.length - 1; i >= 0; i--) {
						        	for (var j = body.search.entry[i].attribute.length - 1; j >= 0; j--) {

						        		if(body.search.entry[i].attribute[j].name === "givenname") {
						        			req.session.user.attributes["firstName"] = body.search.entry[i].attribute[j].value[0];
						        			console.log("Mail id: "+ req.session.user.emailAddress );
						        			console.log("Given Name: "+ req.session.user.firstName );
						        		}
						        		else if(body.search.entry[i].attribute[j].name === "co") {
						        			req.session.user.country = body.search.entry[i].attribute[j].value[0];
						        			//Populate IOT as per country receeived
						        			for(var code in iotData.mapData) {
												 // console.log("printing key code " +iotData.mapData[code].iot + " stringify " +JSON.stringify(iotData.mapData[code]));

										    					    
										        if(req.session.user.country == iotData.mapData[code].name) {
										          req.session.user.iot = iotData.mapData[code].iot;
										         				          
										          console.log("IOT received is " + req.session.user.iot);
										          break;
										        }

										      
										    }

						    			
										    console.log("IOT received is " + req.session.user.iot);
						        			console.log("Mail id: "+ req.session.user.emp_emailid );
						        			console.log("Country: "+ req.session.user.country );
						        		}
						        	}
						        }
						    	processLogin(req, res);
						    }
						    else {						    	
						    	res.render('login', {errorMessage:"Some problem, please login again."});
						    	
						    }

						});
						
					}	else {				    					    	
							res.render('login', {errorMessage:"User credential are not verified. Please provide correct user name and password."});							
					}
					
				});
				
			}

		});
		connection.release();
	});
});


function getCountryConsentDetails (req, res) {
	
	var getUserQuery = "SELECT MYUSE.Emp_EmailId,MYUSE.privacy_consent_obtained,LC.country_name from  users MYUSE JOIN LEAD_COUNTRY LC ON MYUSE.country_id = LC.country_id where MYUSE.Emp_EmailId = '"+ req.session.user.emailAddress +"'";
	console.log("getUserQuery:::::::::::::::::::::))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))   " + getUserQuery);
	var query = pool.query(getUserQuery , function(err, result) {
		if(typeof result[0] !== 'undefined' && result[0] !== null) {
			
			req.session.user.consent = result[0].privacy_consent_obtained;
			req.session.user.country_name = result[0].country_name;
			console.log("Consent:::::::::::::::::::::))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))   " + req.session.user.consent);
			console.log("Country name :::::::::::::::::::::::::::::::: )))))))))))))))))))))))))))))))))))))))) " + req.session.user.country_name);
		}
		
	});
}


/*function setSolAreaAsIncomplete(req,res){
	
	var qStr = 'update solution_area_details_trx set sol_status="INCOMPLETE" where SOL_ID='+req.body.solId+' and sol_area_id='+ req.body.solAreaId;
	console.log("saveSolAreaIdIncomplete qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		if (err) {
			//connection.release();
			console.log(err);
		}	
	});
}*/

app.get("/processLogin", ensureAuthenticated, function(req, res){
	
	var obj_str = util.inspect(req.session.passport.user._json);
	console.log(obj_str);
	
	console.log(JSON.stringify("req: "+req));
	console.log(" req ::---- "+util.inspect(req));
	if(req.session.passport.user){
		var claims = req.session.passport.user['_json'];
		console.log(JSON.stringify("claims: "+claims));
		console.log(" req ::---- "+util.inspect(claims));
		 user.name=claims.firstName+" "+claims.lastName;
		 user.firstName = claims.firstName;
		 user.lastName = claims.lastName;
		 user.emailAddress	=claims.emailAddress;
		 req.session.user = user;

		 req.session.claims = claims;
		 req.session.userEmail=user.emp_emailid;
		 req.session.originalUrl = req.originalUrl;

	}
	processLogin(req, res);
});

function processLogin(req, res){
	console.log("entered processLogin");
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}

    	sess=req.session;

    	var jsonObj = {};
    	var p = "";
    	var query ;
    	var sysTime = "" ;
    	var emp_id = req.session.user.emailAddress;
		var lead_country = "";//req.session.user.lead_country;
		var privacy =  "";//req.session.user.privacy;
		console.log("processLogin : privacy"+privacy);
		var restricted_country_consent= "";//req.session.user.restricted_country_consent;
		console.log("processLogin : restricted_country_consent"+restricted_country_consent);
		var uid = req.session.user.uid;
		var fname = req.session.user.firstName;
		var lname = req.session.user.lastName;
		var country_name = "";
		var consent = "";
    	
    		var consentQuery = "SELECT count(1) as count from  users where Emp_EmailId ='" + emp_id +"'";
    		var query = pool.query(consentQuery , function(err, checkResult) {
    			if (err) {
    				connection.release();
    				throw err;
    			}
    			//next pool query
    			if(typeof checkResult[0] !== 'undefined' && checkResult[0] !== null) {
    				
    				if(typeof privacy !== 'undefined' && privacy) {
		    				if( checkResult[0].count > 0 ) {
		    					//Update User for the very first time,  Write update if exist check
		    			    	var userUpdateQuery = "update users set modified_date = CURRENT_TIMESTAMP, privacy_consent_obtained = '" + privacy + "', country_id = " + lead_country + ", privacy_obtained_datetime = CURRENT_TIMESTAMP ";
		    			    	
		    			    	if(restricted_country_consent=='Y')
		    			    		userUpdateQuery+= ", restricted_country_consent_obtained = '" + restricted_country_consent+ "', restricted_country_consent_obtained_datetime = CURRENT_TIMESTAMP ";
		    			    	
		    			    	userUpdateQuery+= "where Emp_EmailId = '"+ emp_id +"'";
		    			    	
		    			    	console.log("processLogin : userUpdateQuery> "+userUpdateQuery);
		    					var queryUpdate = pool.query(userUpdateQuery, function(err, userResult) { 
		    						if (err) {
		    							connection.release();
		    							throw err;
		    						}
		    						getCountryConsentDetails(req,res);
		    					});		
		    					
		    					
		    				} else {
		    					//Insert User for the very first time,  Write update if exist check
		    			    	var userInsertQuery = "INSERT INTO users (Emp_EmailId,Emp_id,Emp_FName, Emp_LName, creation_date,modified_date,privacy_consent_obtained,country_id,privacy_obtained_datetime,restricted_country_consent_obtained, restricted_country_consent_obtained_datetime) VALUES ('" + emp_id +"','" + uid + "','" + fname + "','" + lname + "', CURRENT_TIMESTAMP , CURRENT_TIMESTAMP ,'"+privacy+"',"+lead_country+", CURRENT_TIMESTAMP,'"+restricted_country_consent+"',CURRENT_TIMESTAMP)";
		    					var queryInsert = pool.query(userInsertQuery, function(err, userResult) { 
		    						if (err) {
		    							connection.release();
		    							throw err;
		    						}
		    						
		    						getCountryConsentDetails(req,res);
		    					});		
		    					
		    				}
    				
    				} else {
    					getCountryConsentDetails(req,res);	
    				}
    				
    			} else {
    				getCountryConsentDetails(req,res);
    			}
    			
    			
    			
    		});
    	
    	
    	console.log("metrics: Last login, Oppys created in current month, Oppys created in this year, " +
    				"Total time spent on the tool in current month, Total time spent in current year ");
		
    	var sqlQueryLastLogin = "select DATE_FORMAT(session_date ,'%d-%b-%Y %T') Tim from session_master where user_email = '"+req.session.user.emailAddress+"' Order by session_date desc  LIMIT 1";
    	
    	console.log("User LAST Log in ##### : "+sqlQueryLastLogin);
    	
    	query = pool.query(sqlQueryLastLogin, function(err, sqlQueryLastLoginResult) {
			
			if (err) {
				
				//console.log(err);
				console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
				// throw err;
			}
			
			console.log("LENGTH $$$$$$$$ ::::  "+sqlQueryLastLoginResult);
			
		if(typeof sqlQueryLastLoginResult !== 'undefined' && sqlQueryLastLoginResult.length != 0){	
			 if(typeof sqlQueryLastLoginResult[0] !== 'undefined' && sqlQueryLastLoginResult[0] !== null) {
				 p = JSON.stringify(sqlQueryLastLoginResult[0].Tim).replace(/['"]+/g, '') ;
					
					jsonObj["sqlQueryLastLoginResult"] = p ;
			 }
			
			
			var sqlQueryOppCreateCurrMonth = "select   count( DISTINCT SOL_BASIC.SOL_ID) C from solution_basic_details_trx  " +
			"SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
			" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  " +
			"YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) AND MONTH(SOL_BASIC.creation_date) = MONTH(NOW())" ; 
	
			console.log("Number of Opportunities  created by the User for this month  ##### : "+sqlQueryOppCreateCurrMonth);
	
		query = pool.query(sqlQueryOppCreateCurrMonth, function(err, sqlQueryOppCreateCurrMonthResult) {
		
			if (err) {
				console.log(err);
			}
		
			 if(typeof sqlQueryOppCreateCurrMonthResult[0] !== 'undefined' && sqlQueryOppCreateCurrMonthResult[0] !== null) {
				 p = JSON.stringify(sqlQueryOppCreateCurrMonthResult[0].C);
					
					jsonObj["sqlQueryOppCreateCurrMonthResult"] = p;
			 }
			
			
			var sqlQueryOppCreateCurrYear = "select   count( DISTINCT SOL_BASIC.SOL_ID) C  from solution_basic_details_trx  " +
			"				SOL_BASIC INNER JOIN  solution_area_details_trx SOL_TRANS ON SOL_BASIC.SOL_ID =  SOL_TRANS.SOL_ID where " +
			" SOL_BASIC.created_by = '"+req.session.user.emailAddress+"' and  YEAR(SOL_BASIC.creation_date) = YEAR(NOW()) " ;
	
			console.log("Number of Opportunities  created by the User for this Year  ##### : "+sqlQueryOppCreateCurrYear);
	
			 query = pool.query(sqlQueryOppCreateCurrYear, function(err, sqlQueryOppCreateCurrYearResult) {
		
				if (err) {
					console.log(err);
				}
				 if(typeof sqlQueryOppCreateCurrYearResult[0] !== 'undefined' && sqlQueryOppCreateCurrYearResult[0] !== null) {
						p = JSON.stringify(sqlQueryOppCreateCurrYearResult[0].C) ;
						
				 		jsonObj["sqlQueryOppCreateCurrYearResult"] = p;
				 }
		

		 		
		 		var sqlQueryTimeSptCurrentMonth ="select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from " +
				"( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
				"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())" +
				"  AND MONTH(s_l.`event_time`) = MONTH(NOW())  group by s_l.`session_id`) A";   	
    	
		 		console.log("Total time spent on the tool in current month  ##### : "+sqlQueryTimeSptCurrentMonth);
		
			  query = pool.query(sqlQueryTimeSptCurrentMonth, function(err, sqlQueryTimeSptCurrentMonthResult) {
			
				 if (err) {
					// console.log(err);
					 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
				 }
			
				 if(typeof sqlQueryTimeSptCurrentMonthResult[0] !== 'undefined' && sqlQueryTimeSptCurrentMonthResult[0] !== null) {
					  p = JSON.stringify(sqlQueryTimeSptCurrentMonthResult[0].T).replace(/['"]+/g, '');
					 jsonObj["sqlQueryTimeSptCurrentMonthResult"] = p ;
				 }
			
			
				 	
				 	var sqlQueryTimeSptCurrentYear = "select HOUR(SEC_TO_TIME(SUM(time_to_sec(TIMESPENT)))) T from" +
					" ( select   TIMEDIFF(MAX(s_l.`event_time`) , MIN(s_l.`event_time`)) TIMESPENT from session_master s_m , session_log s_l  " +
					"where s_m.`session_id`= s_l.`session_id` and s_m.`user_email`='"+req.session.user.emailAddress+"'   and   YEAR(s_l.`event_time`) = YEAR(NOW())  " +
					"  group by s_l.`session_id`) A";
			
				 	console.log("Total time spent on the tool in current Year  ##### : "+sqlQueryTimeSptCurrentYear);
			
				 	 query = pool.query(sqlQueryTimeSptCurrentYear, function(err, sqlQueryTimeSptCurrentYearResult) {
				
				 		if (err) {
				 			//console.log(err);
				 			console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
				 		}
				
				
				 		 if(typeof sqlQueryTimeSptCurrentYearResult[0] !== 'undefined' && sqlQueryTimeSptCurrentYearResult[0] !== null) {
				 			 p = JSON.stringify(sqlQueryTimeSptCurrentYearResult[0].T).replace(/['"]+/g, '') ;
								
						 	jsonObj["sqlQueryTimeSptCurrentYearResult"] = p ;
				 		 }
				 	
				 		
				var sqlQueryTimeSaveCurrMonth = "SELECT COALESCE((select sum(user_perception)  from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
						" YEAR(session_date) = YEAR(NOW()) AND MONTH(session_date) = MONTH(NOW()) group by user_email),0) A";

				console.log("Total time saved in current Month  ##### : processLogin "+sqlQueryTimeSaveCurrMonth);
	
				 query = pool.query(sqlQueryTimeSaveCurrMonth, function(err, sqlQueryTimeSaveCurrMonthResult) {
		
					 if (err) {
						// console.log(err);
						 console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
					 }
		
					 if(typeof sqlQueryTimeSaveCurrMonthResult[0] !== 'undefined' && sqlQueryTimeSaveCurrMonthResult[0] !== null) {
							
						 p = JSON.stringify(sqlQueryTimeSaveCurrMonthResult[0].A) ;

						 jsonObj["sqlQueryTimeSaveCurrMonthResult"] = p ;
		
						} 
					 
					 
					 var sqlQueryTimeSaveCurrYear = "select sum(user_perception) A from session_master where user_email = '"+req.session.user.emailAddress +"' and " +
						" YEAR(session_date) = YEAR(NOW()) group by user_email";

						console.log("Total time saved in current Year  ##### : "+sqlQueryTimeSaveCurrYear);

						 query = pool.query(sqlQueryTimeSaveCurrYear, function(err, sqlQueryTimeSaveCurrYearResult) {

							if (err) {
								//console.log(err);
								console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
							}
							
							
							if(typeof sqlQueryTimeSaveCurrYearResult[0] !== 'undefined' && sqlQueryTimeSaveCurrYearResult[0] !== null) {
								
								p = JSON.stringify(sqlQueryTimeSaveCurrYearResult[0].A) ;
								
								jsonObj["sqlQueryTimeSaveCurrYearResult"] = p ;
			
							} 
								
								var sessionQuery = "insert into session_master (session_id, user_email,country,iot) values ('"+req.session.id +"','" + req.session.user.emailAddress +"','" + req.session.user.country +"','" + req.session.user.iot +"')";
								console.log(sessionQuery);
								var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
									if (err) {
										//connection.release();
										//console.log(err);
										console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
									}
									console.log("Just after session logging: " +sessionResult );

									sessionQuery = "insert into session_log (session_id, event_type) values ('"+req.session.id +"',"+ event.Login+")";
									queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											console.log(err);
										}
										console.log("Just after session logging: " +sessionResult );
												
									});													
								});										

								var created_by = getCreatedBy(req.session.user.emailAddress);
								var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by in ( "+ created_by +" ) group by sl_id order by sl_id desc;";
								//var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emailAddress +"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";
								console.log("sqlQuery solDashboardResult in /processLogin 1 ##### "+sqlQuery);
								var query = pool.query(sqlQuery, function(err, solDashboardResult) {
										if (err) {
											connection.release();
											throw err;	
										}
										//console.log(solDashboardResult);

										var sid = req.session.id;
										var timeOut = timeOutSidMap.get(sid);
										
										if(timeOut) { 
											clearTimeout(timeOut);
										}
										timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
										timeOutSidMap.set(sid, timeOut);
														
											var sqlQuery;



											var created_by = getCreatedBy(req.session.user.emailAddress);
											var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";
											console.log("solDashboardResult in / processLogin 2  ####### "+sqlQuery);
										var query = pool.query(sqlQuery, function(err, solDashboardResult) {
											if (err) throw err;	
											//console.log("+++++++++++solDashboardResult----" +JSON.stringify(solDashboardResult));
											//console.log("printing each element");
											var opportunityList = [];
											var solAreaList = [];
											var opportunity = {};
											var solArea = {};
											

											for (var i = 0; i < solDashboardResult.length; i++) {

												solAreaList = [];
											
												opportunity = {sol_id: solDashboardResult[i].sol_id, 
															   opportunity_name: solDashboardResult[i].opportunity_name,
															   customer_name:solDashboardResult[i].customer_name,
															   industry_name : solDashboardResult[i].indus_name,
															   total_efforts : solDashboardResult[i].totalEfforts,
															   sol_status : solDashboardResult[i].sol_status,
															   creation_date : solDashboardResult[i].creation_date,
															   last_edit_date : solDashboardResult[i].last_edit_date
															   };
												solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
															sol_area_id: solDashboardResult[i].sol_area_id,
															creation_date: solDashboardResult[i].creation_date};
												solAreaList.push(solArea);				
												while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
													i++;
													solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
															sol_area_id: solDashboardResult[i].sol_area_id,
															creation_date: solDashboardResult[i].creation_date};
												//	console.log("Sol  ID1" + solDashboardResult[i].sol_id)		
													//console.log("Sol  ID2" + solDashboardResult[i+1].sol_id)		
													solAreaList.push(solArea);	
													
												}

												opportunity.solAreaList = solAreaList;
												opportunityList.push(opportunity);

											}
											//getDashboardList(opportunityList, req.body.userName.trim() );
											
											//for tab2 data 
											var sqlShareByMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
											"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.created_by in ("+ created_by +") and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.OWNER_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
											console.log("solDashboardResult sqlShareByMe: "+sqlShareByMe);
											var optyShareByMeList = [];
											var query = pool.query(sqlShareByMe, function(err, solDashboardResult) {
												if (err) throw err;	
												var solAreaList = [];
												var opportunity = {};
												var solArea = {};
												for (var i = 0; i < solDashboardResult.length; i++) {
													solAreaList = [];
													opportunity = {sol_id: solDashboardResult[i].sol_id, 
															   opportunity_name: solDashboardResult[i].opportunity_name,
															   customer_name:solDashboardResult[i].customer_name,
															   industry_name : solDashboardResult[i].indus_name,
															   total_efforts : solDashboardResult[i].totalEfforts,
															   sol_status : solDashboardResult[i].sol_status,
															   creation_date : solDashboardResult[i].creation_date,
															   last_edit_date : solDashboardResult[i].last_edit_date
															   };
													solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
																sol_area_id: solDashboardResult[i].sol_area_id,
																creation_date: solDashboardResult[i].creation_date};
													solAreaList.push(solArea);				
													while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
														i++;
														solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
																	sol_area_id: solDashboardResult[i].sol_area_id,
																	creation_date: solDashboardResult[i].creation_date};
														
														solAreaList.push(solArea);	
													
													}
												opportunity.solAreaList = solAreaList;
												optyShareByMeList.push(opportunity);
												}
												//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareByMeList));
												//end of tab2 data 
												
												//for tab3 data 
												var sqlShareWithMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
												"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.SHARED_WITH_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
												console.log("solDashboardResult optyShareWithMe: "+sqlShareWithMe);
												var optyShareWithMeList = [];
												var query = pool.query(sqlShareWithMe, function(err, solDashboardResult) {
													if (err) throw err;	
													var solAreaList = [];
													var opportunity = {};
													var solArea = {};
													for (var i = 0; i < solDashboardResult.length; i++) {
														solAreaList = [];
														opportunity = {sol_id: solDashboardResult[i].sol_id, 
																   opportunity_name: solDashboardResult[i].opportunity_name,
																   customer_name:solDashboardResult[i].customer_name,
																   industry_name : solDashboardResult[i].indus_name,
																   total_efforts : solDashboardResult[i].totalEfforts,
																   sol_status : solDashboardResult[i].sol_status,
																   creation_date : solDashboardResult[i].creation_date,
																   last_edit_date : solDashboardResult[i].last_edit_date
																   };
														solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
																sol_area_id: solDashboardResult[i].sol_area_id,
																creation_date: solDashboardResult[i].creation_date};
														solAreaList.push(solArea);				
														while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
															i++;
															solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
															sol_area_id: solDashboardResult[i].sol_area_id,
															creation_date: solDashboardResult[i].creation_date};
															solAreaList.push(solArea);	
														
														}
														opportunity.solAreaList = solAreaList;
														optyShareWithMeList.push(opportunity);
													}
											//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareWithMeList));
											//end of tab3 data 
													
											console.log("req.session.user:::::::::::"+JSON.stringify(req.session.user));
											console.log("@@@@@ JSON OBJECT final ::: "+ JSON.stringify(jsonObj));
											res.render('dashboard', {'user' : req.session.user, 'solDashboardResult':opportunityList ,'optyShareByMeList':optyShareByMeList,'optyShareWithMeList':optyShareWithMeList,'jsonObj':jsonObj});
												});//end tab3
											});//end tab2
									});//end tab1
								});
								
					});
		
				 });
	
				 	 });
		
			 	});
		 		
			});
		});
		
		}else{
			
			var sessionQuery = "insert into session_master (session_id, user_email,country,iot) values ('"+req.session.id +"','" + req.session.user.emailAddress +"','" + req.session.user.country +"','" + req.session.user.iot +"')";
			console.log(sessionQuery);
			var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
				if (err) {
					//connection.release();
					//throw err;
					//console.log(err);
					console.log("Error: ER_NO_SUCH_TABLE: Table 'session_master' doesn't exist");
					//throw err;
				}
				console.log("Just after session logging: " +sessionResult );

				sessionQuery = "insert into session_log (session_id) values ('"+req.session.id +"')";
				queryEx = pool.query(sessionQuery, function(err, sessionResult) {
					if (err) {
						//connection.release();
						console.log(err);
						//throw err;
					}
					console.log("Just after session logging: " +sessionResult );
							
				});													
			});										

			var created_by = getCreatedBy(req.session.user.emailAddress);
			var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by in ( "+ created_by +" ) group by sl_id order by sl_id desc;";
			//var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emailAddress +"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";
			console.log("solDashboardResult sqlQuery in processLogin 3 ####"+sqlQuery);
			var query = pool.query(sqlQuery, function(err, solDashboardResult) {
					if (err) {
						connection.release();
						throw err;	
					}
					//console.log(solDashboardResult);

					var sid = req.session.id;
					var timeOut = timeOutSidMap.get(sid);
					
					if(timeOut) { 
						clearTimeout(timeOut);
					}
					timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
					timeOutSidMap.set(sid, timeOut);
									
						var sqlQuery;
						var created_by = getCreatedBy(req.session.user.emailAddress);
						//var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";
						var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by in ( "+ created_by +" ) and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";
						console.log("solDashboardResult in processLogin 4 ####sqlQuery: "+sqlQuery);
						
						//code for tab1
						var query = pool.query(sqlQuery, function(err, solDashboardResult) {
							if (err) throw err;	
							//console.log("+++++++++++solDashboardResult----" +JSON.stringify(solDashboardResult));
							var opportunityList = [];
							var solAreaList = [];
							var opportunity = {};
							var solArea = {};
							for (var i = 0; i < solDashboardResult.length; i++) {
								solAreaList = [];
								opportunity = {sol_id: solDashboardResult[i].sol_id, 
										   opportunity_name: solDashboardResult[i].opportunity_name,
										   customer_name:solDashboardResult[i].customer_name,
										   industry_name : solDashboardResult[i].indus_name,
										   total_efforts : solDashboardResult[i].totalEfforts,
										   sol_status : solDashboardResult[i].sol_status,
										   creation_date : solDashboardResult[i].creation_date,
										   last_edit_date : solDashboardResult[i].last_edit_date
										   };
								solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
										sol_area_id: solDashboardResult[i].sol_area_id,
										creation_date: solDashboardResult[i].creation_date};
								solAreaList.push(solArea);				
								while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
									i++;
									solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
												sol_area_id: solDashboardResult[i].sol_area_id,
												creation_date: solDashboardResult[i].creation_date};
									solAreaList.push(solArea);	
							}
							opportunity.solAreaList = solAreaList;
							opportunityList.push(opportunity);

						}
						
						//getDashboardList(opportunityList, req.body.userName.trim() );
						//console.log("req.session.user:::::::::::"+JSON.stringify(req.session.user));
						//console.log("@@@@@ JSON OBJECT final 4::: "+ JSON.stringify(jsonObj));
						console.log(" req.session.prevUrl  4 --- "+req.session.requestedURL);
						//end for tab1

						//for tab2 data 
						var sqlShareByMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
						"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.created_by in ("+ created_by +") and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.OWNER_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
						console.log("solDashboardResult sqlShareByMe: "+sqlShareByMe);
						var optyShareByMeList = [];
						var query = pool.query(sqlShareByMe, function(err, solDashboardResult) {
							if (err) throw err;	
							var solAreaList = [];
							var opportunity = {};
							var solArea = {};
							for (var i = 0; i < solDashboardResult.length; i++) {
								solAreaList = [];
								opportunity = {sol_id: solDashboardResult[i].sol_id, 
										   opportunity_name: solDashboardResult[i].opportunity_name,
										   customer_name:solDashboardResult[i].customer_name,
										   industry_name : solDashboardResult[i].indus_name,
										   total_efforts : solDashboardResult[i].totalEfforts,
										   sol_status : solDashboardResult[i].sol_status,
										   creation_date : solDashboardResult[i].creation_date,
										   last_edit_date : solDashboardResult[i].last_edit_date
										   };
								solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
											sol_area_id: solDashboardResult[i].sol_area_id,
											creation_date: solDashboardResult[i].creation_date};
								solAreaList.push(solArea);				
								while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
									i++;
									solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
												sol_area_id: solDashboardResult[i].sol_area_id,
												creation_date: solDashboardResult[i].creation_date};
									
									solAreaList.push(solArea);	
								
								}
							opportunity.solAreaList = solAreaList;
							optyShareByMeList.push(opportunity);
							}
							//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareByMeList));
							//end of tab2 data 
							
							//for tab3 data 
							var sqlShareWithMe = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status , null as last_edit_date " +
							"FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area ,SHARED_OPTY_INFO shared_opty WHERE sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 and shared_opty.SHARED_WITH_ID="+created_by +"and sol_details.sol_id=shared_opty.sol_id order by sol_details.sol_id desc";
							console.log("solDashboardResult optyShareWithMe: "+sqlShareWithMe);
							var optyShareWithMeList = [];
							var query = pool.query(sqlShareWithMe, function(err, solDashboardResult) {
								if (err) throw err;	
								var solAreaList = [];
								var opportunity = {};
								var solArea = {};
								for (var i = 0; i < solDashboardResult.length; i++) {
									solAreaList = [];
									opportunity = {sol_id: solDashboardResult[i].sol_id, 
											   opportunity_name: solDashboardResult[i].opportunity_name,
											   customer_name:solDashboardResult[i].customer_name,
											   industry_name : solDashboardResult[i].indus_name,
											   total_efforts : solDashboardResult[i].totalEfforts,
											   sol_status : solDashboardResult[i].sol_status,
											   creation_date : solDashboardResult[i].creation_date,
											   last_edit_date : solDashboardResult[i].last_edit_date
											   };
									solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
											sol_area_id: solDashboardResult[i].sol_area_id,
											creation_date: solDashboardResult[i].creation_date};
									solAreaList.push(solArea);				
									while (i < solDashboardResult.length -1 && solDashboardResult[i].sol_id === solDashboardResult[i+1].sol_id ) {
										i++;
										solArea = { sol_area_name : solDashboardResult[i].sol_area_name,
										sol_area_id: solDashboardResult[i].sol_area_id,
										creation_date: solDashboardResult[i].creation_date};
										solAreaList.push(solArea);	
									
									}
									opportunity.solAreaList = solAreaList;
									optyShareWithMeList.push(opportunity);
								}
								//console.log("+++++++++++solDashboardResult inside shareByMeOpt----" +JSON.stringify(optyShareWithMeList));
								//end of tab3 data 
										
						if(req.session.requestedURL) 
							res.redirect(307,req.session.requestedURL);
						else if(configAms.displayAms===true){
							sqlQuery = "SELECT ams.sol_id,DATE_FORMAT(sol_basic.creation_date, '%d-%m-%Y') creation_date,sol_basic.Created_by,sol_basic.opportunity_id,sol_basic.Customer_Name,ams_country.country_id AS country_id,ams_country.country_name,indus.indus_id,indus.indus_name,ams.TICKET_VOLUME,ams.CLIENT_MNGD_TKTS,sec.sector_id,sec.sector_name,ams.AMS_LOCATION,ams.AMS_YRS,ams.MINOR_ENHANCEMENT_HRS,ams.L1_5_TKTS,ams.L2_TKTS,ams.L3_TKTS FROM " +
							"AMS_DETAILS ams,solution_basic_details_trx sol_basic,LEAD_COUNTRY ams_country,industry_info indus,SECTORS sec WHERE ams.sol_id = sol_basic.sol_id AND ams_country.country_id = sol_basic.country_id AND indus.indus_id = sol_basic.indus_id AND sec.sector_id = ams.SECTOR_ID order by sol_basic.creation_date DESC";
							var query = pool.query(sqlQuery, function(err, amsDashboardResult) {
								if (err) throw err;	
								res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList,'jsonObj':jsonObj,'displayAms':configAms.displayAms,'amsDashboardResult':amsDashboardResult});
									});	
							}
						else
							res.render('dashboard', {'user' : req.session.user, 'solDashboardResult':opportunityList ,'optyShareByMeList':optyShareByMeList,'optyShareWithMeList':optyShareWithMeList,'jsonObj':jsonObj,'displayAms':configAms.displayAms});
						});//tab3 end
					});//tab 2end 
					
				});//solDas
			});
			
		}
			
	});
    connection.release();
		
	});
}
app.get('/copySolution', ensureAuthenticated, function(req, res) {
	console.log('Enter /copySolution api.....');
        
	if(req.session.user) {
		console.log('Request Query : ');
		console.log(req.query);
		
		const matchingSolId = req.query.solutionId_copy;		
		console.log("Matching Sol Id : ", matchingSolId);
		
		pool.getConnection(function(err, connection) {
			if (err) {
				console.log("Error obtaining connection from pool: " + err);
				//connection.release();
				throw err;
			}
			
			//const invokeStoreProc = 'CALL `CopySolution`(' + matchingSolId + ',"'+req.query.opportunityId+'","'+req.query.clientName+'",'+req.query.imt_id+','+req.query.iot_id+','+req.query.risk_rating+',"'+req.query.opportunity_owner_email+'",'+req.query.smr_number+',"' + req.session.user.emailAddress + '")';
			//const invokeStoreProc = 'CALL `CopySolution`(' + matchingSolId + ',"'+req.query.opportunityId+'","'+req.query.clientName+'",0,0,0,"'+req.query.opportunity_owner_email+'",0,"' + req.session.user.emailAddress + '")';
			const invokeStoreProc = 'CALL `CopySolution`(' + matchingSolId + ',"'+req.query.opportunityId+'","'+req.query.clientName+'",'+req.query.imt_id+','+req.query.IOTInfo+',0,"'+req.query.opportunity_owner_email+'",0,"' + req.session.user.emailAddress + '")';

			console.log('invokeStoreProc : ', invokeStoreProc);
			
			connection.query(invokeStoreProc, function(error, solDetailsInfo, fields){
				if (error) {
					console.log("error while executing store procedure " + error); 
					throw err;	
				}
				
				console.log("Success and passing the control to submitSolutionDetails Page." + JSON.stringify(solDetailsInfo)); 
				console.log("New Solution Id ::" + solDetailsInfo[1][0].sol_id); 
				console.log("New Solution Area Id ::" + solDetailsInfo[1][0].sol_area_id); 
				var newSolId = solDetailsInfo[0][0].new_sol_id;
				
				const sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Copy_Solution  +","+newSolId+", 0, 0, 'Success')";
				console.log('sessionQuery : ', sessionQuery);
				
				connection.query(sessionQuery, function(err, sessionResult, fields) {
					if (err) {						
						console.log("error while inserting session value into session_log table " + err); 
					}
				});

				const solAreaQry = 'SELECT Sol_area_id FROM solution_area_details_trx WHERE SOL_ID = ' + newSolId;
				console.log('Sol area query : ', solAreaQry);
				
				connection.query(solAreaQry, function(err, solAreaResult, fields) {					
					if (err) {						
						console.log("error while fetching solution area info " + err);
					}
					else{
						for(i = 0; i < solAreaResult.length; i++){
							request.post("http://"+serviceURL+"/estimate/request?sessionId='" +req.session.id +"'&solId="+newSolId+"&solAreaId="+solAreaResult[i].Sol_area_id,{  },
								function (error, response, body) {
									if (!error && response.statusCode == 200) {
										console.log('estimate REST invoked : ',body);
									}
									else{
										console.log('error happened in estimare REST called : ',error);
									}
								});
						}
						
						const solBasicQry = 'SELECT is_perf_test_in_scope FROM solution_basic_details_trx WHERE SOL_ID = ' + matchingSolId;
						console.log('performance test query : ', solBasicQry);
						
						connection.query(solBasicQry, function(err, solBasicResult, fields) {
							connection.release();
							if (err) {						
								console.log("error while fetching performance test info " + err);
							}
							else if(solBasicResult[0].is_perf_test_in_scope === 1){
						
								request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+newSolId+'&solAreaId=0&nfrType=performance',{  },
									function (error, response, body) {
										if (!error && response.statusCode == 200) {
											console.log('performance estimate REST invoked : ',body);
										}
										else{
											console.log('error happened in performance estimare REST called : ',error);
										}
									});
							}
							else{
								console.log('No performance test invoked');
							}
						});
					}

				});	

				//res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo[1],"serviceURL":serviceURL, "sid":req.session.id});
				res.send("{\"solId\":" + newSolId + "}");
			});
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});



app.get('/getIndustryInfo', ensureAuthenticated, function(req, res) {
	var id=req.params.id;

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			var query = pool.query("select indus_id,indus_name,indus_description from industry_info where DISPLAYFLAG = 'Y' order by indus_name", function(err, result) {
				console.log("+++++++++++result----" +JSON.stringify(result));
				res.send(result);
			});
		connection.release();
		});
});

app.get('/getAllLogicalComponent', ensureAuthenticated, function (req, res) {

	pool.getConnection(function (err, connection) {
		if (err) {
			console
				.log("Error obtaining connection from pool: "
				+ err);
			connection.release();
			throw err;
		}


		var sqlQueryCrossindus = "SELECT SolArea.Sol_area_id sol_area_id, SolArea.Sol_area_Name sol_area_name, Indus.Indus_id, Indus.Indus_Name, LOGMAST.LOGICAL_COMP_ID, LOGMAST.LOGICAL_COMP_NAME, LOGMAST.SORT_ORDER FROM industry_use_cases_master IndusUC JOIN solution_area_info SolArea  ON  IndusUC.Sol_area_id  = SolArea.Sol_area_id JOIN industry_info Indus ON  IndusUC.indus_id = Indus.Indus_id JOIN LOGICAL_COMP_MASTER LOGMAST ON SolArea.LOGICAL_COMP_ID  = LOGMAST.LOGICAL_COMP_ID where IndusUC.indus_id = 101 group by SolArea.Sol_area_id, SolArea.Sol_area_Name, Indus.Indus_id, Indus.Indus_Name, LOGMAST.LOGICAL_COMP_ID, LOGMAST.LOGICAL_COMP_NAME order by Indus.Indus_Name, LOGMAST.LOGICAL_COMP_ID";

		var logicalCompCrossIndusList = [];

		var query = pool.query(sqlQueryCrossindus, function (err, result) {
			if (err) {

				console.log(" Error Inside getAllLogicalComponent() cross Indus @@@ " + err);
				throw err;
			}

			console.log("Inside getAllLogicalComponent After Query cross Indus @@@@ 2" + JSON.stringify(result));

			var industryList = [];
			var industryId = -1;
			for (var i = 0; i < result.length; i++) {
				var industryDetails = {};
				if (industryId !== result[i].Indus_id) {
					industryId = result[i].Indus_id;
					industryDetails['Indus_id'] = result[i].Indus_id;
					industryDetails['Indus_Name'] = result[i].Indus_Name;

					var logicalCompList = [];
					var logicalCompId = -1;

					for (var j = i; j < result.length; j++) {
						var logicalCompListObj = {};
						if (industryId === result[j].Indus_id && logicalCompId !== result[j].LOGICAL_COMP_ID) {
							logicalCompId = result[j].LOGICAL_COMP_ID;
							logicalCompListObj['LOGICAL_COMP_ID'] = result[j].LOGICAL_COMP_ID;
							logicalCompListObj['LOGICAL_COMP_NAME'] = result[j].LOGICAL_COMP_NAME;
							logicalCompListObj['SORT_ORDER'] = result[j].SORT_ORDER;
							logicalCompList.push(logicalCompListObj);

							var solutionAreaList = [];

							for (k = j; k < result.length; k++) {
								var solutionAreaListObj = {};
								if (industryId === result[k].Indus_id && logicalCompId === result[k].LOGICAL_COMP_ID) {

									solutionAreaListObj['sol_area_id'] = result[k].sol_area_id;
									solutionAreaListObj['sol_area_name'] = result[k].sol_area_name;
									solutionAreaList.push(solutionAreaListObj);
									logicalCompListObj['solutionAreaList'] = solutionAreaList;
								}
								else {
									break;
								}
							}
						}
					}
					industryDetails['logicalCompList'] = logicalCompList;
					industryList.push(industryDetails);
				}
			}
			finalObject = { 'industryList': industryList };

			console.log("Final cross Indus JSON @@@@ ----> " + JSON.stringify(finalObject));

			logicalCompCrossIndusList = finalObject.industryList[0].logicalCompList;


		});



		var sqlQuery = "SELECT SolArea.Sol_area_id sol_area_id, SolArea.Sol_area_Name sol_area_name, Indus.Indus_id, Indus.Indus_Name, LOGMAST.LOGICAL_COMP_ID, LOGMAST.LOGICAL_COMP_NAME, LOGMAST.SORT_ORDER FROM industry_use_cases_master IndusUC RIGHT JOIN industry_info Indus ON  Indus.Indus_id = IndusUC.indus_id LEFT JOIN solution_area_info SolArea  ON  IndusUC.Sol_area_id  = SolArea.Sol_area_id LEFT JOIN LOGICAL_COMP_MASTER LOGMAST ON SolArea.LOGICAL_COMP_ID  = LOGMAST.LOGICAL_COMP_ID where Indus.DISPLAYFLAG = 'Y' group by Indus.Indus_id, Indus.Indus_Name, LOGMAST.LOGICAL_COMP_ID, LOGMAST.LOGICAL_COMP_NAME, SolArea.Sol_area_id, SolArea.Sol_area_Name order by Indus.Indus_Name , LOGMAST.LOGICAL_COMP_ID";

		var query = pool.query(sqlQuery, function (err, result) {
			if (err) {

				console.log(" Error Inside getAllLogicalComponent() @@@ " + err);
				throw err;
			}

			//console.log("Inside getAllLogicalComponent After Query @@@@ " + JSON.stringify(result));

			var industryList = [];
			var industryId = -1;
			for (var i = 0; i < result.length; i++) {
				var industryDetails = {};
				if (industryId !== result[i].Indus_id) {
					industryId = result[i].Indus_id;
					industryDetails['Indus_id'] = result[i].Indus_id;
					industryDetails['Indus_Name'] = result[i].Indus_Name;

					var logicalCompList = [];
					var logicalCompId = -1;

					for (var j = i; j < result.length; j++) {
						var logicalCompListObj = {};
						if (industryId === result[j].Indus_id && logicalCompId !== result[j].LOGICAL_COMP_ID && result[j].LOGICAL_COMP_ID !== null) {
							logicalCompId = result[j].LOGICAL_COMP_ID;
							logicalCompListObj['LOGICAL_COMP_ID'] = result[j].LOGICAL_COMP_ID;
							logicalCompListObj['LOGICAL_COMP_NAME'] = result[j].LOGICAL_COMP_NAME;
							logicalCompListObj['SORT_ORDER'] = result[j].SORT_ORDER;
							logicalCompList.push(logicalCompListObj);

							var solutionAreaList = [];

							for (k = j; k < result.length; k++) {
								var solutionAreaListObj = {};
								if (industryId === result[k].Indus_id && logicalCompId === result[k].LOGICAL_COMP_ID && result[k].sol_area_id !== null) {

									solutionAreaListObj['sol_area_id'] = result[k].sol_area_id;
									solutionAreaListObj['sol_area_name'] = result[k].sol_area_name;
									solutionAreaList.push(solutionAreaListObj);
									logicalCompListObj['solutionAreaList'] = solutionAreaList;
								}
								else {
									break;
								}
							}
						}
					}

					//merging Cross Industry specific Logical Component list with rest of the Industry specific Logical component list 
					var temp = logicalCompList.concat(logicalCompCrossIndusList);  
					//Ensuring unique Logical components within Industry
					var uniqeList = arrayUnique(temp);
					industryDetails['logicalCompList'] = uniqeList;
					industryList.push(industryDetails);
				}
			}
			finalObject = { 'industryList': industryList };

			console.log("Final JSON @@@@ ----> " + JSON.stringify( finalObject	));

			res.send(finalObject);
		});

		connection.release();
	});
});

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

app.get('/getDeliveryCenterInfo', ensureAuthenticated, function(req, res) {
	console.log("__________inside getdeliveryCenterInfo_____________ ");
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select delivery_org_id,delivery_org_type, delivery_org_name from delivery_org_details_master where is_active=1 order by delivery_org_id', function(err, result) {
		//	console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});



app.get('/checkLeadCountryForExistingDeal/:solid', ensureAuthenticated, function(req, res) {
	
	var solid=req.params.solid;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('SELECT COUNTRY_ID FROM solution_basic_details_trx where  sol_id = ' + solid , function(err, result) {
			res.send(result);
		});
		connection.release();
	});
});




//Changes for workitem #5215 sales connect info popup
app.get('/getIMTInfo/:id', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = 'select imt_id,imt_name,imt_description from imt_info where iot_id='+id + ' order by imt_name';
		var query = pool.query(sqlQuery, function(err, result) {
		//	console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});



//Getting IOT and IMT information based on Country
app.get('/getIMTIOTInfo/:id', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = 'select LC.COUNTRY_ID, LC.COUNTRY_NAME, IM.imt_id,  IM.imt_gpe_name, IOT.iot_id, IOT.IOT_NAME from LEAD_COUNTRY LC join imt_info IM on LC.IMT_ID = IM.imt_id join iot_info IOT on  IOT.iot_id = IM.iot_id where COUNTRY_ID = ' + id ;
		var query = pool.query(sqlQuery, function(err, result) {
		//	console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});




// Changes for workitem #5215 sales connect info popup
app.get('/getIOTInfo', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select iot_id,iot_name,iot_description from iot_info order by iot_name', function(err, result) {
			//console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

//getting lead country details
app.get('/getLeadCountryInfo', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('SELECT COUNTRY_ID, COUNTRY_NAME FROM LEAD_COUNTRY WHERE IMT_ID != -1', function(err, result) {
			//console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

//getting lead country details
app.get('/getSolutionTypeInfo', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('SELECT ID, SOLUTION_TYPE FROM SOLUTION_TYPE_MASTER', function(err, result) {
			//console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});
app.get('/getSIUsecaseVal', ensureAuthenticated, function(req, res) {

	var solId=req.params.solId;
	var subcategoryId=req.params.useCaseId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var queryString = 'select eie.NEW_SIMPLE as simple, eie.NEW_MEDIUM as medium, eie.NEW_COMPLEX as complex from esb_integration_estimations eie where SOL_ID='+solId+' and SOL_AREA_ID='+subcategoryId;
		var query = pool.query(queryString, function(err, result) {
			//console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

app.get('/Solution_Area_InfoSolution_Asusmptions_MASTER', ensureAuthenticated, function(req, res) {
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select * from solution_area_infosolution_asusmptions_master', function(err, result) {
	
			res.send(result);
		});
		connection.release();
	});
});


app.get('/Solution_Input_Details_TRX', ensureAuthenticated, function(req, res) {
	var query = pool.query('select * from solution_input_details_trx', function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});
});

app.get('/getSolAreaOffSet', ensureAuthenticated, function(req, res) {
	var queryString = '';
	if(req.query.solAreaId==constants.SIInterfaces){ //esb scenario
		queryString = 'select sbd.Flex_Field_2 as solWeeks, IFNULL((select sad.Flex_Field_3 from solution_area_details_trx sad where sad.SOL_ID=sbd.SOL_ID and sad.Sol_area_id='+req.query.solAreaId+' and nfr_type=0),0) as offset, IFNULL((select MAX(IMPL_WEEKS) from esb_integration_estimations where SOL_ID='+req.query.solId+'),0) as solAreaWeeks from solution_basic_details_trx sbd where SOL_ID='+req.query.solId;
	} else{
		queryString = 'select sbd.Flex_Field_2 as solWeeks, IFNULL((select sad.Flex_Field_3 from solution_area_details_trx sad where sad.SOL_ID=sbd.SOL_ID and sad.Sol_area_id='+req.query.solAreaId+' and nfr_type=0),0) as offset, IFNULL((select Flex_Field_2 from solution_area_details_trx where SOL_ID='+req.query.solId+' and SOL_AREA_ID='+req.query.solAreaId+' and nfr_type=0),0) as solAreaWeeks from solution_basic_details_trx sbd where SOL_ID='+req.query.solId;
	}
	
	//var queryString = 'select sbd.Flex_Field_2, (select sad.Flex_Field_3 from solution_area_details_trx sad where sad.SOL_ID=sbd.SOL_ID and sad.Sol_area_id=req.query.solAreaId) as offset from solution_basic_details_trx sbd where SOL_ID='+req.query.solId;
	
	console.log("queryString: "+queryString);
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		
		var query = pool.query(queryString, function(err, result) {
			console.log(":::::::::::::::"+JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

app.post('/setSolDelvModel', ensureAuthenticated, function(req, res) {
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id) values ('"+req.body.session_id +"',"+ event.Edit_Delivery_Model +","+req.body.solId+")";
	console.log(sessionQuery);
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		
		var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
			if (err) {
				//connection.release();
				//console.log(err);
				console.log("Table 'session_log' doesn't exist");
			}			
		});	
		var qStr = 'update solution_area_details_trx set delivery_model='+req.body.delvModel+', FLEX_FIELD_5=0 where SOL_ID='+req.body.solId;
		console.log("setSolDelvModel qStr: "+qStr);
		var query = pool.query(qStr, function(err, result) {
			var deletStaffingWorkBookQuery = "delete from staffing_estimates where sol_id="+req.body.solId;
			connection.query(deletStaffingWorkBookQuery, function(err, deletStaffingWorkBookResult, fields) {					
				if (err) {						
					console.log("error while deletStaffingWorkBookQuery " + err);
				}
				
				console.log("after deletStaffingWorkBookQuery ");
			});
			
			const solAreaQry = 'SELECT Sol_area_id FROM solution_area_details_trx WHERE SOL_ID = ' + req.body.solId+ " and SOL_STATUS='COMPLETE'";
			console.log('Sol area query : ', solAreaQry);
			
			connection.query(solAreaQry, function(err, solAreaResult, fields) {					
				if (err) {						
					console.log("error while fetching solution area info " + err);
				}
				else{
					for(i = 0; i < solAreaResult.length; i++){
						request.post("http://"+serviceURL+"/staffing/request?sessionId='" +req.session.id +"'&solId="+req.body.solId+"&solAreaId="+solAreaResult[i].Sol_area_id + "&mergeOnly=" + false,{  },
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									console.log('estimate REST invoked : ',body);
								}
								else{
									console.log('error happened in estimare REST called : ',error);
									console.log('Response : ' + response.statusCode);
								}
							});
					}
					
					const solBasicQry = 'SELECT is_perf_test_in_scope FROM solution_basic_details_trx WHERE SOL_ID = ' + req.body.solId;
					console.log('performance test query : ', solAreaQry);
					
					connection.query(solBasicQry, function(err, solAreaResult, fields) {
						if (err) {						
							console.log("error while fetching performance test info " + err);
						}
						else if(solAreaResult[0].is_perf_test_in_scope == 1){
					
							request.post("http://"+serviceURL+'/staffing/request?sessionId='+req.session.id+'&solId='+req.body.solId+'&solAreaId=0&nfrType=performance&mergeOnly=' + false,{  },
								function (error, response, body) {
									if (!error && response.statusCode == 200) {
										console.log('performance estimate REST invoked : ',body);
									}
									else{
										console.log('error happened in performance estimare REST called : ',error);
									}
								});
						}
						else{
							console.log('No performance test invoked');
						}
					});
					
					//setting is_staffing flag to 1 #143
					setStaffingFlagDirty(req,res);
				}

			});	
			res.send("OK");
		});
		connection.release();
	});
});
//Fix for Multiple CIC ( changing the cic)
app.post('/setDeliveryCenter', ensureAuthenticated, function(req, res) {
	
	var qStr = 'update solution_area_details_trx set PROPOSED_DELIVERY_CENTER='+req.body.deliveryCenterId+' where SOL_ID='+req.body.solId+' and sol_area_id='+ req.body.solAreaId;
	console.log("setDeliveryCenter qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		if (err) {
			//connection.release();
			console.log(err);
		}	
	});
	
	//setting is_staffing flag to 1 #143
	setStaffingFlagDirty(req,res);
});

app.post('/setSprintWeeks', ensureAuthenticated, function(req, res) {
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id) values ('"+req.body.session_id +"',"+ event.Edit_Sprint_Weeks +","+req.body.solId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			//console.log(err);
			console.log("Table 'session_log' doesn't exist");
		}			
	});	
	
	var qStr = 'update solution_area_details_trx set sprint_weeks='+req.body.sweeks+' where SOL_ID='+req.body.solId;
	console.log("setSprintWeeks qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		if (err) {
			//connection.release();
			console.log(err);
		}	
		request.post("http://"+serviceURL+"/staffing/updateSprintWeeks?sessionId='" +req.session.id +"'&solId="+req.body.solId,{  },
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					console.log('updateSprintWeeks REST invoked : ',body);
				}
				else{
					console.log('error happened in updateSprintWeeks REST called : ',error);
					console.log('updateSprintWeeks Response : ' + response.statusCode);
				}
			});
		res.send("OK");
	});
	
	//setting is_staffing flag to 1 #143
	setStaffingFlagDirty(req,res);
	
});

app.post('/setSolAreaOffSet', ensureAuthenticated, function(req, res) {
	console.log("**** setSolAreaOffSet ********")
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id, sol_area_id) values ('"+req.body.session_id +"',"+ event.Edit_SolArea_Offset +","+req.body.solId+","+req.body.solAreaId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			//console.log(err);
			console.log("Table 'session_log' doesn't exist");
		}			
	});	
	var qStr = 'update solution_area_details_trx set Flex_Field_3='+req.body.offSet+' where SOL_ID='+req.body.solId+' and Sol_area_id='+req.body.solAreaId+' and nfr_type=0';
	console.log("qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		res.send("OK");
	});
	//setting is_staffing flag to 1 #143
	setStaffingFlagDirty(req,res);
});

app.get('/siadapters_complexity_def/:id', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = 'select COMPLEXITY_ID, CRITERION, (select distinct(ReqCategory) from industry_use_cases_master where Sol_area_id='+id+') as esbArea from esb_complexity_level_definition where REQ_SUBCATEGORY_ID='+id;
		var query = pool.query(sqlQuery, function(err, result) {
			res.render('esb_complexity', {'complexityDef' : result});
		});
		connection.release();
	});
});

app.get('/esb_complexity_def/:id', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = 'select COMPLEXITY_ID, CRITERION, (select distinct(ReqSubCategory) from industry_use_cases_master where ReqSubCategoryId='+id+') as esbArea from esb_complexity_level_definition where REQ_SUBCATEGORY_ID='+id;
		console.log("esb_complexity_def query: "+sqlQuery);
		var query = pool.query(sqlQuery, function(err, result) {
			res.render('esb_complexity', {'complexityDef' : result});
		});
		connection.release();
	});
});

app.get('/spss_complexity_def/:id/:solAreaId', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	var solAreaId=req.params.solAreaId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = "select spssmv.complexity_id as COMPLEXITY_ID, (CONCAT(spssmv.entry_desc, ': ', spssmv.cell_value)) as CRITERION, (select title from spss_details where spss_details.id=spssmv.group_id) as esbArea from spss_mapping_values spssmv where spssmv.group_id="+id;
		console.log("sqlQuery: "+sqlQuery);
		var query = pool.query(sqlQuery, function(err, result) {
			
			var termsQuery = "select name, definition from sol_area_definitions where sol_area_id="+solAreaId;
			var query2 = pool.query(termsQuery, function(err, termsQueryResult) {
				res.render('esb_complexity', {'complexityDef' : result, 'termsDef': termsQueryResult});
			});
		});
		connection.release();
	});
});

app.get('/dw_complexity_def/:id/:solAreaId', ensureAuthenticated, function(req, res) {
	var id=req.params.id;
	var solAreaId=req.params.solAreaId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		//var sqlQuery = "select dwmv.complexity_id as COMPLEXITY_ID, (CONCAT(dwmv.entry_desc, ': ', dwmv.cell_value)) as CRITERION, (select title from dw_details where dw_details.id=dwmv.group_id) as esbArea from dw_mapping_values dwmv where dwmv.group_id="+id;
		var sqlQuery = "select dwmv.complexity_id as COMPLEXITY_ID, dwmv.entry_desc as CRITERION, (select title from dw_details where dw_details.id=dwmv.group_id) as esbArea from dw_mapping_values dwmv where dwmv.group_id="+id;
		
		console.log("sqlQuery: "+sqlQuery);
		var query = pool.query(sqlQuery, function(err, result) {
			
			var termsQuery = "select name, definition from sol_area_definitions where sol_area_id="+solAreaId;
			var query2 = pool.query(termsQuery, function(err, termsQueryResult) {
				res.render('esb_complexity', {'complexityDef' : result, 'termsDef': termsQueryResult});
			});
		});
		connection.release();
	});
});

app.get('/Solution_Requirement_Matrix', ensureAuthenticated, function(req, res) {
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select * from solution_requirement_matrix', function(err, result) {
	//	console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});

});


app.get('/Staffing_Plan_TRX', ensureAuthenticated, function(req, res) {
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select * from staffing_plan_trx', function(err, result) {
	//	console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

/*
app.get('/estimatePerf', function(req, res) {
	setTimeout(function() {
		request.post(serviceURL+'/estimate/request?solId='+req.solId+"&solAreaId=" + req.solAreaId + "&nfrType=performance",{  },
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log(body)
					res.render('res', {"pass":1});
				}
			}
		); 
	}, 100);
	
	}
);
*/



app.get('/doEstimation', ensureAuthenticated, function(req, res) {
	request.post(
    "http://"+serviceURL+'/estimate/46' ,
    {  },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
				res.render('advisorHome', {'user' : req.session.user});
        }
    }
); 
	
});


var appEnv = cfenv.getAppEnv();
app.listen(config.port, '0.0.0.0', function() {

	// print a message when the server starts listening
	console.log("server starting on " + config.port + ", Rest API Url: " +serviceURL);

});

https.createServer(options, app).listen(config.httpsPort, '0.0.0.0', function() {

        // print a message when the server starts listening
                 console.log("Secure server starting on " + config.httpsPort + ", Rest API Url::::: " +serviceURL);
        
                 });                 

app.post('/saveSolutionSPSSUseCasesInfo', ensureAuthenticated, function(req, res) {
	console.log("**** Inside saveSolutionSPSSUseCasesInfo*****  ");
	//ju submission of ESB values will be done here
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;
		var useCaseId  = post.useCaseId;
		var testSolId = post.testSolId;
		var soakTestId=post.soakTestId;
		var testFlagId = post.testFlagId;
		var useCaseInfoType = post.useCaseInfoType;
		var siValJSON = JSON.parse(post.siValJSON);
		var perfPercent = siValJSON.perfPercent;
		console.log("siValJSON=="+post.siValJSON);
		
		var estimationTable;
		if(post.SOL_AREA_ID==constants.DatawareHouse)
			estimationTable="dw_estimations";
		else
			estimationTable="spss_estimations";
		
		
		if(post.isedit == 'true'){
			useCaseInfoType = post.edit_usecase_info_type;
		}
		
		console.log("useCaseInfoType: "+useCaseInfoType);

			var sqlCustomIntegrationInsertQuery = "insert into "+estimationTable+"(sol_id, group_id, complexity_id) values ";
			var testSolId = post.testSolId;
			var soakTestId=post.soakTestId;
			var testFlagId = post.testFlagId;
			var counter = 0;
			for (var j = 0; j < siValJSON.entries.length ; j++) {
				console.log("siValJSON::"+siValJSON);
				console.log(">>>>"+j-1);
				console.log("siValJSON.entries .."+siValJSON.entries[j]);
				var id = siValJSON.entries[j].id;
				var complexity = siValJSON.entries[j].complexity;
				
				var vcomplex = 0;
				if(counter > 0)
					sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + ",";
				
				sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + "(" + solId + ", " + id + ", " + complexity +" )";
				counter++;
			}
			
			console.log("++++++++++++++++++++++++++ final sqlCustomIntegrationInsertQuery::  "+sqlCustomIntegrationInsertQuery);
			
			//first delete what already exists..passing just solId shd be enough as all entries are for SystemINtegration solArea
			var sqlSPSSDeleteQuery = "delete from "+estimationTable+" where sol_id="+solId;
			var sqlSPSSDeleteQueryExec = pool.query(sqlSPSSDeleteQuery, function(err, sqlSPSSDeleteQueryResult) {	
				if(err){
					console.log("error while deleting old values for soln Id "+solId+" from "+estimationTable); 
					throw err;	
				}
				console.log("--------------- before the insert query ");
				var spssQuery = pool.query(sqlCustomIntegrationInsertQuery, function(err, result) {
					if (err) {
						console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
						throw err;	
					}
					console.log("++++++++++++++++++++++++++ Insert query exectued ");
					
					/*var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
						if (err)  throw err;	
					});*/
				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id) values ('"+req.session.id +"',"+ event.Save_Solution  +","+solId+","+post.SOL_AREA_ID+")";
				console.log(sessionQuery);
				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
					if (err) {
						//connection.release();
						//console.log(err);
						console.log("Error: ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
						
					}
				});//session logging ends here	
				
					setTimeout(function() {
						setEstimationFlagDirty(solId,post.SOL_AREA_ID);
						request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											//console.log(err);
											console.log("Error: ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
										}
									});//session logging ends here	
								//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
									console.log(body);
									console.log("testSolId::::"+testSolId);
									//console.log("arr.length::::"+arr.length);
									
//									if('N'=='Y'){ //no need to call perf estimation here
//										setTimeout(function() {
//											request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
//												function (error, response, body) {
//													if (!error && response.statusCode == 200) {
//														//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
//														var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//														console.log(sessionQuery);
//														var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//															if (err) {
//																//connection.release();
//																console.log(err);
//															}
//														});//session logging ends here	
//													//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//														console.log(body)
//													}
//													else {
//														var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
//														console.log(sessionQuery);
//														var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//															if (err) {
//																//connection.release();
//																console.log(err);
//															}
//														});//session logging ends here	
//													}
//												}
//											);
//										}, 300);
//										}
									
									var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
									console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
									var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
										if (err) {
											console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
											throw err;	
										}
										console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
										console.log("isedit:::::::::---"+post.isedit);
										
										if(resultSolAreaId.length <= 0)	{
											if(testSolId=='Y'){
												setTimeout(function() {
													request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
														function (error, response, body) {
															if (!error && response.statusCode == 200) {
																//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
																console.log(sessionQuery);
																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																	if (err) {
																		//connection.release();
																		//console.log(err);
																		console.log("Error: ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
																	}
																});//session logging ends here	
															//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
//																console.log(body);
//																console.log(">>>>>>>....making tomcat req for merged plan");
																//make a call to tomcat to generate the merged plan
//																setTimeout(function() {
//																	request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//																		function (error, response, body) {
//																			if (!error && response.statusCode == 200) {
//																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																				console.log(sessionQuery);
//																				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																					if (err) {
//																						//connection.release();
//																						console.log(err);
//																					}
//																				});//session logging ends here	
//
//																				console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//																				
//																			}
//																			else {
//																				console.log(":::error while calling merge plans for solId: "+solId);
//																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//																				console.log(sessionQuery);
//																				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																					if (err) {
//																						//connection.release();
//																						console.log(err);
//																					}
//																				});//session logging ends here	
//																			}
//																		}
//																	);
//																}, 500);
															}
															else {
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'"+error+"')";
																console.log(sessionQuery);
																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																	if (err) {
																		//connection.release();
																		//console.log(err);
																		console.log("Error: ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
																	}
																});//session logging ends here	
															}
														}
													);
												}, 300);
											} else{
//												console.log(">>>>>>>....making tomcat req for merged plan");
												//make a call to tomcat to generate the merged plan
//												setTimeout(function() {
//													request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
//														function (error, response, body) {
//															if (!error && response.statusCode == 200) {
//																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
//																console.log(sessionQuery);
//																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																	if (err) {
//																		//connection.release();
//																		console.log(err);
//																	}
//																});//session logging ends here	
//
//																console.log(">>>>>>After Creating merged plan for solnId: " + solId);
//																
//															}
//															else {
//																console.log(":::error while calling merge plans for solId: "+solId);
//																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
//																console.log(sessionQuery);
//																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
//																	if (err) {
//																		//connection.release();
//																		console.log(err);
//																	}
//																});//session logging ends here	
//															}
//														}
//													);
//												}, 500);
											}
										}
									});
								}//end of success if for success from java
								else {
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",1,'"+error+"')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											//console.log(err);
											console.log("Error: ER_NO_SUCH_TABLE: Table 'session_log' doesn't exist");
										}
									});//session logging ends here	
								}

							}
						);
					}, 300);
					
					var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and use_provided_efforts=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
					console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
					var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
						if (err) {
							console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
							throw err;	
						}
						console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
						console.log("isedit:::::::::---"+post.isedit);
						
						if(resultSolAreaId.length > 0)	{
							
							var currentSolAreaId = resultSolAreaId[0].sol_area_id;	
							console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
							var sqlQuery;
							if(currentSolAreaId === constants.SAPAriba){
								sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
							}
							else{
								sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
							}
							console.log("sqlQuery ::::::::: "+sqlQuery);
							var query = pool.query(sqlQuery, function(err, solAreaResult) {
								if (err) throw err;	
								
								console.log("new currentSolAreaId ::::::::: "+currentSolAreaId);
								
								if(solAreaResult.length > 0) {
//									if(testSolId == 'Y'){
//										
//										var sqlSelectQuery = "select sol_id,sol_area_id from solution_area_details_trx where sol_id="+solId+" and sol_area_id="+currentSolAreaId+ " and nfr_type=1";
//										
//										var selectQuery = pool.query(sqlSelectQuery, function(err, solAreaResultCheck) {
//											if(solAreaResultCheck.length == 0){
//												var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id,nfr_type) values("+solId+","+currentSolAreaId+",1)";
//												var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
//													if (err) {
//														console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query for Perf Test Estimation"); 
//														throw err;	
//													}
//												});
//											}
//										});
//									}
									console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo3 ");
									//console.log("solAreaResult.sol_area_id:::::::>>>"+solAreaResult.sol_area_id);

									
									if(currentSolAreaId ==constants.SIInterfaces){
										res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
									} else if(currentSolAreaId ==constants.AnalyticsSPSS){
										var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
										
										var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
										});								
									}else if(currentSolAreaId ==constants.DatawareHouse){														
										//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
										var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
										var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											
											console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
											res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
										});	
									}else if(currentSolAreaId ==constants.WatsonCustomerAssist){
										
										//var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
										var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getWatsonCustomerAssistInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType, 'defaultValues':sqlDefaultValuesQResults, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											
											});	
									}else if(currentSolAreaId ==constants.SIAdapters){
										res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
									}
									else if(currentSolAreaId ==constants.AMSTicketBased){
										var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											
											});	
									}else if(currentSolAreaId ==constants.AMSResourceBased){
										var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
										
										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										
										});	
									}
									else if(currentSolAreaId ==constants.AMSProductBased){
										var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component ,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;

										console.log("sqlDefaultValues >>"+sqlDefaultValues);
										var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
											console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
											if (sqlDefaultValuesQResults.length === 0)
												res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
											else 
												res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
										
										});	
									}else {
										if(useCaseInfoType == 1){
											res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
										} else{
											res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
										}										
									}		
								}
								else {
									console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
									console.log("7");
									var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.opportunity_id,solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
									var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											throw err;	
										}
										var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
										connection.query(screenFieldQry, function(error, scrnFldRes, fields){
											if(error){
												throw error;
											}
											var screenField = {};
											for(var i = 0; i < scrnFldRes.length; i++){
												var rec = scrnFldRes[i];
											console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
											if(rec.IS_USE_CASES_VIEW_HIDDEN){
												if(i===0){
													screenField["isUsecaseHidden"] = 1;
												}
												screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isUsecaseHidden;
											}
											if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
												if(i===0){
													screenField["isPerfTestHidden"] = 1;
												}
												screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isPerfTestHidden;
											}
											if(rec.IS_MODEL_HIDDEN){
												if(i===0){
													screenField["isModelHidden"] = 1;
												}
												screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
											}
											else{
												delete screenField.isModelHidden;
											}
											if(rec.IS_SPRINT_WEEKS_HIDDEN){
												if(i===0){
													screenField["isSprintWeeksHidden"] = 1;
												}
												screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
											}
											else{
												delete screenField.isSprintWeeksHidden;
											}
										}
										console.log("screenField : ");
										console.log(screenField);
										console.log("Success and passing the control to saveSolutionCustomUseCasesInfo Page."); 
										res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
									});
									});

								}
							});
						}
						else {
//							console.log("making request to generate Perf Test Estimation.");
//							if(testSolId=='Y'){
//								setTimeout(function() {
//									request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
//										function (error, response, body) {
//											//do nthg
//										}
//									);
//								}, 300);
//							}
						}
					});
				
				});
			});						
		
				

			//	connection.release();
			
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	});}
});




function callUseCaseInfoEstimation(req, res, connection, indus_id){
	console.log("------------Inside callUseCaseInfoEstimation-----------------\n\n");
	var post = req.body;
	var solId= post.solId;
	var testSolId = post.testSolId;
	var useCaseInfoType = post.useCaseInfoType;	
	var model = post.model;
	var sprintWeeks;
	var useCaseId  = post.useCaseId;
	var soakTestId=post.soakTestId;
	var testFlagId = post.testFlagId;

	console.log("Industry Id ###### :: "+indus_id);
	
	if(post.sprintWeeks) {
		sprintWeeks = post.sprintWeeks;
	} 
	else{
		sprintWeeks = 0;
	}
	
	setTimeout(function() {
		setEstimationFlagDirty(solId,post.SOL_AREA_ID);
		console.log("calling API "+"http://"+serviceURL+"/estimate/request?sessionId='" +req.session.id +"'&solId="+solId+"&solAreaId="+post.SOL_AREA_ID);
		request.post("http://"+serviceURL+"/estimate/request?sessionId='" +req.session.id +"'&solId="+solId+"&solAreaId="+post.SOL_AREA_ID,{  },
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							//connection.release();
							//console.log(err);
							console.log("Table 'session_log' doesn't exist");
						}
					});

					console.log("Estimation call body : " + body);
					
					var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
					console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
					var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
						if (err) {
							console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
							throw err;	
						}
						console.log("Inside estimation callaback resultSolAreaId.length:::::::"+resultSolAreaId.length);
						console.log("isedit:::::::::---"+post.isedit);
						console.log("testSolId:::::::::---"+testSolId);
						if(resultSolAreaId.length <= 0)	{
							if(testSolId=='Y' ){
								var checkValidPerfSolArea=false;
								var sqlQuery="select max(USE_CASE_COMPLEXITY)as USE_CASE_COMPLEXITY from industry_use_cases_master where sol_area_id="+ post.SOL_AREA_ID;
								console.log("*****sqlQuery  "+sqlQuery);
									var query = pool.query(sqlQuery, function(err, result) {	
										if(err){
											console.log("Error  "+ err);
										}
										if(result.length>0){
											/*for (var i = 0; i < result.length; i++) {
												
												if(similarSolutionsResult[i].SOL_ID === id){*/
											console.log("*****result  "+typeof result[0].USE_CASE_COMPLEXITY);
											if(result[0].USE_CASE_COMPLEXITY==999 )//|result[0].USE_CASE_COMPLEXITY==0
												checkValidPerfSolArea=false;
											else
												checkValidPerfSolArea=true;
										}
										else 
											checkValidPerfSolArea=false;
										
									console.log("is solarea valid "+checkValidPerfSolArea);
									if(checkValidPerfSolArea){
											setTimeout(function() {
												console.log("calling API "+"http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance');
												request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
													function (error, response, body) {
														if (!error && response.statusCode == 200) {
			
															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
															console.log(sessionQuery);
															var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																if (err) {
																	//connection.release();
																	//console.log(err);
																	console.log("Table 'session_log' doesn't exist");
																}
															});	
														}
													
													}
												);
											}, 300);	
									}
									
								});
							} //deet
						}
					});
					
				}
				else {
					var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							//connection.release();
							//console.log(err);
							console.log("Table 'session_log' doesn't exist");
						}
					});
				}
			}
		);
	}, 300);
	
	
//	var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
	var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and use_provided_efforts=0 and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
	console.log("sqlSolAreaId::"+sqlSolAreaId);
	var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
		if (err) {
			console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
			throw err;	
		}
		console.log("resultSolAreaId length:::::::::---"+resultSolAreaId.length);
		
		if(resultSolAreaId.length > 0)	{
			
			currentSolAreaId = resultSolAreaId[0].sol_area_id;	
			console.log("+++++++++++::+++++++++++++++ new Solution Area id - "+currentSolAreaId);
			
			var sqlQuery;
			if(currentSolAreaId === constants.SAPAriba){
				sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name";
			}
			else{
//				sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, industry.indus_id, industry.indus_name";
				sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name";
			}	

			sqlQuery = sqlQuery + ",uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid," +
					"use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, " +
													"service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id " +
													"and sol_area.sol_area_id=uc_master.sol_area_id " +
													"and industry.indus_id = uc_master.indus_id " +
													"and (uc_master.indus_id="+indus_id+" or uc_master.indus_id=101) " +
															"and uc_master.sol_area_id="+currentSolAreaId;
			
			console.log("SQL ####### "+sqlQuery);
			
			var query = pool.query(sqlQuery, function(err, solAreaResult) {
				if (err) throw err;	
				console.log("Length******** " + solAreaResult.length)
				if(solAreaResult.length > 0) {
					console.log(" ***** Inside saveSolutionUseCasesInfo, Success and forward to getUseCaseInfo ");
					console.log("currentSolAreaId:::::::::::::"+currentSolAreaId);
					var isAddlParamQry = "select IS_ADD_PARAM from solution_area_info where Sol_area_id = " + currentSolAreaId;
					console.log(isAddlParamQry);
					connection.query(isAddlParamQry, function(err, addlParamCheckRes, fields){
						if (err) throw err;
						var isAddlParam = addlParamCheckRes[0].IS_ADD_PARAM;
						console.log('DB response  addlParam : ' + isAddlParam); 
						if(currentSolAreaId ==constants.SIInterfaces){
							res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
						} else if(currentSolAreaId ==constants.AnalyticsSPSS){
							var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
							
							var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
							});								
						}else if(currentSolAreaId ==constants.DatawareHouse){														
							//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
							var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
							var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								
								console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
								res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
							});	
						}else if(currentSolAreaId ==constants.WatsonCustomerAssist){
							//var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
							var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getWatsonCustomerAssistInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}else if(currentSolAreaId ==constants.SIAdapters){
							res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
						} 
						else if(currentSolAreaId ==constants.AMSTicketBased){
							var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
							
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}else if(currentSolAreaId ==constants.AMSResourceBased){
							var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
							
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}
						else if(currentSolAreaId ==constants.AMSProductBased){
							var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;

							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}else {
							if(post.currentSolAreaId==constants.IBMDigitalExperience && isAddlParam === 1){
								var sql = "select distinct trx.SOL_ID, (select count(aptrx.ADDNL_PARAM_ID) from SOL_AREA_ADDNLPARAM_TX aptrx, SOL_AREA_ADDNLPARAM_MASTER apm where aptrx.ADDNL_PARAM_ID = apm.ADDNL_PARAM_ID and aptrx.SOL_ID = " + post.solId + " and apm.ADDNLPARAM_GROUP_NAME = 'Portal') as count_portal, (select count(aptrx.ADDNL_PARAM_ID) from SOL_AREA_ADDNLPARAM_TX aptrx, SOL_AREA_ADDNLPARAM_MASTER apm where aptrx.ADDNL_PARAM_ID = apm.ADDNL_PARAM_ID and aptrx.SOL_ID = " + post.solId + " and apm.ADDNLPARAM_GROUP_NAME = 'WCM') as count_wcm from SOL_AREA_ADDNLPARAM_TX trx where trx.SOL_ID = " + post.solId;
								connection.query(sql, function(err, results, fields){
									if (err) throw err;	
									var param = "";
									if(results.length > 0 && results[0].count_portal === 0){
										param = "WCM";
									}
									else if(results.length > 0 && results[0].count_wcm === 0){
										param = "Portal";
									}
									console.log("PARAM : " + param);
									console.log("Page is ##### getUseCaseInfo.html");
									res.render('getUseCaseInfo', {'isedit' : post.isedit, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId, "model":model, "sprintWeeks": sprintWeeks, "isAddlParam": isAddlParam, "param": param});
								})

								
							}else{
								console.log("Page is ##### getUseCaseInfo.html");
								res.render('getUseCaseInfo', {'isedit' : post.isedit, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId, "model":model, "sprintWeeks": sprintWeeks, "isAddlParam": isAddlParam});
							}
						}
						connection.release();
					});	
				}
				else {
					console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
					console.log("1");
					setTimeout(function(){
					console.log("slept for 10 secs");
					var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.opportunity_id,solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
					var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
						if (err) {
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
							throw err;	
						}
						var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
						connection.query(screenFieldQry, function(error, scrnFldRes, fields){
							if(error){
								throw error;
							}
							var screenField = {};
							for(var i = 0; i < scrnFldRes.length; i++){
								var rec = scrnFldRes[i];
							console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
							if(rec.IS_USE_CASES_VIEW_HIDDEN){
								if(i===0){
									screenField["isUsecaseHidden"] = 1;
								}
								screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
							}
							else{
								delete screenField.isUsecaseHidden;
							}
							if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
								if(i===0){
									screenField["isPerfTestHidden"] = 1;
								}
								screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
							}
							else{
								delete screenField.isPerfTestHidden;
							}
							if(rec.IS_MODEL_HIDDEN){
								if(i===0){
									screenField["isModelHidden"] = 1;
								}
								screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
							}
							else{
								delete screenField.isModelHidden;
							}
							if(rec.IS_SPRINT_WEEKS_HIDDEN){
								if(i===0){
									screenField["isSprintWeeksHidden"] = 1;
								}
								screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
							}
							else{
								delete screenField.isSprintWeeksHidden;
							}
						}
						console.log("screenField : ");
						console.log(screenField);
						console.log("Success and passing the control to saveSolutionUseCasesInfo Page."); 
						console.log("solDetailsInfo: "+solDetailsInfo);
						console.log("currentSolAreaId: "+currentSolAreaId);
						connection.release();
						//res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
						
						res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+rec.Sol_area_Name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
											
					});
					});
					}, 10000);
				}
			});
		} 
		else{
			connection.release();
		}
	});
}

app.post('/saveAddlParamInfo',ensureAuthenticated, function(req, res){ 
	console.log('route called with post /saveAddlParamInfo');
	var indus_id = req.body.INDUS_ID;
	saveAddlParamInfo(req, res, indus_id);
});

function saveAddlParamInfo(req, res, indus_id){
	if(req.session.user) {
		var fname = req.body.fname;
		var lname = req.body.lname;

		var solId = req.body.solId;
		var solAreaId = req.body.solAreaId;

		console.log('Request Body : ');
		console.log(req.body);

		var solId = req.body.solId;
		var insertVal = "";

		for(var obj in req.body){
			// console.log("Object : " + obj);
			//if(obj.includes("field_")){
			  if(obj.indexOf('field_') !== -1){
				var splitedElements = obj.split("_");
				// console.log("splitedElements : " + splitedElements);
				var addlParamId;
				var addlSubParamId;

				var paramValue = req.body[obj];				
				// console.log("paramValue : " + paramValue);
				
				addlParamId = splitedElements[1];
				addlSubParamId = splitedElements[2] || -1;

				// console.log("addlParamId : " + addlParamId);
				// console.log("addlSubParamId : " + addlSubParamId);

				if(insertVal){
					insertVal = insertVal + ",";
				}	
				
				insertVal = insertVal + "("+addlParamId+","+addlSubParamId+","+solId+", '"+paramValue+"')";
			}
		}

		pool.getConnection(function(err, connection){
			if (err) {
				console.log("Error obtaining connection from pool: "+ err);
				throw err;
			}
			var deleteQry = "delete from SOL_AREA_ADDNLPARAM_TX where SOL_ID = " + solId;
			connection.query(deleteQry, function(er, delRes){
				if(er){
					console.log("Trx delete Error : " + er);
					console.log("Error : " + er.message);
					console.log("Error : " + er.code);
					throw er;
				}
				var sqlInsertQuery = "insert into SOL_AREA_ADDNLPARAM_TX  (ADDNL_PARAM_ID, SUB_ADDNL_PARAM_ID, SOL_ID, ADDNL_PARAM_VALUE) values " + insertVal + " ON DUPLICATE KEY UPDATE ADDNL_PARAM_VALUE = VALUES(ADDNL_PARAM_VALUE)";

				console.log("Insert Query : " + sqlInsertQuery);

				connection.query(sqlInsertQuery, function(err, result1, fields){
					if (err) {
						console.log("Error : " + err);
						console.log("Error : " + err.message);
						console.log("Error : " + err.code);
						throw err;
					}
					console.log('DB response  result1 : ' + result1);
	
					callUseCaseInfoEstimation(req, res, connection, indus_id);
				});
			});
		});
	}
	else { 
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
	}
}

app.post('/getAddlParamInfo',ensureAuthenticated, function(req, res){ 
	console.log('route called with post /getAddlParamInfo');
	getAddlParamInfo(req, res);
});

app.post('/useUserEffortEstimates', ensureAuthenticated, function(req, res) {
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id, sol_area_id) values ('"+req.body.session_id +"',"+ event.User_Provided_Efforts +","+req.body.solId+","+req.body.solAreaId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			//console.log(err);
			console.error("Table 'soladvisor_na.session_log' doesn't exist");
			
		}			
	});	
	if(req.body.solAreaId == constants.SIAdapters){
		var qStr = 'update esb_adapters_estimations set use_provided_efforts='+req.body.useEfforts+' where SOL_ID='+req.body.solId;
	}else if(req.body.solAreaId == constants.SIInterfaces){
		var qStr = 'update esb_integration_estimations set use_provided_efforts='+req.body.useEfforts+' where SOL_ID='+req.body.solId;
	}else{
		var qStr = 'update solution_area_details_trx set use_provided_efforts='+req.body.useEfforts+' where SOL_ID='+req.body.solId+' and Sol_area_id='+req.body.solAreaId+' and nfr_type=0';
	}
	
	console.log("qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		if (err) {
			//connection.release();
			console.log(err);
		}
//		var qString = "http://"+serviceURL+"/estimate/updateEffortMechanism?sessionId=" +req.session.id +"&solId="+req.body.solId+"&solAreaId="+req.body.solAreaId+"&useProvidedEfforts="+req.body.useEfforts;
//		console.log("qString>>"+qString);
//		request.post(qString,{  },
//				function (error, response, body) {
//					if (!error && response.statusCode == 200) {
//						console.log('updateEffortMechanism REST invoked : ',body);
//					}
//					else{
//						console.log('error happened in updateEffortMechanism REST called : ',error);
//						console.log('updateEffortMechanism Response : ' + response.statusCode);
//					}
//				});
		res.send("OK");
	});
	
	

});

app.post('/useUserEffortEstimates_db', ensureAuthenticated, function(req, res) {
	console.log('------- Entered route POST /useUserEffortEstimates_db ----- \n');
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id, sol_area_id) values ('"+req.body.session_id +"',"+ event.User_Provided_Efforts +","+req.body.solId+","+req.body.solAreaId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			//console.log(err);
			console.log("Table 'session_log' doesn't exist");
			
		}			
	});	
	if(req.body.solAreaId == constants.SIAdapters){
		var qStr = 'update esb_adapters_estimations set use_provided_efforts='+req.body.useEfforts+' where SOL_ID='+req.body.solId;
	}else if(req.body.solAreaId == constants.SIInterfaces){
		var qStr = 'update esb_integration_estimations set use_provided_efforts='+req.body.useEfforts+' where SOL_ID='+req.body.solId;
	}else{
		var qStr = 'update solution_area_details_trx set use_provided_efforts='+req.body.useEfforts+' where SOL_ID='+req.body.solId+' and Sol_area_id='+req.body.solAreaId+' and nfr_type=0';
	}
	
	console.log("useUserEffortEstimates_db : qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		if (err) {
			//connection.release();
			console.log(err);
		}	
		res.send("OK");
	});	
	

});

//app.get('/getUseCaseListForSolArea', function(req,res){
	app.get('/getUseCaseListForSolArea/:id/:industryId/:solId', ensureAuthenticated, function(req,res){
	console.log("--------------Entered getUseCaseListForSolArea ");
	var jsonObj = {};
	if(req.session.user) {
			var sid = req.session.id;
			var timeOut = timeOutSidMap.get(sid);
			var id=req.params.id;
			//var solAreaID=req.params.solAreaId;
			var solId=req.params.solId;
			var industryId=req.params.industryId;
			
			if(timeOut) { 
				clearTimeout(timeOut);
			}
			timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
			timeOutSidMap.set(sid, timeOut);
			
			console.log("Solution Aread id:::::::::::"+id);
			console.log("SolId:::::::::::"+solId);
			console.log("industryId:::::::::::"+industryId);
			pool.getConnection(function(err, connection) {
			if (err) {
				console.log("Error obtaining connection from pool: "+ err);
				connection.release();
				throw err;
			}
			sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + industryId + " as indus_id, (select indus_name from industry_info where indus_id = " + industryId + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, uc_master.IS_ALWAYS_INSCOPE, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + solId + " and use_case_id=uc_master.use_case_id) as isselected, (select distinct(is_perf_test_in_scope) from solution_requirement_matrix   where sol_id = " + solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+industryId+" or uc_master.indus_id=101) and uc_master.sol_area_id="+id;
			//console.log("sqlQuery ===="+sqlQuery);
			var query = pool.query(sqlQuery, function(err, useCaseResult) {
				
				if(err){
					console.log("NO  use- cases found in database for Sol_area "+ id+" = " +JSON.stringify(useCaseResult));
					res.send(useCaseResult);
					
				}
				//console.log("use- cases found in database for Sol_area "+ id +" = " +JSON.stringify(useCaseResult));
				console.log("Number of use- cases found in database for Sol_area "+id+" = "+ useCaseResult.length);
				res.send(useCaseResult);
				
			});
			connection.release();
		});
	}
	else { 
			sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
			sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		}); 
	}
	
});

app.post('/saveUserProvidedEfforts', ensureAuthenticated, function(req, res) {
	console.log("*** Entered /saveUserProvidedEfforts******");
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id, sol_area_id) values ('"+req.body.session_id +"',"+ event.User_Provided_Efforts +","+req.body.solId+","+req.body.solAreaId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			//console.log(err);
			console.log("Table 'session_log' doesn't exist");
		}			
	});	
	//setting is_staffing flag to 1 #143
	setStaffingFlagDirty(req,res);
	
	if(req.body.solAreaId == constants.SIAdapters){
		var qStr = 'update esb_adapters_estimations set provided_efforts='+req.body.efforts+' where SOL_ID='+req.body.solId;
	}else if(req.body.solAreaId == constants.SIInterfaces){
		var qStr = 'update esb_integration_estimations set provided_efforts='+req.body.efforts+' where SOL_ID='+req.body.solId;
	}else{
		var qStr = 'update solution_area_details_trx set provided_efforts='+req.body.efforts+' where SOL_ID='+req.body.solId+' and Sol_area_id='+req.body.solAreaId+' and nfr_type=0';
	}
	
	console.log("qStr in saveUserProvidedEfforts: "+qStr);
	var query = pool.query(qStr, function(err, result) {		
		var qString = "http://"+serviceURL+"/estimate/updateEffortMechanism?sessionId=" +req.session.id +"&solId="+req.body.solId+"&solAreaId="+req.body.solAreaId+"&useProvidedEfforts=1";
		console.log("qString>>"+qString);
		request.post(qString,{  },
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log('updateEffortMechanism REST invoked : ',body);
					}
					else{
						console.log('error happened in updateEffortMechanism REST called : ',error);
						console.log('updateEffortMechanism Response : ' + response.statusCode);
					}
				});
		res.send("OK");
	});

});

//Dirty logic Fix for #143
function setStaffingFlagDirty(req, res){
	console.log("*****Entered setStaffingFlagDirty *****  ");
	var updateStaffingQry=null;
	if(req.body.solId=== undefined)
			updateStaffingQry='update solution_basic_details_trx set is_staffing_dirty = 1 where SOL_ID = '+req.body.sol_id;
	else
		updateStaffingQry='update solution_basic_details_trx set is_staffing_dirty = 1 where SOL_ID = '+req.body.solId;

	console.log("*****setStaffingFlagDirty  updateStaffingQry  "+updateStaffingQry);
	var query = pool.query(updateStaffingQry, function(err, updateRes) {	
		if(err){
			console.log("Error in updating is_staffing "+ err);
		}
		
	});
}

//setting is_Estimation Flag as dirty for #143
function setEstimationFlagDirty(solId, solAreaID){
	console.log("*****Entered setEstimationFlagDirty *****  ");
	var updateEstimationQry=null;
	//if(solId= undefined)
		updateEstimationQry='update solution_area_details_trx set is_estimation_dirty= 1 where SOL_ID = '+solId+' and sol_area_id= '+solAreaID;
	/*else
		updateStaffingQry='update solution_basic_details_trx set is_staffing_dirty = 1 where SOL_ID = '+req.body.solId;*/

	console.log("*****setStaffingFlagDirty  updateEstimationQry  "+updateEstimationQry);
	var query = pool.query(updateEstimationQry, function(err, updateRes) {	
		if(err){
			console.log("Error in updating is_Estimation "+ err);
		}
		
	});
}
//getting staffing Dirty
app.get('/checkIsStaffingDirty', ensureAuthenticated, function(req, res) {
	console.log("**Inside checkIsStaffingDirty***");
	var solId=req.query.solId;//req.body.solId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sql="select is_staffing_dirty from solution_basic_details_trx where SOL_ID ="+solId;
		console.log("sql -- "+sql);
		var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
					
			if(result[0].is_staffing_dirty==0){
				console.log("staffing file is NOT dirty ");
				res.send(true);
			}
			else if(result[0].is_staffing_dirty==1){
				console.log("staffing file is  dirty ");
				res.send(false);
			}
		});
		connection.release();
	});
});

//changing service line to ADMI if only AMS oppy
function updateServiceLineInfo(solId){
	console.log("\n\n\n\n Inside updateServiceLineInfo: ");
	var amsExist=false,nonAmsExist=false;
	var amsArray=[168,169,170];
	var sl_id=1;
	var query = pool.query("select Sol_area_id from solution_area_details_trx where sol_id="+solId , function(err, solResult) {
		if(err) {
			console.log(err);
		}
		console.log("updateServiceLineInfo "+JSON.stringify(solResult));
		if(solResult.length>0){
			for (var i = 0; i <solResult.length ; i++) {
				console.log("\n\n\n\n solResult: "+solResult[i].Sol_area_id);
				if(amsArray.indexOf(solResult[i].Sol_area_id)>=0)
					amsExist=true;
				else
				    nonAmsExist=true;
			}
			console.log("\n\n\n\n amsExist: "+amsExist+" nonAmsExist "+nonAmsExist);
			if(amsExist==true && nonAmsExist==false){
				sl_id=2;
			}else{
				sl_id=1;
			}
			var sqlupdate = "update solution_basic_details_trx set sl_id ="+sl_id+" where sol_id="+solId;
			console.log("\n\n\n\n sqlupdate: "+sqlupdate);
		    var query = pool.query(sqlupdate, function(err, solResult) {
				if(err) {
					console.log(err);
				}
				console.log("successfully updated solution_basic_details_trx with new service line ADMI");
			});
		}
		
	});
	
	
	
}

app.post('/resetSolAreaStaffing', ensureAuthenticated, function(req, res) {
	console.log("****Inside resetSolAreaStaffing *****");
	
	if(req.session.user) {
		var solId= req.body.solId;
		var sol_area_id= req.body.solAreaId;
		var testSolId= req.body.testSolId;
		setStaffingFlagDirty(req,res);
		//console.log("sol_area_id "+sol_area_id+ " testSolId " +testSolId);
		
		/*var qStr = 'select * from  solution_area_details_trx where sol_status="COMPLETE" and SOL_ID='+req.body.solId+' and Sol_area_id='+sol_area_id;
		console.log("qStr: "+qStr);
		var query = pool.query(qStr, function(err, result) {
			if (err){
					//connection.release();
					console.log(err);
					}	
			
					if(result.length>0){
						if(testSolId=='Y' &&(!sol_area_id==constants.SAPAriba || !sol_area_id==constants.IBMUnica))
							var url= "http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+sol_area_id+'&nfrType=performance';
						else 
							var url= "http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+sol_area_id;
							
							console.log("url in resetSolAreaStaffing "+url);
							setTimeout(function() {
								request.post(url,{  },
									function (error, response, body) {
										if (!error && response.statusCode == 200) {
											res.send("OK");
											//connection.release();
										}
										else {
											console.error("Error !!! in staffing generation in resetSolAreaStaffing"+error);
										}
									}
								);
							}, 300);	
							//res.send("OK");
					}
				});*/	
		res.send("OK");
	}
	else { 
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
	}
	
	
});	


function getAddlParamInfo(req, res){
	var addlParamQuery = "SELECT apm.ADDNL_PARAM_ID, apm.ADDNLPARAM_INPUT_TYPE, apm.IS_PARAM_MANDATORY_UI, apm.ADDNLPARAM_UPPER_LMT, apm.ADDNLPARAM_LOWER_LMT, apm.ADDNLPARAM_CELL_NO, sapm.SUB_ADDNL_PARAM_ID, sapm.SUB_ADDNLPARAM_INPUT_TYPE, sapm.IS_SUB_PARAM_MANDATORY_UI, sapm.SUB_ADDNLPARAM_UPPER_LMT, sapm.SUB_ADDNLPARAM_LOWER_LMT, apm.ADD_DECIMAL_PLACES, sapm.SUB_ADD_DECIMAL_PLACES FROM SOL_AREA_ADDNLPARAM_MASTER apm LEFT JOIN SOL_AREA_SUB_ADDNLPARAM_MASTER sapm ON apm.ADDNL_PARAM_ID = sapm.ADDNL_PARAM_ID WHERE apm.SOL_AREA_ID = " + post.SOL_AREA_ID +" ORDER BY apm.SHEET_ORDER, apm.ADD_LABEL_ORDER,sapm.SUB_ADD_LABEL_ORDER";
	connection.query(addlParamQuery, function(e, addlParamRes, fields){
		if (e) throw e;
		var prevParamId = 0;
		var subParamList = [];
		var param = null;
		var paramList = [];
		
		for(var i = 0; i < addlParamRes.length; i++){
			var record = addlParamRes[i];

			
			if(prevParamId !== 0 && prevParamId !== record.ADDNL_PARAM_ID){
				if(subParamList.length > 0){
					param.subParamList = subParamList;
				}
				paramList.push(param);
				param = null;
				subParamList = [];
			}
			
			if(!param || record.ADDNLPARAM_CELL_NO){
				param = {
					"addlParamId": record.ADDNL_PARAM_ID,
					"addlParamInputDataType": record.ADDNLPARAM_INPUT_TYPE || "",
					"addlParamIsMandatory": record.IS_PARAM_MANDATORY_UI || "",
					"addlParamUpperLimit": record.ADDNLPARAM_UPPER_LMT || "",
					"addlParamLowerLimit": record.ADDNLPARAM_LOWER_LMT || "",
					"addlDecimalPlace": record.ADD_DECIMAL_PLACES,
				};
			}

			if(!record.ADDNLPARAM_CELL_NO){
				var subParam = {
					"addSubParamId": record.SUB_ADDNL_PARAM_ID,
					"addlSubParamInputDataType": record.SUB_ADDNLPARAM_INPUT_TYPE,
					"addlSubParamIsMandatory": record.IS_SUB_PARAM_MANDATORY_UI,
					"addlSubParamUpperLimit": record.SUB_ADDNLPARAM_UPPER_LMT,
					"addlSubParamLowerLimit": record.SUB_ADDNLPARAM_LOWER_LMT,
					"addlSubDecimalPlace": record.SUB_ADD_DECIMAL_PLACES,
				};
				subParamList.push(subParam);
			}

			prevParamId = record.ADDNL_PARAM_ID;
		}
		paramList.push(param);

		console.log('Param JSON : ' + JSON.stringify(paramList));
								
		res.send(paramList);
	});	
}




function processNextAvailableSolArea(req, res){
	//check for next available sol_area in solutionDetails Page 	
	var solId= req.body.solId;
	var post = req.body;
	var useCaseInfoType = post.useCaseInfoType;
	var testSolId = post.testSolId;
	var soakTestId=post.soakTestId;
	var testFlagId = post.testFlagId;
	var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and use_provided_efforts=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
	console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
	var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
	if (err) {
		console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
				throw err;	
	}
	console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
	console.log("isedit:::::::::---"+post.isedit);
			
	if(resultSolAreaId.length > 0)	{
		var currentSolAreaId = resultSolAreaId[0].sol_area_id;	
		console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
		var sqlQuery;
		if(currentSolAreaId === constants.SAPAriba){
					//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;
		}
		else{
				//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id,uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;	
				sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id,uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;	
		}
		console.log("sqlQuery ::::::::: "+sqlQuery);
		var query = pool.query(sqlQuery, function(err, solAreaResult) {
			if (err) throw err;	
			console.log("new currentSolAreaId ::::::::: 0000000000000000000000000000000000000000000000000000000000000000000000000 "+currentSolAreaId);
			if(solAreaResult.length > 0) {
				//console.log("solAreaResult.sol_area_id:::::::>>>"+solAreaResult.sol_area_id);
				if(currentSolAreaId ==constants.SIInterfaces){
					res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
				} else if(currentSolAreaId ==constants.AnalyticsSPSS){
					var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
					var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
						if (err) {
							console.log("error while execution of sqlDefaultValues select  query"); 
							throw err;	
						}
						res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
					});								
				} else if(currentSolAreaId ==constants.SIAdapters){
						res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
				} else {
						if(useCaseInfoType == 1){
							res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
						} else{
							res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
						}										
				}	
			}
			else {
					console.log(" +++++  No result and forward to solution details page");
					console.log("4");
					var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.opportunity_id,solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
					var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
						if (err) {
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
							throw err;	
						}
						var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
						connection.query(screenFieldQry, function(error, scrnFldRes, fields){
							if(error){
								throw error;
							}
							var screenField = {};
							for(var i = 0; i < scrnFldRes.length; i++){
								var rec = scrnFldRes[i];
								console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
								if(rec.IS_USE_CASES_VIEW_HIDDEN){
									if(i===0){
										screenField["isUsecaseHidden"] = 1;
									}
									screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isUsecaseHidden;
								}
								if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
									if(i===0){
										screenField["isPerfTestHidden"] = 1;
									}
									screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isPerfTestHidden;
								}
								if(rec.IS_MODEL_HIDDEN){
									if(i===0){
										screenField["isModelHidden"] = 1;
									}
									screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
								}
								else{
									delete screenField.isModelHidden;
								}
								if(rec.IS_SPRINT_WEEKS_HIDDEN){
									if(i===0){
										screenField["isSprintWeeksHidden"] = 1;
									}
									screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isSprintWeeksHidden;
								}
							}
							
							var priceSubmitStatus;
							sqlQuery = "SELECT DATE_FORMAT(PRICING_REQUEST_TIMESTAMP, '%D %M %Y  at  %h:%m:%s') as time  FROM staffing_estimates where sol_id = "+SOL_ID;	
								sqlpriceSubmitStatus = pool.query(sqlQuery, function(err, priceSubmitDate){
									if (err) {
											console.log("error while executionapp msg"); 
											console.log(err);	
									}
									if(typeof priceSubmitDate[0] !== 'undefined' && priceSubmitDate[0] !== null) {
										if(priceSubmitDate[0].time == null || priceSubmitDate[0].time == "") {
												priceSubmitStatus = "The costing request yet to be submitted!";
										} else {
												priceSubmitStatus = "The last costing request was submitted on - "  + priceSubmitDate[0].time + " CDT";
										}
					
									} else {
										priceSubmitStatus = "The costing request not yet submitted";
									}
									console.log("screenField : ");
									console.log(screenField);
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,'priceSubmitStatus':priceSubmitStatus,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
							});
						});
					});

				}
		});
	}
	else {
//		
		 }


});//end of 189 select
	
}

function checkValidSolAreaForPerf(solAreaId){
	console.log("*****Entered checkValidSolAreaForPerf *****  ");
	var sqlQuery="select USE_CASE_COMPLEXITY from industry_use_cases_master where sol_area_id="+ solAreaId;
	console.log("*****sqlQuery  "+sqlQuery);
	var query = pool.query(sqlQuery, function(err, result) {	
		if(err){
			console.log("Error in updating is_staffing "+ err);
		}
		if(result){
			console.log("*****result  "+result);
			if(result.USE_CASE_COMPLEXITY===999 ||result.USE_CASE_COMPLEXITY===0)
				return false;
			else
				return true;
		}
		else 
			return false;
		
	});
}

app.post('/saveAMSInfo', ensureAuthenticated, function(req, res) {
	console.log("*****Entered method saveAMSInfo*****\n\n");
	if(req.session.user) {
		var fname = req.body.fname;
		var lname = req.body.lname;

		console.log('Request Body : ');
		console.log(req.body);
		
		var CREATED_BY = getCreatedBy(req.session.user.emailAddress);
		var solAreaId=req.body.SOL_AREA_ID;
		var solId= req.body.solId;
		var sqlAMSInsertQuery ;
		var ams_years=req.body.amsyears;
		var startWeek=req.body.startWeek;
		/*var app_admin_percent=req.body.app_admin;
		var batch_release_percent=req.body.batch_release;
		var preventive_maint_percent=req.body.prev_maint;
		var standby_percent=req.body.standy_buffer;
		var cross_skill_percent=req.body.cross_skill;
		var testing_percent=req.body.testing;*/
		
		var productivity_percent=req.body.productivity;
		var transition_months=req.body.transitions;
		var startTransitionDate=req.body.startTransitionDate;
	
		var amsValJson = JSON.parse(req.body.amsValJson);
		console.log("amsValJson=="+req.body.amsValJson);
		var sqlAMSDeleteQuery ;
		var counter = 0;
		
		var productivityPercent1=req.body.productivityPercent1;
		var productivityPercent2=req.body.productivityPercent2;
		var productivityPercent3=req.body.productivityPercent3;
		var productivityPercent4=req.body.productivityPercent4;
		var productivityPercent5=req.body.productivityPercent5;
		var non_ticket_percent= req.body.nonTicketingActPercent;
		
		if(req.body.productivityPercent1==undefined)
			productivityPercent1=0;
		if(req.body.productivityPercent2==undefined)
			productivityPercent2=0;
		if(req.body.productivityPercent3==undefined)
			productivityPercent3=0;
		if(req.body.productivityPercent4==undefined)
			productivityPercent4=0;
		if(req.body.productivityPercent5==undefined)
			productivityPercent5=0;
		
		if(solAreaId ==constants.AMSTicketBased){
			var serviceRequest=req.body.serviceReq;
			var minorEnhancement=req.body.minorEnhancement;
			//sqlAMSInsertQuery = "insert into AMS_TKT_TRX  (SOL_ID, ams_tkt_type_id, tickets, num_ams_years,app_admin_percent,batch_release_percent, preventive_maint_percent, standby_percent, cross_skill_percent,testing_percent, productivity_percent,service_request,minor_enhancement,transition_months ) values" ;
			sqlAMSInsertQuery = "insert into AMS_TKT_TRX  (SOL_ID, ams_tkt_type_id, tickets, num_ams_years,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,service_request,minor_enhancement,transition_months,non_ticket_percent ) values" ;
			
			
			for (var j = 0; j < amsValJson.entries.length ; j++) {
				console.log("amsValJson::"+amsValJson);
				var workstream = amsValJson.entries[j].workstream;
				var skill = amsValJson.entries[j].skill;
				var noOfIncidents = amsValJson.entries[j].noOfIncidents;
				
				
				if(counter > 0)
					sqlAMSInsertQuery = sqlAMSInsertQuery + ",";
				
				sqlAMSInsertQuery = sqlAMSInsertQuery + "(" + solId + ", (select id from AMS_TKT_MASTER where workstream='"+ workstream+"' and tech_area='"+skill+"')," + 
										noOfIncidents + ","+ ams_years +","+productivityPercent1+","+productivityPercent2+","+productivityPercent3+","+productivityPercent4+","+productivityPercent5+","+serviceRequest+"," + minorEnhancement + "," +transition_months+","+non_ticket_percent+")";
				
				counter++;
				
			}
			
			console.log("sqlAMSInsertQuery ---------------  "+sqlAMSInsertQuery);
			sqlAMSDeleteQuery = "delete from AMS_TKT_TRX where sol_id="+solId;
		
		}
		else if(solAreaId ==constants.AMSResourceBased){
			var activeUsers=req.body.activeUsers;
			var usrRaiseTkt=req.body.usrRaiseTkt;
			var yoyActiveUsers=req.body.yoyActiveUsers;
			var perUsrRaiseSr=req.body.perUsrRaiseSr;
			var avgHrsOnSr=req.body.avgHrsOnSr;
			var perMinorEnhancement=req.body.perMinorEnhancement;
			var avgHrsOnMinorEnhancement=req.body.avgHrsOnMinorEnhancement;
			//var l15Support=req.body.l15Support;
			var l15Support=0;
			var l2Support=req.body.l2Support;
			var l3Support=req.body.l3Support;
			
			sqlAMSInsertQuery = "insert into AMS_RES_TRX  (SOL_ID,num_ams_years,num_active_users,perc_users_raising_tkts,perc_yoy_active_users_incr,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,L1_5_tkts,L2_tkts,L3_tkts) values" ;
			
			sqlAMSInsertQuery = sqlAMSInsertQuery + "(" +solId+","+ams_years+","+activeUsers+","+usrRaiseTkt+","+yoyActiveUsers+","+perUsrRaiseSr+","+avgHrsOnSr + ","+perMinorEnhancement+","+avgHrsOnMinorEnhancement+","+productivityPercent1+","+productivityPercent2+","+productivityPercent3+","+productivityPercent4+","+productivityPercent5+","+non_ticket_percent+","+l15Support+","+l2Support+","+l3Support+")";
			sqlAMSDeleteQuery = "delete from AMS_RES_TRX where sol_id="+solId;	
			
		}
		else if(solAreaId ==constants.AMSProductBased){
			var includeComponent=req.body.includeComponent;
			var l15Support=req.body.l15Support;
			var l2Support=req.body.l2Support;
			var l3Support=req.body.l3Support;
			
			if(includeComponent=='Y'){
				includeComponent=1;
			}
			else
				includeComponent=0;
			sqlAMSInsertQuery = "insert into AMS_PRD_TRX  (SOL_ID, dcut_efforts, complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent ,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent) values" ;
			
			
			for (var j = 0; j < amsValJson.entries.length ; j++) {
				console.log("amsValJson::"+amsValJson);
				var component = amsValJson.entries[j].component;
				var dcutEffort = amsValJson.entries[j].dcutEffort;
				var adjustedEfforts = amsValJson.entries[j].adjustedEfforts;
				var justification = amsValJson.entries[j].justification;
				var complexity = amsValJson.entries[j].complexity;
				var complexityPercent=amsValJson.entries[j].complexityPercent;
				if(counter > 0)
					sqlAMSInsertQuery = sqlAMSInsertQuery + ",";
				
				sqlAMSInsertQuery = sqlAMSInsertQuery + "(" +solId+","+dcutEffort+",'"+complexity+"',"+adjustedEfforts+",'"+justification+"','" +component+"',"+ams_years+","+includeComponent+","+productivityPercent1+","+productivityPercent2+","+productivityPercent3+","+productivityPercent4+","+productivityPercent5+","+non_ticket_percent+","+l15Support+","+l2Support+","+l3Support+","+complexityPercent+")";
				
				counter++;
				
			}
			
			
			
			sqlAMSDeleteQuery = "delete from AMS_PRD_TRX where sol_id="+solId;	
		}	
		
		
		setEstimationFlagDirty(solId,solAreaId);
		pool.query(sqlAMSDeleteQuery, function(err, sqlAMSDeleteQueryResult) {	
			if(err){
				console.log("error while deleting old values for soln Id "+solId); 
				throw err;	
			}
			console.log("--------------- after deleting "+sqlAMSDeleteQuery);
			
			console.log("++++++++++++++++++++++++++ final sqlAMSInsertQuery::  "+sqlAMSInsertQuery);
			var query = pool.query(sqlAMSInsertQuery, function(err, solResult) {
				console.log("after executing sqlAMSInsertQuery Query : - ");
				if (err) {
					console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
					throw err;	
				}
				var startWeekSql="Update solution_area_details_trx set Flex_Field_3="+startWeek+" where sol_id="+solId+" and sol_area_id="+solAreaId ;
				var query = pool.query(startWeekSql, function(err, startResult) {
					console.log("after entering start week  startWeekSql Query : - "+startWeekSql);
					if (err) {
						console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
						throw err;	
					}
				
						//now invoke the ixm REST Service to do AMS Estimation
						setTimeout(function() {
							var javaRequest = "http://"+serviceURL+"/estimate/request?sessionId="+req.session.id+"&solId="+solId+"&solAreaId="+solAreaId ;
							request.post(javaRequest,{  },
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									console.log("Processed submit of AMS Request successfully for solId: " + solId);
								}//end of if(!error && response.statusCode == 200)
								
							}//end of function 
						);
					}, 300);//end of timeout
					
					processNextAvailableSolArea(req,res);
					setStaffingFlagDirty(req,res);
				});
			}); //insert
		});		//delete				
	
		
	}
	else { 
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
	}
});


app.post('/saveWatsonInfo', ensureAuthenticated, function(req, res) {
	console.log("*****Entered method saveWatsonInfo*****\n\n");
	if(req.session.user) {
		console.log('Request Body : ');
		console.log(req.body);
		
		var CREATED_BY = getCreatedBy(req.session.user.emailAddress);
		var solAreaId=req.body.SOL_AREA_ID;
		var solId= req.body.solId;
		
		var Use_Case_Count=req.body.use_case_count;
		var complexity=req.body.complexity;

		var iwIVR=req.body.iwIVR;	
		var iSpeechtext=req.body.iSpeechtext;
		var iTextSpeech=req.body.iTextSpeech;
		var iVoiceGtw=req.body.iVoiceGtw;	
		var legacyDataExp=req.body.legacyDataExp;		
		var mlModels=req.body.mlModels;	
		var orchINL=req.body.orchINL;			
		var orchILegacyEnv=req.body.orchILegacyEnv;			
		var routeLiveAgt=req.body.routeLiveAgt;		
		var successMt=req.body.successMt;
		var unstrDataExp=req.body.unstrDataExp;
		var uiICMS=req.body.uiICMS;						
		var uiISM=req.body.uiISM;			
		var uiCustom=req.body.uiCustom;
		
		
		var sqlInsertQuery = "insert into WACA_ESTIMATES  (sol_id, Use_Case_Count, complexity_id,iwIVR,iSpeechtext,iTextSpeech,iVoiceGtw,legacyDataExp,mlModels,orchINL,orchILegacyEnv,routeLiveAgt,successMt,unstrDataExp,uiICMS,uiISM,uiCustom ) values (" +solId+","+Use_Case_Count+","+complexity+","+iwIVR+","+iSpeechtext+","+iTextSpeech+","+iVoiceGtw+","+legacyDataExp+","+mlModels+","+orchINL+","+orchILegacyEnv+","+routeLiveAgt+","+successMt+","+unstrDataExp+","+uiICMS+","+uiISM+","+uiCustom+")";
		var sqlDeleteQuery = "delete from WACA_ESTIMATES where sol_id="+solId;
		
		
		
		setEstimationFlagDirty(solId,solAreaId);
		pool.query(sqlDeleteQuery, function(err, sqlDeleteQueryResult) {	
			if(err){
				console.log("error while deleting old values for soln Id "+solId); 
				throw err;	
			}
			console.log("--------------- after deleting "+sqlDeleteQueryResult);
			
			console.log("++++++++++++++++++++++++++ final sqlInsertQuery::  "+sqlInsertQuery);
			var query = pool.query(sqlInsertQuery, function(err, solResult) {
				if (err) {
					console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
					throw err;	
				}
				setTimeout(function() {
							var javaRequest = "http://"+serviceURL+"/estimate/request?sessionId="+req.session.id+"&solId="+solId+"&solAreaId="+solAreaId ;
							request.post(javaRequest,{  },
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									console.log("Processed Request successfully for solId: " + solId);
								}//end of if(!error && response.statusCode == 200)
								
							}//end of function 
						);
					}, 300);//end of timeout
					
				processNextAvailableSolArea(req,res);
				setStaffingFlagDirty(req,res);
				
			}); //insert
		});		//delete				
	
		
	}
	else { 
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
	}
});

app.get('/getAMSWorkstreamDetail', ensureAuthenticated, function(req, res) {
	console.log("***** Entered getAMSWorkstreamDetail**************");
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		console.log("connection>>"+config.database.connectionString.database);
		
		var query = pool.query('select id,workstream,tech_area from AMS_TKT_MASTER' , function(err, result) {	
			console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

//yet to implement
function processEstimation(req,res){
	console.log("************* Processing Estimation*************");			
	 setTimeout(function() {
			request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						
						var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
						console.log("sqlSolAreaId:::::::"+sqlSolAreaId);
						var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
							if (err) {
								console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
								throw err;	
							}
							console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
							console.log("isedit:::::::::---"+post.isedit);
							
							if(resultSolAreaId.length <= 0)	{
								if(testSolId=='Y'){
									setTimeout(function() {
										request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId=0&nfrType=performance',{  },
										function (error, response, body) {}
										);
									}, 300);
									} 
								}
						});
					}//end of success if for success from java
					else
						console.log("Error in calling estimate for solId = "+solId+" with solAreaId = "+solAreaId);
				}
			);
		}, 300);//end of settimeout
}


//processes solutionArea and finds the next incomplete solution area to process for estimation  
//yet to implement
function processSolutionArea(req, res) {
    
	console.log('Request Object : ');
	console.log(req.session.user);
        
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) {
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);

		var post = req.body;
		var solutionAreaInfo = [];
        
		//calling estimate
		processEstimation(req,res);
		
        //Looking for next available incomplete Solution Area 
        var sql = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and use_provided_efforts=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
		console.log("Sql:::::::"+sql);
		var sqlSolAreaIdDetails = pool.query(sql, function(err, resultSolAreaId){
			if (err) {
				console.log("++++++++++++++++++++++++++ Error in sqlSolAreaId query exectued ");			
				throw err;	
			}
			console.log("resultSolAreaId.length:::::::"+resultSolAreaId.length);
			console.log("isedit:::::::::---"+post.isedit);
			
			if(resultSolAreaId.length > 0)	{
				
				var currentSolAreaId = resultSolAreaId[0].sol_area_id;	
				console.log("NEW currentSolAreaId  "+currentSolAreaId);
				console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
				var sqlQuery;
				console.log("constants.SAP-Ariba **********"+constants.SAP-Ariba); 
				if(currentSolAreaId === constants.SAPAriba){
					//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;
				}
				else{
					//sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id,uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;	
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id,uc_master.IS_ALWAYS_INSCOPE, sol_area.sol_area_name, " + post.INDUS_ID + " as indus_id, (select indus_name from industry_info where indus_id = " + post.INDUS_ID + ") as indus_name, uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and (uc_master.indus_id="+post.INDUS_ID+" or uc_master.indus_id=101) and uc_master.sol_area_id="+currentSolAreaId;	
				}
				console.log("sqlQuery ::::::::: "+sqlQuery);
				var query = pool.query(sqlQuery, function(err, solAreaResult) {
					if (err) 
						throw err;	
					if(solAreaResult.length > 0) {
						if(currentSolAreaId ==constants.SIInterfaces){
							res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
						} 
						else if(currentSolAreaId ==constants.AnalyticsSPSS){
							var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
							var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
								if(err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
							});								
						}else if(currentSolAreaId ==constants.DatawareHouse){														
							//var sqlDatawareHouseValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from dw_details spssd order by spssd.id asc";
							var sqlDatawareHouseValues = "select dwd.id, dwd.title, dwd.is_optional, IFNULL((select complexity_id from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from dw_estimations where group_id=dwd.id and sol_id="+solId+"), dwd.effort) as effort, IFNULL((select count(*) from dw_estimations where group_id=dwd.id and sol_id="+solId+"), 0) as selected from dw_details dwd order by dwd.id asc";
							var defValuesQuery = pool.query(sqlDatawareHouseValues, function(err, sqlDatawareHouseValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								
								console.log("Page is ##### getDataWarehouseUseCaseInfo.html");
								res.render('getDataWarehouseUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDatawareHouseValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
							});	
						} else if(currentSolAreaId ==constants.WatsonCustomerAssist){
							//var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id from WACA_ESTIMATES where sol_id="+post.solId;
							var sqlDefaultValues = "select count(*), sol_id, IFNULL((Use_Case_Count),0) as Use_Case_Count, IFNULL((complexity_id), 1 ) as complexity_id,IFNULL((iwIVR), 1 ) as iwIVR,IFNULL((iSpeechtext), 1 ) as iSpeechtext,IFNULL((iTextSpeech), 1 ) as iTextSpeech,IFNULL((iVoiceGtw), 1 ) as iVoiceGtw,IFNULL((legacyDataExp), 1 ) as legacyDataExp,IFNULL((mlModels), 1 ) as mlModels,IFNULL((orchINL), 1 ) as orchINL,IFNULL((orchILegacyEnv), 1 ) as orchILegacyEnv,IFNULL((routeLiveAgt), 1 ) as routeLiveAgt,IFNULL((successMt), 1 ) as successMt,IFNULL((unstrDataExp), 1 ) as unstrDataExp,IFNULL((uiICMS), 1 ) as uiICMS,IFNULL((uiISM), 1 ) as uiISM,IFNULL((uiCustom), 1 ) as uiCustom from WACA_ESTIMATES where sol_id="+post.solId;
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getWatsonCustomerAssistInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getWatsonCustomerAssistInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}else if(currentSolAreaId ==constants.SIAdapters){
							res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
						}else if(currentSolAreaId ==constants.AMSTicketBased){
							var sqlDefaultValues = "select sol_id,ams_master.workstream,ams_master.tech_area,tickets,num_ams_years,	prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,service_request,minor_enhancement,transition_months from AMS_TKT_TRX ams_trx ,AMS_TKT_MASTER ams_master where ams_master.id=ams_trx.ams_tkt_type_id and sol_id= "+solId;
							
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}else if(currentSolAreaId ==constants.AMSResourceBased){
							var sqlDefaultValues = "select sol_id,num_active_users,perc_yoy_active_users_incr,perc_users_raising_tkts,perc_users_raising_sr,avg_sr_hrs,perc_users_raising_me,avg_me_hrs,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5,non_ticket_percent,transition_months,num_ams_years,L1_5_tkts,L2_tkts,L3_tkts from AMS_RES_TRX where sol_id="+solId;
							
							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSResourceUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						}
						else if(currentSolAreaId ==constants.AMSProductBased){
							var sqlDefaultValues = "select sol_id,dcut_efforts,complexity,adjusted_fte,justification, func_component, num_ams_years,is_include_component,prod_yr1,prod_yr2,prod_yr3,prod_yr4,prod_yr5 ,non_ticket_percent,L1_5_tkts_percent,L2_tkts_percent,L3_tkts_percent,complexityPercent from AMS_PRD_TRX where sol_id="+solId;

							console.log("sqlDefaultValues >>"+sqlDefaultValues);
							var defValuesQuery = pool.query(sqlDefaultValues, function(err, sqlDefaultValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								console.log("sqlDefaultValuesQResults:: "+sqlDefaultValuesQResults);
								console.log("Page is ##### getAMSUseCaseInfo.html "+typeof sqlDefaultValuesQResults);
								if (sqlDefaultValuesQResults.length === 0)
									res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
								else 
									res.render('getAMSProductUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});											
							
							});	
						} 
						else {
							if(useCaseInfoType == 1){
								res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
							} else{
								res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
							}										
						}	
					}
					else {
						console.log(" No use case exist for estimation ,forwarding to solution details page");
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope,solution_basic_details_trx.opportunity_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								throw err;	
							}
							var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+post.solId+"'";
							connection.query(screenFieldQry, function(error, scrnFldRes, fields){
								if(error){
									throw error;
								}
								var screenField = {};
								for(var i = 0; i < scrnFldRes.length; i++){
									var rec = scrnFldRes[i];
								console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
								if(rec.IS_USE_CASES_VIEW_HIDDEN){
									if(i===0){
										screenField["isUsecaseHidden"] = 1;
									}
									screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isUsecaseHidden;
								}
								if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
									if(i===0){
										screenField["isPerfTestHidden"] = 1;
									}
									screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isPerfTestHidden;
								}
								if(rec.IS_MODEL_HIDDEN){
									if(i===0){
										screenField["isModelHidden"] = 1;
									}
									screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
								}
								else{
									delete screenField.isModelHidden;
								}
								if(rec.IS_SPRINT_WEEKS_HIDDEN){
									if(i===0){
										screenField["isSprintWeeksHidden"] = 1;
									}
									screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
								}
								else{
									delete screenField.isSprintWeeksHidden;
								}
							}
							console.log("Success and passing the control to solutionDetails Page."); 
							res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id, "screenField":screenField});
						});
					});//end of sql
				  }//end of else
				});//end of finding new solArea ID
			}
			else 
				console.log("For solId "+solId+" No More Solution Area exists after "+post.SOL_AREA_ID+" Exiting  ");
		
		});//end of Looking for next available incomplete Solution Area 
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
};


app.post('/saveSharedUserEmail', ensureAuthenticated, function(req, res) {
	var emailList=req.body.emailList;
	var solId=req.body.solId;
	var ownerId=req.body.ownerId;
	var newAddEmailList=req.body.addEmailList;
	var removeEmailList=req.body.removeEmailList;
	
	
	
	console.log("************* Inside saveSharedUserEmail***** ");
	console.log("newAddEmailList "+newAddEmailList);
	console.log("removeEmailList "+removeEmailList);
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		console.log("Deleting existing emails for "+solId);
		var query = pool.query('Delete FROM SHARED_OPTY_INFO where SOL_ID='+solId, function(err, result) {
			if(err){
				console.log("Delete did not happen for  "+solId); 
				throw err;	
			}
			console.log(JSON.stringify(result));
			
			
			var addRestApiUrl="http://"+serviceURL+"/notify/addUser";
			if(newAddEmailList!=undefined){
				console.log("calling add User**** "+addRestApiUrl);
				setTimeout(function() {
						request.post(addRestApiUrl, {json:{ 'solId': solId,'userList':newAddEmailList}},
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									console.log("Success calling add for solId = "+solId);
								}//end of success if for success from java
								else
									console.log("Error in calling add for solId = "+solId);
							}
						);
					}, 300);//end of settimeout
			}
			//sending mail for remove user 
			var removeRestAPiUrl="http://"+serviceURL+"/notify/removeUser";
			if(removeEmailList!=undefined){
				console.log("calling remove User**** "+removeRestAPiUrl);
				setTimeout(function() {
				request.post(removeRestAPiUrl, {json:{ 'solId': solId,'userList':removeEmailList}},
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Success calling remove for solId = "+solId);
						}//end of success if for success from java
						else
							console.log("Error in calling remove for solId = "+solId);
					}
				);
				}, 300);//end of settimeout
			}
			
			if(emailList!=undefined){
				var sqlInsertQuery = "Insert into SHARED_OPTY_INFO (SOL_ID,OWNER_ID,SHARED_WITH_ID )values"; 
				for (var i = 0; i < emailList.length; i++) {
					if(i>0)	
						sqlInsertQuery = sqlInsertQuery +",";
					sqlInsertQuery =sqlInsertQuery +"("+solId+",'"+ownerId+"','"+emailList[i]+"')"
					
				}
				console.log("inserting share opty emails "+sqlInsertQuery);
				var query = pool.query(sqlInsertQuery, function(err, result) {
					//console.log(JSON.stringify(result));
					if(err){
						console.log("error while inserting emails address to SHARED_OPTY_INFO for "+solId); 
						throw err;	
					}
					res.send(result);
					connection.release();
				});
			}else{
				res.send(result);
				connection.release();
			}
			
		});//end of Delete query
		
		
		
		
	});
});

app.get('/getShareUserEmail/:solId', ensureAuthenticated, function(req, res) {
	var solId=req.params.solId;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var shareSqlQuery = "select SHARE_ID, SOL_ID,CREATION_DATE,OWNER_ID,SHARED_WITH_ID,EDIT_RIGHTS from SHARED_OPTY_INFO where SOL_ID="+solId;	
		console.log("shareSqlQuery "+shareSqlQuery);
		var query = pool.query(shareSqlQuery, function(err, result) {
			//console.log("email from db "+JSON.stringify(result));
			
			var emailList = [];
			for (var i = 0; i < result.length; i++) {
				var userEmailObj = {};
				userEmailObj['OWNER_ID'] = result[i].OWNER_ID;
				userEmailObj['SHARED_WITH_ID'] = result[i].SHARED_WITH_ID;
				userEmailObj['EDIT_RIGHTS'] = result[i].EDIT_RIGHTS;
				emailList.push(userEmailObj);
			}
			
			console.log("userEmailObj from db "+JSON.stringify(emailList));
			
			res.send(emailList);
			connection.release();
		});
		
	});
});


//getting startweek
app.get('/getStartWeek', ensureAuthenticated, function(req, res) {
	console.log("**Inside getStartWeek***");
	var solId=req.query.solId;
	var solAreaId=req.query.solAreaId;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sql="select Flex_Field_3 as startWeek from solution_area_details_trx where SOL_ID ="+solId+" and Sol_area_id="+solAreaId;
		console.log("sql -- "+sql);
		var query = pool.query(sql, function(err, resultSolAreaId) {
			if (err) {
				//connection.release();
				throw err;
			}
			
			res.send(resultSolAreaId);		
			
		});
		connection.release();
	});
});

app.post('/getprodCalculatorPage', ensureAuthenticated, function(req, res) {
	console.log("**** getprodCalculatorPage*****");
	var prodObj = new Object();
	prodObj.solId=req.body.solId;
	prodObj.industryId=req.body.industryId;
	prodObj.solAreaId=req.body.solAreaId;
	prodObj.optyName=req.body.optyName;
	res.render('productivityCalculator',{'productivityObj':prodObj});	
		
});
	

app.get('/getCalProductivity', ensureAuthenticated, function(req, res) {
	console.log("**Inside getCalProductivity***");
	var solId=req.query.solId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sql="select ID,LEVER_DESC,YR1_IMPACT_CALC,YR2_IMPACT_CALC,YR3_IMPACT_CALC,YR4_IMPACT_CALC,YR5_IMPACT_CALC,YR1_IMPACT_APPLIED,YR2_IMPACT_APPLIED,YR3_IMPACT_APPLIED,YR4_IMPACT_APPLIED,YR5_IMPACT_APPLIED,ONE_TIME_COST,TOTAL_RECURRING_COST from PRODUCTIVITY_LEVERS where SOL_ID="+solId;
		console.log("sql -- "+sql);
		var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			
			res.send(result);		
			
		});
		connection.release();
	});
});


app.get('/getAppProductivityLevers', ensureAuthenticated, function(req, res) {
	console.log("**Inside getCalProductivity***");
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sql="select ID,LEVER_DESC,IMPACT_YR1,IMPACT_YR2,IMPACT_YR3,IMPACT_YR4,IMPACT_YR5,APPLICABILITY from PRODUCTIVITY_LEVERS ";
		console.log("sql -- "+sql);
		var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			
			res.send(result);		
			
		});
		connection.release();
	});
});


app.get('/getAMSTotalFte', ensureAuthenticated, function(req, res) {
	console.log("**Inside getAMSTotalFte***");
	var solId=req.query.solId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sql="select AMS_FTE_DIST.L1_FTE as FTE_L1_EST, AMS_FTE_DIST.L2_FTE as FTE_L2_EST, AMS_FTE_DIST.L3_FTE as FTE_L3_EST, AMS_FTE_DIST.SR_FTE as FTE_MINOR_ENH_EST, AMS_FTE_DIST.ME_FTE as FTE_MAJOR_ENH_EST, APC.SOL_ID, APC.FTE_TOTAL, APC.PRODUCTIVITY_CALC_DONE, APC.APPLIED_PRODUCTIVITY_ESTIMATED, APC.TEST_FTE, APC.FTE_L1, APC.FTE_L2, APC.FTE_L3, APC.FTE_MINOR_ENH, APC.FTE_MAJOR_ENH, APC.CLIENT_MATURITY, APC.CONTRACT_DURATION, APC.DA_TOOL, APC.BLUEPRISM_DEPLOY_MODEL, APC.DRI_ON_PRIM, APC.AQL_LOCATION, APC.AGILE_COACH_LOCATION, APC.OTFA_COMBO, APC.AMS_DEVOPS, APC.AD_DEVOPS, APC.NEXTGEN_ADM_DEVFACTORY, APC.CAST_APPS, APC.FTE_ONSHORE_PERCENT, APC.FTE_NEARSHORE_PERCENT, APC.FTE_OFFSHORE_PERCENT, APC.PROD_FINAL_APPLIED_YR1, APC.PROD_FINAL_APPLIED_YR2, APC.PROD_FINAL_APPLIED_YR3, APC.PROD_FINAL_APPLIED_YR4, APC.PROD_FINAL_APPLIED_YR5 from AMS_PROD_CALCULATION APC, AMS_FTE_DIST where APC.SOL_ID=AMS_FTE_DIST.SOL_ID AND APC.SOL_ID="+solId;
		console.log("sql -- "+sql);
		var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			console.log(" result "+JSON.stringify(result));
			res.send(result);		
			
		});
		connection.release();
	});
});

app.get('/getAMSYears', ensureAuthenticated, function(req, res) {
	console.log("**Inside getAMSTotalFte***");
	var solId=req.query.solId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		
		//find ams type
		var sql = "select Sol_area_id from solution_area_details_trx where Sol_area_id in (168,169,170) and SOL_ID=" + solId; 
		var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			console.log(" result "+JSON.stringify(result));
			//based on ams type query appropriate table to get the ams years
			
			var Sol_area_id = result[0].Sol_area_id;
			var tableName = "";
			if(Sol_area_id ==constants.AMSTicketBased){
				tableName="AMS_TKT_TRX";
			}else if(Sol_area_id ==constants.AMSResourceBased){
				tableName="AMS_RES_TRX";
			}else if(Sol_area_id ==constants.AMSProductBased){
				tableName="AMS_PRD_TRX";
			}
			
			var sql2 = "select distinct(num_ams_years) from " + tableName + " where sol_id="+solId;
			var query = pool.query(sql2, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			console.log(" result -"+JSON.stringify(result));
			
			res.send(result);		
			});
		});
		connection.release();
	});
});

//for testing purpose
/*app.post('/savefirstProdCalculator', function(req, res) {
	console.log("**Inside savefirstProdCalculator***");

	if(req.session.user) {
		var fname = req.body.fname;
		var lname = req.body.lname;

		console.log('Request Body : ');
		console.log(req.body);
		
		var CREATED_BY = getCreatedBy(req.session.user.emailAddress);
		var solAreaId=req.body.SOL_AREA_ID;
		var solId= req.body.solId;
		var contractDuration=req.body.contractDuration;
		//now invoke the ixm REST Service to calculate productivity
		setTimeout(function() {
					var initiateproductivitycalcRequest = "http://"+serviceURL+"/estimate/initiateproductivitycalc?sessionId="+req.session.id+"&solId="+solId+"&solAreaId="+solAreaId ;
					console.log("calling *** http://"+serviceURL+"/estimate/initiateproductivitycalc?sessionId="+req.session.id+"&solId="+solId+"&solAreaId="+solAreaId);
					request.post(initiateproductivitycalcRequest,{  },
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Processed AMS initiateproductivitycalcRequest successfully for solId: " + solId);
						
						}//end of if(!error && response.statusCode == 200)
						//res.sendStatus(response.statusCode);
					}//end of function 
				);
		}, 300);//end of timeout
		res.render('productivityCalculatorExtra',{'solId':solId,'solAreaId':solAreaId,'optyName':req.body.optyName,'amsYears':contractDuration/12});	
			
	
	}
	else { 
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
	}
	
});*/

app.post('/savefirstProdCalculator', ensureAuthenticated, function(req, res) {
	console.log("**Inside savefirstProdCalculator***");

	if(req.session.user) {
		var fname = req.body.fname;
		var lname = req.body.lname;

		console.log('Request Body : ');
		console.log(req.body);
		
		var CREATED_BY = getCreatedBy(req.session.user.emailAddress);
		var solAreaId=req.body.SOL_AREA_ID;
		var solId= req.body.solId;
		
		var sqlAMSInsertQuery ;
		var TestFte=req.body.TestFte;
		var l1_5Fte=req.body.l1_5Fte;
		var l2Fte=req.body.l2Fte;
		var l3Fte=req.body.l3Fte;
		var minorEnhancementFte=req.body.minorEnhancementFte;
		var majorEnhancementFte=req.body.majorEnhancementFte;
		var totalFte=req.body.calTotalFTE;//totalUserFte;
		
		var l1_5Dist=req.body.l1_5Dist;
		var l2Dist=req.body.l2Dist;
		var l3Dist=req.body.l3Dist;
		var minorEnhancementDist=req.body.minorEnhancementDist;
		var majorEnhancementDist=req.body.majorEnhancementDist;
		
		var clientMaturity=req.body.clientMaturity;
		var contractDuration=req.body.contractDuration;
		var daTool=req.body.daTool;
		var deploymentModel=req.body.deploymentModel;
		var isDri=req.body.isDri;
		var aqlLoc=req.body.aqlLoc;
		var agileLoc=req.body.agileLoc;
		var isCtdOtfaCombo=req.body.isCtdOtfaCombo;
		var useDevops=req.body.useDevops;
		var useAD=req.body.useAD;
		var useNextGenAdm=req.body.useNextGenAdm;
		var appForCast=req.body.appForCast;
		
		
		var sqlAMSDeleteQuery ;
		var counter = 0;
		
		var serviceRequest=req.body.serviceReq;
		var minorEnhancement=req.body.minorEnhancement;
		
		sqlAMSInsertQuery = "Update AMS_PROD_CALCULATION set SOL_AREA_ID="+solAreaId+", TEST_FTE="+TestFte+", FTE_L1="+l1_5Fte+", FTE_L2="+l2Fte+", FTE_L3="+l3Fte+", FTE_MINOR_ENH="+minorEnhancementFte+",FTE_MAJOR_ENH="+majorEnhancementFte
								+",CLIENT_MATURITY='"+clientMaturity+"',DA_TOOL='"+daTool+"',BLUEPRISM_DEPLOY_MODEL='"+deploymentModel
								+"',DRI_ON_PRIM="+isDri+",AQL_LOCATION='"+aqlLoc+"',AGILE_COACH_LOCATION='"+agileLoc+"',OTFA_COMBO="+isCtdOtfaCombo+",AMS_DEVOPS="+useDevops+",AD_DEVOPS="+useAD
								+",NEXTGEN_ADM_DEVFACTORY="+useNextGenAdm+",CAST_APPS="+appForCast+" where SOL_ID="+solId;

		console.log("++++++++++++++++++++++++++ final sqlAMSInsertQuery::  "+sqlAMSInsertQuery);
		var query = pool.query(sqlAMSInsertQuery, function(err, solResult) {
		console.log("after executing sqlAMSInsertQuery Query : - ");
		if (err) {
			console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
			throw err;	
		}
				//now invoke the ixm REST Service to calculate productivity
				setTimeout(function() {
							var initiateproductivitycalcRequest = "http://"+serviceURL+"/estimate/initiateproductivitycalc?sessionId="+req.session.id+"&solId="+solId+"&solAreaId="+solAreaId ;
							console.log("calling *** http://"+serviceURL+"/estimate/initiateproductivitycalc?sessionId="+req.session.id+"&solId="+solId+"&solAreaId="+solAreaId);
							request.post(initiateproductivitycalcRequest,{  },
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									console.log("Processed AMS initiateproductivitycalcRequest successfully for solId: " + solId);
								}//end of if(!error && response.statusCode == 200)
								
							}//end of function 
						);
				}, 300);//end of timeout
					
				//processNextAvailableSolArea(req,res);
				setStaffingFlagDirty(req,res);
				res.render('productivityCalculatorExtra',{'solId':solId,'solAreaId':solAreaId,'optyName':req.body.optyName,'amsYears':contractDuration/12});	
			}); //insert
	
	
		
	}
	else { 
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
	}
	
});

app.post('/saveSecondProdCalculator', ensureAuthenticated, function(req, res) {
	console.log("**Inside saveSecondProdCalculator***");
	console.log("Entered saveSecondProdCalculator method");
	if(req.session.user) {
	/*	
		console.log('Request Body : ');
		console.log(req.body);*/
		var amsValJson = JSON.parse(req.body.amsValJson);
		console.log("amsValJson=="+req.body.amsValJson);
		
		var CREATED_BY = getCreatedBy(req.session.user.emailAddress);
		var solAreaId=req.body.solAreaId;
		var solId= req.body.solId;
		//solId=2891;
		var sqlAMSInsertQuery ;
		var counter = 0;
		
		for (var j = 0; j < amsValJson.entries.length ; j++) {
			var id = amsValJson.entries[j].id;
			var leverDesc = amsValJson.entries[j].leverDesc;
			var impactAppYr1 = amsValJson.entries[j].impactAppYr1;
			var impactAppYr2 = amsValJson.entries[j].impactAppYr2;
			var impactAppYr3 = amsValJson.entries[j].impactAppYr3;
			var impactAppYr4 = amsValJson.entries[j].impactAppYr4;
			var impactAppYr5 = amsValJson.entries[j].impactAppYr5;
			var oneTimeCost = amsValJson.entries[j].oneTimeCost;
			var totalRecCost = amsValJson.entries[j].totalRecCost;
			
			sqlAMSInsertQuery ="Update PRODUCTIVITY_LEVERS set YR1_IMPACT_APPLIED="+impactAppYr1+", YR2_IMPACT_APPLIED="+impactAppYr2+", YR3_IMPACT_APPLIED="+impactAppYr3+", YR4_IMPACT_APPLIED="+impactAppYr4+",YR5_IMPACT_APPLIED="+impactAppYr5
			+",ONE_TIME_COST="+oneTimeCost+",TOTAL_RECURRING_COST="+totalRecCost+" where SOL_ID="+solId+" and ID="+id;

			//console.log("++++++++++++++++++++++++++ final sqlAMSInsertQuery::  "+sqlAMSInsertQuery);
			var query = pool.query(sqlAMSInsertQuery, function(err, solResult) {
					console.log("after executing sqlAMSInsertQuery Query : - ");
					if (err) {
						console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
						throw err;	
					}
					
					
				}); //udpate
			
		}
		console.log("Inside saveSecondProdCalculator method, Invoking productivitycalcfinalRequest");
				//now invoke the ixm REST Service to apply productivity
		setTimeout(function() {
					var productivitycalcfinalRequest = "http://"+serviceURL+"/estimate/productivitycalcfinal?sessionId="+req.session.id+"&solId="+solId+"&solAreaId="+solAreaId ;
					request.post(productivitycalcfinalRequest,{  },
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log("Processed AMS productivitycalcfinalRequest successfully for solId: " + solId);
						} else{
							console.log("response.statusCode: " + response.statusCode);
							console.log("productivitycalcfinalRequest: " +productivitycalcfinalRequest);
						}//end of if(!error && response.statusCode == 200)
						
					}//end of function 
				);
		}, 300);//end of timeout
		getSolutionDetailsPage(req,res);
		//res.render('productivityCalculatorExtra',{'solId':solId,'optyName':req.body.optyName});	
			
	}
	else { 
		sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
		sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
			if (err) {
				console.log("error while executionapp msg"); 
				console.log(err);	
			}
			console.log("appMsg >>>>>> "+sqlQuery+"\n");
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
		});
	}
	
});

app.post('/checkProductivityStatus', ensureAuthenticated, function(req, res) {
	console.log("*** Inside /checkProductivityStatus ******");
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		var post = req.body;
		var solId= post.solId;

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			
			var sqlQuery = "select PRODUCTIVITY_CALC_DONE from AMS_PROD_CALCULATION where sol_id="+solId;
			console.log("sqlQuery::>>"+sqlQuery);
			var query = pool.query(sqlQuery, function(err, sqlQueryResult) {
					console.log("sqlQueryResult::>>"+JSON.stringify(sqlQueryResult));
					if(sqlQueryResult[0].PRODUCTIVITY_CALC_DONE>0){
						res.send("YES");
					}
					else
						{
						 res.send("NO");
						}
				
					
			});
			connection.release();
		});
	}
	else { sqlQuery = "SELECT msg_id, msg_type, msg_desc, seq FROM app_msg order by seq";	
	sqlAppMsg = pool.query(sqlQuery, function(err, appMsg){
		if (err) {
			console.log("error while executionapp msg"); 
			console.log(err);	
		}
		console.log("appMsg >>>>>> "+sqlQuery+"\n");
		console.log(JSON.stringify(appMsg));
		res.render('login', {'appMsg':appMsg });	
	}); }
});

function getSolutionDetailsPage(req,res){
	console.log(" +++++  getSolutionDetailsPage - forward to solution details page");
	var solAreaId=req.body.solAreaId;
	var solId= req.body.solId;
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_basic_details_trx.opportunity_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name, IFNULL(solution_area_details_trx.Flex_Field_4, 0) as totalEfforts from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
		var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
			if (err) {
				console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
				throw err;	
			}
			
			var screenFieldQry = "SELECT sai.Sol_area_id, sai.Sol_area_Name, sai.IS_USE_CASES_VIEW_HIDDEN, sai.IS_PERF_TEST_IN_SCOPE_HIDDEN, sai.IS_MODEL_HIDDEN, sai.IS_SPRINT_WEEKS_HIDDEN FROM solution_area_info sai, solution_area_details_trx sadt WHERE sai.Sol_area_id = sadt.Sol_area_id AND sadt.SOL_ID = '"+solId+"'";
			connection.query(screenFieldQry, function(error, scrnFldRes, fields){
					if(error){
						throw error;
					}
					var screenField = {};
					for(var i = 0; i < scrnFldRes.length; i++){
						var rec = scrnFldRes[i];
					console.log("IS_USE_CASES_VIEW_HIDDEN : " + rec.IS_USE_CASES_VIEW_HIDDEN);
					if(rec.IS_USE_CASES_VIEW_HIDDEN){
						if(i===0){
							screenField["isUsecaseHidden"] = 1;
						}
						screenField["usecaseMsg"] = screenField.usecaseMsg||"" + "Only one use case level view available for " + rec.Sol_area_Name;
					}
					else{
						delete screenField.isUsecaseHidden;
					}
					if(rec.IS_PERF_TEST_IN_SCOPE_HIDDEN){
						if(i===0){
							screenField["isPerfTestHidden"] = 1;
						}
						screenField["perfTestMsg"] = screenField.perfTestMsg||"" + "Performance test not available for " + rec.Sol_area_Name;
					}
					else{
						delete screenField.isPerfTestHidden;
					}
					if(rec.IS_MODEL_HIDDEN){
						if(i===0){
							screenField["isModelHidden"] = 1;
						}
						screenField["modelMsg"] = screenField.modelMsg||"" + rec.Sol_area_Name + " supports waterfall method only ";
					}
					else{
						delete screenField.isModelHidden;
					}
					if(rec.IS_SPRINT_WEEKS_HIDDEN){
						if(i===0){
							screenField["isSprintWeeksHidden"] = 1;
						}
						screenField["sprintweeksMsg"] = screenField.sprintweeksMsg||"" + "Sprint weeks not considered for " + rec.Sol_area_Name;
					}
					else{
						delete screenField.isSprintWeeksHidden;
					}
				}
				console.log("screenField : ");
				console.log(screenField);
				
				console.log("Page is ##### solutionDetails.html");
				res.render('solutionDetails', {'isedit' : true, 'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"sid":req.session.id, "screenField":screenField,"errorMessage":"AMS Productivity has been successfully submitted for calculation" });
			});
		});
		connection.release();
	});
}


app.get('/IsAppliedProdEstimated', ensureAuthenticated, function(req, res) {
	console.log("**Inside IsAppliedProdEstimated***");
	var solId=req.query.solId;//req.body.solId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		//var sql="select FTE_TOTAL,APPLIED_PRODUCTIVITY_ESTIMATED, sbdt.SOLUTION_TYPE_ID from AMS_PROD_CALCULATION, solution_basic_details_trx sbdt where sbdt.SOL_ID ="+solId;
		var sql = "select FTE_TOTAL,APPLIED_PRODUCTIVITY_ESTIMATED, sbdt.SOLUTION_TYPE_ID from AMS_PROD_CALCULATION join solution_basic_details_trx sbdt where AMS_PROD_CALCULATION.SOL_ID = " + solId + " and AMS_PROD_CALCULATION.SOL_ID = sbdt.SOL_ID";
		console.log("sql -- "+sql);
		var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			if(result.length>0)
			{	
				res.send(result);
			}
		});
		
		/*var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			if(result.length>0)
			{		
				if(result[0].APPLIED_PRODUCTIVITY_ESTIMATED==0){
					console.log("Productivity not applied ");
					res.send(false);
				}
				else if(result[0].APPLIED_PRODUCTIVITY_ESTIMATED==1){
					console.log("Productivity is applied ");
					res.send(true);
				}
			}
		});*/
		connection.release();
	});
});

app.get('/checkSCIDExists', ensureAuthenticated, function(req, res) {
	console.log("**Inside checkSCIDExists***");
	var scid=req.query.scid;//req.body.solId;
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sql="select count(*) as count from solution_basic_details_trx WHERE opportunity_id ='"+scid+"'";
		console.log("sql -- "+sql);
		var query = pool.query(sql, function(err, result) {
			if (err) {
				//connection.release();
				throw err;
			}
			
			res.send(result);
		});
		connection.release();
	});
});