import { isFSA, FluxStandardAction } from "flux-standard-action";
import { Middleware, Dispatch, MiddlewareAPI, AnyAction } from "redux";
import {
  default as axios,
  AxiosTransformer,
  AxiosBasicCredentials,
  AxiosProxyConfig,
  AxiosRequestConfig,
  CancelToken
} from "axios";

export const APICALL = Symbol("APIMiddlewareCall");

export class InvalidRSAAError extends Error {
  action: any;
  constructor({ message, action }: { message: string; action: any }) {
    super(message);
    this.action = action;
  }
}
export type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export interface TypeDescriptor<State> {
  type: string;
  payload?:
    | ((action: AnyAction, state: State) => Object)
    | { [key: string]: any };
  meta?: { [key: string]: any };
}
export interface ApiActionPayload<State> {
  // types: [string, string, string];
  readonly startType?: string | TypeDescriptor<State>;
  readonly successType?: string | TypeDescriptor<State>;
  readonly errorType?: string | TypeDescriptor<State>;
  readonly optimisticType?: string | TypeDescriptor<State>;
  // readonly startType?: string;
  // readonly successType?: string;
  // readonly errorType?: string;
  // readonly optimisticType?: string;
  url: ((state: State) => string) | string;
  credentials?: RequestCredentials;
  method?: RequestMethod;
  headers?: { [key: string]: string };

  validateStatus?: (status: number) => boolean;

  transformRequest?: AxiosTransformer | AxiosTransformer[];
  transformResponse?: AxiosTransformer | AxiosTransformer[];
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  // adapter?: AxiosAdapter;
  auth?: AxiosBasicCredentials;
  responseType?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  maxRedirects?: number;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig;
  cancelToken?: CancelToken;
}

export interface ApiAction<State, Meta = {}>
  extends FluxStandardAction<ApiActionPayload<State>, Meta> {
  type: typeof APICALL;
}

const { log } = console;

const apiMiddleware: Middleware = <State>({
  dispatch,
  getState
}: MiddlewareAPI<State>) => {
  return next => action => {
    if (action.type === APICALL) {
      log("was APICALL");
      if (!isFSA(action)) {
        throw new InvalidRSAAError({
          message: "The supplied action was invalid!",
          action
        });
      }
      if (!action.payload || typeof action.payload !== "object") {
        throw new InvalidRSAAError({
          message: "The 'payload' property was invalid!",
          action
        });
      }
      const payload = action.payload as ApiActionPayload<State>;
      let url = undefined;
      if (payload.url && typeof payload.url === "string") {
        url = payload.url;
      }
      if (payload.url && typeof payload.url === "function") {
        url = payload.url(getState());
      }

      const config: AxiosRequestConfig = {
        url,
        method: payload.method || "GET"
      };
      log("config", config);
      if (payload.startType) {
        if (typeof payload.startType === "string") {
          dispatch({ type: payload.startType });
        } else {
          dispatch({
            type: payload.startType.type,
            // TODO handle if these are funcs
            meta: payload.startType.meta,
            // TODO handle if these are funcs
            payload: payload.startType.payload
          });
        }
      }
      axios(config)
        .then(response => {})
        .catch(err => {});
      return next(action);
    } else {
      log("was not APICALL");
      return next(action);
    }
  };
};

export default apiMiddleware;
