export type OfferRequestType = 'OC' | 'AC' | 'OC_AC';
export type OfferRequestStatus = 'Open' | 'Cancelled' | 'Fulfilled';

export type OfferRequest = {
  id: string;
  vehicleId: string;
  type: OfferRequestType;
  status: OfferRequestStatus;
  message?: string | null;
  createdAt: string; // ISO
  updatedAt?: string | null;

  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleRegistrationNumber?: string | null;
};

export type CreateOfferRequest = {
  vehicleId: string;
  type: OfferRequestType;
  message?: string | null;
};
