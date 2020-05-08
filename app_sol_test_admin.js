var express = require('express');
var app = express();
var request=require('request');
var swig = require('swig');
var dns = require('dns');
var https = require('https');
var http = require('http');
var util = require('util');
var timeoutLength = 6000000;
var dbutils = require('./public/js/dbutils');

var iotData = require('./public/data/map_data');

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
	'Download_Response_Outcome':15,
	'Edit_Opportunity' :16,
	'Initiate_Modification':17,
	'Edit_SolArea_Offset':18,
	'Edit_Sprint_Weeks':19,
	'Edit_Delivery_Model':20,
	'Save_Solution':21
};   

//var path = require('path');
//var serviceURL = "http://ixm-solution-advisor-api.stage1.mybluemix.net";
//var serviceURL = "http://localhost:8080/ixm";
var ip = require('ip');
var ipAddress = ip.address();
var sess;
var config = require('./config/configTest');
var log4js = require('log4js');
log4js.configure('ixm_log4js_config.json', { reloadSecs: 3600 });
var logger = log4js.getLogger('file_logger');
logger.setLevel('OFF');



var serviceURL = ipAddress+ config.restApiSubString; 
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
var session = require('express-session');

//var MySQLStore = require('express-mysql-session');

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
						//connection.release();
						console.log(err);
					}
					
					
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

app.get('/c-intg/:indusId', function(req, res) {
	var indusId=req.params.indusId;
	console.log("indusId: "+indusId);
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		//console.log("connection>>"+config.database.connectionString.database);
		
		//ju for now picking user-caseid for Banking
		//var query = pool.query('select (select use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id_system_3 and iucm.sol_area_id=105 and iucm.Indus_id=7) as usecaseId, id_system_1,id_system_2,id_system_3, num_simple, num_medium, num_complex, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_1) as name_1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_2) as name_2, (select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id_system_3 and iucm.sol_area_id=105) as name_3 from system_integration', function(err, result) {
		var query = pool.query('select  id_system_1,id_system_2,num_simple, num_medium, num_complex, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_1) as name_1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id_system_2) as name_2 from system_integration where industry_id=101 or industry_id='+indusId , function(err, result) {	
			//console.log(JSON.stringify(result));
			res.send(result);
		});
		connection.release();
	});
});

app.get('/mware-subcat/:indusId', function(req, res) {
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
		
		var selQuery = "select distinct ReqSubCategoryId, ReqSubCategory, use_case_id from industry_use_cases_master where Indus_id=" + indusId + " and Sol_area_id = (Select Sol_area_id from solution_area_info where Sol_area_Name='System Integration - Interfaces') order by ReqSubCategoryId ASC";
		console.log("selQuery: "+selQuery);
		var query = pool.query(selQuery, function(err, result) {
			console.log(JSON.stringify(result));
			res.send(result);
			connection.release();
		});
	});
});

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
				
			
					if (req.body.solutionId != -1) {
					//	var querySolutionDtls solutionId;
						//var sqlQuery = "select sol_id, indus_id, PROPOSED_DELIVERY_CENTER, opportunity_id, Customer_Name from solution_basic_details_trx where SOL_ID="+req.body.solutionId ;
						  // query modified for WorkItem #5215 Adding sales connect info pop up 
						  var sqlQuery = "select sol_id, indus_id, PROPOSED_DELIVERY_CENTER, opportunity_id, Customer_Name,smr_number,IFNULL(imt_id,0) as imt_id,IFNULL(iot_id,0) as iot_id,opportunity_owner_email, IFNULL(risk_rating, 0) as risk_rating from solution_basic_details_trx where SOL_ID="+req.body.solutionId ;
						  console.log("sqlQuery>>>>>>>>>>."+sqlQuery);
						var sqlSolutionDetails = pool.query(sqlQuery, function(err, solInfo){
						if (err) {
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
							console.log(err);	
						}
						console.log("solInfo.imt_id::::::::::::::::"+solInfo[0].imt_id);
						
							sqlQuery = "select sadt.Sol_area_id sol_area_id,  DATE_FORMAT(sadt.creation_date,'%d-%m-%Y') creation_date, sol_area_name from solution_area_details_trx sadt, solution_area_info sai where SOL_ID="+req.body.solutionId+" and nfr_type=0 and sadt.Sol_area_id = sai.Sol_area_id";	
							sqlSolutionDetails = pool.query(sqlQuery, function(err, solAreaDetails){
							if (err) {
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
								console.log(err);	
							}
							console.log(solAreaDetails);
					
							var sessionQuery = "insert into session_log (session_id, event_type,sol_id) values ('"+req.session.id +"',"+ event.Initiate_Modification  +","+req.body.solutionId+")";
							console.log(sessionQuery);
							var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								console.log(err);
							}
							});//session logging ends here	
							console.log(solInfo);
							res.render('editOpportunityDetails', {'user' : req.session.user, 'solInfo' :solInfo, 'solAreaDetails':solAreaDetails });	
				
						});
				
				
									
				});	
			}
	
		else {

				var sessionQuery = "insert into session_log (session_id, event_type) values ('"+req.session.id +"',"+ event.Initiate_Solution  +")";
				console.log(sessionQuery);
				var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
				if (err) {
						//connection.release();
						console.log(err);
					}
				});
				res.render('captureOpportunityDetails', {'user' : req.session.user});
			}	
			connection.release();
		});
		
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
	//	res.render('captureRequirements', {'user' : req.session.user,"serviceLineInfo":req.body.serviceLineInfo});	
		res.render('captureOpportunityDetails', {'user' : req.session.user,"serviceLineInfo":req.body.serviceLineInfo});	
	
	}

	else {
		res.render('login');
	}
	
	
});

app.get('/captureRequirements1', function(req, res) {
	res.render('specify_requirement', {'user' : req.session.user});
});

app.get('/d1', function(req, res) {
	res.render('d1', {'user' : req.session.user});
});

app.get('/test', function(req, res) {
	res.render('test', {'user' : req.session.user});
});



//app.get('/advisorHome', function(req, res) {
app.get('/OpportunityDashboard', function(req, res) {	
	if(req.session.user) {
		var sid = req.session.id;
		var timeOut = timeOutSidMap.get(sid);
		
		if(timeOut) { 
			clearTimeout(timeOut);
		}
		timeOut = setTimeout (handleTimeOut,timeoutLength,sid );
		timeOutSidMap.set(sid, timeOut);
		

	//	var sqlQuery = "select solution_basic_details_trx.sl_id, sl_name, count(1) num_of_solutions from solution_basic_details_trx , service_line_info where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"' and solution_basic_details_trx.sl_id = service_line_info.sl_id group by sl_id order by sl_id;";
		
		
		//ju var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by='"+req.session.user.emp_emailid +"' group by sl_id order by sl_id desc;";
		var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id group by sl_id order by sl_id desc;";
		
		
		
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
			//	res.render('advisorHome', {'user' : req.session.user,"solDashboardResult":solDashboardResult});
				res.render('OpportunityDashboard', {'user' : req.session.user,"solDashboardResult":solDashboardResult});
			});
			connection.release();
		});
	}
	else { res.render('login'); }

	
	//res.render('advisorHome', {'user' : req.session.user});
});

app.get('/dashboard', function(req, res) {	
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

		//ju sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id DESC";
		sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id DESC";
			
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

					console.log(solDashboardResult[i].sol_id);
					console.log(solDashboardResult[i].sol_area_name);
				}
				console.log(opportunityList);

				
				res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList});

			});
			connection.release();
		});
	
	}
	else { res.render('login'); }

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
	//res.render('advisorHome', {'user' : req.session.user});
	res.render('OpportunityDashboard', {'user' : req.session.user});
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

app.get('/solutionAreaForIndustry/:id', function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console
					.log("Error obtaining connection from pool: "
							+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = "SELECT SolArea.Sol_area_id sol_area_id,  SolArea.Sol_area_Name sol_area_name, count(*) uc_count FROM solution_area_info SolArea, industry_use_cases_master IndusUC where IndusUC.indus_id= " +id+" and SolArea.sol_area_id = IndusUC.sol_area_id group by IndusUC.sol_area_id having uc_count ";
		console.log(sqlQuery);
		var query = pool.query(sqlQuery, function(err, result) {
			console.log(JSON.stringify(result));
			res.send(result);
			connection.release();
		});
	});
});

app.get('/getSolutionAreaInfo', function(req, res) {
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
					res.render('getSolRequirements', {'user' : req.session.user,"data":result,solutionAreaInfo:resultSolAreaInfo,"serviceURL":serviceURL,"sol_id":sol_id,"industryInfo":resultIndustryInfo, "sid":req.session.id});
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
		
		var sqlQuery="";	
		
		if(solAreaId == 105){
			//sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id,  sol_area.sol_area_name,  indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name,sol_basic_details.sol_id,sol_basic_details.is_perf_test_in_scope as test_in_scope,sol_basic_details.is_soak_test_in_scope, complexity_master.complexity_title, sol_req_matrix.is_perf_test_in_scope, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech1) as tech1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech2) as tech2, esb_est.new_simple new_simple_complexity_count, esb_est.new_medium new_medium_complexity_count, esb_est.new_complex new_complex_complexity_count, esb_est.new_vcomplex new_very_complex_complexity_count from esb_integration_estimations esb_est, industry_use_cases_master indus_master, solution_requirement_matrix sol_req_matrix, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where esb_est.use_case_id = sol_req_matrix.use_case_id and esb_est.sol_id = sol_req_matrix.sol_id and indus_master.use_case_id = sol_req_matrix.use_case_id and sol_area.sol_area_id = indus_master.sol_area_id and sol_basic_details.indus_id = indus_info.indus_id and sol_basic_details.indus_id = indus_master.indus_id and sl_info.sl_id = sol_area.sl_id and complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.sol_id = sol_req_matrix.sol_id and sol_req_matrix.sol_id =" +solId+ " and sol_area.sol_area_id ="+solAreaId;
			sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id, sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id,  sl_info.sl_name, sol_basic_details.sol_id, sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope, sol_basic_details.is_perf_test_in_scope, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech1) as tech1, (select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = esb_est.tech2) as tech2, esb_est.new_simple new_simple_complexity_count, esb_est.new_medium new_medium_complexity_count, esb_est.new_complex new_complex_complexity_count, esb_est.new_vcomplex new_very_complex_complexity_count from esb_integration_estimations esb_est, industry_use_cases_master indus_master, industry_info indus_info, service_line_info sl_info, solution_basic_details_trx sol_basic_details, solution_area_info  sol_area where esb_est.sol_id = sol_basic_details.sol_id and indus_master.use_case_id = esb_est.use_case_id and  indus_info.indus_id = sol_basic_details.indus_id and sl_info.sl_id = sol_area.sl_id and sol_area.sol_area_id = " +solAreaId+ "   and sol_basic_details.sol_id =  "+solId ;
		} else if(solAreaId == 104){
			sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, 'System Integration Adapters Count' as use_case_description, sol_area.sol_area_id, sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name, sol_basic_details.sol_id, sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope, IFNULL((select SIMPLE from esb_adapters_estimations where SOL_ID=sol_basic_details.SOL_ID), '0') as simple_count, IFNULL((select MEDIUM from esb_adapters_estimations where SOL_ID=sol_basic_details.SOL_ID), '0') as medium_count, IFNULL((select COMPLEX from esb_adapters_estimations where SOL_ID=sol_basic_details.SOL_ID), '0') as complex_count from industry_use_cases_master indus_master, solution_requirement_matrix sol_req_matrix, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where sol_basic_details.indus_id = indus_info.indus_id and sol_area.sol_area_id = indus_master.sol_area_id and	complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.indus_id = indus_info.indus_id and sol_basic_details.indus_id = indus_master.indus_id and sl_info.sl_id = sol_area.sl_id and sol_basic_details.sol_id = " +solId+ " and sol_area.sol_area_id ="+solAreaId;
		} else if(solAreaId == 21){
			sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id,  sol_area.sol_area_name, indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name,sol_basic_details.sol_id,sol_basic_details.is_perf_test_in_scope as test_in_scope, sol_basic_details.is_soak_test_in_scope, IFNULL((select complexity_title from complexity_master where complexity_master.complexity_id=(select complexity_id from spss_estimations where group_id=indus_master.reqsubcategoryId and sol_id=sol_basic_details.sol_id)), 'N/A') as complexity_title from industry_use_cases_master indus_master, solution_requirement_matrix sol_req_matrix, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where sol_basic_details.indus_id = indus_info.indus_id and sol_area.sol_area_id = indus_master.sol_area_id and	complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.indus_id = indus_info.indus_id and sol_basic_details.indus_id = indus_master.indus_id and sl_info.sl_id = sol_area.sl_id and sol_basic_details.sol_id =  " +solId+ "  and sol_area.sol_area_id ="+solAreaId;
		} else{
			sqlQuery="select distinct indus_master.use_case_id, indus_master.line_of_business, indus_master.reqsubcategory, indus_master.use_case_description, sol_area.sol_area_id,  sol_area.sol_area_name,  indus_info.indus_name, indus_info.indus_id, sl_info.sl_id, sl_info.sl_name,sol_basic_details.sol_id,sol_basic_details.is_perf_test_in_scope as test_in_scope,sol_basic_details.is_soak_test_in_scope, complexity_master.complexity_title, sol_req_matrix.is_perf_test_in_scope from industry_use_cases_master indus_master, solution_requirement_matrix sol_req_matrix, solution_area_info  sol_area, solution_basic_details_trx sol_basic_details, industry_info indus_info, service_line_info sl_info, complexity_master where indus_master.use_case_id = sol_req_matrix.use_case_id and sol_area.sol_area_id = indus_master.sol_area_id and sol_basic_details.indus_id = indus_info.indus_id and sol_basic_details.indus_id = indus_master.indus_id and sl_info.sl_id = sol_area.sl_id and complexity_master.complexity_id = indus_master.use_case_complexity and sol_basic_details.sol_id = sol_req_matrix.sol_id and sol_req_matrix.sol_id = " +solId+ " and sol_area.sol_area_id ="+solAreaId;
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
				console.log("solRequirementResult: "+solRequirementResult);

				res.render('getSolRequirements', {'user' : req.session.user,"solRequirementResult":solRequirementResult,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal});

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
		
		
		if((typeof useCaseInfoType == 'undefined') && (currentSolAreaId ==105)){
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
			if (useCaseInfoType==1){
				console.log(" ++++++Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);
//				var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";	
				//var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select is_perf_test_in_scope from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";
				//var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select is_perf_test_in_scope from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";
				
				var sqlQuery= "";
				if((post.currentSolAreaId==21) || (post.currentSolAreaId==105)){
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId;
				}else{					
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select is_perf_test_in_scope from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId+" group by reqsubcategoryid";
				}
				console.log(" ***** sqlQuery>>"+sqlQuery);
				var query = pool.query(sqlQuery, function(err, solAreaResult) {
					if (err) throw err;	
					if(solAreaResult.length > 0) {
							console.log(" ***** Inside captureSolAreaUseCases, currentSolAreaId:: "+currentSolAreaId);
							console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
							console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
						if(currentSolAreaId ==21){														
							var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
	
							var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
							});	
						}else if(currentSolAreaId ==105){														
								//var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1),'TBD') as name1, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2),'TBD') as name2, IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105 and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
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
											res.render('getSystemIntegrationUseCaseInfo', {'adapters':sqlAdaptersResult,'perfPercent':sqlPerfValQueryResults[0].perfPercent, 'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
										});																				
									});									
								});	
						}else if(currentSolAreaId ==104){														
							var sqlAdaptersQuery = "select SIMPLE, MEDIUM, COMPLEX from esb_adapters_estimations where SOL_ID="+solId;
							var query = pool.query(sqlAdaptersQuery, function(err, sqlAdaptersResult) {
								if (err) throw err;												
								res.render('getSystemIntegrationAdaptersInfo', {'adapters':sqlAdaptersResult,'useCaseInfoType': useCaseInfoType, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
							});
						}else{
							res.render('getHLUseCaseInfo', {'isedit' : isedit, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});
						}
												
						//Session logging info
						var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",0,'Success',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
						
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
							//	connection.release();
								console.log(err);
							}
						});//session logging ends here	
					}
					else {
						console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
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
								console.log(err);
							}
							});//session logging ends here	
							res.render('solutionDetails', {'isedit' : isedit, 'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
						});

					}
				});
			}
			else{
				console.log(" ***** Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);
//				var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId;	
				//var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select is_perf_test_in_scope from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as simple, (select IFNULL((SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + post.solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId;
				var sqlQuery= "";
				if((post.currentSolAreaId==105) || (post.currentSolAreaId==21)){
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId;
				}else{					
					sqlQuery = "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select count(*) from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id) as isselected, (select is_perf_test_in_scope from solution_requirement_matrix   where sol_id = " + post.solId + " and use_case_id=uc_master.use_case_id ) as isperfselected from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where uc_master.active=1 and sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.industryId+" and uc_master.sol_area_id="+post.currentSolAreaId;
				}
								
				console.log("sqlQuery:::::::::::::::<>>>>"+sqlQuery);
				var query = pool.query(sqlQuery, function(err, solAreaResult) {
					if (err) throw err;	
					if(solAreaResult.length > 0) {
						console.log(" ***** Inside captureSolAreaUseCases, Success and forward to captureSolAreaUseCases ");
						
						if(currentSolAreaId ==21){														
							var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 'Select') as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
	
							var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
								if (err) {
									console.log("error while execution of sqlDefaultValues select  query"); 
									throw err;	
								}
								res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});	
							});	
						}else if(currentSolAreaId ==105){
							//var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1),'TBD') as name1, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2),'TBD') as name2, IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2 and id_system_3=id3),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105 and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
							var sqlDefaultESBValues = "select SOL_ID, IFNULL(tech1,0) as id1, IFNULL(tech2,0) as id2, IFNULL(SOL_AREA_ID,0) as id3, IFNULL(NEW_SIMPLE,0) as simple, IFNULL(NEW_MEDIUM,0) as medium, IFNULL(NEW_COMPLEX,0) as complex, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id1),'TBD') as name1, IFNULL((select sai.Sol_area_Name from solution_area_info sai where sai.Sol_area_id = id2),'TBD') as name2, IFNULL((select distinct(iucm.ReqSubCategory) from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105),'TBD') as name3, IFNULL((select si.num_simple from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tsimple, IFNULL((select si.num_medium from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tmedium, IFNULL((select si.num_complex from system_integration si where id_system_1=id1 and id_system_2=id2),0) as tcomplex, IFNULL((select iucm.use_case_id from industry_use_cases_master iucm where iucm.ReqSubCategoryId = id3 and iucm.sol_area_id=105 and iucm.Indus_id=7),0) as usecaseId from esb_integration_estimations where SOL_ID="+solId;
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
										res.render('getSystemIntegrationUseCaseInfo', {'adapters':sqlAdaptersResult,'perfPercent':sqlPerfValQueryResults[0].perfPercent, 'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
									});	
									//res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':sqlPerfValQueryResults[0].perfPercent, 'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});
								});	
								 //res.render('getSystemIntegrationUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultESBValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});
							});	
						}else if(currentSolAreaId ==104){														
							var sqlAdaptersQuery = "select SIMPLE, MEDIUM, COMPLEX from esb_adapters_estimations where SOL_ID="+solId;
							var query = pool.query(sqlAdaptersQuery, function(err, sqlAdaptersResult) {
								if (err) throw err;												
								res.render('getSystemIntegrationAdaptersInfo', {'adapters':sqlAdaptersResult,'useCaseInfoType': useCaseInfoType, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});											
							});
						}else{
							res.render('getUseCaseInfo', {'isedit' : isedit, 'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId, "model":model, "sprintWeeks": sprintWeeks});
						
						}
						var sessionQuery = "insert into session_log (session_id, event_type,status_code, status_message,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Capture_Usecases  +",0,'Success',"+post.solId+","+post.currentSolAreaId+","+(testSolId =='Y' ? 1:0) +")";
						
						console.log(sessionQuery);
						var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
							if (err) {
								//connection.release();
								console.log(err);
							}
						});//session logging ends here	

					}
					else {
						console.log(" ***** Inside captureSolAreaUseCases, No result and forward to solution details page");
						var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";

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
								console.log(err);
							}
							});//session logging ends here	 
							res.render('solutionDetails', {'isedit' : isedit, 'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
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
		var solutionAreaInfo = [];
        // Changes for workitem #5215 sales connect info popup
        if(post.imt_id=='') post.imt_id = null;
        if(post.iot_id=='') post.iot_id = null;
        if(post.risk_rating=='') post.risk_rating = null;
		
        //Check if there is only one solution area selected, then create array
		if(util.isArray(post.solutionAreaInfo)) {
			solutionAreaInfo = post.solutionAreaInfo;

		} else {
			solutionAreaInfo.push(post.solutionAreaInfo);
		}
		
		console.log("solutionAreaInfo:::::::::::"+solutionAreaInfo);
		console.log("post.industryInfo::::::::::" + post.industryInfo);

		var sqlValidation= "select distinct industry_use_cases_master.sol_area_id, sol_area_info.sol_area_name,industry_info.indus_name from industry_use_cases_master, solution_area_info	sol_area_info, industry_info where sol_area_info.sol_area_id = industry_use_cases_master.sol_area_id and industry_info.indus_id = industry_use_cases_master.indus_id and industry_use_cases_master.indus_id = "+post.industryInfo+" order by sol_area_id";
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
					if(sqlIndusValidResult.length>0)
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
					{
						//var sqlSolId= "insert into solution_basic_details_trx  (indus_id,proposed_delivery_center,opportunity_id,customer_name,created_by,business_language) values ("+post.industryInfo+","+post.deliveryCenterInfo+",'"+post.opportunityId.trim()+"','"+post.clientName.trim()+"','" +req.session.user.emp_emailid +"','English')";
                        // Changes for workitem #5215 sales connect info popup  
						var sqlSolId= "insert into solution_basic_details_trx  (indus_id,proposed_delivery_center,opportunity_id,customer_name,created_by,business_language,opportunity_owner_email,smr_number,imt_id,risk_rating,iot_id) values ("+post.industryInfo+","+post.deliveryCenterInfo+",'"+post.opportunityId.trim()+"','"+post.clientName.trim()+"','" +req.session.user.emp_emailid +"','English','"+post.opportunity_owner_email.trim()+"','"+post.smr_number.trim()+"',"+post.imt_id+","+post.risk_rating+","+post.iot_id+")";						
						var query = pool.query(sqlSolId, function(err, solResult) {
							console.log("sqlSolId Query : - "+sqlSolId);
							if (err) throw err;	
							var solId= solResult.insertId;//result[0].SOL_ID;
							var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id) values"; 
							for (var i = 0; i <solutionAreaInfo.length ; i++) {
								if(i>0)	
									sqlInsertQuery = sqlInsertQuery +",";				
								sqlInsertQuery =sqlInsertQuery +"("+solId+","+solutionAreaInfo[i]+")"
							}
							console.log("--------------- Select use cases Query "+sqlInsertQuery ); 
							
							var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
								if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query"); 
									throw err;	
								}
								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_area_details_trx.nfr_type=0 and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

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
											console.log(err);
										}
									});	
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id});
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


app.post('/modifySolutionDetails', function(req, res) {
	

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
		
		console.log(" Control is inside modifySolutionDetails() ");
	//	console.log('************* Solution Id ' + sqlSolId);
	
		var sqlValidation= "select distinct industry_use_cases_master.sol_area_id, sol_area_info.sol_area_name,industry_info.indus_name from industry_use_cases_master, solution_area_info	sol_area_info, industry_info where sol_area_info.sol_area_id = industry_use_cases_master.sol_area_id and industry_info.indus_id = industry_use_cases_master.indus_id and industry_use_cases_master.indus_id = "+post.industryInfo+" order by sol_area_id";
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
            var sqlSolId= "update solution_basic_details_trx  set proposed_delivery_center = '"+post.deliveryCenterInfo+"',opportunity_id = '"+post.opportunityId.trim()+"',customer_name = '"+post.clientName.trim()+"',smr_number='"+post.smr_number+"',imt_id='"+post.imt_id+"',iot_id='"+post.iot_id+"',opportunity_owner_email='"+post.opportunity_owner_email+"',risk_rating='"+post.risk_rating+"' where SOL_ID="+post.sol_id;
			console.log("sqlSolId>>>>>>>>>>"+sqlSolId);
            var query = pool.query(sqlSolId, function(err, solResult) {
				if(err) {
					console.log(err);
				}
			});
            console.log("::::::::post.solutionAreaInfo>"+post.solutionAreaInfo);
			if(!post.solutionAreaInfo) {

				var solId= post.sol_id;

				console.log("No solution area selected");

				var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									console.log("SqlQuery: "+sqlQuery);
									console.log(JSON.stringify(solDetailsInfo));
									var countVal=0;
									var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +solId+" and is_perf_test_in_scope = 1", function(err, countResult) {
										if (err) throw err;	
										countVal = countResult[0].count;
										
									
									
									
									console.log("Success and passing the control to submitSolutionDetails Page."); 
									
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Edit_Opportunity  +","+solDetailsInfo[0].sol_id+","+solDetailsInfo[0].sol_area_id+",0,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											console.log(err);
										}
									});	
									
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal});
					
								});
							});

			}
			else { 

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
								console.log(err);
							}
							});//session logging ends here	
							console.log(solInfo);
							res.render('editOpportunityDetails', {'user' : req.session.user, "errorMessage":errorMessage, 'solInfo' :solInfo, 'solAreaDetails':solAreaDetails });

						});
						});
										
					}
					else {	
					
						var solId= post.sol_id;//99;
						var sqlInsertQuery = "insert into solution_area_details_trx  (sol_id,sol_area_id) values"; 
						for (var i = 0; i <solutionAreaInfo.length ; i++) {
							if(i>0)	
								sqlInsertQuery = sqlInsertQuery +",";				
								sqlInsertQuery =sqlInsertQuery +"("+solId+","+solutionAreaInfo[i]+")"
						}
						console.log("::--------------- Select use cases Query "+sqlInsertQuery ); 
							
						var insertQuery = pool.query(sqlInsertQuery, function(err, solAreaResult) {
						if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query"); 
									throw err;	
								}
							//	var sqlQuery = "select solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_area_details_trx.nfr_type=0 and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, ifnull(solution_area_details_trx.usecase_info_type, (select max(usecase_info_type) from solution_area_details_trx where sol_id="+solId+")) as usecase_info_type, ifnull(solution_area_details_trx.sprint_weeks, (select max(sprint_weeks) from solution_area_details_trx where sol_id="+solId+")) as sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";
								console.log("::::::::::sqlQuery>"+sqlQuery);
								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									var countVal=0;
									var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +solId+" and is_perf_test_in_scope = 1", function(err, countResult) {
										if (err) throw err;	
										countVal = countResult[0].count;
										console.log("The count is -> "+countResult[0].count);
									
			
									console.log("Success and passing the control to submitSolutionDetails Page."); 
									//var sessionQuery = "insert into session_log (session_id, event_type, status_code,status_message) values ('"+req.session.id +"',"+ event.Create_Solution  +")";
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Edit_Opportunity  +","+solDetailsInfo[0].sol_id+","+solDetailsInfo[0].sol_area_id+",0,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											console.log(err);
										}
									});	
									res.render('solutionDetails', {'isedit' : "true", 'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal});
					
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
	else { res.render('login'); }
});


app.post('/deleteOpportunity', function(req, res) {
	

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
				
					dbutils.populateDashboard(pool,connection, res, req);	
					});
				});
				

			});
			
			connection.release();

		});

				
			
		
	}
	else { res.render('login'); }
});

app.post('/deleteSolArea', function(req, res) {
	
	
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
			
			//delete query for solution_basic_details_trx table
			//not req
			
			var query = pool.query(sqlSolId, function(err, solResult) {
				if(err) {
					console.log(err);
				}
				
				//delete query for solution_area_details_trx table
				var sqlSolId2= "delete from solution_area_details_trx where Sol_area_id="+solAreaId;
				
				var query2 = pool.query(sqlSolId2, function(err, solResult) {
					if(err) {
						console.log(err);
					}
					
					//delete entry from staffing_estimates
					var sqlStaffing = "";
					
					if(solAreaId == 105){
						sqlStaffing = "delete from staffing_estimates where sol_id=" + solId + " and sol_area_id in (select distinct(iucm.ReqSubCategoryId) from industry_use_cases_master iucm where iucm.sol_area_id=" + solAreaId + ")";
					} else{
						sqlStaffing = "delete from staffing_estimates where sol_id=" + solId + " and sol_area_id=" + solAreaId;
					}
					
					//make a call to backend to delete the staffing plan for that soln area
					var query = pool.query(sqlStaffing, function(err, sqlStaffingResult) {
						if(err) {
							console.log(err);
						}
						
						if(solAreaId == 105){							
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
						
						//make a call to backend to recompute the merged staffing plan
						console.log(">>>>>>>....making tomcat req for merged plan");
						//make a call to tomcat to generate the merged plan
						setTimeout(function() {
							request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
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
						}, 1000);					
						res.send("Yes");
					});
				});				

			});
			
			connection.release();

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

		//var sqlQuery = "SELECT sol_area_trx.Seq_id seq_id,sol_details.sol_id, sl_name, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_id FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, service_line_info	sl_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and sl_name.sl_id= sol_details.sl_id and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0";
		var sqlQuery;

		//ju sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, Flex_Field_3 as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=solution_basic_details_trx.SOL_ID) > 0,1,0) as sol_status FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
		sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, Flex_Field_3 as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=solution_basic_details_trx.SOL_ID) > 0,1,0) as sol_status FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
		//sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sl_id = '"+sl_Id+"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";

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

				
				res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList});

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
			//ju var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"' and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			
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
							console.log(err);
						}
					});//session logging ends here	

					var countVal;
					var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +searchSolId+" and is_perf_test_in_scope = 1", function(err, countResult) {
						if (err) {
							throw err;	
						}
						countVal = countResult[0].count;
						
						
						res.render('displaySolutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal});
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
			
			
			//ju var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"' and industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
			var sqlQuery = "select solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_basic_details_trx.sol_id, solution_area_details_trx.sol_area_id,solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = '"+searchSolId+"'";
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
							console.log(err);
						}
					});//session logging ends here	

					var countVal=0;
					var count = pool.query("select count(*) as count from solution_requirement_matrix where sol_id = " +searchSolId+" and is_perf_test_in_scope = 1", function(err, countResult) {
						if (err) throw err;	
						countVal = countResult[0].count;
					
						res.render('displaySolutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL, "sid":req.session.id, "enbTestBtn":countVal});
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


app.post('/searchOpportunity', function(req, res) {
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
                //var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and ( opportunity_id like trim('%" +searchOpportunity+"%') or sol_details.sol_id = '"+searchOpportunity+"') and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
				var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE ( opportunity_id like trim('%" +searchOpportunity+"%') or sol_details.sol_id = '"+searchOpportunity+"') and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
				var query = pool.query(sqlQuery, function(err, solDashboardResult) {
				if (err) throw err;	
				console.log(solDashboardResult);
				console.log("printing each element");
				var opportunityList = [];
				var solAreaList = [];
				var opportunity = {};
				var solArea = {};

				for(var i = 0; i < solDashboardResult.length; i++) {

					solAreaList = [];
				
					opportunity = {sol_id: solDashboardResult[i].sol_id, 
								   opportunity_name: solDashboardResult[i].opportunity_name,
								   customer_name:solDashboardResult[i].customer_name,
								   industry_name : solDashboardResult[i].indus_name
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

					console.log(solDashboardResult[i].sol_id);
					console.log(solDashboardResult[i].sol_area_name);
				}
				console.log(opportunityList);
				res.render('dashboard', {'user' : req.session.user,"solDashboardResult":opportunityList});

			  });
			}
			else{
                   res.redirect('/getSolutionInfo?searchSolId='+searchOpportunity);    //getSolutionInfo			
                }
   			connection.release();
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
		var soakTestId=post.soakTestId;
		var testFlagId = post.testFlagId;
		var model = post.model;
		var sprintWeeks;
		var useCaseInfoType = post.useCaseInfoType;
		
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
						

					setTimeout(function() {
						request.post("http://"+serviceURL+"/estimate/request?sessionId='" +req.session.id +"'&solId="+solId+"&solAreaId="+post.SOL_AREA_ID,{  },
							function (error, response, body) {
								if (!error && response.statusCode == 200) {
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
									console.log(sessionQuery);
									var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
										if (err) {
											//connection.release();
											console.log(err);
										}
									});//session logging ends here	

									//res.render('saveSolutionInfo', {"data":result,SOL_ID:solId,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
									console.log(body);
									//if(testSolId=='Y' && arr.length > 0){
									if('N'=='Y' && arr.length > 0){
										setTimeout(function() {
											request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
												function (error, response, body) {
													if (!error && response.statusCode == 200) {

														var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
														console.log(sessionQuery);
														var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
															if (err) {
																//connection.release();
																console.log(err);
															}
														});//session logging ends here	
													//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
														console.log(body)
													}
													else {
														var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'" + error+"')";
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
										}
									
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
													request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
														function (error, response, body) {
															if (!error && response.statusCode == 200) {

																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",0,'Success')";
																console.log(sessionQuery);
																var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
																	if (err) {
																		//connection.release();
																		console.log(err);
																	}
																});//session logging ends here	
															//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
																console.log(body);
																console.log(">>>>>>>....making tomcat req for merged plan");
																//make a call to tomcat to generate the merged plan
																setTimeout(function() {
																	request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
																		function (error, response, body) {
																			if (!error && response.statusCode == 200) {
																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																				console.log(":::error while calling merge plans for solId: "+solId);
																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
																}, 500);
															}
															else {
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +",1,'" + error+"')";
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
												console.log(">>>>>>>....making tomcat req for merged plan");
												//make a call to tomcat to generate the merged plan
												setTimeout(function() {
													request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
														function (error, response, body) {
															if (!error && response.statusCode == 200) {
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																console.log(":::error while calling merge plans for solId: "+solId);
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
												}, 500);												
											}
										}
									});
									
								}
								else {
									var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
					
					var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
					var sqlSolAreaIdDetails = pool.query(sqlSolAreaId, function(err, resultSolAreaId){
						if (err) {
							console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
							throw err;	
						}
						console.log("isedit:::::::::---"+post.isedit);
						
						if(resultSolAreaId.length > 0)	{
							
							currentSolAreaId = resultSolAreaId[0].sol_area_id;	
							console.log("+++++++++++::+++++++++++++++ new Solution Area id - "+currentSolAreaId);			
							var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory, reqsubcategoryid,use_case_description, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.INDUS_ID+" and uc_master.sol_area_id="+currentSolAreaId;
							var query = pool.query(sqlQuery, function(err, solAreaResult) {
								if (err) throw err;	
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
									console.log(" ***** Inside saveSolutionUseCasesInfo, Success and forward to getUseCaseInfo ");
									console.log("currentSolAreaId:::::::::::::"+currentSolAreaId);
									if(currentSolAreaId ==105){
										res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
									} else if(currentSolAreaId ==21){
										var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
										
										var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
										});								
									} else if(currentSolAreaId ==104){
										res.render('getSystemIntegrationAdaptersInfo', {'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"testSolId":testSolId,"soakTestId":soakTestId});																			
									} else {
										res.render('getUseCaseInfo', {'user' : req.session.user,"solAreaResult":solAreaResult,"ipAddress":ipAddress,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId, "model":model, "sprintWeeks": sprintWeeks});
									}
									
									
								}
								else {
									console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
									var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
									var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											throw err;	
										}
										console.log("Success and passing the control to saveSolutionUseCasesInfo Page."); 
										res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
									});

								}
							});
						}
						else {
							
							//make a call to tomcat to generate the merged staffing plan
							
							
							/*var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

							var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
								if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
									throw err;	
								}
								console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query----->"+solDetailsInfo[0].sol_status);
								res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"Selected use cases for "+ solDetailsInfo[0].sol_area_name+ " have been saved successfully.", "sid":req.session.id, "enbTestBtn":util.isArray(testFlagId) ?testFlagId.length:0});
							});	*/				
						}



					});
				//	connection.release();
				});
				
			});

		
		});
	}
	else { res.render('login'); }
});
app.post('/saveSolutionCustomUseCasesInfo', function(req, res) {
	
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


		
		
			var sqlCustomIntegrationInsertQuery = "insert into esb_integration_estimations (SOL_ID, tech1, tech2, SOL_AREA_ID, USE_CASE_ID, SOL_TYPE, NEW_SIMPLE, NEW_MEDIUM, NEW_COMPLEX, NEW_VCOMPLEX) values ";
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
				var usecaseId=siValJSON.entries[j].usecaseId;
				
				console.log("simple="+simple+" & medium="+medium+" & complex="+complex+" &subcategoryId="+subcategoryId);
				
				var vcomplex = 0;
				if(counter > 0)
					sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + ",";
				
				//sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + "(" + solId + ", " + tech1 + ", " + tech2 + ", " + subcategoryId+ ", " + siValJSON.entries[j].usecaseId+",1,"+ simple+","+medium+","+complex+","+vcomplex +" )";
				sqlCustomIntegrationInsertQuery = sqlCustomIntegrationInsertQuery + "(" + solId + ", " + tech1 + ", " + tech2 + ", " + subcategoryId+ ", " + usecaseId +" , 1,"+ simple+","+medium+","+complex+","+vcomplex +" )";
				counter++;
			}
			
			console.log("++++++++++++++++++++++++++ final sqlCustomIntegrationInsertQuery::  "+sqlCustomIntegrationInsertQuery);
			
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
					
					/*var querySaveUseCases = pool.query("update solution_area_details_trx set sol_status = 'COMPLETE' where sol_id = "+solId+"  and sol_area_id = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
						if (err)  throw err;	
					});*/
					var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id, nfr_type) values ('"+req.session.id +"',"+ event.Save_Solution  +","+solId+","+post.SOL_AREA_ID+","+(testSolId =='Y' ? 1:0) +")";
					console.log(sessionQuery);
					var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
						if (err) {
							//connection.release();
							console.log(err);
						}
					});
					
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
									console.log("testSolId::::"+testSolId);
									//console.log("arr.length::::"+arr.length);
									
									if('N'=='Y'){ //no need to call perf estimation here 
										setTimeout(function() {
											request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
														console.log(body)
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
										}
									
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
													request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
																console.log(body);
																console.log(">>>>>>>....making tomcat req for merged plan");
																//make a call to tomcat to generate the merged plan
																setTimeout(function() {
																	request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
																		function (error, response, body) {
																			if (!error && response.statusCode == 200) {
																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																				console.log(":::error while calling merge plans for solId: "+solId);
																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
																}, 500);
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
												console.log(">>>>>>>....making tomcat req for merged plan");
												//make a call to tomcat to generate the merged plan
												setTimeout(function() {
													request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
														function (error, response, body) {
															if (!error && response.statusCode == 200) {
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																console.log(":::error while calling merge plans for solId: "+solId);
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
												}, 500);
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
					
					var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
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
							var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.INDUS_ID+" and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
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
									console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo ");
									//console.log("solAreaResult.sol_area_id:::::::>>>"+solAreaResult.sol_area_id);

									if(currentSolAreaId ==105){
										res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
									} else if(currentSolAreaId ==21){
										var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
										
										var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
										});								
									} else if(currentSolAreaId ==104){
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
									console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
									var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
									var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											throw err;	
										}
										console.log("Success and passing the control to saveSolutionCustomUseCasesInfo Page."); 
										res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
									});

								}
							});
						}
						else {
							//do nthg
						}




					});
				
				});
			});						
		
				

			//	connection.release();
			
	}
	else { res.render('login'); }
});

app.post('/saveSolutionSIAdaptersInfo', function(req, res) {
	
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
				console.log(err);
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
			var sqlAdaptersInsert = "insert into esb_adapters_estimations values (" + solId + "," + post.scount + "," + post.mcount + "," + post.ccount + ",0)";
			console.log("sqlAdaptersInsert: "+sqlAdaptersInsert);
			pool.query(sqlAdaptersInsert, function(err, resultSqlAdaptersInsert) {
				if (err) {
					console.log("++++++++++++++++++++++++++ Error in sqlAdaptersInsert query");
					throw err;	
				}

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
								console.log("testSolId::::"+testSolId);
								//console.log("arr.length::::"+arr.length);
								
								if('N'=='Y'){ //no need to call perf estimation here 
									setTimeout(function() {
										request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
													console.log(body)
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
									}
								
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
												request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
															console.log(body);
															console.log(">>>>>>>....making tomcat req for merged plan");
															//make a call to tomcat to generate the merged plan
															setTimeout(function() {
																request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
																	function (error, response, body) {
																		if (!error && response.statusCode == 200) {
																			var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																			console.log(":::error while calling merge plans for solId: "+solId);
																			var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
															}, 500);
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
											console.log(">>>>>>>....making tomcat req for merged plan");
											//make a call to tomcat to generate the merged plan
											setTimeout(function() {
												request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
													function (error, response, body) {
														if (!error && response.statusCode == 200) {
															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
															console.log(":::error while calling merge plans for solId: "+solId);
															var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
											}, 500);
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
				
				var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
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
						var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.INDUS_ID+" and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
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
								console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo ");
								//console.log("solAreaResult.sol_area_id:::::::>>>"+solAreaResult.sol_area_id);

								
								if(currentSolAreaId ==105){
									res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
								} else if(currentSolAreaId ==21){
									var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
									
									var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
										if (err) {
											console.log("error while execution of sqlDefaultValues select  query"); 
											throw err;	
										}
										res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
									});								
								} else if(currentSolAreaId ==104){
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
								console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
								var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
								var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
									if (err) {
										console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
										throw err;	
									}
									console.log("Success and passing the control to saveSolutionCustomUseCasesInfo Page."); 
									res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
								});

							}
						});
					}
					else {
						//do nthg
					}
				});
			});
		});						
			//	connection.release();			
	}
	else { res.render('login'); }
});

app.post('/saveSolutionHLUseCasesInfo', function(req, res) {
	
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
		var sqlQuery = "select use_case_id,reqsubcategoryid from industry_use_cases_master where indus_id="+post.INDUS_ID+" and sol_area_id ="+post.SOL_AREA_ID+" and reqsubcategoryid in (";
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
											if('N'=='Y' && arr.length > 0){ //no need to call perf individually now
												setTimeout(function() {
													request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
																console.log(body)
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
												}
											
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
															request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
																		console.log(body);
																		console.log(">>>>>>>....making tomcat req for merged plan");
																		//make a call to tomcat to generate the merged plan
																		setTimeout(function() {
																			request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
																				function (error, response, body) {
																					if (!error && response.statusCode == 200) {
																						var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																						console.log(":::error while calling merge plans for solId: "+solId);
																						var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
																		}, 500);
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
														console.log(">>>>>>>....making tomcat req for merged plan");
														//make a call to tomcat to generate the merged plan
														setTimeout(function() {
															request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
																function (error, response, body) {
																	if (!error && response.statusCode == 200) {
																		var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																		console.log(":::error while calling merge plans for solId: "+solId);
																		var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
														}, 500);
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
									var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.INDUS_ID+" and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
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
											if(currentSolAreaId ==105){
												res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
											} else if(currentSolAreaId ==21){
												var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
												
												var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
													if (err) {
														console.log("error while execution of sqlDefaultValues select  query"); 
														throw err;	
													}
													res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
												});								
											} else if(currentSolAreaId ==104){
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
											console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
											var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
											var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
												if (err) {
													console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
													throw err;	
												}
												console.log("Success and passing the control to saveSolutionHLUseCasesInfo Page."); 
												res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
											});

										}
									});
								}
								else {
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
	else { res.render('login'); }
});

app.post('/gotoSolutionDetails', function(req, res) {
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
		pool.getConnection(function(err, connection) {
			if (err) {
				console
						.log("Error obtaining connection from pool: "
								+ err);
				connection.release();
				throw err;
			}
			var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks, solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+solId + " order by solution_area_details_trx.sol_area_id";

			var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
				if (err) {
					console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
					throw err;	
				}
				console.log("sweeks:::::"+solDetailsInfo[0].sprint_weeks);
				res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"Selected use cases have been saved successfully.", "sid":req.session.id, "enbTestBtn":parseInt(enbTestBtn), "saveFlg":"Yes"});
			});
		});
	}
	else { res.render('login'); }
});

app.post('/checkSaveStatus', function(req, res) {
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
		var urlString = "http://"+serviceURL+'/download/query?solId='+solId+'&solAreaId='+solAreaId+'&artifactType='+artifactType;
		console.log("entered /checkSaveStatus with url" +urlString);
		request.get(urlString,{  },
				function (error, response, body) {
					if (!error && response.statusCode == 200) {	
						console.log("body:: "+body);
						if(body.split(',')[2].split(':')[1].split('"')[1].charCodeAt(0) == 48){
							console.log("testSolId   "+testSolId+"   enbTestBtn" +enbTestBtn);
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
								res.send("Yes");
							}
						}else{
							res.send("No");
						}
					}else{						
						console.log("error -> "+error);
						res.send(""+error+"");
					}
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

				//ju var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by='"+req.session.user.emp_emailid +"' group by sl_id order by sl_id DESC;";
				var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id group by sl_id order by sl_id DESC;";
				console.log("userName----------" +sess.userName + "LoginResult" + loginResult);
				//var sqlQuery = "select solution_basic_details_trx.sol_id, sl_name, customer_name from solution_basic_details_trx , service_line_info  where solution_basic_details_trx.created_by='"+req.session.user.emp_emailid +"'and solution_basic_details_trx.sl_id = service_line_info.sl_id"
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
				req.session.user= loginResult[0];
				req.session.user.emp_emailid = req.body.userName.trim();
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
						    	req.session.user.emp_emailid = req.body.userName;

						    	for (var i = body.search.entry.length - 1; i >= 0; i--) {
						        	for (var j = body.search.entry[i].attribute.length - 1; j >= 0; j--) {

						        		if(body.search.entry[i].attribute[j].name === "givenname") {
						        			req.session.user.emp_fname = body.search.entry[i].attribute[j].value[0];
						        			console.log("Mail id: "+ req.session.user.emp_emailid );
						        			console.log("Given Name: "+ req.session.user.emp_fname );
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

	
		var sessionQuery = "insert into session_master (session_id, user_email,country,iot) values ('"+req.session.id +"','" + req.session.user.emp_emailid +"','" + req.session.user.country +"','" + req.session.user.iot +"')";
		console.log(sessionQuery);
		var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
			if (err) {
				//connection.release();
				//throw err;	
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

		//var sqlQuery = "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id and sbdt.created_by='"+req.session.user.emp_emailid +"' group by sl_id order by sl_id desc;";
		var sqlQuery =   "select sli.sl_id,sli.sl_name, count(sbdt.sl_id<>0) num_of_solutions from service_line_info sli left join solution_basic_details_trx sbdt on sli.sl_id = sbdt.sl_id group by sl_id order by sl_id desc;";
		//var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";
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



				//var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";
					var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name, IFNULL(sol_details.Flex_Field_3, 0) as totalEfforts, if((select count(*) from solution_area_details_trx where solution_area_details_trx.SOL_ID=sol_details.SOL_ID and nfr_type=0 and SOL_STATUS='INCOMPLETE') > 0,0,1) as sol_status, DATE_FORMAT((select max(event_time) from session_log where session_log.sol_id=sol_details.SOL_ID),'%d-%m-%Y') as last_edit_date FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id desc";		
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
					console.log("req.session.user:::::::::::"+req.session.user);
				res.render('dashboard', {'user' : req.session.user, 'solDashboardResult':opportunityList });
			});
		});
    
			connection.release();
		
	});
}

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

//Changes for workitem #5215 sales connect info popup
app.get('/getIMTInfo/:id', function(req, res) {
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

// Changes for workitem #5215 sales connect info popup
app.get('/getIOTInfo', function(req, res) {
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

app.get('/getSIUsecaseVal', function(req, res) {

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

app.get('/getSolAreaOffSet', function(req, res) {
	var queryString = '';
	if(req.query.solAreaId==105){ //esb scenario
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

app.post('/setSolDelvModel', function(req, res) {
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id) values ('"+req.body.session_id +"',"+ event.Edit_Delivery_Model +","+req.body.solId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			console.log(err);
		}			
	});	
	
	//set Staffing generated to false & set the new delivery model
	var qStr = 'update solution_area_details_trx set delivery_model='+req.body.delvModel+', Flex_Field_5=0 where SOL_ID='+req.body.solId;
	console.log("setSolDelvModel qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		res.send("OK");
	});
});

app.post('/setSprintWeeks', function(req, res) {
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id) values ('"+req.body.session_id +"',"+ event.Edit_Sprint_Weeks +","+req.body.solId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			console.log(err);
		}			
	});	
	
	var qStr = 'update solution_area_details_trx set sprint_weeks='+req.body.sweeks+' where SOL_ID='+req.body.solId;
	console.log("setSprintWeeks qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		res.send("OK");
	});
});

app.post('/setSolAreaOffSet', function(req, res) {
	var sessionQuery = "insert into session_log (session_id, event_type, sol_id, sol_area_id) values ('"+req.body.session_id +"',"+ event.Edit_SolArea_Offset +","+req.body.solId+","+req.body.solAreaId+")";
	console.log(sessionQuery);
	var queryEx = pool.query(sessionQuery, function(err, sessionResult) {
		if (err) {
			//connection.release();
			console.log(err);
		}			
	});	
	var qStr = 'update solution_area_details_trx set Flex_Field_3='+req.body.offSet+' where SOL_ID='+req.body.solId+' and Sol_area_id='+req.body.solAreaId+' and nfr_type=0';
	console.log("qStr: "+qStr);
	var query = pool.query(qStr, function(err, result) {
		res.send("OK");
	});
});

app.get('/siadapters_complexity_def/:id', function(req, res) {
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

app.get('/esb_complexity_def/:id', function(req, res) {
	var id=req.params.id;
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log("Error obtaining connection from pool: "+ err);
			connection.release();
			throw err;
		}
		var sqlQuery = 'select COMPLEXITY_ID, CRITERION, (select distinct(ReqSubCategory) from industry_use_cases_master where ReqSubCategoryId='+id+') as esbArea from esb_complexity_level_definition where REQ_SUBCATEGORY_ID='+id;
		var query = pool.query(sqlQuery, function(err, result) {
			res.render('esb_complexity', {'complexityDef' : result});
		});
		connection.release();
	});
});

app.get('/spss_complexity_def/:id/:solAreaId', function(req, res) {
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



app.get('/doEstimation', function(req, res) {
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

app.post('/saveSolutionSPSSUseCasesInfo', function(req, res) {
	
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
		
		if(post.isedit == 'true'){
			useCaseInfoType = post.edit_usecase_info_type;
		}
		
		console.log("useCaseInfoType: "+useCaseInfoType);

			var sqlCustomIntegrationInsertQuery = "insert into spss_estimations (sol_id, group_id, complexity_id) values ";
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
			var sqlSPSSDeleteQuery = "delete from spss_estimations where sol_id="+solId;
			var sqlSPSSDeleteQueryExec = pool.query(sqlSPSSDeleteQuery, function(err, sqlSPSSDeleteQueryResult) {	
				if(err){
					console.log("error while deleting old values for soln Id "+solId+" from spss_estimations"); 
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
						console.log(err);
					}
				});//session logging ends here	
				
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
									console.log("testSolId::::"+testSolId);
									//console.log("arr.length::::"+arr.length);
									
									if('N'=='Y'){ //no need to call perf estimation here
										setTimeout(function() {
											request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
														console.log(body)
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
										}
									
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
													request.post("http://"+serviceURL+'/estimate/request?sessionId='+req.session.id+'&solId='+solId+'&solAreaId='+post.SOL_AREA_ID+'&nfrType=performance',{  },
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
																console.log(body);
																console.log(">>>>>>>....making tomcat req for merged plan");
																//make a call to tomcat to generate the merged plan
																setTimeout(function() {
																	request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
																		function (error, response, body) {
																			if (!error && response.statusCode == 200) {
																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																				console.log(":::error while calling merge plans for solId: "+solId);
																				var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
																}, 500);
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
												console.log(">>>>>>>....making tomcat req for merged plan");
												//make a call to tomcat to generate the merged plan
												setTimeout(function() {
													request.post("http://"+serviceURL+"/estimate/mergesplans?sessionId='" +req.session.id +"'&solId="+solId,{  },
														function (error, response, body) {
															if (!error && response.statusCode == 200) {
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",0,'Success')";
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
																console.log(":::error while calling merge plans for solId: "+solId);
																var sessionQuery = "insert into session_log (session_id, event_type,sol_id, sol_area_id,status_code, status_message) values ('"+req.session.id +"',"+ event.Save_Solution_Low  +","+solId+","+post.SOL_AREA_ID+",1,'" + error+"')";
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
												}, 500);
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
					
					var sqlSolAreaId = "select sol_area_id from solution_area_details_trx where sol_id = "+solId+" and sol_status != 'COMPLETE' and nfr_type=0 and sol_area_id > "+post.SOL_AREA_ID + " ORDER BY sol_area_id ASC";
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
							var sqlQuery= "select sl.sl_id, sl.sl_name, uc_master.sol_area_id, sol_area.sol_area_name, industry.indus_id, industry.indus_name,uc_master.use_case_id,line_of_business, reqcategory, reqsubcategory,reqsubcategoryid, (select IFNULL((SELECT NEW_SIMPLE from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id), 0)) as simple, (select IFNULL(( SELECT NEW_MEDIUM from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as medium, (select IFNULL((SELECT NEW_COMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as complex, (select IFNULL((SELECT NEW_VCOMPLEX from esb_integration_estimations where SOL_ID= " + solId + " and USE_CASE_ID=uc_master.use_case_id),0)) as vcomplex from industry_use_cases_master uc_master, solution_area_info sol_area, service_line_info sl, industry_info industry where sl.sl_id = sol_area.sl_id and sol_area.sol_area_id=uc_master.sol_area_id and industry.indus_id = uc_master.indus_id and uc_master.indus_id="+post.INDUS_ID+" and uc_master.sol_area_id="+currentSolAreaId+" group by reqsubcategoryid";	
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
									console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo ");
									//console.log("solAreaResult.sol_area_id:::::::>>>"+solAreaResult.sol_area_id);

									
									if(currentSolAreaId ==105){
										res.render('getSystemIntegrationUseCaseInfo', {'perfPercent':0,'useCaseInfoType': useCaseInfoType,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId});									
									} else if(currentSolAreaId ==21){
										var sqlDefaultSPSSValues = "select spssd.id, spssd.title, spssd.is_optional, IFNULL((select complexity_id from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as complexity, IFNULL((select effort from spss_estimations where group_id=spssd.id and sol_id="+solId+"), spssd.effort) as effort, IFNULL((select count(*) from spss_estimations where group_id=spssd.id and sol_id="+solId+"), 0) as selected from spss_details spssd order by spssd.id asc";
										
										var defValuesQuery = pool.query(sqlDefaultSPSSValues, function(err, sqlDefaultSPSSValuesQResults) {
											if (err) {
												console.log("error while execution of sqlDefaultValues select  query"); 
												throw err;	
											}
											res.render('getSPSSUseCaseInfo', {'useCaseInfoType': useCaseInfoType,'defaultValues':sqlDefaultSPSSValuesQResults,'user' : req.session.user,"solAreaResult":solAreaResult,"serviceURL":serviceURL,"solId":post.solId,"useCaseInfoType":useCaseInfoType,"testSolId":testSolId,"soakTestId":soakTestId,"ipAddress":ipAddress});	
										});								
									} else if(currentSolAreaId ==104){
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
									console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
									var sqlQuery = "select solution_basic_details_trx.sol_id, solution_basic_details_trx.is_perf_test_in_scope, solution_basic_details_trx.is_soak_test_in_scope, solution_area_details_trx.sol_area_id, solution_area_details_trx.delivery_model, solution_area_details_trx.usecase_info_type, solution_area_details_trx.sprint_weeks,solution_area_details_trx.sol_status, ifnull(solution_area_details_trx.estimated_efforts,'to be calculated') estimated_efforts, solution_area_info.sol_area_name, solution_area_info.sl_id, service_line_info.sl_name,industry_info.indus_id,industry_info.indus_name from solution_area_details_trx, solution_basic_details_trx, service_line_info, solution_area_info, industry_info where industry_info.indus_id = solution_basic_details_trx.indus_id and solution_area_info.sol_area_id = solution_area_details_trx.sol_area_id and service_line_info.sl_id = solution_area_info.sl_id and solution_basic_details_trx.sol_id = solution_area_details_trx.sol_id  and solution_area_details_trx.nfr_type=0 and solution_basic_details_trx.sol_id = "+post.solId + " order by solution_area_details_trx.sol_area_id";
									var sqlSolutionDetails = pool.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											throw err;	
										}
										console.log("Success and passing the control to saveSolutionCustomUseCasesInfo Page."); 
										res.render('solutionDetails', {'user' : req.session.user,"solDetailsInfo":solDetailsInfo,"serviceURL":serviceURL,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].sol_area_name+". Please contact support team.", "sid":req.session.id});
									});

								}
							});
						}
						else {
							//do nthg
						}




					});
				
				});
			});						
		
				

			//	connection.release();
			
	}
	else { res.render('login'); }
});

app.post('/checkStaffingGenerationStatus', function(req, res) {
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
		var urlString = "http://"+serviceURL+'/download/query?solId='+solId+'&solAreaId='+solAreaId+'&artifactType='+artifactType;
		console.log("entered /checkSaveStatus with url" +urlString);
		request.get(urlString,{  },
				function (error, response, body) {
					if (!error && response.statusCode == 200) {	
						console.log("body:: "+body);
						if(body.split(',')[2].split(':')[1].split('"')[1].charCodeAt(0) == 48){
							console.log("testSolId   "+testSolId+"   enbTestBtn" +enbTestBtn);
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
								res.send("Yes");
							}
						}else{
							res.send("No");
						}
					}else{						
						console.log("error -> "+error);
						res.send(""+error+"");
					}
		});
	}
	else { res.render('login'); }
});
