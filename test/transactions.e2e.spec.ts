import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/user.entity';
import { TransactionStatus } from '../src/transactions/transaction-status.enum';

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

  describe('Reference (Idempotency)', () => {
    it('should return existing transaction for duplicate reference', async () => {
      const reference = `TXN-TEST-${Date.now()}`;

      // First request - creates transaction
      await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${charlieToken}`)
        .send({ toUserId: aliceId, amount: 1, reference })
        .expect(201);

      // Second request with same reference - should return existing (still 201 but same id)
      const res = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${charlieToken}`)
        .send({ toUserId: aliceId, amount: 1, reference })
        .expect(201);

      // Should be the same transaction
      expect(res.body.reference).toBe(reference);
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

  describe('POST /transactions - Amount threshold', () => {
    it('should create transaction with PENDING status for amount > $50000', async () => {
      // Create a new user for this test to avoid recurrence block
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `newuser1-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 300000 });

      const res = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: bobId, amount: 60000 })
        .expect(201);

      expect(res.body.status).toBe(TransactionStatus.PENDING);
      // Verify balances were NOT changed (still pending)
      const newUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: newUserId } });
      expect(newUser).not.toBeNull();
      expect(Number(newUser!.balance)).toBe(300000);
    });

    it('should create transaction with COMPLETED status for amount ≤ $50000', async () => {
      // Create a new user for this test to avoid recurrence block
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `newuser2-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 100000 });

      const res = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: charlieId, amount: 50000 })
        .expect(201);

      expect(res.body.status).toBe(TransactionStatus.COMPLETED);
    });
  });

  describe('GET /transactions (list)', () => {
    let aliceTokenAdmin: string;

    beforeAll(async () => {
      // Create admin user for approve/reject tests
      const adminRes = await supertest(httpServer)
        .post('/auth/register')
        .send({
          email: `admin${Date.now()}@belo.com`,
          password,
          role: UserRole.ADMIN,
        });
      aliceTokenAdmin = adminRes.body.accessToken;
    });

    it('should list transactions for a user', async () => {
      const res = await supertest(httpServer)
        .get(`/transactions?userId=${aliceId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      return supertest(httpServer)
        .get(`/transactions?userId=${aliceId}`)
        .expect(401);
    });
  });

  describe('PATCH /transactions/:id/approve', () => {
    it('should approve a pending transaction as admin', async () => {
      // Create a new user for this test to avoid recurrence block
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `approve-user-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 200000 });

      // Create pending transaction
      const txRes = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: bobId, amount: 60000 });
      const pendingId = txRes.body.id;

      // Create admin token
      const adminRes = await supertest(httpServer)
        .post('/auth/register')
        .send({
          email: `admin-approve-${Date.now()}@belo.com`,
          password,
          role: UserRole.ADMIN,
        });
      const adminToken = adminRes.body.accessToken;

      const res = await supertest(httpServer)
        .patch(`/transactions/${pendingId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should return 403 for non-admin', async () => {
      // Create a new pending transaction
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `nonadmin-user-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 100000 });

      const txRes = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: bobId, amount: 60001 });
      const pendingId = txRes.body.id;

      return supertest(httpServer)
        .patch(`/transactions/${pendingId}/approve`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });

    it('should return 400 for non-pending transaction', async () => {
      // Create a small transaction (completed)
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `complete-user-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 100000 });

      const txRes = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: charlieId, amount: 100 });
      const completedId = txRes.body.id;

      const adminRes = await supertest(httpServer)
        .post('/auth/register')
        .send({
          email: `admin-approve2-${Date.now()}@belo.com`,
          password,
          role: UserRole.ADMIN,
        });
      const adminToken = adminRes.body.accessToken;

      return supertest(httpServer)
        .patch(`/transactions/${completedId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('PATCH /transactions/:id/reject', () => {
    it('should reject a pending transaction as admin', async () => {
      // Create a new user for this test to avoid recurrence block
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `reject-user-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 200000 });

      // Create pending transaction
      const txRes = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: bobId, amount: 70000 });
      const pendingId = txRes.body.id;

      const adminRes = await supertest(httpServer)
        .post('/auth/register')
        .send({
          email: `admin-reject-${Date.now()}@belo.com`,
          password,
          role: UserRole.ADMIN,
        });
      const adminToken = adminRes.body.accessToken;

      const res = await supertest(httpServer)
        .patch(`/transactions/${pendingId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe(TransactionStatus.REJECTED);

      // Verify balances were NOT changed
      const newUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: newUserId } });
      expect(newUser).not.toBeNull();
      expect(Number(newUser!.balance)).toBe(200000);
    });

    it('should return 403 for non-admin', async () => {
      // Create a new pending transaction
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `reject-nonadmin-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 100000 });

      const txRes = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: bobId, amount: 70001 });
      const pendingId = txRes.body.id;

      return supertest(httpServer)
        .patch(`/transactions/${pendingId}/reject`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });

    it('should return 400 for non-pending transaction', async () => {
      // Create a small transaction (completed)
      const newUserRes = await supertest(httpServer)
        .post('/auth/register')
        .send({ email: `complete-reject-${Date.now()}@belo.com`, password });
      const newUserToken = newUserRes.body.accessToken;
      const newUserId = newUserRes.body.user.id;

      await dataSource
        .getRepository(User)
        .update(newUserId, { balance: 100000 });

      const txRes = await supertest(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ toUserId: charlieId, amount: 50 });
      const completedId = txRes.body.id;

      const adminRes = await supertest(httpServer)
        .post('/auth/register')
        .send({
          email: `admin-reject2-${Date.now()}@belo.com`,
          password,
          role: UserRole.ADMIN,
        });
      const adminToken = adminRes.body.accessToken;

      return supertest(httpServer)
        .patch(`/transactions/${completedId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});
