export type ServiceEntryListItem = {
  id: string;
  serviceDate: string;
  mileageAtService?: number | null;
  title: string;
  cost?: number | null;

  workshopName?: string | null;
  nextServiceDate?: string | null;
  nextServiceMileage?: number | null;
};

export type ServiceEntryDetails = {
  id: string;
  vehicleId: string;

  serviceDate: string;
  mileageAtService?: number | null;

  title: string;
  description?: string | null;

  cost?: number | null;
  workshopName?: string | null;
  workshopAddress?: string | null;

  nextServiceDate?: string | null;
  nextServiceMileage?: number | null;

  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type ServiceEntryFormModel = {
  serviceDate: string;
  mileageAtService?: number | null;

  title: string;
  description?: string | null;

  cost?: number | null;
  workshopName?: string | null;
  workshopAddress?: string | null;

  nextServiceDate?: string | null;
  nextServiceMileage?: number | null;

  notes?: string | null;
};
