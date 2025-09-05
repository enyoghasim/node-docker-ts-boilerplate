import { Service } from 'typedi';
import { SigninDto, SignupDto } from '@/dtos/auth';
import { UserService } from '@/services/user';
import { BadRequestError, UnauthorizedError } from 'routing-controllers';
import { compare, genSalt, hash } from 'bcryptjs';
import { MailerService } from './mailer';

import { OAuth2Client } from 'google-auth-library';

@Service()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private userService: UserService,
    private mailerService: MailerService
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      'postmessage'
    );
  }

  async signin(signinDto: SigninDto) {
    // this.mailerService.sendTemplatedEmail({
    //   template: 'welcome',
    //   variables: {
    //     firstname: 'Geez',
    //     email: 'geezyenyoghasim@gmail.com',
    //     verificationUrl: 'https://example.com/verify',
    //   },
    //   recipients: 'geezyenyoghasim@gmail.com',
    //   subject: 'Welcome to app',
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

  async googleSignin(code: string) {
    const userInfo = await this.validateGoogleCode(code);

    if (!userInfo) {
      throw new BadRequestError('Google account has no email associated');
    }

    const user = await this.userService.findByEmail(
      userInfo.email.toLowerCase()
    );

    if (user) {
      await this.userService.update(user.id, {
        googleId: userInfo.googleId,
        hasVerifiedEmail: true,
      });
      return user;
    } else {
      const newUser = await this.userService.create({
        email: userInfo.email.toLowerCase(),
        firstname: userInfo.name.split(' ')[0] || '',
        lastname: userInfo.name.split(' ').slice(1).join(' ') || '',
        googleId: userInfo.googleId,
        hasVerifiedEmail: true,
      });

      if (!newUser[0]) throw new Error('User creation failed');

      return newUser[0];
    }
  }

  async validateGoogleCode(authorizationCode: string) {
    const { tokens } = await this.googleClient.getToken(authorizationCode);

    if (!tokens.id_token) {
      throw new BadRequestError('No ID token received from Google');
    }

    console.log(
      'Successfully exchanged code for tokens, verifying ID token...'
    );

    // Verify the ID token using OAuth2Client
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new BadRequestError('Invalid ID token payload');
    }

    // Verify token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new BadRequestError('ID token has expired');
    }

    // Verify issuer
    if (
      payload.iss !== 'https://accounts.google.com' &&
      payload.iss !== 'accounts.google.com'
    ) {
      throw new BadRequestError('Invalid token issuer');
    }

    // Verify audience
    if (payload.aud !== process.env.GOOGLE_OAUTH_CLIENT_ID) {
      throw new BadRequestError('Invalid token audience');
    }

    if (!payload.email) {
      throw new BadRequestError('Email not found in ID token');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture || '',
      emailVerified: payload.email_verified || false,
      tokens, // Include tokens for potential future use (refresh tokens, etc.)
    };
  }
}
