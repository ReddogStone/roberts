import Shooter from './shooter.js';
import { vec, vadd } from '../engine/vector.js';

export default (deps) => {
	const shooter = Shooter(deps);

	return {
		description: {
			cost: 5
		},
		create(team, pos) {
			const dir = team === 1 ? -1 : 1;

			return {
				team,
				pos,
				radius: 20,

				group: [
					shooter.create(team, vec(-8, -17 * dir)),
					shooter.create(team, vec(8, -17 * dir)),
					shooter.create(team, vec(-15, 0)),
					shooter.create(team, vec(15, 0)),
					shooter.create(team, vec(0, 12 * dir))
				].map(unit => {
					unit.type = 'shooter';
					return unit;
				})
			};
		},
		render(context, state) {
			const { pos, group } = state;

			context.save();
			context.translate(pos.x, pos.y);

			group.forEach(unit => {
				shooter.render(context, unit);
			});

			context.restore();
		}
	};
};
