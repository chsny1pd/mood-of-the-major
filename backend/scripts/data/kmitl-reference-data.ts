import { slugifyReferenceName, uniqueSlugs } from "./kmitl-slug.js";

export const LEGACY_FACULTY_SLUGS = ["engineering", "science"] as const;

export const LEGACY_MAJOR_SLUGS = [
  "computer-science",
  "electrical-engineering",
  "mathematics",
  "physics",
] as const;

export interface KmitlMajorSeed {
  slug: string;
  nameEn: string;
  nameTh: string;
  code?: string | null;
}

export interface KmitlFacultySeed {
  slug: string;
  nameEn: string;
  nameTh: string;
  code: string;
  sortOrder: number;
  description?: string;
  majors: KmitlMajorSeed[];
}

type KmitlMajorInput = Omit<KmitlMajorSeed, "slug">;

function assignMajorSlugs(majors: KmitlMajorInput[]): KmitlMajorSeed[] {
  const slugs = uniqueSlugs(majors.map((major) => major.nameEn));
  return majors.map((major, index) => ({
    ...major,
    slug: slugs[index] ?? slugifyReferenceName(major.nameEn) ?? "program",
  }));
}

const KMITL_FACULTY_MAJORS: Array<Omit<KmitlFacultySeed, "majors"> & { majors: KmitlMajorInput[] }> = [
  {
    slug: "kmitl-engineering",
    nameEn: "School of Engineering",
    nameTh: "คณะวิศวกรรมศาสตร์",
    code: "ENG",
    sortOrder: 1,
    majors: [
      { nameEn: "Bachelor of Engineering Program in Agri-Intelligence Engineering", nameTh: "วศ.บ.วิศวกรรมเกษตรอัจฉริยะ" },
      { nameEn: "Bachelor of Engineering in Telecommunications and Network Engineering", nameTh: "วศ.บ.วิศวกรรมโทรคมนาคมและโครงข่าย" },
      { nameEn: "Bachelor of Engineering Program in Electrical Engineering", nameTh: "วศ.บ.วิศวกรรมไฟฟ้า" },
      { nameEn: "Bachelor of Engineering Program in Computer Engineering", nameTh: "วศ.บ.วิศวกรรมคอมพิวเตอร์" },
      { nameEn: "Bachelor of Engineering Program in Mechatronics and Automation Engineering", nameTh: "วศ.บ. วิศวกรรมเมคคาทรอนิกส์และออโตเมชัน" },
      { nameEn: "Bachelor of Engineering Program in Mechanical Engineering", nameTh: "วศ.บ.วิศวกรรมเครื่องกล" },
      { nameEn: "Bachelor of Engineering Program in Rail Transportation Engineering", nameTh: "วศ.บ.วิศวกรรมขนส่งทางราง" },
      { nameEn: "Bachelor of Engineering Program in Civil Engineering", nameTh: "วศ.บ.วิศวกรรมโยธา" },
      { nameEn: "Bachelor of Engineering Program in Chemical Engineering", nameTh: "วศ.บ.วิศวกรรมเคมี" },
      { nameEn: "Bachelor of Engineering Program in Industrial Engineering", nameTh: "วศ.บ.วิศวกรรมอุตสาหการ" },
      { nameEn: "Bachelor of Engineering Program in Food Engineering", nameTh: "วศ.บ.วิศวกรรมอาหาร" },
      { nameEn: "Bachelor of Engineering Program in Automation Engineering", nameTh: "วศ.บ.วิศวกรรมอัตโนมัติ (ควบรวมหลักสูตร) (เสนองดรับนักศึกษา 2563)" },
      { nameEn: "Bachelor of Engineering Program in Electronics Engineering", nameTh: "วศ.บ.วิศวกรรมอิเล็กทรอนิกส์" },
      { nameEn: "Bachelor of Engineering Program in Control Engineering", nameTh: "วศ.บ.วิศวกรรมระบบควบคุม (ควบรวมหลักสูตร) (เสนองดรับนักศึกษา 2563)" },
      { nameEn: "Bachelor of Engineering Program in Mechatronics Engineering", nameTh: "วศ.บ.วิศวกรรมแมคคาทรอนิกส์ (ควบรวมหลักสูตร) (เสนองดรับนักศึกษา 2563)" },
      { nameEn: "Bachelor of Engineering Program in Petrochemical Engineering", nameTh: "วศ.บ.วิศวกรรมปิโตรเคมี" },
      { nameEn: "Bachelor of Engineering Program in Production Design and Materials Engineering", nameTh: "วศ.บ.วิศวกรรมออกแบบการผลิตและวัสดุ" },
      { nameEn: "Bachelor of Engineering Program in IoT system and Information Engineering", nameTh: "วศ.บ.วิศวกรรมระบบไอโอทีและสารสนเทศ" },
      { nameEn: "Bachelor of Engineering Program in Agro-Industrial Systems Engineering (Continuing Program)", nameTh: "วศ.บ.วิศวกรรมระบบอุตสาหกรรมการเกษตร (ต่อเนื่อง)" },
      { nameEn: "Bachelor of Engineering Program in Civil Engineering (Continuing Program)", nameTh: "วศ.บ.วิศวกรรมโยธา (ต่อเนื่อง)" },
      { nameEn: "Bachelor of Engineering Program in Computer Engineering (Continuing Program)", nameTh: "วศ.บ.วิศวกรรมคอมพิวเตอร์ (ต่อเนื่อง)" },
      { nameEn: "Bachelor of Engineering Program in Instrumentation Engineering (Continuing Program)", nameTh: "วศ.บ. วิศวกรรมการวัดคุม (ต่อเนื่อง)" },
      { nameEn: "Bachelor of Engineering Program in Communications and Electronics Engineering(Continuing Program)", nameTh: "วศ.บ.วิศวกรรมไฟฟ้าสื่อสารและอิเล็กทรอนิกส์ (ต่อเนื่อง) จากเดิมวิศวกรรมสารสนเทศ 3" },
      { nameEn: "Bachelor of Engineering Program in Biomedical Engineering (International Program) (multidisciplinary)", nameTh: "วศ.บ.วิศวกรรมชีวการแพทย์ (นานาชาติ) (พหุวิทยาการ)" },
      { nameEn: "Bachelor of Engineering Program in Computer Innovation Engineering (International Program)", nameTh: "วศ.บ.วิศวกรรมนวัตกรรมคอมพิวเตอร์ (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Chemical Engineering (International Program)", nameTh: "วศ.บ.วิศวกรรมเคมี (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Civil Engineering (International Program)", nameTh: "วศ.บ.วิศวกรรมโยธา (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Robotics and AI Engineering (International Program)", nameTh: "วศ.บ.วิศวกรรมหุ่นยนต์และปัญญาประดิษฐ์ (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Financial Engineering (International Program) (multidisciplinary)", nameTh: "วศ.บ.วิศวกรรมการเงิน (นานาชาติ) (พหุวิทยาการ)" },
      { nameEn: "Bachelor of Engineering Program in Mechanical Engineering (International Program)", nameTh: "วศ.บ.วิศวกรรมเครื่องกล (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Electrical Engineering (International Program)", nameTh: "วศ.บ.วิศวกรรมไฟฟ้า (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Software Engineering (International Program)", nameTh: "วศ.บ วิศวกรรมซอต์ฟแวร์ (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Energy Engineering (International Program)", nameTh: "วศ.บ วิศวกรรมพลังงาน (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Industrial Engineering and Logistics Management (International Program)", nameTh: "วศ.บ.วิศวกรรมอุตสาหการและการจัดการโลจิสติกส์ (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Engineering Management and Entrepreneurship (International Program)", nameTh: "วศ.บ วิศวกรรมการจัดการวิศวกรรมและการเป็นผู้ประกอบการ (นานาชาติ)" },
      { nameEn: "Bachelor of Engineering Program in Computer Engineering (Continuing Program)", nameTh: "วศ.บ.วิศวกรรมคอมพิวเตอร์ (นานาชาติ)" },
    ],
  },
  {
    slug: "kmitl-architecture-art-design",
    nameEn: "School of Architecture, Art, and Design",
    nameTh: "คณะสถาปัตยกรรมศิลปะและการออกแบบ",
    code: "AAD",
    sortOrder: 2,
    majors: [
      { nameEn: "Bachelor of Architecture Program in Architecture", nameTh: "สถ.บ.สถาปัตยกรรมหลัก" },
      { nameEn: "Bachelor of Architecture Program in Interior Architecture", nameTh: "สถ.บ.สถาปัตยกรรมภายใน" },
      { nameEn: "Bachelor of Architecture Program in Industrial Design", nameTh: "สถ.บ.ศิลปอุตสาหกรรม" },
      { nameEn: "Bachelor of Fine and Applied Arts Program in Communication Design", nameTh: "ศป.บ.นิเทศศิลป์" },
      { nameEn: "Bachelor of Fine and Applied Arts Program in Photography", nameTh: "ศป.บ.การถ่ายภาพ" },
      { nameEn: "Bachelor of Fine and Applied Arts Program in Film and Digital Media", nameTh: "ศป.บ.ภาพยนตร์และดิจิทัล มีเดีย" },
      { nameEn: "Bachelor of Landscape Architecture Program", nameTh: "ภ.สถ.บ.ภูมิสถาปัตยกรรมศาสตรบัณฑิต" },
      { nameEn: "Bachelor of Fine and Applied Arts Program in Fine Art, Media Art and Illustration Art", nameTh: "ศป.บ.ศิลปกรรม มีเดียอาร์ต และอิลลัสเตชันอาร์ต" },
      { nameEn: "Bachelor of Fine and Applied Arts Program in 3D-Based Communication Design and Integrated Media", nameTh: "ศป.บ.การออกแบบสนเทศสามมิติและสื่อบูรณาการ" },
      { nameEn: "Bachelor of Fine and Applied Arts program in Sculpture and Sculpture for Society", nameTh: "ศป.บ.ประติมากรรมและประติมากรรมเพื่อสังคม" },
      { nameEn: "Bachelor of Fine and Applied Arts Program in Printmaking and Illustration", nameTh: "ศป.บ.ภาพพิมพ์และอิลลัสเตชั่น" },
      { nameEn: "Bachelor of Science Program in Architecture (International Program)", nameTh: "วท.บ.สถาปัตยกรรม (นานาชาติ)" },
      { nameEn: "Bachelor of Fine Arts in Creative Arts and Curatorial Studies (International Program)", nameTh: "ศล.บ.ศิลปะสร้างสรรค์และภัณฑารักษ์ศึกษา (หลักสูตรนานาชาติ)" },
    ],
  },
  {
    slug: "kmitl-industrial-education-technology",
    nameEn: "School of Industrial Education and Technology",
    nameTh: "คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี",
    code: "IET",
    sortOrder: 3,
    majors: [
      { nameEn: "Bachelor of Science in Industrial Education Program in Agricultural  Education ", nameTh: "ค.อ.บ.ครุศาสตร์เกษตร " },
      { nameEn: "Bachelor of Science in Industrial Education Program in Engineering Education ", nameTh: "ค.อ.บ.ครุศาสตร์วิศวกรรม (5ปี)" },
      { nameEn: "Bachelor  of  Science in Industrial  Education  Program in Interior Environmental Design ", nameTh: "ค.อ.บ.ครุศาสตร์การออกแบบสภาพแวดล้อมภายใน (5ปี)" },
      { nameEn: "Bachelor of Science in Industrial Education Program in Design Education ", nameTh: "ค.อ.บ.ครุศาสตร์การออกแบบ (5ปี)" },
      { nameEn: "Bachelor of Science in Industrial Education Program in Architecture ", nameTh: "ค.อ.บ.สถาปัตยกรรม (5ปี)" },
      { nameEn: "Bachelor of Technology Program in Electronics Technology (Continuing Program) ", nameTh: "ทล.บ.เทคโนโลยีอิเล็กทรอนิกส์ (ต่อเนื่อง)" },
      { nameEn: "Bachelor of Technology  Program in Integrated Innovation for Products and Service (Continuing Program) ", nameTh: "ทล.บ.บูรณาการนวัตกรรมเพื่อสินค้าและบริการ(ต่อเนื่อง)" },
      { nameEn: "Bachelor of Technology   Program in Agricultural Biotechnology (Continuing Program) ", nameTh: "ทล.บ.เทคโนโลยีชีวภาพทางการเกษตร (ต่อเนื่อง) (งดรับนักศึกษา)" },
      { nameEn: "Bachelor of Science Program in Plant Production Technology", nameTh: "วท.บ.เทคโนโลยีการผลิตพืช" },
    ],
  },
  {
    slug: "kmitl-agricultural-technology",
    nameEn: "School of Agricultural Technology",
    nameTh: "คณะเทคโนโลยีการเกษตร",
    code: "AGT",
    sortOrder: 4,
    majors: [
      { nameEn: "Bachelor of Science Program in Animal Production Technology and Meat Science", nameTh: "วท.บ.เทคโนโลยีการผลิตสัตว์และวิทยาศาสตร์เนื้อสัตว์" },
      { nameEn: "Bachelor of Science Program in Innovative Aquatic Animal Production and Fishery Resource Management", nameTh: "วท.บ.นวัตกรรมการผลิตสัตว์น้ำและการจัดการทรัพยากรประมง" },
      { nameEn: "Bachelor of Science Program in Agricultural Development", nameTh: "วท.บ.พัฒนาการเกษตร" },
      { nameEn: "Bachelor of Science Program in Agricultural Communication", nameTh: "วท.บ.นิเทศศาสตร์เกษตร" },
      { nameEn: "Bachelor of Science Program in Landscape Design and Management for Environment ", nameTh: "วท.บ. การออกแบบและการจัดการภูมิทัศน์เพื่อสิ่งแวดล้อม" },
      { nameEn: "Bachelor of Science Program in Smart Farm Management", nameTh: "วท.บ.การจัดการสมาร์ตฟาร์ม" },
    ],
  },
  {
    slug: "kmitl-science",
    nameEn: "School of Science",
    nameTh: "คณะวิทยาศาสตร์",
    code: "SCI",
    sortOrder: 5,
    majors: [
      { nameEn: "Bachelor of Science Program in Applied Mathematics", nameTh: "วท.บ.คณิตศาสตร์ประยุกต์" },
      { nameEn: "Bachelor of Science Program in Computer Science", nameTh: "วท.บ.วิทยาการคอมพิวเตอร์" },
      { nameEn: "Bachelor of Science Program in Environmental Technology and Sustainable Management", nameTh: "วท.บ.เทคโนโลยีสิ่งแวดล้อมและการจัดการอย่างยั่งยืน" },
      { nameEn: "Bachelor of Science Program in Industrial Chemistry", nameTh: "วท.บ.เคมีอุตสาหกรรม" },
      { nameEn: "Bachelor of Science Program in Applied Statistics and Data Analytics", nameTh: "วท.บ.สถิติประยุกต์และการวิเคราะห์ข้อมูล" },
      { nameEn: "Bachelor of Science Program in Industrial Biotechnology", nameTh: "วท.บ.เทคโนโลยีชีวภาพอุตสาหกรรม" },
      { nameEn: "Bachelor of Science Program in Industrial Microbiology", nameTh: "วท.บ.จุลชีววิทยาอุตสาหกรรม" },
      { nameEn: "Bachelor of Science Program in Industrial Physics", nameTh: "วท.บ.ฟิสิกส์อุตสาหกรรม/วท.บ.ฟิสิกส์อุตสาหกรรม" },
      { nameEn: "Bachelor of Science Program in Industrial Microbiology (International Program)", nameTh: "วท.บ.จุลชีววิทยาอุตสาหกรรม (หลักสูตรนานาชาติ) (ปิดหลักสูตร)" },
      { nameEn: "Bachelor of Science Program in Industrial and Engineering Chemistry (International Program)", nameTh: "วท.บ. เคมีวิศวกรรมและอุตสาหกรรม (หลักสูตรนานาชาติ) (หลักสูตรใหม่ 2564)" },
    ],
  },
  {
    slug: "kmitl-information-technology",
    nameEn: "School of Information Technology",
    nameTh: "คณะเทคโนโลยีสารสนเทศ",
    code: "IT",
    sortOrder: 6,
    majors: [
      { nameEn: "Bachelor of Science Program in Information Technology", nameTh: "วท.บ.เทคโนโลยีสารสนเทศ" },
      { nameEn: "Bachelor of Science Program in Data Science and Business Analytics", nameTh: "วท.บ.วิทยาการข้อมูลและการวิเคราะห์เชิงธุรกิจ" },
      { nameEn: "Bachelor of Science Program in Business Information Technology (International Program)", nameTh: "วท.บ.เทคโนโลยีสารสนเทศทางธุรกิจ (นานาชาติ)" },
    ],
  },
  {
    slug: "kmitl-food-industry",
    nameEn: "School of Food Industry",
    nameTh: "คณะอุตสาหกรรมอาหาร",
    code: "FOOD",
    sortOrder: 7,
    majors: [
      { nameEn: "Bachelor of Science Program in Food Science and Technology", nameTh: "วท.บ.วิทยาศาสตร์และเทคโนโลยีการอาหาร" },
      { nameEn: "Bachelor of Science Program in (Fermentation Technology in Food)", nameTh: "วท.บ.เทคโนโลยีการหมักในอุตสาหกรรม" },
      { nameEn: "Bachelor of Science Program in Food Process Engineering", nameTh: "วท.บ.วิศวกรรมแปรรูปอาหาร" },
      { nameEn: "Bachelor of Science Program in Culinary Science and Foodservice Management (International Program)", nameTh: "วท.บ.วิทยาศาสตร์การประกอบอาหารและเทคโนโลยีการบริการอาหาร (นานาชาติ)" },
    ],
  },
  {
    slug: "kmitl-business",
    nameEn: "KMITL Business School",
    nameTh: "คณะบริหารธุรกิจ",
    code: "BUS",
    sortOrder: 8,
    majors: [
      { nameEn: "Bachelor of Business Administration", nameTh: "บริหารธุรกิจบัณฑิต" },
      { nameEn: "Bachelor of Economics Program in Business Economics and Management ", nameTh: "ศ.บ.เศรษฐศาสตร์ธุรกิจและการจัดการ" },
      { nameEn: "Bachelor of Business Administration (International Program)  ", nameTh: "บริหารธุรกิจบัณฑิต (หลักสูตรนานาชาติ)" },
      { nameEn: "Bachelor of Business Administration Program in Global Entrepreneurship (International Program)  ", nameTh: "บธ.บ. การเป็นผู้ประกอบการระดับโลก (หลักสูตรนานาชาติ)" },
    ],
  },
  {
    slug: "kmitl-liberal-arts",
    nameEn: "School of Liberal Arts",
    nameTh: "คณะศิลปศาสตร์",
    code: "LA",
    sortOrder: 9,
    majors: [
      { nameEn: "Bachelor of Arts Program in Business Japanese  ", nameTh: "ศศ.บ.ภาษาญี่ปุ่นธุรกิจ" },
      { nameEn: "Bachelor of Arts Program in English ", nameTh: "ศศ.บ.ภาษาอังกฤษ" },
      { nameEn: "Bachelor of Arts Program in Tourism and Hospitality Innovation ", nameTh: "ศศ.บ.นวัตกรรมการท่องเที่ยวและการบริการ" },
      { nameEn: "Bachelor of  Arts Program in Chinese for Industry", nameTh: "ศศ.บ.ภาษาจีนเพื่ออุตสาหกรรม" },
    ],
  },
  {
    slug: "kmitl-medicine",
    nameEn: "Faculty of Medicine",
    nameTh: "คณะแพทยศาสตร์",
    code: "MED",
    sortOrder: 10,
    majors: [
      { nameEn: "Doctor of Medicine (International Program)", nameTh: "แพทยศาสตร์บัณฑิต (หลักสูตรนานาชาติ)" },
    ],
  },
  {
    slug: "kmitl-dentistry",
    nameEn: "School of Dentistry",
    nameTh: "คณะทันตแพทยศาสตร์",
    code: "DENT",
    sortOrder: 11,
    majors: [
      { nameEn: "Doctor of Dental Surgery (International Program)", nameTh: "ทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ)" },
    ],
  },
];

export const KMITL_FACULTIES: KmitlFacultySeed[] = KMITL_FACULTY_MAJORS.map((faculty) => ({
  ...faculty,
  majors: assignMajorSlugs(faculty.majors),
}));
