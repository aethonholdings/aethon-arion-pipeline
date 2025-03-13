import { Logger, Organisation, RandomStreamFactory, Simulation, SimulationConfig, StepOutput } from "aethon-arion-core";
import {
    ResultDTO,
    SimConfigDTO,
    StateSpacePointDTO,
    ConfiguratorParamsDTO,
    OrgConfigDTO,
    ModelIndexDTO
} from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData } from "../../types/pipeline.types";
import { map, Observable, reduce } from "rxjs";
import { Configurator } from "./configurator.class";
import { KPIFactory } from "./kpi-factory.class";

export abstract class Model {
    protected _name: string;
    protected _index: ModelIndexDTO;
    protected _configurators: Configurator[] = [];
    protected _kpiFactories: KPIFactory[] = [];

    constructor(name: string, index: ModelIndexDTO) {
        this._name = name;
        this._index = index;
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

    // Create an organisation instance DTO based on the model type and configurator
    createOrganisation(configuratorParamsDTO: ConfiguratorParamsDTO<ConfiguratorParamData>): OrgConfigDTO {
        if (configuratorParamsDTO.modelName !== this._name) {
            throw new Error("Invalid model");
        }
        const configurator = this._configurators.find(
            (configurator) => configurator.name === configuratorParamsDTO.configuratorName
        );
        if (!configurator) {
            throw new Error("Invalid model configurator name");
        }
        return configurator.generate(configuratorParamsDTO);
    }

    // access a specific KPI factory
    getKPIFactory(name: string): KPIFactory {
        const kpiFactory = this._kpiFactories.find((kpiFactory) => kpiFactory.name === name);
        if (!kpiFactory) {
            throw new Error(`KPI factory ${name} not found`);
        }
        return kpiFactory;
    }

    // Calculate the model's performance metric for a given result
    abstract getPerformance(resultDTO: ResultDTO): number | undefined;

    // return the model's index, enumerating the report field names and structure
    get index(): ModelIndexDTO {
        return this._index;
    }

    // return the model configurators
    get configurators(): Configurator[] {
        return this._configurators;
    }

    get kpiFactories(): KPIFactory[] {
        return this._kpiFactories;
    }

    // Return the name of the model, which functions as its identifier
    get name(): string {
        return this._name;
    }

    // Instantiate the model's organisation configuration based on the simulation configuration
    // abstract method to be implemented for each specific model type with the relevant classes
    protected abstract _instantiateModelOrgConfig(
        simConfig: SimulationConfig,
        randomStreamFactory: RandomStreamFactory,
        logger: Logger
    ): Organisation;
}
