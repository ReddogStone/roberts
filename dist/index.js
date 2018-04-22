import Behavior from './engine/behavior.js';
import BehaviorSystem from './engine/behavior-system.js';
import gameScreen from './screens/game.js';

const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 700;
const context = canvas.getContext('2d');
document.body.appendChild(canvas);

let mobile = window.innerWidth < 400;
if (mobile) {
	canvas.style = 'width:100%;height:100%;border:none';
}

const behaviorSystem = BehaviorSystem();
let render;
const behavior = Behavior.first(
	event => {
		behaviorSystem.update(event);
		return { done: false };
	},
	gameScreen({ x: canvas.width, y: canvas.height }, behaviorSystem, f => { render = f; })
);

let lastTime = performance.now();
requestAnimationFrame(function animate() {
	const time = performance.now();
	const dt = (time - lastTime) * 0.001;
	lastTime = time;
	behavior({ type: 'update', dt: dt });
	context.clearRect(0, 0, canvas.width, canvas.height);
	render(context);
	requestAnimationFrame(animate);
});
function getMousePos(canvas, event) {
	const rect = canvas.getBoundingClientRect();

	const res = {
		x: (event.clientX - rect.left),
		y: (event.clientY - rect.top)
	};

	if (mobile) {
		res.x *= canvas.width / window.innerWidth;
		res.y *= canvas.height / window.innerHeight;
	}

	return res;
}
canvas.addEventListener('mousedown', function(event) {
	const mousePos = getMousePos(canvas, event);
	behavior({ type: 'mousedown', pos: mousePos });
});
canvas.addEventListener('mouseup', function(event) {
	const mousePos = getMousePos(canvas, event);
	behavior({ type: 'mouseup', pos: mousePos });
});
canvas.addEventListener('mousemove', function(event) {
	const mousePos = getMousePos(canvas, event);
	behavior({ type: 'mousemove', pos: mousePos });
});
document.addEventListener('keydown', function(event) {
	behavior({ type: 'keydown', event: event });
});
document.addEventListener('keyup', function(event) {
	behavior({ type: 'keyup', event: event });
});

canvas.addEventListener('touchstart', function(event) {
	event.preventDefault();
	const mousePos = getMousePos(canvas, event.touches[0]);
	behavior({ type: 'mousemove', pos: mousePos });
	behavior({ type: 'mousedown', pos: mousePos });
});

canvas.addEventListener('touchmove', function(event) {
	event.preventDefault();
	const mousePos = getMousePos(canvas, event.changedTouches[0]);
	behavior({ type: 'mousemove', pos: mousePos });
});

canvas.addEventListener('touchend', function(event) {
	event.preventDefault();
	const mousePos = getMousePos(canvas, event.changedTouches[0]);
	behavior({ type: 'mouseup', pos: mousePos });
});
