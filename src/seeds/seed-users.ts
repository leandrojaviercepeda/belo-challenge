import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'belo_challenge',
  entities: [User],
});

const users = [
  {
    email: 'alice@belo.com',
    password: 'password123',
    balance: 1000.0,
  },
  {
    email: 'bob@belo.com',
    password: 'password123',
    balance: 500.0,
  },
  {
    email: 'charlie@belo.com',
    password: 'password123',
    balance: 750.0,
  },
  {
    email: 'david@belo.com',
    password: 'password123',
    balance: 250.0,
  },
];

async function seedUsers() {
  await dataSource.initialize();
  console.log('Database connected');

  const userRepository = dataSource.getRepository(User);

  for (const userData of users) {
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`User ${userData.email} already exists, skipping...`);
      continue;
    }

    const user = userRepository.create(userData);
    await userRepository.save(user);
    console.log(
      `Created user: ${userData.email} with balance: $${userData.balance}`,
    );
  }

  console.log('Seed completed!');
  await dataSource.destroy();
}

seedUsers().catch((error) => {
  console.error('Error seeding users:', error);
  process.exit(1);
});
