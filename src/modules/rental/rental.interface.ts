import { RentalRequestStatus } from '@prisma/client';

export interface IRentalCreateInput {
  propertyId: string;
  startDate: string;
  endDate: string;
}

export interface IRentalStatusUpdateInput {
  status: RentalRequestStatus;
}
