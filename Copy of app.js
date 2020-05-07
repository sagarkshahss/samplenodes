var express = require('express');
var app = express();
var request=require('request');
var swig = require('swig');
var path = require('path');
var dns = require('dns');

var ip = require('ip');

var mysql = require('mysql');

var ipAddress; 

//var ipAddress = ip.address();
//console.log("*************888IP ADDRESS",ipAddress );

//var serviceURL = "http://ixm-solution-advisor-api.stage1.mybluemix.net";
//var serviceURL = "http://localhost:8080/ixm";

var serviceURL; 

dns.lookup("ixm-sol-adv-server", function onLookup(err, address, family) {
   ipAddress = address;
   serviceURL = "http://"+ipAddress+":8080/ixm";
});

//console.log("*************serviceURL : ",serviceURL);

app.engine('html', swig.renderFile);
var cfenv = require('cfenv');
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'html')
app.use('/static', express.static(__dirname + '/public'));

var domain = require('domain'),
d = domain.create();

d.on('error', function(err) {
  console.error(err);
}); 

/*

var connection = mysql.createConnection({
	host     : 'us-cdbr-iron-east-03.cleardb.net',
	user     : 'bba88f50c29c53',
	password : '2798f689',
	database : 'ad_31a44fb3eb596b9',
	debug    :  true
});

var connection = mysql.createConnection({
	host     : 'us-cdbr-iron-east-03.cleardb.net',
	user     : 'b4ec8d9794e096',
	password : '875eed67',
	database : 'ad_10b8afed569461b',
	debug    :  true
});

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'scott',
	password : 'Sc0tty!xm',
	database : 'ixmsolutionadvisor',
	debug    :  true
});

function handleDisconnect() {
		connection = mysql.createConnection({
		host     : 'us-cdbr-iron-east-03.cleardb.net',
		user     : 'b4ec8d9794e096',
		password : '875eed67',
		database : 'ad_10b8afed569461b',
		debug    :  true
	});
};

function handleDisconnect() {
		connection = mysql.createConnection({
			host     : 'localhost',
			user     : 'scott',
			password : 'Sc0tty!xm',
			database : 'ixmsolutionadvisor',
			debug    :  true
	});
};
**/

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'localhost',
	user     : 'scott',
	password : 'Sc0tty!xm',
	database : 'ixmsolutionadvisor',
    debug    :  false
});

/**
connection.connect(function(err) {
	 if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } 

	console.log(JSON.stringify(err));
});

 connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
**/
 

app.get('/', function(req, res) {
	res.render('login', {'name': 'maksood'});
});


app.get('/captureRequirements', function(req, res) {
	res.render('captureRequirements', {'name': 'maksood'});
});


app.get('/captureRequirements1', function(req, res) {
	res.render('specify_requirement', {'name': 'maksood'});
});

/*
app.get('/getUseCaseInfo', function(req, res) {
	res.render('specify_requirement', {'name': 'maksood'});
});
*/

app.get('/d1', function(req, res) {
	res.render('d1', {'name': 'maksood'});
});

app.get('/test', function(req, res) {
	res.render('test', {'name': 'maksood'});
});



app.get('/advisorHome', function(req, res) {
	console.log("++++++++++++++++++++ipAddress : "+ipAddress+"\n serviceURL : "+serviceURL);
	res.render('advisorHome', {'name': 'maksood'});
});


app.get('/users', function(req, res) {
	var list=[];
	for(var i=1;i<10;i++){
		list.push({'name': 'maksood'});
	}
	res.send(list);
});


app.post('/login', function(req, res) {
	console.log(JSON.stringify(req.body));
	res.render('advisorHome', {'name': 'maksood'});
});


app.post('/register', function(req, res) {
	console.log(JSON.stringify(req.body));
	res.render('advisorHome', {'name': 'maksood'});
});


app.post('/login', function(req, res) {
	console.log(JSON.stringify(req.body));
	res.render('login', {'name': 'maksood'});
});


app.get('/serviceLineInfo', function(req, res) {
	pool.getConnection(
			function(err, connection) {
				if(err) {
					console.log("Error obtaining connection from pool: "+err);
					connection.release();
					throw err;
				}
				var query = connection.query(
						'SELECT SL_ID,SL_NAME,SL_NAME_SHORTNAME from SERVICE_LINE_INFO ORDER BY SL_ID', 
						function(err, result) {
					//		console.log(JSON.stringify(result));
							if (err) {	
								connection.release();
								throw err;
							}
							res.send(result);
						});
				connection.release();
			});
});


app.get('/solutionAreaInfo/:id', function(req, res) {
	var id=req.params.id;
	
	pool.getConnection(
			function(err, connection) {
				if(err) {
					console.log("Error obtaining connection from pool: "+err);
					connection.release();
					throw err;
				}
				var query = connection.query('SELECT SOL_AREA_ID, SL_ID,SOL_AREA_NAME FROM SOLUTION_AREA_INFO WHERE SL_ID='+id+' ORDER BY SOL_AREA_ID ', 
						function(err, result) {
						//		console.log(JSON.stringify(result));
							if (err) {	
								connection.release();
								throw err;
							}
							res.send(result);
						});
				connection.release();
			});
});

app.get('/captureExistingSolInfo', function(req, res) {
	console.log(JSON.stringify(req.body));
	res.render('captureExistingSolInfo', {'name': 'maksood'});
});

app.post('/getSolRequirements', function(req, res) {
	var sol_id = req.body.SOL_ID;
	var indus_id=req.body.INDUS_ID;
	var sol_area_id= req.body.SOL_AREA_ID;
	console.log('***************************** body: '+sol_id );
	//console.log('body: ' + JSON.stringify(post));

	pool.getConnection(
			function(err, connection) {
				if(err) {
					console.log("Error obtaining connection from pool: "+err);
					throw err;
				}
				var query = connection.query('SELECT USE_CASE_ID, LINE_OF_BUSINESS,REQSUBCATEGORY,USE_CASE_DESCRIPTION FROM INDUSTRY_USE_CASES_MASTER  where USE_CASE_ID IN (SELECT USE_CASE_ID FROM SOLUTION_REQUIREMENT_MATRIX WHERE SOL_ID='+sol_id+')', 
						function(err, result) {
							if (err) {	
								connection.release();
								throw err;
							}
							console.log(result);
						});	
				
				var querySolutionAreaInfo = connection.query('SELECT SOL_AREA_ID,SL.SL_ID SL_ID,SL_NAME,SOL_AREA_NAME FROM SOLUTION_AREA_INFO SOL_AREA, SERVICE_LINE_INFO SL WHERE SL.SL_ID=SOL_AREA.SL_ID AND SOL_AREA_ID='+sol_area_id, 
						function(err, resultSolAreaInfo) {				
							if (err) {	
								connection.release();
								throw err;
							}
						});
				
				var queryIndustryInfo = connection.query('SELECT INDUS_ID,INDUS_NAME,INDUS_DESCRIPTION FROM INDUSTRY_INFO WHERE INDUS_ID='+indus_id, 
						function(err, resultIndustryInfo) {
							if (err) {	
								connection.release();
								throw err;
							}
							res.render('getSolRequirements', {"data":result,solutionAreaInfo:resultSolAreaInfo,"sol_id":sol_id,"industryInfo":resultIndustryInfo});
						});
				
				connection.release();
			});

});


app.post('/getSolAreaRequirements', function(req, res) {
	var solId = req.body.solId;
	var solAreaId= req.body.solAreaId;
		console.log('***************************** sol_id: '+solId );
	console.log('***************************** solAreaId: '+solAreaId );

	//console.log('body: ' + JSON.stringify(post));
	var sqlQuery="SELECT DISTINCT INDUS_MASTER.USE_CASE_ID, INDUS_MASTER.LINE_OF_BUSINESS, INDUS_MASTER.REQSUBCATEGORY, INDUS_MASTER.USE_CASE_DESCRIPTION, SOL_AREA.SOL_AREA_ID,  SOL_AREA.SOL_AREA_NAME,  INDUS_INFO.INDUS_NAME, INDUS_INFO.INDUS_ID, SL_INFO.SL_ID, SL_INFO.SL_NAME,SOL_BASIC_DETAILS.SOL_ID, COMPLEXITY_MASTER.COMPLEXITY_TITLE FROM INDUSTRY_USE_CASES_MASTER INDUS_MASTER, SOLUTION_REQUIREMENT_MATRIX SOL_REQ_MATRIX, SOLUTION_AREA_INFO  SOL_AREA, SOLUTION_BASIC_DETAILS_TRX SOL_BASIC_DETAILS, INDUSTRY_INFO INDUS_INFO, SERVICE_LINE_INFO SL_INFO, COMPLEXITY_MASTER WHERE INDUS_MASTER.USE_CASE_ID = SOL_REQ_MATRIX.USE_CASE_ID AND SOL_AREA.SOL_AREA_ID = INDUS_MASTER.SOL_AREA_ID AND SOL_BASIC_DETAILS.INDUS_ID = INDUS_INFO.INDUS_ID AND SOL_BASIC_DETAILS.INDUS_ID = INDUS_MASTER.INDUS_ID AND SL_INFO.SL_ID = SOL_BASIC_DETAILS.SL_ID AND COMPLEXITY_MASTER.COMPLEXITY_ID = INDUS_MASTER.USE_CASE_COMPLEXITY AND SOL_BASIC_DETAILS.SOL_ID = SOL_REQ_MATRIX.SOL_ID AND SOL_REQ_MATRIX.SOL_ID = " +solId+ " AND SOL_AREA.SOL_AREA_ID ="+solAreaId;	

	pool.getConnection(
			function(err, connection) {
				if(err) {
					console.log("Error obtaining connection from pool: "+err);
					connection.release();
					throw err;
				}
				
				var query = connection.query(sqlQuery, 
						function(err, solRequirementResult) {
							if (err) {	
								connection.release();
								throw err;
							}
							console.log(solRequirementResult);
							res.render('getSolRequirements', {"solRequirementResult":solRequirementResult});
						});
				
				connection.release();
			});
});




app.post('/captureSolAreaUseCases', function(req, res) {
	var post = req.body;
	var useCaseInfoType = post.useCaseInfoType;
	var currentSolAreaId= post.currentSolAreaId;
	
	pool.getConnection(
			function(err, connection) {
				if(err) {
					console.log("Error obtaining connection from pool: "+err);
					connection.release();
					throw err;
				}
				if (useCaseInfoType==1){
					console.log(" ++++++Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);

					var sqlQuery= "SELECT SL.SL_ID, SL.SL_NAME, UC_MASTER.SOL_AREA_ID, SOL_AREA.SOL_AREA_NAME, INDUSTRY.INDUS_ID, INDUSTRY.INDUS_NAME,UC_MASTER.USE_CASE_ID,LINE_OF_BUSINESS, REQCATEGORY, REQSUBCATEGORY,REQSUBCATEGORYID FROM INDUSTRY_USE_CASES_MASTER UC_MASTER, SOLUTION_AREA_INFO SOL_AREA, SERVICE_LINE_INFO SL, INDUSTRY_INFO INDUSTRY WHERE SL.SL_ID = SOL_AREA.SL_ID AND SOL_AREA.SOL_AREA_ID=UC_MASTER.SOL_AREA_ID AND INDUSTRY.INDUS_ID = UC_MASTER.INDUS_ID AND UC_MASTER.INDUS_ID="+post.industryId+" AND UC_MASTER.SOL_AREA_ID="+post.currentSolAreaId+" GROUP BY REQSUBCATEGORYID";	
					
					var query = connection.query(
							sqlQuery, 
							function(err, solAreaResult) {
								if (err) {	
									connection.release();
									throw err;
								}
								if(solAreaResult.length > 0) {
									console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getUseCaseInfo ");
									res.render('getHLUseCaseInfo', {"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType});
								}
								else {
									console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
									var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID, SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+post.solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";
									var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
										if (err) {
											console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
											connection.release();
											throw err;	
										}
										console.log("Success and passing the control to captureSolAreaUseCases Page."); 
										res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].SOL_AREA_NAME+". Please contact support team."});
									});
								}
							});
				}
				else{
					console.log(" ***** Inside captureSolAreaUseCases, value of useCaseInfoType --- "+useCaseInfoType);
					var sqlQuery= "SELECT SL.SL_ID, SL.SL_NAME, UC_MASTER.SOL_AREA_ID, SOL_AREA.SOL_AREA_NAME, INDUSTRY.INDUS_ID, INDUSTRY.INDUS_NAME,UC_MASTER.USE_CASE_ID,LINE_OF_BUSINESS, REQCATEGORY, REQSUBCATEGORY, REQSUBCATEGORYID,USE_CASE_DESCRIPTION FROM INDUSTRY_USE_CASES_MASTER UC_MASTER, SOLUTION_AREA_INFO SOL_AREA, SERVICE_LINE_INFO SL, INDUSTRY_INFO INDUSTRY WHERE SL.SL_ID = SOL_AREA.SL_ID AND SOL_AREA.SOL_AREA_ID=UC_MASTER.SOL_AREA_ID AND INDUSTRY.INDUS_ID = UC_MASTER.INDUS_ID AND UC_MASTER.INDUS_ID="+post.industryId+" AND UC_MASTER.SOL_AREA_ID="+post.currentSolAreaId;	
					var query = connection.query(
							sqlQuery, 
							function(err, solAreaResult) {
								if (err) {	
									connection.release();
									throw err;
								}
								if(solAreaResult.length > 0) {
									console.log(" ***** Inside captureSolAreaUseCases, Success and forward to captureSolAreaUseCases ");
									res.render('getUseCaseInfo', {"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":useCaseInfoType});
								}
								else {
									console.log(" ***** Inside captureSolAreaUseCases, No result and forward to solution details page");
									var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID, SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+post.solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";
					
									var sqlSolutionDetails = connection.query(
											sqlQuery, 
											function(err, solDetailsInfo){
												if (err) {
													console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
													connection.release();
													throw err;	
												}
												console.log("Success and passing the control to captureSolAreaUseCases Page."); 
												res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].SOL_AREA_NAME+". Please contact support team."});
											});
					
								}			
							});
				}
				connection.release();
			});
});


app.post('/submitSolutionDetails', function(req, res) {
	var post = req.body;
	console.log(" Control is inside submitSolutionDetails() ");
//	console.log('************* Solution Id ' + sqlSolId);
	var solutionAreaInfo = post.solutionAreaInfo;
	var sqlValidation= "SELECT DISTINCT INDUSTRY_USE_CASES_MASTER.SOL_AREA_ID, SOL_AREA_INFO.SOL_AREA_NAME,INDUSTRY_INFO.INDUS_NAME FROM INDUSTRY_USE_CASES_MASTER, SOLUTION_AREA_INFO	SOL_AREA_INFO, INDUSTRY_INFO WHERE SOL_AREA_INFO.SOL_AREA_ID = INDUSTRY_USE_CASES_MASTER.SOL_AREA_ID AND INDUSTRY_INFO.INDUS_ID = INDUSTRY_USE_CASES_MASTER.INDUS_ID AND INDUSTRY_USE_CASES_MASTER.INDUS_ID = "+post.industryInfo+" ORDER BY SOL_AREA_ID";
	var invalidIndustry =""; 
	
	pool.getConnection(
			function(err, connection) {
				if(err) {
					console.log("Error obtaining connection from pool: "+err);
					connection.release();
					throw err;
				}
				var query = connection.query(
						sqlValidation, 
						function(err, sqlValidResult) {
							invalidIndustry ="(0";
							//var solAreaFlag = true;
							for (var i = 0; i <solutionAreaInfo.length ; i++) {
								var	solAreaFlag = true;
								for (var j = 0; j <sqlValidResult.length ; j++) {	
									if(solutionAreaInfo[i] == sqlValidResult[j].SOL_AREA_ID) {
										solAreaFlag = false;
										break;
									}
								}
								if(solAreaFlag)
									invalidIndustry = invalidIndustry + ","+ solutionAreaInfo[i];
							}
							
							invalidIndustry = invalidIndustry+")";	
							var industryName ="";
							var sqlIndusNamequery = connection.query("SELECT INDUS_NAME FROM INDUSTRY_INFO WHERE INDUS_ID="+post.industryInfo, function(err, resultIndusName) {
								industryName = resultIndusName[0].INDUS_NAME;
							});
					
							console.log("invalidIndustry : - "+invalidIndustry);
					
							var sqlIndusValid= "SELECT DISTINCT SOL_AREA_NAME FROM SOLUTION_AREA_INFO WHERE SOL_AREA_ID IN "+invalidIndustry;
							var query = connection.query(
									sqlIndusValid, 
									function(err, sqlIndusValidResult) {
										if(sqlIndusValidResult.length>0)
										{
											
											var errorMessage = "Use cases for ";
											for (var j = 0; j <sqlIndusValidResult.length ; j++) {	
												if (j>0)
													errorMessage = errorMessage +", ";
												errorMessage = errorMessage + sqlIndusValidResult[j].SOL_AREA_NAME ;
											}
											errorMessage = errorMessage + " in "+industryName+" are currently unavailable in iXM Solution Advisior. Please deselect these solution areas to proceed further."
											
											var solAreaSelectedValue ="0";
										
											for (var i = 0; i <post.solutionAreaInfo.length ; i++) {
												solAreaSelectedValue = solAreaSelectedValue + ","+ solutionAreaInfo[i];
											}
											 
											 
											res.render('captureRequirements', {"errorMessage":errorMessage,"serviceLineInfo":post.serviceLineInfo,"industryInfo":post.industryInfo, "clientName":post.clientName,"opportunityId":post.opportunityId,"deliveryCenterInfo":post.deliveryCenterInfo,"solAreaSelectedValue":solAreaSelectedValue});
										}
										else
										{
											var sqlSolId= "INSERT INTO SOLUTION_BASIC_DETAILS_TRX  (SL_ID,INDUS_ID,PROPOSED_DELIVERY_CENTER,OPPORTUNITY_ID,CUSTOMER_NAME,CREATED_BY,BUSINESS_LANGUAGE) VALUES ("+post.serviceLineInfo+","+post.industryInfo+","+post.deliveryCenterInfo+",'"+post.opportunityId.trim()+"','"+post.clientName.trim()+"','Ajay Kumar','English')";
											var query = connection.query(
													sqlSolId, 
													function(err, solResult) {
														console.log("sqlSolId Query : - "+sqlSolId);
														if (err) throw err;	
														var solId= solResult.insertId;//result[0].SOL_ID;
														var sqlInsertQuery = "INSERT INTO SOLUTION_AREA_DETAILS_TRX  (SOL_ID,SOL_AREA_ID) VALUES"; 
														for (var i = 0; i <post.solutionAreaInfo.length ; i++) {
															if(i>0)	
																sqlInsertQuery = sqlInsertQuery +",";				
															sqlInsertQuery =sqlInsertQuery +"("+solId+","+post.solutionAreaInfo[i]+")"
														}
														console.log("--------------- Select use cases Query "+sqlInsertQuery ); 
												
														var insertQuery = connection.query(sqlInsertQuery, function(err, solAreaResult) {
															if (err) {
																console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query"); 
																throw err;	
															}
															var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID,SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";
									
															var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
																if (err) {
																	console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
																	throw err;	
																}
																console.log("Success and passing the control to submitSolutionDetails Page."); 
																res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress});
												//				res.render('saveSolutionInfo', {SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
															});
														});
											});
										}
							});
						});
				connection.release();
			});

});



app.post('/getSolutionInfo', function(req, res) {
	var post = req.body;
//	var searchSolId = req.body.searchSolId.replace(/[^a-zA-Z ]/g, "");
	var searchSolId = req.body.searchSolId;
	var opportunityId = "";
//	searchSolId.replace(/[^a-zA-Z ]/g, "")
//	searchSolId= searchSolId.replace(/[^\w\s]/gi, '')
	var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID,SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = '"+searchSolId+"'";
	if(opportunityId != null && opportunityId !="")	
	{
		var opportunityId = req.body.opportunityId.replace(/[^a-zA-Z ]/g, "");
		sqlQuery=sqlQuery+' AND OPPORTUNITY_ID=\'TRIM('+opportunityId+')\'';
	}
	sqlQuery=sqlQuery+ " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";
	var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
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
			res.render('displaySolutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress});
		}
		else
		{
			res.render('captureExistingSolInfo', {errorMessage:"There is no record for selected search parameters.","searchSolId":searchSolId,"opportunityId":opportunityId});
		}
	});

});


app.post('/getSolutionArtifacts', function(req, res) {
	var post = req.body;
	//console.log('body: ' + JSON.stringify(post));
//	console.log("^^^^^^^^^^^^ Existing Solution - Solution Id : "+post.opportunityId.trim());
	
	var sqlQuery= "SELECT BASIC_DETAILS.SL_ID, BASIC_DETAILS.SOL_ID, SOL_AREA_DETAILS.SOL_AREA_ID, BASIC_DETAILS.INDUS_ID, BASIC_DETAILS.PROPOSED_DELIVERY_CENTER,BASIC_DETAILS.OPPORTUNITY_ID, BASIC_DETAILS.CUSTOMER_NAME FROM SOLUTION_BASIC_DETAILS_TRX BASIC_DETAILS, SOLUTION_AREA_DETAILS_TRX SOL_AREA_DETAILS WHERE SOL_AREA_DETAILS.SOL_ID = BASIC_DETAILS.SOL_ID AND BASIC_DETAILS.SOL_ID ="+ post.solId+ " AND SOL_AREA_DETAILS.SOL_AREA_ID =" +post.searchSolAreaId;
	if(post.opportunityId != null && post.opportunityId.trim()!="")	
		sqlQuery=sqlQuery+' AND OPPORTUNITY_ID=\'TRIM('+post.opportunityId.trim()+')\'';
	console.log(sqlQuery);
	var query = connection.query(sqlQuery, function(err, result) {
		console.log(query);
		if (err) throw err;
		
		if(result.length>0)				
		{
			setTimeout(function() {
				request.post(serviceURL+'/estimate/request?solId='+post.searchSolId.trim()+"&solAreaId="+result[0].SOL_AREA_ID,{  },
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(body)
						res.render('saveSolutionInfo', {SOL_ID:result[0].SOL_ID,SOL_AREA_ID:result[0].SOL_AREA_ID,INDUS_ID:result[0].INDUS_ID});
						}
					}
				); 
			}, 3000);
			console.log("One record found");
		}
		res.render('saveSolutionInfo', {SOL_ID:result[0].SOL_ID,SOL_AREA_ID:result[0].SOL_AREA_ID,INDUS_ID:result[0].INDUS_ID});
		/*
		if(result.length>0)				
		{
			request.post(serviceURL+'/estimate/request?solId='+post.searchSolId.trim()+"&solAreaId="+result[0].SOL_AREA_ID,{  },
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					console.log(body)
					res.render('saveSolutionInfo', {SOL_ID:result[0].SOL_ID,SOL_AREA_ID:result[0].SOL_AREA_ID,INDUS_ID:result[0].INDUS_ID});
					}
				}
			); 
			console.log("One record found");
		}
		else
		{
			console.log("No records found");
			res.render('captureExistingSolInfo', {errorMessage:"There is no record for selected search parameters.","searchSolId":post.searchSolId.trim()});
		}*/
	});
});



app.post('/saveHLSolutionInfo', function(req, res) {
	var post = req.body;
	console.log(" Control is inside saveHLSolutionInfo() ");
	var useCaseId  = req.body.useCaseId;
	//console.log('body: ' + JSON.stringify(post));
	var sqlSolId= "INSERT INTO SOLUTION_INPUT_DETAILS_TRX  (SL_ID, SOL_AREA_ID, INDUS_ID,PROPOSED_DELIVERY_CENTER,OPPORTUNITY_ID,CUSTOMER_NAME,CREATED_BY,BUSINESS_LANGUAGE) VALUES ("+post.SL_ID+","+post.SOL_AREA_ID+","+post.INDUS_ID+","+post.deliveryCenterInfo+",'"+post.opportunityId.trim()+"','"+post.clientName.trim()+"','Ajay Kumar','English')";
	console.log('************* Solution Id ' + sqlSolId);

	var query = connection.query(sqlSolId, function(err, result) {
		console.log(query);
		if (err) throw err;	
		console.log(" Insert query executed and solution id is genrated - "+result.insertId);
		console.log(" Number of selected use cases - "+useCaseId.length );
		console.log(" -----------------Number of selected use cases - ");
		var SOL_ID= result.insertId;//result[0].SOL_ID;
		var sqlQuery = "SELECT USE_CASE_ID from INDUSTRY_USE_CASES_MASTER WHERE INDUS_ID="+post.INDUS_ID+" AND SOL_AREA_ID ="+post.SOL_AREA_ID+" AND REQSUBCATEGORYID IN (";
		for (var i = 0; i <useCaseId.length ; i++) {
			if(i>0)	
				sqlQuery=sqlQuery+",";				
			sqlQuery=sqlQuery+useCaseId[i];
		}
		sqlQuery=sqlQuery+");";
		console.log("--------------- Select use cases Query "+sqlQuery); 
		var query = connection.query(sqlQuery, function(err, resultUseCasesList) {
			if (err) throw err;	
			console.log("--------------- before the insert query "); 
			var sqlInsertQuery = "INSERT INTO Solution_Requirement_Matrix  (SOL_ID, USE_CASE_ID, CREATED_BY) VALUES ";
			for (var j = 0; j <resultUseCasesList.length ; j++) {
				if(j > 0)
					sqlInsertQuery = sqlInsertQuery + ",";
				sqlInsertQuery = sqlInsertQuery + "(" +  SOL_ID + "," + resultUseCasesList[j].USE_CASE_ID+",'Ajay')";
			}
			console.log("Final use cases Insert Query : "+sqlInsertQuery);
			var querySaveUseCases = connection.query(sqlInsertQuery, function(err) {
				if (err) 
				{
					console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
					throw err;	
				}
				console.log("++++++++++++++++++++++++++ Insert query exectued ");	
				setTimeout(function() {
					request.post(serviceURL+'/estimate/request?solId='+SOL_ID+'&solAreaId='+post.SOL_AREA_ID,{  },
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
								res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
								console.log(body)
							}
						}
					);
				}, 3000);

				res.render('saveSolutionInfo', {SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
			});
		
		});

				
		console.log("^^^^^^^^^^^^New Solution - Solution Id : "+SOL_ID);

	});

});




app.post('/saveSolutionInfo', function(req, res) {
	var post = req.body;
	//console.log('body: ' + JSON.stringify(post));
	var query = connection.query('INSERT INTO SOLUTION_INPUT_DETAILS_TRX  (SL_ID, SOL_AREA_ID, INDUS_ID,PROPOSED_DELIVERY_CENTER,OPPORTUNITY_ID,CUSTOMER_NAME,CREATED_BY,BUSINESS_LANGUAGE) VALUES ('+post.SL_ID+','+post.SOL_AREA_ID+','+post.INDUS_ID+','+post.deliveryCenterInfo+',\''+post.opportunityId.trim()+'\',\''+post.clientName.trim()+'\',\'Ajay Kumar\',\'English\')', function(err, result) {
		console.log(query);
		if (err) throw err;	

		var SOL_ID= result.insertId;//result[0].SOL_ID;
		var useCaseId  = req.body.useCaseId;
		for (var i = 0; i <=useCaseId.length ; i++) {
			if(i==useCaseId.length){
				setTimeout(function() {
					request.post(serviceURL+'/estimate/request?solId='+SOL_ID+'&solAreaId='+post.SOL_AREA_ID,{  },
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
								res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
								console.log(body)
							}
						}
					);
				}, 3000);
				break;
			}
			console.log(useCaseId[i]); 
			var querySaveUseCases = connection.query('INSERT INTO Solution_Requirement_Matrix  (SOL_ID, USE_CASE_ID, CREATED_BY) VALUES ('+SOL_ID+','+useCaseId[i]+',\'Ajay\')	', function(err, resultSaveUseCases) {
				if (err) throw err;	
			});
		}
	});
});

/*	
app.post('/saveSolutionUseCasesInfo', function(req, res) {
	var post = req.body;
	var solId= post.solId;
	var useCaseId  = post.useCaseId;
	console.log("Inside saveSolutionUseCasesInfo(), useCaseId.length: "+useCaseId.length);

	var sqlInsertQuery = "INSERT INTO SOLUTION_REQUIREMENT_MATRIX  (SOL_ID, USE_CASE_ID) VALUES";
	for (var i = 0; i <useCaseId.length ; i++) {
		if(i>0)	
				sqlInsertQuery = sqlInsertQuery +",";				
			sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId[i]+")"
	}
	console.log("Inside saveSolutionUseCasesInfo(), sqlInsertQuery : "+sqlInsertQuery);
	var insertQuery = connection.query(sqlInsertQuery, function(err, solAreaResult) {
		if (err) {
			console.log("error while execution of SOLUTION_AREA_DETAILS_TRX insert query"); 
			throw err;	
		}
		var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID, SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";

		var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
			if (err) {
				console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
				throw err;	
			}
			res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"errorMessage":"Selected use cases have been saved successfully."});
		});
	});


	
	for (var i = 0; i <=useCaseId.length ; i++) {
		if(i==useCaseId.length){
			setTimeout(function() {
				request.post(serviceURL+'/estimate/request?solId='+SOL_ID+'&solAreaId='+post.SOL_AREA_ID,{  },
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
							console.log(body)
						}
					}
				);
			}, 3000);
			break;
		}
		console.log(useCaseId[i]); 
		var querySaveUseCases = connection.query('INSERT INTO Solution_Requirement_Matrix  (SOL_ID, USE_CASE_ID, CREATED_BY) VALUES ('+SOL_ID+','+useCaseId[i]+',\'Ajay\')	', function(err, resultSaveUseCases) {
			if (err) throw err;	
		});
	}
	
	
});
*/



app.post('/saveSolutionUseCasesInfo', function(req, res) {

	var post = req.body;
	var solId= post.solId;
	var useCaseId  = post.useCaseId;
	var currentSolAreaId = 0;
	console.log("Inside saveSolutionUseCasesInfo(), useCaseId.length: "+useCaseId.length);

		var sqlInsertQuery = "INSERT INTO SOLUTION_REQUIREMENT_MATRIX  (SOL_ID, USE_CASE_ID) VALUES ";
		for (var i = 0; i <useCaseId.length ; i++) {
		if(i>0)	
				sqlInsertQuery = sqlInsertQuery +",";				
			sqlInsertQuery =sqlInsertQuery +"("+solId+","+useCaseId[i]+")";
	}
		console.log("Final use cases Insert Query : "+sqlInsertQuery);
		var querySaveUseCases = connection.query(sqlInsertQuery, function(err) {
			if (err) {
				console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
				throw err;	
			}
			console.log("++++++++++++++++++++++++++ Insert query exectued ");	
			
			var querySaveUseCases = connection.query("UPDATE SOLUTION_AREA_DETAILS_TRX SET SOL_STATUS = 'COMPLETE' WHERE SOL_ID = "+solId+"  AND SOL_AREA_ID = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
				if (err)  throw err;	
			});
			

			setTimeout(function() {
				request.post(serviceURL+'/estimate/request?solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							//res.render('saveSolutionInfo', {"data":result,SOL_ID:solId,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
							console.log(body)
						}
					}
				);
			}, 3000);
			
			var sqlSolAreaId = "SELECT SOL_AREA_ID FROM SOLUTION_AREA_DETAILS_TRX WHERE SOL_ID = "+solId+"  AND SOL_AREA_ID > "+post.SOL_AREA_ID;
			var sqlSolAreaIdDetails = connection.query(sqlSolAreaId, function(err, resultSolAreaId){
				if (err) {
					console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
					throw err;	
				}
				if(resultSolAreaId.length > 0)	{
					
					currentSolAreaId = resultSolAreaId[0].SOL_AREA_ID;	
					console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
					var sqlQuery= "SELECT SL.SL_ID, SL.SL_NAME, UC_MASTER.SOL_AREA_ID, SOL_AREA.SOL_AREA_NAME, INDUSTRY.INDUS_ID, INDUSTRY.INDUS_NAME,UC_MASTER.USE_CASE_ID,LINE_OF_BUSINESS, REQCATEGORY, REQSUBCATEGORY, REQSUBCATEGORYID,USE_CASE_DESCRIPTION FROM INDUSTRY_USE_CASES_MASTER UC_MASTER, SOLUTION_AREA_INFO SOL_AREA, SERVICE_LINE_INFO SL, INDUSTRY_INFO INDUSTRY WHERE SL.SL_ID = SOL_AREA.SL_ID AND SOL_AREA.SOL_AREA_ID=UC_MASTER.SOL_AREA_ID AND INDUSTRY.INDUS_ID = UC_MASTER.INDUS_ID AND UC_MASTER.INDUS_ID="+post.INDUS_ID+" AND UC_MASTER.SOL_AREA_ID="+currentSolAreaId;
					var query = connection.query(sqlQuery, function(err, solAreaResult) {
						if (err) throw err;	
						if(solAreaResult.length > 0) {
							console.log(" ***** Inside saveSolutionUseCasesInfo, Success and forward to getUseCaseInfo ");
							res.render('getUseCaseInfo', {"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":post.useCaseInfoType});
							
						}
						else {
							console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
							var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID, SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+post.solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";
							var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
								if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
									throw err;	
								}
								console.log("Success and passing the control to saveSolutionUseCasesInfo Page."); 
								res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].SOL_AREA_NAME+". Please contact support team."});
							});

						}
					});
				}
				else {
					var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID, SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";

					var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
						if (err) {
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
							throw err;	
						}
						res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"Selected use cases for "+ solDetailsInfo[0].SOL_AREA_NAME+ " have been saved successfully."});
					});					
				}




		});
	});
});












app.post('/saveSolutionHLUseCasesInfo', function(req, res) {
	var post = req.body;
	var solId= post.solId;
	var useCaseId  = post.useCaseId;
	var sqlQuery = "SELECT USE_CASE_ID from INDUSTRY_USE_CASES_MASTER WHERE INDUS_ID="+post.INDUS_ID+" AND SOL_AREA_ID ="+post.SOL_AREA_ID+" AND REQSUBCATEGORYID IN (";
	for (var i = 0; i <useCaseId.length ; i++) {
		if(i>0)	
			sqlQuery=sqlQuery+",";				
		sqlQuery=sqlQuery+useCaseId[i];
	}
	sqlQuery=sqlQuery+");";
	console.log("-------Inside saveSolutionHLUseCasesInfo() - Select use cases Query : "+sqlQuery); 
	var query = connection.query(sqlQuery, function(err, resultUseCasesList) {
		if (err) throw err;	
		console.log("--------------- before the insert query "); 
		var sqlInsertQuery = "INSERT INTO SOLUTION_REQUIREMENT_MATRIX  (SOL_ID, USE_CASE_ID) VALUES ";
		for (var j = 0; j <resultUseCasesList.length ; j++) {
			if(j > 0)
				sqlInsertQuery = sqlInsertQuery + ",";
			sqlInsertQuery = sqlInsertQuery + "(" +  solId + "," + resultUseCasesList[j].USE_CASE_ID+")";
		}
		console.log("Final use cases Insert Query : "+sqlInsertQuery);
		var querySaveUseCases = connection.query(sqlInsertQuery, function(err) {
			if (err) {
				console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
				throw err;	
			}
			console.log("++++++++++++++++++++++++++ Insert query exectued ");	
			
			var querySaveUseCases = connection.query("UPDATE SOLUTION_AREA_DETAILS_TRX SET SOL_STATUS = 'COMPLETE' WHERE SOL_ID = "+solId+"  AND SOL_AREA_ID = "+post.SOL_AREA_ID, function(err,resultSaveUseCases) {
				if (err)  throw err;	
			});
			

			setTimeout(function() {
				request.post(serviceURL+'/estimate/request?solId='+solId+'&solAreaId='+post.SOL_AREA_ID,{  },
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
						//	res.render('saveSolutionInfo', {"data":result,SOL_ID:SOL_ID,SOL_AREA_ID:post.SOL_AREA_ID,INDUS_ID:post.INDUS_ID});
							console.log(body)
						}
					}
				);
			}, 3000);
			var sqlSolAreaId = "SELECT SOL_AREA_ID FROM SOLUTION_AREA_DETAILS_TRX WHERE SOL_ID = "+solId+"  AND SOL_AREA_ID > "+post.SOL_AREA_ID;
			var sqlSolAreaIdDetails = connection.query(sqlSolAreaId, function(err, resultSolAreaId){
				if (err) {
					console.log("++++++++++++++++++++++++++ Error in Insert query exectued ");			
					throw err;	
				}
				if(resultSolAreaId.length > 0)	{
					
					var currentSolAreaId = resultSolAreaId[0].SOL_AREA_ID;	
					console.log("++++++++++++++++++++++++++ new Solution Area id - "+currentSolAreaId);			
					var sqlQuery= "SELECT SL.SL_ID, SL.SL_NAME, UC_MASTER.SOL_AREA_ID, SOL_AREA.SOL_AREA_NAME, INDUSTRY.INDUS_ID, INDUSTRY.INDUS_NAME,UC_MASTER.USE_CASE_ID,LINE_OF_BUSINESS, REQCATEGORY, REQSUBCATEGORY,REQSUBCATEGORYID FROM INDUSTRY_USE_CASES_MASTER UC_MASTER, SOLUTION_AREA_INFO SOL_AREA, SERVICE_LINE_INFO SL, INDUSTRY_INFO INDUSTRY WHERE SL.SL_ID = SOL_AREA.SL_ID AND SOL_AREA.SOL_AREA_ID=UC_MASTER.SOL_AREA_ID AND INDUSTRY.INDUS_ID = UC_MASTER.INDUS_ID AND UC_MASTER.INDUS_ID="+post.INDUS_ID+" AND UC_MASTER.SOL_AREA_ID="+currentSolAreaId+" GROUP BY REQSUBCATEGORYID";	
					var query = connection.query(sqlQuery, function(err, solAreaResult) {
						if (err) throw err;	
						if(solAreaResult.length > 0) {
							console.log(" ***** Inside captureSolAreaUseCases, Success and forward to getHL	UseCaseInfo ");
							res.render('getHLUseCaseInfo', {"solAreaResult":solAreaResult,"solId":post.solId,"useCaseInfoType":post.useCaseInfoType});
						}
						else {
							console.log(" +++++  Inside captureSolAreaUseCases, No result and forward to solution details page");
							var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID, SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+post.solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";
							var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
								if (err) {
									console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
									throw err;	
								}
								console.log("Success and passing the control to saveSolutionHLUseCasesInfo Page."); 
								res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"There are no use cases available for  "+solDetailsInfo[currentSolAreaId-1].SOL_AREA_NAME+". Please contact support team."});
							});

						}
					});
				}
				else {
					var sqlQuery = "SELECT SOLUTION_BASIC_DETAILS_TRX.SOL_ID, SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID, SOLUTION_AREA_DETAILS_TRX.SOL_STATUS, iFNULL(SOLUTION_AREA_DETAILS_TRX.ESTIMATED_EFFORTS,'To be calculated') ESTIMATED_EFFORTS, SOLUTION_AREA_INFO.SOL_AREA_NAME, SOLUTION_AREA_INFO.SL_ID, SERVICE_LINE_INFO.SL_NAME,INDUSTRY_INFO.INDUS_ID,INDUSTRY_INFO.INDUS_NAME FROM SOLUTION_AREA_DETAILS_TRX, SOLUTION_BASIC_DETAILS_TRX, SERVICE_LINE_INFO, SOLUTION_AREA_INFO, INDUSTRY_INFO WHERE INDUSTRY_INFO.INDUS_ID = SOLUTION_BASIC_DETAILS_TRX.INDUS_ID AND SOLUTION_AREA_INFO.SOL_AREA_ID = SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID AND SERVICE_LINE_INFO.SL_ID = SOLUTION_AREA_INFO.SL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = SOLUTION_AREA_DETAILS_TRX.SOL_ID AND SOLUTION_BASIC_DETAILS_TRX.SOL_ID = "+solId + " ORDER BY SOLUTION_AREA_DETAILS_TRX.SOL_AREA_ID";

					var sqlSolutionDetails = connection.query(sqlQuery, function(err, solDetailsInfo){
						if (err) {
							console.log("error while execution of SOLUTION_AREA_DETAILS_TRX select  query"); 
							throw err;	
						}
						res.render('solutionDetails', {"solDetailsInfo":solDetailsInfo,"ipAddress":ipAddress,"errorMessage":"Selected use cases have been saved successfully."});
					});					
				}




			});
		});
	});
});


app.post('/getSolutionInfo___OLD', function(req, res) {
	var post = req.body;
	//console.log('body: ' + JSON.stringify(post));
//	console.log("^^^^^^^^^^^^ Existing Solution - Solution Id : "+post.opportunityId.trim());
	var sqlQuery= 'SELECT SL_ID, SOL_ID,SOL_AREA_ID, INDUS_ID,PROPOSED_DELIVERY_CENTER,OPPORTUNITY_ID,CUSTOMER_NAME FROM SOLUTION_INPUT_DETAILS_TRX  WHERE SOL_ID='+post.searchSolId.trim();
	if(post.opportunityId != null && post.opportunityId.trim()!="")	
		sqlQuery=sqlQuery+' AND OPPORTUNITY_ID=\'TRIM('+post.opportunityId.trim()+')\'';
	console.log(sqlQuery);
	var query = connection.query(sqlQuery, function(err, result) {
		console.log(query);
		if (err) throw err;
		

		if(result.length>0)				
		{
			setTimeout(function() {
				request.post(serviceURL+'/estimate/request?solId='+post.searchSolId.trim()+"&solAreaId="+result[0].SOL_AREA_ID,{  },
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(body)
						res.render('saveSolutionInfo', {SOL_ID:result[0].SOL_ID,SOL_AREA_ID:result[0].SOL_AREA_ID,INDUS_ID:result[0].INDUS_ID});
						}
					}
				); 
			}, 3000);
			console.log("One record found");
		}
		else
		{
			console.log("No records found");
			res.render('captureExistingSolInfo', {errorMessage:"There is no record for selected search parameters.","searchSolId":post.searchSolId.trim()});
		}
	});
});



app.post('/validateLoginInfo', function(req, res) {
	var sqlLoginQuery = "SELECT EMP_EMAILID,EMP_ID,EMP_FNAME,EMP_LNAME FROM USERS WHERE EMP_EMAILID='"+req.body.userName.trim()+"' AND PASSWORD='"+req.body.password.trim()+"';";
	console.log("======sqlLoginQuery  " +sqlLoginQuery );
	var loginQuery = connection.query(sqlLoginQuery, function(err, loginResult) {
		if(loginResult.length>0){
			res.render('advisorHome', {'loginResult': loginResult,'userName':req.body.userName});
		}
		else {
			res.render('login', {errorMessage:"User credential are not verified. Please provide correct user name and password."});
		}

	});
});





app.get('/getIndustryInfo', function(req, res) {
	var id=req.params.id;
	var query = connection.query("SELECT INDUS_ID,INDUS_NAME,INDUS_DESCRIPTION FROM INDUSTRY_INFO WHERE INDUS_ID IN (7,12,15) ORDER BY INDUS_NAME", function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});
});

app.get('/getDeliveryCenterInfo', function(req, res) {
	var id=req.params.id;
	var query = connection.query('SELECT DELIVERY_ORG_ID,DELIVERY_ORG_TYPE, DELIVERY_ORG_NAME FROM DELIVERY_ORG_DETAILS_MASTER ORDER BY DELIVERY_ORG_ID', function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});
});


app.get('/Solution_Area_InfoSolution_Asusmptions_MASTER', function(req, res) {
	var query = connection.query('Select * from Solution_Area_InfoSolution_Asusmptions_MASTER', function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});
});


app.get('/Solution_Input_Details_TRX', function(req, res) {
	var query = connection.query('Select * from Solution_Input_Details_TRX', function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});
});


app.get('/Solution_Requirement_Matrix', function(req, res) {
	var query = connection.query('Select * from Solution_Requirement_Matrix', function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});

});


app.get('/Staffing_Plan_TRX', function(req, res) {
	var query = connection.query('Select * from Staffing_Plan_TRX', function(err, result) {
	//	console.log(JSON.stringify(result));
		res.send(result);
	});
});





app.get('/doEstimation', function(req, res) {
	request.post(
    serviceURL+'/estimate/46' ,
    {  },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
				res.render('advisorHome', {'name': 'maksood'});
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

app.listen(8081, function() {
	// print a message when the server starts listening
	console.log("server starting on " + appEnv.url);
//	console.log("server starting on " + appEnv.bind);
	//var address = app.address();
	//console.log('opened server on : '+ address);
});

