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
import { ObjectHash } from "./object-hash.class";

export abstract class Model {
    protected _name: string;
    protected _index: ModelIndexDTO;
    protected _kpiFactories: KPIFactory<ConfiguratorParamData>[];
    protected _configurators: Configurator<ConfiguratorParamData>[];
    protected _optimisers: Optimiser<ConfiguratorParamData, OptimiserParameters, OptimiserData>[];

    protected _version: string;

    /**
     * @param version - version of the model implementation. Bump it whenever a change alters simulation outputs,
     * so that results produced by different implementations are never pooled (it is part of the configurator
     * params hash, see {@link Model.hashConfiguratorParams}).
     */
    constructor(name: string, index: ModelIndexDTO, version: string = "1") {
        this._name = name;
        this._version = version;
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
        // read the final state from the organisation itself rather than from the last emitted step, so that the
        // result is well defined independently of the step stream
        const organisation: Organisation = simulation.getOrganisation();
        let clockTicks: number = 0;
        const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
        return simulation.run$().pipe(
            map((runOutput: StepOutput) => {
                clockTicks = runOutput.clockTick + 1;
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
                if (saveStateSpace) stateSpace.push(copy(stateSpacePoint));
                return stateSpace;
            }, [] as StateSpacePointDTO[]),
            map((results: StateSpacePointDTO[]) => {
                const endTime = new Date();
                // copies: the organisation's tensors are live simulation state and must not leak into the DTO
                const resultDTO = {
                    simConfigId: simConfigDTO.id,
                    runId: simConfigDTO.runId,
                    runCount: simConfigDTO.runCount,
                    nodeId: calculationNodeId,
                    start: startTime,
                    end: endTime,
                    clockTick: clockTicks,
                    durationSec: (endTime.getTime() - startTime.getTime()) / 1000,
                    agentStates: copy(organisation.getAgents().getAgentStateArray()),
                    board: copy(organisation.getBoard().getPlan().reporting),
                    plant: copy(organisation.getPlant().getStateTensor()),
                    reporting: copy(organisation.getReporting().getReportingTensor()),
                    priorityTensor: copy(organisation.getAgents().getTensors().priorityTensor),
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
    get configurators(): Configurator<ConfiguratorParamData>[] {
        return this._configurators;
    }

    // return the model optimisers
    get optimisers(): Optimiser<ConfiguratorParamData, OptimiserParameters, OptimiserData>[] {
        return this._optimisers;
    }

    // return the KPI factories
    get kpiFactories(): KPIFactory<ConfiguratorParamData>[] {
        return this._kpiFactories;
    }

    // Return the name of the model, which functions as its identifier
    get version(): string {
        return this._version;
    }

    /**
     * Canonical hash identifying a set of configurator parameters for this model and model version.
     */
    hashConfiguratorParams(configuratorName: string, data: ConfiguratorParamData): string {
        return new ObjectHash({
            modelName: this._name,
            modelVersion: this._version,
            configuratorName: configuratorName,
            data: data
        }).toString();
    }

    get name(): string {
        return this._name;
    }

    // Get a configurator based on its name
    getConfigurator(name: string): Configurator<ConfiguratorParamData> {
        const configurator = this._configurators.find((configurator) => configurator.name === name);
        if (!configurator) {
            throw new Error("Invalid model configurator name");
        }
        return configurator;
    }

    // get the default configurator
    getDefaultConfigurator(): Configurator<ConfiguratorParamData> {
        if (this.configurators[0]) {
            return this.configurators[0];
        }
        throw new Error("No default configurator found");
    }

    // get the default optimiser
    getDefaultOptimiser(): Optimiser<ConfiguratorParamData, OptimiserParameters, OptimiserData> {
        if (this._optimisers[0]) {
            return this._optimisers[0];
        }
        throw new Error("No default optimiser found");
    }

    // access a specific KPI factory
    getKPIFactory(name: string): KPIFactory<ConfiguratorParamData> {
        const kpiFactory = this._kpiFactories.find((kpiFactory) => kpiFactory.name === name);
        if (!kpiFactory) {
            throw new Error(`KPI factory ${name} not found`);
        }
        return kpiFactory;
    }

    // Return the optimiser for gradient ascent and descent manipulation
    getOptimiser(name: string): Optimiser<ConfiguratorParamData, OptimiserParameters, OptimiserData> {
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
            version: this._version,
            configurators: {
                list: this._configurators.map((configurator) => configurator.name),
                default: this.getDefaultConfigurator().name
            },
            optimisers: {
                list: this._optimisers.map((optimiser) => optimiser.name),
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
