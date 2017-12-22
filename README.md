# node-minecraft-proxy
Simple Minecraft proxy written in Node.js using the node-minecraft-protocol library

### Table of contents
[Features](#Features)  
[Installation](#Installation)  
[Examples](#Examples)  
[Documentation](#Documentation)  

## Features
* Connect to proxy
* Forward players to servers
* Change server

## Installation

### Npm
`npm install basic-minecraft-proxy`

### Cloning repository
1. Somewhere in you project folder do `git clone https://github.com/7ixi0/node-minecraft-proxy.git`
2. install dependencies with `npm install`
3. then inside your `whatever.js` file `const McProxy = require('./path/where/you/cloned');`

## Examples
See also `./examples/` for other examples

### Creating a proxy
This example shows how to create and how to the options are passed
```js
const McProxy = require('minecraft-proxy');

let localServerOptions = {
  'port': '25578',
  'version': '1.12.1',
  'online-mode': false,
  'motd': 'nodejs minecraft proxy'
}

let serverList = {
  hub: {
    host: 'localhost',
    port: 25565,
    isDefault: true,
    isFallback: true
  },
  minigames: {
    host: 'localhost',
    port: 25566
  }
}

let proxy = McProxy.createProxy(localServerOptions, serverList);

proxy.on('error', console.error);

proxy.on('listening', () => {
  console.info('Listening!');
});
```

### Moving players from a server to another
In this example every player will be moved from the `hub` server (default) to the `minigames` server 30 seconds after having logged in
```js
proxy.on('login', (player) => {
  setTimeout(() => {
    proxy.setRemoteServer(player.id, "minigames");
  }, 30 * 1000);
});
```

## Documentation
To be written