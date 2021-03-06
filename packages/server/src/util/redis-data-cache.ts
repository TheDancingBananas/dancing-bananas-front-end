import Redis from 'ioredis';

type FnCache = { [keyedFn: string]: boolean };

export async function keepCachePopulated(
    redis: Redis.Redis,
    fn: (...args: any[]) => any,
    args: any[],
    interval = 60,
    expires?: number,
): Promise<void> {
    const redisKey = [fn.name, ...args.map((arg) => JSON.stringify(arg))].join(
        ':',
    );

    const callFn = async (attempt = 0) => {
        try {
            const result = await fn(...args);

            await redis.set(
                redisKey,
                JSON.stringify(result),
                'EX',
                (interval + 300) * 1000,
            );
            console.log(
                'cache successfully populated --------------',
                redisKey,
            );
            return; // cache succcessfully populated
        } catch (err) {
            // If more than 5 attempts, don't try to populate cache
            if (attempt >= 5) {
                console.error(`Could not populate cache for ${redisKey}`);
                return;
            }

            console.log(`Retrying attempt ${attempt} for ${redisKey}`);

            // Wait for 5 seconds then try again
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await callFn(++attempt);
        }
    };

    // Make sure cache isn't already being tracked
    let currentlyCached = await redis.get('cached_fns');
    if (!currentlyCached) {
        const cachedFns: Record<string, boolean> = {
            cachestarting: true,
        };
        currentlyCached = JSON.stringify(cachedFns);
        await redis.set('cached_fns', currentlyCached);
    }

    if (currentlyCached) {
        try {
            const cachedFns: FnCache = JSON.parse(currentlyCached);

            void callFn();
            // Start the interval and tell redis we're already caching it

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const callInterval: NodeJS.Timeout = <any>setInterval(() => {
                void callFn();
            }, interval * 1000);

            // Unref prevents the interval from blocking app shutdown
            callInterval.unref();

            cachedFns[redisKey] = true;
            await redis.set('cached_fns', JSON.stringify(cachedFns));

            if (expires) {
                setTimeout(() => {
                    clearInterval(callInterval);

                    // Remove function from cache
                    void redis.get('cached_fns').then((currentlyCached) => {
                        if (currentlyCached) {
                            try {
                                const cachedFns: FnCache = JSON.parse(
                                    currentlyCached,
                                );
                                delete cachedFns[redisKey];
                                return redis.set(
                                    'cached_fns',
                                    JSON.stringify(cachedFns),
                                );
                            } catch (e) {
                                console.error(
                                    'Could not delete cached function at end of interval',
                                );
                            }
                        }
                    });
                }, expires * 1000);
            }
        } catch (err) {
            throw new Error(
                `Could not parse cachedFns in redis: ${err.message as string}`,
            );
        }
    }
}

export function wrapWithCache(
    redis: Redis.Redis,
    fn: (...args: any[]) => any,
    expiry = 30,
    populate = false,
): (...args: any[]) => any {
    const wrappedFn = async (...args: any[]): Promise<any> => {
        // Try cache first
        const redisKey = [
            fn.name,
            ...args.map((arg) => JSON.stringify(arg)),
        ].join(':');
        let result: any;
        try {
            const cachedResult = await redis.get(redisKey);
            if (cachedResult) {
                result = JSON.parse(cachedResult);
            }
        } catch (e) {
            console.error(`Could not fetch value from cache for ${redisKey}`);
        }

        if (!result) {
            // Need to explicitly fetch
            result = await fn(...args);
            // Set result in cache
            await redis.set(redisKey, JSON.stringify(result), 'EX', expiry);

            // Since cache not populated, keep it populated if arg is set
            if (populate) {
                console.log(`Auto-populating cache for ${redisKey}`);
                void keepCachePopulated(redis, fn, args, expiry);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result;
    };

    return wrappedFn;
}

// API Cache should
// Take a redis connection
// Take a list of functions with arguments and an interval
// For each function:
// Set up polling to fetch result of calling function every 'interval'
// Translate funtion with arg to redis signature (:-delineated)
// Every interval, set the key in redis
