import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, teamId: true, ownerId: true, createdAt: true },
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(project, { status: 200 });
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
    const { name, description, dueDate } = body ?? {};
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description: description ?? null } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
      select: { id: true, name: true, teamId: true, ownerId: true, createdAt: true },
    });
    return NextResponse.json({ message: 'Project updated', project }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Project name already exists in team' }, { status: 400 });
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Update failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: 'Project deleted' }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const msg = error?.code === 'P1001' ? 'Database is unreachable. Start PostgreSQL and run migrations.' : (error?.message ?? 'Delete failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
