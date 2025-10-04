import { BaseEntity, Role, Status, UserPermissions } from './common';

export interface User extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: Role;
  status: Status;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at?: string;
  preferences: UserPreferences;
  permissions: UserPermissions;
}

export interface UserProfile {
  user_id: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: Address;
  emergency_contact?: EmergencyContact;
  notes?: string;
  marketing_consent: boolean;
  sms_consent: boolean;
}

export interface Address {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  state?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notification_email: boolean;
  notification_sms: boolean;
  notification_push: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: Role;
  send_invitation?: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: Role;
  status?: Status;
  preferences?: Partial<UserPreferences>;
}