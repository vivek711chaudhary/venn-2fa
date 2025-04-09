/**
 * Represents a transaction trace for detection analysis
 */
export interface TransactionTrace {
    from: string;
    to: string;
    value?: string;
    gas: string;
    gasUsed: string;
    input: string;
    output?: string;
    pre: Record<string, { balance: string; nonce?: number; code?: string; storage?: Record<string, string> }>;
    post: Record<string, { balance: string; nonce?: number; code?: string; storage?: Record<string, string> }>;
    calls?: any[];
    logs?: { address: string; data: string; topics: string[] }[];
}

/**
 * Represents a detection request for transaction analysis
 */
export interface DetectionRequest {
    id?: string;
    detectorName?: string;
    chainId: number;
    hash: string;
    protocolName?: string;
    protocolAddress?: string;
    trace: TransactionTrace;
    additionalData?: Record<string, any>;
    from?: string; // Added for backward compatibility
}

/**
 * Represents the result of a detection analysis
 */
export interface DetectionResult {
    requires2FA: boolean;
    reason: string;
} 