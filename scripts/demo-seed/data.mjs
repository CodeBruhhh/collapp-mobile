// Demo content: five Cebu City schools (programs checked against each school's
// published list), their representatives, and fictional students.
// Deadlines, slots and minimum averages are demo values for the app, not the
// schools' real admission rules. Tuition is left blank (not verified).
// Every account uses demo.*@example.com so cleanup.mjs can find it.

export const DEMO_PASSWORD = 'CollAppDemo2026';
const REGION = 'Region VII (Central Visayas)';

/** Standard documents every school asks for (all required except the photo). */
const STANDARD_REQUIREMENTS = [
  {
    key: 'form138',
    label: 'SHS Report Card (Form 138)',
    description: 'Your Grade 11 and Grade 12 grades, signed by your school registrar.',
  },
  {
    key: 'birth',
    label: 'PSA Birth Certificate',
    description: 'A clear copy of your birth certificate issued by the Philippine Statistics Authority.',
  },
  {
    key: 'goodmoral',
    label: 'Certificate of Good Moral Character',
    description: 'Signed by your senior high school principal or guidance counselor.',
  },
  {
    key: 'photo',
    label: '2x2 ID Photo',
    description: 'Recent photo with a white background.',
    optional: true,
  },
];

const MEDICAL = {
  key: 'medical',
  label: 'Medical Certificate',
  description: 'Issued within the last 6 months, stating you are fit to study.',
};

const ESSAY = {
  key: 'essay',
  kind: 'essay',
  label: 'Personal statement',
  description: 'A short essay answering your program’s prompt.',
};

const NURSING_DESCRIPTION =
  'Prepares future nurses through classroom learning, skills laboratories and supervised hospital duty.';

export const SCHOOLS = [
  {
    key: 'usc',
    name: 'University of San Carlos',
    website: 'https://www.usc.edu.ph',
    description:
      'The University of San Carlos is a Catholic university in Cebu City run by the Society of the Divine Word, tracing its roots to 1595. Its Downtown and Talamban campuses offer programs in architecture, engineering, the arts and sciences, business, education and the health care professions.',
    assets: {
      wiki: 'University_of_San_Carlos',
      photoSearch: 'University of San Carlos Talamban campus Cebu',
    },
    reps: [
      { key: 'usc1', name: 'Maria Santos', email: 'demo.rep.usc@example.com' },
      { key: 'usc2', name: 'Paolo Villanueva', email: 'demo.rep2.usc@example.com' },
    ],
    essay: true,
    programs: [
      {
        key: 'cs',
        name: 'Bachelor of Science in Computer Science',
        degree: 'BS',
        description:
          'Algorithms, software development, data and intelligent systems, with a thesis in the final year.',
        strands: ['STEM'],
        min_gpa: 85,
        slots: 5,
        deadline: '2027-02-28',
        essay_prompt: 'Describe a problem you would like to solve with computing, and why it matters to you.',
      },
      {
        key: 'arch',
        name: 'Bachelor of Science in Architecture',
        degree: 'BS',
        description: 'Design studios, building technology and planning, leading to the architecture licensure exam.',
        strands: ['STEM'],
        min_gpa: 85,
        slots: 60,
        deadline: '2027-02-28',
        essay_prompt: 'Tell us about a building or place in Cebu that inspires you, and what you would change about it.',
      },
      {
        key: 'ce',
        name: 'Bachelor of Science in Civil Engineering',
        degree: 'BS',
        description: 'Structural, water, transportation and geotechnical engineering for safe, lasting infrastructure.',
        strands: ['STEM'],
        min_gpa: 85,
        slots: 80,
        deadline: '2027-03-15',
        essay_prompt: 'What kind of infrastructure does your community need most, and how would you help build it?',
      },
      {
        key: 'nursing',
        name: 'Bachelor of Science in Nursing',
        degree: 'BS',
        description: NURSING_DESCRIPTION,
        strands: ['STEM'],
        min_gpa: 85,
        slots: 70,
        deadline: '2027-02-15',
        essay_prompt: 'Why do you want to become a nurse? Share a moment that shaped this choice.',
        medical: true,
      },
      {
        key: 'psych',
        name: 'Bachelor of Science in Psychology',
        degree: 'BS',
        description: 'Human behavior, research methods and psychological assessment, with practicum placements.',
        strands: ['HUMSS', 'STEM'],
        min_gpa: 83,
        slots: 60,
        deadline: '2027-03-15',
        essay_prompt: 'What question about people or behavior do you most want to understand?',
      },
      {
        key: 'bamm',
        name: 'Bachelor of Science in Business Administration major in Marketing Management',
        degree: 'BS',
        description: 'Marketing strategy, consumer behavior, branding and digital marketing for growing businesses.',
        strands: ['ABM'],
        min_gpa: 82,
        slots: 90,
        deadline: '2027-03-31',
        essay_prompt: 'Pitch a product or business idea you believe Cebu needs.',
      },
    ],
    post: {
      type: 'news',
      title: 'Applications are open at USC: your future starts in Talamban',
      body:
        'Senior high school graduates, the University of San Carlos is now accepting applications for the coming school year!\n\nWhether you dream of designing buildings, writing software, caring for patients or building a business, our Downtown and Talamban campuses have a program for you. Learn from dedicated faculty, join a community of Carolinians and grow in a Catholic tradition of excellence and service.\n\nApply right here on CollApp: pick your program, upload your requirements and track your application from start to finish. Computer Science closes on February 28, so start your application today. Questions? Message our admissions team anytime.',
    },
    template: {
      kind: 'admit',
      title: 'Carolinian welcome',
      body: 'Congratulations, {first_name}! On behalf of the University of San Carlos, we are delighted to offer you admission to {program}. Welcome to the Carolinian family. Watch this space for your enrollment schedule and orientation details.',
    },
    resubmitTemplate: {
      kind: 'resubmit',
      title: 'Missing second semester',
      body: 'Your {document} only shows first-semester grades. Please upload a copy that includes your second-semester grades, signed by your registrar.',
    },
  },
  {
    key: 'citu',
    name: 'Cebu Institute of Technology – University',
    website: 'https://cit.edu',
    description:
      'Founded in 1946, Cebu Institute of Technology – University is a private university in Cebu City known for engineering and technology. It also offers programs in computer studies, business and accountancy, the arts and sciences, nursing and allied health, and criminal justice.',
    assets: { wiki: 'Cebu_Institute_of_Technology_–_University' },
    // The logo's yellow ranks first; the school leads with its darker color, so
    // primary and secondary are swapped and saved as a rep's customization.
    swapBrand: true,
    reps: [{ key: 'citu1', name: 'Joanna Lim', email: 'demo.rep.citu@example.com' }],
    essay: false,
    programs: [
      {
        key: 'ce',
        name: 'BS Civil Engineering',
        degree: 'BS',
        description: 'Structures, construction and water resources engineering, with board exam preparation.',
        strands: ['STEM'],
        min_gpa: 85,
        slots: 120,
        deadline: '2027-03-31',
      },
      {
        key: 'cpe',
        name: 'BS Computer Engineering',
        degree: 'BS',
        description: 'Hardware and software together: digital systems, embedded devices, networks and robotics.',
        strands: ['STEM'],
        min_gpa: 85,
        slots: 80,
        deadline: '2027-03-31',
      },
      {
        key: 'it',
        name: 'BS Information Technology',
        degree: 'BS',
        description: 'Designing, building and managing modern computing systems, networks and IT infrastructure.',
        strands: ['STEM', 'TVL - ICT'],
        min_gpa: 82,
        slots: 150,
        deadline: '2027-03-31',
      },
      {
        key: 'acct',
        name: 'BS Accountancy',
        degree: 'BS',
        description: 'Financial accounting, auditing, taxation and business law, preparing you for the CPA exam.',
        strands: ['ABM'],
        min_gpa: 85,
        slots: 80,
        deadline: '2027-03-15',
      },
      {
        key: 'nursing',
        name: 'BS Nursing',
        degree: 'BS',
        description: NURSING_DESCRIPTION,
        strands: ['STEM'],
        min_gpa: 85,
        slots: 60,
        deadline: '2027-02-28',
        medical: true,
      },
      {
        key: 'crim',
        name: 'BS Criminology',
        degree: 'BS',
        description: 'Law enforcement, criminalistics, corrections and crime prevention, with field training.',
        strands: ['HUMSS', 'GAS'],
        min_gpa: 80,
        slots: 100,
        deadline: '2027-04-15',
      },
    ],
    post: {
      type: 'news',
      title: 'Build what’s next. Apply to CIT-U today!',
      body:
        'Calling all future engineers, developers, nurses and business leaders! Cebu Institute of Technology – University is opening its doors to incoming first-year students.\n\nAt CIT-U, you learn by doing: hands-on laboratories, real-world projects and faculty who care about your success. Choose from programs in engineering and architecture, computer studies, management and accountancy, nursing and allied health, and more.\n\nSubmit your application on CollApp in minutes. Scan your documents with your phone, choose up to two programs, and follow every step of your application. See you on campus, future Technologian!',
    },
    template: {
      kind: 'admit',
      title: 'Technologian welcome',
      body: 'Hi {first_name}! Great news: you have been admitted to {program} at {college}. We can’t wait to see what you build with us. Your enrollment instructions will follow soon.',
    },
  },
  {
    key: 'uc',
    name: 'University of Cebu',
    website: 'https://uc.edu.ph',
    description:
      'The University of Cebu has served students from its flagship Main Campus on Sanciangko Street, Cebu City, since 1964, and now runs several campuses across Metro Cebu. Its colleges cover business and accountancy, computer studies, engineering, criminal justice, nursing, hospitality and tourism, and maritime education.',
    assets: { wiki: 'University_of_Cebu', photoCommons: 'File:University of Cebu (2024-01-24).jpg' },
    reps: [{ key: 'uc1', name: 'Ramon Dela Cruz', email: 'demo.rep.uc@example.com' }],
    essay: false,
    programs: [
      {
        key: 'it',
        name: 'Bachelor of Science in Information Technology',
        degree: 'BS',
        description: 'Programming, web and mobile development, networking and systems administration.',
        strands: ['STEM', 'TVL - ICT'],
        min_gpa: 80,
        slots: 200,
        deadline: '2027-04-15',
      },
      {
        key: 'crim',
        name: 'Bachelor of Science in Criminology',
        degree: 'BS',
        description: 'Criminal law, forensic science and law enforcement administration, with field practicum.',
        strands: ['HUMSS', 'GAS'],
        min_gpa: 80,
        slots: 180,
        deadline: '2027-04-15',
      },
      {
        key: 'nursing',
        name: 'Bachelor of Science in Nursing',
        degree: 'BS',
        description: NURSING_DESCRIPTION,
        strands: ['STEM'],
        min_gpa: 83,
        slots: 80,
        deadline: '2027-03-15',
        medical: true,
      },
      {
        key: 'acct',
        name: 'Bachelor of Science in Accountancy',
        degree: 'BS',
        description: 'Accounting, auditing and taxation, building toward the CPA licensure exam.',
        strands: ['ABM'],
        min_gpa: 85,
        slots: 120,
        deadline: '2027-03-31',
      },
      {
        key: 'hm',
        name: 'Bachelor of Science in Hospitality Management',
        degree: 'BS',
        description: 'Hotel, food and beverage, and events operations, with industry internships.',
        strands: ['ABM', 'TVL - Home Economics', 'GAS'],
        min_gpa: 80,
        slots: 150,
        deadline: '2027-04-15',
      },
      {
        key: 'mt',
        name: 'Bachelor of Science in Marine Transportation',
        degree: 'BS',
        description: 'Navigation, seamanship and ship operations, preparing future deck officers.',
        strands: ['STEM', 'GAS'],
        min_gpa: 80,
        slots: 100,
        deadline: '2027-01-31',
        closed: true,
      },
    ],
    post: {
      type: 'deadline',
      title: 'Your journey starts at UC: apply before April 15',
      body:
        'Hey, senior high graduates! The University of Cebu is now accepting applications for first-year college.\n\nFrom Information Technology and Accountancy to Nursing, Criminology and Hospitality Management, UC offers programs built for real careers, in campuses right here in Metro Cebu.\n\nMost programs accept applications until April 15, 2027, but slots go fast. Apply through CollApp today, upload your Form 138 and other requirements, and get updates on your application right on your phone. Kita-kits sa UC!',
      event_at: '2027-04-15T23:59:00+08:00',
    },
    template: {
      kind: 'admit',
      title: 'UC welcome',
      body: 'Congratulations, {first_name}! You are now admitted to {program} at the University of Cebu. Welcome to UC! Please wait for your enrollment schedule, which we will send through CollApp.',
    },
  },
  {
    key: 'cnu',
    name: 'Cebu Normal University',
    website: 'https://www.cnu.edu.ph',
    description:
      'Cebu Normal University is a state university on Osmeña Boulevard, Cebu City, founded in 1902 as the Cebu Normal School. CHED recognizes it as a Center of Excellence in Teacher Education and in Nursing Education. As a state university, it offers free tuition under the Universal Access to Quality Tertiary Education Act.',
    assets: { wiki: 'Cebu_Normal_University' },
    // The logo's yellow ranks first; the school leads with its darker color, so
    // primary and secondary are swapped and saved as a rep's customization.
    swapBrand: true,
    reps: [{ key: 'cnu1', name: 'Grace Abellana', email: 'demo.rep.cnu@example.com' }],
    essay: true,
    programs: [
      {
        key: 'beed',
        name: 'Bachelor of Elementary Education',
        degree: 'BEEd',
        description: 'Prepares teachers for the elementary grades, with extensive practice teaching in partner schools.',
        strands: ['HUMSS', 'GAS', 'STEM'],
        min_gpa: 85,
        slots: 120,
        deadline: '2027-02-28',
        essay_prompt: 'Describe a teacher who changed how you see learning, and the kind of teacher you want to be.',
      },
      {
        key: 'bsed',
        name: 'Bachelor of Secondary Education',
        degree: 'BSEd',
        description: 'Prepares high school teachers in a field of specialization, from English and Filipino to Mathematics and Science.',
        strands: ['HUMSS', 'GAS', 'STEM'],
        min_gpa: 85,
        slots: 150,
        deadline: '2027-02-28',
        essay_prompt: 'Which subject do you want to teach, and how would you make it come alive for students?',
      },
      {
        key: 'nursing',
        name: 'Bachelor of Science in Nursing',
        degree: 'BS',
        description: NURSING_DESCRIPTION,
        strands: ['STEM'],
        min_gpa: 88,
        slots: 80,
        deadline: '2027-02-15',
        essay_prompt: 'Why do you want to become a nurse? Share a moment that shaped this choice.',
        medical: true,
      },
      {
        key: 'psych',
        name: 'Bachelor of Science in Psychology',
        degree: 'BS',
        description: 'Human development, behavior and mental health, with research and community practicum.',
        strands: ['HUMSS', 'STEM', 'GAS'],
        min_gpa: 85,
        slots: 60,
        deadline: '2027-03-15',
        essay_prompt: 'What question about people or behavior do you most want to understand?',
      },
      {
        key: 'tourism',
        name: 'Bachelor of Science in Tourism Management',
        degree: 'BS',
        description: 'Travel, hospitality and sustainable tourism, showcasing Cebu and the Visayas to the world.',
        strands: ['ABM', 'HUMSS', 'GAS'],
        min_gpa: 83,
        slots: 80,
        deadline: '2027-03-31',
        essay_prompt: 'Which place in Cebu would you show a first-time visitor, and how would you make the trip unforgettable?',
      },
      {
        key: 'sned',
        name: 'Bachelor of Special Needs Education',
        degree: 'BSNEd',
        description: 'Prepares inclusive educators to teach and support learners with special needs.',
        strands: ['HUMSS', 'GAS'],
        min_gpa: 83,
        slots: 40,
        deadline: '2027-03-31',
        essay_prompt: 'What does an inclusive classroom look like to you?',
      },
    ],
    post: {
      type: 'news',
      title: 'Teach, heal, inspire: apply to Cebu Normal University',
      body:
        'For more than a century, Cebu Normal University has shaped the teachers and nurses of the Visayas. Now it’s your turn.\n\nCNU is a CHED Center of Excellence in Teacher Education and in Nursing Education, and as a state university we offer free tuition to qualified students. Explore programs in education, nursing, psychology, tourism and more on our CollApp page.\n\nSubmit your application, documents and personal statement through CollApp before the deadline for your program. We look forward to welcoming you to Osmeña Boulevard!',
    },
    template: {
      kind: 'admit',
      title: 'CNU welcome',
      body: 'Dear {first_name}, congratulations! Cebu Normal University is pleased to admit you to {program}. Welcome to the CNU community. Further instructions on enrollment and orientation will be sent to you soon.',
    },
  },
  {
    key: 'upc',
    name: 'University of the Philippines Cebu',
    website: 'https://upcebu.edu.ph',
    description:
      'The University of the Philippines Cebu, in Lahug, Cebu City, has been part of the national university since 1918 and is now an autonomous constituent university of the UP System. Its colleges of Communication, Art, and Design; Science; Social Sciences; and its School of Management offer free tuition to qualified students. Freshmen are admitted through the UP College Admission Test (UPCAT).',
    assets: { wiki: 'University_of_the_Philippines_Cebu' },
    reps: [{ key: 'upc1', name: 'Miguel Tan', email: 'demo.rep.upcebu@example.com' }],
    essay: true,
    programs: [
      {
        key: 'cs',
        name: 'Bachelor of Science in Computer Science',
        degree: 'BS',
        description: 'Theory and practice of computing: algorithms, systems, software engineering and research.',
        strands: ['STEM'],
        min_gpa: 88,
        slots: 50,
        deadline: '2027-02-15',
        prerequisites: 'Admission is through the UP College Admission Test (UPCAT).',
        essay_prompt: 'How do you hope to use computing to serve the Filipino people?',
      },
      {
        key: 'bio',
        name: 'Bachelor of Science in Biology',
        degree: 'BS',
        description: 'Life sciences from molecules to ecosystems, with strong field and laboratory research.',
        strands: ['STEM'],
        min_gpa: 88,
        slots: 50,
        deadline: '2027-02-15',
        prerequisites: 'Admission is through the UP College Admission Test (UPCAT).',
        essay_prompt: 'Which living system fascinates you most, and what would you like to discover about it?',
      },
      {
        key: 'polsci',
        name: 'Bachelor of Arts in Political Science',
        degree: 'BA',
        description: 'Government, public policy and political thought, preparing for law, public service and research.',
        strands: ['HUMSS'],
        min_gpa: 87,
        slots: 50,
        deadline: '2027-02-15',
        prerequisites: 'Admission is through the UP College Admission Test (UPCAT).',
        essay_prompt: 'What public issue in your community would you most like to help solve?',
      },
      {
        key: 'psych',
        name: 'Bachelor of Arts in Psychology',
        degree: 'BA',
        description: 'Mind and behavior in the Filipino context, with research methods and community engagement.',
        strands: ['HUMSS', 'STEM'],
        min_gpa: 87,
        slots: 50,
        deadline: '2027-02-15',
        prerequisites: 'Admission is through the UP College Admission Test (UPCAT).',
        essay_prompt: 'What question about people or behavior do you most want to understand?',
      },
      {
        key: 'mgt',
        name: 'Bachelor of Science in Management',
        degree: 'BS',
        description: 'Management, strategy and entrepreneurship for organizations in the Visayas and beyond.',
        strands: ['ABM', 'STEM'],
        min_gpa: 87,
        slots: 60,
        deadline: '2027-02-15',
        prerequisites: 'Admission is through the UP College Admission Test (UPCAT).',
        essay_prompt: 'Describe an organization you admire and one thing you would improve about it.',
      },
      {
        key: 'comm',
        name: 'Bachelor of Arts in Communication',
        degree: 'BA',
        description: 'Media, storytelling and communication research for print, broadcast and digital platforms.',
        strands: ['HUMSS', 'Arts and Design'],
        min_gpa: 87,
        slots: 40,
        deadline: '2027-02-15',
        prerequisites: 'Admission is through the UP College Admission Test (UPCAT).',
        essay_prompt: 'Tell us about a story from your community that deserves to be heard.',
      },
    ],
    post: {
      type: 'news',
      title: 'Iskolar ng Bayan ka ba? Apply to UP Cebu',
      body:
        'The University of the Philippines Cebu welcomes aspiring Iskolars ng Bayan to join our community in Lahug!\n\nStudy computer science, biology, management, political science, psychology, communication or the arts at an autonomous constituent university of the UP System, with free tuition for qualified students. Freshmen are admitted through the UPCAT.\n\nYou can now send your application, requirements and personal statement through CollApp and follow its progress anytime. Honor and excellence await. Apply now!',
    },
    template: {
      kind: 'admit',
      title: 'UP Cebu welcome',
      body: 'Congratulations, {first_name}! You have been admitted to {program} at the University of the Philippines Cebu. Welcome, Iskolar ng Bayan! Details on registration and orientation will follow.',
    },
  },
];

/** Requirement rows for a school: the standard four, an essay where asked, a medical certificate for nursing. */
export function requirementsFor(school) {
  return [
    ...STANDARD_REQUIREMENTS.map((r) => ({ ...r, kind: 'document', program: null })),
    ...(school.essay ? [{ ...ESSAY, program: null }] : []),
    ...school.programs
      .filter((p) => p.medical)
      .map((p) => ({ ...MEDICAL, kind: 'document', program: p.key, key: `medical-${p.key}` })),
  ];
}

const HIGH_SCHOOLS = [
  'Abellana National School',
  'Cebu City National Science High School',
  'Mandaue City Comprehensive National High School',
  'Talisay City National High School',
  'Lapu-Lapu City National High School',
];

const address = (city, street, zipCode) => ({
  isInternational: false,
  country: 'Philippines',
  region: REGION,
  province: 'Cebu',
  city,
  street,
  zipCode,
});

/** Fictional students. `school` indexes HIGH_SCHOOLS. */
export const STUDENTS = [
  { key: 's1', first: 'Andrea', last: 'Flores', sex: 'female', dob: '2008-03-14', city: address('Cebu City', 'Brgy. Lahug', '6000'), school: 1, strand: 'STEM', gpa: 94.2, majors: ['Computer Science', 'Information Technology'], interests: ['Technology', 'Science'], goals: 'Build software that helps small businesses in Cebu grow.' },
  { key: 's2', first: 'Carlo', last: 'Mendoza', sex: 'male', dob: '2008-07-02', city: address('Mandaue City', 'Brgy. Subangdaku', '6014'), school: 2, strand: 'STEM', gpa: 91.5, majors: ['Computer Science', 'Information Technology'], interests: ['Technology', 'Engineering'], goals: 'Work as a software engineer and eventually start a tech company.' },
  { key: 's3', first: 'Bianca', last: 'Reyes', sex: 'female', dob: '2008-01-22', city: address('Cebu City', 'Brgy. Talamban', '6000'), school: 1, strand: 'STEM', gpa: 96.0, majors: ['Computer Science'], interests: ['Technology', 'Science'], goals: 'Do research in artificial intelligence for healthcare.' },
  { key: 's4', first: 'Daniel', last: 'Garcia', sex: 'male', dob: '2007-11-09', city: address('Talisay City', 'Brgy. Tabunok', '6045'), school: 3, strand: 'STEM', gpa: 88.7, majors: ['Civil Engineering', 'Architecture'], interests: ['Engineering', 'Design'], goals: 'Design safer roads and bridges for Cebu province.' },
  { key: 's5', first: 'Ella', last: 'Navarro', sex: 'female', dob: '2008-05-30', city: address('Cebu City', 'Brgy. Guadalupe', '6000'), school: 0, strand: 'STEM', gpa: 92.3, majors: ['Nursing'], interests: ['Health', 'Science'], goals: 'Become a pediatric nurse in a public hospital.' },
  { key: 's6', first: 'Francis', last: 'Aquino', sex: 'male', dob: '2008-02-18', city: address('Cebu City', 'Brgy. Mabolo', '6000'), school: 0, strand: 'ABM', gpa: 89.0, majors: ['Business Administration', 'Accountancy'], interests: ['Business'], goals: 'Grow my family’s food business into a regional brand.' },
  { key: 's7', first: 'Gabrielle', last: 'Ramos', sex: 'female', dob: '2008-09-05', city: address('Lapu-Lapu City', 'Brgy. Pusok', '6015'), school: 4, strand: 'HUMSS', gpa: 90.4, majors: ['Psychology'], interests: ['Health', 'Education'], goals: 'Become a guidance counselor who helps students with mental health.' },
  { key: 's8', first: 'Hannah', last: 'Uy', sex: 'female', dob: '2008-04-11', city: address('Cebu City', 'Brgy. Kamputhaw', '6000'), school: 1, strand: 'STEM', gpa: 95.1, majors: ['Architecture'], interests: ['Design', 'Arts'], goals: 'Design sustainable, climate-ready homes for Filipino families.' },
  { key: 's9', first: 'Ivan', last: 'Castillo', sex: 'male', dob: '2007-12-01', city: address('Mandaue City', 'Brgy. Bakilid', '6014'), school: 2, strand: 'STEM', gpa: 84.5, majors: ['Computer Science', 'Information Technology'], interests: ['Technology', 'Sports'], goals: 'Work in IT support and network administration.' },
  { key: 's10', first: 'Jasmine', last: 'Torres', sex: 'female', dob: '2008-06-19', city: address('Cebu City', 'Brgy. Banilad', '6000'), school: 1, strand: 'STEM', gpa: 93.8, majors: ['Computer Science'], interests: ['Technology', 'Design'], goals: 'Create mobile apps that make public services easier to use.' },
  { key: 's11', first: 'Kevin', last: 'Lim', sex: 'male', dob: '2008-08-27', city: address('Cebu City', 'Brgy. Capitol Site', '6000'), school: 0, strand: 'STEM', gpa: 90.0, majors: ['Computer Engineering', 'Electrical Engineering'], interests: ['Engineering', 'Technology'], goals: 'Build robots and embedded systems for local manufacturers.' },
  { key: 's12', first: 'Lea', last: 'Bautista', sex: 'female', dob: '2008-10-03', city: address('Talisay City', 'Brgy. Lawaan', '6045'), school: 3, strand: 'HUMSS', gpa: 88.2, majors: ['Education'], interests: ['Education', 'Public Service'], goals: 'Teach elementary pupils in my home barangay.' },
  { key: 's13', first: 'Mark', last: 'Soriano', sex: 'male', dob: '2007-10-21', city: address('Lapu-Lapu City', 'Brgy. Gun-ob', '6015'), school: 4, strand: 'HUMSS', gpa: 85.3, majors: ['Criminology'], interests: ['Law', 'Public Service'], goals: 'Serve in the Philippine National Police as an investigator.' },
  { key: 's14', first: 'Nicole', last: 'Pascual', sex: 'female', dob: '2008-03-08', city: address('Cebu City', 'Brgy. Labangon', '6000'), school: 0, strand: 'STEM', gpa: 91.0, majors: ['Nursing', 'Medical Technology'], interests: ['Health'], goals: 'Work as a nurse and later take up medicine.' },
  { key: 's15', first: 'Oscar', last: 'Villareal', sex: 'male', dob: '2008-01-15', city: address('Mandaue City', 'Brgy. Tipolo', '6014'), school: 2, strand: 'ABM', gpa: 87.6, majors: ['Hospitality Management', 'Tourism Management'], interests: ['Business', 'Arts'], goals: 'Manage a resort that promotes Cebuano culture.' },
  { key: 's16', first: 'Patricia', last: 'Go', sex: 'female', dob: '2008-05-12', city: address('Cebu City', 'Brgy. Lahug', '6000'), school: 1, strand: 'HUMSS', gpa: 92.7, majors: ['Political Science'], interests: ['Law', 'Public Service'], goals: 'Become a lawyer working on environmental policy.' },
  { key: 's17', first: 'Rafael', last: 'Cruz', sex: 'male', dob: '2008-02-28', city: address('Cebu City', 'Brgy. Apas', '6000'), school: 1, strand: 'STEM', gpa: 89.9, majors: ['Biology', 'Computer Science'], interests: ['Science', 'Technology'], goals: 'Use data science to study marine life around Cebu.' },
  { key: 's18', first: 'Sofia', last: 'Mercado', sex: 'female', dob: '2008-07-24', city: address('Talisay City', 'Brgy. Bulacao', '6045'), school: 3, strand: 'GAS', gpa: 90.6, majors: ['Psychology', 'Education'], interests: ['Education', 'Health'], goals: 'Help children with learning difficulties reach their potential.' },
].map((s) => ({
  ...s,
  email: `demo.student.${s.first.toLowerCase()}@example.com`,
  highSchool: HIGH_SCHOOLS[s.school],
}));

/**
 * Applications. `docs`: 'pending' | 'mixed' (one pending, rest approved) | 'approved'
 * | 'resubmit' (one sent back). `held`: a decision waiting for batch release.
 * `assignee`: rep key. `days`: how long ago it was submitted.
 */
export const APPLICATIONS = [
  // University of San Carlos: the busy queue for the demo.
  { student: 's1', school: 'usc', program: 'cs', status: 'under_review', days: 12, docs: 'mixed', assignee: 'usc1' },
  { student: 's2', school: 'usc', program: 'cs', status: 'submitted', days: 9, docs: 'pending' },
  { student: 's3', school: 'usc', program: 'cs', status: 'accepted', days: 24, docs: 'approved', assignee: 'usc1', decidedDays: 6 },
  { student: 's9', school: 'usc', program: 'cs', status: 'rejected', days: 22, docs: 'approved', assignee: 'usc1', decidedDays: 5 },
  { student: 's10', school: 'usc', program: 'cs', status: 'under_review', days: 15, docs: 'approved', assignee: 'usc1', held: 'accepted' },
  { student: 's17', school: 'usc', program: 'cs', status: 'under_review', days: 4, docs: 'mixed', assignee: 'usc2', held: 'rejected' },
  { student: 's4', school: 'usc', program: 'ce', second: 'arch', status: 'under_review', days: 10, docs: 'mixed', assignee: 'usc1' },
  { student: 's8', school: 'usc', program: 'arch', status: 'under_review', days: 6, docs: 'approved', assignee: 'usc1' },
  { student: 's5', school: 'usc', program: 'nursing', status: 'submitted', days: 2, docs: 'pending', assignee: 'usc2' },
  { student: 's7', school: 'usc', program: 'psych', status: 'action_required', days: 8, docs: 'resubmit', assignee: 'usc2' },
  { student: 's6', school: 'usc', program: 'bamm', status: 'accepted', days: 20, docs: 'approved', assignee: 'usc2', decidedDays: 3 },
  { student: 's14', school: 'usc', program: 'nursing', status: 'submitted', days: 1, docs: 'pending' },

  // CIT-U
  { student: 's2', school: 'citu', program: 'it', status: 'accepted', days: 18, docs: 'approved', decidedDays: 4 },
  { student: 's4', school: 'citu', program: 'ce', status: 'action_required', days: 11, docs: 'resubmit' },
  { student: 's11', school: 'citu', program: 'cpe', second: 'it', status: 'submitted', days: 3, docs: 'pending' },
  { student: 's13', school: 'citu', program: 'crim', status: 'submitted', days: 5, docs: 'pending' },
  { student: 's14', school: 'citu', program: 'nursing', status: 'under_review', days: 9, docs: 'mixed' },

  // University of Cebu
  { student: 's6', school: 'uc', program: 'acct', status: 'submitted', days: 7, docs: 'pending' },
  { student: 's9', school: 'uc', program: 'it', status: 'accepted', days: 16, docs: 'approved', decidedDays: 2 },
  { student: 's13', school: 'uc', program: 'crim', status: 'under_review', days: 10, docs: 'mixed' },
  { student: 's14', school: 'uc', program: 'nursing', status: 'action_required', days: 12, docs: 'resubmit' },
  { student: 's15', school: 'uc', program: 'hm', status: 'submitted', days: 2, docs: 'pending' },

  // Cebu Normal University
  { student: 's5', school: 'cnu', program: 'nursing', status: 'under_review', days: 13, docs: 'mixed' },
  { student: 's12', school: 'cnu', program: 'beed', status: 'accepted', days: 21, docs: 'approved', decidedDays: 7 },
  { student: 's15', school: 'cnu', program: 'tourism', status: 'submitted', days: 4, docs: 'pending' },
  { student: 's18', school: 'cnu', program: 'psych', status: 'submitted', days: 3, docs: 'pending' },
  { student: 's18', school: 'cnu', program: 'bsed', status: 'draft' },

  // UP Cebu
  { student: 's1', school: 'upc', program: 'cs', status: 'submitted', days: 6, docs: 'pending' },
  { student: 's3', school: 'upc', program: 'cs', status: 'under_review', days: 14, docs: 'mixed' },
  { student: 's7', school: 'upc', program: 'psych', status: 'submitted', days: 5, docs: 'pending' },
  { student: 's16', school: 'upc', program: 'polsci', status: 'under_review', days: 9, docs: 'approved' },
  { student: 's17', school: 'upc', program: 'bio', status: 'rejected', days: 19, docs: 'approved', decidedDays: 4 },
];

/** Notes for a document sent back for resubmission. */
export const RESUBMIT_NOTES = {
  form138: 'Your report card only shows first-semester grades. Please upload a copy with your second-semester grades, signed by your registrar.',
  birth: 'The birth certificate is hard to read. Please upload a clearer scan of your PSA copy.',
};

/** Essays (personal statements) in each student's own voice. */
export const ESSAYS = {
  s1: 'My tita runs a small sari-sari store in Lahug, and every night she tallies her sales in a notebook. Last summer I built her a simple app to track stock and credit. Watching her save hours each week showed me how much good a few lines of code can do. I want to study computer science so I can build tools that make life easier for small business owners like her.',
  s2: 'In Grade 10 I fixed our school’s broken attendance spreadsheet with a few formulas, and suddenly teachers saved an hour every week. Since then I have taught myself Python and built small games and tools for friends. I want to study computer science to learn how to build software properly, and one day start a tech company here in Cebu.',
  s9: 'I am the one my family calls when the Wi-Fi stops working or the computer will not start. I enjoy figuring out what went wrong and fixing it. I want to study computing so I can turn that curiosity into a career in IT support and networking.',
  s3: 'When my lola was in the hospital, I noticed how long patients waited just to be seen. I started reading about how artificial intelligence helps doctors sort cases faster. I joined our science fair with a simple model that flags urgent symptoms. It was far from perfect, but it made me certain that I want to do research where computing and healthcare meet.',
  s4: 'Every rainy season, the road near our house in Tabunok floods and jeepneys stop running. I have always wondered why. I want to become a civil engineer who designs drainage and roads that work for the people who use them every day, so that no student misses class because of a flooded street.',
  s5: 'When my younger brother was confined for dengue, a nurse stayed with us through the night, explaining every step and calming my mother. I will never forget her kindness. That night I decided I wanted to become a nurse who cares for families the way she cared for mine.',
  s6: 'My family sells lechon in Mabolo. I have helped with orders since I was twelve, and I started our Facebook page, which tripled our weekend sales. I want to study marketing so I can turn our small business into a brand known across the Visayas, and help other family businesses do the same.',
  s7: 'In senior high school I became the person my classmates talked to when they felt overwhelmed. I realized many of them had nowhere else to go. I want to study psychology to understand why people struggle and how to help them, and someday work as a guidance counselor in a public school.',
  s8: 'Typhoon Odette damaged so many homes in our neighborhood. Helping my father repair our roof made me think about how houses could be built to withstand storms while staying affordable. I want to study architecture to design climate-ready homes that Filipino families can afford.',
  s10: 'Applying for a barangay clearance took my mother three trips and a whole day. I believe public services can be simple and fast. I have been teaching myself mobile development, and I want to study computer science to build apps that make government services easier for every Filipino.',
  s12: 'My Grade 3 teacher noticed I struggled with reading and stayed after class to help me every day. Because of her, reading became my favorite thing. I want to be the same kind of teacher for children in my barangay, patient, kind and never giving up on a pupil.',
  s14: 'Volunteering at our barangay health center during a vaccination drive showed me how much nurses do for a community. I want to study nursing to serve patients with skill and compassion, and later continue to medicine.',
  s15: 'I grew up near the Mactan resorts, watching visitors fall in love with Cebu. I want them to see more than the beaches: our festivals, food and history. I want to study tourism so I can create trips that share Cebuano culture with the world.',
  s16: 'Our coastal barangay loses more shoreline every year, and the people affected rarely have a voice in the decisions. I want to study political science to understand how policy is made and later become a lawyer who fights for communities like mine.',
  s17: 'I spent my summers snorkeling in Moalboal and started recording the fish I saw in a spreadsheet. I was surprised how much the data could tell me. I want to study biology to understand the marine life around Cebu and help protect it.',
  s18: 'My cousin has dyslexia, and I watched her lose confidence in school until a patient tutor helped her. I want to study psychology so I can understand how children learn differently and help them succeed.',
};

/** Short conversations between students and admissions, newest last. */
export const THREADS = [
  {
    school: 'usc',
    student: 's7',
    messages: [
      { from: 'student', text: 'Good afternoon po! I received a note that my Form 138 is incomplete. Can I upload the new copy here in the app?', hoursAgo: 30 },
      { from: 'rep', rep: 'usc2', text: 'Good afternoon, Gabrielle! Yes, just open your application and tap Replace on the report card. We need the copy with your second-semester grades.', hoursAgo: 28 },
      { from: 'student', text: 'Thank you po! I will get the signed copy from our registrar tomorrow.', hoursAgo: 27 },
    ],
  },
  {
    school: 'usc',
    student: 's1',
    messages: [
      { from: 'student', text: 'Hi! Is the Computer Science program offered at the Talamban campus?', hoursAgo: 72 },
      { from: 'rep', rep: 'usc1', text: 'Hi Andrea! Yes, Computer Science classes are held in Talamban. Your application is under review and we will update you soon.', hoursAgo: 70 },
    ],
  },
  {
    school: 'uc',
    student: 's14',
    messages: [
      { from: 'student', text: 'Hello po, where can I get the medical certificate for nursing? Is a barangay health center certificate okay?', hoursAgo: 50 },
      { from: 'rep', rep: 'uc1', text: 'Hi Nicole! A certificate from any licensed physician is fine, as long as it was issued within the last 6 months.', hoursAgo: 46 },
    ],
  },
  {
    school: 'cnu',
    student: 's5',
    messages: [
      { from: 'student', text: 'Good morning! How many slots are there for BS Nursing this year?', hoursAgo: 20 },
      { from: 'rep', rep: 'cnu1', text: 'Good morning, Ella! We are admitting 80 nursing students this year. Make sure all your documents are complete before February 15.', hoursAgo: 18 },
    ],
  },
  {
    school: 'upc',
    student: 's16',
    messages: [{ from: 'student', text: 'Hello! Do I still need to submit my UPCAT result here, or will UP Cebu get it automatically?', hoursAgo: 6 }],
  },
];

/** A message from a rep to the CollApp administrator (shows in the admin inbox). */
export const ADMIN_THREAD = {
  school: 'usc',
  rep: 'usc1',
  subject: 'Featuring our page',
  messages: [
    { from: 'rep', text: 'Hello! Our college page is now complete with programs and requirements. Could the University of San Carlos be featured on the student home screen this month?', hoursAgo: 26 },
  ],
};

export const COMMENTS = [
  { school: 'usc', student: 's1', text: 'Excited to apply for Computer Science! 💻' },
  { school: 'usc', student: 's8', text: 'Is there a portfolio requirement for Architecture?' },
  { school: 'citu', student: 's11', text: 'Already sent my application. Go Technologians!' },
  { school: 'uc', student: 's15', text: 'Thank you for the reminder about the deadline!' },
  { school: 'cnu', student: 's12', text: 'CNU has always been my dream school. 🙏' },
  { school: 'upc', student: 's16', text: 'Iskolar ng Bayan, here I come!' },
];
