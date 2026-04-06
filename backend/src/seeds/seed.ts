import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ==================== CONFIG ====================
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'clinic_user',
  password: process.env.DB_PASSWORD || 'clinic_password',
  database: process.env.DB_NAME || 'clinic_db',
  synchronize: true,
  entities: [path.join(__dirname, '../modules/**/entities/*.entity{.ts,.js}')],
  logging: false,
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected. Starting seed...\n');

  const qr = dataSource.createQueryRunner();

  // Clean existing data
  console.log('Cleaning existing data...');
  await qr.query(`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  // ==================== HELPER ====================
  const hash = async (pw: string) => bcrypt.hash(pw, 10);
  const uuid = () => {
    // simple v4 uuid
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  };

  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  // ==================== IDs ====================
  const branchMainId = uuid();
  const branchSecondId = uuid();

  const deptTherapy = uuid();
  const deptCardio = uuid();
  const deptNeuro = uuid();
  const deptSurgery = uuid();
  const deptPediatrics = uuid();

  const userOwnerId = uuid();
  const userChiefId = uuid();
  const userAdminId = uuid();
  const userSysadminId = uuid();
  const userAccountantId = uuid();

  const doctorIds = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];
  const nurseIds = [uuid(), uuid()];
  const receptionIds = [uuid(), uuid()];

  const patientIds = Array.from({ length: 15 }, () => uuid());

  const roomIds = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];

  const serviceIds = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];

  const insuranceIds = [uuid(), uuid()];

  const pw = await hash('password123');

  // ==================== 1. BRANCHES ====================
  console.log('Seeding branches...');
  await qr.query(`
    INSERT INTO branches (id, name, address, phone, is_main, is_active, email, description, created_at, updated_at)
    VALUES
      ($1, 'Главный филиал', 'г. Душанбе, ул. Рудаки 123', '+992 372 21 00 00', true, true, 'main@clinic.tj', 'Основной филиал клиники', $3, $3),
      ($2, 'Филиал Сомони', 'г. Душанбе, пр. Сомони 45', '+992 372 22 00 00', false, true, 'somoni@clinic.tj', 'Второй филиал клиники', $3, $3)
  `, [branchMainId, branchSecondId, now]);

  // ==================== 2. DEPARTMENTS ====================
  console.log('Seeding departments...');
  await qr.query(`
    INSERT INTO departments (id, name, code, description, is_active, created_at, updated_at)
    VALUES
      ($1, 'Терапия', 'THERAPY', 'Терапевтическое отделение', true, $6, $6),
      ($2, 'Кардиология', 'CARDIO', 'Кардиологическое отделение', true, $6, $6),
      ($3, 'Неврология', 'NEURO', 'Неврологическое отделение', true, $6, $6),
      ($4, 'Хирургия', 'SURGERY', 'Хирургическое отделение', true, $6, $6),
      ($5, 'Педиатрия', 'PEDIATRICS', 'Педиатрическое отделение', true, $6, $6)
  `, [deptTherapy, deptCardio, deptNeuro, deptSurgery, deptPediatrics, now]);

  // ==================== 3. USERS ====================
  console.log('Seeding users...');

  // Owner
  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, middle_name, phone, role, is_active, branch_id, created_at, updated_at)
    VALUES ($1, 'owner@clinic.tj', $2, 'Рахмон', 'Каримов', 'Ахмадович', '+992900000001', 'owner', true, $3, $4, $4)
  `, [userOwnerId, pw, branchMainId, now]);

  // Chief doctor
  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, middle_name, phone, role, is_active, specialty, qualification, branch_id, department_id, created_at, updated_at)
    VALUES ($1, 'chief@clinic.tj', $2, 'Фаридун', 'Назаров', 'Сайфуллоевич', '+992900000002', 'chief_doctor', true, 'Терапия', 'Высшая категория', $3, $4, $5, $5)
  `, [userChiefId, pw, branchMainId, deptTherapy, now]);

  // Admin
  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, branch_id, created_at, updated_at)
    VALUES ($1, 'admin@clinic.tj', $2, 'Мадина', 'Рахимова', '+992900000003', 'admin', true, $3, $4, $4)
  `, [userAdminId, pw, branchMainId, now]);

  // Sysadmin
  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, branch_id, created_at, updated_at)
    VALUES ($1, 'sysadmin@clinic.tj', $2, 'Тимур', 'Алиев', '+992900000004', 'sysadmin', true, $3, $4, $4)
  `, [userSysadminId, pw, branchMainId, now]);

  // Accountant
  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, branch_id, created_at, updated_at)
    VALUES ($1, 'accountant@clinic.tj', $2, 'Зарина', 'Хасанова', '+992900000005', 'accountant', true, $3, $4, $4)
  `, [userAccountantId, pw, branchMainId, now]);

  // Doctors
  const doctorData = [
    { id: doctorIds[0], email: 'doctor1@clinic.tj', fn: 'Алишер', ln: 'Раджабов', sp: 'Кардиология', qual: 'Высшая категория', dept: deptCardio, br: branchMainId },
    { id: doctorIds[1], email: 'doctor2@clinic.tj', fn: 'Нигина', ln: 'Саидова', sp: 'Неврология', qual: 'Первая категория', dept: deptNeuro, br: branchMainId },
    { id: doctorIds[2], email: 'doctor3@clinic.tj', fn: 'Бахтиёр', ln: 'Мирзоев', sp: 'Хирургия', qual: 'Высшая категория', dept: deptSurgery, br: branchMainId },
    { id: doctorIds[3], email: 'doctor4@clinic.tj', fn: 'Дилноза', ln: 'Ахмедова', sp: 'Педиатрия', qual: 'Вторая категория', dept: deptPediatrics, br: branchSecondId },
    { id: doctorIds[4], email: 'doctor5@clinic.tj', fn: 'Шухрат', ln: 'Юсупов', sp: 'Терапия', qual: 'Первая категория', dept: deptTherapy, br: branchSecondId },
    { id: doctorIds[5], email: 'doctor6@clinic.tj', fn: 'Фируза', ln: 'Каримова', sp: 'Кардиология', qual: 'Первая категория', dept: deptCardio, br: branchMainId },
  ];

  for (const d of doctorData) {
    await qr.query(`
      INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, specialty, qualification, branch_id, department_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'doctor', true, $7, $8, $9, $10, $11, $11)
    `, [d.id, d.email, pw, d.fn, d.ln, `+99290000${Math.floor(1000 + Math.random() * 9000)}`, d.sp, d.qual, d.br, d.dept, now]);
  }

  // Nurses
  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, branch_id, department_id, created_at, updated_at)
    VALUES ($1, 'nurse1@clinic.tj', $2, 'Гулрухсор', 'Файзуллоева', '+992900001001', 'nurse', true, $3, $4, $5, $5)
  `, [nurseIds[0], pw, branchMainId, deptCardio, now]);

  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, branch_id, department_id, created_at, updated_at)
    VALUES ($1, 'nurse2@clinic.tj', $2, 'Малика', 'Шарипова', '+992900001002', 'nurse', true, $3, $4, $5, $5)
  `, [nurseIds[1], pw, branchSecondId, deptPediatrics, now]);

  // Reception
  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, branch_id, created_at, updated_at)
    VALUES ($1, 'reception1@clinic.tj', $2, 'Мадина', 'Каримова', '+992900001101', 'reception', true, $3, $4, $4)
  `, [receptionIds[0], pw, branchMainId, now]);

  await qr.query(`
    INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, branch_id, created_at, updated_at)
    VALUES ($1, 'reception2@clinic.tj', $2, 'Нигина', 'Ахмедова', '+992900001102', 'reception', true, $3, $4, $4)
  `, [receptionIds[1], pw, branchSecondId, now]);

  // ==================== 4. STAFF PROFILES ====================
  console.log('Seeding staff profiles...');
  const staffData = [
    { uid: doctorIds[0], dept: deptCardio, sp: 'Кардиология', lic: 'LIC-001', st: 'fixed', sa: 15000 },
    { uid: doctorIds[1], dept: deptNeuro, sp: 'Неврология', lic: 'LIC-002', st: 'fixed', sa: 14000 },
    { uid: doctorIds[2], dept: deptSurgery, sp: 'Хирургия', lic: 'LIC-003', st: 'percentage', sp2: 25 },
    { uid: doctorIds[3], dept: deptPediatrics, sp: 'Педиатрия', lic: 'LIC-004', st: 'fixed', sa: 12000 },
    { uid: doctorIds[4], dept: deptTherapy, sp: 'Терапия', lic: 'LIC-005', st: 'mixed', sa: 8000, sp2: 10 },
    { uid: doctorIds[5], dept: deptCardio, sp: 'Кардиология', lic: 'LIC-006', st: 'fixed', sa: 13000 },
  ];

  for (const s of staffData) {
    await qr.query(`
      INSERT INTO staff_profiles (id, user_id, department_id, specialty, license_number, education, experience, salary_type, salary_amount, salary_percentage, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'Таджикский государственный медицинский университет', '10+ лет', $6, $7, $8, $9, $9)
    `, [uuid(), s.uid, s.dept, s.sp, s.lic, s.st, s.sa || null, s.sp2 || null, now]);
  }

  // ==================== 5. ROOMS ====================
  console.log('Seeding rooms...');
  const roomData = [
    { id: roomIds[0], name: 'Кабинет кардиолога', num: '101', floor: 1, br: branchMainId },
    { id: roomIds[1], name: 'Кабинет невролога', num: '102', floor: 1, br: branchMainId },
    { id: roomIds[2], name: 'Процедурный кабинет', num: '103', floor: 1, br: branchMainId },
    { id: roomIds[3], name: 'Хирургический кабинет', num: '201', floor: 2, br: branchMainId },
    { id: roomIds[4], name: 'Педиатрический кабинет', num: '104', floor: 1, br: branchSecondId },
    { id: roomIds[5], name: 'Терапевтический кабинет', num: '105', floor: 1, br: branchSecondId },
  ];

  for (const r of roomData) {
    await qr.query(`
      INSERT INTO rooms (id, name, number, floor, is_active, branch_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, $5, $6, $6)
    `, [r.id, r.name, r.num, r.floor, r.br, now]);
  }

  // ==================== 6. INSURANCE COMPANIES ====================
  console.log('Seeding insurance companies...');
  await qr.query(`
    INSERT INTO insurance_companies (id, name, code, address, phone, email, contact_person, discount_percent, is_active, created_at, updated_at)
    VALUES
      ($1, 'Сугурта', 'SUGURTA', 'г. Душанбе, ул. Айни 12', '+992372330001', 'info@sugurta.tj', 'Комилов А.Р.', 15, true, $3, $3),
      ($2, 'ТаджикМедСтрах', 'TJMEDINS', 'г. Душанбе, ул. Шотемур 5', '+992372330002', 'info@tjmed.tj', 'Рахматов С.Д.', 10, true, $3, $3)
  `, [insuranceIds[0], insuranceIds[1], now]);

  // ==================== 7. PATIENTS ====================
  console.log('Seeding patients...');
  const patients = [
    { id: patientIds[0], fn: 'Иван', ln: 'Иванов', mn: 'Петрович', dob: '1985-03-15', g: 'male', ph: '+992901110001', email: 'ivanov@mail.tj', tags: 'VIP', ins: insuranceIds[0], pol: 'POL-001' },
    { id: patientIds[1], fn: 'Мария', ln: 'Петрова', mn: 'Сергеевна', dob: '1990-07-22', g: 'female', ph: '+992901110002', email: 'petrova@mail.tj', tags: null, ins: null, pol: null },
    { id: patientIds[2], fn: 'Фарход', ln: 'Холиков', mn: 'Рустамович', dob: '1978-11-03', g: 'male', ph: '+992901110003', email: null, tags: 'VIP', ins: insuranceIds[1], pol: 'POL-002' },
    { id: patientIds[3], fn: 'Зарина', ln: 'Рахимова', mn: 'Бахтиёровна', dob: '1995-02-14', g: 'female', ph: '+992901110004', email: 'zarinarah@mail.tj', tags: null, ins: null, pol: null },
    { id: patientIds[4], fn: 'Акмал', ln: 'Назаров', mn: 'Фирузович', dob: '1970-08-30', g: 'male', ph: '+992901110005', email: null, tags: null, ins: insuranceIds[0], pol: 'POL-003' },
    { id: patientIds[5], fn: 'Нигора', ln: 'Саидова', mn: null, dob: '1988-12-01', g: 'female', ph: '+992901110006', email: 'nigora@mail.tj', tags: null, ins: null, pol: null },
    { id: patientIds[6], fn: 'Рустам', ln: 'Каримов', mn: 'Алиевич', dob: '2015-05-20', g: 'male', ph: '+992901110007', email: null, tags: null, ins: null, pol: null },
    { id: patientIds[7], fn: 'Шахло', ln: 'Абдуллоева', mn: 'Кабировна', dob: '1960-01-10', g: 'female', ph: '+992901110008', email: null, tags: 'VIP', ins: insuranceIds[1], pol: 'POL-004' },
    { id: patientIds[8], fn: 'Далер', ln: 'Мирзоев', mn: 'Бахромович', dob: '1992-09-25', g: 'male', ph: '+992901110009', email: 'daler@mail.tj', tags: null, ins: null, pol: null },
    { id: patientIds[9], fn: 'Малика', ln: 'Юсупова', mn: null, dob: '2000-04-18', g: 'female', ph: '+992901110010', email: 'malika@mail.tj', tags: null, ins: null, pol: null },
    { id: patientIds[10], fn: 'Бахтиёр', ln: 'Ризоев', mn: 'Хамидович', dob: '1982-06-05', g: 'male', ph: '+992901110011', email: null, tags: null, ins: null, pol: null },
    { id: patientIds[11], fn: 'Тахмина', ln: 'Файзуллоева', mn: null, dob: '1997-10-12', g: 'female', ph: '+992901110012', email: null, tags: null, ins: insuranceIds[0], pol: 'POL-005' },
    { id: patientIds[12], fn: 'Сарвар', ln: 'Хасанов', mn: 'Джамолидинович', dob: '1975-03-28', g: 'male', ph: '+992901110013', email: null, tags: 'blacklist', ins: null, pol: null },
    { id: patientIds[13], fn: 'Парвина', ln: 'Шарипова', mn: null, dob: '2005-08-08', g: 'female', ph: '+992901110014', email: null, tags: null, ins: null, pol: null },
    { id: patientIds[14], fn: 'Камол', ln: 'Ашуров', mn: 'Насимович', dob: '1968-12-20', g: 'male', ph: '+992901110015', email: 'kamol@mail.tj', tags: null, ins: insuranceIds[1], pol: 'POL-006' },
  ];

  for (const p of patients) {
    await qr.query(`
      INSERT INTO patients (id, first_name, last_name, middle_name, date_of_birth, gender, phone, email, tags, source, consent_given, branch_id, insurance_company_id, insurance_policy_number, blood_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'reception', true, $10, $11, $12, $13, $14, $14)
    `, [p.id, p.fn, p.ln, p.mn, p.dob, p.g, p.ph, p.email, p.tags, branchMainId, p.ins, p.pol, ['I+', 'II+', 'III+', 'IV-', 'II-', null][Math.floor(Math.random() * 6)], now]);
  }

  // ==================== 8. SERVICES ====================
  console.log('Seeding services...');
  const services = [
    { id: serviceIds[0], name: 'Консультация терапевта', code: 'SRV-THER', cat: 'Консультации', price: 200, dur: 30, dept: deptTherapy },
    { id: serviceIds[1], name: 'Консультация кардиолога', code: 'SRV-CARD', cat: 'Консультации', price: 350, dur: 30, dept: deptCardio },
    { id: serviceIds[2], name: 'Консультация невролога', code: 'SRV-NEUR', cat: 'Консультации', price: 300, dur: 30, dept: deptNeuro },
    { id: serviceIds[3], name: 'Консультация хирурга', code: 'SRV-SURG', cat: 'Консультации', price: 400, dur: 30, dept: deptSurgery },
    { id: serviceIds[4], name: 'Консультация педиатра', code: 'SRV-PEDI', cat: 'Консультации', price: 250, dur: 20, dept: deptPediatrics },
    { id: serviceIds[5], name: 'ЭКГ', code: 'SRV-ECG', cat: 'Диагностика', price: 150, dur: 15, dept: deptCardio },
    { id: serviceIds[6], name: 'УЗИ органов', code: 'SRV-USI', cat: 'Диагностика', price: 300, dur: 20, dept: deptTherapy },
    { id: serviceIds[7], name: 'Общий анализ крови', code: 'SRV-OAK', cat: 'Лаборатория', price: 100, dur: 10, dept: deptTherapy },
    { id: serviceIds[8], name: 'Биохимия крови', code: 'SRV-BIOX', cat: 'Лаборатория', price: 250, dur: 10, dept: deptTherapy },
    { id: serviceIds[9], name: 'Перевязка', code: 'SRV-BAND', cat: 'Процедуры', price: 80, dur: 15, dept: deptSurgery },
  ];

  for (const s of services) {
    await qr.query(`
      INSERT INTO services (id, name, code, category, price, duration, is_active, department_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $8)
    `, [s.id, s.name, s.code, s.cat, s.price, s.dur, s.dept, now]);
  }

  // ==================== 9. DOCTOR SCHEDULES ====================
  console.log('Seeding doctor schedules...');
  // Create schedules for doctors Mon-Fri
  for (const docId of doctorIds) {
    const slotDuration = [15, 20, 30][Math.floor(Math.random() * 3)];
    for (let day = 1; day <= 5; day++) {
      await qr.query(`
        INSERT INTO doctor_schedules (id, doctor_id, room_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration, is_active, branch_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, '08:00', '17:00', '12:00', '13:00', $5, true, $6, $7, $7)
      `, [uuid(), docId, roomIds[Math.floor(Math.random() * roomIds.length)], day, slotDuration, branchMainId, now]);
    }
    // Saturday half-day
    await qr.query(`
      INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, slot_duration, is_active, branch_id, created_at, updated_at)
      VALUES ($1, $2, 6, '09:00', '13:00', $3, true, $4, $5, $5)
    `, [uuid(), docId, slotDuration, branchMainId, now]);
  }

  // ==================== 10. APPOINTMENTS ====================
  console.log('Seeding appointments...');
  const appointmentIds: string[] = [];

  // Helper: date offset from today
  const dateOff = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

  // 5 patients per doctor, spread across 2 weeks with varied statuses/times
  const appointmentData = [
    // ─── Doctor 0: Раджабов (Кардиолог) ───
    { pid: patientIds[0], did: doctorIds[0], date: today,        st: '09:00', et: '09:30', type: 'primary',      status: 'confirmed',            src: 'reception' },
    { pid: patientIds[1], did: doctorIds[0], date: today,        st: '10:00', et: '10:30', type: 'primary',      status: 'scheduled',            src: 'online' },
    { pid: patientIds[7], did: doctorIds[0], date: today,        st: '14:00', et: '14:30', type: 'follow_up',    status: 'scheduled',            src: 'referral' },
    { pid: patientIds[0], did: doctorIds[0], date: tomorrow,     st: '09:00', et: '09:30', type: 'follow_up',    status: 'confirmed',            src: 'reception' },
    { pid: patientIds[12], did: doctorIds[0], date: dayAfter,    st: '10:00', et: '10:30', type: 'primary',      status: 'scheduled',            src: 'online' },
    { pid: patientIds[7], did: doctorIds[0], date: dateOff(3),   st: '11:00', et: '11:30', type: 'follow_up',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[1], did: doctorIds[0], date: dateOff(4),   st: '09:30', et: '10:00', type: 'consultation', status: 'waiting_confirmation', src: 'online' },
    { pid: patientIds[0], did: doctorIds[0], date: dateOff(-1),  st: '09:00', et: '09:30', type: 'follow_up',    status: 'completed',            src: 'reception' },
    { pid: patientIds[12], did: doctorIds[0], date: dateOff(-2), st: '10:00', et: '10:30', type: 'primary',      status: 'completed',            src: 'online' },
    { pid: patientIds[7], did: doctorIds[0], date: dateOff(-3),  st: '14:00', et: '14:30', type: 'primary',      status: 'completed',            src: 'reception' },

    // ─── Doctor 1: Саидова (Невролог) ───
    { pid: patientIds[2], did: doctorIds[1], date: today,        st: '10:00', et: '10:30', type: 'consultation', status: 'in_progress',          src: 'reception' },
    { pid: patientIds[3], did: doctorIds[1], date: today,        st: '11:00', et: '11:30', type: 'primary',      status: 'scheduled',            src: 'online' },
    { pid: patientIds[10], did: doctorIds[1], date: tomorrow,    st: '10:00', et: '10:30', type: 'primary',      status: 'scheduled',            src: 'reception' },
    { pid: patientIds[2], did: doctorIds[1], date: dayAfter,     st: '09:00', et: '09:30', type: 'follow_up',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[11], did: doctorIds[1], date: dateOff(3),  st: '15:00', et: '15:30', type: 'consultation', status: 'waiting_confirmation', src: 'online' },
    { pid: patientIds[3], did: doctorIds[1], date: dateOff(5),   st: '09:30', et: '10:00', type: 'follow_up',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[10], did: doctorIds[1], date: dateOff(-1), st: '11:00', et: '11:30', type: 'primary',      status: 'completed',            src: 'reception' },
    { pid: patientIds[2], did: doctorIds[1], date: dateOff(-2),  st: '10:00', et: '10:30', type: 'primary',      status: 'completed',            src: 'reception' },
    { pid: patientIds[11], did: doctorIds[1], date: dateOff(-4), st: '14:00', et: '14:30', type: 'consultation', status: 'no_show',              src: 'online' },

    // ─── Doctor 2: Мирзоев (Хирург) ───
    { pid: patientIds[4], did: doctorIds[2], date: today,        st: '09:00', et: '09:30', type: 'procedure',    status: 'completed',            src: 'reception' },
    { pid: patientIds[8], did: doctorIds[2], date: today,        st: '10:00', et: '10:30', type: 'primary',      status: 'confirmed',            src: 'reception' },
    { pid: patientIds[11], did: doctorIds[2], date: tomorrow,    st: '09:00', et: '09:30', type: 'procedure',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[4], did: doctorIds[2], date: dayAfter,     st: '14:00', et: '14:30', type: 'follow_up',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[14], did: doctorIds[2], date: dateOff(4),  st: '09:00', et: '09:30', type: 'procedure',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[8], did: doctorIds[2], date: dateOff(5),   st: '10:30', et: '11:00', type: 'follow_up',    status: 'waiting_confirmation', src: 'online' },
    { pid: patientIds[4], did: doctorIds[2], date: dateOff(-1),  st: '09:00', et: '09:30', type: 'procedure',    status: 'completed',            src: 'reception' },
    { pid: patientIds[14], did: doctorIds[2], date: dateOff(-3), st: '11:00', et: '11:30', type: 'primary',      status: 'completed',            src: 'reception' },

    // ─── Doctor 3: Ахмедова (Педиатр) ───
    { pid: patientIds[5], did: doctorIds[3], date: today,        st: '10:00', et: '10:20', type: 'primary',      status: 'confirmed',            src: 'reception' },
    { pid: patientIds[6], did: doctorIds[3], date: today,        st: '10:30', et: '10:50', type: 'primary',      status: 'waiting_confirmation', src: 'online' },
    { pid: patientIds[13], did: doctorIds[3], date: tomorrow,    st: '09:00', et: '09:20', type: 'primary',      status: 'scheduled',            src: 'reception' },
    { pid: patientIds[5], did: doctorIds[3], date: dayAfter,     st: '10:00', et: '10:20', type: 'follow_up',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[6], did: doctorIds[3], date: dateOff(3),   st: '11:00', et: '11:20', type: 'follow_up',    status: 'scheduled',            src: 'online' },
    { pid: patientIds[13], did: doctorIds[3], date: dateOff(5),  st: '14:00', et: '14:20', type: 'consultation', status: 'waiting_confirmation', src: 'online' },
    { pid: patientIds[5], did: doctorIds[3], date: dateOff(-2),  st: '10:00', et: '10:20', type: 'primary',      status: 'completed',            src: 'reception' },
    { pid: patientIds[6], did: doctorIds[3], date: dateOff(-3),  st: '09:00', et: '09:20', type: 'primary',      status: 'cancelled',            src: 'online' },

    // ─── Doctor 4: Юсупов (Терапевт) ───
    { pid: patientIds[8], did: doctorIds[4], date: today,        st: '11:00', et: '11:30', type: 'primary',      status: 'cancelled',            src: 'reception' },
    { pid: patientIds[9], did: doctorIds[4], date: today,        st: '14:00', et: '14:30', type: 'primary',      status: 'scheduled',            src: 'reception' },
    { pid: patientIds[14], did: doctorIds[4], date: dayAfter,    st: '11:00', et: '11:30', type: 'primary',      status: 'scheduled',            src: 'reception' },
    { pid: patientIds[10], did: doctorIds[4], date: dateOff(3),  st: '09:00', et: '09:30', type: 'primary',      status: 'scheduled',            src: 'online' },
    { pid: patientIds[8], did: doctorIds[4], date: dateOff(4),   st: '15:00', et: '15:30', type: 'follow_up',    status: 'waiting_confirmation', src: 'online' },
    { pid: patientIds[9], did: doctorIds[4], date: dateOff(-1),  st: '10:00', et: '10:30', type: 'primary',      status: 'completed',            src: 'reception' },
    { pid: patientIds[14], did: doctorIds[4], date: dateOff(-2), st: '11:00', et: '11:30', type: 'primary',      status: 'completed',            src: 'reception' },
    { pid: patientIds[10], did: doctorIds[4], date: dateOff(-4), st: '09:00', et: '09:30', type: 'primary',      status: 'no_show',              src: 'online' },

    // ─── Doctor 5: Каримова (Кардиолог) ───
    { pid: patientIds[9], did: doctorIds[5], date: today,        st: '09:00', et: '09:30', type: 'primary',      status: 'no_show',              src: 'online' },
    { pid: patientIds[3], did: doctorIds[5], date: today,        st: '11:00', et: '11:30', type: 'consultation', status: 'confirmed',            src: 'reception' },
    { pid: patientIds[3], did: doctorIds[5], date: tomorrow,     st: '14:00', et: '14:30', type: 'consultation', status: 'waiting_confirmation', src: 'online' },
    { pid: patientIds[9], did: doctorIds[5], date: dayAfter,     st: '09:30', et: '10:00', type: 'follow_up',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[12], did: doctorIds[5], date: dateOff(4),  st: '10:00', et: '10:30', type: 'primary',      status: 'scheduled',            src: 'online' },
    { pid: patientIds[3], did: doctorIds[5], date: dateOff(5),   st: '15:00', et: '15:30', type: 'follow_up',    status: 'scheduled',            src: 'reception' },
    { pid: patientIds[9], did: doctorIds[5], date: dateOff(-1),  st: '09:00', et: '09:30', type: 'primary',      status: 'completed',            src: 'reception' },
    { pid: patientIds[12], did: doctorIds[5], date: dateOff(-2), st: '14:00', et: '14:30', type: 'primary',      status: 'completed',            src: 'online' },
    { pid: patientIds[3], did: doctorIds[5], date: dateOff(-3),  st: '11:00', et: '11:30', type: 'consultation', status: 'completed',            src: 'reception' },
  ];

  for (const a of appointmentData) {
    const aid = uuid();
    appointmentIds.push(aid);
    await qr.query(`
      INSERT INTO appointments (id, patient_id, doctor_id, date, start_time, end_time, type, status, source, branch_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
    `, [aid, a.pid, a.did, a.date, a.st, a.et, a.type, a.status, a.src, branchMainId, now]);
  }

  // ==================== 11. MEDICAL RECORDS ====================
  console.log('Seeding medical records...');
  const medRecordIds: string[] = [];
  // indexes: [0]=p0/d0 today, [7]=p0/d0 yesterday(completed), [10]=p2/d1 today, [17]=p2/d1 -2d(completed)
  //          [19]=p4/d2 today(completed), [25]=p4/d2 -1d(completed), [27]=p5/d3 today, [34]=p5/d3 -2d(completed)
  //          [2]=p7/d0 today, [9]=p7/d0 -3d(completed)
  const medRecords = [
    { pid: patientIds[0], did: doctorIds[0], aid: appointmentIds[7], comp: 'Боли в области сердца при нагрузке', anam: 'Жалобы в течение 2 недель', exam: 'АД 140/90, пульс 82, ритм синусовый', diag: 'Стенокардия напряжения', code: 'I20.8', rec: 'Курс лечения, контроль через 2 недели', status: 'signed' },
    { pid: patientIds[2], did: doctorIds[1], aid: appointmentIds[17], comp: 'Головные боли, головокружение', anam: 'Беспокоит 1 месяц, усиление по утрам', exam: 'Зрачки равномерные, рефлексы сохранены', diag: 'Мигрень без ауры', code: 'G43.0', rec: 'МРТ головного мозга, медикаментозная терапия', status: 'signed' },
    { pid: patientIds[4], did: doctorIds[2], aid: appointmentIds[19], comp: 'Послеоперационный осмотр', anam: 'Операция 7 дней назад', exam: 'Рана чистая, швы состоятельны', diag: 'Послеоперационное наблюдение', code: 'Z48.0', rec: 'Снятие швов через 3 дня, перевязки ежедневно', status: 'signed' },
    { pid: patientIds[5], did: doctorIds[3], aid: appointmentIds[27], comp: 'Повышение температуры у ребёнка', anam: 'Температура 38.5 с вчерашнего дня', exam: 'Горло гиперемировано, лимфоузлы не увеличены', diag: 'Острый тонзиллит', code: 'J03.9', rec: 'Антибактериальная терапия 7 дней', status: 'draft' },
    { pid: patientIds[7], did: doctorIds[0], aid: appointmentIds[9], comp: 'Контрольный осмотр после лечения', anam: 'Гипертоническая болезнь II стадии', exam: 'АД 130/80, самочувствие удовлетворительное', diag: 'Гипертоническая болезнь II стадии', code: 'I11.9', rec: 'Продолжить текущую терапию', status: 'signed' },
  ];

  for (const mr of medRecords) {
    const mrid = uuid();
    medRecordIds.push(mrid);
    await qr.query(`
      INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, complaints, anamnesis, examination, diagnosis, diagnosis_code, recommendations, status, signed_at, attachments, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, '[]'::jsonb, $13, $13)
    `, [mrid, mr.pid, mr.did, mr.aid, mr.comp, mr.anam, mr.exam, mr.diag, mr.code, mr.rec, mr.status, mr.status === 'signed' ? now : null, now]);
  }

  // ==================== 12. VITAL SIGNS ====================
  console.log('Seeding vital signs...');
  const vitals = [
    { pid: patientIds[0], did: doctorIds[0], sys: 140, dia: 90, hr: 82, temp: 36.6, w: 85, h: 178, spo2: 97 },
    { pid: patientIds[2], did: doctorIds[1], sys: 120, dia: 80, hr: 72, temp: 36.5, w: 62, h: 165, spo2: 99 },
    { pid: patientIds[4], did: doctorIds[2], sys: 130, dia: 85, hr: 78, temp: 36.8, w: 90, h: 180, spo2: 98 },
    { pid: patientIds[5], did: doctorIds[3], sys: null, dia: null, hr: 110, temp: 38.5, w: 8.5, h: 75, spo2: 98 },
    { pid: patientIds[7], did: doctorIds[0], sys: 130, dia: 80, hr: 70, temp: 36.4, w: 68, h: 162, spo2: 98 },
  ];

  for (const v of vitals) {
    await qr.query(`
      INSERT INTO vital_signs (id, patient_id, doctor_id, systolic_bp, diastolic_bp, heart_rate, temperature, weight, height, spo2, measured_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $11)
    `, [uuid(), v.pid, v.did, v.sys, v.dia, v.hr, v.temp, v.w, v.h, v.spo2, now]);
  }

  // ==================== 13. PRESCRIPTIONS ====================
  console.log('Seeding prescriptions...');
  const prescriptions = [
    { pid: patientIds[0], did: doctorIds[0], mrid: medRecordIds[0], med: 'Бисопролол', dos: '5 мг', freq: '1 раз/день утром', dur: '30 дней', inst: 'Принимать натощак' },
    { pid: patientIds[0], did: doctorIds[0], mrid: medRecordIds[0], med: 'Аторвастатин', dos: '20 мг', freq: '1 раз/день вечером', dur: '30 дней', inst: 'После ужина' },
    { pid: patientIds[2], did: doctorIds[1], mrid: medRecordIds[1], med: 'Суматриптан', dos: '50 мг', freq: 'При приступе', dur: 'По необходимости', inst: 'Не более 2 таблеток в сутки' },
    { pid: patientIds[5], did: doctorIds[3], mrid: medRecordIds[3], med: 'Амоксициллин', dos: '250 мг', freq: '3 раза/день', dur: '7 дней', inst: 'После еды, запивать водой' },
    { pid: patientIds[7], did: doctorIds[0], mrid: medRecordIds[4], med: 'Лозартан', dos: '50 мг', freq: '1 раз/день', dur: '90 дней', inst: 'Утром, независимо от еды' },
  ];

  for (const p of prescriptions) {
    await qr.query(`
      INSERT INTO prescriptions (id, patient_id, doctor_id, medical_record_id, medication_name, dosage, frequency, duration, instructions, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $10)
    `, [uuid(), p.pid, p.did, p.mrid, p.med, p.dos, p.freq, p.dur, p.inst, now]);
  }

  // ==================== 14. INVOICES + ITEMS + PAYMENTS ====================
  console.log('Seeding invoices, items, and payments...');
  const invoices = [
    { pid: patientIds[0], aid: appointmentIds[7], num: 'INV-2026-0001', total: 500, disc: 0, final: 500, status: 'paid', svc: [{ sid: serviceIds[1], qty: 1, price: 350 }, { sid: serviceIds[5], qty: 1, price: 150 }], payMethod: 'card' },
    { pid: patientIds[2], aid: appointmentIds[17], num: 'INV-2026-0002', total: 300, disc: 30, final: 270, status: 'paid', svc: [{ sid: serviceIds[2], qty: 1, price: 300 }], payMethod: 'cash' },
    { pid: patientIds[4], aid: appointmentIds[19], num: 'INV-2026-0003', total: 480, disc: 0, final: 480, status: 'paid', svc: [{ sid: serviceIds[3], qty: 1, price: 400 }, { sid: serviceIds[9], qty: 1, price: 80 }], payMethod: 'insurance' },
    { pid: patientIds[5], aid: appointmentIds[27], num: 'INV-2026-0004', total: 250, disc: 0, final: 250, status: 'pending', svc: [{ sid: serviceIds[4], qty: 1, price: 250 }], payMethod: null },
    { pid: patientIds[7], aid: appointmentIds[9], num: 'INV-2026-0005', total: 350, disc: 50, final: 300, status: 'paid', svc: [{ sid: serviceIds[1], qty: 1, price: 350 }], payMethod: 'card' },
    { pid: patientIds[10], aid: null, num: 'INV-2026-0006', total: 350, disc: 0, final: 350, status: 'draft', svc: [{ sid: serviceIds[7], qty: 1, price: 100 }, { sid: serviceIds[8], qty: 1, price: 250 }], payMethod: null },
  ];

  for (const inv of invoices) {
    const invId = uuid();
    await qr.query(`
      INSERT INTO invoices (id, patient_id, appointment_id, invoice_number, total_amount, discount_amount, final_amount, status, branch_id, paid_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
    `, [invId, inv.pid, inv.aid, inv.num, inv.total, inv.disc, inv.final, inv.status, branchMainId, inv.status === 'paid' ? now : null, now]);

    for (const item of inv.svc) {
      await qr.query(`
        INSERT INTO invoice_items (id, invoice_id, service_id, quantity, unit_price, discount_percent, amount, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $7)
      `, [uuid(), invId, item.sid, item.qty, item.price, item.price * item.qty, now]);
    }

    if (inv.payMethod) {
      await qr.query(`
        INSERT INTO payments (id, invoice_id, amount, method, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $5)
      `, [uuid(), invId, inv.final, inv.payMethod, now]);
    }
  }

  // ==================== 15. EXPENSES ====================
  console.log('Seeding expenses...');
  const expenses = [
    { desc: 'Аренда помещения — март', amount: 25000, cat: 'rent', date: '2026-03-01', paid: 'ООО ДушанбеАренда' },
    { desc: 'Коммунальные услуги', amount: 5000, cat: 'utilities', date: '2026-03-05', paid: 'Барки тоджик' },
    { desc: 'Медицинские расходники', amount: 8000, cat: 'supplies', date: '2026-03-10', paid: 'МедСнаб' },
    { desc: 'Интернет и связь', amount: 1500, cat: 'utilities', date: '2026-03-15', paid: 'Tcell' },
    { desc: 'Реклама в соцсетях', amount: 3000, cat: 'marketing', date: '2026-03-20', paid: 'DigitalTJ' },
  ];

  for (const e of expenses) {
    await qr.query(`
      INSERT INTO expenses (id, description, amount, category, expense_date, paid_to, is_approved, created_by_id, branch_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $9)
    `, [uuid(), e.desc, e.amount, e.cat, e.date, e.paid, userAccountantId, branchMainId, now]);
  }

  // ==================== 16. CASH REGISTER ====================
  console.log('Seeding cash register...');
  await qr.query(`
    INSERT INTO cash_registers (id, branch_id, opened_by_id, opening_amount, cash_sales, card_sales, status, opened_at, created_at, updated_at)
    VALUES ($1, $2, $3, 5000, 270, 800, 'open', $4, $4, $4)
  `, [uuid(), branchMainId, userAdminId, now]);

  // ==================== 17. TASKS ====================
  console.log('Seeding tasks...');
  const tasks = [
    { title: 'Подготовить отчёт за март', desc: 'Сводный финансовый отчёт по всем филиалам', cid: userOwnerId, aid: userAccountantId, pri: 'high', st: 'in_progress', due: '2026-03-31' },
    { title: 'Обновить прайс-лист услуг', desc: 'Пересмотреть цены на консультации', cid: userChiefId, aid: userAdminId, pri: 'normal', st: 'new', due: '2026-04-05' },
    { title: 'Провести инвентаризацию склада', desc: 'Сверить остатки медикаментов', cid: userAdminId, aid: nurseIds[0], pri: 'high', st: 'new', due: '2026-04-01' },
    { title: 'Настроить 2FA для админов', desc: 'Включить двухфакторную аутентификацию', cid: userOwnerId, aid: userSysadminId, pri: 'urgent', st: 'in_progress', due: '2026-03-30' },
    { title: 'Подготовить кабинет 201 к ремонту', desc: 'Перенести оборудование, согласовать с подрядчиком', cid: userAdminId, aid: null, pri: 'low', st: 'new', due: '2026-04-15' },
    { title: 'Заказать расходные материалы', desc: 'Перчатки, маски, антисептики — запас на 2 месяца', cid: nurseIds[0], aid: userAdminId, pri: 'normal', st: 'completed', due: '2026-03-25' },
  ];

  for (const t of tasks) {
    const tid = uuid();
    await qr.query(`
      INSERT INTO tasks (id, title, description, created_by_id, assignee_id, priority, status, due_date, completed_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
    `, [tid, t.title, t.desc, t.cid, t.aid, t.pri, t.st, t.due, t.st === 'completed' ? now : null, now]);
  }

  // ==================== 18. INVENTORY ====================
  console.log('Seeding inventory...');
  const inventory = [
    { name: 'Перчатки латексные (M)', sku: 'INV-GLOVE-M', cat: 'Расходники', qty: 500, min: 100, unit: 'пара', price: 2.5 },
    { name: 'Маски медицинские', sku: 'INV-MASK', cat: 'Расходники', qty: 1000, min: 200, unit: 'шт', price: 1 },
    { name: 'Антисептик 500мл', sku: 'INV-ANTISEP', cat: 'Расходники', qty: 50, min: 20, unit: 'шт', price: 25 },
    { name: 'Бинт стерильный', sku: 'INV-BINT', cat: 'Расходники', qty: 200, min: 50, unit: 'шт', price: 8 },
    { name: 'Шприц 5мл', sku: 'INV-SYR5', cat: 'Расходники', qty: 300, min: 100, unit: 'шт', price: 3 },
    { name: 'Амоксициллин 250мг', sku: 'INV-AMOX250', cat: 'Медикаменты', qty: 80, min: 30, unit: 'упаковка', price: 45 },
    { name: 'Парацетамол 500мг', sku: 'INV-PARAC', cat: 'Медикаменты', qty: 150, min: 50, unit: 'упаковка', price: 15 },
    { name: 'Тонометр автоматический', sku: 'INV-TONOM', cat: 'Оборудование', qty: 5, min: 2, unit: 'шт', price: 800 },
  ];

  for (const i of inventory) {
    await qr.query(`
      INSERT INTO inventory_items (id, name, sku, category, quantity, min_quantity, unit, price, is_active, branch_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $10)
    `, [uuid(), i.name, i.sku, i.cat, i.qty, i.min, i.unit, i.price, branchMainId, now]);
  }

  // ==================== 19. COUNTERPARTIES ====================
  console.log('Seeding counterparties...');
  const counterparties = [
    { name: 'МедСнаб', type: 'supplier', phone: '+992372400001', contact: 'Рахимов А.К.', inn: '1234567890' },
    { name: 'ФармаТадж', type: 'pharmacy', phone: '+992372400002', contact: 'Саидова Н.Р.', inn: '0987654321' },
    { name: 'ЛабТест', type: 'lab', phone: '+992372400003', contact: 'Каримов Б.М.', inn: '1122334455' },
    { name: 'МедТехника', type: 'supplier', phone: '+992372400004', contact: 'Юсупов Д.Ш.', inn: '5566778899' },
  ];

  for (const c of counterparties) {
    await qr.query(`
      INSERT INTO counterparties (id, name, type, phone, contact_person, inn, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, $7, $7)
    `, [uuid(), c.name, c.type, c.phone, c.contact, c.inn, now]);
  }

  // ==================== 20. CHAT ROOMS + MESSAGES ====================
  console.log('Seeding chat rooms and messages...');
  const chatRoom1 = uuid();
  const chatRoom2 = uuid();

  await qr.query(`
    INSERT INTO chat_rooms (id, name, type, is_active, created_at, updated_at)
    VALUES
      ($1, 'Кардиология', 'group', true, $3, $3),
      ($2, NULL, 'direct', true, $3, $3)
  `, [chatRoom1, chatRoom2, now]);

  // Members
  const allDoctorAndAdminIds = [userOwnerId, doctorIds[0], doctorIds[5], userChiefId, nurseIds[0], userAdminId];
  for (const uid of allDoctorAndAdminIds) {
    await qr.query(`
      INSERT INTO chat_room_members (id, chat_room_id, user_id, joined_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $4, $4)
    `, [uuid(), chatRoom1, uid, now]);
  }

  // Direct chat between chief and doctor1
  for (const uid of [userChiefId, doctorIds[0]]) {
    await qr.query(`
      INSERT INTO chat_room_members (id, chat_room_id, user_id, joined_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $4, $4)
    `, [uuid(), chatRoom2, uid, now]);
  }

  // Messages
  const chatMessages = [
    { room: chatRoom1, sender: userChiefId, content: 'Коллеги, напоминаю о совещании в 15:00 сегодня' },
    { room: chatRoom1, sender: doctorIds[0], content: 'Хорошо, буду. У меня есть вопрос по пациенту Иванову.' },
    { room: chatRoom1, sender: doctorIds[5], content: 'Я тоже буду. Нужно обсудить результаты ЭКГ.' },
    { room: chatRoom1, sender: nurseIds[0], content: 'Подготовлю кабинет для совещания.' },
    { room: chatRoom2, sender: userChiefId, content: 'Алишер, как пациент Иванов? Есть улучшения?' },
    { room: chatRoom2, sender: doctorIds[0], content: 'Да, давление стабилизировалось. Продолжаем терапию.' },
    { room: chatRoom2, sender: userChiefId, content: 'Отлично. Запланируй контроль через 2 недели.' },
  ];

  for (const m of chatMessages) {
    await qr.query(`
      INSERT INTO chat_messages (id, chat_room_id, sender_id, content, type, is_read, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'text', false, $5, $5)
    `, [uuid(), m.room, m.sender, m.content, now]);
  }

  // ==================== 21. NOTIFICATIONS ====================
  console.log('Seeding notifications...');
  const notifications = [
    { uid: doctorIds[0], type: 'appointment', title: 'Новая запись', body: 'Пациент Иванов И.П. записан на 09:00 сегодня', link: '/scheduling/appointments' },
    { uid: doctorIds[1], type: 'appointment', title: 'Онлайн запись', body: 'Пациент Рахимова З.Б. записана онлайн на 11:00', link: '/scheduling/appointments' },
    { uid: userAdminId, type: 'system', title: 'Новая онлайн запись', body: 'Ожидает подтверждения: Каримов Р.А. к педиатру на 10:30', link: '/scheduling/appointments' },
    { uid: userAccountantId, type: 'task', title: 'Новая задача', body: 'Подготовить отчёт за март — срок до 31.03', link: '/tasks' },
    { uid: userSysadminId, type: 'task', title: 'Срочная задача', body: 'Настроить 2FA для админов — срок до 30.03', link: '/tasks' },
    { uid: userOwnerId, type: 'system', title: 'Отчёт за неделю', body: 'Проведено 45 приёмов, выручка 28,500 сомони', link: '/analytics' },
  ];

  for (const n of notifications) {
    await qr.query(`
      INSERT INTO notifications (id, user_id, type, title, body, is_read, link, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, false, $6, $7, $7)
    `, [uuid(), n.uid, n.type, n.title, n.body, n.link, now]);
  }

  // ==================== 22. AUDIT LOG ====================
  console.log('Seeding audit logs...');
  const auditLogs = [
    { uid: userOwnerId, action: 'LOGIN', entity: 'User', details: '{"ip": "192.168.1.1"}' },
    { uid: userAdminId, action: 'CREATE', entity: 'Patient', eid: patientIds[0], details: '{"name": "Иванов И.П."}' },
    { uid: doctorIds[0], action: 'CREATE', entity: 'MedicalRecord', eid: medRecordIds[0], details: '{"diagnosis": "Стенокардия"}' },
    { uid: userAdminId, action: 'CREATE', entity: 'Invoice', details: '{"number": "INV-2026-0001"}' },
    { uid: userOwnerId, action: 'UPDATE', entity: 'SystemSettings', details: '{"key": "clinic_name"}' },
  ];

  for (const a of auditLogs) {
    await qr.query(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, '192.168.1.1', $7)
    `, [uuid(), a.uid, a.action, a.entity, a.eid || null, a.details, now]);
  }

  // ==================== 23. DOCUMENTS ====================
  console.log('Seeding documents...');
  const docs = [
    { pid: patientIds[0], uid: doctorIds[0], title: 'Согласие на лечение — Иванов И.П.', type: 'consent', url: '/docs/consent_001.pdf' },
    { pid: patientIds[2], uid: doctorIds[1], title: 'Выписка — Холиков Ф.Р.', type: 'discharge', url: '/docs/discharge_001.pdf' },
    { pid: null, uid: userAdminId, title: 'Договор аренды помещения', type: 'contract', url: '/docs/contract_rent.pdf' },
    { pid: patientIds[4], uid: doctorIds[2], title: 'Справка — Назаров А.Ф.', type: 'certificate', url: '/docs/cert_001.pdf' },
  ];

  for (const d of docs) {
    await qr.query(`
      INSERT INTO documents (id, patient_id, user_id, title, type, file_url, mime_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'application/pdf', $7, $7)
    `, [uuid(), d.pid, d.uid, d.title, d.type, d.url, now]);
  }

  // ==================== 24. CUSTOM ROLES ====================
  console.log('Seeding custom roles...');
  await qr.query(`
    INSERT INTO custom_roles (id, name, description, permissions, is_active, base_role, created_at, updated_at)
    VALUES
      ($1, 'Старшая медсестра', 'Расширенные права медсестры', $3::jsonb, true, 'nurse', $5, $5),
      ($2, 'Регистратор', 'Сотрудник рецепшена', $4::jsonb, true, 'admin', $5, $5)
  `, [
    uuid(), uuid(),
    JSON.stringify(['patients:read', 'patients:create', 'patients:update', 'appointments:read', 'appointments:create', 'emr:read', 'inventory:read', 'inventory:update']),
    JSON.stringify(['patients:read', 'patients:create', 'patients:update', 'appointments:read', 'appointments:create', 'appointments:update', 'billing:read', 'billing:create']),
    now,
  ]);

  // ==================== 25. PATIENT USERS (for reviews) ====================
  console.log('Seeding patient users...');
  const patientUserIds = Array.from({ length: 5 }, () => uuid());

  const patientUsers = [
    { id: patientUserIds[0], email: 'patient1@mail.tj', fn: 'Иван', ln: 'Иванов', ph: '+992901220001' },
    { id: patientUserIds[1], email: 'patient2@mail.tj', fn: 'Мария', ln: 'Петрова', ph: '+992901220002' },
    { id: patientUserIds[2], email: 'patient3@mail.tj', fn: 'Фарход', ln: 'Холиков', ph: '+992901220003' },
    { id: patientUserIds[3], email: 'patient4@mail.tj', fn: 'Зарина', ln: 'Рахимова', ph: '+992901220004' },
    { id: patientUserIds[4], email: 'patient5@mail.tj', fn: 'Далер', ln: 'Мирзоев', ph: '+992901220005' },
  ];

  for (const p of patientUsers) {
    await qr.query(`
      INSERT INTO users (id, email, password, first_name, last_name, phone, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'patient', true, $7, $7)
    `, [p.id, p.email, pw, p.fn, p.ln, p.ph, now]);
  }

  // ==================== 26. REVIEWS ====================
  console.log('Seeding reviews...');
  const reviewsData = [
    { did: doctorIds[0], pid: patientUserIds[0], rating: 5, comment: 'Отличный кардиолог! Внимательный и профессиональный.' },
    { did: doctorIds[0], pid: patientUserIds[1], rating: 4, comment: 'Хороший специалист, всё объяснил подробно.' },
    { did: doctorIds[0], pid: patientUserIds[2], rating: 5, comment: 'Рекомендую! Очень грамотный врач.' },
    { did: doctorIds[1], pid: patientUserIds[0], rating: 5, comment: 'Невролог от Бога. Помогла справиться с мигренью.' },
    { did: doctorIds[1], pid: patientUserIds[3], rating: 4, comment: 'Профессиональный подход, вежливая.' },
    { did: doctorIds[2], pid: patientUserIds[1], rating: 5, comment: 'Блестящий хирург. Операция прошла идеально.' },
    { did: doctorIds[2], pid: patientUserIds[4], rating: 5, comment: 'Очень аккуратный и внимательный хирург.' },
    { did: doctorIds[3], pid: patientUserIds[2], rating: 4, comment: 'Хороший педиатр, ребёнок не боится.' },
    { did: doctorIds[3], pid: patientUserIds[3], rating: 5, comment: 'Замечательный доктор для детей!' },
    { did: doctorIds[4], pid: patientUserIds[0], rating: 4, comment: 'Терапевт хороший, назначил правильное лечение.' },
    { did: doctorIds[4], pid: patientUserIds[4], rating: 3, comment: 'Нормальный приём, но пришлось подождать.' },
    { did: doctorIds[5], pid: patientUserIds[1], rating: 5, comment: 'Каримова — прекрасный кардиолог!' },
    { did: doctorIds[5], pid: patientUserIds[3], rating: 4, comment: 'Внимательная и добрая. Рекомендую.' },
  ];

  for (const r of reviewsData) {
    await qr.query(`
      INSERT INTO reviews (id, doctor_id, patient_id, rating, comment, is_approved, created_at)
      VALUES ($1, $2, $3, $4, $5, true, $6)
    `, [uuid(), r.did, r.pid, r.rating, r.comment, now]);
  }

  // ==================== DONE ====================
  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  // ==================== SYSTEM SETTINGS ====================
  await qr.query(
    `INSERT INTO system_settings (id, key, value, category, description, value_type, created_at, updated_at)
     VALUES
       (gen_random_uuid(), 'default_currency', 'TJS', 'general', 'Default display currency (TJS, USD, EUR, RUB)', 'string', now(), now())
     ON CONFLICT (key) DO NOTHING`,
  );

  console.log('\nAccounts (password: password123):');
  console.log('  owner@clinic.tj      — Владелец');
  console.log('  chief@clinic.tj      — Главврач');
  console.log('  admin@clinic.tj      — Администратор');
  console.log('  sysadmin@clinic.tj   — Сисадмин');
  console.log('  accountant@clinic.tj — Бухгалтер');
  console.log('  doctor1@clinic.tj    — Кардиолог (Раджабов А.)');
  console.log('  doctor2@clinic.tj    — Невролог (Саидова Н.)');
  console.log('  doctor3@clinic.tj    — Хирург (Мирзоев Б.)');
  console.log('  doctor4@clinic.tj    — Педиатр (Ахмедова Д.)');
  console.log('  doctor5@clinic.tj    — Терапевт (Юсупов Ш.)');
  console.log('  doctor6@clinic.tj    — Кардиолог (Каримова Ф.)');
  console.log('  nurse1@clinic.tj     — Медсестра');
  console.log('  nurse2@clinic.tj     — Медсестра');
  console.log('  patient1@mail.tj     — Пациент (Иванов И.)');
  console.log('  patient2@mail.tj     — Пациент (Петрова М.)');
  console.log('  patient3@mail.tj     — Пациент (Холиков Ф.)');
  console.log('  patient4@mail.tj     — Пациент (Рахимова З.)');
  console.log('  patient5@mail.tj     — Пациент (Мирзоев Д.)');
  console.log('\nData seeded:');
  console.log('  2 branches, 5 departments, 18 users (13 staff + 5 patients)');
  console.log('  15 patients (3 VIP), 10 services');
  console.log('  6 rooms, 36 doctor schedules');
  console.log(`  ${appointmentData.length} appointments (5 per doctor × 6 doctors), 5 medical records`);
  console.log('  5 vital signs, 5 prescriptions');
  console.log('  6 invoices with items & payments');
  console.log('  5 expenses, 1 cash register');
  console.log('  6 tasks, 8 inventory items');
  console.log('  2 insurance companies, 4 counterparties');
  console.log('  2 chat rooms with 7 messages');
  console.log('  6 notifications, 5 audit logs');
  console.log('  4 documents, 2 custom roles');
  console.log('  5 patient users, 13 reviews');

  await dataSource.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
