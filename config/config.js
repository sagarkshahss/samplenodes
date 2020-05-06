
module.exports = {
  	
	database: {
	  	connectionString: {
		
			connectionLimit : 100, // important
			host : '9.109.122.233',
			user : 'scott',
			password : 'Sc0tty!xm',
			database : 'soladvisor_na',
			debug : false
		}
	},
	port: 6002,
	restApiPort: 8080,
	javaWarName: "ixm",
	restApiSubString: ":8080/ixm",
	authHostString: 'adikbservices.mybluemix.net'  
};