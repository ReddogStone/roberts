export default function BehaviorSystem() {
	let pool = {};
	let nextId = 0;

	return {
		add(behavior) {
			const id = nextId++;
			pool[id] = behavior;
			return function() {
				delete pool[id];
			};
		},
		update(event) {
			Object.keys(pool).forEach(function(id) {
				const { done } = pool[id](event);
				if (done) {
					delete pool[id];
				}
			});
		},
		clear() {
			pool = {};
		}
	};
};
