export abstract class Report {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract generate<T>(data: T): any;
}
