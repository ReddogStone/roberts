function twoParallel(behavior1, behavior2) {
	let done1 = false;
	let done2 = false;
	return function(event) {
		if (!done1) {
			const res = behavior1(event);
			done1 = res.done;
			if (done2) { return res; }
		}
		if (!done2) {
			const res = behavior2(event);
			done2 = res.done;
			if (done1) { return res; }
		}

		return { done: false };
	};
}

function interval(duration, update) {
	let t = 0;
	update(0);
	return function(event) {
		if (event.type !== 'update') { return { done: false }; }

		let result = { done: false };

		t += event.dt;
		if (t >= duration) {
			t = duration;
			result = {
				done: true,
				pass: { type: 'update', dt: t - duration }
			};
		}

		update(t / duration);

		return result;
	};
}

function filter(func) {
	return function(event) {
		if (!func(event)) {
			return { done: false };
		}
		return { done: true, value: event };
	};
}

const filterType = value => filter(({ type }) => type === value);

function forever(func) {
	return function(event) {
		func(event);
		return { done: false };
	};
}

function first(b1, b2) {
	return function(event) {
		let res = b1(event);
		if (res.done) { return res; }

		res = b2(event);
		if (res.done) { return res; }

		return { done: false };
	};
}

export default {
	run: function(generatorFunc) {
		const gen = generatorFunc();

		const { value, done } = gen.next();
		if (done) {
			return function() { return { done: true }; };
		}

		let current = value;
		return function(event) {
			let res = current(event);
			while (res.done) {
				res = gen.next(res.value);
				if (res.done) { return res; }

				current = res.value;
				if (res.pass) {
					res = current(res.pass);
				} else {
					res = { done: false };
				}
			}

			return { done: false };
		};
	},
	update: function(func) {
		return function(event) {
			if (event.type !== 'update') {
				return { done: false };
			}
			const result = func(event.dt);
			if (result !== undefined) {
				return { done: true, value: result };
			}

			return { done: false };
		};
	},
	waitFor: filter,
	type: function(type) {
		return function(event) {
			if (event.type !== type) {
				return { done: false };
			}
			return { done: true, value: event };
		};
	},
	filter: filter,
	forever: forever,
	input: filter.bind(null, ({ type }) => type !== 'update'),
	type: filterType,
	parallel: function(behaviors) {
		if (!Array.isArray(behaviors)) {
			behaviors = Array.prototype.slice.call(arguments);
		}

		if (behaviors.length === 0) {
			return function() { return { done: true, remaining: 0 }; };
		}

		return behaviors.reduce(twoParallel);
	},
	first: function(behaviors) {
		if (!Array.isArray(behaviors)) {
			behaviors = Array.prototype.slice.call(arguments);
		}

		if (behaviors.length === 0) {
			return function() { return { done: true, remaining: 0 }; };
		}

		return behaviors.reduce(first);
	},
	interval: interval,
	wait: function(duration) {
		return interval(duration, function() {});
	},
	performTask: function(task) {
		var finished = false;

		task(function(error) {
			if (error) { throw error; }
			finished = true;
		});

		return function() {
			return { done: finished };
		};
	},
	until: function(runningBehavior, finishingBehavior) {
		return first(
			Behavior.run(function*() {
				yield runningBehavior;
				yield forever(function() {});
			}),
			finishingBehavior
		);
	},
	repeat: function(behaviorGetter) {
		return Behavior.run(function*() {
			while (true) {
				yield behaviorGetter();
			}
		});
	}
};
