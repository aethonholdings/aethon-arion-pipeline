import { DomainTypes } from "../constants/pipeline.constants";

export type ConfiguratorParamData = any;
export type OptimiserData = any;
export type OptimiserParameters = any;
export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type StateType = "running" | "pending" | "completed" | "failed";
export type RandomStreamType = "static" | "random";
export type DataPoint<T, U> = { id: string; data: Mapping<T, U>; status: StateType };
export type Mapping<T, U> = { inputs: T; outputs: U };
export type DomainType = "continuous" | "discrete" | "categorical" | "boolean";
export type ParameterSpace = { id: string; domain: Domain }[];
export type Domain =
    | {
          type: DomainTypes.CONTINUOUS | DomainTypes.DISCRETE;
          optimise: true;
          min: number;
          max: number;
          derivativeStepSize: number;
      }
    | {
          type: DomainTypes.CONTINUOUS | DomainTypes.DISCRETE;
          optimise: false;
          default: number;
      }
    | {
          type: DomainTypes.CATEGORICAL;
          optimise: true;
          categories: string[];
      }
    | {
          type: DomainTypes.CATEGORICAL;
          optimise: false;
          default: string;
          categories: string[];
      }
    | {
          type: DomainTypes.BOOLEAN;
          optimise: true;
      }
    | {
          type: DomainTypes.BOOLEAN;
          optimise: false;
          default: boolean;
      };
