import { ResultDTO } from "../../interfaces/dto.interfaces";
import { Model } from "./model.class";
import { StateSpacePoint } from "../analysis/state-space-point.class";
import { ConfiguratorParamData } from "../../types/pipeline.types";

export abstract class Presentation<T extends ConfiguratorParamData> {
    name: string;
    protected _model: Model<T>;

    constructor(model: Model<T>, name: string) {
        this.name = name;
        this._model = model;
    }

    getName(): string {
        return this.name;
    }

    abstract generate(
        data: ResultDTO<T> | ResultDTO<T>[] | StateSpacePoint<T> | StateSpacePoint<T>[]
    ): any;
}


