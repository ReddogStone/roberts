import { vec, vadd, vsub, vmul, vscale, vdist } from '../engine/vector.js';
import Behavior from '../engine/behavior.js';
import Colors from '../constants/colors.js';
import { UNIT_START_POS_PERCENTAGE, TARGET_HEIGHT } from '../constants/game.js';

const UI_HEIGHT = 80;
const SELECTION_BOX_SIZE = vec(60, 75);

export default ({ fieldSize, world, behaviorSystem, units }) => {
	const selectableTypes = [
		'tank',
		'cannon',
		'shooterGroup',
		'airplane',
		'spinner',
		'impaler'
	];

	const selectableUnits = [1, 2]
		.map(team =>
			selectableTypes.map(type => Object.assign(units[type].create(team, vec(0, 0)), { type }))
		);

	const selectionBoxes = selectableUnits.map((teamUnits, index) => {
		const dir = index === 0 ? 1 : -1;

		const selectionOffset = vec(
			-0.5 * fieldSize.x + 110,
			dir * 0.5 * fieldSize.y - dir * 0.5 * UI_HEIGHT
		);

		return teamUnits.map((unit, index) => ({
			pos: vec(
				selectionOffset.x + index * (SELECTION_BOX_SIZE.x + 10),
				selectionOffset.y
			),
			unit,
			hovered: false
		}))
	});

	function renderActiveStripe(context, team) {
		const dir = team === 1 ? 1 : -1;

		context.fillStyle = Colors[`TEAM${team}`];
		context.strokeStyle = Colors.OUTLINE;
		context.lineWidth = 2;

		context.fillRect(-0.5 * fieldSize.x, dir * 0.5 * fieldSize.y, fieldSize.x, -dir * UI_HEIGHT);
	}

	function renderStartAreaStripe(context, team) {
		const dir = team === 1 ? 1 : -1;

		context.fillStyle = Colors[`TEAM${team}`];
		context.strokeStyle = Colors.OUTLINE;
		context.lineWidth = 2;

		context.globalAlpha = 0.2;
		context.fillRect(
			-0.5 * fieldSize.x,
			dir * (0.5 * fieldSize.y - TARGET_HEIGHT),
			fieldSize.x,
			-dir * UNIT_START_POS_PERCENTAGE * (fieldSize.y - 2 * TARGET_HEIGHT)
		);
		context.globalAlpha = 1;
	}

	function renderScore(context, { team1, team2 }) {
		context.textAlign = 'left';
		context.font = '20px sans-serif';
		context.fillStyle = Colors.OUTLINE;

		context.fillText(team1 + ' won', -0.5 * fieldSize.x + 10, 0.5 * fieldSize.y - 10);
		context.fillText(team2 + ' won', -0.5 * fieldSize.x + 10, -0.5 * fieldSize.y + 20);
	}

	function renderTime(context, turn, remaining) {
		const dir = turn === 0 ? 1 : -1;
		const y = 0.5 * dir * fieldSize.y - 40 + turn * 90;

		context.textAlign = 'left';
		context.font = '20px sans-serif';
		context.fillStyle = Colors.OUTLINE;
		context.fillText(remaining.toFixed(0) + 's left', -0.5 * fieldSize.x + 10, y);
	}

	function renderCooldownCross(context, radius) {
		context.strokeStyle = Colors.COOLDOWN_CROSS;
		context.lineWidth = 5;

		context.beginPath();
		context.moveTo(-radius, -radius);
		context.lineTo(radius, radius);
		context.moveTo(-radius, radius);
		context.lineTo(radius, -radius);
		context.stroke();
	}

	function renderCooldownText(context, cooldown) {
		context.font = '15px sans-serif';
		context.textAlign = 'center';
		context.fillStyle = Colors.COOLDOWN_TEXT;
		context.fillText(cooldown.toFixed(0) + 's', 0, 0);
	}

	function renderSelectedUnit(context, selectedUnit, team) {
		const cooldowns = world.cooldown[`team${team}`];

		const { type, pos, radius } = selectedUnit;
		const cooldown = cooldowns[type];

		context.globalAlpha = 0.5;
		units[type].render(context, selectedUnit);
		context.globalAlpha = 1;

		if (cooldown) {
			const { pos, radius } = selectedUnit;

			context.save();
			context.translate(pos.x, pos.y);
			renderCooldownCross(context, radius);

			context.translate(radius + 20, 0);
			renderCooldownText(context, cooldown);

			context.restore();
		}

		let shownType = type;
		shownType = shownType.replace(/[A-Z]/g, match => ' ' + match);
		shownType = shownType[0].toUpperCase() + shownType.slice(1);

		context.textAlign = 'center';
		context.font = '15px sans-serif';
		context.fillStyle = Colors.OUTLINE;
		context.fillText(shownType, pos.x, pos.y - radius - 10);
	}

	function renderSelectionBox(context, team, { pos, unit, hovered }, index) {
		const cooldowns = world.cooldown[`team${team}`];

		const dir = team === 1 ? 1 : -1;
		const off = team === 1 ? 1 : 0;

		context.save();
		context.translate(pos.x, pos.y);

		context.strokeStyle = Colors.OUTLINE;
		context.fillStyle = hovered ? Colors.SELECTION_BOX_BG_HOVERED : Colors.SELECTION_BOX_BG;
		context.lineWidth = 1.5;

		context.beginPath();
		context.rect(
			-0.5 * SELECTION_BOX_SIZE.x,
			-0.5 * SELECTION_BOX_SIZE.y,
			SELECTION_BOX_SIZE.x,
			SELECTION_BOX_SIZE.y
		);
		context.fill();
		context.stroke();

		context.translate(0, dir * 10);
		units[unit.type].render(context, unit);

		if (cooldowns[unit.type]) {
			renderCooldownCross(context, unit.radius);

			const offset = vec(0.5 * SELECTION_BOX_SIZE.x - 17, -dir * (0.5 * SELECTION_BOX_SIZE.y) + 5);
			context.translate(offset.x, offset.y);
			renderCooldownText(context, cooldowns[unit.type]);
			context.translate(-offset.x, -offset.y);
		}

		context.fillStyle = Colors.OUTLINE;
		context.translate(-SELECTION_BOX_SIZE.x * 0.5 + 10, -dir * (0.5 * SELECTION_BOX_SIZE.y + 3) + off * 10);
		context.fillText(index + 1, 0, 0);

		context.restore();
	}

	function renderUnitSelection(context, team) {
		const { selectedUnit, cooldown } = world;

		const dir = team === 1 ? 1 : -1;

		selectionBoxes[team - 1].forEach((box, index) => {
			const { unit } = box;

			context.save();

			if (selectedUnit && selectedUnit.type === unit.type && selectedUnit.team === unit.team) {
				context.translate(0, -dir * 20);
			}

			renderSelectionBox(context, team, box, index);

			context.restore();
		});
	}

	function renderWinnerMessage(context, winner) {
		context.textAlign = 'center';
		context.font = '60px sans-serif';
		context.fillStyle = Colors[`TEAM${winner}`];
		context.fillText((winner === 1 ? 'Blue' : 'Red') + ' wins!', 0, 0);
	}

	function isInsideBox(pos, boxPos) {
		const dx = Math.abs(pos.x - boxPos.x);
		const dy = Math.abs(pos.y - boxPos.y);

		return dx <= 0.5 * SELECTION_BOX_SIZE.x && dy <= 0.5 * SELECTION_BOX_SIZE.y;
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

	function selectUnit(team, type) {
		world.selectedUnit = units[type].create(team, getSelectedUnitPos(world.mousePos));
		world.selectedUnit.type = type;
	}

	return {
		renderBeforeUnits(context) {
			const team = (world.turn % 2) + 1;
			renderStartAreaStripe(context, team);
		},
		render(context) {
			const { turn, points, turnTime, selectedUnit } = world;
			const team = (turn % 2) + 1;

			renderActiveStripe(context, team);
			renderScore(context, points);
			renderTime(context, turn % 2, turnTime);

			if (selectedUnit) {
				renderSelectedUnit(context, selectedUnit, team);
			}

			renderUnitSelection(context, 1);
			renderUnitSelection(context, 2);

			if (world.winner) {
				renderWinnerMessage(context, world.winner);
			}
		},
		behavior() {
			return Behavior.first(
				Behavior.update(() => {
					const teamBoxes = selectionBoxes[world.turn % 2];
					const enemyBoxes = selectionBoxes[(world.turn + 1) % 2];

					teamBoxes.forEach(box => {
						box.hovered = isInsideBox(world.mousePos, box.pos);
					});
					enemyBoxes.forEach(box => {
						box.hovered = false;
					});
				})
			);
		},
		placeUnitBehavior(team) {
			selectUnit(team, 'tank');

			return Behavior.first(
				Behavior.run(function*() {
					while (true) {
						yield Behavior.type('mousedown');

						const teamBoxes = selectionBoxes[team - 1];
						const clickedBox = teamBoxes.find(box => isInsideBox(world.mousePos, box.pos));
						if (clickedBox) {
							selectUnit(team, clickedBox.unit.type);
						}
					}
				}),
				Behavior.run(function*() {
					while (true) {
						yield Behavior.type('mouseup');

						const pos = world.mousePos;
						if (Math.abs(pos.y) > 0.5 * fieldSize.y - UI_HEIGHT) {
							continue;
						}

						const cooldowns = world.cooldown[`team${team}`];
						const { type } = world.selectedUnit;

						if (!cooldowns[type]) {
							return true;
						}
					}
				}),
				Behavior.run(function*() {
					while (true) {
						const { event: { key } } = yield Behavior.type('keydown');

						const unit = selectableUnits[team - 1][Number(key) - 1];
						if (unit) {
							selectUnit(team, unit.type);
						}
					}
				})
			);
		}
	};
};