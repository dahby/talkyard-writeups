# Base 64 Encoding in Conversation Builder

The JavaScript editor within Conversation Builder does not natively support encoding to and decoding from Base 64. If you have a case where you need to do so, you can call a FaaS function and use the `crypto` package to encode and return that value to your bot. Alternatively, using the following code in your Global Functions will give you access to this functionality without having to call outside of Conversation Builder.

Here, we've constructed two new functions (`encode` & `decode`) which work the same way as the Window object's `atob` & `btoa` functions:

```js
function encode(string) {
  // base64 character set, plus padding character (=)
  var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  // Regular expression to check formal correctness of base64 encoded strings
  var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
  string = String(string);
  var bitmap, a, b, c,
      result = "", i = 0,
      rest = string.length % 3; // To determine the final padding
  for (; i < string.length;) {
      if ((a = string.charCodeAt(i++)) > 255 || (b = string.charCodeAt(i++)) > 255 || (c = string.charCodeAt(i++)) > 255)
          throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");
      bitmap = (a << 16) | (b << 8) | c;
      result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63) + b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
  }
  // If there's need of padding, replace the last 'A's with equal signs
  return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
};

function decode(string) {
  var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  // Regular expression to check formal correctness of base64 encoded strings
  var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
  // atob can work with strings with whitespaces, even inside the encoded part,
  // but only \t, \n, \f, \r and ' ', which can be stripped.
  string = String(string).replace(/[\t\n\f\r ]+/g, "");
  if (!b64re.test(string))
      throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
  // Adding the padding if missing, for semplicity
  string += "==".slice(2 - (string.length & 3));
  var bitmap, result = "", r1, r2, i = 0;
  for (; i < string.length;) {
      bitmap = b64.indexOf(string.charAt(i++)) << 18 | b64.indexOf(string.charAt(i++)) << 12
              | (r1 = b64.indexOf(string.charAt(i++))) << 6 | (r2 = b64.indexOf(string.charAt(i++)));
      result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255)
              : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255)
              : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
  }
  return result;
};
```

Both functions were adapted from a polyfill located [here](https://github.com/MaxArt2501/base64-js/blob/master/base64.js).
