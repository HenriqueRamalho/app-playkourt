export enum VenueMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  STAFF = 'staff',
}

export interface VenueMember {
  id: string;
  venueId: string;
  userId: string;
  role: VenueMemberRole;
  createdAt: Date;
}
