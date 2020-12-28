const { Engine, Render, Runner, World, Body, Bodies, Events } = Matter;

const cells = 6;
const width = 600;
const height = 600;

const unitLength = width / cells;

const engine = Engine.create();
engine.world.gravity.y = 0.02;

const { world } = engine;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: true,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

const walls = [
  Bodies.rectangle(width / 2, 0, width, 40, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 40, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 40, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 40, height, { isStatic: true }),
];

World.add(world, walls);

// Grid Generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }
  return arr;
};

const grid = Array(cells)
  .fill(null)
  .map(() => Array(cells).fill(false));

const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells).fill(false));

const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

console.log(startRow, startColumn);

const stepThroughGridCells = (row, column) => {
  // If visited the cell at [row/column], return
  if (grid[row][column]) {
    return;
  }
  // Mark cell as visited
  grid[row][column] = true;
  // Assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left'],
  ]);
  // for each neighbor....
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
    // See if neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cells ||
      nextColumn < 0 ||
      nextColumn >= cells
    ) {
      continue;
    }
    // If we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue;
    }
    // remove a wall from either horizontals or verticals
    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }

    stepThroughGridCells(nextRow, nextColumn);
  }
  // Visit next cell
};

stepThroughGridCells(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLength + unitLength / 2,
      rowIndex * unitLength + unitLength,
      unitLength,
      10,
      {
        label: 'wall',
        isStatic: true,
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLength + unitLength,
      rowIndex * unitLength + unitLength / 2,
      10,
      unitLength,
      {
        label: 'wall',
        isStatic: true,
      }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitLength / 2,
  height - unitLength / 2,
  unitLength * 0.5,
  unitLength * 0.5,
  {
    isStatic: true,
    label: 'goal',
    render: {
      fillStyle: 'violet',
      strokeStyle: 'green',
      lineWidth: 3,
    },
  }
);

World.add(world, goal);

// Ball

const ball = Bodies.circle(unitLength / 2, unitLength / 2, unitLength / 4, {
  label: 'ball',
});

World.add(world, ball);
document.addEventListener('keydown', (e) => {
  const { keyCode } = e;
  const { x, y } = ball.velocity;

  if (keyCode === 87) {
    Body.setVelocity(ball, { x, y: -5 });
  }
  if (keyCode === 68) {
    Body.setVelocity(ball, { x: 5, y });
  }
  if (keyCode === 83) {
    Body.setVelocity(ball, { x, y: 5 });
  }
  if (keyCode === 65) {
    Body.setVelocity(ball, { x: -5, y });
  }
});

// Win Conditions

Events.on(engine, 'collisionStart', (e) => {
  e.pairs.forEach((collision) => {
    const labels = ['ball', 'goal'];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === 'wall') Body.setStatic(body, false);
      });
    }
  });
});
