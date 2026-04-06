import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { InviteDto, AcceptInviteDto } from './dto/invite.dto';
import { JwtAuthGuard, JwtRefreshGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('register-patient')
  @ApiOperation({ summary: 'Register a new patient (public)' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerPatient(
    @Body() dto: RegisterPatientDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerPatient(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(@CurrentUser() user: User): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.authService.updateProfile(user.id, {});
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(user.id, dto);
  }

  // --- Password Recovery (4 steps) ---

  @Post('forgot-password')
  @ApiOperation({ summary: 'Step 1: Request password reset code' })
  @ApiResponse({ status: 200, description: 'Reset code sent' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Step 2: Verify reset code, get reset token' })
  @ApiResponse({ status: 200, description: 'Code verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyCode(@Body() dto: VerifyCodeDto): Promise<{ token: string }> {
    return this.authService.verifyResetCode(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Step 3: Set new password with reset token' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, dto);
  }

  // --- Employee Invitation ---

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.CHIEF_DOCTOR, UserRole.ADMIN, UserRole.SYSADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new employee' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async invite(
    @CurrentUser() user: User,
    @Body() dto: InviteDto,
  ): Promise<{ inviteToken: string; message: string }> {
    return this.authService.inviteEmployee(dto, user.id);
  }

  @Post('accept-invite')
  @ApiOperation({ summary: 'Accept invitation and set password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
  ): Promise<AuthResponseDto> {
    return this.authService.acceptInvite(dto);
  }

  // --- Two-Factor Authentication ---

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup 2FA — get QR code and secret' })
  async setup2FA(@CurrentUser() user: User) {
    return this.authService.setup2FA(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA — verify TOTP code' })
  async enable2FA(@CurrentUser() user: User, @Body('code') code: string) {
    return this.authService.enable2FA(user.id, code);
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA code during login' })
  async verify2FA(@Body() body: { tempToken: string; code: string }) {
    return this.authService.verify2FA(body.tempToken, body.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable2FA(@CurrentUser() user: User, @Body('code') code: string) {
    return this.authService.disable2FA(user.id, code);
  }

  // --- User Settings ---

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user settings (JSONB)' })
  async getSettings(@CurrentUser() user: User): Promise<Record<string, any>> {
    return this.authService.getUserSettings(user.id);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user settings (merge)' })
  async updateSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateSettingsDto,
  ): Promise<Record<string, any>> {
    return this.authService.updateUserSettings(user.id, dto.settings);
  }

  // --- Branch Selection ---

  @Post('select-branch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select active branch' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async selectBranch(
    @CurrentUser() user: User,
    @Body('branchId') branchId: string,
  ): Promise<UserResponseDto> {
    return this.authService.selectBranch(user.id, branchId);
  }
}
