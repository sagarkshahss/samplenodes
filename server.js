//  OpenShift sample Node application
var express = require('express'),
    app     = express();var express = require('express');
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

    var ip = require('ip');
    var ipAddress = ip.address();
    var sess;
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





    //Getting IOT and IMT information based on Country



    var appEnv = cfenv.getAppEnv();
    app.listen(config.port, '0.0.0.0', function() {

    	// print a message when the server starts listening
    	console.log("server starting on " + config.port + ", Rest API Url: " +serviceURL);

    });

    https.createServer(options, app).listen(config.httpsPort, '0.0.0.0', function() {

            // print a message when the server starts listening
                     console.log("Secure server starting on " + config.httpsPort + ", Rest API Url::::: " +serviceURL);
            
                     });                 




    function callUseCaseInfoEstimation(req, res, connection, indus_id){}



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





 
