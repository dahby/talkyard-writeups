# Caching Current Queue Health APIs w/ FaaS & Context Warehouse

LivePerson provides a number of APIs which are designed to be used with Reporting Dashboards to inform on items such as the status of the queue and the shift status of agents. Having this information readily accessible within Conversation Builder can assist with correctly setting expectations or properly routing individuals when a skill may not be availabe to escalate to. Unfortunately, many of these reporting dashboard APIs are not intended for use at a Conversational Scale and doing so could be detrimental to the stability of our platform.

This guide is intended to provide an alternative to calling these APIs at every conversation. By using several Conversational Cloud services in conjunction with one another to regularly cache needed data, we can make this information accessible in a more robust service which is properly scaled to handle the volume of calls from each conversation.

## Prerequesites
This guide assumes that you have access to the following:
* Conversation Builder
* Conversation Orchestrator
* FaaS
* An API client, such as [Postman](https://www.postman.com/)

## Overview
This guide will cover the following steps to provide access to data from the [Messaging Current Queue Health API](https://developers.liveperson.com/messaging-operations-api-methods-messaging-current-queue-health.html):

1. Create a new namespace in the Context Warehouse to serve as our cache.
2. Create a `currentQueueHealth` FaaS function to call the API and send the results to the newly created Context Warehouse namespace.
3. Schedule invocation of our function to run every 5 minutes, to continually update the store.
4. Create the Conversation Builder integration to pull in the cached data.

## Set up Context Warehouse

The [Context Session Store](https://developers.liveperson.com/conversation-orchestrator-context-warehouse-context-session-store.html) within Conversation Orchestrator allows brands to store, retrive, and manage custom attributes that can be used within a variety of Conversational Cloud services. The first step in this guide walks through the creation of a new namespace within the Context Session Store using Postman.

1. Navigate to **Conversation Orchestrator** using the grid menu in the lower left of Conversational Cloud.
2. Click *Developer Key* at the bottom of the left hand menu and copy your API key. This will be used in all of our calls to the Context Warehouse.
3. Open **Postman** (or your API client of choice) and create a new HTTP request with the following:
  
	 * **Method**: `POST`
	 * **URL**: `https://{baseUrl}/v1/account/{accountNumber}`
    	 * Replace `{baseUrl}` with the correct URL for your environment, found [here](https://developers.liveperson.com/conversation-orchestrator-context-warehouse-context-session-store.html#methods).
    	 * Replace `{accountNumber}` with your Conversational Cloud account number.

	* **Headers**: 
		```
		Content-Type: application/json

		maven-api-key: {mavenApiKey}
		```

    	* Replace `{mavenApiKey}` with your copied developer key from Conversation Orchestrator

   * **Body**: 
		```
		{
			"name": "messaging-operations-api"
		}
		```

     * In this example, this namespace is titled `messaging-operations-api`, as the *Messaging Current Queue Health* method belongs to it. Take note to what the namespace is called, as it will be used when updating the contained values.
  
4. Sending this request will result in a `204` status if constructed correctly. To verify that the new namespace has been created, send a GET request to the same URL, omitting the **body** and the return will show all namespaces created under your account.

A namespace has now been created which will house our cache of data from the Messaging Operations API. Next, we'll create a new scheduled FaaS invocation to populate this namespace on regular intervals.

## Create and schedule a FaaS function

1. Navigate to **Functions** using the grid menu in the lower left of Conversational Cloud.
2. Save your Conversation Orchestrator API key to your Secret Storage.
   1. Click the setting icon at the bottom of the left hand menu.
   2. Click on the *Secret Storage* menu
   3. Click the *Add a secret* button
   4. Create a new secret with the following:
      * **Key**: `mavenApiKey`
      * **Type**: `String`
      * **Value**: Your Conversation Orchestrator API key
  
3. Navigate to the *Functions* tab on the left and select the *Create a Function* button.
4. Complete the *Coding Details* section with the following:
   * **Event**: No Event
   * **Template**: Greeting Template
   * **Access to external domains?**: No
     * This use case does not require external domains to be whitelisted. 

	Click *Continue*

5. Complete the *Function Description* section with the following:
   * **Function Name**: currentQueueHealth
   * **Description**: Retrieve current queue info on scheduled intervals and update a namespace in Context Warehouse.

	Click *Create Function*


6. In the resulting code editor screen, replace the existing code with the following:
```js
function lambda(input, callback) {
  // Importing the FaaS Toolbelt
  const { Toolbelt } = require("lp-faas-toolbelt");
  // Obtain an HTTPClient Instance from the Toolbelt
  const httpClient = Toolbelt.HTTPClient(); // For API Docs look @ https://www.npmjs.com/package/request-promise
  // Obtain an lpClient Instance from the Toolbelt
  const lpClient = Toolbelt.LpClient();
  // Obtain a secretClient instance from the Toolbelt to access your saved Conversation Orchestrator key
  const secretClient = Toolbelt.SecretClient();

  // Context Warehouse URL. See the *Set custom namespace properties within a session* method for documentation https://developers.liveperson.com/conversation-orchestrator-context-warehouse-context-session-store.html#methods
  const contextWarehouseUrl = 'https://z1.context.liveperson.net/v1/account/{accountNumber}/messaging-operations-api/properties';

  // Variables to access API using LpClient instance. See documentation @ https://developers.liveperson.com/liveperson-functions-developing-with-faas-toolbelt.html#liveperson-client. Replace {accountNumber} with your Conversational Cloud account number.
  const lpServiceName = 'leDataReporting';
  const apiEndpoint = '/operations/api/account/{accountNumber}/msgqueuehealth/current/?v=1';
  const apiOptions = {
    method: 'GET',
    json: true
  }

  // Updates context warehouse messaging-operations-api namespace
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

  // retrieves conversation orchestrator api key from secret store
  function fetchSecret() {
    return secretClient
      .readSecret("mavenApiKey")
      .then(mySecret => {
        return mySecret.value;
    })
  }

  // LpClient instance calls api and passes result to the updateContextWarehouse function
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
```

   * Using the HTTP and LP Clients from the `lp-faas-toolbelt` package, this function calls the current queue health API and passes that to a function to call and update the context Warehouse.

7. After saving, deploy the function using the three dot menu at the end of the function's row. Once deployed, invoke the function to test and ensure that it is working. If successful, the logs should read `Successfully updated Context Warehouse`.
8. Verify using Postman that the namespace and session have been updated in the Context Warehouse. To test, provide the following details to your API client:
   * **Method**: `GET`
   * **URL**: `https://{baseUrl}/v1/account/{accountNumber}/messaging-operations-api/properties`
      *  Replace `{baseUrl}` with the correct URL for your environment, found [here](https://developers.liveperson.com/conversation-orchestrator-context-warehouse-context-session-store.html#methods).
   	 * Replace `{accountNumber}` with your Conversational Cloud account number.

	* **Headers**: 
		```
		Content-Type: application/json

		maven-api-key: {mavenApiKey}
		```

    	* Replace `{mavenApiKey}` with your copied developer key from Conversation Orchestrator

    If successful, the call to the Context Warehouse will display the results of the Messaging Current Queue Health API.

9. Schedule the FaaS invocation by selecting the *Schedules* tab from the left hand menu. Tap the *Create a schedule* button and select the newly deployed function from the resulting dropdown.
10. Schedule the function invocation and whichever interval fits the use case for your brand. For this example, entering `/5` in the *Minutes* field will result in this function running and updating the Context Warehouse every 5 minutes.

With the function scheduled, we now have a session within our Context Warehouse being updated with a reasonable approximation of the current queue health, including information on the estimated wait time. 

## Access the Context Warehouse data using Conversation Builder

We can now responsibly query for data from the Context Warehouse for use within Conversation Builder. The following example demonstrates using [Context Session Store methods](https://developers.liveperson.com/conversation-builder-scripting-functions-manage-the-context-session-store.html) to retrieve and display the relevant information.

1. Ensure you have access to the Context API 
   * From the Conversational AI menu of the Conversational Cloud, navigate into *Bot Accounts* and select your account
   * In *Account Details*, toggle the *Enable Context API* switch to *on* 
   * Select the *Use Conversational Cloud Site ID* option and enter your account number

> Note: If you do not have access to this tool or process, contact your LivePerson account representative. Alternatively, Context Warehouse data can be accessed via API integration, however make sure to follow best practices in safeguarding secrets and API keys by taking advantage of environment variables.
  
2. Navigate to your bot in Conversation Builder. You will now have access to Context Session Store methods in Global Functions, as well as Pre/Post process code editors for each interaction.
3. Test out your ability to access this data by creating a new text interaction with the following pre-process code included:
   ```js
    var e = botContext.getGlobalContextData('messaging-operations-api', 'skillsMetrics');
    var skillId = botContext.getBotVariable('skillId');
    var awt = e[skillId].avgWaitTimeForAgentAssignment_AfterTransferFromAgent;
    botContext.setBotVariable('awt', awt, true, false);
   ```

  This code queries the Context Warehouse for the messaging operations api data and retrieves the average wait time for the skill in question. This information can be useful in setting expectations for your users prior to escalation. 

> Note: The screenshot above displays the call in a demo environment. ‘-1’ is the default value if there is no relevant data being returned, and as this is a demo deployment, there currently isn’t a wait time. However, by returning the -1 value, we can see that we are accessing the correct field in our data.

## Conclusion

We are now able to responsibly use the data from our reporting dashboard API to make decisions in our bot automations. While the specific use case may vary based on the needs of your brand, the steps outlined in this guide provide a foundation to query this data and make appropriate routing and expectation setting decisions for your users.