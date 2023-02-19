const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("src"));

server.listen(80, () => {
	console.log('listening on *:80');
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

io.on("connection", socket => {

	/**
	 * Socket cheat sheet (will be removed later)
	 * https://socket.io/docs/v4/emit-cheatsheet/
	 * 
	 * Basic:
	 * - socket.emit() returns to sender
	 * - io.emit() sends to everyone
	 * 
	 * Advanced (* is socket or io; if socket, will not send to socket):
	 * - *.to().emit() emits to everyone in room
	 * - *.in().emit() same functionality as .to()
	 * - *.except().emit() sends to everyone except those in room
	 * - .to() and .except() can be chained
	 * - *.timeout().emit() if socket does not acknowledge within timeout (ms), error function (argument) triggers
	 * 
	 * Rooms:
	 * - socket.join() joins a room
	 * - socket.leave() leaves a room
	 * 
	 * Reserved names:
	 * - connect
	 * - connect_error
	 * - disconnect
	 * - disconnecting
	 * - newListener
	 * - removeListener
	 */
	
	socket.on("disconnect", () => {
	});
});
