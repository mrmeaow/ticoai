import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: Partial<DashboardService>;

  beforeEach(async () => {
    dashboardService = {
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard stats for regular user', async () => {
      const mockUser: Partial<User> = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        roles: [{ id: 'role-id', name: 'USER' }],
      };

      const mockStats = {
        total: 10,
        open: 3,
        inProgress: 2,
        resolved: 4,
        closed: 1,
        highPriority: 2,
        recentTickets: [],
      };

      (dashboardService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await controller.getDashboard(mockUser as User);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith('user-id', false);
    });

    it('should return dashboard stats for ADMIN user', async () => {
      const mockUser: Partial<User> = {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: [{ id: 'role-id', name: 'ADMIN' }],
      };

      const mockStats = {
        total: 100,
        open: 30,
        inProgress: 20,
        resolved: 40,
        closed: 10,
        highPriority: 15,
        recentTickets: [],
      };

      (dashboardService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await controller.getDashboard(mockUser as User);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith('admin-id', true);
    });

    it('should return dashboard stats for SUPER_ADMIN user', async () => {
      const mockUser: Partial<User> = {
        id: 'super-admin-id',
        email: 'superadmin@example.com',
        name: 'Super Admin',
        roles: [{ id: 'role-id', name: 'SUPER_ADMIN' }],
      };

      const mockStats = {
        total: 500,
        open: 100,
        inProgress: 50,
        resolved: 300,
        closed: 50,
        highPriority: 75,
        recentTickets: [],
      };

      (dashboardService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await controller.getDashboard(mockUser as User);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith(
        'super-admin-id',
        true,
      );
    });

    it('should handle user with multiple roles', async () => {
      const mockUser: Partial<User> = {
        id: 'multi-role-id',
        email: 'multi@example.com',
        name: 'Multi Role',
        roles: [
          { id: 'role-1', name: 'USER' },
          { id: 'role-2', name: 'ADMIN' },
        ],
      };

      const mockStats = {
        total: 50,
        open: 10,
        inProgress: 5,
        resolved: 30,
        closed: 5,
        highPriority: 8,
        recentTickets: [],
      };

      (dashboardService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await controller.getDashboard(mockUser as User);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith(
        'multi-role-id',
        true,
      );
    });
  });
});
