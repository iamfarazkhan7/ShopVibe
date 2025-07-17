export class ApiResponse {
  static success(message: string, data?: any) {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, error?: string) {
    return {
      success: false,
      message,
      error,
    };
  }
}
