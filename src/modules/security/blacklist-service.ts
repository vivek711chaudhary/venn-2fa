/**
 * BlacklistService
 * 
 * Service for checking if addresses are blacklisted
 * based on known scam addresses and security reports
 */
export class BlacklistService {
    // Hardcoded list of known blacklisted addresses (for demo purposes)
    // In a real implementation, this would be fetched from a database or API
    private static readonly BLACKLISTED_ADDRESSES: string[] = [
        '0x0000000000000000000000000000000000000bad',
        '0x0000000000000000000000000000000000001bad',
        '0xf4c64518ea10f995918a454158c6b61407ea345c', // Known phishing contract
        '0x4d8c508a9d1a5fbf3c25d8ea5442c495f2f5e11f', // Known scam address
        '0x24cd2edba056b7c654a50e8201b619a16c471093', // Known exploit contract
    ];

    /**
     * Checks if an address is blacklisted
     * 
     * @param address The address to check
     * @returns True if the address is blacklisted
     */
    public static isBlacklisted(address: string): boolean {
        // Convert to lowercase for case-insensitive comparison
        const normalizedAddress = address.toLowerCase();
        
        // Direct match check
        if (this.BLACKLISTED_ADDRESSES.some(addr => addr.toLowerCase() === normalizedAddress)) {
            return true;
        }
        
        // Check for similarity to known phishing addresses (address squatting)
        // This would detect addresses with slight changes to trusted addresses
        if (this.isSimilarToTrustedAddress(normalizedAddress)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Adds an address to the blacklist
     * 
     * @param address The address to blacklist
     * @param reason The reason for blacklisting
     * @returns Success status
     */
    public static addToBlacklist(address: string, reason: string): { success: boolean; message: string } {
        // In a real implementation, this would add to a persistent storage
        console.log(`Adding ${address} to blacklist: ${reason}`);
        
        // For demo, just log it
        return {
            success: true,
            message: `Address ${address} has been blacklisted: ${reason}`
        };
    }
    
    /**
     * Checks if an address is suspiciously similar to a trusted address
     * (to detect address squatting, a common phishing technique)
     * 
     * @param address The address to check
     * @returns True if the address appears to be squatting a trusted address
     */
    private static isSimilarToTrustedAddress(address: string): boolean {
        // List of trusted DEX and protocol addresses
        const trustedAddresses = [
            '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
            '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // Uniswap Token
            '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', // Aave V2 Lending Pool
        ];
        
        // For each trusted address, check if submitted address is suspiciously similar
        for (const trusted of trustedAddresses) {
            // Skip if less than 90% match (allow for some variation at the end)
            if (this.calculateAddressSimilarity(trusted, address) > 0.9) {
                // If similar but not identical, it's suspicious
                if (trusted !== address) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Calculates string similarity between two addresses
     * 
     * @param addr1 First address
     * @param addr2 Second address
     * @returns Similarity score between 0 and 1
     */
    private static calculateAddressSimilarity(addr1: string, addr2: string): number {
        // For simplicity, we just check for character-by-character matches
        // A real implementation might use more sophisticated algorithms
        
        const minLength = Math.min(addr1.length, addr2.length);
        let matchCount = 0;
        
        for (let i = 0; i < minLength; i++) {
            if (addr1[i] === addr2[i]) {
                matchCount++;
            }
        }
        
        return matchCount / minLength;
    }
} 