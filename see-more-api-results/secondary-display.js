// Retrieve and parse api response, currently containing the sliced array from previous interaction
var getContextData = botContext.getBotVariable("api_Products");
var jsonData = JSON.parse(getContextData.jsonData);
// Retrieve allResponse bot variable, which contains the entire api response array
var allResponses = JSON.parse(botContext.getBotVariable('allResponses'));
// Retrieve currentIndex, incrementing it by 10
var currentIndex = Number(botContext.getBotVariable('currentIndex')) + 10;
// If the current index is greater than the length of our allResponses array, reset the currentIndex to 0
if (currentIndex >= allResponses.length) {
  botContext.sendMessage('Ran out of items. Displaying the original 10');
  currentIndex = 0;
}
// Slicing the allResponses array as we did before with the updated index numbers, and resave the currentIndex with its new value
var slicedArray = allResponses.slice(currentIndex, currentIndex + 10);
botContext.setBotVariable('currentIndex', currentIndex, true, false);
// replace the products array from the API response with our new slicedArray and rewriting the api response
jsonData.api_Products.products = slicedArray;
getContextData.jsonData = JSON.stringify(jsonData);
botContext.setBotVariable("api_ambassadorInfo",getContextData, true, false);