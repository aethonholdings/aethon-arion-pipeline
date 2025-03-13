import { GradientAscentOptimiserName } from "../../constants/pipeline.constants";
import { GradientAscentDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData } from "../../types/pipeline.types";
import { Optimiser } from "../pipeline/optimiser.class";

export class GradientAscentOptimiser extends Optimiser<ConfiguratorParamData, GradientAscentDTO> {
    constructor() {
        // learningRate: 0.01, maxIterations: 1000, tolerance: 0.0001
        super(GradientAscentOptimiserName);
    }

    next(configuratorParamData: any): GradientAscentDTO {
        return {} as GradientAscentDTO;
    }

    testConvergence(optimiserData: GradientAscentDTO[]): boolean {
        return false;
    }
}
