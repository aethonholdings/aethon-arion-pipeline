import { KPIDTO, ResultDTO, StateSpacePointDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData, OptimiserData } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OptimiserParameters } from "../../types/pipeline.types";

export abstract class KPIFactory<T extends ConfiguratorParamData> {
    protected _name: string;
    protected _model: Model;

    constructor(name: string, model: Model) {
        this._name = name;
        this._model = model;
    }

    abstract generate(inputData: ResultDTO | ResultDTO[] | StateSpacePointDTO | StateSpacePointDTO[]): KPIDTO<any>;

    protected _package<T>(data: T): KPIDTO<T> {
        return {
            name: this._name,
            modelName: this._model.name,
            timestamp: new Date(),
            data: data
        };
    }

    get name(): string {
        return this._name;
    }

    get model(): Model {
        return this._model;
    }
}
