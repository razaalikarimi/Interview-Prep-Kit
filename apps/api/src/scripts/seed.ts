import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectDatabase } from '../infrastructure/database/connection.js';
import { disconnectDatabase } from '../infrastructure/database/connection.js';
import { User } from '../infrastructure/database/models/user.model.js';
import bcrypt from 'bcryptjs';

// ============================================================
// DEVELOPMENT SEED DATA
// Creates demo users and sample kits for development.
// NOT used in actual evaluation logic.
// ============================================================

const SEED_USERS = [
  {
    email: 'demo@example.com',
    password: 'Demo123!@#',
    name: 'Demo User',
  },
];

const _SEED_JDS = {

  fullstack: `Senior Full Stack Engineer

We are looking for a Senior Full Stack Engineer to join our growing engineering team.

Required:
- 5+ years of experience with React and TypeScript
- Strong Node.js and Express.js experience
- Experience with MongoDB and database design
- Understanding of REST API design principles
- Experience with AWS services (EC2, S3, Lambda)
- Strong understanding of web security principles

Preferred:
- Experience with Next.js
- Kubernetes experience
- Mentoring junior developers

Responsibilities:
- Design and implement new features end-to-end
- Collaborate with product team on requirements
- Code review and technical leadership
- Improve system reliability and performance`,

  backend: `Backend Engineer

Join our platform team building the infrastructure powering millions of users.

Must have:
- 3+ years Go or Python backend development
- PostgreSQL and Redis experience
- REST API and gRPC design
- Docker and containerization
- Unit testing and TDD practices

Nice to have:
- Kafka or message queue experience
- Distributed systems knowledge
- Performance optimization experience`,

  frontend: `React Frontend Engineer

We're building a best-in-class user experience.

Requirements:
- 4+ years React development
- TypeScript proficiency
- CSS and responsive design
- Performance optimization (Core Web Vitals)
- Accessibility (WCAG 2.1) knowledge

Bonus:
- GraphQL experience
- Animation/micro-interaction experience
- Design system development`,
};

async function seed(): Promise<void> {
  const mongoUri = process.env['MONGODB_URI'];
  if (!mongoUri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await connectDatabase(mongoUri);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await User.deleteMany({ email: { $in: SEED_USERS.map((u) => u.email) } });
  console.log('Cleared existing seed users');

  // Create users
  for (const userData of SEED_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = await User.create({
      email: userData.email,
      passwordHash,
      name: userData.name,
    });
    console.log(`Created user: ${userData.email} (${user._id})`);
  }

  console.log('\nSeed data created successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: Demo123!@#');
  console.log('\nSeed JDs available (in seed/cases.json) for batch evaluator testing.');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
