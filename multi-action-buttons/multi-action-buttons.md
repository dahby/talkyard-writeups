# Universal tile: Multi-action buttons

Standard [button interactions](https://developers.liveperson.com/conversation-builder-interactions-questions.html#button-questions) in Conversation Builder are limited to a single *Action Type*, meaning they can either be used to post a message back to the bot or they can be used to open a web URL. When used as a web link, the bot does not receive any message or notification when the button is pressed.

The [Universal Tile](https://developers.liveperson.com/conversation-builder-interactions-code.html#universal-interactions-beta) can now be configured to provide a button interaction that is capable of multiple actions. This feature will allow for buttons that send a message back to the bot AND open a web URL, meaning brands can now track or take actions using the bot when these links are visited.

## Example JSON

The button JSON template contains a ["click"](https://developers.liveperson.com/getting-started-with-rich-messaging-introduction.html#element-click-operations) property which allows you to designate an array of **`actions`** for the button. Here is where we use two different action types: **`publishText`** and **`link`**. The `publishText` type defines the message that will be sent back to the bot on click, and the `link` type is where we put the URL that we send the user to.

```json
{
  "title": "Button",
  "tooltip": "Click me!",
  "type": "button",
  "click": {
    "actions": [
      {
        "type": "publishText",
        "text": "Button Clicked!"
      },
      {
        "type": "link",
        "uri": "https://www.liveperson.com",
        "target": "blank"
      }
    ]
  }
}

```
