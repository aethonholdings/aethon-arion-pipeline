// report DTOs
export interface VariableDTO {
    name: string;
    reporting: number;
    plan: number;
}

export interface ReportLineItemDTO {
    class: string;
    operator: string;
    values: VariableDTO;
}

export interface ReportDTO {
    name: string;
    lineItems: ReportLineItemDTO[];
}
