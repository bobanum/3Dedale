const Point = require("./Point");
const Wall = require("./Wall");

class Maze {
  constructor(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.connections = new Map();
    this.walls = new Map();
    this._initWalls();
  }

  _initWalls() {
    for (let z = 0; z < this.depth; z += 1) {
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          const point = new Point(x, y, z);
          for (const neighbor of this.getNeighbors(point)) {
            const id = Maze.edgeId(point, neighbor);
            if (!this.walls.has(id)) {
              this.walls.set(id, new Wall(point, neighbor));
            }
          }
        }
      }
    }
  }

  static edgeId(a, b) {
    const ka = a.key();
    const kb = b.key();
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  }

  pointFromKey(key) {
    const [x, y, z] = key.split(",").map(Number);
    return new Point(x, y, z);
  }

  isInside(point) {
    return (
      point.x >= 0 &&
      point.x < this.width &&
      point.y >= 0 &&
      point.y < this.height &&
      point.z >= 0 &&
      point.z < this.depth
    );
  }

  getNeighbors(point) {
    const deltas = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1]
    ];
    const neighbors = [];
    for (const [dx, dy, dz] of deltas) {
      const next = new Point(point.x + dx, point.y + dy, point.z + dz);
      if (this.isInside(next)) {
        neighbors.push(next);
      }
    }
    return neighbors;
  }

  connect(a, b) {
    const type = a.z !== b.z ? "ladder" : "door";
    this._addConnection(a, b, type);
    this._addConnection(b, a, type);
    const wall = this.walls.get(Maze.edgeId(a, b));
    if (wall) {
      wall.openAs(type);
    }
  }

  _addConnection(from, to, type) {
    const fromKey = from.key();
    if (!this.connections.has(fromKey)) {
      this.connections.set(fromKey, new Map());
    }
    this.connections.get(fromKey).set(to.key(), { type });
  }

  getConnectionType(from, to) {
    const neighbors = this.connections.get(from.key());
    if (!neighbors || !neighbors.has(to.key())) {
      return null;
    }
    return neighbors.get(to.key()).type;
  }

  getConnectedNeighbors(point) {
    const result = [];
    const neighbors = this.connections.get(point.key());
    if (!neighbors) {
      return result;
    }
    for (const key of neighbors.keys()) {
      result.push(this.pointFromKey(key));
    }
    return result;
  }

  edgeCount() {
    const ids = new Set();
    for (const [fromKey, neighbors] of this.connections.entries()) {
      const from = this.pointFromKey(fromKey);
      for (const toKey of neighbors.keys()) {
        ids.add(Maze.edgeId(from, this.pointFromKey(toKey)));
      }
    }
    return ids.size;
  }

  toJSON() {
    const edges = [];
    const added = new Set();
    for (const [fromKey, neighbors] of this.connections.entries()) {
      const from = this.pointFromKey(fromKey);
      for (const [toKey, meta] of neighbors.entries()) {
        const to = this.pointFromKey(toKey);
        const id = Maze.edgeId(from, to);
        if (added.has(id)) {
          continue;
        }
        added.add(id);
        edges.push({
          from: { x: from.x, y: from.y, z: from.z },
          to: { x: to.x, y: to.y, z: to.z },
          type: meta.type
        });
      }
    }

    return {
      dimensions: {
        width: this.width,
        height: this.height,
        depth: this.depth
      },
      edges
    };
  }

  toJSONString(indent = 2) {
    return JSON.stringify(this.toJSON(), null, indent);
  }
}

module.exports = Maze;
