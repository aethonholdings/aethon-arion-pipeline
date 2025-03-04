// plan vs actuals report
export interface PlanVsActualsReportDTO {
    name: string;
    lineItems: PlanVsActualsReportLineItemDTO[];
}

export interface PlanVsActualsReportRowDTO extends PlanVsActualsReportLineItemDTO {
    values: VariableDTO;
}

export interface PlanVsActualsReportLineItemDTO {
    name: VariableName;
    class: string;
    operator: Operator;
}

export interface VariableDTO {
    actual: number;
    plan: number;
}

export type Operator = string | null;
export type VariableName = string;

// TBD
export interface ResultReportDTO {
    targetPriorityTensor: number[][][];
    deltaTensor: number[][][];
}

// Report generic
export interface ModelIndexDTO {
    reporting?: {
        variableNames: string[];
        arrayIndex: { [key: string]: number };
    };
    plant?: {
        variableNames: string[];
        arrayIndex: { [key: string]: number };
    };
    agentSet?: {
        states: {
            variableNames: string[];
            arrayIndex: { [key: string]: number };
        };
    };
    board?: {
        variableNames: string[];
        arrayIndex: { [key: string]: number };
    };
}
