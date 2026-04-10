import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Transaction } from '../transactions/transaction.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'belo_challenge',
  entities: [User, Transaction],
  synchronize: true, // This will create the tables
});

async function runMigrations() {
  await dataSource.initialize();
  console.log('Database connected');

  // Sync entities (creates tables if they don't exist)
  // This is equivalent to running migrations for development
  await dataSource.synchronize(true);
  console.log('Tables synchronized!');

  await dataSource.destroy();
}

runMigrations().catch((error) => {
  console.error('Error running migrations:', error);
  process.exit(1);
});
