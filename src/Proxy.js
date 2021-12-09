const mc = require("minecraft-protocol");

const replayPackets = require("./Proxy/packetReplayer");
const addListeners = require("./Proxy/addListeners");

class Proxy extends mc.Server {
	/**
	 * Create a minecraft proxy
	 * @param {Object} serverSettings Settings for the minecraft-protocol server
	 * @param {Object} serverList The actual list of available servers
	 * @param {Object} proxyOptions Proxy settings
	 */
	constructor(serverSettings = {}, serverList = {}, proxyOptions = {}) {
		super(serverSettings.version, serverSettings.customPackets);
		this.serverList = serverList;

		this.autoConnect =
			typeof proxyOptions.autoConnect === "undefined"
				? true
				: !!proxyOptions.autoConnect;
		this.autoFallback =
			typeof proxyOptions.autoFallback === "undefined"
				? true
				: !!proxyOptions.autoFallback;

		this.on("login", (remoteClient) => {
			let id = remoteClient.id;

			remoteClient.on("end", () => {
				if (remoteClient.localClient) remoteClient.localClient.end();
			});

			remoteClient.on("error", () => {
				if (remoteClient.localClient) remoteClient.localClient.end();
			});

			this.clients[id].isFirstConnection = true;
			this.clients[id].currentServer = undefined;

			if (this.autoConnect) {
				const defaultServer = this.getDefaultServer();
				if (!defaultServer)
					this.emit("error", new Error("No default server found!"));
				else this.setRemoteServer(id, defaultServer);
			}
		});
	}

	/**
	 * Moves the specified client to the specified server
	 * @param {number} remoteClientId The ID of the player to move
	 * @param {Object} newServer The server where the player should be moved
	 */
	setRemoteServer(remoteClientId, newServer) {
		const remoteClient = this.clients[remoteClientId];
		const oldServer = remoteClient.currentServer;

		if (oldServer === newServer) return;

		this.emit("playerMoving", remoteClientId, oldServer, newServer);

		this.clients[remoteClientId].currentServer = newServer;

		let newLocalClient = mc.createClient({
			username: remoteClient.username,
			keepAlive: false, // keep alive is set to false because the remote server will send the packets and the remote client will respond
			version: remoteClient.version,
			...newServer.settings,
		});

		newLocalClient.on("error", (err) => {
			this.emit("playerMoveFailed", err, remoteClientId, oldServer, newServer);
			console.log(
				"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
			);
			this.emit("error", err);
			try {
				this.fallback(remoteClientId);
			} catch (error) {
				this.emit("error", error);
			}
		});

		if (!remoteClient.isFirstConnection) {
			replayPackets(remoteClient, newLocalClient, () => {
				remoteClient.localClient.end();
				remoteClient.localClient = newLocalClient;
				addListeners(remoteClient, this);
			});
		} else {
			remoteClient.localClient = newLocalClient;
			addListeners(remoteClient, this);
			remoteClient.isFirstConnection = false;
		}

		newLocalClient.on("connect", () => {
			this.emit("playerMoved", remoteClientId, oldServer, newServer);
		});
	}

	/**
	 * Moves the specified client to the fallback server
	 * @param {number} remoteClientId The ID of the player to move
	 * @throws {Error} when no fallback server is found
	 */
	fallback(remoteClientId) {
		if (this.autoFallback) {
			const oldServer = this.clients[remoteClientId].currentServer;
			const fallbackServer = this.getFallbackServer();
			if (!fallbackServer) throw new Error("No fallback server found!");
			this.emit("playerFallback", remoteClientId, oldServer, fallbackServer);
			this.setRemoteServer(remoteClientId, fallbackServer);
		}
	}

	/**
	 * Returns the fallback server
	 * @returns {Object} The fallback server
	 */
	getFallbackServer() {
		return this.serverList.find((server) => server.settings.isFallback);
	}

	/**
	 * Returns the default server
	 * @returns {Object} The default server
	 */
	getDefaultServer() {
		return this.serverList.find((server) => server.settings.isDefault);
	}

	/**
	 * Returns the wanted server by name
	 * @param {number} name The wanted server's name
	 * @returns {Object} The server
	 */
	getServerByName(name) {
		return this.serverList.find((server) => server.name == name);
	}
}

module.exports = Proxy;
