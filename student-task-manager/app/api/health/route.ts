import { sendSuccess } from '@/lib/responseHandler';

export async function GET() {
    const healthData = {
        status: 'healthy',
        service: 'student-task-manager',
        environment: process.env.NODE_ENV || 'development',
    };

    return sendSuccess(healthData, 'Service is healthy');
}
