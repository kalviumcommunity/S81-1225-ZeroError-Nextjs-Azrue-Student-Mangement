import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Query failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const body = await req.json();
    const { name, email } = body ?? {};
    const user = await prisma.user.update({
      where: { id },
      data: { ...(name ? { name } : {}), ...(email ? { email } : {}) },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json({ message: 'User updated', user }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Update failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Delete failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
