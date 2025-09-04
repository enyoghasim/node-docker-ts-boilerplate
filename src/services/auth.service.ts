import { Service } from 'typedi';
import { SigninDto } from '@/dtos/auth';
import { UserService } from '@/services/user.service';
import { UnauthorizedError } from 'routing-controllers';

@Service()
export class AuthService {
  constructor(private userService: UserService) {}

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    const user = await this.userService.findByEmail(email.toLowerCase());

    if (!user) throw new UnauthorizedError('Invalid credentials');
  }
}
