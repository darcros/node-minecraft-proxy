function handleCommands (client, proxy, localServerOptions, proxyOptions) {
  client.prependListener("packet", (data, metadata, buffer, fullBuffer) => {
		if(metadata.name === "chat") 
			if(data.message?.startsWith("/proxy"))
				metadata.isCancelled = true;
	});
  client.on('chat', (data, metadata) => {
    let split = data.message.split(' ')
    if (split[0] === '/proxy') {
      switch(split[1]) {
        case "server":
          connectToServer(split[2])
          break
        default:
          const msg = {
            color: 'red',
            translate: 'commands.generic.usage',
            with: [
              `/proxy server <name>`
            ]
          }
          client.write('chat', { message: JSON.stringify(msg), position: 0 })
          break
      }
    }
  })
  const connectToServer = (serverName) => {
    const server = proxy.getServerByName(serverName)
    if (server) {
      proxy.setRemoteServer(client.id, server)
    } else {
      const msg = {
        color: 'red',
        translate: 'disconnect.loginFailedInfo',
        with: [
          `no server named [${serverName}].`
        ]
      }
      client.write('chat', { message: JSON.stringify(msg), position: 0 })
    }
  }
}

module.exports = handleCommands
