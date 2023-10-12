import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: string) =>
        Promise.resolve({
          id,
          email: 'test@test.com',
          password: 'Azxcv@123',
        } as unknown as User),
      find: (email: string) => {
        return Promise.resolve([
          {
            id: 'dc9c27dc-152b-4e6d-add5-8c28bd6344f1',
            email,
            password: 'Azxcv@123',
          } as User,
        ]);
      },
      // remove: () => {},
      // update: () => {},
    };
    fakeAuthService = {
      // signup: () => {},
      signin: ({ email, password }: CreateUserDto) => {
        return Promise.resolve({
          id: 'dc9c27dc-152b-4e6d-add5-8c28bd6344f1',
          email,
          password,
        } as unknown as User);
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllUsers returns a list of users with the given email', async () => {
    const users = await controller.findAllUsers('test@test.com');
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('test@test.com');
  });

  it('findUser return a single user with the given id', async () => {
    const user = await controller.findAllUsers(
      'dc9c27dc-152b-4e6d-add5-8c28bd6344f1',
    );
    expect(user).toBeDefined();
  });

  it('findUser throws an error if user with given id is not found', async () => {
    fakeUsersService.findOne = () => null;
    await expect(
      controller.findUser('dc9c27dc-152b-4e6d-add5-8c28bd6344f1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('signin updates session object and returns user', async () => {
    const session = { userId: '1' };
    const user = await controller.signin(
      {
        email: 'test@test.com',
        password: 'Azxcv@123',
      },
      session,
    );

    expect(user.id).toEqual('dc9c27dc-152b-4e6d-add5-8c28bd6344f1');
    expect(session.userId).toEqual('dc9c27dc-152b-4e6d-add5-8c28bd6344f1');
  });
});
