import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesRepository } from './messages.repository';
import { Message } from './entities/message.entity';
import { MessageRole } from '@pkg/types';

describe('MessagesRepository', () => {
  let repository: MessagesRepository;
  let mockRepository: Partial<Repository<Message>>;

  const mockMessage: Message = {
    id: 'message-uuid-1',
    content: 'Test message content',
    role: MessageRole.USER,
    ticket: { id: 'ticket-uuid-1' } as any,
    sender: {
      id: 'user-uuid-1',
      name: 'Test User',
      email: 'test@example.com',
    } as any,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  const mockMessage2: Message = {
    id: 'message-uuid-2',
    content: 'Second message',
    role: MessageRole.AGENT,
    ticket: { id: 'ticket-uuid-1' } as any,
    sender: {
      id: 'user-uuid-2',
      name: 'Agent',
      email: 'agent@example.com',
    } as any,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesRepository,
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<MessagesRepository>(MessagesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a message when found with relations', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockMessage);

      const result = await repository.findById('message-uuid-1');

      expect(result).toEqual(mockMessage);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'message-uuid-1' },
        relations: ['ticket', 'sender'],
      });
    });

    it('should return null when message not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should include ticket and sender relations', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockMessage);

      await repository.findById('message-uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['ticket', 'sender'],
        }),
      );
    });
  });

  describe('findByTicketId', () => {
    it('should return messages for a ticket', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([
        mockMessage,
        mockMessage2,
      ]);

      const result = await repository.findByTicketId('ticket-uuid-1');

      expect(result).toEqual([mockMessage, mockMessage2]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { ticket: { id: 'ticket-uuid-1' } },
        relations: ['sender'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no messages found', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByTicketId('non-existent-ticket');

      expect(result).toEqual([]);
    });

    it('should include sender relation', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([mockMessage]);

      await repository.findByTicketId('ticket-uuid-1');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['sender'],
        }),
      );
    });

    it('should order messages by createdAt ASC', async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([mockMessage]);

      await repository.findByTicketId('ticket-uuid-1');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'ASC' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create and return a new message', async () => {
      const messageData = {
        content: 'New message',
        role: MessageRole.USER,
        ticket: { id: 'ticket-uuid-1' } as any,
        sender: { id: 'user-uuid-1' } as any,
      };
      const createdMessage = { ...mockMessage, ...messageData };

      (mockRepository.create as jest.Mock).mockReturnValue(createdMessage);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdMessage);

      const result = await repository.create(messageData);

      expect(mockRepository.create).toHaveBeenCalledWith(messageData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdMessage);
      expect(result).toEqual(createdMessage);
    });
  });

  describe('delete', () => {
    it('should soft delete a message', async () => {
      (mockRepository.softDelete as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await repository.delete('message-uuid-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('message-uuid-1');
    });
  });
});
