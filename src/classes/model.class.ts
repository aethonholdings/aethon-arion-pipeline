import { Logger, Organisation, RandomStreamFactory, Simulation, SimulationConfig, StepOutput } from "aethon-arion-core";
import { Configurator } from "./configurator.class";
import {
    ConfiguratorParamsDTO,
    OrgConfigDTO,
    ResultDTO,
    SimConfigDTO,
    StateSpacePointDTO
} from "../interfaces/dto.interfaces";
import { map, Observable, reduce } from "rxjs";

export abstract class Model {
    protected name: string;
    protected abstract configurators: Configurator<Model>[];

    constructor(name: string) {
        this.name = name;
    }

    run$(
        simConfig: SimConfigDTO,
        randomStreamFactory: RandomStreamFactory,
        logger: Logger,
        calculationNodeId: string,
        saveStateSpace: boolean = false
    ): Observable<ResultDTO> {
        const startTime = new Date();
        const simulation = this.getNewSimulation(simConfig, logger, randomStreamFactory);
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
                    simConfigId: simConfig.id,
                    runCount: simConfig.runCount,
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

    getNewSimulation(simConfigDTO: SimConfigDTO, logger: Logger, randomStreamFactory: RandomStreamFactory): Simulation {
        const simulationConfig = {
            days: simConfigDTO.days,
            debug: [],
            randomStreamType: simConfigDTO.randomStreamType,
            orgConfig: simConfigDTO.orgConfig
        } as SimulationConfig;
        return new Simulation(
            simulationConfig,
            logger,
            randomStreamFactory,
            this.getNewOrganisation(simConfigDTO, randomStreamFactory, logger)
        );
    }

    generateOrgConfigDTO(configuratorParamsDTO: ConfiguratorParamsDTO): OrgConfigDTO {
        let configurator: Configurator<Model> | undefined = this.configurators.find(
            (configurator: Configurator<Model>) => {
                return configurator.name === configuratorParamsDTO.configuratorName;
            }
        );
        if (configurator) return configurator.generate(configuratorParamsDTO);
        throw new Error(`Configurator ${configuratorParamsDTO.configuratorName} not found for model ${this.name}`);
    }

    getName(): string {
        return this.name;
    }

    abstract getPerformance(resultDTO: ResultDTO): number | undefined;

    protected abstract getNewOrganisation(
        simConfigDTO: SimConfigDTO,
        randomStreamFactory: RandomStreamFactory,
        logger: Logger
    ): Organisation;
}
