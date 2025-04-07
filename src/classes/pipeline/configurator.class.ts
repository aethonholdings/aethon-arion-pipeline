import { ConfiguratorParamData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";

export abstract class Configurator<T extends ConfiguratorParamData> {
    name: string;
    protected _model: Model;

    constructor(model: Model, name: string) {
        this._model = model;
        this.name = name;
    }

    get model(): Model {
        return this.model;
    }

    abstract generate(configuratorParamData: ConfiguratorParamsDTO<T>): OrgConfigDTO;
    abstract getDefaultParams(): ConfiguratorParamsDTO<T>;
}
