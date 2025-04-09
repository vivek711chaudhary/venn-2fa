import { Request, Response } from 'express'
import { validate } from 'class-validator'

import { logger } from '@/app'
import { ErrorHandler, validateRequest } from '@/helpers'
import { DetectionRequest } from '@/modules/detection-module/dtos'
import { DetectionService } from '@/modules/detection-module/service'
import { PublicClassFields } from '@/types'

export const detect = async (
    req: Request<Record<string, string>, PublicClassFields<DetectionRequest>>,
    res: Response,
) => {
    // Cast the request body as the DetectionRequest type
    const request = req.body as DetectionRequest

    logger.debug(`detect request started. Request id: ${request.id || 'unknown'}`)

    try {
        // Validate the request manually if needed
        const errors = await validate(request as any)
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`)
        }

        // perform business logic
        const result = DetectionService.detect(request)

        logger.debug('detect request finished succesfully')

        // return response
        res.json(result)
    } catch (error) {
        // handle errors
        ErrorHandler.processApiError(res, error)
    }
}
