const test = require("node:test");
const assert = require("node:assert/strict");

const { Point, Maze, Wanderer, AStarSolver, Renderer } = require("../src");

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

test("wanderer generates a connected 3D maze solved by A*", () => {
  const maze = new Maze(3, 3, 2);
  const wanderer = new Wanderer(maze, seededRandom(1234));
  wanderer.generate();

  const expectedEdges = maze.width * maze.height * maze.depth - 1;
  assert.equal(maze.edgeCount(), expectedEdges);

  const solver = new AStarSolver(maze);
  const path = solver.solve(new Point(0, 0, 0), new Point(2, 2, 1));
  assert.ok(path);
  assert.ok(path.length > 0);
  assert.equal(path[0].key(), "0,0,0");
  assert.equal(path[path.length - 1].key(), "2,2,1");
});

test("maze exports JSON with dimensions and typed edges", () => {
  const maze = new Maze(1, 1, 2);
  maze.connect(new Point(0, 0, 0), new Point(0, 0, 1));

  const json = maze.toJSON();
  assert.deepEqual(json.dimensions, { width: 1, height: 1, depth: 2 });
  assert.equal(json.edges.length, 1);
  assert.equal(json.edges[0].type, "ladder");
});

test("renderer separates doors and ladders", () => {
  const maze = new Maze(2, 1, 2);
  maze.connect(new Point(0, 0, 0), new Point(1, 0, 0));
  maze.connect(new Point(1, 0, 0), new Point(1, 0, 1));

  const renderer = new Renderer();
  const rendered = renderer.render(maze);

  assert.equal(rendered.length, 2);
  assert.equal(rendered[0].doors.length, 1);
  assert.equal(rendered[0].ladders.length, 1);
  assert.equal(rendered[1].doors.length, 0);
});
