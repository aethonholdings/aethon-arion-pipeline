import { Logger } from "aethon-arion-core";
import { Configurator } from "./configurator.class";
import { SimulationFactory } from "./simulation-factory.class";

export abstract class Model extends String {
    protected name: string;
    protected abstract simulationFactory: SimulationFactory<Model>;
    protected abstract configurators: Configurator<Model>[];

    constructor(name: string) {
        super(name);
        this.name = name;
    }

    abstract calculatePerformance(data: any): number | undefined;

    getSimulationFactory(): SimulationFactory<Model> {
        return this.simulationFactory;
    }

    getConfigurators(): Configurator<Model>[] {
        return this.configurators;
    }

    getName(): string {
        return this.name;
    }
}
