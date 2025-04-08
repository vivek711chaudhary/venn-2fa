import { Router } from 'express'

import * as DetectionController from './controller'
import { VerificationController } from './controller'

const detectionRouter = Router()

// Transaction detection endpoint
detectionRouter.post('/', DetectionController.detect)

// Verification endpoints
detectionRouter.post('/verify', VerificationController.verifyTransaction)
detectionRouter.get('/status/:transactionId', VerificationController.checkTransactionStatus)
detectionRouter.get('/generate-totp', VerificationController.generateTOTPSecret)

export { detectionRouter }
