import { SimulationFactory } from "./simulation-factory.class";

export abstract class Model extends String {
    id: string;
    url?: string;
    abstract simulationFactory: SimulationFactory;

    constructor(id: string, url?: string) {
        super(id);
        this.id = id;
        this.url = url;
    }
}
