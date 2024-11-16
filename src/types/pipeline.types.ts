export type ConfiguratorParamData = any;
export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type StateType = "running" | "pending" | "completed" | "failed";
export type RandomStreamType = "static" | "random";
export type ConstantsEnum<T> = { [key: string]: T };
