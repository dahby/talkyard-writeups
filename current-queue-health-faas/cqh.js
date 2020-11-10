function lambda(input, callback) {
  // Importing the FaaS Toolbelt
  const { Toolbelt } = require("lp-faas-toolbelt");
  // Obtain an HTTPClient Instance from the Toolbelt
  const httpClient = Toolbelt.HTTPClient(); // For API Docs look @ https://www.npmjs.com/package/request-promise
  // Obtain an lpClient Instance from the Toolbelt
  const lpClient = Toolbelt.LpClient();
  // Obtain a secretClient instance from the Toolbelt to access your saved Conversation Orchestrator key
  const secretClient = Toolbelt.SecretClient();

  // Context Warehouse URL 
  const contextWarehouseUrl = 'https://z1.context.liveperson.net/v1/account/6585768/messaging-operations-api/current-queue-health/properties';

  // Variables to access Current Queue Health API
  const lpServiceName = 'leDataReporting';
  const apiEndpoint = '/operations/api/account/6585768/msgqueuehealth/current/?v=1';
  const apiOptions = {
    method: 'GET',
    json: true
  }

  function updateContextWarehouse(data, key) {
    httpClient(contextWarehouseUrl, {
      method: "PATCH", //HTTP VERB
        headers: {
            "Content-Type": "application/json",
            "maven-api-key": key
        }, //Your headers
        body: data,
        simple: false, //IF true => Status Code != 2xx & 3xx will throw
        json: true, // Automatically parses the JSON string in the response
        resolveWithFullResponse: false //IF true => Includes Status Code, Headers etc.
    })
    .then(response => {
        console.info('Successfully updated Context Warehouse');
        callback(null, response)
    })
    .catch(err => console.error(err))
  }

  function fetchSecret() {
    return secretClient
      .readSecret("mavenApiKey")
      .then(mySecret => {
        return mySecret.value;
    })
  }

  lpClient(lpServiceName, apiEndpoint, apiOptions)
    .then(response => {
        console.info(response)
        fetchSecret()
        .then(secret => {
          updateContextWarehouse(response, secret);
        })
        
    }).catch(err => {
        callback(null, err)
    })
}