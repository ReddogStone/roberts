import tank from './tank.js';
import cannon from './cannon.js';
import shooter from './shooter.js';
import shooterGroup from './shooter-group.js';
import airplane from './airplane.js';
import spinner from './spinner.js';
import impaler from './impaler.js';

export default (deps) => ({
	tank: tank(deps),
	cannon: cannon(deps),
	shooter: shooter(deps),
	shooterGroup: shooterGroup(deps),
	airplane: airplane(deps),
	spinner: spinner(deps),
	impaler: impaler(deps)
});
