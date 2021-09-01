# GUIDE - Notify via email on API failure

API Failures happen. When they do, we may want to provide a method to notify a third party service, whether through an API call or an sent email. This guide will walk through the process of collecting information on a failed API call and sending an email to notify of the details. Notifying via email provides an easy way to demonstrate this behavior, however this flow can easily be modified to send an API call with the information if that is preferred by the brand.

A JSON file with the demonstration bot is included for reference. This guide starts off with a new bot using the Custom Bot template, which provides a Welcome and Fallback dialog to begin.

## Global Functions

Starting in Global Functions allows us to define some bot variables along with some helper functions that will assist us in providing relevant information to our reporting destination.

```js
// Type values for the variables inside quotes. Don't forget to click on Save button after changes.
function __initConversation(){  
  // Email settings for email notifications can be edited here
  setVariable('ownerEmail', 'email@email.com'); // Provide email to send information gathered by bot
  setVariable('replyEmail', 'donotreply@gmail.com'); // Provide reply to email which is shown to the user
  setVariable('emailSubject', 'API Error'); // Provide your email subject 
  var emailText = "There was an issue with your API call"; // Provide your email text  
  setVariable('emailText', emailText);

  // conversation detail variables
  var accountId = botContext.getLPAccountId();
  var convId = botContext.getConversationId();
  var userId = botContext.getUserPlatformId();

  setVariable('accountId', accountId);
  setVariable('convId', convId);
  setVariable('userId', userId);
}  

// Helper functions to simplify getting and setting bot variables. These functions are used within pre/post process code blocks and should not be changed.
function setVariable(variableName, variableValue) {
  botContext.setBotVariable(variableName, variableValue, true, false);
}
function getVariable(variableName) {
  var getVar = botContext.getBotVariable(variableName);
  return getVar;
}

// Dynamically create email body using bot variables set from the results of our integration calls along with conversation variables pulled in at conversation init.
function getEmailBody(apiName, statusCode) {
  return "<p>There was an issue with your API call from Conversation Builder</p><ul><li>Integration Name: " + apiName + "</li> <li>Error Code: " + statusCode + "</li> <li> Account ID: " + getVariable('accountId') + "</li><li>Conversation ID: " + getVariable('convId') + "</li><li>User ID: " + getVariable('userId') + "</li></ul>";
}
```

See the comments in the code for details. At a high level, we are creating bot variables that will be used in our email message, along with pulling in data about the conversation itself (user ID, conv ID, & account ID) which will be reported along with the API error. When testing, ensure that the `ownerEmail` variable is set to an address that you can monitor.

## Send Email Integration

By setting the stage in Global Functions, we have greatly simplified the construction of the `Send_Email` integration. From the *Integrations* tab, create a new integration with the following details:

* **Integration Name**: `Send_Email`
* **Response Data Variable Name**: `Send_Email`
* **Integration Type**: Email
* **To**: `{$botContext.ownerEmail}`
* **Reply To**: `{$botContext.replyEmail}`
* **Subject**: `{$botContext.emailSubject}`
* **Body**: `{$botContext.emailText}`
* **Html Email**: Checked

## Store Locator Integration

This bot also includes a `Store_Locator` integration that we will use to demonstrate both successful and unsuccessful API calls. This integration calls a mockapi.io url and appends a value on the end depending on whether we want to show a successful or unsuccessful attempt. The new integration details are as follows:

* **Integration Name**: `Store_Locator`
* **Response Data Variable Name**: `Store_Locator`
* **Integration Type**: API
* **Method**: GET
* **URL**: `https://5ed69a5fc2ca2300162c67f1.mockapi.io/api/v1/stores/{$botContext.endpoint}`

Note that we are appending a bot variable named `endpoint` at the end of the URL. The value of this variable will determine the success of our call.

Also note that we are not saving any custom data fields. For the purpose of this demonstration, we are not attempting to present any data from the API, we just want to see how to direct the flow based on success/failure.

## Dialog Setup

Modify the existing welcome dialog to include an API call to our mock api and route based on the result.

### Welcome Dialog

1. Add a Multiple Choice Question which reads:

   ```
    Do you want to demonstrate a successful API call or a failure?
    - Success
    - Failure
   ```

2. Create two new custom rules in the *Next Action* section which correspond to each choice from options.

     * **Rule Name**: `Success`

        **Add Condition**: `Evaluate Options` matches `Success`

        **Add Variable**: `endpoint` with `1`

     * **Rule Name**: `Fail`

        **Add Condition**: `Evaluate Options` matches `Failure`

        **Add Variable**: `endpoint` with `bad url endpoint`

      Depending on whether the user chooses `Success` or `Failure` will determine the value of the `endpoint` bot variable. Again, this value will be appended to the API URL in the Store Locator integration.

3. Add a new Integration interaction and select the *Store_Locator* integration from the resulting dropdown. Select the *Custom Code* icon from the upper right of the interaction, navigate to the *Post-Process Code* section and paste the following code:

    ```js
    // Retrieve status code from API call
    var apiStatusCode = botContext.getApiStatusCode();
    // Set status code and name of integration as bot variables
    setVariable('apiStatusCode', apiStatusCode);
    setVariable('apiName', 'Store_Locator');
    ```

    This code uses the `getApiStatusCode` function to retrieve the status code of the most recent API attempt. We then use that value to set a bot variable `apiStatusCode`, as well as a second bot variable we manually set to a value of `Store_Locator`. Both of thse values will be used in our email integration.

    Click **Add Script** when finished.

    We'll want to add some *Next Action* rules here to route differently based on the results. However, since the interactions we'll be routing to have not yet been created, we'll come back to this step shortly.

4. Add a new Text statement that reads:

   ```
    Congrats! You've made a successful API call
    API Response: {$botContext.apiStatusCode}
   ```

    On a successful call, we'll notify the user that a successful call has been made and display the status code received.

### Catch API Failure Dialog

Create a new dialog for the purpose of catching failed API calls and sending an email notification.

1. Click **Add Dialog** in the lower left and create a new dialog with the following information:
   * **Dialog Name**: `Catch API Failure`
   * **Dialog Type**: Dialog

   Delete the provided *Dialog Starter* interaction, as this dialog will be explicitly directed to in the *Next Action* of our API call.

2. Add a new Text statement that reads:

    ```
    There was an issue with your API call. An email will be sent to the address on file.
    API Response: {$botContext.apiStatusCode}
    ```

    Rename this interaction `Failed API starter`.

3. Add a new Integration interaction and select the *Send_Email* integration from the resulting dropdown. Select the *Custom Code* icon from the upper right of the interaction, navigate to the *Pre-Process Code* section and paste the following code:

    ```js
    // Retrieve previously saved bot variables
    var apiStatusCode = getVariable('apiStatusCode');
    var integrationName = getVariable('apiName');
    // Pass variables as arguments to the getEmailBody global function and set the result as the new emailText variable to prepare the email to be sent.
    var newEmailText = getEmailBody(integrationName, apiStatusCode);
    botContext.setBotVariable('emailText', newEmailText);
    ```

    In Global Functions, we had previously defined the `getEmailBody` function to dynamically create the body of the email we will send. Here, we use that function prior to making our `Send_Email` call.

### Update Next Action Rules

Navigate back to the Store_Locator Integration interaction in the Welcome Dialog and create two new *Custom Rules* with the following:

* **Rule Name**: `Success`

     **Add Condition**: `API Result` matches `Success`

     **And go to**: Go To: Next Interaction

* **Rule Name**: `Failure`

     **Add Condition**: `API Result` matches `Failure`

     **And go to**: Go To: Catch API Failure -> Failed API starter

With these rules in place, the conversation will route differently based on the success or failure of the *Store_Locator* integration.

## Testing

Make sure to update the `ownerEmail` variable in Global Function to one that you are able to monitor. You can test the functionality in the previewer tool, however take note that the Account ID and Conversation ID will both return `null` values unless this bot is tested on a deployed site.
