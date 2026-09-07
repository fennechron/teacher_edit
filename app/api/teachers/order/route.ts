import { NextResponse } from 'next/server';
import { updateTeacherOrder } from '@/lib/sanity';

export async function POST(req: Request) {
  try {
    const { updates } = await req.json();
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates payload' }, { status: 400 });
    }

    const result = await updateTeacherOrder(updates);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
