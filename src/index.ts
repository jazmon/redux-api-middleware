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
import { validateAction } from './validators';
import { APICALL, ApiActionPayload } from './types';

const { log } = console;

const apiMiddleware: Middleware = <State>({
  dispatch,
  getState,
}: MiddlewareAPI<State>) => {
  return next => action => {
    if (action.type === APICALL) {
      log('was APICALL');
      const fsaa: FluxStandardAction<{}, {}> = validateAction(action);

      const apiActionPayload = fsaa.payload as ApiActionPayload<State>;
      let url = undefined;
      if (apiActionPayload.url && typeof apiActionPayload.url === 'string') {
        url = apiActionPayload.url;
      }
      if (apiActionPayload.url && typeof apiActionPayload.url === 'function') {
        url = apiActionPayload.url(getState());
      }

      const config: AxiosRequestConfig = {
        url,
        method: apiActionPayload.method || 'GET',
      };
      log('config', config);
      if (apiActionPayload.startType) {
        if (typeof apiActionPayload.startType.payload === 'string') {
          dispatch({ type: apiActionPayload.startType });
        } else {
          let payload;
          if (typeof apiActionPayload.startType === 'string') {
            payload = string;
          }
          dispatch({
            type: apiActionPayload.startType.type,
            // TODO handle if these are funcs
            meta: apiActionPayload.startType.meta,
            // TODO handle if these are funcs
            payload: apiActionPayload.startType.payload,
          });
        }
      }
      axios(config)
        .then(response => {
          dispatch({
            type: payload.successType,
            payload: response.data,
          });
        })
        .catch(err => {});
      return next(action);
    } else {
      log('was not APICALL');
      return next(action);
    }
  };
};

export default apiMiddleware;
