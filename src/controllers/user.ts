import { AuthMiddleware } from '@/middlewares/auth';
import { UserService } from '@/services/user';
import { UserResponseDto } from '@/dtos/user';
import { SessionData } from 'express-session';
import {
  Get,
  JsonController,
  Session,
  UnauthorizedError,
  UseBefore,
} from 'routing-controllers';
import { Service } from 'typedi';
import { instanceToPlain } from 'class-transformer';
import { ResponseSchema } from 'routing-controllers-openapi';
import { successResponse } from '@/utils/responseFactory';

@Service()
@JsonController('/user')
@UseBefore(AuthMiddleware)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ResponseSchema(UserResponseDto, {
    statusCode: 200,
    description: 'User details fetched successfully',
  })
  async getUserDetails(@Session() session: SessionData) {
    if (!session.user) throw new UnauthorizedError('User not authenticated');

    const user = await this.userService.findById(session.user);

    if (!user) throw new UnauthorizedError('User not found');

    const dto = new UserResponseDto();

    dto.id = user.id;
    dto.email = user.email;
    dto.firstname = user.firstname ?? undefined;
    dto.lastname = user.lastname ?? undefined;
    dto.phone = user.phone ?? undefined;
    dto.createdAt = user.createdAt?.toISOString?.() || String(user.createdAt);

    return successResponse(
      instanceToPlain(dto),
      'User details fetched successfully'
    );
  }
}
