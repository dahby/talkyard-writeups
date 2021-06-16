// Retrieve and parse api response
var getContextData = botContext.getBotVariable("api_Products");
var jsonData = JSON.parse(getContextData.jsonData);
// Set products array to a bot variable
botContext.setBotVariable('allResponses', JSON.stringify(jsonData.api_Products.products), true, false);
// create currentIndex var to keep track of where we are in the response array
var currentIndex = 0;
botContext.setBotVariable('currentIndex', currentIndex, true, false);
// create a new array starting at the currentIndex and ending at a chosen endpoint (I've done currentIndex + 10)
var slicedArray = jsonData.api_Products.products.slice(currentIndex, currentIndex + 10);
// replace the products array from the API response with our new slicedArray and rewriting the api response
jsonData.api_Products.products = slicedArray;
getContextData.jsonData = JSON.stringify(jsonData);
botContext.setBotVariable("api_Products",getContextData, true, false);
