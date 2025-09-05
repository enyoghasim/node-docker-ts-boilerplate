import { redis } from '@/config/redis';
import { Service } from 'typedi';

@Service()
export class TokenVerificationService {
  // verification for different scopes, email, phone, etc

  async generateAndStore() {}
}
