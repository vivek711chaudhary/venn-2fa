import axios from 'axios';
import { ethers } from 'ethers';

const { DETECTOR_ENDPOINT, INFURA_PROJECT_ID } = process.env;
const DetectorInterfaceURL = `${DETECTOR_ENDPOINT}/detector`;

interface ExternalRequest {
    id: string;
    chainId: number;
    hash: string;
    protocolName: string;
    protocolAddress: string;
    trace: TransactionTraceData;
    additionalData?: { [key: string]: any };
}

interface TransactionTraceData {
    from: string;
    gas: string;
    gasUsed: string;
    to: string;
    input: string;
    output: string;
    calls: TransactionTraceData[];
    value: string;
    type: string;
    error?: string;
    revertReason?: string;
    _callId: number;
}

interface ExternalResponse {
    requestId: string;
    chainId: number;
    detected: boolean;
}

// API call function
const sendExternalRequest = async (detectorName: string, req: ExternalRequest): Promise<ExternalResponse> => {
    try {
        const response = await axios.post<ExternalResponse>(`${DetectorInterfaceURL}/detect/${detectorName}`, req);
        return response.data;
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
};

// Example usage of the Detector Interface with actual data from ethers
async function detectorInterfaceExample() {
    const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);
    
    // Replace with an actual Ethereum transaction hash
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const transaction = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!transaction || !receipt) {
        console.error('Transaction or receipt not found');
        return;
    }

    const trace: TransactionTraceData = {
        from: transaction.from,
        gas: ethers.hexlify(transaction.gasLimit.toString()), // Convert BigNumber to hex string
        gasUsed: ethers.hexlify(receipt.gasUsed.toString()), // Convert BigNumber to hex string
        to: transaction.to || '',
        input: transaction.data,
        output: '', // Output would generally come from a trace of the transaction, which is more complex to fetch
        calls: [], // Calls would be filled if you have internal trace data
        value: ethers.hexlify(transaction.value.toString()), // Convert BigNumber to hex string
        type: transaction.type?.toString() || '0x0', // Convert transaction type to string
        _callId: 0
    };

    const exampleExternalRequest: ExternalRequest = {
        id: 'unique-id',
        chainId: Number(transaction.chainId.toString()),
        hash: transaction.hash,
        protocolName: 'ExampleProtocol',
        protocolAddress: transaction.to || '',
        trace: trace
    };

    try {
        const response = await sendExternalRequest('example-detector', exampleExternalRequest);
        console.log('External Request Response:', response);
    } catch (error) {
        console.error('Failed to send external request:', error);
    }
}

detectorInterfaceExample();
