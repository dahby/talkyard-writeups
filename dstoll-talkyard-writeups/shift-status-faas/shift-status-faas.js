function lambda(input, callback) {
	// Importing the FaaS Toolbelt
	const { Toolbelt } = require("lp-faas-toolbelt");
	// Obtain an HTTPClient Instance from the Toolbelt
	const httpClient = Toolbelt.HTTPClient(); // For API Docs look @ https://www.npmjs.com/package/request-promise
	// Obtain a secretClient instance from the Toolbelt to access your saved Conversation Orchestrator key
	const secretClient = Toolbelt.SecretClient();
   
	//  set your account number here
	const accountNumber = ''
   
	const loginURL = `https://va.agentvep.liveperson.net/api/account/${accountNumber}/login?v=1.3`;
	const shiftStatusURL = `https://va.msg.liveperson.net/api/account/${accountNumber}/shift-status`;
	const contextWarehouseURL = `https://z1.context.liveperson.net/v1/account/${accountNumber}/shift-status-api/properties`
   
   // retrieve secrets from secret store
   async function fetchSecret(key) {
	const secret = await secretClient.readSecret(key);
	return secret.value;
   }
   
   // log bot user in to obtain bearer token and pass to shiftStatusByAccount function
   async function loginBotUser() {
	const loginCredentials = await fetchSecret('loginCredentials');
	httpClient(loginURL, {
	 method: 'POST',
	 headers: {
	   'Content-Type': 'application/json',
	   'Accept': 'application/json'
	 },
	 simple: false,
	 json: true,
	 resolveWithFullResponse: false,
	 body: loginCredentials
	})
	.then(response => {
	 console.info('Successfully returned data from login api');
	 const bearerToken = response.bearer;
	 shiftStatusByAccount(bearerToken);
	})
	.catch(err => {
	 console.error(err);
	 callback(err);
	});
   }
   
	// use bearer token to access shift status by account api, format the data, and pass to updateContextWarehouse function
	function shiftStatusByAccount(token) {
	 httpClient(shiftStatusURL, {
	  method: 'GET',
	  headers: {
		'Authorization': `Bearer ${token}`
	  },
	  simple: false,
	  json: true,
	  resolveWithFullResponse: false
	 })
	 .then(response => {
	  console.info('Successfully returned data from shift status by account api');
	  const formattedResponse = formatShiftStatusData(response);
	  updateContextWarehouse(formattedResponse);
	 })
	 .catch(err => console.error(err));
	}
   
	// update global context of context session store at shift-status-api namespace
	async function updateContextWarehouse(shiftStatusData) {
	 const mavenApiKey = await fetchSecret('mavenApiKey');
	 httpClient(contextWarehouseURL, {
	  method: 'PATCH',
	  headers: {
		'Content-Type': 'application/json',
		'maven-api-key': mavenApiKey
	  },
	  body: shiftStatusData,
	  simple: false,
	  json: true,
	  resolveWithFullResponse: false
	 })
	 .then(() => {
	  callback(null, 'Successfully updated Conversation Context Service');
	 })
	 .catch(err => {
	  console.error(err);
	  callback(err);
	 })
	}
   
	// Format the result to add a timestamp as well as use skill id as key in global context store to make accessing skill id information easier.
	function formatShiftStatusData(shiftStatusData) {
	 const currentTime = new Date();
	 const formattedData= {timestamp: currentTime};
   
   
	 shiftStatusData.forEach(skill => {
	  const dataObj = skill;
	  formattedData[skill.skillId] = dataObj;
	 })
   
	 return formattedData;
	}
   
	// run loginBotUser function
	loginBotUser();
   }