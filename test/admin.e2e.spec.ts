import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/user.entity';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let dataSource: DataSource;

  let adminToken: string;
  let adminUserId: string;
  let normalToken: string;
  let normalUserId: string;

  const adminEmail = `admin${Date.now()}@belo.com`;
  const userEmail = `user${Date.now()}@belo.com`;
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

    // Create admin user
    const adminRes = await supertest(httpServer)
      .post('/auth/register')
      .send({ email: adminEmail, password });
    adminToken = adminRes.body.accessToken;
    adminUserId = adminRes.body.user.id;

    // Assign admin role to admin user
    await dataSource.getRepository(User).update(adminUserId, {
      role: UserRole.ADMIN,
      balance: 5000,
    });

    // Create normal user
    const userRes = await supertest(httpServer)
      .post('/auth/register')
      .send({ email: userEmail, password });
    normalToken = userRes.body.accessToken;
    normalUserId = userRes.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/users/:id/balance', () => {
    it('should return 200 for admin user', async () => {
      const res = await supertest(httpServer)
        .get(`/admin/users/${normalUserId}/balance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('balance');
      expect(res.body).toHaveProperty('email');
    });

    it('should return 403 for regular user', async () => {
      return supertest(httpServer)
        .get(`/admin/users/${normalUserId}/balance`)
        .set('Authorization', `Bearer ${normalToken}`)
        .expect(403);
    });

    it('should return 401 without token', () => {
      return supertest(httpServer)
        .get(`/admin/users/${normalUserId}/balance`)
        .expect(401);
    });
  });

  describe('PUT /admin/users/:id/balance', () => {
    it('should return 200 for admin user', async () => {
      const res = await supertest(httpServer)
        .put(`/admin/users/${normalUserId}/balance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 3000 })
        .expect(200);

      expect(res.body.balance).toBe(3000);
    });

    it('should return 403 for regular user', async () => {
      return supertest(httpServer)
        .put(`/admin/users/${normalUserId}/balance`)
        .set('Authorization', `Bearer ${normalToken}`)
        .send({ amount: 1000 })
        .expect(403);
    });

    it('should return 401 without token', () => {
      return supertest(httpServer)
        .put(`/admin/users/${normalUserId}/balance`)
        .send({ amount: 1000 })
        .expect(401);
    });
  });
});
