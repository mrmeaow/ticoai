import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => mockRedisClient),
  };
});

const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  incr: jest.fn(),
  decr: jest.fn(),
  hset: jest.fn(),
  hget: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),
  lpush: jest.fn(),
  rpush: jest.fn(),
  lrange: jest.fn(),
  lpop: jest.fn(),
  rpop: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  sismember: jest.fn(),
  srem: jest.fn(),
  zadd: jest.fn(),
  zrange: jest.fn(),
  zscore: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
};

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    mockRedisClient.ping.mockResolvedValue('PONG');

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService, ConfigService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    if (service.onModuleDestroy) {
      await service.onModuleDestroy();
    }
    jest.clearAllMocks();
  });

  describe('getClient', () => {
    it('should return the Redis client', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
      expect(client).toBe(mockRedisClient);
    });
  });

  describe('get', () => {
    it('should return value when key exists', async () => {
      mockRedisClient.get.mockResolvedValue('test-value');

      const result = await service.get('test-key');

      expect(result).toBe('test-value');
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(result).toBeNull();
    });

    it('should handle Redis connection errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Connection refused'));

      await expect(service.get('test-key')).rejects.toThrow(
        'Connection refused',
      );
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('test-key', 'test-value');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
      );
    });

    it('should set value with TTL using setex', async () => {
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.set('test-key', 'test-value', 3600);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'test-key',
        3600,
        'test-value',
      );
    });

    it('should handle TTL of zero', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('test-key', 'test-value', 0);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
      );
    });

    it('should handle string values correctly', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const testValue = 'string-with-special-chars-!@#$%^&*()';

      await service.set('test-key', testValue);

      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', testValue);
    });

    it('should handle empty string values', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('test-key', '');

      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', '');
    });

    it('should handle Redis errors on set', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('test-key', 'value')).rejects.toThrow(
        'Redis error',
      );
    });
  });

  describe('del', () => {
    it('should delete single key', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should return 0 when key does not exist', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      await service.del('non-existent');

      expect(mockRedisClient.del).toHaveBeenCalledWith('non-existent');
    });

    it('should handle deletion errors', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Connection lost'));

      await expect(service.del('test-key')).rejects.toThrow('Connection lost');
    });
  });

  describe('delMultiple', () => {
    it('should delete multiple keys', async () => {
      mockRedisClient.del.mockResolvedValue(3);

      const result = await service.delMultiple(['key1', 'key2', 'key3']);

      expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
      expect(result).toBe(3);
    });

    it('should return 0 when no keys exist', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await service.delMultiple(['key1', 'key2']);

      expect(result).toBe(0);
    });

    it('should handle empty array', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await service.delMultiple([]);

      expect(mockRedisClient.del).toHaveBeenCalledWith();
      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.exists('non-existent');

      expect(result).toBe(false);
    });

    it('should handle errors', async () => {
      mockRedisClient.exists.mockRejectedValue(new Error('Redis error'));

      await expect(service.exists('test-key')).rejects.toThrow('Redis error');
    });
  });

  describe('expire', () => {
    it('should set expiration on key', async () => {
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.expire('test-key', 3600);

      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 3600);
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.expire.mockResolvedValue(0);

      const result = await service.expire('non-existent', 3600);

      expect(result).toBe(false);
    });

    it('should handle short TTL', async () => {
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.expire('test-key', 1);

      expect(result).toBe(true);
    });

    it('should handle negative TTL', async () => {
      mockRedisClient.expire.mockResolvedValue(0);

      const result = await service.expire('test-key', -1);

      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return TTL for key with expiration', async () => {
      mockRedisClient.ttl.mockResolvedValue(3600);

      const result = await service.ttl('test-key');

      expect(result).toBe(3600);
    });

    it('should return -1 for key without expiration', async () => {
      mockRedisClient.ttl.mockResolvedValue(-1);

      const result = await service.ttl('test-key');

      expect(result).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      mockRedisClient.ttl.mockResolvedValue(-2);

      const result = await service.ttl('non-existent');

      expect(result).toBe(-2);
    });
  });

  describe('incr', () => {
    it('should increment value by 1', async () => {
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await service.incr('counter');

      expect(result).toBe(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('counter');
    });

    it('should increment existing value', async () => {
      mockRedisClient.incr.mockResolvedValue(10);

      const result = await service.incr('counter');

      expect(result).toBe(10);
    });

    it('should handle multiple increments', async () => {
      mockRedisClient.incr
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      expect(await service.incr('counter')).toBe(1);
      expect(await service.incr('counter')).toBe(2);
      expect(await service.incr('counter')).toBe(3);
    });

    it('should throw on invalid key type', async () => {
      mockRedisClient.incr.mockRejectedValue(
        new Error(
          'ERR WRONGTYPE Operation against a key holding the wrong kind of value',
        ),
      );

      await expect(service.incr('test-key')).rejects.toThrow();
    });
  });

  describe('decr', () => {
    it('should decrement value by 1', async () => {
      mockRedisClient.decr.mockResolvedValue(-1);

      const result = await service.decr('counter');

      expect(result).toBe(-1);
      expect(mockRedisClient.decr).toHaveBeenCalledWith('counter');
    });

    it('should decrement from positive value', async () => {
      mockRedisClient.decr.mockResolvedValue(5);

      const result = await service.decr('counter');

      expect(result).toBe(5);
    });

    it('should handle multiple decrements', async () => {
      mockRedisClient.decr
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(3);

      expect(await service.decr('counter')).toBe(5);
      expect(await service.decr('counter')).toBe(4);
      expect(await service.decr('counter')).toBe(3);
    });
  });

  describe('hset', () => {
    it('should set hash field', async () => {
      mockRedisClient.hset.mockResolvedValue(1);

      const result = await service.hset('hash-key', 'field', 'value');

      expect(result).toBe(1);
      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'hash-key',
        'field',
        'value',
      );
    });

    it('should update existing field', async () => {
      mockRedisClient.hset.mockResolvedValue(0);

      const result = await service.hset('hash-key', 'field', 'new-value');

      expect(result).toBe(0);
    });

    it('should handle multiple fields', async () => {
      mockRedisClient.hset.mockResolvedValue(2);

      await service.hset('hash-key', 'field1', 'value1');
      await service.hset('hash-key', 'field2', 'value2');

      expect(mockRedisClient.hset).toHaveBeenCalledTimes(2);
    });
  });

  describe('hget', () => {
    it('should get hash field value', async () => {
      mockRedisClient.hget.mockResolvedValue('value');

      const result = await service.hget('hash-key', 'field');

      expect(result).toBe('value');
    });

    it('should return null for non-existent field', async () => {
      mockRedisClient.hget.mockResolvedValue(null);

      const result = await service.hget('hash-key', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('hdel', () => {
    it('should delete hash field', async () => {
      mockRedisClient.hdel.mockResolvedValue(1);

      const result = await service.hdel('hash-key', 'field');

      expect(result).toBe(1);
    });

    it('should delete multiple fields', async () => {
      mockRedisClient.hdel.mockResolvedValue(2);

      const result = await service.hdel('hash-key', 'field1', 'field2');

      expect(result).toBe(2);
      expect(mockRedisClient.hdel).toHaveBeenCalledWith(
        'hash-key',
        'field1',
        'field2',
      );
    });

    it('should return 0 when field does not exist', async () => {
      mockRedisClient.hdel.mockResolvedValue(0);

      const result = await service.hdel('hash-key', 'non-existent');

      expect(result).toBe(0);
    });
  });

  describe('hgetall', () => {
    it('should get all hash fields and values', async () => {
      mockRedisClient.hgetall.mockResolvedValue({
        field1: 'value1',
        field2: 'value2',
      });

      const result = await service.hgetall('hash-key');

      expect(result).toEqual({
        field1: 'value1',
        field2: 'value2',
      });
    });

    it('should return empty object for non-existent key', async () => {
      mockRedisClient.hgetall.mockResolvedValue({});

      const result = await service.hgetall('non-existent');

      expect(result).toEqual({});
    });

    it('should handle single field', async () => {
      mockRedisClient.hgetall.mockResolvedValue({ field: 'value' });

      const result = await service.hgetall('hash-key');

      expect(result).toEqual({ field: 'value' });
    });
  });

  describe('lpush', () => {
    it('should push value to list head', async () => {
      mockRedisClient.lpush.mockResolvedValue(1);

      const result = await service.lpush('list-key', 'value');

      expect(result).toBe(1);
      expect(mockRedisClient.lpush).toHaveBeenCalledWith('list-key', 'value');
    });

    it('should push multiple values', async () => {
      mockRedisClient.lpush.mockResolvedValue(3);

      const result = await service.lpush(
        'list-key',
        'value1',
        'value2',
        'value3',
      );

      expect(result).toBe(3);
      expect(mockRedisClient.lpush).toHaveBeenCalledWith(
        'list-key',
        'value1',
        'value2',
        'value3',
      );
    });

    it('should prepend to existing list', async () => {
      mockRedisClient.lpush.mockResolvedValue(5);

      const result = await service.lpush('list-key', 'new-value');

      expect(result).toBe(5);
    });
  });

  describe('rpush', () => {
    it('should push value to list tail', async () => {
      mockRedisClient.rpush.mockResolvedValue(1);

      const result = await service.rpush('list-key', 'value');

      expect(result).toBe(1);
      expect(mockRedisClient.rpush).toHaveBeenCalledWith('list-key', 'value');
    });

    it('should push multiple values', async () => {
      mockRedisClient.rpush.mockResolvedValue(3);

      const result = await service.rpush(
        'list-key',
        'value1',
        'value2',
        'value3',
      );

      expect(result).toBe(3);
    });
  });

  describe('lrange', () => {
    it('should get range of elements', async () => {
      mockRedisClient.lrange.mockResolvedValue(['a', 'b', 'c']);

      const result = await service.lrange('list-key', 0, -1);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should get first N elements', async () => {
      mockRedisClient.lrange.mockResolvedValue(['a', 'b']);

      const result = await service.lrange('list-key', 0, 1);

      expect(result).toEqual(['a', 'b']);
    });

    it('should return empty array for empty list', async () => {
      mockRedisClient.lrange.mockResolvedValue([]);

      const result = await service.lrange('list-key', 0, -1);

      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent list', async () => {
      mockRedisClient.lrange.mockResolvedValue([]);

      const result = await service.lrange('non-existent', 0, -1);

      expect(result).toEqual([]);
    });
  });

  describe('lpop', () => {
    it('should pop value from list head', async () => {
      mockRedisClient.lpop.mockResolvedValue('first');

      const result = await service.lpop('list-key');

      expect(result).toBe('first');
    });

    it('should return null for empty list', async () => {
      mockRedisClient.lpop.mockResolvedValue(null);

      const result = await service.lpop('list-key');

      expect(result).toBeNull();
    });
  });

  describe('rpop', () => {
    it('should pop value from list tail', async () => {
      mockRedisClient.rpop.mockResolvedValue('last');

      const result = await service.rpop('list-key');

      expect(result).toBe('last');
    });

    it('should return null for empty list', async () => {
      mockRedisClient.rpop.mockResolvedValue(null);

      const result = await service.rpop('list-key');

      expect(result).toBeNull();
    });
  });

  describe('sadd', () => {
    it('should add members to set', async () => {
      mockRedisClient.sadd.mockResolvedValue(1);

      const result = await service.sadd('set-key', 'member');

      expect(result).toBe(1);
      expect(mockRedisClient.sadd).toHaveBeenCalledWith('set-key', 'member');
    });

    it('should add multiple members', async () => {
      mockRedisClient.sadd.mockResolvedValue(3);

      const result = await service.sadd(
        'set-key',
        'member1',
        'member2',
        'member3',
      );

      expect(result).toBe(3);
    });

    it('should return 0 for duplicate members', async () => {
      mockRedisClient.sadd.mockResolvedValue(0);

      const result = await service.sadd('set-key', 'existing-member');

      expect(result).toBe(0);
    });
  });

  describe('smembers', () => {
    it('should get all set members', async () => {
      mockRedisClient.smembers.mockResolvedValue(['a', 'b', 'c']);

      const result = await service.smembers('set-key');

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should return empty array for empty set', async () => {
      mockRedisClient.smembers.mockResolvedValue([]);

      const result = await service.smembers('set-key');

      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent set', async () => {
      mockRedisClient.smembers.mockResolvedValue([]);

      const result = await service.smembers('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('sismember', () => {
    it('should return 1 when member exists', async () => {
      mockRedisClient.sismember.mockResolvedValue(1);

      const result = await service.sismember('set-key', 'member');

      expect(result).toBe(1);
    });

    it('should return 0 when member does not exist', async () => {
      mockRedisClient.sismember.mockResolvedValue(0);

      const result = await service.sismember('set-key', 'non-existent');

      expect(result).toBe(0);
    });
  });

  describe('srem', () => {
    it('should remove members from set', async () => {
      mockRedisClient.srem.mockResolvedValue(1);

      const result = await service.srem('set-key', 'member');

      expect(result).toBe(1);
    });

    it('should remove multiple members', async () => {
      mockRedisClient.srem.mockResolvedValue(2);

      const result = await service.srem('set-key', 'member1', 'member2');

      expect(result).toBe(2);
    });

    it('should return 0 when members do not exist', async () => {
      mockRedisClient.srem.mockResolvedValue(0);

      const result = await service.srem('set-key', 'non-existent');

      expect(result).toBe(0);
    });
  });

  describe('zadd', () => {
    it('should add member with score', async () => {
      mockRedisClient.zadd.mockResolvedValue(1);

      const result = await service.zadd('sorted-set-key', 1, 'member');

      expect(result).toBe(1);
      expect(mockRedisClient.zadd).toHaveBeenCalledWith(
        'sorted-set-key',
        1,
        'member',
      );
    });

    it('should update score for existing member', async () => {
      mockRedisClient.zadd.mockResolvedValue(0);

      const result = await service.zadd('sorted-set-key', 5, 'existing-member');

      expect(result).toBe(0);
    });

    it('should handle negative scores', async () => {
      mockRedisClient.zadd.mockResolvedValue(1);

      const result = await service.zadd('sorted-set-key', -1, 'member');

      expect(result).toBe(1);
    });

    it('should handle float scores', async () => {
      mockRedisClient.zadd.mockResolvedValue(1);

      const result = await service.zadd('sorted-set-key', 1.5, 'member');

      expect(result).toBe(1);
    });
  });

  describe('zrange', () => {
    it('should get range of sorted set', async () => {
      mockRedisClient.zrange.mockResolvedValue(['a', 'b', 'c']);

      const result = await service.zrange('sorted-set-key', 0, -1);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should return empty array for non-existent set', async () => {
      mockRedisClient.zrange.mockResolvedValue([]);

      const result = await service.zrange('non-existent', 0, -1);

      expect(result).toEqual([]);
    });
  });

  describe('zscore', () => {
    it('should get score for member', async () => {
      mockRedisClient.zscore.mockResolvedValue('1.5');

      const result = await service.zscore('sorted-set-key', 'member');

      expect(result).toBe('1.5');
    });

    it('should return null for non-existent member', async () => {
      mockRedisClient.zscore.mockResolvedValue(null);

      const result = await service.zscore('sorted-set-key', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Error handling - Connection failures', () => {
    it('should handle connection timeout', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(service.get('test-key')).rejects.toThrow('ETIMEDOUT');
    });

    it('should handle connection refused', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.set('test-key', 'value')).rejects.toThrow(
        'ECONNREFUSED',
      );
    });

    it('should handle authentication failures', async () => {
      mockRedisClient.ping.mockRejectedValue(
        new Error('NOAUTH Authentication required'),
      );

      await expect(service.getClient().ping()).rejects.toThrow('NOAUTH');
    });
  });

  describe('Error handling - Timeout scenarios', () => {
    it('should handle operation timeout', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Operation timed out'));

      await expect(service.get('test-key')).rejects.toThrow(
        'Operation timed out',
      );
    });

    it('should handle slow operation', async () => {
      mockRedisClient.hgetall.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100),
          ),
      );

      await expect(service.hgetall('test-key')).rejects.toThrow('Timeout');
    });
  });

  describe('Error handling - Invalid key types', () => {
    it('should handle wrong type for string operations', async () => {
      mockRedisClient.get.mockRejectedValue(
        new Error(
          'ERR WRONGTYPE Operation against a key holding the wrong kind of value',
        ),
      );

      await expect(service.get('hash-key')).rejects.toThrow('WRONGTYPE');
    });

    it('should handle wrong type for list operations', async () => {
      mockRedisClient.lpush.mockRejectedValue(
        new Error(
          'ERR WRONGTYPE Operation against a key holding the wrong kind of value',
        ),
      );

      await expect(service.lpush('string-key', 'value')).rejects.toThrow(
        'WRONGTYPE',
      );
    });

    it('should handle wrong type for set operations', async () => {
      mockRedisClient.sadd.mockRejectedValue(
        new Error(
          'ERR WRONGTYPE Operation against a key holding the wrong kind of value',
        ),
      );

      await expect(service.sadd('string-key', 'member')).rejects.toThrow(
        'WRONGTYPE',
      );
    });
  });

  describe('Error handling - Serialization errors', () => {
    it('should handle invalid value for operations', async () => {
      mockRedisClient.set.mockRejectedValue(
        new Error('ERR ERR wrong number of arguments for set command'),
      );

      await expect(service.set('key')).rejects.toThrow();
    });
  });

  describe('Edge cases - Empty values', () => {
    it('should handle empty string value', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue('');

      await service.set('key', '');
      const result = await service.get('key');

      expect(result).toBe('');
    });

    it('should handle empty array for lrange', async () => {
      mockRedisClient.lrange.mockResolvedValue([]);

      const result = await service.lrange('empty-list', 0, -1);

      expect(result).toEqual([]);
    });

    it('should handle empty object for hgetall', async () => {
      mockRedisClient.hgetall.mockResolvedValue({});

      const result = await service.hgetall('empty-hash');

      expect(result).toEqual({});
    });
  });

  describe('Edge cases - Expire timing', () => {
    it('should handle immediate expiration check', async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);

      const existsBefore = await service.exists('test-key');
      await service.expire('test-key', 1);

      expect(existsBefore).toBe(true);
    });

    it('should handle TTL of 1 second', async () => {
      mockRedisClient.ttl.mockResolvedValue(1);

      const result = await service.ttl('test-key');

      expect(result).toBe(1);
    });

    it('should handle very long TTL', async () => {
      mockRedisClient.ttl.mockResolvedValue(86400 * 30);

      const result = await service.ttl('test-key');

      expect(result).toBe(86400 * 30);
    });
  });

  describe('Edge cases - Concurrent operations', () => {
    it('should handle concurrent reads', async () => {
      mockRedisClient.get.mockResolvedValue('value');

      const results = await Promise.all([
        service.get('key'),
        service.get('key'),
        service.get('key'),
      ]);

      expect(results).toEqual(['value', 'value', 'value']);
    });

    it('should handle concurrent writes', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await Promise.all([
        service.set('key1', 'value1'),
        service.set('key2', 'value2'),
        service.set('key3', 'value3'),
      ]);

      expect(mockRedisClient.set).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent increments', async () => {
      mockRedisClient.incr.mockResolvedValue(1);

      await Promise.all([
        service.incr('counter'),
        service.incr('counter'),
        service.incr('counter'),
      ]);

      expect(mockRedisClient.incr).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge cases - Large values', () => {
    it('should handle large string value', async () => {
      const largeValue = 'x'.repeat(100000);
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue(largeValue);

      await service.set('key', largeValue);
      const result = await service.get('key');

      expect(result?.length).toBe(100000);
    });

    it('should handle large list', async () => {
      const largeArray = Array(1000).fill('item');
      mockRedisClient.lrange.mockResolvedValue(largeArray);

      const result = await service.lrange('large-list', 0, -1);

      expect(result.length).toBe(1000);
    });

    it('should handle large hash', async () => {
      const largeHash: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeHash[`field${i}`] = `value${i}`;
      }
      mockRedisClient.hgetall.mockResolvedValue(largeHash);

      const result = await service.hgetall('large-hash');

      expect(Object.keys(result).length).toBe(100);
    });

    it('should handle large set', async () => {
      const largeSet = Array(1000)
        .fill(0)
        .map((_, i) => `member${i}`);
      mockRedisClient.smembers.mockResolvedValue(largeSet);

      const result = await service.smembers('large-set');

      expect(result.length).toBe(1000);
    });
  });

  describe('Edge cases - Special characters', () => {
    it('should handle special characters in keys', async () => {
      mockRedisClient.get.mockResolvedValue('value');

      const result = await service.get('key:with:special:chars');

      expect(result).toBe('value');
    });

    it('should handle unicode characters in values', async () => {
      const unicodeValue = 'Hello 世界 🌍 émoji';
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue(unicodeValue);

      await service.set('key', unicodeValue);
      const result = await service.get('key');

      expect(result).toBe(unicodeValue);
    });

    it('should handle binary data in values', async () => {
      const binaryValue = Buffer.from([0x00, 0x01, 0x02, 0xff]).toString(
        'binary',
      );
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue(binaryValue);

      await service.set('key', binaryValue);
      const result = await service.get('key');

      expect(result).toBe(binaryValue);
    });
  });

  describe('Edge cases - Boundary values', () => {
    it('should handle max integer for incr', async () => {
      mockRedisClient.incr.mockResolvedValue(Number.MAX_SAFE_INTEGER);

      const result = await service.incr('counter');

      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative increments', async () => {
      mockRedisClient.decr.mockResolvedValue(-100);

      const result = await service.decr('counter');

      expect(result).toBe(-100);
    });

    it('should handle float scores in sorted sets', async () => {
      mockRedisClient.zadd.mockResolvedValue(1);
      mockRedisClient.zscore.mockResolvedValue('0.5');

      await service.zadd('set', 0.5, 'member');
      const result = await service.zscore('set', 'member');

      expect(result).toBe('0.5');
    });
  });
});
