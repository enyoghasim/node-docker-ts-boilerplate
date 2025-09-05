import { Service } from 'typedi';
import { SigninDto, SignupDto } from '@/dtos/auth';
import { UserService } from '@/services/user';
import { BadRequestError, UnauthorizedError } from 'routing-controllers';
import { compare, genSalt, hash } from 'bcryptjs';
import { MailerService } from './mailer';

@Service()
export class AuthService {
  constructor(
    private userService: UserService,
    private mailerService: MailerService
  ) {}

  async signin(signinDto: SigninDto) {
    // this.mailerService.sendTemplatedEmail({
    //   template: 'welcome',
    //   variables: {
    //     firstname: 'Geez',
    //     email: 'geezyenyoghasim@gmail.com',
    //     verificationUrl: 'https://example.com/verify',
    //   },
    //   recipients: 'geezyenyoghasim@gmail.com',
    //   subject: 'Welcome to Luxestay',
    // });

    const { email, password } = signinDto;

    const user = await this.userService.findByEmail(email.toLowerCase());

    if (!user) throw new UnauthorizedError('Invalid credentials');

    if (!user.password && user.googleId)
      throw new UnauthorizedError('Please sign in with Google');

    const isValidPassword = await compare(password, user.password!);

    if (!isValidPassword) throw new UnauthorizedError('Invalid credentials');

    return user;
  }

  async signup(signupDto: SignupDto) {
    const { email, firstname, lastname, password, phone } = signupDto;

    const existingUser = await this.userService.findByEmail(
      email.toLowerCase()
    );

    if (existingUser) throw new BadRequestError('Email already in use');

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    const user = await this.userService.create({
      email: email.toLowerCase(),
      firstname,
      lastname,
      password: hashedPassword,
      phone,
    });

    if (!user) throw new Error('User creation failed');

    console.log('Created user:', user);

    return user;
  }

  async verifyEmail(userId: number, token: string) {}
}
