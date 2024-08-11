import axios from 'axios';

const { DETECTOR_ENDPOINT } = process.env;
const ManagementInterfaceURL = `${DETECTOR_ENDPOINT}/management`;

// Error handling wrapper
async function handleErrors<T>(fn: () => Promise<T>): Promise<T | void> {
    try {
        return await fn();
    } catch (error) {
        console.error('Error occurred:', error);
        throw error; // Ensure that errors are not silently swallowed
    }
}

// API call functions wrapped with error handling
const getStatus = async () => handleErrors(async () => (await axios.get(`${ManagementInterfaceURL}/api/status`)).data);

const getMetrics = async () => handleErrors(async () => (await axios.get(`${ManagementInterfaceURL}/api/metrics`)).data);

// Example usage of the Management Interface
async function managementInterfaceExample() {
    const status = await getStatus();
    console.log('Service Status:', status);

    const metrics = await getMetrics();
    console.log('Service Metrics:', metrics);
}

managementInterfaceExample();
