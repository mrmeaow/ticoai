import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { TicketsService } from '../tickets/tickets.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let ticketsService: Partial<TicketsService>;

  beforeEach(async () => {
    ticketsService = {
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: TicketsService, useValue: ticketsService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return ticket stats for regular user', async () => {
      const userId = 'user-id';
      const isAdmin = false;
      const mockStats = {
        total: 10,
        open: 3,
        inProgress: 2,
        resolved: 4,
        closed: 1,
        highPriority: 2,
        recentTickets: [],
      };

      (ticketsService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await service.getStats(userId, isAdmin);

      expect(result).toEqual(mockStats);
      expect(ticketsService.getStats).toHaveBeenCalledWith(userId, isAdmin);
    });

    it('should return ticket stats for admin', async () => {
      const userId = 'admin-id';
      const isAdmin = true;
      const mockStats = {
        total: 100,
        open: 30,
        inProgress: 20,
        resolved: 40,
        closed: 10,
        highPriority: 15,
        recentTickets: [],
      };

      (ticketsService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await service.getStats(userId, isAdmin);

      expect(result).toEqual(mockStats);
      expect(ticketsService.getStats).toHaveBeenCalledWith(userId, isAdmin);
    });
  });
});
