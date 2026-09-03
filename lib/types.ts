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
