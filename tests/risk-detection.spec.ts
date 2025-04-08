import { RiskService } from '../src/modules/risk-detection/risk-service'
import { DetectionRequest } from '../src/modules/detection-module/dtos'

// Helper function to create a mock transaction request
function createMockDetectionRequest(options: Partial<{
  value: string;
  input: string;
  to: string;
  calls: any[];
}> = {}): DetectionRequest {
  return {
    chainId: 1,
    hash: '0xmockhash',
    trace: {
      from: '0xfrom',
      to: options.to || '0xto',
      gas: '100000',
      gasUsed: '50000',
      input: options.input || '0x0',
      value: options.value || '0',
      pre: {},
      post: {},
      calls: options.calls || []
    }
  } as unknown as DetectionRequest;
}

describe('RiskService', () => {
  describe('Risk Assessment', () => {
    it('should identify high-value transactions as high risk', () => {
      // Create a transaction with a value of 2 ETH (above the threshold)
      const highValueRequest = createMockDetectionRequest({
        value: '2000000000000000000' // 2 ETH
      });
      
      const riskAssessment = RiskService.assessRisk(highValueRequest);
      
      expect(riskAssessment.isHighRisk).toBe(true);
      expect(riskAssessment.reason).toContain('High value transaction detected');
    });

    it('should not flag low-value transactions as high risk', () => {
      // Create a transaction with a value of 0.5 ETH (below the threshold)
      const lowValueRequest = createMockDetectionRequest({
        value: '500000000000000000' // 0.5 ETH
      });
      
      const riskAssessment = RiskService.assessRisk(lowValueRequest);
      
      expect(riskAssessment.isHighRisk).toBe(false);
    });

    it('should identify transactions with sensitive function calls as high risk', () => {
      // Create a transaction that calls transferOwnership
      const sensitiveCallRequest = createMockDetectionRequest({
        input: '0xf2fde38b0000000000000000000000001234567890123456789012345678901234567890' // transferOwnership
      });
      
      const riskAssessment = RiskService.assessRisk(sensitiveCallRequest);
      
      expect(riskAssessment.isHighRisk).toBe(true);
      expect(riskAssessment.reason).toContain('Sensitive function call detected');
    });

    it('should identify transactions to known high-risk addresses as high risk', () => {
      // Create a transaction to a known high-risk address
      const riskyAddressRequest = createMockDetectionRequest({
        to: '0x0000000000000000000000000000000000000bad'
      });
      
      const riskAssessment = RiskService.assessRisk(riskyAddressRequest);
      
      expect(riskAssessment.isHighRisk).toBe(true);
      expect(riskAssessment.reason).toContain('Interaction with known high-risk address');
    });

    it('should identify transactions with deep call nesting as high risk', () => {
      // Create a deeply nested transaction call structure
      const nestedCallRequest = createMockDetectionRequest({
        calls: [
          {
            from: '0xfrom1',
            to: '0xto1',
            input: '0x01',
            gasUsed: '10000',
            calls: [
              {
                from: '0xfrom2',
                to: '0xto2',
                input: '0x02',
                gasUsed: '5000',
                calls: [
                  {
                    from: '0xfrom3',
                    to: '0xto3',
                    input: '0x03',
                    gasUsed: '2500',
                    calls: [
                      {
                        from: '0xfrom4',
                        to: '0xto4',
                        input: '0x04',
                        gasUsed: '1000',
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });
      
      const riskAssessment = RiskService.assessRisk(nestedCallRequest);
      
      expect(riskAssessment.isHighRisk).toBe(true);
      expect(riskAssessment.reason).toContain('Suspicious call pattern detected');
    });

    it('should not flag safe transactions as high risk', () => {
      // Create a simple, safe transaction
      const safeRequest = createMockDetectionRequest({
        value: '100000000000000000', // 0.1 ETH
        input: '0x12345678', // Non-sensitive function
        to: '0xsafeaddress',
        calls: [] // No nested calls
      });
      
      const riskAssessment = RiskService.assessRisk(safeRequest);
      
      expect(riskAssessment.isHighRisk).toBe(false);
      expect(riskAssessment.reason).toContain('No high risks detected');
    });
  });
});
