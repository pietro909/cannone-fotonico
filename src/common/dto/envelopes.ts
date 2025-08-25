export class EmptyDataEnvelope { data: Record<string, never> = {}; }

export class ErrorResponse { errors!: string[]; }

export class AuthSuccessEnvelope {
  data!: { userId: string; accessToken: string };
}