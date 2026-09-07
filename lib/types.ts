export interface Publication {
  _key?: string;
  title: string;
  link?: string;
}

export interface Department {
  _id: string;
  name: string;
  short?: string;
  title?: string;
}

export interface SanityImageAsset {
  _ref: string;
  _type: 'reference';
}

export interface TeacherPhoto {
  _type: 'image';
  asset?: SanityImageAsset;
  hotspot?: boolean;
}

export interface Teacher {
  _id?: string;
  _type?: 'teacher';
  name: string;
  orderIndex?: number;
  idx?: number;
  department?: {
    _ref: string;
    _type: 'reference';
  } | string | null;
  departmentData?: Department | null;
  isHOD?: boolean;
  designation?: string;
  specialization?: string;
  qualification?: string[];
  email?: string;
  phone?: string;
  staffRoom?: string;
  experience?: string[];
  photo?: TeacherPhoto | null;
  photoUrl?: string | null;
  about?: string[];
  wordFromTeacher?: string;
  awards_and_honours?: string[];
  positions_handled?: string[];
  courses_handled?: string[];
  publications?: Publication[];
  fields_of_expertise?: string[];
  research?: string[];
  industry_interaction?: string[];
  patents?: string[];
  books_published?: string[];
  other_details?: string[];
}

export function getFacultyRoleRank(teacher: Partial<Teacher>): number {
  if (teacher.isHOD) return 1;

  const desig = (teacher.designation || '').toLowerCase().trim();
  if (desig.includes('hod') || desig.includes('head')) return 1;

  if (
    desig.includes('professor') &&
    !desig.includes('associate') &&
    !desig.includes('assistant') &&
    !desig.includes('asst') &&
    !desig.includes('assoc')
  ) {
    return 2;
  }

  if (desig.includes('associate') || desig.includes('assoc')) {
    return 3;
  }

  if (desig.includes('assistant') || desig.includes('asst')) {
    return 4;
  }

  if (desig.includes('lecturer') || desig.includes('instructor')) {
    return 5;
  }

  return 6;
}
