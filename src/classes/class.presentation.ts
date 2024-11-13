import { ReportDTO, ResultDTO, VariableDTO } from "../interfaces/pipeline.interfaces.dto";

export class Presentation<T> {
    protected resultDTO: ResultDTO<T>;
    variables: Map<string, VariableDTO> = new Map();
    reports: ReportDTO[] = [];
    reportingVariableArray: string[] = [];
    plantStateVariableArray: string[] = [];
    agentCount: number = 0;
    priorityTensor: number[][][] = [];
    targetPriorityTensor: number[][][] = [];
    deltaTensor: number[][][] = [];

    constructor(resultDTO: ResultDTO<T>) {
        this.resultDTO = resultDTO;
    }

    toJSON(): any {
        return JSON.parse(JSON.stringify(this));
    }
}
