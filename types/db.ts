export type ClientStatus =
  | 'contacted'
  | 'proposed'
  | 'negotiating'
  | 'active'
  | 'paused'
  | 'ended';

export type ChannelType = 'instagram' | 'tiktok' | 'youtube' | 'other';

export interface Client {
  id: number;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  status: ClientStatus;
  contract_start: string | null;
  contract_end: string | null;
  contract_amount: number | null;
  memo: string | null;
  manager_id: string | null;
  manager_name: string | null;
  contract_file_path: string | null;
  postal_code: string | null;
  region: string | null;
  sales_region: string | null;
  district: string | null;
  road_address: string | null;
  building_detail: string | null;
  category: string | null;
  first_contact_date: string | null;
  contract_product: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactStatus = 'active' | 'inactive' | 'blocked';
export type Gender = 'female' | 'male' | 'other';

export interface Influencer {
  id: number;
  channel: ChannelType;
  handle: string;
  followers: number;
  account_url: string | null;
  unit_price: number | null;
  memo: string | null;
  name_en: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_number: string | null;
  phone: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  street: string | null;
  age: number | null;
  gender: Gender | null;
  contact_status: ContactStatus;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: number;
  scheduled_at: string;
  client_id: number;
  influencer_id: number;
  memo: string | null;
  created_at: string;
  clients?: { company_name: string };
  influencers?: { handle: string; account_url: string | null };
}

export type SettlementStatus = 'pending' | 'done';

export interface Post {
  id: number;
  schedule_id: number | null;
  client_id: number;
  influencer_id: number;
  post_url: string | null;
  views: number;
  likes: number;
  comments: number;
  settlement_status: SettlementStatus;
  settled_on: string | null;
  payment_proof_path: string | null;
  created_at: string;
  updated_at: string;
  clients?: { company_name: string };
  influencers?: { handle: string; account_url: string | null; unit_price: number | null; name_en: string | null; bank_name: string | null; branch_name: string | null; account_number: string | null; phone: string | null; prefecture: string | null; city: string | null; street: string | null };
  uploaded_on: string | null;
  shares: number;
}
