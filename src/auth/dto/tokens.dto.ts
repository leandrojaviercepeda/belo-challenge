export class TokensDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
}
