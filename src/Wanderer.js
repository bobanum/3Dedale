const Point = require("./Point");

class Wanderer {
  constructor(maze, random = Math.random) {
    this.maze = maze;
    this.random = random;
  }

  _pick(list) {
    return list[Math.floor(this.random() * list.length)];
  }

  generate() {
    const total = this.maze.width * this.maze.height * this.maze.depth;
    const start = new Point(
      Math.floor(this.random() * this.maze.width),
      Math.floor(this.random() * this.maze.height),
      Math.floor(this.random() * this.maze.depth)
    );

    const visited = new Set([start.key()]);
    const visitedPoints = [start];
    let current = start;

    while (visited.size < total) {
      const candidates = this.maze
        .getNeighbors(current)
        .filter((n) => !visited.has(n.key()));

      if (candidates.length === 0) {
        const restart = visitedPoints.filter(
          (p) => this.maze.getNeighbors(p).some((n) => !visited.has(n.key()))
        );
        current = this._pick(restart);
        continue;
      }

      const next = this._pick(candidates);
      this.maze.connect(current, next);
      visited.add(next.key());
      visitedPoints.push(next);
      current = next;
    }

    return this.maze;
  }
}

module.exports = Wanderer;
