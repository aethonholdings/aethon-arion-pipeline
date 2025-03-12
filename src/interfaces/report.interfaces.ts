// plan vs actuals report
export interface PlanVsActualsReportDTO {
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

