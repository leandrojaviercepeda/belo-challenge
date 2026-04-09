import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let testUserToken: string;
  const testEmail = `test${Date.now()}@belo.com`;
  const testPassword = 'testpassword123';

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return supertest(httpServer)
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).toHaveProperty('email', testEmail);
          testUserToken = res.body.accessToken;
        });
    });

    it('should reject duplicate email', () => {
      return supertest(httpServer)
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('exists');
        });
    });

    it('should reject weak password', () => {
      return supertest(httpServer)
        .post('/auth/register')
        .send({ email: 'weak@belo.com', password: '123' })
        .expect(400);
    });

    it('should reject invalid email', () => {
      return supertest(httpServer)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: 'password123' })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return supertest(httpServer)
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should reject wrong password', () => {
      return supertest(httpServer)
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return supertest(httpServer)
        .post('/auth/login')
        .send({ email: 'nonexistent@belo.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return 401 without token', () => {
      return supertest(httpServer).get('/auth/profile').expect(401);
    });

    it('should return user profile with valid token', () => {
      return supertest(httpServer)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', testEmail);
          expect(res.body).toHaveProperty('id');
        });
    });

    it('should return 401 with invalid token', () => {
      return supertest(httpServer)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
