const mc = require('minecraft-protocol')

const replayPackets = require('./Proxy/packetReplayer')
const addListeners = require('./Proxy/addListeners')

class Proxy extends mc.Server {
  constructor (serverSettings, serverList) {
    super(serverSettings.version, serverSettings.customPackets)
    this.serverList = serverList

    let self = this
    self.on('login', (remoteClient) => {
      let id = remoteClient.id

      remoteClient.on('end', () => {
        if (remoteClient.localClient) remoteClient.localClient.end()
      })

      remoteClient.on('error', () => {
        if (remoteClient.localClient) remoteClient.localClient.end()
      })

      let defaultServer = this.getDefaultServerName()

      this.clients[id].isFirstConnection = true
      this.clients[id].currentServer = ''

      this.setRemoteServer(id, defaultServer)
    })
  }

  setRemoteServer (remoteClientId, newServerName) {
    let remoteClient = this.clients[remoteClientId]
    let oldServerName = remoteClient.currentServer
    let newServer = this.serverList[newServerName]

    if (remoteClient.currentServer === newServerName) return

    this.emit('playerMoving', remoteClientId, oldServerName, newServerName)

    this.clients[remoteClientId].currentServer = newServerName

    let newLocalClient = mc.createClient({
      host: newServer.host,
      port: newServer.port,
      username: remoteClient.username,
      keepAlive: false, // keep alive is set to false because the remote server will send the packets and the remote client will respond
      version: remoteClient.version
    })

    newLocalClient.on('error', (err) => {
      this.emit('playerMoveFailed', err, remoteClientId, oldServerName, newServerName)
      this.emit('error', err)
      this.fallback(remoteClientId)
    })

    if (!remoteClient.isFirstConnection) {
      replayPackets(remoteClient, newLocalClient, () => {
        remoteClient.localClient.end()
        remoteClient.localClient = newLocalClient
        newLocalClient = undefined
        addListeners(remoteClient, this)
      })
    } else {
      remoteClient.localClient = newLocalClient
      newLocalClient = undefined
      addListeners(remoteClient, this)
      remoteClient.isFirstConnection = false
    }

    this.emit('playerMoved', remoteClientId, oldServerName, newServerName)
  }

  fallback (remoteClientId) {
    let oldServerName = this.clients[remoteClientId].currentServer
    let fallbackServerName = this.getFallbackServerName()
    this.emit('playerFallback', remoteClientId, oldServerName, fallbackServerName)
    this.setRemoteServer(remoteClientId, fallbackServerName)
  }

  getFallbackServerName () {
    for (let serverName in this.serverList) {
      if (this.serverList[serverName].isFallback) return serverName
    }

    this.emit('error', new Error('No fallback server found!'))
  }

  getDefaultServerName () {
    for (let serverName in this.serverList) {
      if (this.serverList[serverName].isDefault) return serverName
    }

    this.emit('error', new Error('No default server found!'))
  }
}

module.exports = Proxy