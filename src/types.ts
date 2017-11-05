import { isFSA, FluxStandardAction } from 'flux-standard-action';
import { Middleware, Dispatch, MiddlewareAPI, AnyAction } from 'redux';
import {
  default as axios,
  AxiosTransformer,
  AxiosBasicCredentials,
  AxiosProxyConfig,
  AxiosRequestConfig,
  CancelToken,
} from 'axios';

export const APICALL = Symbol('APIMiddlewareCall');

export class InvalidRSAAError extends Error {
  action: any;
  constructor({ message, action }: { message: string; action: any }) {
    super(message);
    this.action = action;
  }
}
export type RequestMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

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
