import { HttpMethod } from "../types/pipeline.types";

export interface Environment {
    hostname: string;
    path?: string;
    port?: number;
  }
  
  export interface Endpoint {
    path: string;
    method: HttpMethod;
    options: EndpointOptions | null;
  }
  
  export interface EndpointOptions {
    id?: number | string;
    params?: any;
    query?: any;
    body?: any;
  }
  