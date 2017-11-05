// tslint:disable-next-line: import-name
import { AnyAction } from 'redux';
import axios from 'axios';
// tslint:disable-next-line: import-name
import MockAdapter = require('axios-mock-adapter');
import { default as apiMiddleware, getUrl, extractPayload } from './index';
import {
  APICALL,
  ApiAction,
  ApiActionPayload,
  InvalidRSAAError,
  TypeDescriptor,
} from './types';

const mock = new MockAdapter(axios);

afterEach(() => {
  // Reset the axios mock
  mock.reset();
  mock.restore();
});

// Base state for redux
const state = { foo: 'bar', path: 'cats' };

// creates redux handler for a test
const create = () => {
  const store = {
    getState: jest.fn(() => state),
    dispatch: jest.fn(),
  };
  const next = jest.fn();

  // Function to invoke our middleware
  const invoke = (action: AnyAction) => apiMiddleware(store)(next)(action);

  return { store, next, invoke };
};

describe('Utility functions', () => {
  describe('getUrl', () => {
    it('should return url from a string url', () => {
      const { store } = create();
      const payload: ApiActionPayload<typeof state> = {
        url: '/foo',
      };
      const expected = '/foo';
      expect(getUrl(payload, store.getState())).toEqual(expected);
    });

    it('should return url from a function', () => {
      const { store } = create();
      const payload: ApiActionPayload<typeof state> = {
        url: (s: typeof state) => `/${state.path}`,
      };
      const expected = '/cats';
      expect(getUrl(payload, store.getState())).toEqual(expected);
    });

    it('should throw when no url', () => {
      const { store } = create();
      const testError = () =>
        getUrl({ url: undefined } as any, store.getState());
      expect(testError).toThrow(TypeError);
    });

    it('should throw if not passed a state', () => {
      const { store } = create();
      const testError = () => getUrl({ url: '/foo' }, undefined as any);
      expect(testError).toThrow(Error);
    });
  });

  describe('extractPayload', () => {
    it('should extract payload from payload object', () => {
      const action = { type: 'FOO' };
      const payload = { cat: 'yes' };
      const type: TypeDescriptor<typeof state> = {
        type: 'baz',
        payload,
      };
      expect(extractPayload(type, action, state)).toEqual(payload);
    });
  });

  it('should extract payload from function that returns object', () => {
    const action = { type: 'FOO' };
    const payload = (action: AnyAction, s: typeof state) => ({
      foo: state.foo,
    });
    const type: TypeDescriptor<typeof state> = {
      type: 'baz',
      payload,
    };
    expect(extractPayload(type, action, state)).toEqual({ foo: state.foo });
  });

  it('should throw if payload is incorrect type', () => {
    const action = { type: 'FOO' };
    const payload = 'i like trains';
    const type: TypeDescriptor<typeof state> = {
      type: 'baz',
      payload: payload as any,
    };
    const testError = () => extractPayload(type, action, state);
    expect(testError).toThrow(TypeError);
  });
});

it('should intercept an action with APICALL type', async () => {
  const { invoke, store } = create();

  mock.onGet('/foo').replyOnce(200, { foo: 'bar' });
  const startType = 'START';
  const action: ApiAction<typeof state> = {
    type: APICALL,
    meta: {},
    payload: {
      url: '/foo',
      successType: 'SUCCESS',
      errorType: 'ERROR',
      startType,
    },
  };

  invoke(action);

  // it should have dispatched once
  expect(store.dispatch.mock.calls.length).toBe(1);
  // the first action that's dispatched should be the start action
  expect(store.dispatch.mock.calls[0][0]).toEqual({ type: startType });
  expect(store.dispatch).toHaveBeenCalledWith({ type: 'START' });
});

it('should pass an action through if not APICALL type', () => {
  const { invoke, next, store } = create();
  const action = { type: 'FOO' };

  invoke(action);

  expect(next).toHaveBeenCalledWith(action);
});

describe('invalid payload', () => {
  it('should throw if no payload property', () => {
    const { invoke } = create();
    const action = { type: APICALL };
    const testError = () => invoke(action);

    expect(testError).toThrowErrorMatchingSnapshot();
  });

  it('should throw if the action is not FSAA', () => {
    const { invoke } = create();
    const action = { type: APICALL, foo: 'bar' };
    const testError = () => invoke(action);

    expect(testError).toThrowErrorMatchingSnapshot();
  });
});
