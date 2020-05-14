
module.exports = {
		database: {
		  	connectionString: {
			
				connectionLimit : 100, // important
				host : 'inmbzp4233.in.dst.ibm.com',
				user : 'scott',
				password : 'Sc0tty!xm',
				database : 'soladvisor3',
				debug : false
			}
		},
		port: 6002,
		httpsPort: 6004,
		restApiPort: 8080,
		javaWarName: "ixm",
		restApiServer: "localhost",
		restApiSubString: ":8080/ixm",
		authHostString: 'adikbservices.mybluemix.net',
		envCheck: 'dev'  
};