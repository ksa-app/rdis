export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  logo_url?: string;
  branding_color?: string;
  created_at: string;
};

export type Membership = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'recruiter' | 'medical_officer' | 'accounts' | 'data_entry' | 'support' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
};

export type Profile = {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
};

export type Candidate = {
  id: string;
  organization_id: string;
  name: string;
  passport_no: string;
  email?: string;
  phone?: string;
  status: 'new' | 'processing' | 'completed' | 'rejected' | 'onhold';
  received_date?: string;
  agent_id?: string;
  created_at: string;
};

export type Medical = {
  id: string;
  organization_id: string;
  candidate_id: string;
  medical_date?: string;
  status: 'N/A' | 'NEW' | 'FIT' | 'UNFIT' | 'USED' | 'EXPIRED';
  created_at: string;
};

export type Visa = {
  id: string;
  organization_id: string;
  candidate_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'USED';
  issue_date?: string;
  expiry_date?: string;
  created_at: string;
};
