import * as THREE from "../node_modules/three/build/three.module.js";
import { Point } from "./Point.js";

export class ThreeMazeEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b1020);
        this.scene.fog = new THREE.Fog(0x0b1020, 12, 42);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
        this.camera.position.set(12, 14, 18);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        this.root = new THREE.Group();
        this.scene.add(this.root);

        const ambient = new THREE.AmbientLight(0xffffff, 1.25);
        const directional = new THREE.DirectionalLight(0x8fd3ff, 2.2);
        directional.position.set(6, 14, 8);
        this.scene.add(ambient);
        this.scene.add(directional);

        const floor = new THREE.GridHelper(40, 40, 0x5c7ea6, 0x1f3352);
        floor.position.y = -0.8;
        this.scene.add(floor);

        this.pathMaterial = new THREE.LineBasicMaterial({ color: 0xff6b6b });
        this.edgeMaterials = {
            door: new THREE.LineBasicMaterial({ color: 0x8fd3ff }),
            ladder: new THREE.LineBasicMaterial({ color: 0xffcc66 })
        };
        this.wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x7da0d8,
            transparent: false,
            opacity: 1,
            roughness: 0.22,
            metalness: 0.08
        });

        this._rotation = 0;
        this._maze = null;
        this._raf = null;

        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    setMaze(maze) {
        this._maze = maze;
        this._rebuildScene();
    }

    resize() {
        const { width, height } = this.canvas.getBoundingClientRect();
        const safeWidth = Math.max(width, 1);
        const safeHeight = Math.max(height, 1);

        this.renderer.setSize(safeWidth, safeHeight, false);
        this.camera.aspect = safeWidth / safeHeight;
        this.camera.updateProjectionMatrix();
    }

    start() {
        if (this._raf !== null) {
            return;
        }

        const tick = () => {
            this._raf = window.requestAnimationFrame(tick);
            this._rotation += 0.0045;
            this.root.rotation.y = this._rotation;
            this.renderer.render(this.scene, this.camera);
        };

        tick();
    }

    stop() {
        if (this._raf !== null) {
            window.cancelAnimationFrame(this._raf);
            this._raf = null;
        }
    }

    _rebuildScene() {
        while (this.root.children.length > 0) {
            this.root.remove(this.root.children[0]);
        }

        if (!this._maze) {
            return;
        }

        const maze = this._maze;
        const spacing = 1.6;
        const offsetX = (maze.width - 1) * spacing * 0.5;
        const offsetY = (maze.height - 1) * spacing * 0.5;
        const offsetZ = (maze.depth - 1) * spacing * 0.5;

        const pointToVector = (point) => new THREE.Vector3(
            point.x * spacing - offsetX,
            point.z * spacing - offsetZ,
            point.y * spacing - offsetY
        );

        const addLine = (start, end, material) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            this.root.add(new THREE.Line(geometry, material));
        };

        const wallThickness = 0.08;
        const wallSpan = spacing * 0.9;

        for (const wall of maze.walls.values()) {
            if (wall.open) {
                continue;
            }

            const from = pointToVector(wall.from);
            const to = pointToVector(wall.to);
            const midpoint = from.clone().add(to).multiplyScalar(0.5);

            const dx = Math.abs(wall.from.x - wall.to.x);
            const dy = Math.abs(wall.from.y - wall.to.y);
            const dz = Math.abs(wall.from.z - wall.to.z);

            let geometry;
            if (dx === 1) {
                geometry = new THREE.BoxGeometry(wallThickness, wallSpan, wallSpan);
            } else if (dy === 1) {
                geometry = new THREE.BoxGeometry(wallSpan, wallSpan, wallThickness);
            } else if (dz === 1) {
                geometry = new THREE.BoxGeometry(wallSpan, wallThickness, wallSpan);
            } else {
                continue;
            }

            const mesh = new THREE.Mesh(geometry, this.wallMaterial);
            mesh.position.copy(midpoint);
            this.root.add(mesh);
        }

        for (const [fromKey, neighbors] of maze.connections.entries()) {
            const from = maze.pointFromKey(fromKey);
            for (const [toKey, meta] of neighbors.entries()) {
                const to = maze.pointFromKey(toKey);
                if (fromKey > toKey) {
                    continue;
                }

                const material = meta.type === "ladder" ? this.edgeMaterials.ladder : this.edgeMaterials.door;
                addLine(pointToVector(from), pointToVector(to), material);
            }
        }

        const nodeGeometry = new THREE.SphereGeometry(0.13, 12, 12);
        const startMaterial = new THREE.MeshStandardMaterial({ color: 0x5df2b6 });
        const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
        const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0xe8eefc, roughness: 0.35, metalness: 0.1 });

        for (let z = 0; z < maze.depth; z += 1) {
            for (let y = 0; y < maze.height; y += 1) {
                for (let x = 0; x < maze.width; x += 1) {
                    const isStart = x === 0 && y === 0 && z === 0;
                    const isGoal = x === maze.width - 1 && y === maze.height - 1 && z === maze.depth - 1;
                    const mesh = new THREE.Mesh(
                        nodeGeometry,
                        isStart ? startMaterial : isGoal ? goalMaterial : nodeMaterial
                    );
                    mesh.position.copy(pointToVector(new Point(x, y, z)));
                    this.root.add(mesh);
                }
            }
        }
    }
}