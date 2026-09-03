import { NextResponse } from 'next/server';
import { fetchDepartments } from '@/lib/sanity';

export async function GET() {
  const departments = await fetchDepartments();
  return NextResponse.json(departments);
}
