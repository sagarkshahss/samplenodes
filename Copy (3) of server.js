//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";


/*

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  
      res.render('login.html');
   
});
 */
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
	// res.render('login.html');// This was just for testing.
});


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
