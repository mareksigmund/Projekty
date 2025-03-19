// src/app/models/user.model.ts

import { Address } from "./address.model";


export interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType?: string;
  phone?: string;
  address?: Address;
  avatar?: string;
}
