import { NextResponse } from 'next/server';
import { uploadSanityImage } from '@/lib/sanity';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await uploadSanityImage(buffer, file.name, file.type);
    return NextResponse.json(asset);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
