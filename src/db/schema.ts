import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "admin",
  "doctor",
  "analyst",
  "receptionist",
]);

export const genderEnum = pgEnum("gender", ["male", "female"]);

export const orderStatusEnum = pgEnum("order_status", [
  "registered",
  "sample_collected",
  "in_progress",
  "completed",
  "validated",
  "reported",
]);

export const sampleTypeEnum = pgEnum("sample_type", [
  "blood",
  "urine",
  "serum",
  "plasma",
  "csf",
  "stool",
  "swab",
  "other",
]);

export const resultStatusEnum = pgEnum("result_status", [
  "pending",
  "entered",
  "validated",
  "abnormal",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("analyst"),
  phone: varchar("phone", { length: 50 }),
  active: boolean("active").notNull().default(true),
  approved: boolean("approved").notNull().default(true),
  tenantId: integer("tenant_id"),
  parentId: integer("parent_id"),
  masaAktif: varchar("masa_aktif", { length: 10 }),
  imgAccess: boolean("img_access").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patients table
export const patients = pgTable(
  "patients",
  {
  id: serial("id").primaryKey(),
  medicalRecordNo: varchar("medical_record_no", { length: 50 })
    .notNull()
    .unique(),
  noLab: varchar("no_lab", { length: 50 }),
  noPermintaan: varchar("no_permintaan", { length: 50 }),
  name: varchar("name", { length: 255 }).notNull(),
  gender: genderEnum("gender").notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 10 }).notNull(),
  age: varchar("age", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  bloodType: varchar("blood_type", { length: 5 }),
  insuranceNo: varchar("insurance_no", { length: 100 }),
  paymentStatus: varchar("payment_status", { length: 100 }).default("UMUM"),
  doctorId: integer("doctor_id").references(() => doctors.id),
  room: varchar("room", { length: 100 }),
  diagnosis: text("diagnosis"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},
  (table) => [
    index("idx_patients_doctor_id").on(table.doctorId),
    index("idx_patients_created_by").on(table.createdBy),
  ]
);

// Doctors (referring physicians)
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  hospital: varchar("hospital", { length: 255 }),
  licenseNo: varchar("license_no", { length: 100 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Test categories
export const testCategories = pgTable("test_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
});

// Test catalog (master list of available tests)
export const testCatalog = pgTable(
  "test_catalog",
  {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: integer("category_id").references(() => testCategories.id),
  sampleType: sampleTypeEnum("sample_type").notNull().default("blood"),
  unit: varchar("unit", { length: 50 }),
  referenceMin: numeric("reference_min"),
  referenceMax: numeric("reference_max"),
  referenceText: text("reference_text"),
  price: numeric("price", { precision: 12, scale: 2 }).default("0"),
  turnaroundHours: integer("turnaround_hours").default(24),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [index("idx_test_catalog_category_id").on(table.categoryId)]
);

// Lab orders
export const labOrders = pgTable(
  "lab_orders",
  {
  id: serial("id").primaryKey(),
  orderNo: varchar("order_no", { length: 50 }).notNull().unique(),
  noPermintaan: varchar("no_permintaan", { length: 50 }),
  noLab: varchar("no_lab", { length: 50 }),
  patientId: integer("patient_id")
    .references(() => patients.id)
    .notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id),
  room: varchar("room", { length: 100 }),
  age: varchar("age", { length: 50 }),
  status: orderStatusEnum("status").notNull().default("registered"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  clinicalNotes: text("clinical_notes"),
  diagnosis: varchar("diagnosis", { length: 500 }),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).default("0"),
  requestDate: timestamp("request_date").defaultNow(),
  resultDate: timestamp("result_date"),
  collectedAt: timestamp("collected_at"),
  completedAt: timestamp("completed_at"),
  validatedAt: timestamp("validated_at"),
  validatedBy: integer("validated_by").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},
  (table) => [
    index("idx_lab_orders_patient_id").on(table.patientId),
    index("idx_lab_orders_doctor_id").on(table.doctorId),
    index("idx_lab_orders_created_by").on(table.createdBy),
    index("idx_lab_orders_validated_by").on(table.validatedBy),
    index("idx_lab_orders_status").on(table.status),
    index("idx_lab_orders_created_at").on(table.createdAt),
    index("idx_lab_orders_request_date").on(table.requestDate),
  ]
);

// Order items (tests within an order)
export const orderItems = pgTable(
  "order_items",
  {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => labOrders.id, { onDelete: "cascade" })
    .notNull(),
  testId: integer("test_id")
    .references(() => testCatalog.id)
    .notNull(),
  result: varchar("result", { length: 500 }),
  resultNumeric: numeric("result_numeric"),
  resultStatus: resultStatusEnum("result_status")
    .notNull()
    .default("pending"),
  unit: varchar("unit", { length: 50 }),
  referenceMin: numeric("reference_min"),
  referenceMax: numeric("reference_max"),
  referenceText: text("reference_text"),
  flag: varchar("flag", { length: 10 }),
  notes: text("notes"),
  enteredBy: integer("entered_by").references(() => users.id),
  enteredAt: timestamp("entered_at"),
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
},
  (table) => [
    index("idx_order_items_order_id").on(table.orderId),
    index("idx_order_items_test_id").on(table.testId),
    index("idx_order_items_result_status").on(table.resultStatus),
    index("idx_order_items_entered_by").on(table.enteredBy),
    index("idx_order_items_validated_by").on(table.validatedBy),
  ]
);

// Audit log
export const auditLog = pgTable(
  "audit_log",
  {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [index("idx_audit_log_user_id").on(table.userId)]
);

// Test Packages (Paket Pemeriksaan)
export const testPackages = pgTable("test_packages", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testPackageItems = pgTable(
  "test_package_items",
  {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").references(() => testPackages.id, { onDelete: "cascade" }).notNull(),
  testId: integer("test_id").references(() => testCatalog.id).notNull(),
},
  (table) => [
    index("idx_test_package_items_package_id").on(table.packageId),
    index("idx_test_package_items_test_id").on(table.testId),
  ]
);

// Letterhead settings (Kop Surat)
export const letterheadSettings = pgTable("letterhead_settings", {
  id: serial("id").primaryKey(),
  pemda: varchar("pemda", { length: 255 }),
  hospitalName: varchar("hospital_name", { length: 255 }),
  hospitalAddress: text("hospital_address"),
  hospitalEmail: varchar("hospital_email", { length: 255 }),
  hospitalPhone: varchar("hospital_phone", { length: 100 }),
  logoLeft: text("logo_left"),
  logoRight: text("logo_right"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
