const NodeRSA = require('node-rsa')
const path = require('path')

const Proxy = require('./Proxy')

const mcProtocolPath = require.resolve('minecraft-protocol')
const serverPlugins = [
  require(path.join(mcProtocolPath, '../server/handshake')),
  require(path.join(mcProtocolPath, '../server/login')),
  require(path.join(mcProtocolPath, '../server/ping'))
]

function createProxy (options, serverList) {
  const {
    host = '0.0.0.0',
    'server-port': serverPort,
    port = serverPort || 25565,
    motd = 'A Minecraft server',
    'max-players': maxPlayers = 20,
    version,
    favicon,
    customPackets
  } = options

  const optVersion = version === undefined || version === false ? require(path.join(mcProtocolPath, '../version')).defaultVersion : version

  const mcData = require('minecraft-data')(optVersion)
  const mcversion = mcData.version

  const serverOptions = {
    version: mcversion.minecraftVersion,
    customPackets: customPackets
  }

  const proxy = new Proxy(serverOptions, serverList)
  proxy.mcversion = mcversion
  proxy.motd = motd
  proxy.maxPlayers = maxPlayers
  proxy.playerCount = 0
  proxy.onlineModeExceptions = {}
  proxy.favicon = favicon
  proxy.serverKey = new NodeRSA({b: 1024})

  proxy.on('connection', function (client) {
    serverPlugins.forEach((plugin) => plugin(client, proxy, options))
  })
  proxy.listen(port, host)
  return proxy
}

module.exports = createProxy
