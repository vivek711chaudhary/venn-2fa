import { DetectionRequest } from '../detection-module/dtos';

/**
 * AnomalyDetector
 * 
 * Service for detecting anomalous patterns in blockchain transactions
 * using statistical and machine learning techniques
 */
export class AnomalyDetector {
    /**
     * Detects anomalies in transaction patterns
     * 
     * @param request The detection request containing transaction data
     * @returns An anomaly score between 0 (normal) and 1 (highly anomalous)
     */
    public static detectAnomalies(request: DetectionRequest): number {
        let anomalyScore = 0;
        
        // Check for unusual transaction value compared to historical patterns
        anomalyScore += this.checkValueAnomaly(request);
        
        // Check for unusual gas price/limit
        anomalyScore += this.checkGasAnomaly(request);
        
        // Check for unusual contract interaction patterns
        anomalyScore += this.checkInteractionAnomaly(request);
        
        // Normalize final score to 0-1 range
        return Math.min(anomalyScore, 1);
    }
    
    /**
     * Checks for value anomalies
     * 
     * @param request The transaction request
     * @returns Partial anomaly score
     */
    private static checkValueAnomaly(request: DetectionRequest): number {
        if (!request.trace.value) {
            return 0;
        }
        
        const value = BigInt(request.trace.value);
        
        // In a real implementation, this would compare with historical transactions
        // For demo purposes, we consider very high values as potentially anomalous
        
        if (value > BigInt('100000000000000000000')) { // > 100 ETH
            return 0.6; // Strong anomaly
        } else if (value > BigInt('50000000000000000000')) { // > 50 ETH
            return 0.4; // Moderate anomaly
        } else if (value > BigInt('10000000000000000000')) { // > 10 ETH
            return 0.2; // Mild anomaly
        }
        
        return 0;
    }
    
    /**
     * Checks for gas price/limit anomalies
     * 
     * @param request The transaction request
     * @returns Partial anomaly score
     */
    private static checkGasAnomaly(request: DetectionRequest): number {
        if (!request.additionalData) {
            return 0;
        }
        
        let score = 0;
        
        // Check for unusually high gas price
        if (request.additionalData.gasPrice && typeof request.additionalData.gasPrice === 'string') {
            const gasPrice = BigInt(request.additionalData.gasPrice);
            if (gasPrice > BigInt('500000000000')) { // > 500 gwei
                score += 0.3; // Significant anomaly
            }
        }
        
        // Check for unusually high gas limit
        if (request.additionalData.gasLimit && typeof request.additionalData.gasLimit === 'string') {
            const gasLimit = BigInt(request.additionalData.gasLimit);
            if (gasLimit > BigInt('2000000')) { // > 2M gas
                score += 0.2; // Moderate anomaly
            }
        }
        
        return score;
    }
    
    /**
     * Checks for unusual contract interaction patterns
     * 
     * @param request The transaction request
     * @returns Partial anomaly score
     */
    private static checkInteractionAnomaly(request: DetectionRequest): number {
        if (!request.trace.input || request.trace.input === '0x') {
            return 0;
        }
        
        let score = 0;
        
        // Check for unusual input data length
        if (request.trace.input.length > 1000) {
            score += 0.1; // Mild anomaly
        }
        
        // Check for multiple nested calls (potential reentrancy pattern)
        if (request.trace.calls && request.trace.calls.length > 0) {
            const nestingDepth = this.getMaxCallNestingDepth(request.trace.calls);
            if (nestingDepth > 5) {
                score += 0.3; // Significant anomaly
            } else if (nestingDepth > 3) {
                score += 0.1; // Mild anomaly
            }
        }
        
        return score;
    }
    
    /**
     * Gets the maximum nesting depth of calls
     * 
     * @param calls Array of calls
     * @param currentDepth Current depth (for recursion)
     * @returns Maximum nesting depth
     */
    private static getMaxCallNestingDepth(calls: any[], currentDepth = 1): number {
        let maxDepth = currentDepth;
        
        for (const call of calls) {
            if (call.calls && call.calls.length > 0) {
                const nestedDepth = this.getMaxCallNestingDepth(call.calls, currentDepth + 1);
                maxDepth = Math.max(maxDepth, nestedDepth);
            }
        }
        
        return maxDepth;
    }
} 