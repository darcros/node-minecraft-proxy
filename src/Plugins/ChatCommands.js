let serverList = {
  lobby: {
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

function handleCommands (client, proxy, options) {
  client.on('chat', (data, metadata) => {
    let split = data.message.split(' ')
    if (split[0] === '/server') {
      proxy.setRemoteServer(client.id, serverList[split[1]])
    }
  })
}

module.exports = handleCommands
