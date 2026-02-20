export type VehicleListItem = {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  year?: number | null;
  mileage?: number | null;
  allowInsuranceOffers?: boolean | null;
};

export type VehicleDetails = {
  id: string;
  userId: string;

  brand: string;
  model: string;
  version?: string | null;
  registrationNumber: string;
  vin?: string | null;

  year?: number | null;
  mileage?: number | null;
  fuelType?: string | null;
  engineCapacity?: number | null;
  enginePowerHp?: number | null;

  firstRegistrationDate?: string | null;
  technicalInspectionDueDate?: string | null;
  insuranceOcDueDate?: string | null;
  insuranceAcDueDate?: string | null;

  createdAt: string;
  updatedAt?: string | null;
  notes?: string | null;
  allowInsuranceOffers?: boolean | null;
};

export type VehicleFormModel = {
  brand: string;
  model: string;
  registrationNumber: string;

  version?: string | null;
  vin?: string | null;

  year?: number | null;
  mileage?: number | null;
  fuelType?: string | null;
  engineCapacity?: number | null;
  enginePowerHp?: number | null;

  firstRegistrationDate?: string | null;
  technicalInspectionDueDate?: string | null;
  insuranceOcDueDate?: string | null;
  insuranceAcDueDate?: string | null;

  notes?: string | null;
  allowInsuranceOffers?: boolean | null;
};

export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};
