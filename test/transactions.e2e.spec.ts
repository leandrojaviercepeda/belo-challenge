import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let dataSource: DataSource;

  // Test users
  let aliceToken: string;
  let bobToken: string;
  let charlieToken: string;

  // User IDs
  let aliceId: string;
  let bobId: string;
  let charlieId: string;

  const emailAlice = `alice${Date.now()}@belo.com`;
  const emailBob = `bob${Date.now()}@belo.com`;
  const emailCharlie = `charlie${Date.now()}@belo.com`;
  const password = 'testpassword123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    httpServer = app.getHttpServer();
    dataSource = app.get<DataSource>(DataSource);

    // Create test users
    const aliceRes = await supertest(httpServer)
      .post('/auth/register')
      .send({ email: emailAlice, password });
    aliceToken = aliceRes.body.accessToken;
    aliceId = aliceRes.body.user.id;

    const bobRes = await supertest(httpServer)
      .post('/auth/register')
      .send({ email: emailBob, password });
    bobToken = bobRes.body.accessToken;
    bobId = bobRes.body.user.id;

    const charlieRes = await supertest(httpServer)
      .post('/auth/register')
      .send({ email: emailCharlie, password });
    charlieToken = charlieRes.body.accessToken;
    charlieId = charlieRes.body.user.id;

    // Set balances
    const userRepo = dataSource.getRepository(User);
    await userRepo.update(aliceId, { balance: 1000 });
    await userRepo.update(bobId, { balance: 500 });
    await userRepo.update(charlieId, { balance: 100 });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /transactions', () => {
    it('should create a successful transfer', async () => {
      const res = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ toUserId: bobId, amount: 100 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.fromUserId).toBe(aliceId);
      expect(res.body.toUserId).toBe(bobId);
      expect(res.body.amount).toBe(100);
      expect(res.body.status).toBe('COMPLETED');
    });

    it('should return 401 without token', () => {
      return supertest(httpServer)
        .post('/transactions')
        .send({ toUserId: bobId, amount: 50 })
        .expect(401);
    });

    it('should return 400 for insufficient balance', async () => {
      // charlie has only 100 balance
      return supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${charlieToken}`)
        .send({ toUserId: aliceId, amount: 200 })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Insufficient');
        });
    });

    it('should return 404 for non-existent recipient', async () => {
      return supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ toUserId: '00000000-0000-0000-0000-000000000000', amount: 50 })
        .expect(404);
    });

    it('should return 400 for transfer to self', async () => {
      return supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ toUserId: aliceId, amount: 50 })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('yourself');
        });
    });
  });

  describe('Idempotency', () => {
    it('should return existing transaction for duplicate idempotencyKey', async () => {
      const idempotencyKey = crypto.randomUUID();

      // First request - creates transaction
      await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${charlieToken}`)
        .send({ toUserId: aliceId, amount: 1, idempotencyKey })
        .expect(201);

      // Second request with same idempotencyKey - should return existing (still 201 but same id)
      const res = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${charlieToken}`)
        .send({ toUserId: aliceId, amount: 1, idempotencyKey })
        .expect(201);

      // Should be the same transaction
      expect(res.body.idempotencyKey).toBe(idempotencyKey);
      expect(res.body.amount).toBe(1);
    });
  });

  describe('Recurrence blocking', () => {
    it('should block transaction with 429 when threshold exceeded', async () => {
      // Reset alice balance
      await dataSource.getRepository(User).update(aliceId, { balance: 1000 });

      // Make 3 transactions (threshold is 3)
      for (let i = 0; i < 3; i++) {
        await supertest(httpServer)
          .post('/transactions')
          .set('Authorization', `Bearer ${aliceToken}`)
          .send({ toUserId: bobId, amount: 10 });
      }

      // 4th should be blocked
      return supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ toUserId: bobId, amount: 10 })
        .expect(429)
        .expect((res) => {
          expect(res.body.message).toContain('Too many');
        });
    });
  });

  describe('GET /transactions/:id', () => {
    let transactionId: string;

    beforeAll(async () => {
      const res = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ toUserId: charlieId, amount: 50 });
      transactionId = res.body.id;
    });

    it('should return transaction for sender', async () => {
      return supertest(httpServer)
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(transactionId);
        });
    });

    it('should return transaction for recipient', async () => {
      return supertest(httpServer)
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${charlieToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(transactionId);
        });
    });

    it('should return 403 for unrelated user', async () => {
      return supertest(httpServer)
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent transaction', async () => {
      return supertest(httpServer)
        .get('/transactions/00000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(404);
    });
  });
});
