export class Wall {
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.open = false;
    }

    openAs(type) {
        this.open = true;
        this.type = type;
    }
}
