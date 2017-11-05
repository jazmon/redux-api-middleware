import { AnyAction } from 'redux';
import { isFSA, FluxStandardAction } from 'flux-standard-action';
import { InvalidRSAAError } from './types';
export const validateAction = (
  action: AnyAction,
): FluxStandardAction<{}, {}> => {
  if (!isFSA(action)) {
    throw new InvalidRSAAError({
      message: 'The supplied action was invalid!',
      action,
    });
  }
  if (!action.payload || typeof action.payload !== 'object') {
    throw new InvalidRSAAError({
      message: "The 'payload' property was invalid!",
      action,
    });
  }
  return action;
};
