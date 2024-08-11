import { ethers } from 'ethers';
import axios from 'axios';

const { DETECTOR_ENDPOINT, INFURA_PROJECT_ID } = process.env;
const TransactionInterfaceURL = `${DETECTOR_ENDPOINT}/transaction`;

interface SignRequest {
    requestId: string;
    chainId: number;
    to: string;
    from: string;
    value: string;
    data?: string;
    inspectOnly?: boolean;
}

interface SignResponse {
    requestId: string;
    approved: boolean;
    signature: { x: string; y: string; };
    metadata: { operator: string; approved: boolean; signature: { x: string; y: string; }; }[];
}

// API call function
const sendSignRequest = async (req: SignRequest): Promise<SignResponse> => {
    try {
        const response = await axios.post<SignResponse>(`${TransactionInterfaceURL}/signer`, req);
        return response.data;
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
};

// Example usage with an Ethereum provider
async function transactionInterfaceExample() {
    const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);

    // Fetch a real transaction from the Ethereum mainnet
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'; // Replace with a real transaction hash
    const transaction = await provider.getTransaction(txHash);

    if (!transaction) {
        console.error('Transaction not found');
        return;
    }

    const exampleSignRequest: SignRequest = {
        requestId: 'unique-request-id',
        chainId: Number(transaction.chainId.toString()), // Use the chainId from the transaction
        to: transaction.to || '', // The recipient address
        from: transaction.from, // The sender address
        value: ethers.hexlify(transaction.value.toString()), // Convert bigint to hex string
        data: transaction.data, // The input data of the transaction
        inspectOnly: false
    };

    try {
        const response = await sendSignRequest(exampleSignRequest);
        console.log('Sign Request Response:', response);
    } catch (error) {
        console.error('Failed to send sign request:', error);
    }
}

transactionInterfaceExample();
