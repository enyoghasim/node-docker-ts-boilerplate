import { AuthMiddleware } from '@/middlewares/auth';
import { UserService } from '@/services/user';
import { SessionData } from 'express-session';
import {
  Get,
  JsonController,
  Session,
  UnauthorizedError,
  UseBefore,
} from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@JsonController('/user')
@UseBefore(AuthMiddleware)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  async getUserDetails(@Session() session: SessionData) {
    if (!session.user) throw new UnauthorizedError('User not authenticated');

    const user = await this.userService.findById(session.user);

    if (!user) throw new UnauthorizedError('User not found');

    return {
      id: user.id,
      email: user?.email,
      firstname: user?.firstname,
      lastname: user?.lastname,
      phone: user?.phone,
      createdAt: user?.createdAt,
    };
  }
}
