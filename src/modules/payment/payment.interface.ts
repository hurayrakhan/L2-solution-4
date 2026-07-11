export interface IPaymentCreateSessionInput {
  rentalRequestId: string;
}

export interface IPaymentConfirmInput {
  rentalRequestId: string;
  transactionId: string;
  method?: string;
  status?: 'COMPLETED' | 'FAILED';
}
