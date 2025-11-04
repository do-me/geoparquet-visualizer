// worker.js

import { processParquetStream } from './parser.js';

self.onmessage = async (event) => {
    // NEW: Destructure the limit from the message data
    const { type, file, limit } = event.data;

    if (type === 'processFile') {
        try {
            // Use the parser's generator, which now accepts the limit
            const featureGenerator = processParquetStream(file, limit); 
            
            let batchCount = 0;
            let totalProcessed = 0;
            let limitReached = false;
            
            for await (const batchResult of featureGenerator) {
                batchCount++;
                totalProcessed = batchResult.totalProcessed;
                limitReached = batchResult.limitReached;

                if (batchResult.features.length > 0) {
                    self.postMessage({ type: 'features', payload: batchResult.features });
                }

                self.postMessage({
                    type: 'status',
                    payload: {
                        message: `Worker processing batch ${batchCount}...`,
                        batchCount: batchCount,
                        totalProcessed: totalProcessed
                    }
                });
            }
            
            // NEW: Send back whether the limit was the reason for stopping
            self.postMessage({ type: 'done', payload: { limitReached, limit } });

        } catch (error) {
            console.error('Error in worker:', error);
            self.postMessage({ type: 'error', payload: { message: error.message } });
        }
    }
};