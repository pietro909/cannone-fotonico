import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Req
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Auth')
@Controller()
export class UsersController {
  constructor(private users: UsersService, private jwt: JwtService) {}

  // POST /signup
  @Post('signup')
  async signup(@Body() dto: SignUpDto) {
    const u = await this.users.create(dto.username, dto.publicKey, dto.password);
    const accessToken = this.jwt.sign({ userId: u.id }, { secret: process.env.JWT_SECRET! });
    return { data: { userId: u.id, accessToken } };
  }

  // POST /signin
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: SignInDto) {
    const u = await this.users.findByUsername(dto.username);
    if (!u) {
      return Promise.reject({ status: 401, message: 'wrong credentials' });
    }
    const ok = await this.users.verifyPassword(u, dto.password);
    if (!ok) {
      return Promise.reject({ status: 401, message: 'wrong credentials' });
    }
    const accessToken = this.jwt.sign({ userId: u.id }, { secret: process.env.JWT_SECRET! });
    return { data: { userId: u.id, accessToken } };
  }

  // POST /signout (stateless JWT; no-op + 200 envelope)
  @Post('signout')
  @UseGuards(AuthGuard)
  @ApiSecurity('Authentication')
  @HttpCode(HttpStatus.OK)
  async signout() {
    return { data: {} };
  }

  // DELETE /users/{user_id}
  @Delete('users/:user_id')
  @UseGuards(AuthGuard)
  @ApiSecurity('Authentication')
  async delete(@Param('user_id') userId: string, @Req() req: any) {
    const authUserId = (req as any).user?.userId ?? (req as any).userId;
    if (userId !== authUserId) throw new ForbiddenException('forbidden');
    await this.users.deleteById(userId);
    return { data: {} };
  }

  // PATCH /users/{user_id}
  @Patch('users/:user_id')
  @UseGuards(AuthGuard)
  @ApiSecurity('Authentication')
  async update(@Param('user_id') userId: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    const authUserId = (req as any).user?.userId ?? (req as any).userId;
    if (userId !== authUserId) throw new ForbiddenException('forbidden');
    await this.users.updatePartial(userId, dto);
    return { data: {} };
  }
}