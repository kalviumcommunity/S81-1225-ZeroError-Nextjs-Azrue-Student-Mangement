import { prisma } from '@/lib/prisma';

export async function getStudents() {
	const students = await prisma.student.findMany();
	console.log(students);
	return students;
}
