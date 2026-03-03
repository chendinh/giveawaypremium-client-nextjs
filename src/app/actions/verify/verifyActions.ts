// app/api/users/route.ts
'use server';

import { API_TYPES, AUTH_TYPES, createAxiosInstance } from '@/lib/axiosBase';

const api = createAxiosInstance({
  authType: AUTH_TYPES.BEARER,
  apiNameOrUrl: API_TYPES.DEFAULT,
});

export const getVerifyEmail = async (
  code: string,
  profileId: string
): Promise<any> => {
  try {
    const res = await api.get<any>(
      `/profiles/email/active?code=${code}&profileId=${profileId}`,
      {
        headers: {},
      }
    );
    console.log('getVerifyEmail response:', res);
    if (!res) {
      throw new Error('No email verification data found');
    }

    return {
      data: res.data,
    };
  } catch (err: any) {
    console.error(
      `Error fetching email verification details for ${code}:`,
      err.message
    );
    return {
      data: undefined,
    };
  }
};
