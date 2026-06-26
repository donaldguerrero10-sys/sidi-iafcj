export interface OrgUnitType {
  id:          string
  org_id:      string
  name:        string
  role_label:  string
  child_label: string | null
  rank:        number
  tier:        "gobierno" | "supervision" | "liderazgo"
}

export interface OrgUnit {
  id:        string
  org_id:    string
  type_id:   string
  parent_id: string | null
  name:      string
  metadata:  Record<string, unknown>
  created_at: string
  type?: OrgUnitType
}

export interface UserProfile {
  id:          string
  org_id:      string
  org_unit_id: string
  full_name:   string
  whatsapp:    string | null
  rank:        number
  created_at:  string
  org_unit?:   OrgUnit
}

export interface Report {
  id:           string
  org_unit_id:  string
  reported_by:  string
  week_start:   string
  attendance:   number
  visits:       number
  decisions:    number
  offerings:    number | null
  notes:        string | null
  created_at:   string
}

export interface Member {
  id:           string
  org_unit_id:  string
  full_name:    string
  phone:        string | null
  is_active:    boolean
  joined_at:    string
}

export interface Resource {
  id:          string
  title:       string
  type:        "curso" | "taller" | "manual" | "escuela" | "libro"
  category:    string
  description: string | null
  file_url:    string | null
  file_name:   string | null
  min_rank:    number
  max_rank:    number
}
