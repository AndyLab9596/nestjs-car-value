import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { CreateUserDto } from './dtos/create-user.dto';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup({ email, password }: CreateUserDto) {
    const users = await this.usersService.find(email);
    if (users.length) throw new BadRequestException('email in use');
    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer; // 32 is 32 characters back.
    const result = salt + '.' + hash.toString('hex');
    const user = await this.usersService.create({ email, password: result });
    return user;
  }

  async signin({ email, password }: CreateUserDto) {
    const [user] = await this.usersService.find(email);
    if (!user) throw new NotFoundException('user not found');

    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (hash.toString('hex') !== storedHash) {
      throw new BadRequestException('Invalid credential');
    }
    return user;
  }
}
