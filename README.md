Fields
========

**Fields** is a live performance system allowing to play sound through the mobile devices of audience members. Participants can connect to a web page that can be made available either online or on a local network, and performers can then control sound from the connected devices by sending OSC messages.

Fields uses **node.js** to run a server. Sound can be programmed with Pure Data (through [WebPd](http://github.com/sebpiq/WebPd)).


Installation
--------------

You first need to install [node.js](https://nodejs.org/). I recommend to install it through [nvm](https://github.com/creationix/nvm).

Then, in a terminal run `npm install -g fields`.

Finally, simply create a configuration file, and start the **Fields** server by running `fields config.js` in a terminal. 

Examples of working applications with full configuration files can be found [here](http://github.com/sebpiq/fields/tree/master/examples).