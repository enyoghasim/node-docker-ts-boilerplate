export type ApiResponse<T = any> = {
  message: string;
  data?: T;
  success: boolean;
};

export function successResponse<T = any>(
  data: T,
  message = 'OK'
): ApiResponse<T> {
  return {
    message,
    data,
    success: true,
  };
}

export function errorResponse(message = 'Error', data?: any): ApiResponse {
  return {
    message,
    data,
    success: false,
  };
}
