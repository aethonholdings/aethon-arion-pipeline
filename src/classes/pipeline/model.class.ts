import { Logger, Organisation, RandomStreamFactory, Simulation, SimulationConfig, StepOutput } from "aethon-arion-core";
import { ResultDTO, SimConfigDTO, StateSpacePointDTO } from "../../interfaces/dto.interfaces";
import { map, Observable, reduce } from "rxjs";
import { Configurator } from "./configurator.class";
import hash from "object-hash";

export abstract class Model {
    protected _name: string;
    protected _configurators: Configurator[] = [];

    constructor(name: string) {
        this._name = name;
        this.initialiseConfigurators();
    }

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

    createSimulation(simConfigDTO: SimConfigDTO, logger: Logger, randomStreamFactory: RandomStreamFactory): Simulation {
        const simulationConfig = {
            days: simConfigDTO.days,
            debug: [],
            randomStreamType: simConfigDTO.randomStreamType,
            orgConfig: simConfigDTO.orgConfig
        } as SimulationConfig;
        if (simConfigDTO.orgConfig) {
            const simConfig = simConfigDTO as SimulationConfig;
            const organisation = this.createNewOrganisationInstance(simConfig, randomStreamFactory, logger);
            return new Simulation(simulationConfig, logger, randomStreamFactory, organisation);
        } else {
            throw new Error(`No orgConfig found for simConfigDTO ${simConfigDTO.id}`);
        }
    }

    getName(): string {
        return this._name;
    }

    getConfigurators(): Configurator[] {
        return this._configurators;
    }

    hashObject(object: any): string {
        return hash(object);
    }

    abstract getPerformance(resultDTO: ResultDTO): number | undefined;

    protected abstract initialiseConfigurators(): void;

    protected abstract createNewOrganisationInstance(
        simConfig: SimulationConfig,
        randomStreamFactory: RandomStreamFactory,
        logger: Logger
    ): Organisation;
}
