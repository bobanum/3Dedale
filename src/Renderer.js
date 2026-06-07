import { Maze } from "./Maze.js";

export class Renderer {
    render(maze) {
        const out = [];
        const seen = new Set();
        for (let z = 0; z < maze.depth; z += 1) {
            out.push({ z, doors: [], ladders: [] });
        }

        for (const [fromKey, neighbors] of maze.connections.entries()) {
            const from = maze.pointFromKey(fromKey);
            for (const [toKey, meta] of neighbors.entries()) {
                const to = maze.pointFromKey(toKey);
                const id = Maze.edgeId(from, to);
                if (seen.has(id)) {
                    continue;
                }
                seen.add(id);
                const edge = {
                    from: { x: from.x, y: from.y, z: from.z },
                    to: { x: to.x, y: to.y, z: to.z }
                };
                if (meta.type === "ladder") {
                    out[Math.min(from.z, to.z)].ladders.push(edge);
                } else {
                    out[from.z].doors.push(edge);
                }
            }
        }

        return out;
    }
}
