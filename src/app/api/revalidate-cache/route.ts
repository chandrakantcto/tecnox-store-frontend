import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { STOREFRONT_CATALOG_CACHE_TAG } from '@/lib/vendure/catalog-cache';

export async function POST() {
    try {
        revalidateTag(STOREFRONT_CATALOG_CACHE_TAG);
        revalidatePath('/', 'layout');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating cache' }, { status: 500 });
    }
}
