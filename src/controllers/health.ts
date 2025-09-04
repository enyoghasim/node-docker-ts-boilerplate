import { Get, JsonController } from 'routing-controllers';
import { successResponse, ApiResponse } from '../utils/responseFactory';

@JsonController()
export class HealthController {
  @Get('/health')
  health(): ApiResponse<{ timestamp: string }> {
    return successResponse({ timestamp: new Date().toISOString() }, 'OK');
  }

  @Get('/status')
  status(): ApiResponse<{ service: string; timestamp: string }> {
    return successResponse(
      { service: 'api', timestamp: new Date().toISOString() },
      'status'
    );
  }
}
