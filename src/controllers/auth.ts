import { JoiBody } from '@/decorators/joi';
import { SigninDto, SignupDto } from '@/dtos/auth';
import { AuthService } from '@/services/auth';
import { Body, HttpCode, JsonController, Post } from 'routing-controllers';
import { Service } from 'typedi';
import { SigninSchema, SignupSchema } from '@/validators/auth';
import { successResponse } from '@/utils/responseFactory';

@Service()
@JsonController('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signin')
  @JoiBody(SigninSchema)
  async signin(@Body() signinDto: SigninDto) {
    await this.authService.signin(signinDto);

    return successResponse(null, 'Signed in successfully');
  }

  @Post('/signup')
  @JoiBody(SignupSchema)
  @HttpCode(201)
  async signup(@Body() signupDto: SignupDto) {
    await this.authService.signup(signupDto);
    return successResponse(null, 'User created successfully');
  }
}
