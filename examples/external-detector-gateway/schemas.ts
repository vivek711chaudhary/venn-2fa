import { z } from "zod";

// Zod schemas for validation
const TraceLogSchema = z.object({
    address: z.string(),
    topics: z.array(z.string()),
    data: z.string(),
});

const TraceCallSchema = z.object({
    from: z.string(),
    to: z.string(),
    input: z.string(),
    output: z.string(),
    value: z.string(),
    gasUsed: z.string(),
});

const TraceSchema = z.object({
    transactionHash: z.string(),
    blockNumber: z.number(),
    from: z.string(),
    to: z.string(),
    value: z.string(),
    gas: z.string(),
    gasUsed: z.string(),
    input: z.string(),
    output: z.string(),
    calls: z.array(TraceCallSchema),
    logs: z.array(TraceLogSchema),
});

export const ExternalDetectorRequestBodySchema = z.object({
    id: z.string(),
    chainId: z.number(),
    hash: z.string(),
    protocolName: z.string(),
    protocolAddress: z.string(),
    trace: TraceSchema,
    additionalData: z.record(z.unknown()).optional(),
});

