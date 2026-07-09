export class AppError extends Error {
  public statusCode: number;
  public errorDetails: any;

  constructor(message: string, statusCode: number, errorDetails: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
