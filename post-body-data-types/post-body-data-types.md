# Post Body Data Types

Bot variables are a convenient way to store user response data or other pieces of context for use within the bot or with 3rd parties via an integration. One constraint when working with bot variables is that they are all stored as strings. This is manageable when working with these variables within Conversation Builder, as you are able to change the data types as needed using JavaScript pre-process code blocks. However, it is often necessary to integrate with third party APIs which may be expecting data to be represented differently, whether that be a Number, an Array, or a Boolean value. 

## The Problem

When building out API integrations, we have the option of building out a POST body in JSON format to send with our request. In this example, we have three bot variables which we want to format as JSON to then be sent with our request in the POST body. Our POST body is constructed as follows:

```json
{
	"data": {
		"fullName": "{$botContext.fullName}",
		"accountNumber": "{$botContext.accountNumber}",
		"isVIP": "{$botContext.vipStatus}"
	}
}
```

This will work just fine to send over the information, however it's important to note that all three variables will be sent as strings. Unfortunately, our outside API is expecting `accountNumber` to be a `Number` and the `isVIP` to be a `Boolean`. 



As we can't be guaranteed that we can manipulate the data type on the receiving end, we will need to handle the type coercion within Conversation Builder. To accomplish this, we will need to create the full JSON object ahead of time and send it as our POST body.

## The Solution

In the pre-process code of the Integration interaction, we will construct a JSON object which we will then save as a JSON encoded string to a bot variable. Assuming that we have already saved our user's responses as bot variables, one example of this code would be as follows:

```js
// retrieve bot context variables
var fullName = botContext.getBotVariable('fullName');
var accountNumberString = botContext.getBotVariable('accountNumber');
var vipStatusString = botContext.getBotVariable('vipStatus');

// convert data types where necessary
var accountNumber = parseInt(accountNumberString);
var vipStatus = vipStatusString === 'true';

// construct post body object
var postBody = {
	"data": {
		"fullName": fullName,
		"accountNumber": accountNumber,
		"isVIP": vipStatus
	}
};

// save stringified postBody object as bot variable
botContext.setBotVariable('postBody', JSON.stringify(postBody), true, false);
```

With this bot variable saved, return to the integration settings for your API call and insert `{$botContext.postBody}` in the Post Body section. Take care to note that we are not including our variable in a string as we had when using bot variables in the Post Body previously.


> NOTE: At the time of this writing, there is currently a bug that results in linter errors not recognizing this input as valid JSON. However, this does not prevent you from saving your integration and calling it in your Conversation Builder dialog.

When our newly created POST body is parsed on the receiving end of the API call, the proper data types will be preserved. 

