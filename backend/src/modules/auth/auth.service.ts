import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { User } from './entities/user.entity';
import { UserSettings } from './entities/user-settings.entity';
import { RegisterDto } from './dto/register.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { InviteDto, AcceptInviteDto } from './dto/invite.dto';
import { UserRole } from '../../common/enums/roles.enum';
import { EmailService } from '../notifications/services/email.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: this.toUserResponse(savedUser),
    };
  }

  async registerPatient(dto: RegisterPatientDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.PATIENT,
    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: this.toUserResponse(savedUser),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account is locked. Try again in ${minutesLeft} minutes`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
        );
        await this.userRepository.save(user);
        throw new ForbiddenException(
          `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCK_DURATION_MINUTES} minutes`,
        );
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // If 2FA is enabled, return partial response requiring TOTP
    if (user.twoFactorEnabled) {
      return {
        accessToken: '',
        refreshToken: '',
        user: this.toUserResponse(user),
        requires2FA: true,
        tempToken: await this.jwtService.signAsync(
          { sub: user.id, twoFactorPending: true },
          {
            secret: this.configService.get<string>('JWT_SECRET', 'clinic-jwt-secret'),
            expiresIn: 300, // 5 min to enter TOTP
          },
        ),
      } as any;
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.toUserResponse(user),
    };
  }

  async refreshTokens(user: User): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.toUserResponse(user),
    };
  }

  // --- Password Recovery (4 steps) ---

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset code has been sent' };
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(code, 10);

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await this.userRepository.save(user);

    // Send reset code via email (falls back to console.log if SMTP not configured)
    await this.emailService.sendEmail(
      dto.email,
      'Код сброса пароля — МедКлиник',
      `<p>Ваш код для сброса пароля: <strong>${code}</strong></p>
       <p>Код действителен в течение 15 минут.</p>`,
    );

    return { message: 'If the email exists, a reset code has been sent' };
  }

  async verifyResetCode(
    dto: VerifyCodeDto,
  ): Promise<{ token: string }> {
    const user = await this.userRepository.findOne({
      where: {
        email: dto.email,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user || !user.resetPasswordToken) {
      throw new BadRequestException('Invalid or expired code');
    }

    const isCodeValid = await bcrypt.compare(dto.code, user.resetPasswordToken);
    if (!isCodeValid) {
      throw new BadRequestException('Invalid or expired code');
    }

    // Generate a one-time reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await this.userRepository.save(user);

    return { token: resetToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const users = await this.userRepository.find({
      where: {
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    let matchedUser: User | null = null;
    for (const user of users) {
      if (
        user.resetPasswordToken &&
        (await bcrypt.compare(dto.token, user.resetPasswordToken))
      ) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    matchedUser.password = await bcrypt.hash(dto.newPassword, 10);
    matchedUser.resetPasswordToken = null;
    matchedUser.resetPasswordExpires = null;
    matchedUser.failedLoginAttempts = 0;
    matchedUser.lockedUntil = null;
    await this.userRepository.save(matchedUser);

    return { message: 'Password has been reset successfully' };
  }

  // --- Change Password ---

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  // --- Update Profile ---

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);
    const savedUser = await this.userRepository.save(user);

    return this.toUserResponse(savedUser);
  }

  // --- Employee Invitation ---

  async inviteEmployee(
    dto: InviteDto,
    invitedById: string,
  ): Promise<{ inviteToken: string; message: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(inviteToken, 10);

    const user = this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName || null,
      phone: dto.phone,
      role: dto.role,
      departmentId: dto.departmentId || null,
      branchId: dto.branchId || null,
      password: '', // Will be set on accept
      isActive: false,
      inviteToken: hashedToken,
      inviteExpires: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    });

    await this.userRepository.save(user);

    // Send invite link via email (falls back to console.log if SMTP not configured)
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    await this.emailService.sendEmail(
      dto.email,
      'Приглашение в МедКлиник',
      `<p>Вы приглашены присоединиться к системе МедКлиник.</p>
       <p>Для активации аккаунта перейдите по ссылке:</p>
       <p><a href="${frontendUrl}/auth/accept-invite?token=${inviteToken}">Принять приглашение</a></p>
       <p>Ссылка действительна 72 часа.</p>`,
    );

    return {
      inviteToken,
      message: `Invitation sent to ${dto.email}`,
    };
  }

  async acceptInvite(dto: AcceptInviteDto): Promise<AuthResponseDto> {
    const users = await this.userRepository.find({
      where: {
        inviteExpires: MoreThan(new Date()),
        isActive: false,
      },
    });

    let matchedUser: User | null = null;
    for (const user of users) {
      if (
        user.inviteToken &&
        (await bcrypt.compare(dto.token, user.inviteToken))
      ) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    matchedUser.password = await bcrypt.hash(dto.password, 10);
    matchedUser.isActive = true;
    matchedUser.inviteToken = null;
    matchedUser.inviteExpires = null;
    const savedUser = await this.userRepository.save(matchedUser);

    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: this.toUserResponse(savedUser),
    };
  }

  // --- Select Branch ---

  async selectBranch(
    userId: string,
    branchId: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.branchId = branchId;
    const savedUser = await this.userRepository.save(user);

    return this.toUserResponse(savedUser);
  }

  // --- Two-Factor Authentication ---

  async setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'MedClinic', label: user.email, secret });
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (not enabled yet)
    user.twoFactorSecret = secret;
    await this.userRepository.save(user);

    return { secret, qrCodeUrl };
  }

  async enable2FA(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Call setup-2fa first');
    }

    const isValid = verifySync({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw new BadRequestException('Неверный код. Попробуйте ещё раз');
    }

    user.twoFactorEnabled = true;
    await this.userRepository.save(user);

    return { message: '2FA successfully enabled' };
  }

  async verify2FA(tempToken: string, code: string): Promise<AuthResponseDto> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(tempToken, {
        secret: this.configService.get<string>('JWT_SECRET', 'clinic-jwt-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session');
    }

    if (!payload.twoFactorPending) {
      throw new BadRequestException('Invalid 2FA token');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = verifySync({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const tokens = await this.generateTokens(user);
    return { ...tokens, user: this.toUserResponse(user) };
  }

  async disable2FA(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isValid = verifySync({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw new BadRequestException('Неверный код');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await this.userRepository.save(user);

    return { message: '2FA disabled' };
  }

  // --- User Settings ---

  async getUserSettings(userId: string): Promise<Record<string, any>> {
    const row = await this.settingsRepository.findOne({ where: { userId } });
    return row?.settings ?? {};
  }

  async updateUserSettings(
    userId: string,
    settings: Record<string, any>,
  ): Promise<Record<string, any>> {
    let row = await this.settingsRepository.findOne({ where: { userId } });

    if (!row) {
      row = this.settingsRepository.create({ userId, settings });
    } else {
      row.settings = { ...row.settings, ...settings };
    }

    const saved = await this.settingsRepository.save(row);
    return saved.settings;
  }

  // --- Helpers ---

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_SECRET',
          'clinic-jwt-secret',
        ),
        expiresIn: 900, // 15 minutes
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'clinic-jwt-refresh-secret',
        ),
        expiresIn: 604800, // 7 days
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private toUserResponse(user: User): UserResponseDto {
    const {
      password,
      deletedAt,
      twoFactorSecret,
      resetPasswordToken,
      resetPasswordExpires,
      inviteToken,
      inviteExpires,
      failedLoginAttempts,
      lockedUntil,
      ...result
    } = user;
    return result as UserResponseDto;
  }
}
