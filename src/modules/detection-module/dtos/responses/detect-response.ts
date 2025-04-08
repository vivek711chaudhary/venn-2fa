import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DetectionResponse {
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @IsString()
    @IsOptional()
    requestId?: string;

    @IsBoolean()
    detected: boolean;

    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    protocolAddress?: string;

    @IsOptional()
    @IsString()
    protocolName?: string;

    constructor(data: {
        transactionId: string;
        requestId?: string;
        detected: boolean;
        message: string;
        protocolAddress?: string;
        protocolName?: string;
    }) {
        this.transactionId = data.transactionId;
        this.requestId = data.requestId;
        this.detected = data.detected;
        this.message = data.message;
        this.protocolAddress = data.protocolAddress;
        this.protocolName = data.protocolName;
    }
}
