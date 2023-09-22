/* eslint-disable no-param-reassign */
/* eslint-disable max-lines-per-function */
import { createRequire } from 'module';
import BasePlayer from './PlayerTest.js';
import seek, { prettyPrint } from './seek.js';

const require = createRequire(import.meta.url);

const savedReport = require('./report.json');

const CASES = [
    { map: 'map1.json', start: [ 8, 1 ] },
    { map: 'map1.json', start: [ 14, 0 ] },
    { map: 'map1.json', start: [ 19, 10 ] },
    { map: 'map1.json', start: [ 17, 14 ] },
    { map: 'map1.json', start: [ 0, 0 ] },
    { map: 'map1.json', start: [ 0, 22 ] },
    { map: 'map1.json', start: [ 7, 7 ] },
    { map: 'map1.json', start: [ 23, 21 ] },

    { map: 'map2.json', start: [ 3, 11 ] },
    { map: 'map2.json', start: [ 0, 8 ] },
    { map: 'map2.json', start: [ 0, 21 ] },
    { map: 'map2.json', start: [ 11, 0 ] },
    { map: 'map2.json', start: [ 23, 0 ] },
    { map: 'map2.json', start: [ 14, 17 ] },
    { map: 'map2.json', start: [ 1, 5 ] },

    { map: 'map3.json', start: [ 9, 5 ] },
    { map: 'map3.json', start: [ 2, 8 ] },
    { map: 'map3.json', start: [ 1, 11 ] },
    { map: 'map3.json', start: [ 14, 21 ] },
    { map: 'map3.json', start: [ 20, 6 ] },
    { map: 'map3.json', start: [ 22, 20 ] },
    { map: 'map3.json', start: [ 5, 9 ] }
];

class TestPlayer extends BasePlayer {
    __iter = 0;

    up() {
        this.__iter++;

        return super.up();
    }

    down() {
        this.__iter++;

        return super.down();
    }

    left() {
        this.__iter++;

        return super.left();
    }

    right() {
        this.__iter++;

        return super.right();
    }

    lookAround() {
        this.__iter++;

        return super.lookAround();
    }
}

function check(map, point, steps) {
    if (steps.length === 0) throw new Error('stucked');
    const p = new BasePlayer(map, ...point);

    for (const step of steps.slice(0, -1)) {
        p[step.toLowerCase()]();
    }

    const lastFragm = p.lookAround();
    const lastStep = steps[steps.length - 1];

    let goal;

    if (lastStep === 'DOWN') goal = [ 3, 2 ];
    if (lastStep === 'UP') goal = [ 1, 2 ];
    if (lastStep === 'LEFT') goal = [ 2, 1 ];
    if (lastStep === 'RIGHT') goal = [ 2, 3 ];
    const expectGoal = lastFragm[goal[0]][goal[1]];

    if (expectGoal !== 'G') {
        prettyPrint(lastFragm);
        console.log(lastStep, expectGoal);
        throw new Error('NO EXIT');
    }
}

const REPORT = {};

function report(player, path, key) {
    const rep = {
        actions : player.__iter,
        path    : path.length
    };

    REPORT[key] = rep;
    const saved = savedReport[key];

    if (!saved) {
        return console.log('new');
    }

    const diffActions = saved.actions - rep.actions;
    const diffPath = saved.path - rep.path;

    console.log(`A ${diffActions} P: ${diffPath}`);
}

for (const test of CASES) {
    const map = require(`./${test.map}`);
    const mapSize = `${test.map}: [${test.start.join(',')}]`;
    const player = new TestPlayer(map, ...test.start);

    console.time(mapSize);
    const path = seek(player);

    console.timeEnd(mapSize);

    check(map, test.start, path);
    report(player, path, mapSize);
}

const total = { actions: 0, path: 0 };

for (const v of Object.values(REPORT)) {
    total.actions += v.actions;
    total.path += v.path;
}

REPORT._total = total;
const saved = savedReport._total;

if (saved) {
    console.log('TOTAL');
    const diffActions = saved.actions - total.actions;
    const diffPath = saved.path - total.path;

    console.log(`A ${diffActions} P: ${diffPath}`);
}

console.log(JSON.stringify(REPORT));
