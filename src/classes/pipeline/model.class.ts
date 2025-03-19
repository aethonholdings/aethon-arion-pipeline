import { Logger, Organisation, RandomStreamFactory, Simulation, SimulationConfig, StepOutput } from "aethon-arion-core";
import {
    ResultDTO,
    SimConfigDTO,
    StateSpacePointDTO,
    ModelIndexDTO,
    ModelParamsDTO
} from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData, OptimiserData, OptimiserParameters } from "../../types/pipeline.types";
import { map, Observable, reduce } from "rxjs";
import { Configurator } from "./configurator.class";
import { KPIFactory } from "./kpi-factory.class";
import { Optimiser } from "./optimiser.class";

export abstract class Model<T extends ConfiguratorParamData, U extends OptimiserParameters, V extends OptimiserData> {
    protected _name: string;
    protected _index: ModelIndexDTO;
    protected _kpiFactories: KPIFactory<T, U, V>[];
    protected _configurators: Configurator<T, U, V>[];
    protected _optimisers: Optimiser<T, U, V>[];

    constructor(name: string, index: ModelIndexDTO) {
        this._name = name;
        this._index = index;
        this._configurators = [];
        this._kpiFactories = [];
        this._optimisers = [];
    }

    // Create and run a simulation with the given sim and org configurations,
    // and return the results over a pipe
    run$(
        simConfigDTO: SimConfigDTO,
        randomStreamFactory: RandomStreamFactory,
        logger: Logger,
        calculationNodeId: string,
        saveStateSpace: boolean = false
    ): Observable<ResultDTO> {
        const startTime = new Date();
        const simulation = this.createSimulation(simConfigDTO, logger, randomStreamFactory);
        let organisation: Organisation;
        let clockTick: number = 0;
        return simulation.run$().pipe(
            map((runOutput: StepOutput) => {
                organisation = runOutput.organisation;
                clockTick = runOutput.clockTick;
                return {
                    clockTick: runOutput.clockTick,
                    board: runOutput.organisation.getBoard().getPlan().reporting,
                    agentStates: runOutput.organisation.getAgents().getAgentStateArray(),
                    plant: runOutput.organisation.getPlant().getStateTensor(),
                    reporting: runOutput.organisation.getReporting().getReportingTensor(),
                    priorityTensor: runOutput.organisation.getAgents().getTensors().priorityTensor
                } as StateSpacePointDTO;
            }),
            reduce((stateSpace: StateSpacePointDTO[], stateSpacePoint: StateSpacePointDTO) => {
                if (saveStateSpace) stateSpace.push(JSON.parse(JSON.stringify(stateSpacePoint)));
                return stateSpace;
            }, [] as StateSpacePointDTO[]),
            map((results: StateSpacePointDTO[]) => {
                const endTime = new Date();
                const resultDTO = {
                    simConfigId: simConfigDTO.id,
                    runCount: simConfigDTO.runCount,
                    nodeId: calculationNodeId,
                    start: startTime,
                    end: endTime,
                    clockTick: clockTick,
                    durationSec: (endTime.getTime() - startTime.getTime()) / 1000,
                    agentStates: organisation.getAgents().getAgentStateArray(),
                    board: organisation.getBoard().getPlan().reporting,
                    plant: organisation.getPlant().getStateTensor(),
                    reporting: organisation.getReporting().getReportingTensor(),
                    priorityTensor: organisation.getAgents().getTensors().priorityTensor,
                    stateSpace: results
                } as ResultDTO;
                resultDTO.performance = this.getPerformance(resultDTO);
                return resultDTO;
            })
        );
    }

    // Create a simulation instance based on the sim and org configurations
    createSimulation(simConfigDTO: SimConfigDTO, logger: Logger, randomStreamFactory: RandomStreamFactory): Simulation {
        const simulationConfig = {
            days: simConfigDTO.days,
            debug: [],
            randomStreamType: simConfigDTO.randomStreamType,
            orgConfig: simConfigDTO.orgConfig
        } as SimulationConfig;
        if (simConfigDTO.orgConfig) {
            const simConfig = simConfigDTO as SimulationConfig;
            const organisation = this._instantiateModelOrgConfig(simConfig, randomStreamFactory, logger);
            return new Simulation(simulationConfig, logger, randomStreamFactory, organisation);
        } else {
            throw new Error(`No orgConfig found for simConfigDTO ${simConfigDTO.id}`);
        }
    }

    // return the model's index, enumerating the report field names and structure
    get index(): ModelIndexDTO {
        return this._index;
    }

    // return the model configurators
    get configurators(): Configurator<T, U, V>[] {
        return this._configurators;
    }

    // return the model optimisers
    get optimisers(): Optimiser<T, U, V>[] {
        return this._optimisers;
    }

    // return the KPI factories
    get kpiFactories(): KPIFactory<T, U, V>[] {
        return this._kpiFactories;
    }

    // Return the name of the model, which functions as its identifier
    get name(): string {
        return this._name;
    }

    // Get a configurator based on its name
    getConfigurator(name: string): Configurator<T, U, V> {
        const configurator = this._configurators.find((configurator) => configurator.name === name);
        if (!configurator) {
            throw new Error("Invalid model configurator name");
        }
        return configurator;
    }

    // get the default configurator
    getDefaultConfigurator(): Configurator<T, U, V> {
        if (this.configurators[0]) {
            return this.configurators[0];
        }
        throw new Error("No default configurator found");
    }

    // get the default optimiser
    getDefaultOptimiser(): Optimiser<T, U, V> {
        if (this._optimisers[0]) {
            return this._optimisers[0];
        }
        throw new Error("No default optimiser found");
    }

    // access a specific KPI factory
    getKPIFactory(name: string): KPIFactory<T, U, V> {
        const kpiFactory = this._kpiFactories.find((kpiFactory) => kpiFactory.name === name);
        if (!kpiFactory) {
            throw new Error(`KPI factory ${name} not found`);
        }
        return kpiFactory;
    }

    // Return the optimiser for gradient ascent and descent manipulation
    getOptimiser(name: string): Optimiser<T, U, V> {
        const optimiser = this._optimisers.find((optimiser) => optimiser.name === name);
        if (!optimiser) {
            throw new Error(`Optimiser ${name} not found`);
        }
        return optimiser;
    }

    // Return the parameters of the model
    getParameters(): ModelParamsDTO {
        return {
            name: this._name,
            configurators: {
                list: this._configurators.map((configurator) => configurator.name),
                default: this.getDefaultConfigurator().name
            },
            optimisers: {
                list: this._optimisers.map((optimiser) => {
                    return {
                        name: optimiser.name,
                        parameters: optimiser.parameters
                    };
                }),
                default: this.getDefaultOptimiser().name
            },
            kpiFactories: this._kpiFactories.map((kpiFactory) => kpiFactory.name)
        };
    }

    // Calculate the model's performance metric for a given result
    abstract getPerformance(resultDTO: ResultDTO): number | undefined;

    // Instantiate the model's organisation configuration based on the simulation configuration
    // abstract method to be implemented for each specific model type with the relevant classes
    protected abstract _instantiateModelOrgConfig(
        simConfig: SimulationConfig,
        randomStreamFactory: RandomStreamFactory,
        logger: Logger
    ): Organisation;
}
