import { DetectionRequest } from './dtos';
import { RiskService } from '../risk-detection/risk-service';
import { BlacklistService } from '../security/blacklist-service';
import { UserProfileService } from '../user/user-profile-service';

/**
 * Interface for detection results
 */
export interface DetectionResult {
    requires2FA: boolean;
    reason: string;
}

/**
 * Interface for risk assessment results from RiskService
 */
interface RiskAssessmentResult {
    isHighRisk: boolean;
    reason: string;
}

/**
 * DetectionService
 * 
 * Main service for detecting high-risk transactions that require 2FA
 */
export class DetectionService {
    /**
     * Detects if a transaction is risky and requires 2FA
     * 
     * @param request Detection request containing transaction details
     * @returns Detection result indicating if 2FA is required and why
     */
    public static detect(request: DetectionRequest): DetectionResult {
        console.log('Detecting high-risk transaction:', JSON.stringify(request, null, 2));
        
        // Extract user address from request
        const userAddress = request.trace.from;
        
        // Check blacklist first
        const isBlacklisted = BlacklistService.isBlacklisted(request.trace.to);
        if (isBlacklisted) {
            return {
                requires2FA: true,
                reason: `Recipient address is blacklisted`
            };
        }
        
        // Check for risky transaction patterns
        const riskAssessment: RiskAssessmentResult = RiskService.assessRisk(request);
        if (riskAssessment.isHighRisk) {
            return {
                requires2FA: true,
                reason: riskAssessment.reason
            };
        }
        
        // Check for unusual user behavior
        const behaviorCheck = UserProfileService.checkBehavior(userAddress, request);
        if (behaviorCheck.isRisky) {
            return {
                requires2FA: true,
                reason: behaviorCheck.reason
            };
        }
        
        // If we don't require 2FA, update the user profile with this transaction
        // to improve future detection
        UserProfileService.updateUserProfile(userAddress, request);
        
        // No risk detected
        return {
            requires2FA: false,
            reason: ''
        };
    }
} 