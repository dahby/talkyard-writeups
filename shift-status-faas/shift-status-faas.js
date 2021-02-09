function lambda(input, callback) {
	// Importing the FaaS Toolbelt
	const { Toolbelt } = require("lp-faas-toolbelt");
	// Obtain an HTTPClient Instance from the Toolbelt
	const httpClient = Toolbelt.HTTPClient(); // For API Docs look @ https://www.npmjs.com/package/request-promise
	// Obtain a secretClient instance from the Toolbelt to access your saved Conversation Orchestrator key
	const secretClient = Toolbelt.SecretClient();

	const loginURL = 'https://va.agentvep.liveperson.net/api/account/53615687/login?v=1.3';
	const loginBody = {
		'username': 'Shift Status FaaS Bot',
		'appKey': 'bc1a5abd3a5f405992a0d0438b0abd5f',
		'secret': '11f7aca213a02ea2',
		'accessToken': 'e6848d9c15254c08a44e5410cf05b0fe',
		'accessTokenSecret': '32566ad8f60a9aeb'
	};
	const shiftStatusURL = 'https://va.msg.liveperson.net/api/account/53615687/shift-status';
	const contextWarehouseURL = 'https://z1.context.liveperson.net/v1/account/53615687/shift-status-api/properties'

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

	function formatShiftStatusData(shiftStatusData) {
		const formattedData= {};

		shiftStatusData.forEach(skill => {
			const dataObj = skill;
			formattedData[skill.skillId] = dataObj;
		})

		return formattedData;
	}
}