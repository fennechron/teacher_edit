import { createClient, SanityClient } from '@sanity/client';
import { Teacher, Department, Publication } from './types';

let config = {
  projectId: process.env.SANITY_PROJECT_ID || 'q1p97j9m',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN || '',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
};

let cachedClient: SanityClient | null = null;

export function getSanityConfig() {
  return {
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    hasToken: Boolean(config.token),
    isLive: Boolean(config.projectId && config.token)
  };
}

export function updateSanityConfig(newConfig: Partial<typeof config>) {
  if (newConfig.projectId) config.projectId = newConfig.projectId.trim();
  if (newConfig.dataset) config.dataset = newConfig.dataset.trim();
  if (newConfig.token) config.token = newConfig.token.trim();
  if (newConfig.apiVersion) config.apiVersion = newConfig.apiVersion.trim();
  cachedClient = null;
  return getSanityConfig();
}

export function getClient(): SanityClient | null {
  if (!config.projectId) return null;
  if (!cachedClient) {
    cachedClient = createClient({
      projectId: config.projectId,
      dataset: config.dataset,
      token: config.token || undefined,
      apiVersion: config.apiVersion,
      useCdn: false,
    });
  }
  return cachedClient;
}

export async function testConnection() {
  const client = getClient();
  if (!client || !config.token) {
    return {
      connected: false,
      isLive: false,
      message: 'Token not configured. Currently operating with read-only or demo capabilities.'
    };
  }
  try {
    await client.fetch(`*[_type in ["teacher", "department"]][0...1]`);
    return {
      connected: true,
      isLive: true,
      projectId: config.projectId,
      dataset: config.dataset,
      message: `Connected successfully to Sanity project "${config.projectId}" (${config.dataset})!`
    };
  } catch (err: any) {
    return {
      connected: false,
      isLive: true,
      error: err.message,
      message: `Connection failed: ${err.message}`
    };
  }
}

export async function fetchDepartments(): Promise<Department[]> {
  const client = getClient();
  if (!client) return [];
  const groq = `*[_type == "department"]{_id, name, title, short} | order(name asc)`;
  try {
    return await client.fetch(groq);
  } catch (err) {
    console.error('Failed to fetch departments:', err);
    return [];
  }
}

export async function fetchTeachers(search?: string): Promise<Teacher[]> {
  const client = getClient();
  if (!client) return [];

  let groq: string;
  let params: Record<string, string> = {};

  if (search) {
    groq = `*[_type == "teacher" && (name match $q || designation match $q || email match $q || specialization match $q)]{
      ...,
      "departmentData": department->{_id, name, title, short},
      "photoUrl": photo.asset->url
    } | order(name asc)`;
    params = { q: `*${search}*` };
  } else {
    groq = `*[_type == "teacher"]{
      ...,
      "departmentData": department->{_id, name, title, short},
      "photoUrl": photo.asset->url
    } | order(name asc)`;
  }

  return await client.fetch(groq, params);
}

export async function fetchTeacherById(id: string): Promise<Teacher | null> {
  const client = getClient();
  if (!client) return null;

  const groq = `*[_type == "teacher" && _id == $id][0]{
    ...,
    "departmentData": department->{_id, name, title, short},
    "photoUrl": photo.asset->url
  }`;
  return await client.fetch(groq, { id });
}

function sanitizeTeacherData(data: Partial<Teacher>) {
  const cleanArr = (arr?: string[]) => Array.isArray(arr) ? arr.map(s => String(s).trim()).filter(Boolean) : [];

  const payload: any = {
    _type: 'teacher',
    name: (data.name || '').trim(),
    isHOD: Boolean(data.isHOD),
    designation: (data.designation || '').trim(),
    specialization: (data.specialization || '').trim(),
    email: (data.email || '').trim(),
    phone: (data.phone || '').trim(),
    staffRoom: (data.staffRoom || '').trim(),
    wordFromTeacher: (data.wordFromTeacher || '').trim(),
    qualification: cleanArr(data.qualification),
    experience: cleanArr(data.experience),
    about: cleanArr(data.about),
    awards_and_honours: cleanArr(data.awards_and_honours),
    positions_handled: cleanArr(data.positions_handled),
    courses_handled: cleanArr(data.courses_handled),
    fields_of_expertise: cleanArr(data.fields_of_expertise),
    research: cleanArr(data.research),
    industry_interaction: cleanArr(data.industry_interaction),
    patents: cleanArr(data.patents),
    books_published: cleanArr(data.books_published),
    other_details: cleanArr(data.other_details),
  };

  // Handle department reference
  if (data.department) {
    if (typeof data.department === 'string') {
      payload.department = { _type: 'reference', _ref: data.department.trim() };
    } else if ((data.department as any)._ref) {
      payload.department = { _type: 'reference', _ref: (data.department as any)._ref };
    }
  } else {
    payload.department = null;
  }

  // Handle photo asset
  if (data.photo?.asset?._ref) {
    payload.photo = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: data.photo.asset._ref,
      },
      hotspot: true,
    };
  } else if (data.photo === null) {
    payload.photo = null;
  }

  // Handle publications
  if (Array.isArray(data.publications)) {
    payload.publications = data.publications
      .filter(p => p && (p.title || p.link))
      .map(p => ({
        _key: p._key || Math.random().toString(36).substring(2, 9),
        _type: 'object',
        title: (p.title || '').trim(),
        link: (p.link || '').trim(),
      }));
  } else {
    payload.publications = [];
  }

  return payload;
}

export async function createTeacher(data: Partial<Teacher>): Promise<Teacher> {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to create faculty members.');
  }
  const payload = sanitizeTeacherData(data);
  return await client.create(payload);
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to update faculty members.');
  }
  const payload = sanitizeTeacherData(data);
  return await client.patch(id).set(payload).commit();
}

export async function deleteTeacher(id: string) {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to delete faculty members.');
  }
  return await client.delete(id);
}

export async function uploadSanityImage(fileBuffer: Buffer, filename: string, contentType: string) {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to upload photos.');
  }
  const asset = await client.assets.upload('image', fileBuffer, {
    filename,
    contentType,
  });
  return {
    _id: asset._id,
    url: asset.url,
    assetRef: asset._id,
  };
}
