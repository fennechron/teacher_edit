import { createClient, SanityClient } from '@sanity/client';
import { Teacher, Department, Publication, getFacultyRoleRank } from './types';

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
    } | order(coalesce(idx, orderIndex, 999999) asc, name asc)`;
    params = { q: `*${search}*` };
  } else {
    groq = `*[_type == "teacher"]{
      ...,
      "departmentData": department->{_id, name, title, short},
      "photoUrl": photo.asset->url
    } | order(coalesce(idx, orderIndex, 999999) asc, name asc)`;
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

  // Handle idx (display order index)
  if (data.idx !== undefined && data.idx !== null && !isNaN(Number(data.idx))) {
    const cleanIdx = Math.max(1, Math.round(Number(data.idx)));
    payload.idx = cleanIdx;
    payload.orderIndex = cleanIdx;
  } else if (data.orderIndex !== undefined && data.orderIndex !== null && !isNaN(Number(data.orderIndex))) {
    const cleanIdx = Math.max(1, Math.round(Number(data.orderIndex)));
    payload.idx = cleanIdx;
    payload.orderIndex = cleanIdx;
  }

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

export async function normalizeDepartmentIndices(deptRef: string) {
  const client = getClient();
  if (!client || !config.token || !deptRef) return;

  try {
    const groq = `*[_type == "teacher" && department._ref == $deptRef]{
      _id,
      name,
      designation,
      isHOD,
      idx,
      orderIndex
    }`;

    const teachers: Array<{ _id: string; name: string; designation?: string; isHOD?: boolean; idx?: number; orderIndex?: number }> =
      await client.fetch(groq, { deptRef });

    teachers.sort((a, b) => {
      const idxA = a.idx ?? a.orderIndex ?? 999999;
      const idxB = b.idx ?? b.orderIndex ?? 999999;
      if (idxA !== idxB) return idxA - idxB;
      const rankA = getFacultyRoleRank(a);
      const rankB = getFacultyRoleRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });

    const transaction = client.transaction();
    let hasChanges = false;

    teachers.forEach((t, index) => {
      const properIdx = index + 1;
      if (t.idx !== properIdx || t.orderIndex !== properIdx) {
        transaction.patch(t._id, (p) => p.set({ idx: properIdx, orderIndex: properIdx }));
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await transaction.commit();
    }
  } catch (err) {
    console.error('Failed to normalize department indices:', err);
  }
}

export async function reorderDepartmentTeachersWithTarget(
  deptRef: string,
  teacherIdToInsertOrMove: string | null,
  targetIdx: number
) {
  const client = getClient();
  if (!client || !config.token || !deptRef) return;

  const groq = `*[_type == "teacher" && department._ref == $deptRef]{
    _id,
    name,
    designation,
    isHOD,
    idx,
    orderIndex
  }`;

  const deptTeachers: Array<{ _id: string; name: string; designation?: string; isHOD?: boolean; idx?: number; orderIndex?: number }> =
    await client.fetch(groq, { deptRef });

  deptTeachers.sort((a, b) => {
    const idxA = a.idx ?? a.orderIndex ?? 999999;
    const idxB = b.idx ?? b.orderIndex ?? 999999;
    if (idxA !== idxB) return idxA - idxB;
    const rankA = getFacultyRoleRank(a);
    const rankB = getFacultyRoleRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Separate the teacher being moved/inserted
  const remaining = deptTeachers.filter((t) => t._id !== teacherIdToInsertOrMove);

  // Clamp targetIdx to 1-based range: 1 to remaining.length + 1
  const clampedIdx = Math.max(1, Math.min(Math.round(targetIdx), remaining.length + 1));
  const insertIndex = clampedIdx - 1; // 0-based

  // Construct new list with teacher at the target position
  const newList: Array<{ _id: string }> = [];
  for (let i = 0; i < remaining.length; i++) {
    if (i === insertIndex && teacherIdToInsertOrMove) {
      newList.push({ _id: teacherIdToInsertOrMove });
    }
    newList.push(remaining[i]);
  }
  if (newList.length < remaining.length + (teacherIdToInsertOrMove ? 1 : 0) && teacherIdToInsertOrMove) {
    newList.push({ _id: teacherIdToInsertOrMove });
  }

  // Build transaction to update any teacher whose index changed
  const transaction = client.transaction();
  let changedCount = 0;

  newList.forEach((item, index) => {
    const newIdx = index + 1;
    const prev = deptTeachers.find((t) => t._id === item._id);
    if (!prev || prev.idx !== newIdx || prev.orderIndex !== newIdx) {
      transaction.patch(item._id, (p) => p.set({ idx: newIdx, orderIndex: newIdx }));
      changedCount++;
    }
  });

  if (changedCount > 0) {
    await transaction.commit();
  }

  return { clampedIdx, total: newList.length };
}

export async function createTeacher(data: Partial<Teacher>): Promise<Teacher> {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to create faculty members.');
  }

  const deptRef =
    typeof data.department === 'string'
      ? data.department
      : (data.department as any)?._ref;

  if (deptRef) {
    // Check existing teachers in department
    const existing: Array<{ _id: string; idx?: number }> = await client.fetch(
      `*[_type == "teacher" && department._ref == $deptRef]{_id, idx} | order(coalesce(idx, 999999) asc)`,
      { deptRef }
    );

    let targetIdx: number;
    if (data.idx !== undefined && data.idx !== null && !isNaN(Number(data.idx))) {
      targetIdx = Math.max(1, Math.round(Number(data.idx)));
    } else {
      targetIdx = existing.length + 1;
    }

    // Clamp targetIdx to [1, existing.length + 1]
    targetIdx = Math.min(targetIdx, existing.length + 1);
    data.idx = targetIdx;
    data.orderIndex = targetIdx;

    const payload = sanitizeTeacherData(data);
    const created = await client.create(payload);

    // If inserted into middle or beginning, shift subsequent faculties
    await reorderDepartmentTeachersWithTarget(deptRef, created._id, targetIdx);

    return created as any as Teacher;
  }

  const payload = sanitizeTeacherData(data);
  return (await client.create(payload)) as any as Teacher;
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to update faculty members.');
  }

  const deptRef =
    typeof data.department === 'string'
      ? data.department
      : (data.department as any)?._ref;

  const currentDoc = await client.fetch(
    `*[_type == "teacher" && _id == $id][0]{idx, orderIndex, department}`,
    { id }
  );
  const prevDeptRef =
    typeof currentDoc?.department === 'string'
      ? currentDoc.department
      : currentDoc?.department?._ref;

  // If department is specified and idx is provided (or changed)
  if (deptRef && data.idx !== undefined && data.idx !== null && !isNaN(Number(data.idx))) {
    const targetIdx = Math.max(1, Math.round(Number(data.idx)));
    data.idx = targetIdx;
    data.orderIndex = targetIdx;

    const payload = sanitizeTeacherData(data);
    const updated = await client.patch(id).set(payload).commit();

    await reorderDepartmentTeachersWithTarget(deptRef, id, targetIdx);

    if (prevDeptRef && prevDeptRef !== deptRef) {
      await normalizeDepartmentIndices(prevDeptRef);
    }

    return updated as any as Teacher;
  }

  // If department changed without specifying idx
  if (deptRef && prevDeptRef && prevDeptRef !== deptRef) {
    const payload = sanitizeTeacherData(data);
    const updated = await client.patch(id).set(payload).commit();
    await normalizeDepartmentIndices(deptRef);
    await normalizeDepartmentIndices(prevDeptRef);
    return updated as any as Teacher;
  }

  const payload = sanitizeTeacherData(data);
  return (await client.patch(id).set(payload).commit()) as any as Teacher;
}

export async function deleteTeacher(id: string) {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to delete faculty members.');
  }

  const currentDoc = await client.fetch(
    `*[_type == "teacher" && _id == $id][0]{department}`,
    { id }
  );
  const deptRef =
    typeof currentDoc?.department === 'string'
      ? currentDoc.department
      : currentDoc?.department?._ref;

  const res = await client.delete(id);

  if (deptRef) {
    await normalizeDepartmentIndices(deptRef);
  }

  return res;
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

export async function updateTeacherOrder(updates: { id: string; idx?: number; orderIndex?: number }[]) {
  const client = getClient();
  if (!client || !config.token) {
    throw new Error('Sanity API Token is required to update order.');
  }

  const transaction = client.transaction();
  
  updates.forEach(({ id, idx, orderIndex }) => {
    const resolvedIdx = typeof idx === 'number' && !isNaN(idx)
      ? Math.max(1, Math.round(idx))
      : typeof orderIndex === 'number' && !isNaN(orderIndex)
      ? Math.max(1, Math.round(orderIndex))
      : 1;

    transaction.patch(id, (p) => p.set({ idx: resolvedIdx, orderIndex: resolvedIdx }));
  });

  return await transaction.commit();
}
