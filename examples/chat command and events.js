const McProxy = require('../')

/*
  CREATING SERVER
*/

let localServerOptions = {
  'port': '25578',
  'version': '1.12.1',
  'online-mode': false,
  'keepAlive': false,
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

let proxy = McProxy.createProxy(localServerOptions, serverList)

/*
  HANDLING EVENTS
*/

proxy.on('error', console.error)

proxy.on('listening', () => {
  console.info('Listening!')
})

proxy.on('login', (player) => {
  console.info(`${player.username} connected from ${player.socket.remoteAddress}`)

  player.on('end', () => {
    console.info(`${player.username} disconnected: ${player.socket.remoteAddress}`)
  })

  player.on('error', (err) => {
    console.error(`${player.username} disconnected with error: ${player.socket.remoteAddress}`, err)
  })
})

proxy.on('moveFailed', (err, playerId, oldServerName, newServerName) => {
  console.error(`Player ${proxy.clients[playerId].username} failed to move from ${oldServerName} to ${newServerName}`, err)
})

proxy.on('playerMoving', (playerId, oldServerName, newServerName) => {
  console.info(`Player ${proxy.clients[playerId].username} is moving from ${oldServerName} to ${newServerName}`)
})

proxy.on('playerMoved', (playerId, oldServerName, newServerName) => {
  console.info(`Player ${proxy.clients[playerId].username} has moved from ${oldServerName} to ${newServerName}`)
})

proxy.on('playerFallback', (playerId, oldServerName, newServerName) => {
  console.info(`Player ${proxy.clients[playerId].username} is falling back from ${oldServerName} to ${newServerName}`)
})

/*
  MOVING PLAYER WITH CHAT COMMAND
*/

proxy.on('login', (player) => {
  player.on('chat', (data, metadata) => {
    let split = data.message.split(' ')
    if (split[0] === '/server' && proxy.serverList[split[1]]) {
      console.log(`moving to server ${split[1]} with chat command`)
      proxy.setRemoteServer(player.id, split[1])
    }
  })
})
