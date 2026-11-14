// Sample application documents for the demo students. Each PDF is clearly
// labelled as a demo sample so it can never pass for an official record.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4 = [595.28, 841.89];
const INK = rgb(0.12, 0.16, 0.16);
const MUTED = rgb(0.4, 0.45, 0.43);
const FOOTER = 'Sample document generated for the CollApp demo. Not an official record.';

/** Same numbers for the same student every run. */
function seeded(key) {
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

async function page(build) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const p = doc.addPage(A4);
  let y = A4[1] - 64;
  const text = (value, { x = 56, size = 11, font = regular, color = INK, gap = 18 } = {}) => {
    p.drawText(value, { x, y, size, font, color });
    y -= gap;
  };
  const at = (value, x, yy, { size = 11, font = regular, color = INK } = {}) =>
    p.drawText(value, { x, y: yy, size, font, color });
  const space = (h) => (y -= h);
  const rule = () => {
    p.drawLine({ start: { x: 56, y: y + 8 }, end: { x: A4[0] - 56, y: y + 8 }, thickness: 0.6, color: MUTED });
    y -= 10;
  };
  await build({ text, at, space, rule, regular, bold, getY: () => y, setY: (v) => (y = v) });
  p.drawText(FOOTER, { x: 56, y: 40, size: 8, font: regular, color: MUTED });
  doc.setTitle('CollApp demo document');
  doc.setCreator('CollApp demo seed');
  return doc.save();
}

const fullName = (s) => `${s.first} ${s.last}`;
const longDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

const CORE = [
  'Oral Communication',
  'Reading and Writing',
  'Komunikasyon at Pananaliksik',
  'General Mathematics',
  'Statistics and Probability',
  'Earth and Life Science',
  'Physical Science',
  'Personal Development',
  'Understanding Culture, Society and Politics',
  'Physical Education and Health',
];
const BY_STRAND = {
  STEM: ['Pre-Calculus', 'Basic Calculus', 'General Biology', 'General Chemistry'],
  ABM: ['Business Mathematics', 'Fundamentals of ABM', 'Applied Economics', 'Business Finance'],
  HUMSS: ['Creative Writing', 'Philippine Politics and Governance', 'Introduction to World Religions', 'Community Engagement'],
  GAS: ['Humanities', 'Social Science', 'Applied Economics', 'Organization and Management'],
};

/** SHS report card whose grades average to the student's general average. */
export function reportCard(student) {
  const rand = seeded(`${student.key}-grades`);
  const subjects = [...CORE, ...(BY_STRAND[student.strand] ?? BY_STRAND.GAS)];
  const raw = subjects.map(() => student.gpa + (rand() - 0.5) * 8);
  const shift = student.gpa - raw.reduce((a, b) => a + b, 0) / raw.length;
  const grades = raw.map((g) => Math.max(75, Math.min(99, Math.round(g + shift))));
  const lrn = String(Math.floor(100000000000 + rand() * 899999999999));

  return page(({ text, at, space, rule, bold, getY, setY }) => {
    text('SENIOR HIGH SCHOOL REPORT CARD (FORM 138) - SAMPLE', { size: 14, font: bold, gap: 22 });
    text(student.highSchool, { size: 12, gap: 26 });
    text(`Learner: ${student.last.toUpperCase()}, ${student.first}`);
    text(`LRN: ${lrn}`);
    text(`Track / Strand: Academic Track - ${student.strand}`);
    text('School Year: 2025-2026 (Grade 12)', { gap: 28 });
    at('Learning area', 56, getY(), { font: bold });
    at('Final grade', 440, getY(), { font: bold });
    space(14);
    rule();
    subjects.forEach((subject, i) => {
      at(subject, 56, getY());
      at(String(grades[i]), 470, getY());
      space(18);
    });
    rule();
    at('General average', 56, getY(), { font: bold });
    at(student.gpa.toFixed(2), 462, getY(), { font: bold });
    setY(getY() - 40);
    text('Remarks: Promoted', { gap: 40 });
    text('_____________________________          _____________________________', { size: 10, gap: 14 });
    text('Class Adviser                                                    School Registrar', { size: 9 });
  });
}

/** Certificate of live birth summary (plainly marked as a sample copy). */
export function birthCertificate(student) {
  const rand = seeded(`${student.key}-birth`);
  const mothers = ['Maricel', 'Rowena', 'Jocelyn', 'Liza', 'Analyn', 'Marites'];
  const fathers = ['Roberto', 'Eduardo', 'Ramil', 'Joel', 'Arnel', 'Ronaldo'];
  const mother = `${mothers[Math.floor(rand() * mothers.length)]} ${student.last}`;
  const father = `${fathers[Math.floor(rand() * fathers.length)]} ${student.last}`;
  return page(({ text, space, rule, bold }) => {
    text('CERTIFICATE OF LIVE BIRTH - SAMPLE COPY', { size: 14, font: bold, gap: 30 });
    rule();
    text(`Name of child: ${fullName(student).toUpperCase()}`, { gap: 22 });
    text(`Sex: ${student.sex === 'female' ? 'Female' : 'Male'}`, { gap: 22 });
    text(`Date of birth: ${longDate(student.dob)}`, { gap: 22 });
    text(`Place of birth: ${student.city.city}, Cebu, Philippines`, { gap: 22 });
    text(`Name of mother: ${mother.toUpperCase()}`, { gap: 22 });
    text(`Name of father: ${father.toUpperCase()}`, { gap: 22 });
    text('Citizenship: Filipino', { gap: 22 });
    space(10);
    rule();
    text(`Registry number: ${new Date(student.dob).getFullYear()}-${String(Math.floor(rand() * 90000) + 10000)}`, { size: 10 });
  });
}

/** Good moral certificate from the student's senior high school. */
export function goodMoral(student) {
  const principals = ['Dr. Elena V. Ramirez', 'Mr. Antonio B. Saavedra', 'Dr. Josefina C. Lao'];
  const principal = principals[student.school % principals.length];
  return page(({ text, space, bold }) => {
    text(student.highSchool.toUpperCase(), { size: 13, font: bold, gap: 16 });
    text(`${student.city.city}, Cebu`, { size: 10, gap: 40 });
    text('CERTIFICATE OF GOOD MORAL CHARACTER - SAMPLE', { size: 14, font: bold, gap: 36 });
    text('TO WHOM IT MAY CONCERN:', { gap: 28 });
    text(`This is to certify that ${fullName(student).toUpperCase()} completed senior high school`);
    text(`at ${student.highSchool} in School Year 2025-2026 under the`);
    text(`Academic Track (${student.strand} strand).`, { gap: 26 });
    text('While enrolled in this institution, the student displayed good moral');
    text('character and has not been subjected to any disciplinary action.', { gap: 26 });
    text('This certification is issued for college admission purposes.', { gap: 60 });
    text(principal, { font: bold, gap: 14 });
    text('School Principal', { size: 10 });
    space(10);
  });
}

/** Medical certificate for nursing applicants. */
export function medicalCertificate(student) {
  return page(({ text, space, bold }) => {
    text('CEBU FAMILY HEALTH CLINIC', { size: 13, font: bold, gap: 16 });
    text('Cebu City', { size: 10, gap: 40 });
    text('MEDICAL CERTIFICATE - SAMPLE', { size: 14, font: bold, gap: 36 });
    text(`This is to certify that ${fullName(student).toUpperCase()} was examined at this clinic`);
    text('and was found physically and mentally fit to pursue college studies,', { gap: 26 });
    text('including clinical duty required in health science programs.', { gap: 60 });
    text('Dr. Carmela S. Yap, MD', { font: bold, gap: 14 });
    text('Attending Physician', { size: 10 });
    space(10);
  });
}

export const DOCUMENT_BUILDERS = {
  form138: reportCard,
  birth: birthCertificate,
  goodmoral: goodMoral,
  medical: medicalCertificate,
};
