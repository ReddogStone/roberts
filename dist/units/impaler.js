import Behavior from '../engine/behavior.js';
import { vec, vdir, vclone, vdist } from '../engine/vector.js';
import Colors from '../constants/colors.js';

import { moveToGlobalTarget, waitForTargetSighting, moveToTarget, unitDist } from './utils.js';

const MAX_HEALTH = 300;

export default ({ fieldSize, world }) => ({
	description: {
		cost: 5
	},
	create(team, pos) {
		return {
			team,
			pos,
			target: undefined,
			dir: vec(0, team === 1 ? -1 : 1),

			maxHealth: MAX_HEALTH,
			health: MAX_HEALTH,
			speed: 20,
			radius: 12,
			sightRadius: 100,
			hitRadius: 10,
			hitPower: 250,
			hitProgress: 0
		};
	},
	render(context, state) {
		const { pos, team, radius, dir, hitProgress } = state;

		context.fillStyle = Colors[`TEAM${team}`];
		context.strokeStyle = 'black';
		context.lineWidth = 2;

		context.save();
		context.translate(pos.x, pos.y);
		context.rotate(Math.atan2(dir.y, dir.x));

		context.beginPath();
		context.arc(0, 0, radius, 0, 2 * Math.PI);
		context.fill();
		context.stroke();

		context.lineWidth = 2;

		context.save();
		context.translate((hitProgress - 1) * radius, 0);

		context.beginPath();
		context.moveTo(-radius, 0);
		context.lineTo(2 * radius, 0);
		context.stroke();

		context.restore();

		context.restore();
	},
	behavior(self) {
		const hit = () => Behavior.run(function*() {
			yield Behavior.interval(0.5, progress => {
				self.hitProgress = Math.sin(0.5 * Math.PI * progress);
			})

			self.target.health -= self.hitPower;

			yield Behavior.interval(2.5, progress => {
				self.hitProgress = 1 - progress;
			})

			self.target = undefined;
		});

		return Behavior.first(
			Behavior.update(dt => {
				if (self.health <= 0) { return true; }

				if (self.target) {
					self.dir = vdir(self.pos, self.target.pos);
				}
			}),
			Behavior.run(function*() {
				while (true) {
					if (!self.target || self.target.health <= 0) {
						self.target = yield Behavior.first(
							waitForTargetSighting(world, self, unit => !unit.flying),
							moveToGlobalTarget(self)
						);
					}
					
					yield moveToTarget(self, self.target);

					while (self.target && (unitDist(self, self.target) < self.hitRadius)) {
						yield hit();
					}
				}
			})
		);
	}
});
