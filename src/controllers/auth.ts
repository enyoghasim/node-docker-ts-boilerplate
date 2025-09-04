import { JoiBody } from '@/decorators/joi';
import { SigninDto } from '../dtos/auth';
import { AuthService } from '@/services/auth.service';
import { Body, JsonController, Post } from 'routing-controllers';
import { Service } from 'typedi';
import { SigninSchema } from '@/validators/auth';

@JsonController('/auth')
@Service()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signin')
  @JoiBody(SigninSchema)
  async signin(@Body() signinDto: SigninDto): Promise<void> {
    return this.authService.signin(signinDto);
  }
}
