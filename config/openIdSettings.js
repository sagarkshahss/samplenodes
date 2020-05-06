
var config = require('../config/configTest');
var redirectUrl;
if(config.envCheck == 'prod') {
	redirectUrl="https://inmbzp4232.in.dst.ibm.com:6004/rfp/auth/sso/callback"
	
} else if(config.envCheck == 'test') {
	redirectUrl="https://inmbzp4233.in.dst.ibm.com:6004/rfp/auth/sso/callback"
	
} else if(config.envCheck == 'dev') {
	redirectUrl="https://localhost:6004/rfp/auth/sso/callback"

}

module.exports={
	openIdConfigObj:{
		client_id:"YzUzMWY1M2MtOGFkYi00",
		client_secret:"YTVhN2VkNmQtMjg2OC00",
		authorization_url:"https://w3id.alpha.sso.ibm.com/isam/oidc/endpoint/amapp-runtime-oidcidp/authorize",
		token_url:"https://w3id.alpha.sso.ibm.com/isam/oidc/endpoint/amapp-runtime-oidcidp/token",
		issuer_id:"https://w3id.alpha.sso.ibm.com/isam",
		introspect_url:"https://w3id.alpha.sso.ibm.com/isam/oidc/endpoint/amapp-runtime-oidcidp/introspect",
		callback_id:redirectUrl
	}
}