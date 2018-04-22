import Behavior from '../engine/behavior.js';
import { vec, vadd, vscale, vdist, vdir } from '../engine/vector.js';

export const moveToGlobalTarget = self => Behavior.update(dt => {
	const dir = self.team === 1 ? -1 : 1;
	self.dir = vec(0, dir);
	self.pos.y = self.pos.y + dir * self.speed * dt;
});

export const waitForTargetSighting = (world, self, filter = (() => true)) => Behavior.update(() => {
	const relevantUnits = world.units.filter(unit => (unit.team !== self.team) && filter(unit));

	let closestTarget = undefined;
	let closestDist = Infinity;
	relevantUnits.forEach(unit => {
		const dist = vdist(self.pos, unit.pos);
		if((dist - unit.radius) < self.sightRadius) {
			closestDist = dist;
			closestTarget = unit;
		}
	});

	return closestTarget;
});

export const moveToTarget = (self, target, stopAtDistance = self.radius + target.radius) => Behavior.update(dt => {
	if (target.health <= 0) { return true; }

	const dist = vdist(self.pos, target.pos);
	if (dist < stopAtDistance) { return true; }

	self.dir = vdir(self.pos, target.pos);
	self.pos = vadd(self.pos, vscale(self.dir, dt * self.speed));
});

export const unitDist = (u1, u2) => vdist(u1.pos, u2.pos) - u1.radius - u2.radius;