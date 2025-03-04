import {
    ModelIndexDTO,
    PlanVsActualsReportDTO,
    PlanVsActualsReportLineItemDTO,
    VariableDTO
} from "../../../interfaces/report.interfaces";
import { Report } from "../report.class";

export abstract class PlanVsActualsReport<T extends ModelIndexDTO> extends Report implements PlanVsActualsReportDTO {
    index: T;
    variables: { [key: string]: VariableDTO };
    lineItems: PlanVsActualsReportLineItemDTO[] = [];

    constructor(name: string, variables: { [key: string]: VariableDTO }, index: T) {
        super(name);
        this.variables = variables;
        this.index = index;
    }

    abstract generate<T>(data: T): any;
}
