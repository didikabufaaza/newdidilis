import bcrypt from "bcryptjs";

export interface MockUser {
  id: number;
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "superadmin" | "admin" | "doctor" | "analyst" | "receptionist";
  phone: string | null;
  active: boolean;
  approved: boolean;
  tenantId: number | null;
  parentId: number | null;
  masaAktif: string | null;
  imgAccess: boolean;
}

export interface MockSubAccount {
  id: number;
  parentId: number;
  username: string;
  name: string;
  email: string;
  password: string;
  notes: string;
  createdAt: Date;
}

export interface MockPatient {
  id: number;
  medicalRecordNo: string;
  noLab: string | null;
  noPermintaan: string | null;
  name: string;
  gender: "male" | "female";
  dateOfBirth: string;
  age: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bloodType: string | null;
  insuranceNo: string | null;
  doctorId: number | null;
  room: string | null;
  diagnosis: string | null;
  createdAt: Date;
  updatedAt: Date;
  doctorName: string | null;
  doctorSpecialization: string | null;
}

export interface MockDoctor {
  id: number;
  name: string;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  hospital: string | null;
  licenseNo: string | null;
  active: boolean;
  createdAt: Date;
}

export interface MockTestCategory {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number | null;
}

export interface MockTestCatalog {
  id: number;
  code: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  sampleType: string;
  unit: string | null;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  price: string;
  turnaroundHours: number | null;
  active: boolean;
  createdAt: Date;
}

export interface MockLabOrder {
  id: number;
  orderNo: string;
  noPermintaan: string | null;
  noLab: string | null;
  patientId: number;
  patientName: string;
  patientMrn: string;
  patientGender: string;
  patientDob: string;
  patientPhone: string | null;
  patientBloodType: string | null;
  patientAge: string | null;
  patientRoom: string | null;
  doctorId: number | null;
  doctorName: string | null;
  doctorSpecialization: string | null;
  doctorHospital: string | null;
  room: string | null;
  age: string | null;
  status: string;
  priority: string;
  clinicalNotes: string | null;
  diagnosis: string | null;
  totalPrice: string;
  requestDate: Date | null;
  resultDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  collectedAt: Date | null;
  completedAt: Date | null;
  validatedAt: Date | null;
}

export interface MockOrderItem {
  id: number;
  testId: number;
  testCode: string;
  testName: string;
  categoryName: string | null;
  result: string | null;
  resultNumeric: string | null;
  resultStatus: string;
  unit: string | null;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  flag: string | null;
  notes: string | null;
  enteredAt: Date | null;
  validatedAt: Date | null;
}

export interface MockTestPackage {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: number;
    testId: number;
    testCode: string;
    testName: string;
    categoryName: string | null;
    unit: string | null;
    referenceMin: string | null;
    referenceMax: string | null;
    referenceText: string | null;
    price: string;
  }>;
}

export interface MockLetterhead {
  id: number;
  pemda: string | null;
  hospitalName: string | null;
  hospitalAddress: string | null;
  hospitalEmail: string | null;
  hospitalPhone: string | null;
  logoLeft: string | null;
  logoRight: string | null;
}

// --- Seed data ---
let _passwordHash: string | null = null;
async function getPasswordHash() {
  if (!_passwordHash) _passwordHash = await bcrypt.hash("password123", 10);
  return _passwordHash;
}

export async function getMockUsers(): Promise<MockUser[]> {
  const hash = await getPasswordHash();
  return [
    { id: 1, username: "admin", name: "Admin Utama", email: "admin@labklinik.id", passwordHash: hash, role: "superadmin", phone: "081234567890", active: true, approved: true, tenantId: null, parentId: null, masaAktif: "2027-07-19", imgAccess: true },
    { id: 2, username: "bastian", name: "Bastian, S.Si.T., M.Biomed", email: "bastiandarwin51@gmail.com", passwordHash: hash, role: "admin", phone: null, active: true, approved: true, tenantId: 1, parentId: null, masaAktif: "2027-08-14", imgAccess: false },
    { id: 3, username: "ddk", name: "ABUFAAZA", email: "abufaaza01@gmail.com", passwordHash: hash, role: "admin", phone: null, active: true, approved: true, tenantId: 1, parentId: null, masaAktif: "2027-08-16", imgAccess: false },
    { id: 4, username: "didik", name: "M.Didik Wahyudi, S.Tr.Kes", email: "didiklabor@gmail.com", passwordHash: hash, role: "superadmin", phone: null, active: true, approved: true, tenantId: null, parentId: null, masaAktif: "2027-07-21", imgAccess: true },
    { id: 5, username: "labor", name: "Laboratorium RS Puri Palembang", email: "labklinikpuri@gmail.com", passwordHash: hash, role: "admin", phone: null, active: true, approved: true, tenantId: 1, parentId: null, masaAktif: "2027-08-18", imgAccess: false },
  ];
}

// In-memory mutable mock users for mock mode
let _mutableMockUsers: MockUser[] | null = null;
export async function getMutableMockUsers(): Promise<MockUser[]> {
  if (!_mutableMockUsers) {
    _mutableMockUsers = await getMockUsers();
  }
  return _mutableMockUsers;
}

export function getMockSubAccounts(): MockSubAccount[] {
  return [
    { id: 101, parentId: 1, username: "reza_lab", name: "Reza Pahlevi", email: "reza@labklinik.id", password: "password123", notes: "Analis shift pagi", createdAt: new Date("2024-06-01") },
    { id: 102, parentId: 1, username: "sari_lab", name: "Sari Dewi", email: "sari.lab@labklinik.id", password: "password123", notes: "Analis shift malam", createdAt: new Date("2024-07-15") },
  ];
}

// In-memory mutable sub-accounts for mock mode
let _mutableMockSubAccounts: MockSubAccount[] | null = null;
export function getMutableMockSubAccounts(): MockSubAccount[] {
  if (!_mutableMockSubAccounts) {
    _mutableMockSubAccounts = getMockSubAccounts();
  }
  return _mutableMockSubAccounts;
}

export const mockDoctors: MockDoctor[] = [
  { id: 1, name: "Dr. Andi Prasetyo, Sp.PD", specialization: "Penyakit Dalam", phone: "08211111111", email: "andi.prasetyo@rs-sehat.id", hospital: "RS Sehat Sentosa", licenseNo: "SIP-JKT-2020-001", active: true, createdAt: new Date("2024-01-15") },
  { id: 2, name: "Dr. Maya Sari, Sp.OG", specialization: "Obstetri & Ginekologi", phone: "08222222222", email: "maya.sari@rs-harapan.id", hospital: "RS Harapan Bunda", licenseNo: "SIP-JKT-2020-002", active: true, createdAt: new Date("2024-01-15") },
  { id: 3, name: "Dr. Faisal Rahman, Sp.PK", specialization: "Patologi Klinik", phone: "08233333333", email: "faisal@rs-medika.id", hospital: "RS Medika Utama", licenseNo: "SIP-JKT-2020-003", active: true, createdAt: new Date("2024-01-15") },
  { id: 4, name: "Dr. Linda Hartono, Sp.A", specialization: "Anak", phone: "08244444444", email: "linda@rs-bunda.id", hospital: "RS Bunda Mulia", licenseNo: "SIP-JKT-2020-004", active: true, createdAt: new Date("2024-01-15") },
  { id: 5, name: "Dr. Surya Wijaya, Sp.JP", specialization: "Jantung & Pembuluh Darah", phone: "08255555555", email: "surya@rs-jantung.id", hospital: "RS Jantung Harapan", licenseNo: "SIP-JKT-2020-005", active: true, createdAt: new Date("2024-01-15") },
];

export const mockPatients: MockPatient[] = [
  { id: 1, medicalRecordNo: "RM-2024-0001", noLab: "LAB-2024-0001", noPermintaan: "REQ-2024-0001", name: "Ahmad Hidayat", gender: "male", dateOfBirth: "1985-03-15", age: "41 Tahun", phone: "08129876543", email: null, address: "Jl. Sudirman No. 45, Jakarta Selatan", bloodType: "A+", insuranceNo: "BPJS-001234567", doctorId: 1, room: null, diagnosis: null, createdAt: new Date("2024-01-10"), updatedAt: new Date("2024-01-10"), doctorName: "Dr. Andi Prasetyo, Sp.PD", doctorSpecialization: "Penyakit Dalam" },
  { id: 2, medicalRecordNo: "RM-2024-0002", noLab: "LAB-2024-0002", noPermintaan: "REQ-2024-0002", name: "Siti Nurhaliza", gender: "female", dateOfBirth: "1990-07-22", age: "36 Tahun", phone: "08138765432", email: null, address: "Jl. Gatot Subroto No. 12, Jakarta Pusat", bloodType: "B+", insuranceNo: "BPJS-001234568", doctorId: 2, room: null, diagnosis: null, createdAt: new Date("2024-01-11"), updatedAt: new Date("2024-01-11"), doctorName: "Dr. Maya Sari, Sp.OG", doctorSpecialization: "Obstetri & Ginekologi" },
  { id: 3, medicalRecordNo: "RM-2024-0003", noLab: "LAB-2024-0003", noPermintaan: "REQ-2024-0003", name: "Bambang Wijaya", gender: "male", dateOfBirth: "1978-11-08", age: "48 Tahun", phone: "08147654321", email: null, address: "Jl. Thamrin No. 78, Jakarta Pusat", bloodType: "O+", insuranceNo: "BPJS-001234569", doctorId: 1, room: null, diagnosis: "Suspek anemia", createdAt: new Date("2024-01-12"), updatedAt: new Date("2024-01-12"), doctorName: "Dr. Andi Prasetyo, Sp.PD", doctorSpecialization: "Penyakit Dalam" },
  { id: 4, medicalRecordNo: "RM-2024-0004", noLab: "LAB-2024-0004", noPermintaan: "REQ-2024-0004", name: "Ratna Dewi", gender: "female", dateOfBirth: "1995-01-30", age: "31 Tahun", phone: "08156543210", email: null, address: "Jl. Kuningan No. 23, Jakarta Selatan", bloodType: "AB+", insuranceNo: null, doctorId: 3, room: null, diagnosis: "Evaluasi hepatitis", createdAt: new Date("2024-01-13"), updatedAt: new Date("2024-01-13"), doctorName: "Dr. Faisal Rahman, Sp.PK", doctorSpecialization: "Patologi Klinik" },
  { id: 5, medicalRecordNo: "RM-2024-0005", noLab: "LAB-2024-0005", noPermintaan: "REQ-2024-0005", name: "Hendra Gunawan", gender: "male", dateOfBirth: "1970-06-14", age: "56 Tahun", phone: "08165432109", email: null, address: "Jl. Rasuna Said No. 56, Jakarta Selatan", bloodType: "O-", insuranceNo: "BPJS-001234570", doctorId: 5, room: null, diagnosis: "Suspek sindrom koroner akut", createdAt: new Date("2024-01-14"), updatedAt: new Date("2024-01-14"), doctorName: "Dr. Surya Wijaya, Sp.JP", doctorSpecialization: "Jantung & Pembuluh Darah" },
  { id: 6, medicalRecordNo: "RM-2024-0006", noLab: "LAB-2024-0006", noPermintaan: "REQ-2024-0006", name: "Putri Anggraini", gender: "female", dateOfBirth: "1988-09-25", age: "38 Tahun", phone: "08174321098", email: null, address: "Jl. HR Rasuna Said Kav. C-11, Jakarta", bloodType: "A-", insuranceNo: null, doctorId: 4, room: null, diagnosis: "Diabetes mellitus tipe 2", createdAt: new Date("2024-01-08"), updatedAt: new Date("2024-01-08"), doctorName: "Dr. Linda Hartono, Sp.A", doctorSpecialization: "Anak" },
  { id: 7, medicalRecordNo: "RM-2024-0007", noLab: "LAB-2024-0007", noPermintaan: "REQ-2024-0007", name: "Rizki Pratama", gender: "male", dateOfBirth: "2000-12-05", age: "25 Tahun", phone: "08183210987", email: null, address: "Jl. Mampang Prapatan No. 100, Jakarta", bloodType: "B-", insuranceNo: "BPJS-001234571", doctorId: 1, room: null, diagnosis: null, createdAt: new Date("2024-01-12"), updatedAt: new Date("2024-01-12"), doctorName: "Dr. Andi Prasetyo, Sp.PD", doctorSpecialization: "Penyakit Dalam" },
  { id: 8, medicalRecordNo: "RM-2024-0008", noLab: "LAB-2024-0008", noPermintaan: "REQ-2024-0008", name: "Nurul Hidayah", gender: "female", dateOfBirth: "1982-04-18", age: "44 Tahun", phone: "08192109876", email: null, address: "Jl. Kemang Raya No. 33, Jakarta Selatan", bloodType: "AB-", insuranceNo: "BPJS-001234572", doctorId: 3, room: null, diagnosis: "Suspek demam tifoid", createdAt: new Date("2024-01-14"), updatedAt: new Date("2024-01-14"), doctorName: "Dr. Faisal Rahman, Sp.PK", doctorSpecialization: "Patologi Klinik" },
];

export const mockTestCategories: MockTestCategory[] = [
  { id: 1, name: "Hematologi", description: "Pemeriksaan darah lengkap", sortOrder: 1 },
  { id: 2, name: "Kimia Klinik", description: "Pemeriksaan fungsi organ", sortOrder: 2 },
  { id: 3, name: "Urinalisis", description: "Pemeriksaan urine", sortOrder: 3 },
  { id: 4, name: "Serologi", description: "Pemeriksaan antibodi dan antigen", sortOrder: 4 },
  { id: 5, name: "Endokrin", description: "Pemeriksaan hormonal", sortOrder: 5 },
  { id: 6, name: "Koagulasi", description: "Pemeriksaan pembekuan darah", sortOrder: 6 },
];

export const mockTestCatalog: MockTestCatalog[] = [
  { id: 1, code: "HEM-001", name: "Hemoglobin (Hb)", categoryId: 1, categoryName: "Hematologi", sampleType: "blood", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, price: "35000", turnaroundHours: 2, active: true, createdAt: new Date("2024-01-01") },
  { id: 2, code: "HEM-002", name: "Hematokrit (Ht)", categoryId: 1, categoryName: "Hematologi", sampleType: "blood", unit: "%", referenceMin: "36", referenceMax: "48", referenceText: null, price: "35000", turnaroundHours: 2, active: true, createdAt: new Date("2024-01-01") },
  { id: 3, code: "HEM-003", name: "Leukosit (WBC)", categoryId: 1, categoryName: "Hematologi", sampleType: "blood", unit: "ribu/µL", referenceMin: "4.0", referenceMax: "11.0", referenceText: null, price: "40000", turnaroundHours: 2, active: true, createdAt: new Date("2024-01-01") },
  { id: 4, code: "HEM-004", name: "Trombosit (PLT)", categoryId: 1, categoryName: "Hematologi", sampleType: "blood", unit: "ribu/µL", referenceMin: "150", referenceMax: "400", referenceText: null, price: "40000", turnaroundHours: 2, active: true, createdAt: new Date("2024-01-01") },
  { id: 5, code: "HEM-005", name: "Eritrosit (RBC)", categoryId: 1, categoryName: "Hematologi", sampleType: "blood", unit: "juta/µL", referenceMin: "4.0", referenceMax: "5.5", referenceText: null, price: "35000", turnaroundHours: 2, active: true, createdAt: new Date("2024-01-01") },
  { id: 6, code: "HEM-006", name: "LED (ESR)", categoryId: 1, categoryName: "Hematologi", sampleType: "blood", unit: "mm/jam", referenceMin: "0", referenceMax: "20", referenceText: null, price: "30000", turnaroundHours: 3, active: true, createdAt: new Date("2024-01-01") },
  { id: 7, code: "KIM-001", name: "Glukosa Darah Puasa", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "blood", unit: "mg/dL", referenceMin: "70", referenceMax: "100", referenceText: null, price: "45000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 8, code: "KIM-002", name: "Glukosa Darah 2 Jam PP", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "blood", unit: "mg/dL", referenceMin: "70", referenceMax: "140", referenceText: null, price: "45000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 9, code: "KIM-003", name: "Kolesterol Total", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "mg/dL", referenceMin: "0", referenceMax: "200", referenceText: null, price: "50000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 10, code: "KIM-004", name: "Trigliserida", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "mg/dL", referenceMin: "0", referenceMax: "150", referenceText: null, price: "50000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 11, code: "KIM-005", name: "HDL Kolesterol", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "mg/dL", referenceMin: "40", referenceMax: "60", referenceText: null, price: "55000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 12, code: "KIM-006", name: "LDL Kolesterol", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "mg/dL", referenceMin: "0", referenceMax: "100", referenceText: null, price: "55000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 13, code: "KIM-007", name: "SGOT (AST)", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "U/L", referenceMin: "0", referenceMax: "40", referenceText: null, price: "45000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 14, code: "KIM-008", name: "SGPT (ALT)", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "U/L", referenceMin: "0", referenceMax: "41", referenceText: null, price: "45000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 15, code: "KIM-009", name: "Ureum (BUN)", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "mg/dL", referenceMin: "10", referenceMax: "50", referenceText: null, price: "45000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 16, code: "KIM-010", name: "Kreatinin", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "mg/dL", referenceMin: "0.6", referenceMax: "1.2", referenceText: null, price: "45000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 17, code: "KIM-011", name: "Asam Urat", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "serum", unit: "mg/dL", referenceMin: "2.4", referenceMax: "7.0", referenceText: null, price: "45000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 18, code: "KIM-012", name: "HbA1c", categoryId: 2, categoryName: "Kimia Klinik", sampleType: "blood", unit: "%", referenceMin: "4.0", referenceMax: "5.6", referenceText: null, price: "150000", turnaroundHours: 6, active: true, createdAt: new Date("2024-01-01") },
  { id: 19, code: "URI-001", name: "Urinalisis Lengkap", categoryId: 3, categoryName: "Urinalisis", sampleType: "urine", unit: "", referenceMin: null, referenceMax: null, referenceText: "Lihat keterangan", price: "50000", turnaroundHours: 2, active: true, createdAt: new Date("2024-01-01") },
  { id: 20, code: "URI-002", name: "Protein Urine", categoryId: 3, categoryName: "Urinalisis", sampleType: "urine", unit: "mg/dL", referenceMin: null, referenceMax: null, referenceText: "Negatif", price: "35000", turnaroundHours: 2, active: true, createdAt: new Date("2024-01-01") },
  { id: 21, code: "SER-001", name: "HBsAg (Hepatitis B)", categoryId: 4, categoryName: "Serologi", sampleType: "serum", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", price: "85000", turnaroundHours: 6, active: true, createdAt: new Date("2024-01-01") },
  { id: 22, code: "SER-002", name: "Anti-HCV (Hepatitis C)", categoryId: 4, categoryName: "Serologi", sampleType: "serum", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", price: "120000", turnaroundHours: 6, active: true, createdAt: new Date("2024-01-01") },
  { id: 23, code: "SER-003", name: "Anti-HIV", categoryId: 4, categoryName: "Serologi", sampleType: "serum", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", price: "100000", turnaroundHours: 6, active: true, createdAt: new Date("2024-01-01") },
  { id: 24, code: "SER-004", name: "Widal Test", categoryId: 4, categoryName: "Serologi", sampleType: "serum", unit: "", referenceMin: null, referenceMax: null, referenceText: "Negatif (Titer < 1/80)", price: "75000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 25, code: "END-001", name: "TSH", categoryId: 5, categoryName: "Endokrin", sampleType: "serum", unit: "µIU/mL", referenceMin: "0.4", referenceMax: "4.0", referenceText: null, price: "175000", turnaroundHours: 8, active: true, createdAt: new Date("2024-01-01") },
  { id: 26, code: "END-002", name: "Free T4", categoryId: 5, categoryName: "Endokrin", sampleType: "serum", unit: "ng/dL", referenceMin: "0.8", referenceMax: "1.8", referenceText: null, price: "175000", turnaroundHours: 8, active: true, createdAt: new Date("2024-01-01") },
  { id: 27, code: "KOA-001", name: "PT (Prothrombin Time)", categoryId: 6, categoryName: "Koagulasi", sampleType: "plasma", unit: "detik", referenceMin: "10", referenceMax: "14", referenceText: null, price: "85000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
  { id: 28, code: "KOA-002", name: "APTT", categoryId: 6, categoryName: "Koagulasi", sampleType: "plasma", unit: "detik", referenceMin: "25", referenceMax: "35", referenceText: null, price: "85000", turnaroundHours: 4, active: true, createdAt: new Date("2024-01-01") },
];

const now = new Date();
const oneDay = 24 * 60 * 60 * 1000;

export const mockLabOrders: MockLabOrder[] = [
  { id: 1, orderNo: "LAB-2024-0001", noPermintaan: "REQ-2024-0001", noLab: "LAB-2024-0001", patientId: 1, patientName: "Ahmad Hidayat", patientMrn: "RM-2024-0001", patientGender: "male", patientDob: "1985-03-15", patientPhone: "08129876543", patientBloodType: "A+", patientAge: "41 Tahun", patientRoom: null, doctorId: 1, doctorName: "Dr. Andi Prasetyo, Sp.PD", doctorSpecialization: "Penyakit Dalam", doctorHospital: "RS Sehat Sentosa", room: null, age: "41 Tahun", status: "completed", priority: "normal", clinicalNotes: "Pemeriksaan rutin tahunan", diagnosis: "Medical check up", totalPrice: "240000", requestDate: new Date(now.getTime() - 5 * oneDay), resultDate: new Date(now.getTime() - 4 * oneDay), createdAt: new Date(now.getTime() - 5 * oneDay), updatedAt: new Date(now.getTime() - 4 * oneDay), collectedAt: null, completedAt: new Date(now.getTime() - 4 * oneDay), validatedAt: null },
  { id: 2, orderNo: "LAB-2024-0002", noPermintaan: "REQ-2024-0002", noLab: "LAB-2024-0002", patientId: 2, patientName: "Siti Nurhaliza", patientMrn: "RM-2024-0002", patientGender: "female", patientDob: "1990-07-22", patientPhone: "08138765432", patientBloodType: "B+", patientAge: "36 Tahun", patientRoom: null, doctorId: 2, doctorName: "Dr. Maya Sari, Sp.OG", doctorSpecialization: "Obstetri & Ginekologi", doctorHospital: "RS Harapan Bunda", room: null, age: "36 Tahun", status: "validated", priority: "normal", clinicalNotes: "Kontrol kehamilan trimester 2", diagnosis: "Antenatal care", totalPrice: "255000", requestDate: new Date(now.getTime() - 4 * oneDay), resultDate: new Date(now.getTime() - 3 * oneDay), createdAt: new Date(now.getTime() - 4 * oneDay), updatedAt: new Date(now.getTime() - 3 * oneDay), collectedAt: null, completedAt: null, validatedAt: new Date(now.getTime() - 3 * oneDay) },
  { id: 3, orderNo: "LAB-2024-0003", noPermintaan: "REQ-2024-0003", noLab: "LAB-2024-0003", patientId: 3, patientName: "Bambang Wijaya", patientMrn: "RM-2024-0003", patientGender: "male", patientDob: "1978-11-08", patientPhone: "08147654321", patientBloodType: "O+", patientAge: "48 Tahun", patientRoom: null, doctorId: 1, doctorName: "Dr. Andi Prasetyo, Sp.PD", doctorSpecialization: "Penyakit Dalam", doctorHospital: "RS Sehat Sentosa", room: null, age: "48 Tahun", status: "in_progress", priority: "urgent", clinicalNotes: "Keluhan lemas, pusing, mual", diagnosis: "Suspek anemia", totalPrice: "215000", requestDate: new Date(now.getTime() - 1 * oneDay), resultDate: null, createdAt: new Date(now.getTime() - 1 * oneDay), updatedAt: new Date(now.getTime() - 0.5 * oneDay), collectedAt: null, completedAt: null, validatedAt: null },
  { id: 4, orderNo: "LAB-2024-0004", noPermintaan: "REQ-2024-0004", noLab: "LAB-2024-0004", patientId: 4, patientName: "Ratna Dewi", patientMrn: "RM-2024-0004", patientGender: "female", patientDob: "1995-01-30", patientPhone: "08156543210", patientBloodType: "AB+", patientAge: "31 Tahun", patientRoom: null, doctorId: 3, doctorName: "Dr. Faisal Rahman, Sp.PK", doctorSpecialization: "Patologi Klinik", doctorHospital: "RS Medika Utama", room: null, age: "31 Tahun", status: "sample_collected", priority: "normal", clinicalNotes: "Pemeriksaan fungsi hati", diagnosis: "Evaluasi hepatitis", totalPrice: "345000", requestDate: new Date(now.getTime() - 0.5 * oneDay), resultDate: null, createdAt: new Date(now.getTime() - 0.5 * oneDay), updatedAt: new Date(now.getTime() - 0.5 * oneDay), collectedAt: new Date(now.getTime() - 0.3 * oneDay), completedAt: null, validatedAt: null },
  { id: 5, orderNo: "LAB-2024-0005", noPermintaan: "REQ-2024-0005", noLab: "LAB-2024-0005", patientId: 5, patientName: "Hendra Gunawan", patientMrn: "RM-2024-0005", patientGender: "male", patientDob: "1970-06-14", patientPhone: "08165432109", patientBloodType: "O-", patientAge: "56 Tahun", patientRoom: null, doctorId: 5, doctorName: "Dr. Surya Wijaya, Sp.JP", doctorSpecialization: "Jantung & Pembuluh Darah", doctorHospital: "RS Jantung Harapan", room: null, age: "56 Tahun", status: "registered", priority: "urgent", clinicalNotes: "Nyeri dada, sesak napas", diagnosis: "Suspek sindrom koroner akut", totalPrice: "440000", requestDate: new Date(now.getTime() - 0.1 * oneDay), resultDate: null, createdAt: new Date(now.getTime() - 0.1 * oneDay), updatedAt: new Date(now.getTime() - 0.1 * oneDay), collectedAt: null, completedAt: null, validatedAt: null },
  { id: 6, orderNo: "LAB-2024-0006", noPermintaan: "REQ-2024-0006", noLab: "LAB-2024-0006", patientId: 6, patientName: "Putri Anggraini", patientMrn: "RM-2024-0006", patientGender: "female", patientDob: "1988-09-25", patientPhone: "08174321098", patientBloodType: "A-", patientAge: "38 Tahun", patientRoom: null, doctorId: 4, doctorName: "Dr. Linda Hartono, Sp.A", doctorSpecialization: "Anak", doctorHospital: "RS Bunda Mulia", room: null, age: "38 Tahun", status: "reported", priority: "normal", clinicalNotes: "Kontrol diabetes mellitus", diagnosis: "Diabetes mellitus tipe 2", totalPrice: "485000", requestDate: new Date(now.getTime() - 7 * oneDay), resultDate: new Date(now.getTime() - 6 * oneDay), createdAt: new Date(now.getTime() - 7 * oneDay), updatedAt: new Date(now.getTime() - 6 * oneDay), collectedAt: null, completedAt: null, validatedAt: new Date(now.getTime() - 6 * oneDay) },
  { id: 7, orderNo: "LAB-2024-0007", noPermintaan: "REQ-2024-0007", noLab: "LAB-2024-0007", patientId: 7, patientName: "Rizki Pratama", patientMrn: "RM-2024-0007", patientGender: "male", patientDob: "2000-12-05", patientPhone: "08183210987", patientBloodType: "B-", patientAge: "26 Tahun", patientRoom: null, doctorId: 1, doctorName: "Dr. Andi Prasetyo, Sp.PD", doctorSpecialization: "Penyakit Dalam", doctorHospital: "RS Sehat Sentosa", room: null, age: "26 Tahun", status: "completed", priority: "normal", clinicalNotes: "Pemeriksaan pra-operasi", diagnosis: null, totalPrice: "435000", requestDate: new Date(now.getTime() - 3 * oneDay), resultDate: new Date(now.getTime() - 2 * oneDay), createdAt: new Date(now.getTime() - 3 * oneDay), updatedAt: new Date(now.getTime() - 2 * oneDay), collectedAt: null, completedAt: new Date(now.getTime() - 2 * oneDay), validatedAt: null },
  { id: 8, orderNo: "LAB-2024-0008", noPermintaan: "REQ-2024-0008", noLab: "LAB-2024-0008", patientId: 8, patientName: "Nurul Hidayah", patientMrn: "RM-2024-0008", patientGender: "female", patientDob: "1982-04-18", patientPhone: "08192109876", patientBloodType: "AB-", patientAge: "44 Tahun", patientRoom: null, doctorId: 3, doctorName: "Dr. Faisal Rahman, Sp.PK", doctorSpecialization: "Patologi Klinik", doctorHospital: "RS Medika Utama", room: null, age: "44 Tahun", status: "in_progress", priority: "cito", clinicalNotes: "Demam tinggi 5 hari, suspek tifoid", diagnosis: "Suspek demam tifoid", totalPrice: "520000", requestDate: new Date(now.getTime() - 0.3 * oneDay), resultDate: null, createdAt: new Date(now.getTime() - 0.3 * oneDay), updatedAt: new Date(now.getTime() - 0.3 * oneDay), collectedAt: null, completedAt: null, validatedAt: null },
];

export function getMockOrderItems(orderId: number): MockOrderItem[] {
  const staticItems: Record<number, MockOrderItem[]> = {
    1: [
      { id: 1, testId: 1, testCode: "HEM-001", testName: "Hemoglobin (Hb)", categoryName: "Hematologi", result: "14.2", resultNumeric: "14.2", resultStatus: "validated", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 4.5 * oneDay), validatedAt: new Date(now.getTime() - 4 * oneDay) },
      { id: 2, testId: 3, testCode: "HEM-003", testName: "Leukosit (WBC)", categoryName: "Hematologi", result: "7.8", resultNumeric: "7.8", resultStatus: "validated", unit: "ribu/µL", referenceMin: "4.0", referenceMax: "11.0", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 4.5 * oneDay), validatedAt: new Date(now.getTime() - 4 * oneDay) },
      { id: 3, testId: 7, testCode: "KIM-001", testName: "Glukosa Darah Puasa", categoryName: "Kimia Klinik", result: "95", resultNumeric: "95", resultStatus: "validated", unit: "mg/dL", referenceMin: "70", referenceMax: "100", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 4.5 * oneDay), validatedAt: new Date(now.getTime() - 4 * oneDay) },
      { id: 4, testId: 9, testCode: "KIM-003", testName: "Kolesterol Total", categoryName: "Kimia Klinik", result: "220", resultNumeric: "220", resultStatus: "validated", unit: "mg/dL", referenceMin: "0", referenceMax: "200", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 4.5 * oneDay), validatedAt: new Date(now.getTime() - 4 * oneDay) },
      { id: 5, testId: 13, testCode: "KIM-007", testName: "SGOT (AST)", categoryName: "Kimia Klinik", result: "28", resultNumeric: "28", resultStatus: "validated", unit: "U/L", referenceMin: "0", referenceMax: "40", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 4.5 * oneDay), validatedAt: new Date(now.getTime() - 4 * oneDay) },
      { id: 6, testId: 14, testCode: "KIM-008", testName: "SGPT (ALT)", categoryName: "Kimia Klinik", result: "32", resultNumeric: "32", resultStatus: "validated", unit: "U/L", referenceMin: "0", referenceMax: "41", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 4.5 * oneDay), validatedAt: new Date(now.getTime() - 4 * oneDay) },
    ],
    2: [
      { id: 7, testId: 1, testCode: "HEM-001", testName: "Hemoglobin (Hb)", categoryName: "Hematologi", result: "11.5", resultNumeric: "11.5", resultStatus: "validated", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, flag: "L", notes: null, enteredAt: new Date(now.getTime() - 3.5 * oneDay), validatedAt: new Date(now.getTime() - 3 * oneDay) },
      { id: 8, testId: 2, testCode: "HEM-002", testName: "Hematokrit (Ht)", categoryName: "Hematologi", result: "34", resultNumeric: "34", resultStatus: "validated", unit: "%", referenceMin: "36", referenceMax: "48", referenceText: null, flag: "L", notes: null, enteredAt: new Date(now.getTime() - 3.5 * oneDay), validatedAt: new Date(now.getTime() - 3 * oneDay) },
      { id: 9, testId: 4, testCode: "HEM-004", testName: "Trombosit (PLT)", categoryName: "Hematologi", result: "250", resultNumeric: "250", resultStatus: "validated", unit: "ribu/µL", referenceMin: "150", referenceMax: "400", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 3.5 * oneDay), validatedAt: new Date(now.getTime() - 3 * oneDay) },
      { id: 10, testId: 7, testCode: "KIM-001", testName: "Glukosa Darah Puasa", categoryName: "Kimia Klinik", result: "88", resultNumeric: "88", resultStatus: "validated", unit: "mg/dL", referenceMin: "70", referenceMax: "100", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 3.5 * oneDay), validatedAt: new Date(now.getTime() - 3 * oneDay) },
      { id: 11, testId: 21, testCode: "SER-001", testName: "HBsAg (Hepatitis B)", categoryName: "Serologi", result: "Non-Reaktif", resultNumeric: "0", resultStatus: "validated", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", flag: null, notes: null, enteredAt: new Date(now.getTime() - 3.5 * oneDay), validatedAt: new Date(now.getTime() - 3 * oneDay) },
    ],
    3: [
      { id: 12, testId: 1, testCode: "HEM-001", testName: "Hemoglobin (Hb)", categoryName: "Hematologi", result: "8.5", resultNumeric: "8.5", resultStatus: "entered", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, flag: "L", notes: null, enteredAt: new Date(now.getTime() - 0.5 * oneDay), validatedAt: null },
      { id: 13, testId: 2, testCode: "HEM-002", testName: "Hematokrit (Ht)", categoryName: "Hematologi", result: "26", resultNumeric: "26", resultStatus: "entered", unit: "%", referenceMin: "36", referenceMax: "48", referenceText: null, flag: "L", notes: null, enteredAt: new Date(now.getTime() - 0.5 * oneDay), validatedAt: null },
      { id: 14, testId: 3, testCode: "HEM-003", testName: "Leukosit (WBC)", categoryName: "Hematologi", result: "5.2", resultNumeric: "5.2", resultStatus: "entered", unit: "ribu/µL", referenceMin: "4.0", referenceMax: "11.0", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 0.5 * oneDay), validatedAt: null },
      { id: 15, testId: 4, testCode: "HEM-004", testName: "Trombosit (PLT)", categoryName: "Hematologi", result: "180", resultNumeric: "180", resultStatus: "entered", unit: "ribu/µL", referenceMin: "150", referenceMax: "400", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 0.5 * oneDay), validatedAt: null },
      { id: 16, testId: 5, testCode: "HEM-005", testName: "Eritrosit (RBC)", categoryName: "Hematologi", result: "3.2", resultNumeric: "3.2", resultStatus: "entered", unit: "juta/µL", referenceMin: "4.0", referenceMax: "5.5", referenceText: null, flag: "L", notes: null, enteredAt: new Date(now.getTime() - 0.5 * oneDay), validatedAt: null },
      { id: 17, testId: 6, testCode: "HEM-006", testName: "LED (ESR)", categoryName: "Hematologi", result: "35", resultNumeric: "35", resultStatus: "entered", unit: "mm/jam", referenceMin: "0", referenceMax: "20", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 0.5 * oneDay), validatedAt: null },
    ],
    4: [
      { id: 18, testId: 13, testCode: "KIM-007", testName: "SGOT (AST)", categoryName: "Kimia Klinik", result: null, resultNumeric: null, resultStatus: "pending", unit: "U/L", referenceMin: "0", referenceMax: "40", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 19, testId: 14, testCode: "KIM-008", testName: "SGPT (ALT)", categoryName: "Kimia Klinik", result: null, resultNumeric: null, resultStatus: "pending", unit: "U/L", referenceMin: "0", referenceMax: "41", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 20, testId: 21, testCode: "SER-001", testName: "HBsAg (Hepatitis B)", categoryName: "Serologi", result: null, resultNumeric: null, resultStatus: "pending", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 21, testId: 22, testCode: "SER-002", testName: "Anti-HCV (Hepatitis C)", categoryName: "Serologi", result: null, resultNumeric: null, resultStatus: "pending", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", flag: null, notes: null, enteredAt: null, validatedAt: null },
    ],
    5: [
      { id: 22, testId: 1, testCode: "HEM-001", testName: "Hemoglobin (Hb)", categoryName: "Hematologi", result: null, resultNumeric: null, resultStatus: "pending", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 23, testId: 3, testCode: "HEM-003", testName: "Leukosit (WBC)", categoryName: "Hematologi", result: null, resultNumeric: null, resultStatus: "pending", unit: "ribu/µL", referenceMin: "4.0", referenceMax: "11.0", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 24, testId: 13, testCode: "KIM-007", testName: "SGOT (AST)", categoryName: "Kimia Klinik", result: null, resultNumeric: null, resultStatus: "pending", unit: "U/L", referenceMin: "0", referenceMax: "40", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 25, testId: 14, testCode: "KIM-008", testName: "SGPT (ALT)", categoryName: "Kimia Klinik", result: null, resultNumeric: null, resultStatus: "pending", unit: "U/L", referenceMin: "0", referenceMax: "41", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 26, testId: 15, testCode: "KIM-009", testName: "Ureum (BUN)", categoryName: "Kimia Klinik", result: null, resultNumeric: null, resultStatus: "pending", unit: "mg/dL", referenceMin: "10", referenceMax: "50", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 27, testId: 16, testCode: "KIM-010", testName: "Kreatinin", categoryName: "Kimia Klinik", result: null, resultNumeric: null, resultStatus: "pending", unit: "mg/dL", referenceMin: "0.6", referenceMax: "1.2", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 28, testId: 27, testCode: "KOA-001", testName: "PT (Prothrombin Time)", categoryName: "Koagulasi", result: null, resultNumeric: null, resultStatus: "pending", unit: "detik", referenceMin: "10", referenceMax: "14", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
      { id: 29, testId: 28, testCode: "KOA-002", testName: "APTT", categoryName: "Koagulasi", result: null, resultNumeric: null, resultStatus: "pending", unit: "detik", referenceMin: "25", referenceMax: "35", referenceText: null, flag: null, notes: null, enteredAt: null, validatedAt: null },
    ],
    6: [
      { id: 30, testId: 7, testCode: "KIM-001", testName: "Glukosa Darah Puasa", categoryName: "Kimia Klinik", result: "145", resultNumeric: "145", resultStatus: "validated", unit: "mg/dL", referenceMin: "70", referenceMax: "100", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 6.5 * oneDay), validatedAt: new Date(now.getTime() - 6 * oneDay) },
      { id: 31, testId: 8, testCode: "KIM-002", testName: "Glukosa Darah 2 Jam PP", categoryName: "Kimia Klinik", result: "180", resultNumeric: "180", resultStatus: "validated", unit: "mg/dL", referenceMin: "70", referenceMax: "140", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 6.5 * oneDay), validatedAt: new Date(now.getTime() - 6 * oneDay) },
      { id: 32, testId: 18, testCode: "KIM-012", testName: "HbA1c", categoryName: "Kimia Klinik", result: "7.8", resultNumeric: "7.8", resultStatus: "validated", unit: "%", referenceMin: "4.0", referenceMax: "5.6", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 6.5 * oneDay), validatedAt: new Date(now.getTime() - 6 * oneDay) },
      { id: 33, testId: 9, testCode: "KIM-003", testName: "Kolesterol Total", categoryName: "Kimia Klinik", result: "198", resultNumeric: "198", resultStatus: "validated", unit: "mg/dL", referenceMin: "0", referenceMax: "200", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 6.5 * oneDay), validatedAt: new Date(now.getTime() - 6 * oneDay) },
      { id: 34, testId: 15, testCode: "KIM-009", testName: "Ureum (BUN)", categoryName: "Kimia Klinik", result: "35", resultNumeric: "35", resultStatus: "validated", unit: "mg/dL", referenceMin: "10", referenceMax: "50", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 6.5 * oneDay), validatedAt: new Date(now.getTime() - 6 * oneDay) },
      { id: 35, testId: 16, testCode: "KIM-010", testName: "Kreatinin", categoryName: "Kimia Klinik", result: "1.0", resultNumeric: "1.0", resultStatus: "validated", unit: "mg/dL", referenceMin: "0.6", referenceMax: "1.2", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 6.5 * oneDay), validatedAt: new Date(now.getTime() - 6 * oneDay) },
    ],
    7: [
      { id: 36, testId: 1, testCode: "HEM-001", testName: "Hemoglobin (Hb)", categoryName: "Hematologi", result: "15.1", resultNumeric: "15.1", resultStatus: "validated", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 2.5 * oneDay), validatedAt: new Date(now.getTime() - 2 * oneDay) },
      { id: 37, testId: 3, testCode: "HEM-003", testName: "Leukosit (WBC)", categoryName: "Hematologi", result: "8.2", resultNumeric: "8.2", resultStatus: "validated", unit: "ribu/µL", referenceMin: "4.0", referenceMax: "11.0", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 2.5 * oneDay), validatedAt: new Date(now.getTime() - 2 * oneDay) },
      { id: 38, testId: 4, testCode: "HEM-004", testName: "Trombosit (PLT)", categoryName: "Hematologi", result: "280", resultNumeric: "280", resultStatus: "validated", unit: "ribu/µL", referenceMin: "150", referenceMax: "400", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 2.5 * oneDay), validatedAt: new Date(now.getTime() - 2 * oneDay) },
      { id: 39, testId: 27, testCode: "KOA-001", testName: "PT (Prothrombin Time)", categoryName: "Koagulasi", result: "12.5", resultNumeric: "12.5", resultStatus: "validated", unit: "detik", referenceMin: "10", referenceMax: "14", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 2.5 * oneDay), validatedAt: new Date(now.getTime() - 2 * oneDay) },
      { id: 40, testId: 28, testCode: "KOA-002", testName: "APTT", categoryName: "Koagulasi", result: "30", resultNumeric: "30", resultStatus: "validated", unit: "detik", referenceMin: "25", referenceMax: "35", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 2.5 * oneDay), validatedAt: new Date(now.getTime() - 2 * oneDay) },
      { id: 41, testId: 21, testCode: "SER-001", testName: "HBsAg (Hepatitis B)", categoryName: "Serologi", result: "Non-Reaktif", resultNumeric: "0", resultStatus: "validated", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", flag: null, notes: null, enteredAt: new Date(now.getTime() - 2.5 * oneDay), validatedAt: new Date(now.getTime() - 2 * oneDay) },
      { id: 42, testId: 23, testCode: "SER-003", testName: "Anti-HIV", categoryName: "Serologi", result: "Non-Reaktif", resultNumeric: "0", resultStatus: "validated", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", flag: null, notes: null, enteredAt: new Date(now.getTime() - 2.5 * oneDay), validatedAt: new Date(now.getTime() - 2 * oneDay) },
    ],
    8: [
      { id: 43, testId: 1, testCode: "HEM-001", testName: "Hemoglobin (Hb)", categoryName: "Hematologi", result: "13.0", resultNumeric: "13.0", resultStatus: "entered", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, flag: null, notes: null, enteredAt: new Date(now.getTime() - 0.2 * oneDay), validatedAt: null },
      { id: 44, testId: 3, testCode: "HEM-003", testName: "Leukosit (WBC)", categoryName: "Hematologi", result: "12.5", resultNumeric: "12.5", resultStatus: "entered", unit: "ribu/µL", referenceMin: "4.0", referenceMax: "11.0", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 0.2 * oneDay), validatedAt: null },
      { id: 45, testId: 4, testCode: "HEM-004", testName: "Trombosit (PLT)", categoryName: "Hematologi", result: "145", resultNumeric: "145", resultStatus: "entered", unit: "ribu/µL", referenceMin: "150", referenceMax: "400", referenceText: null, flag: "L", notes: null, enteredAt: new Date(now.getTime() - 0.2 * oneDay), validatedAt: null },
      { id: 46, testId: 24, testCode: "SER-004", testName: "Widal Test", categoryName: "Serologi", result: "Positif 1/320", resultNumeric: "0", resultStatus: "entered", unit: "", referenceMin: null, referenceMax: null, referenceText: "Negatif (Titer < 1/80)", flag: "H", notes: null, enteredAt: new Date(now.getTime() - 0.2 * oneDay), validatedAt: null },
      { id: 47, testId: 13, testCode: "KIM-007", testName: "SGOT (AST)", categoryName: "Kimia Klinik", result: "55", resultNumeric: "55", resultStatus: "entered", unit: "U/L", referenceMin: "0", referenceMax: "40", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 0.2 * oneDay), validatedAt: null },
      { id: 48, testId: 14, testCode: "KIM-008", testName: "SGPT (ALT)", categoryName: "Kimia Klinik", result: "48", resultNumeric: "48", resultStatus: "entered", unit: "U/L", referenceMin: "0", referenceMax: "41", referenceText: null, flag: "H", notes: null, enteredAt: new Date(now.getTime() - 0.2 * oneDay), validatedAt: null },
    ],
  };
  const staticList = staticItems[orderId] || [];
  const mutableList = _mutableMockOrderItemsByOrder[orderId] || [];
  return [...staticList, ...mutableList];
}

// Mutable order items for newly created orders in mock mode
const _mutableMockOrderItemsByOrder: Record<number, MockOrderItem[]> = {};
let _nextMockOrderItemId = 100;

export function addMockOrderItem(orderId: number, testId: number, testCode: string, testName: string, categoryName: string | null, unit: string | null, referenceMin: string | null, referenceMax: string | null, referenceText: string | null): MockOrderItem {
  const item: MockOrderItem = {
    id: _nextMockOrderItemId++,
    testId,
    testCode,
    testName,
    categoryName,
    result: null,
    resultNumeric: null,
    resultStatus: "pending",
    unit,
    referenceMin,
    referenceMax,
    referenceText,
    flag: null,
    notes: null,
    enteredAt: null,
    validatedAt: null,
  };
  if (!_mutableMockOrderItemsByOrder[orderId]) {
    _mutableMockOrderItemsByOrder[orderId] = [];
  }
  _mutableMockOrderItemsByOrder[orderId].push(item);
  return item;
}

export function getMockOrdersByMRN(mrn: string, excludeOrderId?: number): MockLabOrder[] {
  return mockLabOrders
    .filter((o) => o.patientMrn === mrn && o.id !== excludeOrderId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
}

export const mockTestPackages: MockTestPackage[] = [
  {
    id: 1, code: "PKG-001", name: "Paket Medical Checkup", description: "Pemeriksaan lengkap untuk medical checkup", price: "350000", active: true, createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-01-01"),
    items: [
      { id: 1, testId: 1, testCode: "HEM-001", testName: "Hemoglobin (Hb)", categoryName: "Hematologi", unit: "g/dL", referenceMin: "12.0", referenceMax: "16.0", referenceText: null, price: "35000" },
      { id: 2, testId: 3, testCode: "HEM-003", testName: "Leukosit (WBC)", categoryName: "Hematologi", unit: "ribu/µL", referenceMin: "4.0", referenceMax: "11.0", referenceText: null, price: "40000" },
      { id: 3, testId: 7, testCode: "KIM-001", testName: "Glukosa Darah Puasa", categoryName: "Kimia Klinik", unit: "mg/dL", referenceMin: "70", referenceMax: "100", referenceText: null, price: "45000" },
      { id: 4, testId: 9, testCode: "KIM-003", testName: "Kolesterol Total", categoryName: "Kimia Klinik", unit: "mg/dL", referenceMin: "0", referenceMax: "200", referenceText: null, price: "50000" },
      { id: 5, testId: 13, testCode: "KIM-007", testName: "SGOT (AST)", categoryName: "Kimia Klinik", unit: "U/L", referenceMin: "0", referenceMax: "40", referenceText: null, price: "45000" },
      { id: 6, testId: 14, testCode: "KIM-008", testName: "SGPT (ALT)", categoryName: "Kimia Klinik", unit: "U/L", referenceMin: "0", referenceMax: "41", referenceText: null, price: "45000" },
      { id: 7, testId: 19, testCode: "URI-001", testName: "Urinalisis Lengkap", categoryName: "Urinalisis", unit: "", referenceMin: null, referenceMax: null, referenceText: "Lihat keterangan", price: "50000" },
    ],
  },
  {
    id: 2, code: "PKG-002", name: "Paket Diabetes", description: "Pemeriksaan lengkap untuk monitoring diabetes", price: "400000", active: true, createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-01-01"),
    items: [
      { id: 8, testId: 7, testCode: "KIM-001", testName: "Glukosa Darah Puasa", categoryName: "Kimia Klinik", unit: "mg/dL", referenceMin: "70", referenceMax: "100", referenceText: null, price: "45000" },
      { id: 9, testId: 8, testCode: "KIM-002", testName: "Glukosa Darah 2 Jam PP", categoryName: "Kimia Klinik", unit: "mg/dL", referenceMin: "70", referenceMax: "140", referenceText: null, price: "45000" },
      { id: 10, testId: 18, testCode: "KIM-012", testName: "HbA1c", categoryName: "Kimia Klinik", unit: "%", referenceMin: "4.0", referenceMax: "5.6", referenceText: null, price: "150000" },
      { id: 11, testId: 9, testCode: "KIM-003", testName: "Kolesterol Total", categoryName: "Kimia Klinik", unit: "mg/dL", referenceMin: "0", referenceMax: "200", referenceText: null, price: "50000" },
      { id: 12, testId: 15, testCode: "KIM-009", testName: "Ureum (BUN)", categoryName: "Kimia Klinik", unit: "mg/dL", referenceMin: "10", referenceMax: "50", referenceText: null, price: "45000" },
      { id: 13, testId: 16, testCode: "KIM-010", testName: "Kreatinin", categoryName: "Kimia Klinik", unit: "mg/dL", referenceMin: "0.6", referenceMax: "1.2", referenceText: null, price: "45000" },
    ],
  },
  {
    id: 3, code: "PKG-003", name: "Paket Hepatitis", description: "Pemeriksaan marker hepatitis B dan C", price: "300000", active: true, createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-01-01"),
    items: [
      { id: 14, testId: 21, testCode: "SER-001", testName: "HBsAg (Hepatitis B)", categoryName: "Serologi", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", price: "85000" },
      { id: 15, testId: 22, testCode: "SER-002", testName: "Anti-HCV (Hepatitis C)", categoryName: "Serologi", unit: "", referenceMin: null, referenceMax: null, referenceText: "Non-Reaktif", price: "120000" },
      { id: 16, testId: 13, testCode: "KIM-007", testName: "SGOT (AST)", categoryName: "Kimia Klinik", unit: "U/L", referenceMin: "0", referenceMax: "40", referenceText: null, price: "45000" },
      { id: 17, testId: 14, testCode: "KIM-008", testName: "SGPT (ALT)", categoryName: "Kimia Klinik", unit: "U/L", referenceMin: "0", referenceMax: "41", referenceText: null, price: "45000" },
    ],
  },
];

export const mockLetterhead: MockLetterhead = {
  id: 1,
  pemda: "PEMERINTAH KABUPATEN/KOTA",
  hospitalName: "RS LabKlinik Sentosa",
  hospitalAddress: "Jl. Kesehatan No. 123, Jakarta Selatan 12345",
  hospitalEmail: "info@labklinik-sentosa.id",
  hospitalPhone: "(021) 12345678",
  logoLeft: null,
  logoRight: null,
};
