const mc = require('minecraft-protocol')

function addListeners (remoteClient, that) {
  if (remoteClient.isFirstConnection) {
    remoteClient.on('packet', (data, metadata) => {// transfert the sended packets to the client to the "real" server
      if (remoteClient.localClient.state === mc.states.PLAY && metadata.state === mc.states.PLAY) {
        if(!metadata.isCancelled)
          remoteClient.localClient.write(metadata.name, data)
      }
    })
  }

  remoteClient.localClient.on('packet', (data, metadata) => {// transfert the received packets from the client of the "real" server
    if (metadata.name === 'kick_disconnect') return
    if (remoteClient.state === mc.states.PLAY && metadata.state === mc.states.PLAY) {
      if(!metadata.isCancelled)
        remoteClient.write(metadata.name, data)
    }
  })

  remoteClient.localClient.on('kick_disconnect', (data, metadata) => {
    if (that.getFallbackServerName() === remoteClient.currentServer) {
      if(!metadata.isCancelled)
        remoteClient.write(metadata.name, data)
    } else {
      that.fallback(remoteClient.id)
    }
  })
}

module.exports = addListeners
