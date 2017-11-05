// tslint:disable-next-line: import-name
import { default as apiMiddleware } from './index';
import { APICALL, ApiAction, InvalidRSAAError } from './types';

const state = { foo: 'bar' };
const getState = () => state;
const dispatch = jest.fn();
const api = { getState, dispatch };

it('should do the thing', async () => {
  const action: ApiAction<typeof state> = {
    type: APICALL,
    meta: {},
    payload: {
      url: '/',
      successType: 'SUCCESS',
      errorType: 'ERROR',
    },
  };

  apiMiddleware(api)(dispatch)(action);
  expect(dispatch.mock.calls.length).toBe(1);
  expect(dispatch.mock.calls[0][0]).toBe(action);
});

it('should not do anything if not type APICALL', () => {
  const action = { type: 'FOO' };
  apiMiddleware(api)(dispatch)(action);
  expect(dispatch.mock.calls.length).toBe(1);
  expect(dispatch.mock.calls[0][0]).toBe(action);
});

describe('invalid payload', () => {
  it('should throw if no payload property', () => {
    const action = { type: APICALL };
    const testError = () => apiMiddleware(api)(dispatch)(action);

    expect(testError).toThrow(InvalidRSAAError);
  });
});
