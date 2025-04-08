import { DetectionRequest, DetectionResponse } from './dtos'
import { RiskService } from '../risk-detection/risk-service'
import { TOTPService } from '../authenticator/totp-service'

/**
 * DetectionService
 *
 * Implements a `detect` method that receives an enriched view of an
 * EVM compatible transaction (i.e. `DetectionRequest`)
 * and returns a `DetectionResponse`
 * 
 * For high-risk transactions, it triggers 2FA validation using authenticator apps
 *
 * API Reference:
 * https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md
 */
/**
 * TransactionVerificationStatus - Enum defining the possible verification statuses
 */
export enum TransactionVerificationStatus {
    VERIFIED = 'VERIFIED',               // Transaction has been verified with 2FA
    PENDING_VERIFICATION = 'PENDING',    // Transaction requires 2FA verification
    NOT_REQUIRED = 'NOT_REQUIRED'        // Transaction doesn't need 2FA verification
}

/**
 * TOTPVerificationRequest - Interface for TOTP verification requests
 */
export interface TOTPVerificationRequest {
    transactionId: string;        // Unique transaction ID
    totpCode: string;            // TOTP code from authenticator app
    timestamp: number;           // Timestamp of verification request
}

/**
 * In a real implementation, this would be replaced with a proper database or cache
 * to store pending transactions and their verification status
 */
const pendingTransactions = new Map<string, {
    requestData: DetectionRequest;
    riskInfo: { isHighRisk: boolean; reason: string };
    verified: boolean;
    secret: string;              // In production, this would be associated with a user account
    timestamp: number;
}>();

export class DetectionService {
    // Default TOTP secret for demo purposes
    // In production, each user would have their own secret stored securely
    private static readonly DEFAULT_TOTP_SECRET = 'JBSWY3DPEHPK3PXP'; // Demo secret

    /**
     * Detects high-risk transactions and triggers 2FA verification when necessary
     * 
     * @param request The detection request containing transaction data
     * @returns A detection response indicating if verification is needed
     */
    public static detect(request: DetectionRequest): DetectionResponse {
        // Generate a transaction ID if not provided
        const transactionId = request.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // Assess transaction risk using RiskService
        const riskAssessment = RiskService.assessRisk(request);
        
        // If the transaction is not high risk, allow it to proceed without 2FA
        if (!riskAssessment.isHighRisk) {
            return new DetectionResponse({
                transactionId: transactionId,
                requestId: request.id,
                detected: false,
                message: 'Transaction is safe, no 2FA required'
            });
        }
        
        // For high-risk transactions, store the transaction data and require 2FA
        pendingTransactions.set(transactionId, {
            requestData: request,
            riskInfo: riskAssessment,
            verified: false,
            secret: this.DEFAULT_TOTP_SECRET, // In production, get user's secret from secure storage
            timestamp: Date.now(),
        });
        
        // Return a response indicating that 2FA verification is required
        return new DetectionResponse({
            transactionId: transactionId,
            requestId: request.id,
            detected: true,
            message: `High-risk transaction detected: ${riskAssessment.reason}. 2FA verification required.`
        });
    }
    
    /**
     * Verifies a transaction using a TOTP code from an authenticator app
     * 
     * @param verificationRequest The verification request with TOTP code
     * @returns The verification status
     */
    public static verifyTransaction(verificationRequest: TOTPVerificationRequest): {
        success: boolean;
        message: string;
        status: TransactionVerificationStatus;
    } {
        const { transactionId, totpCode } = verificationRequest;
        
        // Check if transaction exists in pending transactions
        const transaction = pendingTransactions.get(transactionId);
        if (!transaction) {
            return {
                success: false,
                message: 'Transaction not found or already processed',
                status: TransactionVerificationStatus.NOT_REQUIRED,
            };
        }
        
        // Verify the TOTP code using TOTPService
        const isValidCode = TOTPService.validateTOTP(totpCode, transaction.secret);
        
        if (!isValidCode) {
            return {
                success: false,
                message: 'Invalid verification code, please try again',
                status: TransactionVerificationStatus.PENDING_VERIFICATION,
            };
        }
        
        // If code is valid, mark transaction as verified
        transaction.verified = true;
        pendingTransactions.set(transactionId, transaction);
        
        return {
            success: true,
            message: 'Transaction successfully verified',
            status: TransactionVerificationStatus.VERIFIED,
        };
    }
    
    /**
     * Checks the verification status of a transaction
     * 
     * @param transactionId The transaction ID to check
     * @returns The current verification status
     */
    public static getTransactionVerificationStatus(transactionId: string): {
        status: TransactionVerificationStatus;
        riskReason?: string;
    } {
        const transaction = pendingTransactions.get(transactionId);
        
        if (!transaction) {
            return { status: TransactionVerificationStatus.NOT_REQUIRED };
        }
        
        if (transaction.verified) {
            return { status: TransactionVerificationStatus.VERIFIED };
        }
        
        return { 
            status: TransactionVerificationStatus.PENDING_VERIFICATION,
            riskReason: transaction.riskInfo.reason,
        };
    }
    
    /**
     * Generates a new TOTP secret for a user
     * 
     * @returns An object containing the secret and a sample TOTP code
     */
    public static generateNewTOTPSecret(): { secret: string; sampleCode: string } {
        const secret = TOTPService.generateSecret();
        const sampleCode = TOTPService.generateTOTP(secret);
        
        return { secret, sampleCode };
    }
}
