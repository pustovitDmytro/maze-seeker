/* eslint-disable no-param-reassign */
/* eslint-disable max-lines-per-function */
import { createRequire } from 'module';
import Player from './PlayerTest.js';
import seek, { prettyPrint } from './seek.js';

const require = createRequire(import.meta.url);
const map = require('./map1.json');

const start = [ 19, 10 ];
const player = new Player(map, ...start);

prettyPrint(map);
const mapSize = `${map.length }x${map[0].length} size`;

prettyPrint(player.lookAround());
console.time(mapSize);

const path = seek(player);

console.timeEnd(mapSize);

console.log('path:', path);

function test(point, steps) {
    const p = new Player(map, ...point);

    for (const step of steps) {
        prettyPrint(p.lookAround());
        console.log(`====== ${step} ======`);
        p[step.toLowerCase()]();
    }
}

function lookAt(point) {
    const p = new Player(map, ...point);

    prettyPrint(p.lookAround());
}

// lookAt([ 21, 20 ]);
// // test(start, path);
