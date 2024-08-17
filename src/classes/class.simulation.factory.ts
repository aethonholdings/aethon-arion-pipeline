import { Logger, RandomStreamFactory, Simulation, SimulationConfig } from "@arion/core";

export abstract class SimulationFactory {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract newSimulation(
        config: SimulationConfig,
        logger: Logger,
        randomStreamFactory: RandomStreamFactory
    ): Simulation;

    getName(): string {
        return this.name;
    }
}
