import { User } from './user.interface';

export class UserEntity implements User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  lastLoginAt: Date;

  constructor(params: {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
    lastLoginAt: Date;
  }) {
    this.id = params.id;
    this.email = params.email;
    this.name = params.name;
    this.createdAt = params.createdAt;
    this.lastLoginAt = params.lastLoginAt;
    this.isValid();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  public isValid(): boolean {
    if (!this.id) throw new Error('Invalid id');
    if (!this.isValidEmail(this.email)) throw new Error('Invalid email');
    return true;
  }
}
