const McProxy = require("../");

/*
  CREATING PROXY
*/

let localServerOptions = {
	port: 25578,
	version: "1.12.1",
	"online-mode": false,
	motd: "nodejs minecraft proxy",
};

let serverList = [
	{
		name: "hub",
		settings: {
			host: "localhost",
			port: 25565,
			isDefault: true,
			isFallback: true,
		},
	},
	{
		name: "otherServer",
		settings: {
			host: "localhost",
			port: 25566,
		},
	},
];

/*
  CREATING PLUGIN
*/

function handleHelloCommand(client, proxy, localServerOptions, proxyOptions) {
	// "prependListener" should ONLY be used for packet cancellation! otherwise, no one could ever cancel your actions
	// check if the packet is a message and start with "%". If so, cancel it so the remote server wont receive it
	client.prependListener("packet", (data, metadata, buffer, fullBuffer) => {
		if (metadata.name === "chat")
			if (data.message?.toLowerCase() == "/hello") metadata.isCancelled = true;
	});
	// check if the message is "%hello". if so, return "Hi!"
	client.prependListener("chat", (data, metadata) => {
		if (data.message?.toLowerCase() == "/hello") {
			metadata.isCancelled = true;
			const msg = {
				color: "green",
				text: "Hi!",
			};
			client.write("chat", { message: JSON.stringify(msg), position: 0 });
		}
	});
}

let proxyOptions = {
	// enables the plugins
	enablePlugins: true,
	// add my "handleHelloCommand" plugin handler as a proxy plugin
	plugins: [handleHelloCommand],
	// if set to true, dont load default plugins. default plugins can be found in /src/Plugins folder
	preventDefaultPlugins: false,
};

/*
  Use the "/server <serverName>" command in chat to move between servers.
  <serverName> is the name that you chose for the server inside the serverList
  This command is implemented by /src/Plugins/ChatCommands.js and it can be disabled by setting enablePlugin: false inside proxyOptions
*/
let proxy = McProxy.createProxy(localServerOptions, serverList, proxyOptions);

/*
  HANDLING EVENTS
*/

proxy.on("error", console.error);

proxy.on("listening", () => {
	console.info("Listening!");
});

proxy.on("login", (player) => {
	console.info(
		`${player.username} connected from ${player.socket.remoteAddress}`
	);

	player.on("end", () => {
		console.info(
			`${player.username} disconnected: ${player.socket.remoteAddress}`
		);
	});

	player.on("error", (err) => {
		console.error(
			`${player.username} disconnected with error: ${player.socket.remoteAddress}`,
			err
		);
	});
});

proxy.on("playerMoveFailed", (err, playerId, oldServer, newServer) => {
	console.error(
		`Player ${proxy.clients[playerId].username} failed to move from ${oldServer?.name} to ${newServer?.name}`,
		err
	);
});

proxy.on("playerMoving", (playerId, oldServer, newServer) => {
	console.info(
		`Player ${proxy.clients[playerId].username} is moving from ${oldServer?.name} to ${newServer?.name}`
	);
});

proxy.on("playerMoved", (playerId, oldServer, newServer) => {
	console.info(
		`Player ${proxy.clients[playerId].username} has moved from ${oldServer?.name} to ${newServer?.name}`
	);
});

proxy.on("playerFallback", (playerId, oldServer, newServer) => {
	console.info(
		`Player ${proxy.clients[playerId].username} is falling back from ${oldServer?.name} to ${newServer?.name}`
	);
});
