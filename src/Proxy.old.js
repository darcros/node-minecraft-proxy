const EventEmitter = require('events')
const mc = require('minecraft-protocol')

class McProxy extends EventEmitter {
  constructor (localServerOptions, serverList) {
    super()

    localServerOptions.keepAlive = false
    this.localServer = mc.createServer(localServerOptions)
    this.emit('listening')

    this.serverList = serverList
    this.version = localServerOptions.version

    /**********************
    this.remoteClient = ''
    this.localClient = this.makeLocalClient(this.getDefaultServerName())
    **********************/

    this.localServer.on('login', (remoteClient) => {
      this.emit('incomingConnection')

      // remoteClient.isFirstConnection = true
      remoteClient.localClient = this.setRemoteServer(this.getDefaultServerName())
    })
  }

  /**********************/
  setRemoteServer (server) {
    // NOTE: add event listeners

    let settings = this.getLocalClientParams(server)
    return mc.createClient(settings)
  }
  /**********************/

  getLocalClientParams (serverName) {
    let server = this.serverList.serverName
    return {
      host: server.host,
      port: server.port,
      username: this.remoteClient.username,
      version: this.version,
      keepAlive: false
    }
  }

  getDefaultServerName () {
    for (const name in this.serverList) {
      if (this.serverList.hasOwnProperty(name)) {
        const server = this.serverList[name]
        if (server.isDefault) return name
      }
    }
  }
}

module.exports = McProxy
