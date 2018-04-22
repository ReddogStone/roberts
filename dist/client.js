const socket = new WebSocket('ws://localhost:9000');

socket.onmessage = event => {
	console.log('Server says:', event.data);
	if (event.data === 'reload') {
		window.location = window.location;
	}
}
