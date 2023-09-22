/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable no-param-reassign */
/* eslint-disable max-lines-per-function */

// h@d3zRe@per

function arraysEqual(arr1, arr2) {
    return arr1[0] === arr2[0] && arr1[1] === arr2[1];
}

const DIRECTIONS = [
    { command: 'down', x: 0, y: 1 },
    { command: 'right', x: 1, y: 0 },
    { command: 'up', x: 0, y: -1 },
    { command: 'left', x: -1, y: 0 }
];

// const way = [ 'down', 'up', 'left', 'right' ]; //1352
// const way = [ 'up', 'down', 'right', 'left' ]; // 1323
const way = [ 'up', 'down', 'left', 'right' ]; // 1250

const Adjustments = way.map(s => {
    const d = DIRECTIONS.find(dd => dd.command === s);

    return [ d.x, d.y ];
});

const seeDistance = 2;

function minBorder(y, border) {
    if (border === undefined) return y - seeDistance;

    return Math.max(border + 1, y - seeDistance);
}

function maxBorder(y, border) {
    if (border === undefined) return y + seeDistance;

    return Math.min(border - 1, y + seeDistance);
}

function normalizePrice({ steps, horizon }) {
    if (horizon <= 0) return Number.NEGATIVE_INFINITY;

    return 2 * horizon - steps;
}

function pathToCommands(path) {
    const commands = [];
    const offset = { x: 0, y: 0 };

    for (let i = 1; i < path.length; i++) {
        const dx = path[i][0] - path[i - 1][0];
        const dy = path[i][1] - path[i - 1][1];

        offset.x += dx;
        offset.y += dy;

        const command = DIRECTIONS.find(d => d.x === dx && d.y === dy);

        commands.push(command.command);
    }

    return { commands, offset };
}

function backTrace(start, goal, parent) {
    const path = [];

    let current = goal;

    while (!arraysEqual(current, start)) {
        path.push(current);
        current = parent[current.join('.')];
    }

    path.push(start);

    return path.reverse();
}

export function prettyPrint(labyrinth) {
    for (const [ y ] of labyrinth.entries()) {
        console.log(labyrinth[y].map(s => {
            if (s === null) return 'X';
            if (s === -1) return 'O';

            return s;
        }).join(''));
    }
}

function squareDist(point1, point2) {
    return Math.abs(point1[0] - point2[0]) + Math.abs(point1[1] - point2[1]);
}

function getDirectionMultiplier(goal, pos) {
    if (!goal) return 1;
    const diff = squareDist(goal, pos);

    return diff <= 10 ? 11 - diff : 1;
}

function lee(labyrinth, { isFirst, global }) {
    // prettyPrint(labyrinth);
    function cell(x, y) {
        if (!labyrinth[y]) return -1;
        if (labyrinth[y][x] === undefined) return -1;

        return labyrinth[y][x];
    }

    function isValidMove(x, y) {
        return x >= 0 && x < labyrinth[0].length && y >= 0 && y < labyrinth.length && [ 'E', 'P', 'B', 'G' ].includes(cell(x, y));
    }

    function getAdjacentCells(x, y) {
        const adjacentCells = [];

        for (const [ dx, dy ] of Adjustments) {
            const newX = x + dx;
            const newY = y + dy;

            if (isValidMove(newX, newY)) {
                adjacentCells.push([ newX, newY ]);
            }
        }

        return adjacentCells;
    }

    let playerPos = null;

    function getBorders() {
        const borders = {};
        const BORDER_LOOKUP_DEPTHS = 1;

        for (let y = BORDER_LOOKUP_DEPTHS; y >= 0; y--) {
            let accum = 0;

            for (let x = 0; x < labyrinth[y].length; x++) {
                if (cell(x, y) === null) accum++;
            }

            if (accum >= 5) {
                borders.minY = y;
                break;
            }
        }

        for (let y = labyrinth.length - BORDER_LOOKUP_DEPTHS; y < labyrinth.length; y++) {
            let accum = 0;

            for (let x = 0; x < labyrinth[y].length; x++) {
                if (cell(x, y) === null) accum++;
            }

            if (accum >= 5) {
                borders.maxY = y;
                break;
            }
        }

        for (let x = BORDER_LOOKUP_DEPTHS; x >= 0; x--) {
            let accum = 0;

            for (let y = 0; y < labyrinth.length; y++) {
                if (cell(x, y) === null) accum++;
            }

            if (accum >= 5) {
                borders.minX = x;
                break;
            }
        }

        for (let x = labyrinth[0].length - BORDER_LOOKUP_DEPTHS; x < labyrinth[0].length; x++) {
            let accum = 0;

            for (let y = 0; y < labyrinth.length; y++) {
                if (cell(x, y) === null) accum++;
            }

            if (accum >= 5) {
                borders.maxX = x;
                break;
            }
        }


        return borders;
    }

    const borders = getBorders();

    // console.log('borders:', borders);

    let goalPos = null;

    if (isFirst) {
        playerPos = [ 2, 2 ];
        labyrinth[2][2] = 'B';
    }

    for (const [ y, element ] of labyrinth.entries()) {
        for (let x = 0; x < labyrinth[0].length; x++) {
            if (!global && [ 'P' ].includes(element[x])) {
                playerPos = [ x, y ];

                continue;
            }

            if (element[x] === 'G') {
                goalPos = [ x, y ];
                continue;
            }

            if (global && [ 'B', 'R' ].includes(element[x])) {
                playerPos = [ x, y ];
            }
        }
    }

    if (goalPos && !global) {
        const tryGlobal = lee(labyrinth, { global: true });

        if (tryGlobal.goal) {
            return tryGlobal;
        }
    }

    const queue = [ playerPos ];
    const visited = new Set();
    const parent = {};
    const prices = { [playerPos.join('.')]: { steps: 0, horizon: 0, price: Number.NEGATIVE_INFINITY } };

    function horizonCover([ x, y ]) {
        const badMovePenalty = 0;

        let uncovered = 0;

        let canMakeNewEnhancedMove = false;

        for (let i = minBorder(x, borders.minX); i <=  maxBorder(x, borders.maxX); i++) {
            for (let j = minBorder(y, borders.minY); j <= maxBorder(y, borders.maxY); j++) {
                const direction = getDirectionMultiplier(goalPos, [ i, j ]);
                const val = cell(i, j);
                const dist = squareDist([ x, y ], [ i, j ]);

                if (val === -1) uncovered = uncovered + direction;
                if (dist === 1 && val === -1) {
                    canMakeNewEnhancedMove = true;
                }
            }
        }

        if (!canMakeNewEnhancedMove) uncovered = uncovered - badMovePenalty;

        return uncovered;
    }

    while (queue.length > 0) {
        const [ x, y ] = queue.shift();
        const parentPrice = prices[`${x}.${y}`];

        if (global && arraysEqual([ x, y ], goalPos)) {
            const path = backTrace(playerPos, goalPos, parent);

            // console.log('path:', path);
            // prettyPrint(labyrinth);
            // console.log({ playerPos, goalPos }, cell(...playerPos), cell(...goalPos));

            const { commands } = pathToCommands(path);

            return {
                path,
                playerPos,
                goal  : true,
                steps : commands
            };
        }

        const adjacentCells = getAdjacentCells(x, y);

        for (const newPosition of adjacentCells) {
            const hash = newPosition.join('.');

            if (!visited.has(hash)) {
                queue.push(newPosition);
                visited.add(hash);
                parent[hash] = [ x, y ];
                const price = {
                    steps   : parentPrice.steps + 1,
                    horizon : horizonCover(newPosition)
                };

                price.price = normalizePrice(price);

                prices[hash] = price;
            }
        }
    }

    // console.log('prices:', prices);
    let localGoal = null;

    for (const hash of Object.keys(prices)) {
        const p = prices[hash];

        if (!localGoal || p.price > localGoal.price) {
            localGoal = { hash, ...p };
        }
    }

    if (localGoal.price === Number.NEGATIVE_INFINITY) {
        return {
            noGoal : true
        };
    }

    const path = backTrace(playerPos, localGoal.hash.split('.'), parent);
    const { commands, offset } = pathToCommands(path);

    return {
        path,
        playerPos,
        goal  : false,
        steps : commands,
        offset
    };
}


function stichCell(piCell, whCell) {
    if ([ 'B', 'R' ].includes(whCell)) {
        if ([ null, 'W' ].includes(piCell)) return 'R';

        return whCell;
    }

    if (piCell || piCell === null) return piCell;
    if (whCell === null) return whCell;
    if (whCell === 'P') return 'E';
    if (whCell) return whCell;

    return -1;
}

function stich(whole, piece, offset, oldPlayer) {
    const res = [];
    const fragmentCenter = [
        offset.x + oldPlayer[0],
        offset.y + oldPlayer[1]
    ];
    const relCenter = [ 2, 2 ];

    // console.log('-----------');
    // prettyPrint(whole);
    // console.log(fragmentCenter, offset, oldPlayer);
    // prettyPrint(piece);

    const xmin = Math.min(0, fragmentCenter[0] - seeDistance);
    const xmax = Math.max(whole[0].length - 1, fragmentCenter[0] + seeDistance);
    const ymin = Math.min(0, fragmentCenter[1] - seeDistance);
    const ymax = Math.max(whole.length - 1, fragmentCenter[1] + seeDistance);

    // console.log(whole[0].length, fragmentCenter[0] + seeDistance);
    // console.log({ xmin, xmax, ymin, ymax });
    for (let j = ymin; j <= ymax; j++) {
        const line = [];

        for (let i = xmin; i <= xmax; i++) {
            const whCell = whole[j]?.[i];
            const piCell = piece[j - fragmentCenter[1] + relCenter[1]]?.[i - fragmentCenter[0] + relCenter[0]];

            line.push(stichCell(piCell, whCell));
        }

        res.push(line);
    }

    // prettyPrint(res);

    return res;
}

export default function seek(player) {
    let LABYRINTH = player.lookAround();

    let iteration = 0;

    while (true) {
        const { steps, offset, goal, playerPos, noGoal } = lee(LABYRINTH, { isFirst: iteration === 0 });

        if (noGoal) {
            return [];
        }

        if (goal) {
            // console.log('FINISHED');
            // console.log('steps:', steps);

            return steps.map(s => s.toUpperCase());
        }

        for (const step of steps) {
            player[step]();
        }

        const fragment = player.lookAround();

        LABYRINTH = stich(LABYRINTH, fragment, offset, playerPos);
        iteration++;
        // prettyPrint(LABYRINTH);
        // console.log('iteration:', iteration);
        // if (iteration === 200) break;
    }
}

