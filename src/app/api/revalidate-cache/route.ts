import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Revalidate the entire site by revalidating the root layout
        revalidatePath('/', 'layout');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating cache' }, { status: 500 });
    }
}
