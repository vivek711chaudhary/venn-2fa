import { DetectionRequest } from '../detection-module/dtos';

/**
 * UserProfileService
 * 
 * Service for analyzing user behavior patterns and detecting unusual activity
 * based on historical transaction data and behavioral profiles
 */
export class UserProfileService {
    // Mock user profiles for demo purposes
    // In a real implementation, these would be stored in a database
    private static readonly userProfiles: Record<string, {
        avgTransactionValue: string;
        typicalGasPrice: string;
        knownContracts: string[];
        typicalTimeWindow?: { start: number; end: number }; // Hours of day (0-23)
        lastActivity?: number; // Timestamp
    }> = {
        // Regular user profile
        '0x1111222233334444555566667777888899990000': {
            avgTransactionValue: '100000000000000000', // 0.1 ETH
            typicalGasPrice: '20000000000', // 20 gwei
            knownContracts: [
                '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // Uniswap token
                '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap router
            ],
            typicalTimeWindow: { start: 8, end: 22 }, // 8am - 10pm
        },
        
        // Whale user profile
        '0x2222333344445555666677778888999900001111': {
            avgTransactionValue: '5000000000000000000', // 5 ETH
            typicalGasPrice: '25000000000', // 25 gwei
            knownContracts: [
                '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', // Aave
                '0xc36442b4a4522e871399cd717abdd847ab11fe88', // Uniswap V3 Positions
                '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // Uniswap token
            ],
        },
        
        // DeFi user profile
        '0x3333444455556666777788889999000011112222': {
            avgTransactionValue: '2000000000000000000', // 2 ETH
            typicalGasPrice: '30000000000', // 30 gwei
            knownContracts: [
                '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap router
                '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', // Aave
                '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', // Compound
                '0xc36442b4a4522e871399cd717abdd847ab11fe88', // Uniswap V3 Positions
            ],
        }
    };

    /**
     * Checks for unusual behavior based on user's profile and current transaction
     * 
     * @param userAddress The user's address
     * @param request The current transaction request
     * @returns Assessment of user behavior risk
     */
    public static checkBehavior(userAddress: string, request: DetectionRequest): { isRisky: boolean; reason: string } {
        // Normalize address
        const normalizedAddress = userAddress.toLowerCase();
        
        // If we don't have a profile for this user, we can't detect unusual behavior
        if (!this.userProfiles[normalizedAddress]) {
            return { isRisky: false, reason: '' };
        }
        
        const profile = this.userProfiles[normalizedAddress];
        
        // Check for transaction value anomaly
        if (request.trace.value) {
            const transactionValue = BigInt(request.trace.value);
            const avgValue = BigInt(profile.avgTransactionValue);
            
            // If transaction value is 10x higher than average for this user
            if (transactionValue > avgValue * BigInt(10)) {
                return {
                    isRisky: true,
                    reason: 'Transaction value significantly higher than user average'
                };
            }
        }
        
        // Check for unusual contract interaction
        if (request.trace.to && !this.isKnownContract(normalizedAddress, request.trace.to)) {
            return {
                isRisky: true,
                reason: 'Interaction with previously unused contract'
            };
        }
        
        // Check for unusual timing (if we have timing data for the user)
        if (profile.typicalTimeWindow) {
            const currentHour = new Date().getHours();
            if (currentHour < profile.typicalTimeWindow.start || currentHour > profile.typicalTimeWindow.end) {
                return {
                    isRisky: true,
                    reason: 'Transaction outside of typical time window'
                };
            }
        }
        
        // Check for unusual rapid account drainage pattern
        if (profile.lastActivity && this.detectAccountDrainagePattern(normalizedAddress, request)) {
            return {
                isRisky: true,
                reason: 'Potential account drainage pattern detected'
            };
        }
        
        // No unusual behavior detected
        return { isRisky: false, reason: '' };
    }
    
    /**
     * Updates user profile with new transaction data
     * 
     * @param userAddress The user's address
     * @param request The transaction request
     */
    public static updateUserProfile(userAddress: string, request: DetectionRequest): void {
        // In a real implementation, this would update the user's profile
        // with data from the latest transaction to improve future detection
        console.log(`Updating profile for ${userAddress} with new transaction data`);
        
        // Update last activity timestamp
        if (this.userProfiles[userAddress]) {
            this.userProfiles[userAddress].lastActivity = Date.now();
        }
    }
    
    /**
     * Checks if a contract address is known to the user
     * 
     * @param userAddress The user's address
     * @param contractAddress The contract address to check
     * @returns True if the contract is in the user's known contracts list
     */
    private static isKnownContract(userAddress: string, contractAddress: string): boolean {
        const profile = this.userProfiles[userAddress];
        if (!profile) {
            return false;
        }
        
        return profile.knownContracts.some(
            addr => addr.toLowerCase() === contractAddress.toLowerCase()
        );
    }
    
    /**
     * Detects patterns that might indicate account drainage
     * (multiple transactions in quick succession emptying an account)
     * 
     * @param userAddress The user's address
     * @param request The current transaction request
     * @returns True if a potential drainage pattern is detected
     */
    private static detectAccountDrainagePattern(userAddress: string, request: DetectionRequest): boolean {
        const profile = this.userProfiles[userAddress];
        if (!profile || !profile.lastActivity) {
            return false;
        }
        
        // Check if this is a high-value transaction shortly after another transaction
        const timeSinceLastActivity = Date.now() - profile.lastActivity;
        
        // If transaction occurred within 5 minutes of previous activity
        if (timeSinceLastActivity < 5 * 60 * 1000) {
            // And it's transferring a significant amount
            if (request.trace.value) {
                const value = BigInt(request.trace.value);
                const avgValue = BigInt(profile.avgTransactionValue);
                
                // If it's higher than average and going to an unknown address
                if (value > avgValue && !this.isKnownContract(userAddress, request.trace.to)) {
                    return true;
                }
            }
        }
        
        return false;
    }
} 