function lambda(input, callback) {
	// Importing the FaaS Toolbelt
	const { Toolbelt } = require("lp-faas-toolbelt");
	// Obtain an HTTPClient Instance from the Toolbelt
	const httpClient = Toolbelt.HTTPClient(); // For API Docs look @ https://www.npmjs.com/package/request-promise

	const loginURL = 'https://va.agentvep.liveperson.net/api/account/{{accountId}}/login?v=1.3';
	const loginBody = {
			'username': '{{bot login name}}',
			'appKey': '{{bot app key}}',
			'secret': '{{bot secret}}',
			'accessToken': '{{bot access token}}',
			'accessTokenSecret': '{{bot access token secret}}'
	};
	const shiftStatusURL = 'https://{{domain}}/api/account/{{accountId}}/shift-status?accountId={{accountId}}';
	const contextWarehouseURL = 'https://{{domain}}/v1/account/{{accountId}}/shift-status-api/properties'

	// start the process by logging a bot user in and retrieving bearer token
	httpClient(loginURL, {
		method: 'POST',
		headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
		},
		simple: false,
		json: true,
		resolveWithFullResponse: false,
		body: loginBody
	})
	.then(response => {
		console.info('Successfully returned data from login api');
		const bearerToken = response.bearer;
		shiftStatusByAccount(bearerToken);
	})
	.catch(err => console.error(err));

	// using bearer token, retrieve shift status api information, format, and pass to context service to save.
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
			console.info(formattedResponse);
			updateContextWarehouse(formattedResponse);
		})
		.catch(err => console.error(err));
	}

	// format returned data to an object w/ skill ids as keys. This will simplify retrieval of shift status info for specific skills from context service
	function formatShiftStatusData(shiftStatusData) {
		const formattedData= {};

		shiftStatusData.forEach(skill => {
			const dataObj = skill;
			formattedData[skill.skillId] = dataObj;
		})

		return formattedData;
	}

	// update context service with formatted shift status data.
	function updateContextWarehouse(shiftStatusData) {
		httpClient(contextWarehouseURL, {
			method: 'PATCH',
			headers: {
					'Content-Type': 'application/json',
					'maven-api-key': 'uqoBerB2NENTM2MTU2ODc='
			},
			body: shiftStatusData,
			simple: false,
			json: true,
			resolveWithFullResponse: false
		})
		.then(response => {
			console.info('Successfully updated Conversation Context Service')
			callback(null, response)
		})
		.catch(err => console.error(err))
	}
}