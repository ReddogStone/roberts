import Behavior from '../engine/behavior.js';
import { vec, vdir, vclone, vdist } from '../engine/vector.js';
import Colors from '../constants/colors.js';

import { moveToGlobalTarget, waitForTargetSighting, moveToTarget } from './utils.js';

const MAX_HEALTH = 250;

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
			speed: 30,
			radius: 15,
			sightRadius: 120,
			shotRadius: 100,
			flying: true
		};
	},
	render(context, state) {
		const { pos, team, radius, dir, shotProgress } = state;

		context.fillStyle = Colors[`TEAM${team}`];
		context.strokeStyle = Colors.OUTLINE;
		context.lineWidth = 2;

		context.save();
		context.translate(pos.x, pos.y);
		context.rotate(Math.atan2(dir.y, dir.x));

		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(-10, radius);
		context.lineTo(radius, 0);
		context.lineTo(-10, -radius);
		context.closePath();
		context.fill();
		context.stroke();

		context.restore();
	},
	behavior(self) {
		const shoot = () => Behavior.run(function*() {
			yield Behavior.interval(0.1, progress => {
				self.shotProgress = progress;
			})

			world.projectiles.push({
				pos: vclone(self.pos),
				radius: 3,
				dir: vdir(self.pos, self.target.pos),
				speed: 100,
				team: self.team,
				power: 7
			});

			yield Behavior.interval(0.1, progress => {
				self.shotProgress = 1 - progress;
			})

			if (self.target.health <= 0) {
				self.target = undefined;
				return;
			}
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
					if (!self.target) {
						self.target = yield Behavior.first(
							waitForTargetSighting(world, self),
							moveToGlobalTarget(self)
						);
					} else {
						yield moveToTarget(self, self.target, self.shotRadius);
					}

					while (self.target && (vdist(self.pos, self.target.pos) - self.target.radius < self.shotRadius) ) {
						yield shoot();
					}
				}
			})
		);
	}
});
