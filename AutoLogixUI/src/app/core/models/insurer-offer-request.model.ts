import { OfferRequestStatus, OfferRequestType } from './offer-request.model';

export type InsurerOfferRequest = {
  id: string;
  vehicleId: string;

  vehicleBrand: string;
  vehicleModel: string;
  vehicleRegistrationNumber: string;

  type: OfferRequestType;
  status: OfferRequestStatus;
  message?: string | null;

  createdAt: string;
  updatedAt?: string | null;
};
