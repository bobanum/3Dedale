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

		this.pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.1 });
		this.edgeMaterials = {
			door: new THREE.LineBasicMaterial({ color: 0x8fd3ff }),
			ladder: new THREE.LineBasicMaterial({ color: 0xffcc66 })
		};
		this.ladderRailMaterial = new THREE.MeshStandardMaterial({
			color: 0xffcc66,
			roughness: 0.25,
			metalness: 0.55
		});
		this.ladderRungMaterial = new THREE.MeshStandardMaterial({
			color: 0xffe19e,
			roughness: 0.3,
			metalness: 0.42
		});
		this.holeMaterial = new THREE.MeshStandardMaterial({
			color: 0x0a111f,
			roughness: 0.9,
			metalness: 0.05,
			side: THREE.DoubleSide
		});
		this.holeRimMaterial = new THREE.MeshStandardMaterial({
			color: 0x6da4ff,
			emissive: 0x102340,
			roughness: 0.35,
			metalness: 0.35
		});
		this.wallMaterial = new THREE.MeshStandardMaterial({
			color: 0x7da0d8,
			transparent: false,
			opacity: 1,
			roughness: 0.22,
			metalness: 0.08
		});
		// this.floorMaterial = new THREE.MeshStandardMaterial({
		// 	color: 0x243850,
		// 	roughness: 0.72,
		// 	metalness: 0.914,
		// 	side: THREE.DoubleSide
		// });
		this.floorMaterial = this.getFloorMaterial();

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
	extrude(scene) {
		const length = 2, width = 6;
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(0, width);
		shape.lineTo(length, width);
		shape.lineTo(length, 0);
		shape.lineTo(0, 0);
		const geometry = new THREE.ExtrudeGeometry(shape);
		const material = new THREE.MeshBasicMaterial({ color: 0x005500 });
		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);
	}
	getFloorMaterial() {
		// 1. Initialisation du chargeur de texture
		const textureLoader = new THREE.TextureLoader();

		// 2. Chargement des 4 cartes de texture
		const dungeonDiffuse = textureLoader.load('img/dungeon_diffuse.webp');
		const dungeonRoughness = textureLoader.load('img/dungeon_roughness.webp');
		const dungeonNormal = textureLoader.load('img/dungeon_normal.webp');
		const dungeonBump = textureLoader.load('img/dungeon_bump.webp');

		// 3. Configuration du Tiling (Répétition seamless)
		// On regroupe les textures dans un tableau pour appliquer les paramètres à toutes d'un coup
		const toutesLesTextures = [dungeonDiffuse, dungeonRoughness, dungeonNormal, dungeonBump];

		toutesLesTextures.forEach(texture => {
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;

			// Ajustez ces valeurs (X, Y) selon la taille de votre pièce pour éviter l'effet étiré
			texture.repeat.set(1, 1);
		});

		// 4. Création du matériau PBR
		const materiauDonjon = new THREE.MeshStandardMaterial({
			map: dungeonDiffuse,             // Couleur de base
			roughnessMap: dungeonRoughness,   // Zones mates (joints) vs zones légèrement luisantes (pierre)
			normalMap: dungeonNormal,         // Direction de la lumière sur les micro-reliefs
			normalScale: new THREE.Vector2(1.5, 1.5), // Intensité du normal map (à ajuster au besoin)
			bumpMap: dungeonBump,             // Profondeur globale des dalles
			bumpScale: 0.05,                  // Hauteur du relief (5cm environ)
			side: THREE.DoubleSide
		});

		return materiauDonjon;
	}
	testTexture(scene) {

		// 5. Application sur le Mesh du sol
		const geometrieSol = new THREE.PlaneGeometry(20, 20); // Sol de 20x20 unités
		const solMesh = new THREE.Mesh(geometrieSol, this.getFloorMaterial());

		// On couche le plan à l'horizontale
		solMesh.rotation.x = -Math.PI / 2;
		solMesh.position.y = 0;

		scene.add(solMesh);
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

		const addLadder = (fromVec, toVec) => {
			const low = fromVec.y <= toVec.y ? fromVec : toVec;
			const high = fromVec.y <= toVec.y ? toVec : fromVec;
			const ladderHeight = Math.max(high.y - low.y, 0.001);

			const railOffset = 0.16;
			const railRadius = 0.035;
			const rungRadius = 0.024;
			const rungWidth = railOffset * 2;

			const makeRail = (offset) => {
				const railGeometry = new THREE.CylinderGeometry(railRadius, railRadius, ladderHeight, 10);
				const rail = new THREE.Mesh(railGeometry, this.ladderRailMaterial);
				rail.position.set(low.x + offset, low.y + ladderHeight * 0.5, low.z);
				this.root.add(rail);
			};

			makeRail(-railOffset);
			makeRail(railOffset);

			const rungCount = Math.max(2, Math.floor(ladderHeight / 0.28));
			for (let i = 0; i <= rungCount; i += 1) {
				const t = i / rungCount;
				const y = low.y + t * ladderHeight;
				const rungGeometry = new THREE.CylinderGeometry(rungRadius, rungRadius, rungWidth, 8);
				const rung = new THREE.Mesh(rungGeometry, this.ladderRungMaterial);
				rung.rotation.z = Math.PI * 0.5;
				rung.position.set(low.x, y, low.z);
				this.root.add(rung);
			}
		};

		const holesByBoundary = new Map();
		for (const [fromKey, neighbors] of maze.connections.entries()) {
			const from = maze.pointFromKey(fromKey);
			for (const [toKey, meta] of neighbors.entries()) {
				if (meta.type !== "ladder" || fromKey > toKey) {
					continue;
				}

				const to = maze.pointFromKey(toKey);
				const lowerZ = Math.min(from.z, to.z);
				if (!holesByBoundary.has(lowerZ)) {
					holesByBoundary.set(lowerZ, new Set());
				}

				const key = `${from.x},${from.y}`;
				const altKey = `${to.x},${to.y}`;
				holesByBoundary.get(lowerZ).add(from.z <= to.z ? key : altKey);
			}
		}

		if (maze.depth > 1) {
			const slabHalfWidth = maze.width * spacing * 0.5;
			const slabHalfDepth = maze.height * spacing * 0.5;
			const holeRadius = Math.max(0.15, spacing * 0.24);

			for (let z = 0; z < maze.depth - 1; z += 1) {
				const shape = new THREE.Shape();
				shape.moveTo(-slabHalfWidth, -slabHalfDepth);
				shape.lineTo(slabHalfWidth, -slabHalfDepth);
				shape.lineTo(slabHalfWidth, slabHalfDepth);
				shape.lineTo(-slabHalfWidth, slabHalfDepth);
				shape.lineTo(-slabHalfWidth, -slabHalfDepth);

				const ladderHoles = holesByBoundary.get(z) || new Set();
				for (const key of ladderHoles) {
					const [x, y] = key.split(",").map(Number);
					const p = pointToVector(new Point(x, y, z));
					const hole = new THREE.Path();
					hole.absellipse(p.x, p.z, holeRadius, holeRadius, 0, Math.PI * 2, false, 0);
					shape.holes.push(hole);

					const rimGeometry = new THREE.TorusGeometry(holeRadius + 0.06, 0.02, 10, 22);
					const rim = new THREE.Mesh(rimGeometry, this.holeRimMaterial);
					rim.rotation.x = Math.PI * 0.5;
					rim.position.set(p.x, (z + 0.5) * spacing - offsetZ + 0.01, p.z);
					this.root.add(rim);
				}

				const slabGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
				const slab = new THREE.Mesh(slabGeometry, this.floorMaterial);
				slab.rotation.x = Math.PI * 0.5;
				slab.position.y = (z + 0.5) * spacing - offsetZ;
				this.root.add(slab);
			}
		}
		// this.testTexture(this.scene);

		const wallThickness = 0.2;
		const wallSpan = spacing * 1.1;

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

			if (dz === 1) {
				continue;
			}

			let geometry;
			if (dx === 1) {
				geometry = new THREE.BoxGeometry(wallThickness, wallSpan, wallSpan);
			} else if (dy === 1) {
				geometry = new THREE.BoxGeometry(wallSpan, wallSpan, wallThickness);
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

				const fromVec = pointToVector(from);
				const toVec = pointToVector(to);

				if (meta.type === "ladder") {
					addLadder(fromVec, toVec);
					continue;
				}

				addLine(fromVec, toVec, this.edgeMaterials.door);
			}
		}

		const nodeGeometry = new THREE.SphereGeometry(0.13, 12, 12);
		const startMaterial = new THREE.MeshStandardMaterial({
			color: 0x5df2b6,
			transparent: true,
			opacity: 0.58
		});
		const goalMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6b6b,
			transparent: true,
			opacity: 0.58
		});
		const nodeMaterial = new THREE.MeshStandardMaterial({
			color: 0xe8eefc,
			roughness: 0.35,
			metalness: 0.1,
			transparent: true,
			opacity: 0.1
		});

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