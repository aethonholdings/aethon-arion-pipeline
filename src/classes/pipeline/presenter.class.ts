import { ResultDTO } from "../../interfaces/dto.interfaces";
import { Model } from "./model.class";
import { StateSpacePoint } from "../analysis/state-space-point.class";
import { Report } from "../analysis/report.class";

export abstract class Presenter {
    name: string;
    protected _model: Model;
    protected _reports: Report[];

    constructor(model: Model, reports: Report[], name: string) {
        this.name = name;
        this._model = model;
        this._reports = reports;
    }

    getName(): string {
        return this.name;
    }

    abstract generate(data: ResultDTO | ResultDTO[] | StateSpacePoint | StateSpacePoint[]): any;
}
