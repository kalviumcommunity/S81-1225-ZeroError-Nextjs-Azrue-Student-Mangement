import { PrismaClient, TaskPriority, TaskStatus, MembershipRole, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	// Users (idempotent via unique email)
	const alice = await prisma.user.upsert({
		where: { email: 'alice@example.com' },
		update: { name: 'Alice', role: UserRole.ADMIN },
		create: {
			name: 'Alice',
			email: 'alice@example.com',
			passwordHash: 'hash_alice',
			role: UserRole.ADMIN,
		},
	});

	const bob = await prisma.user.upsert({
		where: { email: 'bob@example.com' },
		update: { name: 'Bob', role: UserRole.MEMBER },
		create: {
			name: 'Bob',
			email: 'bob@example.com',
			passwordHash: 'hash_bob',
			role: UserRole.MEMBER,
		},
	});

	// Team (idempotent via @@unique([ownerId, name]) => ownerId_name)
	const team = await prisma.team.upsert({
		where: { ownerId_name: { ownerId: alice.id, name: 'Study Group A' } },
		update: { description: 'Primary team for the course' },
		create: {
			name: 'Study Group A',
			description: 'Primary team for the course',
			ownerId: alice.id,
		},
	});

	// Memberships (idempotent via @@unique([userId, teamId]) => userId_teamId)
	await prisma.membership.upsert({
		where: { userId_teamId: { userId: alice.id, teamId: team.id } },
		update: { role: MembershipRole.OWNER },
		create: { userId: alice.id, teamId: team.id, role: MembershipRole.OWNER },
	});

	await prisma.membership.upsert({
		where: { userId_teamId: { userId: bob.id, teamId: team.id } },
		update: { role: MembershipRole.MEMBER },
		create: { userId: bob.id, teamId: team.id, role: MembershipRole.MEMBER },
	});

	// Labels (idempotent via @@unique([teamId, name]) => teamId_name)
	const homeworkLabel = await prisma.label.upsert({
		where: { teamId_name: { teamId: team.id, name: 'Homework' } },
		update: { color: '#3b82f6' },
		create: { teamId: team.id, name: 'Homework', color: '#3b82f6' },
	});

	const examPrepLabel = await prisma.label.upsert({
		where: { teamId_name: { teamId: team.id, name: 'Exam Prep' } },
		update: { color: '#ef4444' },
		create: { teamId: team.id, name: 'Exam Prep', color: '#ef4444' },
	});

	// Project (idempotent via @@unique([teamId, name]) => teamId_name)
	const project = await prisma.project.upsert({
		where: { teamId_name: { teamId: team.id, name: 'Semester Project' } },
		update: {
			description: 'Build a full-stack app',
			dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			ownerId: alice.id,
		},
		create: {
			name: 'Semester Project',
			description: 'Build a full-stack app',
			teamId: team.id,
			ownerId: alice.id,
			dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		},
	});

	// Tasks (no unique constraint; keep idempotent via findFirst + create)
	const task1 =
		(await prisma.task.findFirst({
			where: { projectId: project.id, title: 'Design ER Diagram' },
		})) ??
		(await prisma.task.create({
			data: {
				title: 'Design ER Diagram',
				description: 'Create normalized schema',
				status: TaskStatus.IN_PROGRESS,
				priority: TaskPriority.HIGH,
				projectId: project.id,
				assigneeId: alice.id,
			},
		}));

	// Ensure label link exists
	await prisma.taskLabel.upsert({
		where: { taskId_labelId: { taskId: task1.id, labelId: homeworkLabel.id } },
		update: {},
		create: { taskId: task1.id, labelId: homeworkLabel.id },
	});

	const task2 =
		(await prisma.task.findFirst({
			where: { projectId: project.id, title: 'Write Seed Script' },
		})) ??
		(await prisma.task.create({
			data: {
				title: 'Write Seed Script',
				description: 'Add sample data for testing',
				status: TaskStatus.TODO,
				priority: TaskPriority.MEDIUM,
				projectId: project.id,
				assigneeId: bob.id,
			},
		}));

	// Comments (idempotent by natural key check)
	const comment1Exists = await prisma.comment.findFirst({
		where: { taskId: task1.id, authorId: alice.id, content: 'Initial draft looks good.' },
	});
	if (!comment1Exists) {
		await prisma.comment.create({
			data: { content: 'Initial draft looks good.', taskId: task1.id, authorId: alice.id },
		});
	}

	const comment2Exists = await prisma.comment.findFirst({
		where: { taskId: task2.id, authorId: bob.id, content: 'I will add more tasks.' },
	});
	if (!comment2Exists) {
		await prisma.comment.create({
			data: { content: 'I will add more tasks.', taskId: task2.id, authorId: bob.id },
		});
	}

	// Activity logs (avoid duplicates via natural key check)
	const projectCreatedLogExists = await prisma.activityLog.findFirst({
		where: { actorId: alice.id, projectId: project.id, action: 'PROJECT_CREATED' },
	});
	if (!projectCreatedLogExists) {
		await prisma.activityLog.create({
			data: { actorId: alice.id, projectId: project.id, action: 'PROJECT_CREATED' },
		});
	}

	const taskCreatedLogExists = await prisma.activityLog.findFirst({
		where: { actorId: bob.id, taskId: task2.id, action: 'TASK_CREATED' },
	});
	if (!taskCreatedLogExists) {
		await prisma.activityLog.create({
			data: { actorId: bob.id, taskId: task2.id, action: 'TASK_CREATED' },
		});
	}

	console.log('Seed data inserted successfully');
	console.log({
		users: ['alice@example.com', 'bob@example.com'],
		team: team.name,
		project: project.name,
		labels: [homeworkLabel.name, examPrepLabel.name],
		tasks: [task1.title, task2.title],
	});
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
