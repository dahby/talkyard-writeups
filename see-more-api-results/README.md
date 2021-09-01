# See More Results from an API Response

There are often questions about how a developer can have more control over the API results retrieved from a third party API, whether that means limiting the number displayed or showing more options than the maximum of 10 allowed in structured content. This video guide provides an example of how you can use JavaScript of the pre-process code of a structured content interaction to allow for a "show more" option, to display additional results beyond the initial carousel.

## Video Walkthrough

## API Configuration

For this demonstration, I've set up a mock API that returns faker data for products. The API resource can be found here: https://5fc54a0936bc790016344a09.mockapi.io/products/products

## Initial display pre-process code

In the structured content pre-process code, we're retrieving the results from the Products integration and saving it to a bot variable which will serve as a reference to the full response. Once we've done that, we can manipulate the api response variable to display whichever results from that original response that we would like to.

```js
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
```

## Secondary display pre-process code

Here, we're repeating the same process as earlier, but re-writing the api response variable with the next 10 results from our API response, which we had stored in the bot variable `allResponses`. Additionally, there is a check that if we are at the end of our array of responses, to reset the index back to 0.

```js
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
```
