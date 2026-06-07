export class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    key() {
        return `${this.x},${this.y},${this.z}`;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }
    toString() {
        return `(${this.x},${this.y},${this.z})`;
    }
}
