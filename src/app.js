import { Point } from "./Point.js";
import { Maze } from "./Maze.js";
import { Wanderer } from "./Wanderer.js";
import { AStarSolver } from "./AStarSolver.js";
import { Renderer } from "./Renderer.js";
import { ThreeMazeEngine } from "./ThreeMazeEngine.js";

const mazeForm = document.getElementById("mazeForm");
const summary = document.getElementById("summary");
const summaryList = document.getElementById("summaryList");
const output = document.getElementById("output");
const mazeCanvas = document.getElementById("mazeCanvas");

const engine = new ThreeMazeEngine(mazeCanvas);
engine.start();

mazeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const width = Number.parseInt(document.getElementById("width").value, 10);
    const height = Number.parseInt(document.getElementById("height").value, 10);
    const depth = Number.parseInt(document.getElementById("depth").value, 10);

    const maze = new Maze(width, height, depth);
    const generatedMaze = new Wanderer(maze).generate();
    const goal = new Point(width - 1, height - 1, depth - 1);
    const path = new AStarSolver(generatedMaze).solve(new Point(0, 0, 0), goal);
    const rendered = new Renderer().render(generatedMaze);
    const mazeJson = generatedMaze.toJSON();

    summary.style.display = "block";
    output.style.display = "block";
    summaryList.replaceChildren(...[
        `Dimensions: ${width} × ${height} × ${depth}`,
        `Cells: ${width * height * depth}`,
        `Connections: ${generatedMaze.edgeCount()}`,
        `Solved path length: ${path ? path.length : 0}`,
        `Rendered floors: ${rendered.length}`
    ].map((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        return listItem;
    }));

    output.textContent = JSON.stringify({
        dimensions: mazeJson.dimensions,
        path: path ? path.map((point) => ({ x: point.x, y: point.y, z: point.z })) : [],
        rendered
    }, null, 2);

    engine.setMaze(generatedMaze, path || []);
});