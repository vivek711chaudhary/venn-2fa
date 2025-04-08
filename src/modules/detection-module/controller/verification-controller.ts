import { Request, Response } from 'express'
import { DetectionService, TOTPVerificationRequest } from '../service'

/**
 * VerificationController
 * 
 * Handles HTTP requests for transaction verification with TOTP codes
 */
export class VerificationController {
    /**
     * Verifies a transaction using a TOTP code
     * 
     * @param req Express request object containing transactionId and totpCode
     * @param res Express response object
     */
    public static verifyTransaction(req: Request, res: Response): void {
        try {
            const { transactionId, totpCode } = req.body
            
            if (!transactionId || !totpCode) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: transactionId and totpCode',
                })
                return
            }
            
            const verificationRequest: TOTPVerificationRequest = {
                transactionId,
                totpCode,
                timestamp: Date.now(),
            }
            
            const result = DetectionService.verifyTransaction(verificationRequest)
            
            res.status(result.success ? 200 : 400).json(result)
        } catch (error) {
            console.error('Error verifying transaction:', error)
            res.status(500).json({
                success: false,
                message: 'Internal server error during verification',
            })
        }
    }
    
    /**
     * Checks the status of a transaction's verification
     * 
     * @param req Express request object containing transactionId
     * @param res Express response object
     */
    public static checkTransactionStatus(req: Request, res: Response): void {
        try {
            const { transactionId } = req.params
            
            if (!transactionId) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required parameter: transactionId',
                })
                return
            }
            
            const status = DetectionService.getTransactionVerificationStatus(transactionId)
            
            res.status(200).json({
                success: true,
                transactionId,
                ...status,
            })
        } catch (error) {
            console.error('Error checking transaction status:', error)
            res.status(500).json({
                success: false,
                message: 'Internal server error while checking status',
            })
        }
    }
    
    /**
     * Generates a new TOTP secret for demonstration purposes
     * 
     * @param req Express request object
     * @param res Express response object
     */
    public static generateTOTPSecret(req: Request, res: Response): void {
        try {
            const { secret, sampleCode } = DetectionService.generateNewTOTPSecret()
            
            res.status(200).json({
                success: true,
                secret,
                sampleCode,
                message: 'Use this secret in your authenticator app',
            })
        } catch (error) {
            console.error('Error generating TOTP secret:', error)
            res.status(500).json({
                success: false,
                message: 'Internal server error while generating TOTP secret',
            })
        }
    }
}
