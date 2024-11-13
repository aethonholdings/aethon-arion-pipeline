import { Logger, RandomStreamFactory, Simulation, SimulationConfig } from "aethon-arion-core";
import { Model } from "./model.class";

export abstract class SimulationFactory<T extends Model> {
    protected _model: T;

    constructor(model: T) {
        this._model = model;
    }

    abstract newSimulation(
        config: SimulationConfig,
        logger: Logger,
        randomStreamFactory: RandomStreamFactory
    ): Simulation;

    get model(): T {
        return this._model;
    }
}
