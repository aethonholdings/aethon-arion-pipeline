import { ConfiguratorParamData } from "../../types/pipeline.types";
import { Model } from "./model.class";

export abstract class Optimiser<T extends ConfiguratorParamData> {
    protected _name: string;
    protected _model: Model<T>

    constructor(name: string, model: Model<T>) {
        this._name = name;
        this._model = model;
    }

    get name(): string {
        return this._name;
    }

    get model(): Model<T> {
        return this._model;
    }
}
