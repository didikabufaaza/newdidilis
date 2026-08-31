import { db, pool } from "./index";
import {
  users,
  patients,
  doctors,
  testCategories,
  testCatalog,
  labOrders,
  orderItems,
  auditLog,
} from "./schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if already seeded
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  // Users
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        username: "admin",
        name: "Admin Utama",
        email: "admin@labklinik.id",
        passwordHash,
        role: "superadmin",
        phone: "081234567890",
        imgAccess: true,
        masaAktif: "2027-07-19",
      },
      {
        username: "bastian",
        name: "Bastian, S.Si.T., M.Biomed",
        email: "bastiandarwin51@gmail.com",
        passwordHash,
        role: "admin",
        phone: null,
        tenantId: 1,
        imgAccess: false,
        masaAktif: "2027-08-14",
      },
      {
        username: "ddk",
        name: "ABUFAAZA",
        email: "abufaaza01@gmail.com",
        passwordHash,
        role: "admin",
        phone: null,
        tenantId: 1,
        imgAccess: false,
        masaAktif: "2027-08-16",
      },
      {
        username: "didik",
        name: "M.Didik Wahyudi, S.Tr.Kes",
        email: "didiklabor@gmail.com",
        passwordHash,
        role: "superadmin",
        phone: null,
        imgAccess: true,
        masaAktif: "2027-07-21",
      },
      {
        username: "labor",
        name: "Laboratorium RS Puri Palembang",
        email: "labklinikpuri@gmail.com",
        passwordHash,
        role: "admin",
        phone: null,
        tenantId: 1,
        imgAccess: false,
        masaAktif: "2027-08-18",
      },
    ])
    .returning();

  // Patients
  const insertedPatients = await db
    .insert(patients)
    .values([
      {
        medicalRecordNo: "RM-2024-0001",
        name: "Ahmad Hidayat",
        gender: "male",
        dateOfBirth: "1985-03-15",
        phone: "08129876543",
        address: "Jl. Sudirman No. 45, Jakarta Selatan",
        bloodType: "A+",
        insuranceNo: "BPJS-001234567",
      },
      {
        medicalRecordNo: "RM-2024-0002",
        name: "Siti Nurhaliza",
        gender: "female",
        dateOfBirth: "1990-07-22",
        phone: "08138765432",
        address: "Jl. Gatot Subroto No. 12, Jakarta Pusat",
        bloodType: "B+",
        insuranceNo: "BPJS-001234568",
      },
      {
        medicalRecordNo: "RM-2024-0003",
        name: "Bambang Wijaya",
        gender: "male",
        dateOfBirth: "1978-11-08",
        phone: "08147654321",
        address: "Jl. Thamrin No. 78, Jakarta Pusat",
        bloodType: "O+",
        insuranceNo: "BPJS-001234569",
      },
      {
        medicalRecordNo: "RM-2024-0004",
        name: "Ratna Dewi",
        gender: "female",
        dateOfBirth: "1995-01-30",
        phone: "08156543210",
        address: "Jl. Kuningan No. 23, Jakarta Selatan",
        bloodType: "AB+",
      },
      {
        medicalRecordNo: "RM-2024-0005",
        name: "Hendra Gunawan",
        gender: "male",
        dateOfBirth: "1970-06-14",
        phone: "08165432109",
        address: "Jl. Rasuna Said No. 56, Jakarta Selatan",
        bloodType: "O-",
        insuranceNo: "BPJS-001234570",
      },
      {
        medicalRecordNo: "RM-2024-0006",
        name: "Putri Anggraini",
        gender: "female",
        dateOfBirth: "1988-09-25",
        phone: "08174321098",
        address: "Jl. HR Rasuna Said Kav. C-11, Jakarta",
        bloodType: "A-",
      },
      {
        medicalRecordNo: "RM-2024-0007",
        name: "Rizki Pratama",
        gender: "male",
        dateOfBirth: "2000-12-05",
        phone: "08183210987",
        address: "Jl. Mampang Prapatan No. 100, Jakarta",
        bloodType: "B-",
        insuranceNo: "BPJS-001234571",
      },
      {
        medicalRecordNo: "RM-2024-0008",
        name: "Nurul Hidayah",
        gender: "female",
        dateOfBirth: "1982-04-18",
        phone: "08192109876",
        address: "Jl. Kemang Raya No. 33, Jakarta Selatan",
        bloodType: "AB-",
        insuranceNo: "BPJS-001234572",
      },
    ])
    .returning();

  // Doctors
  const insertedDoctors = await db
    .insert(doctors)
    .values([
      {
        name: "Dr. Andi Prasetyo, Sp.PD",
        specialization: "Penyakit Dalam",
        phone: "08211111111",
        email: "andi.prasetyo@rs-sehat.id",
        hospital: "RS Sehat Sentosa",
        licenseNo: "SIP-JKT-2020-001",
      },
      {
        name: "Dr. Maya Sari, Sp.OG",
        specialization: "Obstetri & Ginekologi",
        phone: "08222222222",
        email: "maya.sari@rs-harapan.id",
        hospital: "RS Harapan Bunda",
        licenseNo: "SIP-JKT-2020-002",
      },
      {
        name: "Dr. Faisal Rahman, Sp.PK",
        specialization: "Patologi Klinik",
        phone: "08233333333",
        email: "faisal@rs-medika.id",
        hospital: "RS Medika Utama",
        licenseNo: "SIP-JKT-2020-003",
      },
      {
        name: "Dr. Linda Hartono, Sp.A",
        specialization: "Anak",
        phone: "08244444444",
        email: "linda@rs-bunda.id",
        hospital: "RS Bunda Mulia",
        licenseNo: "SIP-JKT-2020-004",
      },
      {
        name: "Dr. Surya Wijaya, Sp.JP",
        specialization: "Jantung & Pembuluh Darah",
        phone: "08255555555",
        email: "surya@rs-jantung.id",
        hospital: "RS Jantung Harapan",
        licenseNo: "SIP-JKT-2020-005",
      },
    ])
    .returning();

  // Test categories
  const insertedCategories = await db
    .insert(testCategories)
    .values([
      {
        name: "Hematologi",
        description: "Pemeriksaan darah lengkap",
        sortOrder: 1,
      },
      {
        name: "Kimia Klinik",
        description: "Pemeriksaan fungsi organ",
        sortOrder: 2,
      },
      {
        name: "Urinalisis",
        description: "Pemeriksaan urine",
        sortOrder: 3,
      },
      {
        name: "Serologi",
        description: "Pemeriksaan antibodi dan antigen",
        sortOrder: 4,
      },
      {
        name: "Endokrin",
        description: "Pemeriksaan hormonal",
        sortOrder: 5,
      },
      {
        name: "Koagulasi",
        description: "Pemeriksaan pembekuan darah",
        sortOrder: 6,
      },
    ])
    .returning();

  const catMap: Record<string, number> = {};
  insertedCategories.forEach((c) => {
    catMap[c.name] = c.id;
  });

  // Test catalog
  const insertedTests = await db
    .insert(testCatalog)
    .values([
      // Hematologi
      {
        code: "HEM-001",
        name: "Hemoglobin (Hb)",
        categoryId: catMap["Hematologi"],
        sampleType: "blood",
        unit: "g/dL",
        referenceMin: "12.0",
        referenceMax: "16.0",
        price: "35000",
        turnaroundHours: 2,
      },
      {
        code: "HEM-002",
        name: "Hematokrit (Ht)",
        categoryId: catMap["Hematologi"],
        sampleType: "blood",
        unit: "%",
        referenceMin: "36",
        referenceMax: "48",
        price: "35000",
        turnaroundHours: 2,
      },
      {
        code: "HEM-003",
        name: "Leukosit (WBC)",
        categoryId: catMap["Hematologi"],
        sampleType: "blood",
        unit: "ribu/µL",
        referenceMin: "4.0",
        referenceMax: "11.0",
        price: "40000",
        turnaroundHours: 2,
      },
      {
        code: "HEM-004",
        name: "Trombosit (PLT)",
        categoryId: catMap["Hematologi"],
        sampleType: "blood",
        unit: "ribu/µL",
        referenceMin: "150",
        referenceMax: "400",
        price: "40000",
        turnaroundHours: 2,
      },
      {
        code: "HEM-005",
        name: "Eritrosit (RBC)",
        categoryId: catMap["Hematologi"],
        sampleType: "blood",
        unit: "juta/µL",
        referenceMin: "4.0",
        referenceMax: "5.5",
        price: "35000",
        turnaroundHours: 2,
      },
      {
        code: "HEM-006",
        name: "LED (ESR)",
        categoryId: catMap["Hematologi"],
        sampleType: "blood",
        unit: "mm/jam",
        referenceMin: "0",
        referenceMax: "20",
        price: "30000",
        turnaroundHours: 3,
      },
      // Kimia Klinik
      {
        code: "KIM-001",
        name: "Glukosa Darah Puasa",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "blood",
        unit: "mg/dL",
        referenceMin: "70",
        referenceMax: "100",
        price: "45000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-002",
        name: "Glukosa Darah 2 Jam PP",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "blood",
        unit: "mg/dL",
        referenceMin: "70",
        referenceMax: "140",
        price: "45000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-003",
        name: "Kolesterol Total",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "mg/dL",
        referenceMin: "0",
        referenceMax: "200",
        price: "50000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-004",
        name: "Trigliserida",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "mg/dL",
        referenceMin: "0",
        referenceMax: "150",
        price: "50000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-005",
        name: "HDL Kolesterol",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "mg/dL",
        referenceMin: "40",
        referenceMax: "60",
        price: "55000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-006",
        name: "LDL Kolesterol",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "mg/dL",
        referenceMin: "0",
        referenceMax: "100",
        price: "55000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-007",
        name: "SGOT (AST)",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "U/L",
        referenceMin: "0",
        referenceMax: "40",
        price: "45000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-008",
        name: "SGPT (ALT)",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "U/L",
        referenceMin: "0",
        referenceMax: "41",
        price: "45000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-009",
        name: "Ureum (BUN)",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "mg/dL",
        referenceMin: "10",
        referenceMax: "50",
        price: "45000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-010",
        name: "Kreatinin",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "mg/dL",
        referenceMin: "0.6",
        referenceMax: "1.2",
        price: "45000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-011",
        name: "Asam Urat",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "serum",
        unit: "mg/dL",
        referenceMin: "2.4",
        referenceMax: "7.0",
        price: "45000",
        turnaroundHours: 4,
      },
      {
        code: "KIM-012",
        name: "HbA1c",
        categoryId: catMap["Kimia Klinik"],
        sampleType: "blood",
        unit: "%",
        referenceMin: "4.0",
        referenceMax: "5.6",
        price: "150000",
        turnaroundHours: 6,
      },
      // Urinalisis
      {
        code: "URI-001",
        name: "Urinalisis Lengkap",
        categoryId: catMap["Urinalisis"],
        sampleType: "urine",
        unit: "",
        referenceText: "Lihat keterangan",
        price: "50000",
        turnaroundHours: 2,
      },
      {
        code: "URI-002",
        name: "Protein Urine",
        categoryId: catMap["Urinalisis"],
        sampleType: "urine",
        unit: "mg/dL",
        referenceText: "Negatif",
        price: "35000",
        turnaroundHours: 2,
      },
      // Serologi
      {
        code: "SER-001",
        name: "HBsAg (Hepatitis B)",
        categoryId: catMap["Serologi"],
        sampleType: "serum",
        unit: "",
        referenceText: "Non-Reaktif",
        price: "85000",
        turnaroundHours: 6,
      },
      {
        code: "SER-002",
        name: "Anti-HCV (Hepatitis C)",
        categoryId: catMap["Serologi"],
        sampleType: "serum",
        unit: "",
        referenceText: "Non-Reaktif",
        price: "120000",
        turnaroundHours: 6,
      },
      {
        code: "SER-003",
        name: "Anti-HIV",
        categoryId: catMap["Serologi"],
        sampleType: "serum",
        unit: "",
        referenceText: "Non-Reaktif",
        price: "100000",
        turnaroundHours: 6,
      },
      {
        code: "SER-004",
        name: "Widal Test",
        categoryId: catMap["Serologi"],
        sampleType: "serum",
        unit: "",
        referenceText: "Negatif (Titer < 1/80)",
        price: "75000",
        turnaroundHours: 4,
      },
      // Endokrin
      {
        code: "END-001",
        name: "TSH",
        categoryId: catMap["Endokrin"],
        sampleType: "serum",
        unit: "µIU/mL",
        referenceMin: "0.4",
        referenceMax: "4.0",
        price: "175000",
        turnaroundHours: 8,
      },
      {
        code: "END-002",
        name: "Free T4",
        categoryId: catMap["Endokrin"],
        sampleType: "serum",
        unit: "ng/dL",
        referenceMin: "0.8",
        referenceMax: "1.8",
        price: "175000",
        turnaroundHours: 8,
      },
      // Koagulasi
      {
        code: "KOA-001",
        name: "PT (Prothrombin Time)",
        categoryId: catMap["Koagulasi"],
        sampleType: "plasma",
        unit: "detik",
        referenceMin: "10",
        referenceMax: "14",
        price: "85000",
        turnaroundHours: 4,
      },
      {
        code: "KOA-002",
        name: "APTT",
        categoryId: catMap["Koagulasi"],
        sampleType: "plasma",
        unit: "detik",
        referenceMin: "25",
        referenceMax: "35",
        price: "85000",
        turnaroundHours: 4,
      },
    ])
    .returning();

  // Create lab orders with results
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  const ordersData = [
    {
      orderNo: "LAB-2024-0001",
      patientId: insertedPatients[0].id,
      doctorId: insertedDoctors[0].id,
      status: "completed" as const,
      priority: "normal",
      clinicalNotes: "Pemeriksaan rutin tahunan",
      diagnosis: "Medical check up",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 5 * oneDay),
    },
    {
      orderNo: "LAB-2024-0002",
      patientId: insertedPatients[1].id,
      doctorId: insertedDoctors[1].id,
      status: "validated" as const,
      priority: "normal",
      clinicalNotes: "Kontrol kehamilan trimester 2",
      diagnosis: "Antenatal care",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 4 * oneDay),
    },
    {
      orderNo: "LAB-2024-0003",
      patientId: insertedPatients[2].id,
      doctorId: insertedDoctors[0].id,
      status: "in_progress" as const,
      priority: "urgent",
      clinicalNotes: "Keluhan lemas, pusing, mual",
      diagnosis: "Suspek anemia",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 1 * oneDay),
    },
    {
      orderNo: "LAB-2024-0004",
      patientId: insertedPatients[3].id,
      doctorId: insertedDoctors[2].id,
      status: "sample_collected" as const,
      priority: "normal",
      clinicalNotes: "Pemeriksaan fungsi hati",
      diagnosis: "Evaluasi hepatitis",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 0.5 * oneDay),
    },
    {
      orderNo: "LAB-2024-0005",
      patientId: insertedPatients[4].id,
      doctorId: insertedDoctors[4].id,
      status: "registered" as const,
      priority: "urgent",
      clinicalNotes: "Nyeri dada, sesak napas",
      diagnosis: "Suspek sindrom koroner akut",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 0.1 * oneDay),
    },
    {
      orderNo: "LAB-2024-0006",
      patientId: insertedPatients[5].id,
      doctorId: insertedDoctors[3].id,
      status: "reported" as const,
      priority: "normal",
      clinicalNotes: "Kontrol diabetes mellitus",
      diagnosis: "Diabetes mellitus tipe 2",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 7 * oneDay),
    },
    {
      orderNo: "LAB-2024-0007",
      patientId: insertedPatients[6].id,
      doctorId: insertedDoctors[0].id,
      status: "completed" as const,
      priority: "normal",
      clinicalNotes: "Pemeriksaan pra-operasi",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 3 * oneDay),
    },
    {
      orderNo: "LAB-2024-0008",
      patientId: insertedPatients[7].id,
      doctorId: insertedDoctors[2].id,
      status: "in_progress" as const,
      priority: "cito",
      clinicalNotes: "Demam tinggi 5 hari, suspek tifoid",
      diagnosis: "Suspek demam tifoid",
      createdBy: insertedUsers[3].id,
      createdAt: new Date(now.getTime() - 0.3 * oneDay),
    },
  ];

  const insertedOrders = await db
    .insert(labOrders)
    .values(ordersData)
    .returning();

  // Helper to find test by code
  const testMap: Record<string, (typeof insertedTests)[0]> = {};
  insertedTests.forEach((t) => {
    testMap[t.code] = t;
  });

  // Order items with realistic results
  const orderItemsData = [
    // Order 1: Medical check up - completed
    ...[
      { code: "HEM-001", result: "14.2", numeric: 14.2, status: "validated" as const, flag: "" },
      { code: "HEM-003", result: "7.8", numeric: 7.8, status: "validated" as const, flag: "" },
      { code: "KIM-001", result: "95", numeric: 95, status: "validated" as const, flag: "" },
      { code: "KIM-003", result: "220", numeric: 220, status: "validated" as const, flag: "H" },
      { code: "KIM-007", result: "28", numeric: 28, status: "validated" as const, flag: "" },
      { code: "KIM-008", result: "32", numeric: 32, status: "validated" as const, flag: "" },
    ].map((item) => ({
      orderId: insertedOrders[0].id,
      testId: testMap[item.code].id,
      result: item.result,
      resultNumeric: item.numeric.toString(),
      resultStatus: item.status,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
      flag: item.flag || null,
      enteredBy: insertedUsers[2].id,
      enteredAt: new Date(now.getTime() - 4.5 * oneDay),
      validatedBy: insertedUsers[1].id,
      validatedAt: new Date(now.getTime() - 4 * oneDay),
    })),
    // Order 2: Antenatal - validated
    ...[
      { code: "HEM-001", result: "11.5", numeric: 11.5, status: "validated" as const, flag: "L" },
      { code: "HEM-002", result: "34", numeric: 34, status: "validated" as const, flag: "L" },
      { code: "HEM-004", result: "250", numeric: 250, status: "validated" as const, flag: "" },
      { code: "KIM-001", result: "88", numeric: 88, status: "validated" as const, flag: "" },
      { code: "SER-001", result: "Non-Reaktif", numeric: 0, status: "validated" as const, flag: "" },
    ].map((item) => ({
      orderId: insertedOrders[1].id,
      testId: testMap[item.code].id,
      result: item.result,
      resultNumeric: item.numeric.toString(),
      resultStatus: item.status,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
      flag: item.flag || null,
      enteredBy: insertedUsers[2].id,
      enteredAt: new Date(now.getTime() - 3.5 * oneDay),
      validatedBy: insertedUsers[1].id,
      validatedAt: new Date(now.getTime() - 3 * oneDay),
    })),
    // Order 3: Suspek anemia - in progress
    ...[
      { code: "HEM-001", result: "8.5", numeric: 8.5, status: "entered" as const, flag: "L" },
      { code: "HEM-002", result: "26", numeric: 26, status: "entered" as const, flag: "L" },
      { code: "HEM-003", result: "5.2", numeric: 5.2, status: "entered" as const, flag: "" },
      { code: "HEM-004", result: "180", numeric: 180, status: "entered" as const, flag: "" },
      { code: "HEM-005", result: "3.2", numeric: 3.2, status: "entered" as const, flag: "L" },
      { code: "HEM-006", result: "35", numeric: 35, status: "entered" as const, flag: "H" },
    ].map((item) => ({
      orderId: insertedOrders[2].id,
      testId: testMap[item.code].id,
      result: item.result,
      resultNumeric: item.numeric.toString(),
      resultStatus: item.status,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
      flag: item.flag || null,
      enteredBy: insertedUsers[2].id,
      enteredAt: new Date(now.getTime() - 0.5 * oneDay),
    })),
    // Order 4: Hepatitis eval - sample collected (no results yet)
    ...[
      { code: "KIM-007" },
      { code: "KIM-008" },
      { code: "SER-001" },
      { code: "SER-002" },
    ].map((item) => ({
      orderId: insertedOrders[3].id,
      testId: testMap[item.code].id,
      resultStatus: "pending" as const,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
    })),
    // Order 5: Cardiac - registered (no results)
    ...[
      { code: "HEM-001" },
      { code: "HEM-003" },
      { code: "KIM-007" },
      { code: "KIM-008" },
      { code: "KIM-009" },
      { code: "KIM-010" },
      { code: "KOA-001" },
      { code: "KOA-002" },
    ].map((item) => ({
      orderId: insertedOrders[4].id,
      testId: testMap[item.code].id,
      resultStatus: "pending" as const,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
    })),
    // Order 6: DM control - reported
    ...[
      { code: "KIM-001", result: "145", numeric: 145, status: "validated" as const, flag: "H" },
      { code: "KIM-002", result: "180", numeric: 180, status: "validated" as const, flag: "H" },
      { code: "KIM-012", result: "7.8", numeric: 7.8, status: "validated" as const, flag: "H" },
      { code: "KIM-003", result: "198", numeric: 198, status: "validated" as const, flag: "" },
      { code: "KIM-009", result: "35", numeric: 35, status: "validated" as const, flag: "" },
      { code: "KIM-010", result: "1.0", numeric: 1.0, status: "validated" as const, flag: "" },
    ].map((item) => ({
      orderId: insertedOrders[5].id,
      testId: testMap[item.code].id,
      result: item.result,
      resultNumeric: item.numeric.toString(),
      resultStatus: item.status,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
      flag: item.flag || null,
      enteredBy: insertedUsers[2].id,
      enteredAt: new Date(now.getTime() - 6.5 * oneDay),
      validatedBy: insertedUsers[1].id,
      validatedAt: new Date(now.getTime() - 6 * oneDay),
    })),
    // Order 7: Pre-op - completed
    ...[
      { code: "HEM-001", result: "15.1", numeric: 15.1, status: "validated" as const, flag: "" },
      { code: "HEM-003", result: "8.2", numeric: 8.2, status: "validated" as const, flag: "" },
      { code: "HEM-004", result: "280", numeric: 280, status: "validated" as const, flag: "" },
      { code: "KOA-001", result: "12.5", numeric: 12.5, status: "validated" as const, flag: "" },
      { code: "KOA-002", result: "30", numeric: 30, status: "validated" as const, flag: "" },
      { code: "SER-001", result: "Non-Reaktif", numeric: 0, status: "validated" as const, flag: "" },
      { code: "SER-003", result: "Non-Reaktif", numeric: 0, status: "validated" as const, flag: "" },
    ].map((item) => ({
      orderId: insertedOrders[6].id,
      testId: testMap[item.code].id,
      result: item.result,
      resultNumeric: item.numeric.toString(),
      resultStatus: item.status,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
      flag: item.flag || null,
      enteredBy: insertedUsers[2].id,
      enteredAt: new Date(now.getTime() - 2.5 * oneDay),
      validatedBy: insertedUsers[1].id,
      validatedAt: new Date(now.getTime() - 2 * oneDay),
    })),
    // Order 8: Typhoid - in progress
    ...[
      { code: "HEM-001", result: "13.0", numeric: 13.0, status: "entered" as const, flag: "" },
      { code: "HEM-003", result: "12.5", numeric: 12.5, status: "entered" as const, flag: "H" },
      { code: "HEM-004", result: "145", numeric: 145, status: "entered" as const, flag: "L" },
      { code: "SER-004", result: "Positif 1/320", numeric: 0, status: "entered" as const, flag: "H" },
      { code: "KIM-007", result: "55", numeric: 55, status: "entered" as const, flag: "H" },
      { code: "KIM-008", result: "48", numeric: 48, status: "entered" as const, flag: "H" },
    ].map((item) => ({
      orderId: insertedOrders[7].id,
      testId: testMap[item.code].id,
      result: item.result,
      resultNumeric: item.numeric.toString(),
      resultStatus: item.status,
      unit: testMap[item.code].unit,
      referenceMin: testMap[item.code].referenceMin,
      referenceMax: testMap[item.code].referenceMax,
      flag: item.flag || null,
      enteredBy: insertedUsers[2].id,
      enteredAt: new Date(now.getTime() - 0.2 * oneDay),
    })),
  ];

  await db.insert(orderItems).values(orderItemsData);

  // Audit log entries
  await db.insert(auditLog).values([
    {
      userId: insertedUsers[3].id,
      action: "CREATE",
      entity: "lab_order",
      entityId: insertedOrders[0].id,
      details: "Order LAB-2024-0001 created",
      createdAt: new Date(now.getTime() - 5 * oneDay),
    },
    {
      userId: insertedUsers[2].id,
      action: "ENTER_RESULT",
      entity: "lab_order",
      entityId: insertedOrders[0].id,
      details: "Results entered for LAB-2024-0001",
      createdAt: new Date(now.getTime() - 4.5 * oneDay),
    },
    {
      userId: insertedUsers[1].id,
      action: "VALIDATE",
      entity: "lab_order",
      entityId: insertedOrders[0].id,
      details: "Results validated for LAB-2024-0001",
      createdAt: new Date(now.getTime() - 4 * oneDay),
    },
    {
      userId: insertedUsers[0].id,
      action: "LOGIN",
      entity: "user",
      entityId: insertedUsers[0].id,
      details: "Admin logged in",
      createdAt: new Date(now.getTime() - 1 * oneDay),
    },
  ]);

  console.log("✅ Seeding complete!");
  console.log("📧 Login: admin@labklinik.id / password123");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
