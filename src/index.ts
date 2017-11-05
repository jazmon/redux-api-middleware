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

/**
 *
 * @param {Object} payload an object that contains the url
 * @param {Object} state the redux state
 *
 * @returns {string} url
 */
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

/**
 * Extracts the payload from the typeDescriptor.
 *
 * @param typeDescriptor An object that contains the payload
 * @param action The action that was called, passed to payload if it's a function
 * @param state The redux state
 *
 * @returns {Object} the payload from the typedescriptor
 * @throws {TypeError} if the typedescriptor payload is not a function or object
 */
export const extractPayload = <State>(
  typeDescriptor: TypeDescriptor<State>,
  action: AnyAction,
  state: State,
): Object => {
  let payload: Object;
  if (typeof typeDescriptor.payload === 'function') {
    payload = typeDescriptor.payload(action, state);
  } else if (typeof typeDescriptor.payload === 'object') {
    payload = typeDescriptor.payload;
  } else {
    throw new TypeError(
      'Payload must be a an object or a function that returns an object!',
    );
  }
  return payload;
};

type MaybeDispatchActionProps<State> = {
  type?: string | TypeDescriptor<State>;
  dispatch: Dispatch<State>;
  payloadOverride?: Object;
  action: AnyAction;
  state: State;
};
/**
 * Dispatches an action and creates a FSAA out of it
 * @param {Object} props - an object containing the config
 */
export const maybeDispatchAction = <State>({
  type,
  dispatch,
  payloadOverride,
  action,
  state,
}: MaybeDispatchActionProps<State>): void => {
  if (!type) return;
  if (typeof type === 'string') {
    dispatch({ type });
  } else {
    if (typeof type === 'object') {
      const payload = extractPayload(type, action, state);

      dispatch({
        type: type.type,
        meta: type.meta,
        payload: payloadOverride ? payloadOverride : type.payload,
      });
    }
  }
};

const apiMiddleware: Middleware = <State>({
  dispatch,
  getState,
}: MiddlewareAPI<State>) => {
  return next => action => {
    // Pass the action forwards if not our action type
    if (action.type !== APICALL) {
      return next(action);
    }
    /* Validate the action and assume it's FSAA
     * and the payload is ApiActionPayload
     */
    const fsaa: FluxStandardAction<{}, {}> = validateAction(action);

    const apiActionPayload = fsaa.payload as ApiActionPayload<State>;

    // Get the url or throw if we can't get a string url
    const url = getUrl(apiActionPayload, getState());

    const config: AxiosRequestConfig = {
      url,
      method: apiActionPayload.method || 'GET',
    };
    // Default properties for each dispatch function
    const dispatchDefaults = {
      dispatch,
      action,
      state: getState(),
    };
    maybeDispatchAction({
      ...dispatchDefaults,
      type: apiActionPayload.startType,
    });
    // Optimistic response from the api
    maybeDispatchAction({
      ...dispatchDefaults,
      type: apiActionPayload.optimisticType,
    });
    axios(config)
      .then(response => {
        maybeDispatchAction({
          ...dispatchDefaults,
          type: apiActionPayload.successType,
          payloadOverride: response.data,
        });
      })
      .catch(err => {
        maybeDispatchAction({
          ...dispatchDefaults,
          type: apiActionPayload.errorType,
          payloadOverride: err,
        });
      });
    return next(action);
  };
};

export default apiMiddleware;
