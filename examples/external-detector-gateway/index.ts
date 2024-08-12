import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ExternalDetectorRequestBodySchema } from './schemas';
import { validateRequest } from './middleware';

const app = express();
app.use(express.json());


type ExternalDetectorRequestBody = z.infer<typeof ExternalDetectorRequestBodySchema>;

interface ExternalDetectorResponse {
  requestId: string;
  chainId: number;
  detected: boolean;
  error?: boolean;
  message?: string;
  protocolAddress?: string;
  protocolName?: string;
  additionalData?: Record<string, unknown>;
}

type ExternalDetectorRequestParams = {
  detectorName: string
}


app.post('/detect/:detectorName', validateRequest, async (
  req: Request<ExternalDetectorRequestParams, null, ExternalDetectorRequestBody>,
  res: Response
) => {
  try {
    const { detectorName } = req.params;
    const {id: requestId, chainId, hash, protocolName, protocolAddress, trace, additionalData} = req.body;

    // Here you would implement your detection logic
    if (detectorName === 'example-detector') {
      // Example detector logic
      console.log('Example detector logic', hash, trace, additionalData);
    }

    // For this example, we'll just return a mock response
    const response: ExternalDetectorResponse = {
      requestId,
      chainId,
      detected: Math.random() < 0.5, // Random detection for demonstration
      protocolAddress,
      protocolName,
      message: 'Example message',
      error: false,
      additionalData: {
        detectorName,
        detectionTimestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error in detection process:', error);
    res.status(500).json({
      error: true,
      message: 'An error occurred during the detection process',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BlockBeat External detector gateway running on port ${PORT}`);
});

export default app;