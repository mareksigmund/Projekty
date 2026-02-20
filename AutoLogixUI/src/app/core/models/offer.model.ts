export type OfferStatus = 'Proposed' | 'Accepted' | 'Rejected' | 'Expired';
export type OfferType = 'OC' | 'AC' | 'OC_AC';

export type Offer = {
  id: string;
  vehicleId: string;
  insurerUserId?: string | null;

  offerRequestId?: string | null;

  type: OfferType;
  price: number;

  validFrom: string;
  validTo: string;

  description?: string | null;
  status: OfferStatus;

  createdAt: string;
  updatedAt?: string | null;
};
