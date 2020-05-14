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

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
//Start of OpenId Logic
app.get('/login', passport.authenticate('openidconnect', {}));

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
         saveUninitialized: false,
         store: sessionStore,
         resave: false}));

var forceSsl = require('express-force-ssl');
//app.use(forceSsl);

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
    	
    	http.get(url, (resp) => {
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
    			 user.emailAddress	='saket.k@ibm.com';
    			 req.session.user = user;
    			 console.log("::::::::::::-> user.emailAddress=="+user.emailAddress);
    			 req.session.claims = claims;
    			 req.session.userEmail=user.emailAddress;
    			 req.session.originalUrl = req.originalUrl;
    			 console.log("::::::::::::->"+util.inspect(req.session.user));
    			 //req.session.UsingSSO=true;
    			 req.session.UsingSSO=false;
    		     return callback(null, true);
    		  });

    		}).on("error", (err) => {
    			//return callback(new Error());		 
    		     return callback(null, true);
    		});
    };
    
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
			console.log(JSON.stringify(appMsg));
			res.render('login', {'appMsg':appMsg });	
			//return res.redirect('/login');
		})
	 //res.render('login.html');// This was just for testing.
});

app.get('/dash', function(req, res) {
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
			res.render('dashboard', {'appMsg':appMsg });	
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


/* Added By saket for dashboard Start Here*/

//app.get('/dashboard', ensureAuthenticated, handleDashboard);
app.get('/dashboard',ensureAuthenticated,function(req, res, next) {
	
	console.log('*** Entered route GET /dashboard **** \n'+req.session.user);

	
	var jsonObj = {};
	
	if((req.session.user)) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		consle.log("++++++++++++++Inside the Dashboard++++==");
	if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		
		req.session.user.emailAddress='saket.k@ibm.com';
		var post = req.body;
		//req.session.user.
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




/* Added by Saket for dashboard ends here */ 

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
