import { ConfiguratorParamData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";

export abstract class Configurator<T extends ConfiguratorParamData, U extends OptimiserParameters> {
    name: string;
    protected _model: Model<T, U>;

    constructor(model: Model<T, U>, name: string) {
        this._model = model;
        this.name = name;
    }

    get model(): Model<T, U> {
        return this.model;
    }

    abstract generate(configuratorParamData: ConfiguratorParamsDTO<T>): OrgConfigDTO;
    abstract getDefaultParams(): ConfiguratorParamsDTO<T>;
}
