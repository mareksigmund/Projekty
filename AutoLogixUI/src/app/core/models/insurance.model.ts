export type InsuranceTypeFilter = 'ANY' | 'OC' | 'AC';

export type InsuranceExpiringVehicle = {
  vehicleId: string;
  brand: string;
  model: string;
  registrationNumber: string;

  ocDueDate?: string | null;
  ocDaysLeft?: number | null;

  acDueDate?: string | null;
  acDaysLeft?: number | null;
};

export type OfferStatus = 'Proposed' | 'Accepted' | 'Rejected' | 'Expired';
export type OfferType = 'OC' | 'AC' | 'OC_AC';

export type InsuranceOffer = {
  id: string;

  vehicleId: string;
  insurerUserId?: string | null;
  offerRequestId?: string | null;

  type: OfferType;
  price: number;

  validFrom: string; // ISO
  validTo: string; // ISO

  description?: string | null;
  status: OfferStatus;

  createdAt: string;
  updatedAt?: string | null;
};

// payload dla POST /insurer/offers (MVP)
export type CreateInsurerOfferPayload = {
  offerRequestId?: string | null;
  vehicleId?: string | null;

  type: OfferType;
  price: number;

  validFrom: string; // ISO
  validTo: string; // ISO

  description?: string | null;
};

export type InsurerVehicleDetails = {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;

  year?: number | null;
  mileage?: number | null;

  vin?: string | null;
  fuelType?: string | null;
  engineCapacity?: number | null;
  enginePowerHp?: number | null;

  insuranceOcDueDate?: string | null;
  insuranceAcDueDate?: string | null;

  allowInsuranceOffers: boolean;
};
