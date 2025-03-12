import { ResultDTO, StateSpacePointDTO } from "../../interfaces/dto.interfaces";
import { Model } from "./model.class";

export abstract class Report {
    protected _name: string;
    protected _model: Model;

    constructor(name: string, model: Model) {
        this._name = name;
        this._model = model;
    }

    protected abstract _generate<T extends ResultDTO | ResultDTO[] | StateSpacePointDTO | StateSpacePointDTO[], U>(
        inputData: T
    ): U;

    getName(): string {
        return this._name;
    }

    getModel(): Model {
        return this._model;
    }
}
