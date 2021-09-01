# Retrieving Locations in WhatsApp

## Overview

One of the more powerful features of WhatsApp is the ability for its users to share several forms of rich content, such as location information. This guide is intended to demonstrate how to process a location share from a user and read back the resulting latitude and longitude. This information can be used to find nearest locations and provide directions, as well as other use cases that may require this location information.

## Prerequisites

This guide assumes you have a Conversational Cloud account which has been approved to be deployed to WhatsApp. For details on how to do so, please see [this Knowledge Center article](https://knowledge.liveperson.com/messaging-channels-whatsapp-business.html) or contact your LivePerson Account representative.

## Processing Location Information

1) From your bot in Conversation Builder, click on the __Add Dialog__ button in the lower left hand corner. Give your dialog the name Location, a dialog type of Dialog, and click __Save__.

2) In the `dialog_starter` interaction of your new Location dialog, click on the __+ Pattern__ button.
  
     In the resulting __Interaction Settings__ menu, add a new pattern for `__rich_content__`. When receiving location information from the user, the bot will receive a message of `__rich_content__` which will trigger this dialog.
    <!-- Uploaded file name:  Screen Shot 2020-09-09 at 2.48.08 PM.png  -->
    <img src="/-/u/3/3/nj/ovudmskuueim4iuxzdbhqohdarmj7g.jpg">
3) Add a new text interaction by clicking on the text statement interaction.

4) In your new text interaction, add some custom JavaScript code to process the content from the shared location. Click the Custom Code icon from the upper right of the interaction and navigate to the Pre-Process Code editor.

    <!-- Uploaded file name:  Screen Shot 2020-09-09 at 2.47.23 PM.png  -->
    <img src="/-/u/2/o/bb/pshcrg5lj5ehhdblz3x2rnirj2iahl.jpg">

5) In the code editor, paste the following JavaScript code:

     ```js
    var contentReceived = botContext.getLPEngagementAttribute("richContent");
    botContext.printDebugMessage(">>> Content: " + contentReceived);

    var json = JSON.parse(contentReceived);
    botContext.setBotVariable("latitude", json.elements[1].la, true, false);
    botContext.setBotVariable("longitude", json.elements[1].lo, true, false);
    ```

    This code pulls in the information from the shared Rich Content, parses the data, and creates two new bot variables to store the latitude and longitude values.

    Make sure to click the Add Script button in the lower right when complete.

6) After saving your pre-process code, return to your new text statement and enter the following text content to read back our new latitude and longitude bot variables.
 
    `"Latitude: {$botContext.latitude} Longitude: {$botContext.longitude}"`

    <!-- Uploaded file name:  Screen Shot 2020-09-09 at 2.46.38 PM.png  -->
    <img src="/-/u/3/x/c5/b4lukgnzhsiftpniow72tomhwst7ng.jpg">

7) Click the Save icon in the upper right and text out the functionality in your deployed WhatsApp instance.

    <!-- Uploaded file name:  Screen Shot 2020-09-09 at 2.45.46 PM.png  -->
    <img src="/-/u/3/3/il/tmk6bkpfds3c43bzda7dhaaq74ecr3.jpg">

    In this demonstration, we’ve isolated the latitude and longitude and read back their values. As these values are now preserved in bot variables, you will be able to use them within API calls to return relevant information to your users.
