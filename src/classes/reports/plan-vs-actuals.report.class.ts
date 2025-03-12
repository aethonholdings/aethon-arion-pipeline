import { ModelIndexDTO } from "../../interfaces/dto.interfaces";
import {
    PlanVsActualsReportDTO,
    PlanVsActualsReportLineItemDTO,
    VariableDTO
} from "../../interfaces/report.interfaces";
import { Model } from "../pipeline/model.class";
import { Report } from "../pipeline/report.class";

export abstract class PlanVsActualsReport extends Report implements PlanVsActualsReportDTO {
    index: ModelIndexDTO;
    variables: { [key: string]: VariableDTO };
    lineItems: PlanVsActualsReportLineItemDTO[] = [];

    constructor(name: string, model: Model, variables: { [key: string]: VariableDTO }) {
        super(name, model);
        this.variables = variables;
        this.index = this._model.getIndex();
    }
}

