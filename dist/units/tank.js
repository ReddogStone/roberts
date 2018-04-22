import Behavior from '../engine/behavior.js';
import { vec, vadd, vscale } from '../engine/vector.js';
import Colors from '../constants/colors.js';

import { moveToGlobalTarget, moveToTarget, waitForTargetSighting } from './utils.js';

const MAX_HEALTH = 1000;

export default ({ fieldSize, world }) => ({
	description: {
		cost: 5
	},
	create(team, pos) {
		return {
			team,
			pos,
			target: undefined,
			dir: vec(0, 0),

			maxHealth: MAX_HEALTH,
			health: MAX_HEALTH,
			speed: 10,
			radius: 20,

			sightRadius: 120,
			hitPower: 60,

			hitProgress: 0
		};
	},
	render(context, state) {
		const { pos, team, radius, dir, speed, hitProgress } = state;

		context.fillStyle = Colors[`TEAM${team}`];
		context.strokeStyle = 'black';
		context.lineWidth = 2;

		context.save();
		context.translate(pos.x, pos.y);
		context.rotate(Math.atan2(dir.y, dir.x));
		context.translate(-hitProgress * 10, 0);

		context.beginPath();
		context.arc(0, 0, radius, 0, 2 * Math.PI);
		context.fill();
		context.stroke();

		// context.beginPath();
		// context.moveTo(0, 0);
		// context.lineTo(speed, 0);
		// context.stroke();

		context.restore();
	},
	behavior(self) {
		const hitTarget = () => Behavior.run(function*() {
			yield Behavior.interval(2, progress => {
				self.hitProgress = progress;
			})
			self.hitProgress = 0;

			self.target.health -= self.hitPower;

			if (self.target.health <= 0) {
				self.target = undefined;
				return;
			}
		});

		return Behavior.first(
			Behavior.update(dt => (self.health <= 0) ? true : undefined ),
			Behavior.run(function*() {
				while (true) {
					self.target = yield Behavior.first(
						moveToGlobalTarget(self),
						waitForTargetSighting(world, self, ({ type }) => type === 'cannon')
					);

					yield moveToTarget(self, self.target);

					while (self.target) {
						yield hitTarget();
					}
				}
			})
		);
	}
});
