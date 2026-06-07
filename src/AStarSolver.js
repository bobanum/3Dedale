class AStarSolver {
  constructor(maze) {
    this.maze = maze;
  }

  static heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
  }

  solve(start, goal) {
    const open = [{ point: start, f: AStarSolver.heuristic(start, goal) }];
    const cameFrom = new Map();
    const gScore = new Map([[start.key(), 0]]);
    const closed = new Set();

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift().point;

      if (current.equals(goal)) {
        return this._buildPath(cameFrom, current);
      }

      if (closed.has(current.key())) {
        continue;
      }
      closed.add(current.key());

      for (const neighbor of this.maze.getConnectedNeighbors(current)) {
        const tentative = gScore.get(current.key()) + 1;
        const known = gScore.get(neighbor.key());
        if (known === undefined || tentative < known) {
          cameFrom.set(neighbor.key(), current.key());
          gScore.set(neighbor.key(), tentative);
          open.push({
            point: neighbor,
            f: tentative + AStarSolver.heuristic(neighbor, goal)
          });
        }
      }
    }

    return null;
  }

  _buildPath(cameFrom, current) {
    const keys = [current.key()];
    while (cameFrom.has(keys[0])) {
      keys.unshift(cameFrom.get(keys[0]));
    }
    return keys.map((key) => this.maze.pointFromKey(key));
  }
}

module.exports = AStarSolver;
