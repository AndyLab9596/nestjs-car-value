import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  const users: User[] = [];

  beforeEach(async () => {
    // Create a fake copy of the users service
    fakeUsersService = {
      find: (email) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: ({ email, password }: CreateUserDto) => {
        const user = {
          id: 'dc9c27dc-152b-4e6d-add5-8c28bd6344f1',
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('it creates a new user with a salted hand hashed password', async () => {
    const user = await service.signup({
      email: 'test@test.com',
      password: 'Azxcv@123',
    });

    expect(user.password).not.toEqual('Azxcv@123');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an errpr if user signs up with email that is in user', async () => {
    await service.signin({
      email: 'test@test.com',
      password: 'Azxcv@123',
    });
    await expect(
      service.signup({ email: 'test@test.com', password: 'Azxcv@123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws if signin is called with an unused email', async () => {
    await service.signin({
      email: 'test@test.com',
      password: 'Azxcv@123',
    });
    await expect(
      service.signin({ email: 'test1@test.com', password: 'Azxcv@123' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        {
          id: 1,
          email: 'test@test.com',
          password: 'Azxcv@123',
        } as unknown as User,
      ]);

    await expect(
      service.signin({ email: 'test@test.com', password: 'Azxcv' }),
    ).rejects.toThrow(new BadRequestException('Invalid credential'));
  });

  it('returns a user if correct password is provided', async () => {
    await service.signin({
      email: 'test@test.com',
      password: 'Azxcv@123',
    });

    const user = await service.signin({
      email: 'test@test.com',
      password: 'Azxcv@123',
    });

    expect(user).toBeDefined();
  });
});
