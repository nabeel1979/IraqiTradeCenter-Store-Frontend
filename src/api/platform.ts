import client from './client';

export const platformApi = {
  getInfo: async (): Promise<{ cartEpoch: number }> => {
    const res = await client.get<{ cartEpoch: number }>('/api/store/platform-info');
    return res.data;
  },
};
