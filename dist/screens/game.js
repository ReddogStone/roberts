import Behavior from '../engine/behavior.js';
import { vec, vadd, vsub, vmul, vscale, vdist } from '../engine/vector.js';
import Units from '../units/index.js';
import Colors from '../constants/colors.js';
import { UNIT_START_POS_PERCENTAGE, TARGET_HEIGHT } from '../constants/game.js';
import UI from '../ui/index.js';

export default function(fieldSize, behaviorSystem, setRender) {
//=======================================
// STATE
//=======================================
const world = {
	turn: 0,
	turnTime: 5,
	round: 0,
	units: [],
	projectiles: [],
	selectedUnit: undefined,
	points: { team1: 0, team2: 0 },
	mousePos: vec(0, 0),
	cooldown: {
		team1: {},
		team2: {}
	}
};

const units = Units({ fieldSize, world, behaviorSystem });
const ui = UI({ fieldSize, world, behaviorSystem, units });




//=======================================
// RENDER
//=======================================
	function renderGameField(context) {
		const { x: width, y: height } = fieldSize;

		context.fillStyle = Colors.TARGET;
		context.fillRect(-0.5 * width, -0.5 * height, width, TARGET_HEIGHT);
		context.fillRect(-0.5 * width, 0.5 * height - TARGET_HEIGHT, width, TARGET_HEIGHT);

		context.strokeStyle = Colors.TEAM1;
		context.beginPath();
		context.moveTo(-0.5 * width, -0.5 * height + TARGET_HEIGHT);
		context.lineTo(0.5 * width, -0.5 * height + TARGET_HEIGHT);
		context.stroke();

		context.strokeStyle = Colors.TEAM2;
		context.beginPath();
		context.moveTo(-0.5 * width, 0.5 * height - TARGET_HEIGHT);
		context.lineTo(0.5 * width, 0.5 * height - TARGET_HEIGHT);
		context.stroke();
	}

	function renderProjectile(context, state) {
		const { team, pos, radius } = state;

		context.fillStyle = Colors[`TEAM${team}`];
		context.strokeStyle = Colors.OUTLINE;

		context.beginPath();
		context.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
		context.fill();
		context.stroke();
	}

	function renderHealth(context, percentage) {
		const WIDTH = 40;
		const HEIGHT = 6;

		context.fillStyle = Colors.HEALTH_BACK;
		context.fillRect(-WIDTH * 0.5, -HEIGHT * 0.5, WIDTH, HEIGHT);

		context.fillStyle = Colors.HEALTH_FRONT;
		context.fillRect(-WIDTH * 0.5, -HEIGHT * 0.5, WIDTH * percentage, HEIGHT);

		context.strokeStyle = Colors.OUTLINE;
		context.lineWidth = 1;
		context.strokeRect(-WIDTH * 0.5, -HEIGHT * 0.5, WIDTH, HEIGHT);
	}

	setRender(context => {
		context.save();
		context.translate(fieldSize.x * 0.5, fieldSize.y * 0.5);
		// context.scale(1, -1);

		renderGameField(context);

		ui.renderBeforeUnits(context);

		world.units.forEach(unit => {
			units[unit.type].render(context, unit);
		});

		world.projectiles.forEach(projectile => {
			renderProjectile(context, projectile);
		})

		world.units
			.filter(({ health, maxHealth }) => health < maxHealth)
			.forEach(({ health, maxHealth, pos, radius }) => {
				context.save();
				context.translate(pos.x, pos.y - radius - 10);

				renderHealth(context, health / maxHealth);

				context.restore();
			});

		ui.render(context);

		context.restore();
	});




//=======================================
// BEHAVIOR
//=======================================
	function createUnit(type, team, pos) {
		const unit = units[type].create(team, pos);
		unit.type = type;
		return unit;
	}

	function addUnit(unit) {
		if (unit.group) {
			unit.group.forEach(member => {
				member.pos = vadd(member.pos, unit.pos);
				addUnit(member);
			});
			return;
		}

		behaviorSystem.add(units[unit.type].behavior(unit));
		world.units.push(unit);
	}

	function startRound() {
		world.turn = world.round % 2;
		world.turnTime = 5;

		world.units.forEach(unit => { unit.health = 0; });
		world.units.length = 0;

		world.projectiles.length = 0;

		world.cooldown = { team1: {}, team2: {} };

		delete world.winner;
	}

	function getSelectedUnitPos(mousePos) {
		let y = mousePos.y;
		const gameFieldHeight = fieldSize.y - 2 * TARGET_HEIGHT;
		if (world.turn % 2 === 0) {
			y = Math.min(y, 0.5 * fieldSize.y - TARGET_HEIGHT);
			y = Math.max(y, 0.5 * fieldSize.y - TARGET_HEIGHT - UNIT_START_POS_PERCENTAGE * gameFieldHeight);
		} else {
			y = Math.max(y, -0.5 * fieldSize.y + TARGET_HEIGHT);
			y = Math.min(y, -0.5 * fieldSize.y + TARGET_HEIGHT + UNIT_START_POS_PERCENTAGE * gameFieldHeight);			
		}

		return vec(mousePos.x, y);
	}

	const KEYS = {
		'1': 'tank',
		'2': 'cannon',
		'3': 'shooterGroup',
		'4': 'airplane',
		'5': 'spinner',
		'6': 'impaler'
	};

	const turn = () => Behavior.run(function*() {
		const team = (world.turn % 2) + 1;

		let nextTurnTime = 5;

		const shouldPlaceUnit = yield Behavior.first(
			Behavior.update(dt => {
				world.turnTime -= dt;
				if (world.turnTime <= 0) {
					return false;
				}
			}),

			ui.placeUnitBehavior(team)
		);

		if (shouldPlaceUnit) {
			const { type } = world.selectedUnit;

			addUnit(world.selectedUnit);
			nextTurnTime = units[type].description.cost;

			const cooldowns = world.cooldown[`team${team}`];
			cooldowns[type] = 20;
		}

		world.turn++;
		world.turnTime = nextTurnTime;
	});

	const winCondition = () => Behavior.update(() => {
		let team1Wins = false;
		let team2Wins = false;

		world.units.forEach(({ pos, radius, team }) => {
			if ( (team === 1) && (pos.y - radius < -0.5 * fieldSize.y + TARGET_HEIGHT) ) {
				world.winner = 1;
				world.points.team1++;
			}
			if ( (team === 2) && (pos.y + radius > 0.5 * fieldSize.y - TARGET_HEIGHT) ) {
				world.winner = 2;
				world.points.team2++;
			}
		});

		if (world.winner) {
			return true;
		}
	});

	return Behavior.first(
		Behavior.run(function*() {
			while (true) {
				const { pos } = yield Behavior.type('mousemove');
				world.mousePos = vsub(pos, vscale(fieldSize, 0.5));

				if (world.selectedUnit) {
					world.selectedUnit.pos = getSelectedUnitPos(world.mousePos);
				}
			}
		}),
		Behavior.update(dt => {
			world.projectiles.forEach(projectile => {
				const { pos, dir, radius, speed, team, power } = projectile;
				projectile.pos = vadd(pos, vscale(dir, dt * speed));

				if (
					pos.x > 0.5 * fieldSize.x ||
					pos.x < -0.5 * fieldSize.x ||
					pos.y > 0.5 * fieldSize.y ||
					pos.y < -0.5 * fieldSize.y
				) {
					projectile.dead = true;
					return;
				}

				world.units
					.filter(unit => team !== unit.team)
					.forEach(unit => {
						const dist = vdist(pos, unit.pos) - radius - unit.radius;
						if (dist <= 0) {
							unit.health -= power;
							projectile.dead = true;
						}
					});
			});

			for (let key in world.cooldown) {
				const cooldowns = world.cooldown[key];

				for (let type in cooldowns) {
					cooldowns[type] -= dt;
					if (cooldowns[type] <= 0) {
						delete cooldowns[type];
					}
				}
			}
		}),
		Behavior.run(function*() {
			while(true) {
				startRound();

				yield Behavior.first(
					winCondition(),
					Behavior.run(function*() {
						while (true) {
							yield turn();
						}
					})
				);

				world.round++;
				behaviorSystem.clear();
				yield Behavior.type('mousedown');
			}
		}),
		ui.behavior(),
		Behavior.update(dt => {
			for (let i = world.projectiles.length - 1; i >= 0; i--) {
				if (world.projectiles[i].dead) {
					world.projectiles.splice(i, 1);
				}
			}

			for (let i = world.units.length - 1; i >= 0; i--) {
				if (world.units[i].health <= 0) {
					world.units.splice(i, 1);
				}
			}
		})
	);

	return main;
}