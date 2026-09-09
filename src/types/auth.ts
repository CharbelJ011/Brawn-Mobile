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
  memberNumber?: string;
  gymId?: string;
  gymSlug?: string;
  gymName?: string;
  permissions?: string[];
};

export type LoginInput = {
  gymId: string;
  username: string;
  password: string;
  remember?: boolean;
};
