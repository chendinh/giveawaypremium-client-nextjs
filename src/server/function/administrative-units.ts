import * as administativeUnits from '@/server/constants/units.json'; 

export const getAdministativeUnits = async (
  request: Parse.Cloud.FunctionRequest
): Promise<any> => {
  return administativeUnits;
};
