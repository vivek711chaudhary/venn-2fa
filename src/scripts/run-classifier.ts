#!/usr/bin/env ts-node

// This is a simple script to run the transaction classifier

import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import the classifier
import './transactionClassifier';

console.log('Transaction classifier script complete.'); 