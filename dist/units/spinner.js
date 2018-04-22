import Behavior from '../engine/behavior.js';
import { vec, vdir, vclone, vdist } from '../engine/vector.js';
import Colors from '../constants/colors.js';

import { moveToGlobalTarget, waitForTargetSighting, moveToTarget } from './utils.js';

const MAX_HEALTH = 400;

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
			speed: 15,
			radius: 10,
			sightRadius: 100,
			hitRadius: 10,
			hitPower: 50,
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
		context.rotate(Math.atan2(dir.y, dir.x) + hitProgress * 2 * Math.PI);

		context.beginPath();
		context.arc(0, 0, radius, 0, 2 * Math.PI);
		context.fill();
		context.stroke();

		context.lineWidth = 2;
		context.beginPath();
		context.moveTo(0, radius);
		context.lineTo(2 * radius, radius);
		context.moveTo(0, -radius);
		context.lineTo(-2 * radius, -radius);
		context.stroke();

		context.restore();
	},
	behavior(self) {
		const hit = () => Behavior.run(function*() {
			yield Behavior.interval(0.2, progress => {
				self.hitProgress = progress;
			})
			self.hitProgress = 0;

			world.units
				.filter(unit => 
					(unit.team !== self.team) && vdist(self.pos, unit.pos) - self.radius - unit.radius < self.hitRadius
				)
				.forEach(unit => {
					unit.health -= self.hitPower;
				})

			if (self.target.health > 0) {
				yield Behavior.wait(1);
			}

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
							waitForTargetSighting(world, self),
							moveToGlobalTarget(self)
						);
					}
					
					yield moveToTarget(self, self.target);

					while (self.target && (vdist(self.pos, self.target.pos) - self.target.radius < self.hitRadius) ) {
						yield hit();
					}
				}
			})
		);
	}
});
