export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist'
export type Sex = 'male' | 'female'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'
export type SmokingStatus = 'never' | 'former' | 'current'
export type ChestPainType = 'none' | 'typical' | 'atypical' | 'non_cardiac'
export type PalpitationFrequency = 'none' | 'occasional' | 'frequent' | 'constant'
export type SyncopeType = 'none' | 'pre_syncope' | 'syncope'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type PrescriptionStatus = 'draft' | 'finalized' | 'voided'
export type AppointmentType = 'new' | 'follow_up' | 'procedure' | 'telemedicine'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no_show'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export interface Patient {
  id: string
  legacy_id?: number
  full_name: string
  full_name_ar?: string
  date_of_birth: string
  sex: Sex
  marital_status?: MaritalStatus
  phone?: string
  phone_alt?: string
  email?: string
  address?: string
  smoking_status?: SmokingStatus
  smoking_packs_day?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface PresentHistory {
  id: string
  patient_id: string
  recorded_at: string
  recorded_by: string
  chest_pain?: ChestPainType
  chest_pain_remarks?: string
  dyspnea_exertional: boolean
  dyspnea_pnd: boolean
  dyspnea_orthopnea: boolean
  dyspnea_grade?: number
  palpitations?: PalpitationFrequency
  syncope?: SyncopeType
  lower_limb_edema: boolean
  abdominal_swelling: boolean
  low_cardiac_output_dizziness: boolean
  low_cardiac_output_blurring: boolean
  low_cardiac_output_fatigue: boolean
  neurological_symptoms?: string
  git_symptoms: boolean
  urinary_symptoms: boolean
  chest_symptoms: boolean
  remarks?: string
  created_at: string
  updated_at: string
}

export interface PastFamilyHistory {
  id: string
  patient_id: string
  diabetes: boolean
  hypertension: boolean
  rheumatic_heart_disease: boolean
  ischemic_heart_disease: boolean
  cabg?: string
  valve_replacement?: string
  other_conditions?: string
  family_consanguinity: boolean
  family_hypertension: boolean
  family_diabetes: boolean
  family_ihd: boolean
  family_other?: string
  comments?: string
  updated_at: string
  updated_by: string
}

export interface Examination {
  id: string
  patient_id: string
  examined_at: string
  examined_by: string
  pulse_bpm?: number
  bp_systolic?: number
  bp_diastolic?: number
  weight_kg?: number
  height_cm?: number
  bmi?: number
  activity_level?: ActivityLevel
  head_neck?: string
  upper_limb?: string
  lower_limb?: string
  abdomen?: string
  chest?: string
  neurology?: string
  cardiac_apex?: string
  cardiac_s1: boolean
  cardiac_s2: boolean
  cardiac_s3: boolean
  cardiac_s4: boolean
  cardiac_murmurs?: string
  cardiac_additional_sounds?: string
  remarks?: string
  created_at: string
  updated_at: string
}

export interface LabResult {
  id: string
  investigation_id: string
  test_name: string
  value: string
  unit?: string
  reference_range?: string
  is_abnormal: boolean
}

export interface Investigation {
  id: string
  patient_id: string
  investigation_date: string
  recorded_by: string
  ecg_result?: string
  stress_test?: string
  cardiac_cath?: string
  echo_lvedd?: number
  echo_lvesd?: number
  echo_ivs?: number
  echo_pwt?: number
  echo_fs?: number
  echo_ef?: number
  echo_ao?: number
  echo_la?: number
  echo_ao_valve?: string
  echo_mit_valve?: string
  echo_pulm_valve?: string
  echo_tric_valve?: string
  diagnosis?: string
  remarks?: string
  lab_results: LabResult[]
  created_at: string
  updated_at: string
}

export interface FollowUp {
  id: string
  patient_id: string
  visit_date: string
  seen_by: string
  complaint?: string
  present_history?: string
  pulse_bpm?: number
  bp_systolic?: number
  bp_diastolic?: number
  examination?: string
  investigation?: string
  diagnosis?: string
  plan?: string
  next_follow_up?: string
  created_at: string
  updated_at: string
}

export interface Medication {
  id: string
  name: string
  name_ar?: string
  generic_name?: string
  category?: string
  default_dosage?: string
  contraindications?: string
  interactions?: Record<string, unknown>
  is_active: boolean
  created_at: string
}

export interface PatientMedication {
  id: string
  patient_id: string
  medication_id: string
  dosage: string
  frequency: string
  instructions?: string
  instructions_ar?: string
  started_at: string
  ended_at?: string
  prescribed_by: string
  reason_stopped?: string
  created_at: string
  updated_at: string
}

export interface PrescriptionItem {
  id: string
  prescription_id: string
  medication_id: string
  dosage: string
  frequency: string
  duration?: string
  instructions?: string
  instructions_ar?: string
  sort_order: number
}

export interface Prescription {
  id: string
  patient_id: string
  prescribed_by: string
  prescribed_at: string
  status: PrescriptionStatus
  finalized_at?: string
  voided_at?: string
  void_reason?: string
  notes?: string
  pdf_path?: string
  items: PrescriptionItem[]
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  type: AppointmentType
  status: AppointmentStatus
  notes?: string
  reminder_sent: boolean
  created_by: string
  created_at: string
  updated_at: string
}
