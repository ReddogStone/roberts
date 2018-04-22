const http = require('http');

const nodeStatic = require('node-static');
const watch = require('node-watch');
const WebSocket = require('ws');

const PORT = 9000;

const file = new nodeStatic.Server('./dist');

const server = http.createServer((request, response) => {
	request.addListener('end', () => file.serve(request, response)).resume();
}).listen(9000);

const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', socket => {
	clients.add(socket);

	socket.on('close', (code, reason) => {
		clients.delete(socket);
	});
});

watch('dist', { recursive: true }, (event, name) => {
	clients.forEach(client => client.send('reload'));
});

console.log('Started on:', PORT);