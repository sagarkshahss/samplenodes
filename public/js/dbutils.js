module.exports.populateDashboard = function(pool,connection, res, req) {
			console.log("Inside populateDashboard");
			
			var sqlQuery = "SELECT sol_details.sol_id, sol_area_name,indus_name, DATE_FORMAT(sol_area_trx.creation_date,'%d-%m-%Y') creation_date, if(customer_name IS NULL or customer_name='' ,'Not available',customer_name ) customer_name, if(opportunity_id IS NULL or opportunity_id='' ,'Not available',opportunity_id ) opportunity_name FROM solution_basic_details_trx sol_details, solution_area_details_trx sol_area_trx, industry_info	indus_name, solution_area_info	sol_area WHERE sol_details.created_by = '"+req.session.user.emp_emailid +"' and sol_details.sol_id = sol_area_trx.sol_id  and indus_name.indus_id = sol_details.indus_id and sol_area.sol_area_id = sol_area_trx.sol_area_id and sol_area_trx.nfr_type=0 order by sol_details.sol_id";
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
	

};