import PQueue from 'p-queue';
import axios, { AxiosResponse } from 'axios';

const queue = new PQueue({ concurrency: 1, carryoverConcurrencyCount: true, intervalCap: 1});
const task = async () => {

  const options = {
    method: 'GET',
    url: 'https://api.publicapis.org/entries',
  };

  const result = await axios.request<any, AxiosResponse<{ count: number }>, any>(options)
  console.log(result.data.count)
  return Date.now()
};

(async () => {
  const promise: Promise<number>[] = []
  for (let i = 0; i < 10; i++) {
    promise.push(queue.add(() => task()))
    
  }
	const unix = await queue.add(() => task());
  const p = await Promise.all(promise)
	
	console.log('Done: Unicorn task: ', unix);
  console.log('Done: Unicorn task: ', p);
})();