import { KPIDTO, KPIs, ResultDTO } from "../../interfaces/dto.interfaces";
import { KPIFactory } from "../pipeline/kpi-factory.class";
import { Model } from "../pipeline/model.class";

export abstract class PlanVsActualsKPIFactory extends KPIFactory {
    constructor(name: string, model: Model) {
        super(name, model);
    }
    abstract generate(inputData: ResultDTO): KPIDTO<PlanVsActualsKPIs>;
}

export interface PlanVsActualsKPIs extends KPIs {
    proFormas: PlanVsActualsKPIsProForma[];
    priorityTensor: {
        actual: number[][][];
        plan: number[][][];
        delta: number[][][];
    };
}

export interface PlanVsActualsKPIsProForma {
    name: string;
    lineItems: PlanVsActualsKPIsProFormaRow[];
}

export type PlanVsActualsKPIsProFormaRow = {
    class: string | null;
    operator?: string | null;
    data?: PlanVsActualsKPIsProFormaVariable;
};

export type PlanVsActualsKPIsProFormaVariable = { name: string; actual: number; plan: number; delta?: number };
