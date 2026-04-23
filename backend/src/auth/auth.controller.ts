import { Body, Controller, Param, Post, Req, UseGuards, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.code, dto.password);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('invite')
  invite(@Req() req: AuthenticatedRequest, @Body() dto: CreateInviteDto) {
    return this.authService.createInvite(req.pharmacyId ?? req.user.pharmacyId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('invites')
  listInvites(@Req() req: AuthenticatedRequest) {
    return this.authService.listInvites(req.pharmacyId ?? req.user.pharmacyId);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('invites/:inviteId/resend')
  resendInvite(@Req() req: AuthenticatedRequest, @Param('inviteId') inviteId: string) {
    return this.authService.resendInvite(
      req.pharmacyId ?? req.user.pharmacyId,
      inviteId,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('invites/:inviteId/revoke')
  revokeInvite(@Req() req: AuthenticatedRequest, @Param('inviteId') inviteId: string) {
    return this.authService.revokeInvite(
      req.pharmacyId ?? req.user.pharmacyId,
      inviteId,
      req.user.id,
    );
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }
}
