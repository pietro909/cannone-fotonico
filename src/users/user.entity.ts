import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  username!: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  publicKey!: string;

  @Column({ type: 'text' })
  passwordHash!: string;
}