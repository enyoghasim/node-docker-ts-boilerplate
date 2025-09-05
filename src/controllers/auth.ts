import { JoiBody } from '@/decorators/joi';
import { SigninDto, SignupDto } from '@/dtos/auth';
import { AuthService } from '@/services/auth';
import {
  Body,
  Get,
  HttpCode,
  JsonController,
  Post,
  Req,
  Session,
  UseBefore,
} from 'routing-controllers';
import { Service } from 'typedi';
import { SigninSchema, SignupSchema } from '@/validators/auth';
import { successResponse } from '@/utils/responseFactory';
import { Request } from 'express';
import { AuthMiddleware } from '@/middlewares/auth';
import { SessionData } from 'express-session';

@Service()
@JsonController('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signin')
  @JoiBody(SigninSchema)
  async signin(@Body() body: SigninDto, @Session() sess: SessionData) {
    const user = await this.authService.signin(body);

    sess.user = user.id;
    return successResponse(null, 'Signed in successfully');
  }

  @Post('/signup')
  @JoiBody(SignupSchema)
  @HttpCode(201)
  async signup(@Body() signupDto: SignupDto) {
    await this.authService.signup(signupDto);
    return successResponse(null, 'User created successfully');
  }

  @Get('/signout')
  @UseBefore(AuthMiddleware)
  async signout(@Req() req: Request) {
    req.session.destroy((e) => {
      if (e) console.error('session destroy error:', e);
    });

    return successResponse(null, 'Signed out successfully');
  }
}
