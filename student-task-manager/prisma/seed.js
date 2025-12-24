const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: 'hash_alice',
      role: 'ADMIN',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@example.com',
      passwordHash: 'hash_bob',
      role: 'MEMBER',
    },
  });

  // Team
  const team = await prisma.team.create({
    data: {
      name: 'Study Group A',
      description: 'Primary team for the course',
      ownerId: alice.id,
      memberships: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
      labels: {
        create: [
          { name: 'Homework', color: '#3b82f6' },
          { name: 'Exam Prep', color: '#ef4444' },
        ],
      },
    },
  });

  // Project
  const project = await prisma.project.create({
    data: {
      name: 'Semester Project',
      description: 'Build a full-stack app',
      teamId: team.id,
      ownerId: alice.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  // Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design ER Diagram',
      description: 'Create normalized schema',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project.id,
      assigneeId: alice.id,
      labels: {
        create: [{ labelId: (await prisma.label.findFirst({ where: { teamId: team.id, name: 'Homework' } })).id }],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Write Seed Script',
      description: 'Add sample data for testing',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id,
      assigneeId: bob.id,
    },
  });

  // Comments
  await prisma.comment.create({
    data: {
      content: 'Initial draft looks good.',
      taskId: task1.id,
      authorId: alice.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'I will add more tasks.',
      taskId: task2.id,
      authorId: bob.id,
    },
  });

  // Activity logs
  await prisma.activityLog.create({
    data: { actorId: alice.id, projectId: project.id, action: 'PROJECT_CREATED' },
  });
  await prisma.activityLog.create({
    data: { actorId: bob.id, taskId: task2.id, action: 'TASK_CREATED' },
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
