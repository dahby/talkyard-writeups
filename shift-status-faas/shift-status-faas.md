# Caching Shift Status API Data w/ FaaS & Conversation Context Service

This guide is meant to supplement [Caching Current Queue Health APIs w/ FaaS & Conversation Context Service](https://talkyard.livepersonai.com/-72/caching-current-queue-health-apis-w-faas-conversation-context-service). The concepts and core functionality are all the same, however, because the [Shift Status API](https://developers.liveperson.com/shift-status-api-methods-get-shift-status-by-account.html), along with some other APIs are not supported by the FaaS Toolbelt's `lpClient` method, this guide will highlight where changes need to be made in your approach. Please see the original linked post for details on setting up the Conversation Context Service and understanding how to schedule the FaaS function.

## Preparation to use Login API

The Shift Status by Account API requires a bearer token retrieved from a logged-in bot in order to retrieve shift status information for all account skills. Because we want our FaaS to run periodically without being called from a bot, this means we need to call the Login API with a bot's credentials from our FaaS function to ensure we have a current and valid bearer token when retrieving shift status information. For this example, we'll create a new bot agent and store the needed credentials using FaaS `secretClient` methods.

### Create a new bot agent

In the Conversational Cloud, navigate to the User Management section and create a new bot agent using the same process you would when setting an agent connector. For this example, I've created an agent with a login name of `login-api-faas`.
<!-- LOGIN NAME IMAGE HERE -->
Fill out the remaining fields of the add user form as you would like. When you reach the "Add login method" section, make sure to select API key, generate a new key, and record the various vital details. You will need the following to retrieve the bearer token in FaaS:

* login name
* App key
* Secret
* Access Token
* Access Token Secret
<!-- LOGIN CREDENTIALS IMAGE HERE -->
After recording this information, assign your new bot agent the role of "agent" and save. You do not need to give this bot agent a skill to retrieve the bearer token from it.

### Save Login Credentials in FaaS Secret Storage

1. Navigate into **Functions** using the grid menu in the lower left of Conversational Cloud.

2. Click on the *Secret Storage* menu
3. Click the *Add a secret* button
4. Create a new secret with the following:
   * **Key**: loginCredentials
   * **Type**: JSON

For the value, insert a JSON object with information retrieved previously from your bot agent.

```json
{
 "username": "{{bot username}}",
 "appKey": "{{bot app key}}",
 "secret": "{{bot secret}}",
 "accessToken": "{{bot access token}}",
 "accessTokenSecret": "{{bot access token secret}}"
}
```
<!-- CREATE SECRET IMAGE HERE -->

Click create when finished.

Also, ensure that you have your Conversation Orchestrator key saved to the secret storage before moving on. For instructions to do so, please see the original guide referenced at the beginning of this document.

## Create the function

Using the same process as the previous guide, create a new function to pull down the shift status API information and save the data to the Context Session Store. The full code of the function is listed below with comments explaining what each piece of the function does.

```js
function lambda(input, callback) {
 // Importing the FaaS Toolbelt
 const { Toolbelt } = require("lp-faas-toolbelt");
 // Obtain an HTTPClient Instance from the Toolbelt
 const httpClient = Toolbelt.HTTPClient(); // For API Docs look @ https://www.npmjs.com/package/request-promise
 // Obtain a secretClient instance from the Toolbelt to access your saved Conversation Orchestrator key
 const secretClient = Toolbelt.SecretClient();

 const loginURL = 'https://va.agentvep.liveperson.net/api/account/53615687/login?v=1.3';
 const shiftStatusURL = 'https://va.msg.liveperson.net/api/account/53615687/shift-status';
 const contextWarehouseURL = 'https://z1.context.liveperson.net/v1/account/53615687/shift-status-api/properties'

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
```

This function does several things, but ultimately it logs a bot agent in, uses that bearer token to call the shift status API, passes that information to a function to format it, and then passes that data to a function to update the Context Session Store. Looking at this data in the Context Session Store using Postman, we see the following:

<!--  POSTMAN RESPONSE IMAGE HERE -->

As you can see, we now have a collection of keys in the global scope of our Context Session Store which map to the skill IDs currently on the account. Additionally, we have a timestamp so that you can see when these values have been last updated. With that in hand, we can now access those values from within Conversation Builder using the provided scripting functions.

## Conclusion

With our function built out and working, set it to a schedule to periodically cache the shift status information in the Conversation Context Service. Once that scheduled FaaS is running, you can pass the namespace and skill ID you want to check to the `getGlobalContextData` function to pull the relevant information into your bot. This will allow you to run a check prior to escalating to a skill to ensure the best possible experience for your users. Please see the attached articles for more information on ways to use the Conversation Context Service and reporting dashboard functions to improve your bot solutions.

[Manage the Conversation Context Service w/ Conversation Builder](https://talkyard.livepersonai.com/-84/guide-manage-the-conversation-context-service-w-conversation-builder)
[Caching Current Queue Health APIS w/ FaaS & Conversation Context Service](https://talkyard.livepersonai.com/-72/caching-current-queue-health-apis-w-faas-conversation-context-service)
