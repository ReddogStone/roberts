import Behavior from '../engine/behavior.js';
import { vec, vdir, vclone, vdist } from '../engine/vector.js';
import Colors from '../constants/colors.js';

import { waitForTargetSighting } from './utils.js';

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
			speed: 10,
			radius: 15,
			sightRadius: 100,
			shotRadius: 100
		};
	},
	render(context, state) {
		const { pos, team, radius, dir, shotProgress } = state;

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

		context.translate(-shotProgress * 10, 0);

		context.lineWidth = 5;
		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(radius * 0.7, 0);
		context.stroke();

		context.restore();
	},
	behavior(self) {
		const shoot = () => Behavior.run(function*() {
			yield Behavior.interval(0.2, progress => {
				self.shotProgress = progress;
			})

			world.projectiles.push({
				pos: vclone(self.pos),
				radius: 3,
				dir: vdir(self.pos, self.target.pos),
				speed: 100,
				team: self.team,
				power: 80
			});

			yield Behavior.interval(1, progress => {
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
					self.target = yield waitForTargetSighting(world, self, unit => !unit.flying);

					while (self.target && (vdist(self.pos, self.target.pos) - self.target.radius < self.shotRadius)) {
						yield shoot();
					}

					self.target = undefined;
				}
			})
		);
	}
});
