import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(username: string, publicKey: string, password: string): Promise<User> {
    const existing = await this.repo.findOne({ where: [{ username }, { publicKey }] });
    if (existing) {
      if (existing.username === username) throw new ConflictException('username already taken');
      if (existing.publicKey === publicKey) throw new ConflictException('publicKey already taken');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.repo.create({ username, publicKey, passwordHash });
    return this.repo.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async updatePartial(id: string, data: { username?: string; password?: string }): Promise<void> {
    const user = await this.findById(id);
    if (data.username) {
      const usernameTaken = await this.repo.findOne({ where: { username: data.username } });
      if (usernameTaken && usernameTaken.id !== id) throw new ConflictException('username already taken');
      user.username = data.username;
    }
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }
    await this.repo.save(user);
  }
}