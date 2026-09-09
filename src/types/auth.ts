export type UserKind = 'MEMBER' | 'STAFF' | 'ADMIN';

export type BrawnUser = {
  id?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  userType?: UserKind;
  role?: string;
  staffId?: string;
  memberId?: string;
  gymId?: string;
  gymSlug?: string;
  permissions?: string[];
};

export type LoginInput = {
  username: string;
  password: string;
  remember?: boolean;
  gymSlug?: string;
};
