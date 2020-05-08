var express = require('express');
var app = express();
var request=require('request');
var swig = require('swig');
var dns = require('dns');
var https = require('https');
var http = require('http');
var util = require('util');
var timeoutLength = 600000;



var user = {
	emp_fname: String,
	emp_emailid: String
};

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
	'Download_Response_Outcome':15
};   

//var path = require('path');
//var serviceURL = "http://ixm-solution-advisor-api.stage1.mybluemix.net";
//var serviceURL = "http://localhost:8080/ixm";
var ip = require('ip');
var ipAddress = ip.address();
var sess;
var log4js = require('log4js');
log4js.configure('ixm_log4js_config.json', { reloadSecs: 3600 });
var logger = log4js.getLogger('file_logger');
logger.setLevel('OFF');



var serviceURL = "http://"+ipAddress+":8080/ixm";

/*
dns.lookup("ixm-sol-adv-server", function onLookup(err, address, family) {
	if(err) {
		console.log("Error looking up host ixm-sol-adv-server:"+err);
		return;
	}
	ipAddress = address;
	serviceURL = "http://" + ipAddress + ":8080/ixm";
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

var pool = mysql.createPool({
	connectionLimit : 100, // important
	host : 'localhost',
	user : 'scott',
	password : 'Sc0tty!xm',
	database : 'soladvisor',
	debug : false
});

var session = require('express-session');

var MySQLStore = require('express-mysql-session');

var MemoryStore = session.MemoryStore;
var sessionStore = new MemoryStore();

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
//In session.destroy release the db connection 
app.use(session({
		 key: 'soladv_app',	
		 secret: 'anystringoftext',
         saveUninitialized: true,
         store: sessionStore,
         resave: true}));


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
						connection.release();
						throw err;	
					}
					console.log("Just after session logging: " +sessionResult );
					
					sessionStore.destroy(clientSessionId);
				//res.render('login');
				logger.info('Exiting route /logout');				
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
	
	res.render('login');


});

app.post('/logout', function(req, res) {
	logger.info('Entered route /logout');
	var post = req.body;
	var timeSaved= post.timeSaved;
	var timeSavedIn  = post.timeSavedIn;
	
	console.log("--------------");
	console.log(typeof timeSaved === "undefined");
	console.log(timeSavedIn+post.closeBtn);
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
					
					var sessionUpdateQuery = "update session_master set user_perception='"+totalTime+"' where session_id='"+req.session.id+"'";
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
								connection.release();
								throw err;	
							}
							console.log("Just after session logging: " +sessionResult );
						});	
						req.session.destroy();
					}						
					
						res.render('login');
						logger.info('Exiting route /logout');				
						

				});
	
});

app.post('/captureRequirements', function(req, res) {


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
				
					var sessionQuery = "insert into session_log (session_id, event_type) values ('"+req.session.id +"',"+ event.Initiate_Solution  +")";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							connection.release();
							throw err;	
						}
					});	
				});	
		res.render('captureRequirements', {'user' : req.session.user, "serviceLineInfo":req.body.serviceLineInfo});
	}
	else {
		res.render('login');
	}
});

app.get('/captureRequirements', function(req, res) {
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		res.render('captureRequirements', {'user' : req.session.user,"serviceLineInfo":req.body.serviceLineInfo});	
	}

	else {
		res.render('login');
	}
	
	
});

app.get('/captureRequirements1', function(req, res) {
	res.render('specify_requirement', {'user' : req.session.user});
});

/*
app.get('/getUseCaseInfo', function(req, res) {
	res.render('specify_requirement', {'user' : req.session.user});
});
*/

app.get('/d1', function(req, res) {
	res.render('d1', {'user' : req.session.user});
});

app.get('/test', function(req, res) {
	res.render('test', {'user' : req.session.user});
});



app.get('/advisorHome', function(req, res) {
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		console.log("++++++++++++++++++++ipAddress : "+ipAddress+"\n serviceURL : "+serviceURL);

	//	var sqlQuery = "select solution_basic_details_trx.sl_id, sl_name, count(1) num_of_solutions from solution_basic_details_trx , service_line_info where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"' and solution_basic_details_trx.sl_id = service_line_info.sl_id group by sl_id order by sl_id;";
		var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by='"+req.session.user.emp_emailid +"' group by sl_id order by sl_id;";
		//var sqlQuery = "select solution_basic_details_trx.sol_id, sl_name, customer_name from solution_basic_details_trx , service_line_info  where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"'and solution_basic_details_trx.sl_id = service_line_info.sl_id";
		console.log("++++++++++++++++++++sqlQuery : "+sqlQuery);
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
				res.render('advisorHome', {'user' : req.session.user,"solDashboardResult":solDashboardResult});

			});
			connection.release();
		});
	}
	else { res.render('login'); }

	
	//res.render('advisorHome', {'user' : req.session.user});
});


app.get('/users', function(req, res) {
	var list=[];
	for(var i=1;i<10;i++){
		list.push({'user' : req.session.user});
	}
	res.send(list);
});


app.post('/login', function(req, res) {
	console.log(JSON.stringify(req.body));
	res.render('advisorHome', {'user' : req.session.user});
});


app.post('/register', function(req, res) {
	console.log(JSON.stringify(req.body));
	res.render('advisorHome', {'user' : req.session.user});
});


app.post('/login', function(req, res) {
	console.log(JSON.stringify(req.body));
	res.render('login', {'user' : req.session.user});
});


app.get('/serviceLineInfo', function(req, res) {
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


app.get('/solutionAreaInfo/:id', function(req, res) {
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

app.get('/captureExistingSolInfo', function(req, res) {
	console.log(JSON.stringify(req.body));
	if(req.session.user) {
	 res.render('captureExistingSolInfo', {'user' : req.session.user});
	}
	else { res.render('login'); }

});

app.post('/getSolRequirements', function(req, res) {
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
					res.render('getSolRequirements', {'user' : req.session.user,"data":result,solutionAreaInfo:resultSolAreaInfo,"ipAddress":ipAddress,"sol_id":sol_id,"industryInfo":resultIndustryInfo, "sid":req.session.id});
				});
			});
			connection.release();
		});
	});

	}
	else { res.render('login'); }

});


app.post('/getSolAreaRequirements', function(req, res) {
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
			console.log('***************************** sol_id: '+solId );
		console.log('***************************** solAreaId: '+solAreaId );

		//console.log('body: ' + JSON.stringify(post));
		var sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id,  sol_area.sol_area_name,  indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name,sol_basic_details.sol_id,sol_basic_details.is_perf_test_in_scope as test_in_scope,sol_basic_details.is_soak_test_in_scope, complexity_master.complexity_title, sol_req_matrix.is_perf_test_in_scope from industry_use_cases_master indus_master, solution_requirement_matrix sol_req_matrix, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where indus_master.use_case_id = sol_req_matrix.use_case_id and sol_area.sol_area_id = indus_master.sol_area_id and sol_basic_details.indus_id = indus_info.indus_id and sol_basic_details.indus_id = indus_master.indus_id and sl_info.sl_id = sol_basic_details.sl_id and complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.sol_id = sol_req_matrix.sol_id and sol_req_matrix.sol_id = " +solId+ " and sol_area.sol_area_id ="+solAreaId;	
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
			var query = pool.query(sqlQuery, function(err, solRequirementResult) {
				if (err) throw err;	
				console.log(solRequirementResult);

				res.render('getSolRequirements', {'user' : req.session.user,"solRequirementResult":solRequirementResult,"ipAddress":ipAddress, "sid":req.session.id, "enbTestBtn":countVal});
			});
			connection.release();
		});
	}
	else { res.render('login'); }

});




app.post('/captureSolAreaUseCases', function(req, res) {
	
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
		
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			if(testSolId == 'Y'){
				var soak = 0;
				if(soakTestId == 'Y')
					soak = 1;
				var sqlUpdateQuery = pool.query("update solution_basic_details_trx set is_perf_test_in_scope = 1,is_soak_test_in_scope="+soak+" where sol_id = "+solId, function(err,resultUpdateUseCases) {
					if (err)  throw err;	
				});
				var sqlSelectQuery = "select sol_id,sol_area_id from solution_area_details_trx where sol_id="+solId+" and sol_area_id="+currentSolAreaId+ " and nfr_type=1";
				
				var selectQuery = pool.query(sqlSelectQuery, function(err, solAreaResultCheck) {
					if(solAreaResultCheck.length == 0){
						var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id,nfr_type) values("+solId+","+currentSolAreaId+",1)";
						var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query for Perf Test Estimation"); 
								throw err;	
							}
						});
					}
				});
			}
			if (useCaseInfoType==1){
				console.log(" ++++++Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);
				var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";	
				var query = pool.query(sqlQuery, function(err, solAreaResult) {
					if (err) throw err;	
					if(solAreaResult.length > 0) {
						console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getUseCaseInfo ");
						res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
						//Session logging info
						var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",1,'Success',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
						
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								connection.release();
								throw err;	
							}
						});//session logging ends here	
					}
					else {
						console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								throw err;	
							}
							console.log("Error no use cases."); 
							var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",0,'Failure: No use cases available',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
							console.log(sessionQuery);
							var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								connection.release();
								throw err;	
							}
							});//session logging ends here	
							res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
						});

					}
				});
			}
			else{
				console.log(" ***** Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);
				var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId;	
				var query = pool.query(sqlQuery, function(err, solAreaResult) {
					if (err) throw err;	
					if(solAreaResult.length > 0) {
						console.log(" ***** Inside captureSolAreaUseCases, Success and forward to captureSolAreaUseCases ");
						res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"ipAddress":ipAddress,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId});
						var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",1,'Success',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
						
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								connection.release();
								throw err;	
							}
						});//session logging ends here	

					}
					else {
						console.log(" ***** Inside captureSolAreaUseCases, No result and forward to solution details page");
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";

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
								connection.release();
								throw err;	
							}
							});//session logging ends here	 
							res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
						});

					}			
				});
			}
			connection.release();
		});
		
	}

	else { res.render('login'); }
}); 


app.post('/submitSolutionDetails', function(req, res) {
	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);

		var post = req.body;
		console.log(" Control is inside submitSolutionDetails() ");
	//	console.log('************* Solution Id ' + sqlSolId);
		var solutionAreaInfo = post.solutionAreaInfo;
		var sqlValidation= "select distinct industry_use_cases_master.sol_area_id, sol_area_info.sol_area_name,industry_info.indus_name from industry_use_cases_master, solution_area_info	sol_area_info, industry_info where sol_area_info.sol_area_id = industry_use_cases_master.sol_area_id and industry_info.indus_id = industry_use_cases_master.indus_id and industry_use_cases_master.indus_id = "+post.industryInfo+" order by sol_area_id";
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
					for (var j = 0; j <sqlValidResult.length ; j++) {	
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
					if(sqlIndusValidResult.length>0)
					{
						
						var errorMessage = "Ooooops !!! Use cases for ";
						for (var j = 0; j <sqlIndusValidResult.length ; j++) {	
							if (j>0)
								errorMessage = errorMessage +", ";
							errorMessage = errorMessage + sqlIndusValidResult[j].sol_area_name ;
						}
						errorMessage = errorMessage + " in "+industryName+" are currently unavailable in iXM Solution Advisor. Please deselect these solution areas to proceed further."
						
						var solAreaSelectedValue ="0";
					
						for (var i = 0; i <post.solutionAreaInfo.length ; i++) {
							solAreaSelectedValue = solAreaSelectedValue + ","+ solutionAreaInfo[i];
						}
				 		
				 		var sessionQuery = "insert into session_log (session_id, event_type, status_code,status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +",0,'"+errorMessage+"')";
					
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								connection.release();
								throw err;	
							}
						});	
						var sid2 = req.session.id;
						var timeOut2 = timeOutSidMap.get(sid);
						
						if(timeOut2) { 
							clearTimeout(timeOut2);
						}
						timeOut2 = setTimeout (handleTimeOut,timeoutLength,sid2 );
						timeOutSidMap.set(sid2, timeOut2); 

						res.render('captureRequirements', {'user' : req.session.user,"errorMessage":errorMessage,"serviceLineInfo":post.serviceLineInfo,"industryInfo":post.industryInfo, "clientName":post.clientName,"opportunityId":post.opportunityId,"deliveryCenterInfo":post.deliveryCenterInfo,"solAreaSelectedValue":solAreaSelectedValue});
					}
					else
					{
						var sqlSolId= "insert into solution_basic_details_trx  (sl_id,indus_id,proposed_delivery_center,opportunity_id,customer_name,created_by,business_language) values ("+post.serviceLineInfo+","+post.industryInfo+","+post.deliveryCenterInfo+",'"+post.opportunityId.trim()+"','"+post.clientName.trim()+"','" +req.session.user.emp_emailid +"','English')";
						var query = pool.query(sqlSolId, function(err, solResult) {
							console.log("sqlSolId Query : - "+sqlSolId);
							if (err) throw err;	
							var solId= solResult.insertId;//result[0].SOL_ID;
							var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id) values"; 
							for (var i = 0; i <post.solutionAreaInfo.length ; i++) {
								if(i>0)	
									sqlInsertQuery = sqlInsertQuery +",";				
								sqlInsertQuery =sqlInsertQuery +"("+solId+","+post.solutionAreaInfo[i]+")"
							}
							console.log("--------------- Select use cases Query "+sqlInsertQuery ); 
							
							var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
								if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query"); 
									throw err;	
								}
								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									console.log("Success and passing the control to submitSolutionDetails Page."); 
									//var sessionQuery = "insert into session_log (session_id, event_type, status_code,status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +")";
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +","+solDetailsInfo[0].sol_id+","+solDetailsInfo[0].sol_area_id+",1,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											connection.release();
											throw err;	
										}
									});	
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress, "sid":req.session.id});
					//				res.render('saveSolutionInfo', {SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
								});

								//Log session here

		
							});
						});
			}
				});
				connection.release();
			});
		});
	}
	else { res.render('login'); }
});


app.get('/getServiceLineSolutions', function(req, res) {
	
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


	//	var sqlQuery = "select solution_basic_details_trx.sol_id, sl_name, customer_name from solution_basic_details_trx , service_line_info  where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"'and solution_basic_details_trx.sl_id = '"+serviceId+"' and solution_basic_details_trx.sl_id = service_line_info.sl_id";

		var sqlQuery = "SELECT sol_area_trx.Seq_id seq_id,sol_details.sol_id, sl_name, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_id FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, service_line_info	sl_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and sl_name.sl_id= sol_details.sl_id and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0";
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
				res.render('serviceLineSolutions', {'user' : req.session.user,"solDashboardResult":solDashboardResult});

			});
			connection.release();
		});
	
	}
	else { res.render('login'); }

});


app.get('/getSolutionInfo', function(req, res) {
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
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"' and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
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
				console.log("Success and passing the control to getSolutionInfo() Page.");
				if(solDetailsInfo.length>0)
				{
					/*
					setTimeout(function() {
						request.post(serviceURL+'/estimate/request?sessionId='+req.session.id+'+solId='+searchSolId+"&solAreaId="+solDetailsInfo[0].SOL_AREA_ID,{  },
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
							connection.release();
							throw err;	
						}
					});//session logging ends here	
					
					var countVal;
					var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +searchSolId+" and is_perf_test_in_scope = 1", function(err, countResult) {
						if (err) {
							throw err;	
						}
						countVal = countResult[0].count;
						console.log("The count in get is -> "+countResult[0].count);
						res.render('displaySolutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress, "sid":req.session.id, "enbTestBtn":countVal});
					});
					
				}
				else {
					res.render('captureExistingSolInfo', {'user' : req.session.user,errorMessage:"There is no record for selected search parameters.","searchSolId":searchSolId,"opportunityId":opportunityId});
				}
				connection.release();
			});
		});
		}
	else { res.render('login'); }
});


app.post('/getSolutionInfo', function(req, res) {

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
			//var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"' and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"' and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
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
							connection.release();
							throw err;	
						}
					});//session logging ends here	
					var countVal=0;
					var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +searchSolId+" and is_perf_test_in_scope = 1", function(err, countResult) {
						if (err) throw err;	
						countVal = countResult[0].count;
						console.log("The count in post is -> "+countResult[0].count);
						res.render('displaySolutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress, "sid":req.session.id, "enbTestBtn":countVal});
					});
					
				}
				else {
					res.render('captureExistingSolInfo', {'user' : req.session.user,errorMessage:"There is no record for selected search parameters.","searchSolId":searchSolId,"opportunityId":opportunityId});
				}
				connection.release();
			});
		});
	}
	else { res.render('login'); }
});


app.post('/getSolutionArtifacts', function(req, res) {
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
						var javaRequest = serviceURL+"/estimate/request?sessionId="+req.session.id+"&solId="+post.searchSolId.trim()+"&solAreaId="+result[0].sol_area_id;
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
	else { res.render('login'); }
});


app.post('/saveSolutionUseCasesInfo', function(req, res) {

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
		var testFlagId = post.testFlagId;
		var currentSolAreaId = 0;
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
				//	if(testSolId=='Y' && testFlagId[i] == 1){
					if(testSolId=='Y' && (util.isArray(testFlagId) ? testFlagId[i] : testFlagId) == 1){
						testScope = 1;
					}
					if(i>0)	
						sqlInsertQuery = sqlInsertQuery +",";				
					sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId[i]+","+testScope+")";
				}
			}

			else {
					if(testSolId=='Y' && (util.isArray(testFlagId) ? testFlagId[i] : testFlagId) == 1){
						testScope = 1;
					}
				sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId+","+testScope+")";
			}


			console.log("Final use cases Insert Query : "+sqlInsertQuery);
			var querySaveUseCases = pool.query(sqlInsertQuery, function(err) {
				if (err) {
					console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
					throw err;	
				}
				console.log("++++++++++++++++++++++++++ Insert query exectued ");	
				
				var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
					if (err)  throw err;	
				});
				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +")";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							connection.release();
							throw err;	
						}
					});//session logging ends here	
					

				setTimeout(function() {
					request.post(serviceURL+"/estimate/request?sessionId='" +req.session.id +"'&solId="+solId+"&solAreaId="+post.SOL_AREA_ID,{  },
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'Success')";
								console.log(sessionQuery);
								var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
									if (err) {
										connection.release();
										throw err;	
									}
								});//session logging ends here	

								//res.render('saveSolutionInfo', {"data":result,SOL_ID:solId,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
								console.log(body);
								if(testSolId=='Y' && util.isArray(testFlagId) && testFlagId.length > 0){
									setTimeout(function() {
										request.post(serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
											function (error, response, body) {
												if (!error && response.statusCode == 200) {

													var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'Success')";
													console.log(sessionQuery);
													var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
														if (err) {
															connection.release();
															throw err;	
														}
													});//session logging ends here	
												//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
													console.log(body)
												}
												else {
													var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'" + error+"')";
													console.log(sessionQuery);
													var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
														if (err) {
															connection.release();
															throw err;	
														}
													});//session logging ends here	
												}
											}
										);
									}, 3000);
									}
							}
							else {
								var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'" + error+"')";
								console.log(sessionQuery);
								var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
									if (err) {
										connection.release();
										throw err;	
									}
								});//session logging ends here	
							}
						}
					);
				}, 3000);
				
				var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID;
				var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
					if (err) {
						console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
						throw err;	
					}
					if(resultSolAreaId.length > 0)	{
						
						currentSolAreaId = resultSolAreaId[0].sol_area_id;	
						console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
						var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.INDUS_ID+" and uc_master.sol_area_id="+currentSolAreaId;
						var query = pool.query(sqlQuery, function(err, solAreaResult) {
							if (err) throw err;	
							if(solAreaResult.length > 0) {
								console.log(" ***** Inside saveSolutionUseCasesInfo, Success and forward to getUseCaseInfo ");
								res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"ipAddress":ipAddress,"solId":post.solId,"useCaseInfoType":post.useCaseInfoType,"testSolId":testSolId});
								
							}
							else {
								console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									console.log("Success and passing the control to saveSolutionUseCasesInfo Page."); 
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
								});

							}
						});
					}
					else {
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								throw err;	
							}
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query----->"+solDetailsInfo[0].sol_status);
							res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"Selected use cases for "+ solDetailsInfo[0].sol_area_name+ " have been saved successfully.", "sid":req.session.id, "enbTestBtn":util.isArray(testFlagId) ?testFlagId.length:0});
						});					
					}



				});
			//	connection.release();
			});
		});
	}
	else { res.render('login'); }
});



app.post('/saveSolutionHLUseCasesInfo', function(req, res) {
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
		var testFlagId = post.testFlagId;
		var arr = new Array();
		var sqlQuery = "select use_case_id,reqsubcategoryid from industry_use_cases_master where indus_id="+post.INDUS_ID+" and sol_area_id ="+post.SOL_AREA_ID+" and reqsubcategoryid in (";
		if(util.isArray(useCaseId)) {	
			for (var i = 0; i <useCaseId.length ; i++) {
				if((util.isArray(testFlagId) ? testFlagId[i] : testFlagId) == 1){
					arr.push(useCaseId[i]);
				}
				
				if(i>0)	
					sqlQuery=sqlQuery+",";				
				sqlQuery=sqlQuery+useCaseId[i];
			}
			
		}
		else {
				if((util.isArray(testFlagId) ? testFlagId[i] : testFlagId) == 1){
					arr.push(useCaseId);
				}
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
					console.log("--------------- before the insert query ");
					
					var sqlInsertQuery = "insert into solution_requirement_matrix  (sol_id, use_case_id, is_perf_test_in_scope) values ";
					for (var j = 0; j <resultUseCasesList.length ; j++) {
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
						
						var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
							if (err)  throw err;	
						});
				/*	var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+")";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							connection.release();
							throw err;	
						}
					});//session logging ends here	
					*/
						setTimeout(function() {
							request.post(serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
								function (error, response, body) {
									if (!error && response.statusCode == 200) {
										var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",1,'Success')";
										console.log(sessionQuery);
										var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
											if (err) {
												connection.release();
												throw err;	
											}
										});//session logging ends here	
									//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
										console.log(body);
										if(testSolId=='Y' && arr.length > 0){
											setTimeout(function() {
												request.post(serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
													function (error, response, body) {
														if (!error && response.statusCode == 200) {
															//var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'Success')";
															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",1,'Success')";
															console.log(sessionQuery);
															var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																if (err) {
																	connection.release();
																	throw err;	
																}
															});//session logging ends here	
														//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
															console.log(body)
														}
														else {
															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'"+error+"')";
															console.log(sessionQuery);
															var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																if (err) {
																	connection.release();
																	throw err;	
																}
															});//session logging ends here	
														}
													}
												);
											}, 3000);
											}
									}//end of success if for success from java
									else {
										var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_High  +","+solId+","+post.SOL_AREA_ID+",0,'"+error+"')";
										console.log(sessionQuery);
										var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
											if (err) {
												connection.release();
												throw err;	
											}
										});//session logging ends here	
									}

								}
							);
						}, 3000);
						
						var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID;
						var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
							if (err) {
								console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
								throw err;	
							}
							if(resultSolAreaId.length > 0)	{
								
								var currentSolAreaId = resultSolAreaId[0].sol_area_id;	
								console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
								var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.INDUS_ID+" and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
								var query = pool.query(sqlQuery, function(err, solAreaResult) {
									if (err) throw err;	
									if(solAreaResult.length > 0) {
										console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo ");
										res.render('getHLUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":post.useCaseInfoType,"testSolId":testSolId});
									}
									else {
										console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
										var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
										var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
											if (err) {
												console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
												throw err;	
											}
											console.log("Success and passing the control to saveSolutionHLUseCasesInfo Page."); 
											res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
										});

									}
								});
							}
							else {
								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"Selected use cases have been saved successfully.", "sid":req.session.id, "enbTestBtn":arr.length});
								});					
							}




						});
					
					});
				//	connection.release();
				});
		});
	}
	else { res.render('login'); }
});






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
		console.log("======sqlLoginQuery  " +sqlLoginQuery );
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

				var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by='"+req.session.user.emp_emailid +"' group by sl_id order by sl_id;";
			//	console.log("userName----------" +sess.userName + "LoginResult" + loginResult);
				//var sqlQuery = "select solution_basic_details_trx.sol_id, sl_name, customer_name from solution_basic_details_trx , service_line_info  where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"'and solution_basic_details_trx.sl_id = service_line_info.sl_id"
				var query = pool.query(sqlQuery, function(err, solDashboardResult) {
					if (err) {
						connection.release();
						throw err;	
					}
					console.log(solDashboardResult);
					res.render('advisorHome', {"solDashboardResult":solDashboardResult,'loginResult': loginResult,'userName':req.body.userName, 'user':req.session.user});
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


app.post('/validateLoginBluePages', function(req, res) {

	
	var base64uid = req.body.userName.trim() + ":" + req.body.password.trim();
	var options = {

	  hostname: 'adikbservices.mybluemix.net',
	  method: 'GET',
	  auth: base64uid, 	
	  path: '/kbsso'

	};



	var httprequest = https.get(options, function(responseHttp) {
    
	console.log("We got some result--------"+ responseHttp.statusCode );

	if(responseHttp.statusCode===200) {



		var url = 'http://bluepages.ibm.com/BpHttpApisv3/slaphapi?ibmperson/(mail=' + req.body.userName.trim()+').list,printable/byjson'; 
    

		request({
		    url: url,
		    json: true
		}, function (error, response, body) {

		    if (!error && response.statusCode === 200) {
		    	sess=req.session;
		    	sess.user = user;
		    	req.session.user.emp_emailid = req.body.userName;

		    	for (var i = body.search.entry.length - 1; i >= 0; i--) {
		    		
		    	
		       
		        	for (var j = body.search.entry[i].attribute.length - 1; j >= 0; j--) {
		        	//	console.log("attribute ----" +JSON.stringify(body.search.entry[i].attribute[j].name) + " : "+ 
		        	//		JSON.stringify(body.search.entry[i].attribute[j].value[0]));

		        		if(body.search.entry[i].attribute[j].name === "givenname") {
		        			req.session.user.emp_fname = body.search.entry[i].attribute[j].value[0];
		        			console.log("Mail id: "+ req.session.user.emp_emailid );
		        			console.log("Given Name: "+ req.session.user.emp_fname );
		        		}
		        	}
		        }

		        pool.getConnection(function(err, connection) {
					if (err) {
						console
								.log("Error obtaining connection from pool: "
										+ err);
						connection.release();
						throw err;
					}
				
					var sessionQuery = "insert into session_master (session_id, user_email) values ('"+req.session.id +"','" + req.session.user.emp_emailid +"')";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							connection.release();
							throw err;	
						}
						console.log("Just after session logging: " +sessionResult );
									
					});		
					sessionQuery = "insert into session_log (session_id, event_type) values ('"+req.session.id +"',"+ event.Login+")";
					queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							connection.release();
							throw err;	
						}
						console.log("Just after session logging: " +sessionResult );
									
					});	
						

					var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by='"+req.session.user.emp_emailid +"' group by sl_id order by sl_id;";
					
						var query = pool.query(sqlQuery, function(err, solDashboardResult) {
							if (err) {
								connection.release();
								throw err;	
							}
							console.log(solDashboardResult);

							var sid = req.session.id;
							var timeOut = timeOutSidMap.get(sid);
							
							if(timeOut) { 
								clearTimeout(timeOut);
							}
							timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
							timeOutSidMap.set(sid, timeOut);
							res.render('advisorHome', {"solDashboardResult":solDashboardResult,'userName':req.body.userName, 'user':req.session.user});
						});
					
						
						

				//connection.release();	
					
				});
					


		    }
		    else {
		    	
		    	
				res.render('login', {errorMessage:"Some problem, please login again."});
			
		    }

		});
	}

	else {
		    	
		    	
		res.render('login', {errorMessage:"User credential are not verified. Please provide correct user name and password."});
			
	}
    
});

    


	
});



app.get('/getIndustryInfo', function(req, res) {
	var id=req.params.id;

		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			var query = pool.query("select indus_id,indus_name,indus_description from industry_info where indus_id in (7,12,15,18) order by indus_name", function(err, result) {
				console.log("+++++++++++result----" +JSON.stringify(result));
				res.send(result);
			});
		connection.release();
		});
});

app.get('/getDeliveryCenterInfo', function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select delivery_org_id,delivery_org_type, delivery_org_name from delivery_org_details_master order by delivery_org_id', function(err, result) {
		//	console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});


app.get('/Solution_Area_InfoSolution_Asusmptions_MASTER', function(req, res) {
	
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var query = pool.query('select * from solution_area_infosolution_asusmptions_master', function(err, result) {
	//	console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});


app.get('/Solution_Input_Details_TRX', function(req, res) {
	var query = pool.query('select * from solution_input_details_trx', function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});
});


app.get('/Solution_Requirement_Matrix', function(req, res) {
	
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


app.get('/Staffing_Plan_TRX', function(req, res) {
	
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





app.get('/doEstimation', function(req, res) {
	request.post(
    serviceURL+'/estimate/46' ,
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
/*
app.listen(appEnv.port, function() {

	// print a message when the server starts listening
 // console.log("server starting on " + appEnv.url);
}); 

*/
app.listen(appEnv.port, '0.0.0.0', function() {
//app.listen(9999, function() {
	// print a message when the server starts listening
	console.log("server starting on " + appEnv.url);
//	console.log("server starting on " + appEnv.bind);
	//var address = app.address();
	//console.log('opened server on : '+ address);
});

