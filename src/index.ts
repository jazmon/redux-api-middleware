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
import { APICALL, ApiActionPayload, TypeDescriptor } from './types';

const { log } = console;

export const getUrl = <State>(
  payload: ApiActionPayload<State>,
  state: State,
): string => {
  if (!state) throw new Error('State must be passed to getUrl');
  let url;
  if (payload.url && typeof payload.url === 'string') {
    url = payload.url;
  }
  if (payload.url && typeof payload.url === 'function') {
    url = payload.url(state);
  }
  if (typeof url !== 'string')
    throw new TypeError(
      'payload.url must be a string or a function that returns a string!',
    );
  return url;
};

const apiMiddleware: Middleware = <State>({
  dispatch,
  getState,
}: MiddlewareAPI<State>) => {
  return next => action => {
    if (action.type === APICALL) {
      log('was APICALL');
      const fsaa: FluxStandardAction<{}, {}> = validateAction(action);

      const apiActionPayload = fsaa.payload as ApiActionPayload<State>;
      const url = getUrl(apiActionPayload, getState());

      const config: AxiosRequestConfig = {
        url,
        method: apiActionPayload.method || 'GET',
      };
      log('config', config);
      log('apiActionPayload', apiActionPayload);
      if (apiActionPayload.startType) {
        log('had startType');
        if (typeof apiActionPayload.startType === 'string') {
          dispatch({ type: apiActionPayload.startType });
        } else {
          if (typeof apiActionPayload.startType === 'object') {
            dispatch({
              type: apiActionPayload.startType.type,
              // TODO handle if these are funcs
              meta: apiActionPayload.startType.meta,
              // TODO handle if these are funcs
              payload: apiActionPayload.startType.payload,
            });
          }
        }
      }
      axios(config)
        .then(response => {
          dispatch({
            type: apiActionPayload.successType,
            payload: response.data,
          });
        })
        .catch(err => {
          dispatch({
            type: apiActionPayload.errorType,
            payload: err,
          });
        });
      return next(action);
    } else {
      log('was not APICALL');
      return next(action);
    }
  };
};

export default apiMiddleware;
