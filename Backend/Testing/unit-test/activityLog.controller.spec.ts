import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getMyActivityLogs, getUsersActivityLogsByDate } from '../../API/controllers/activityLog.controller';
import { getMongoCollection } from '../../API/utils/mongo';

const mockFind = jest.fn();
const mockSort = jest.fn();
const mockToArray = jest.fn<() => Promise<Array<{ code?: number; message?: string }>>>();

jest.mock('../../API/utils/mongo', () => ({
  getMongoCollection: jest.fn(),
}));

describe('Activity Log Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ toArray: mockToArray });
  });

  describe('getMyActivityLogs', () => {
    it('throws when unauthorized', async () => {
      await expect(getMyActivityLogs({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns logs for current user', async () => {
      (getMongoCollection as any).mockResolvedValue({
        find: mockFind,
      });
      mockToArray.mockResolvedValue([{ code: 200, message: 'Ok' }]);

      const result = await getMyActivityLogs(
        { auth: { id: 'user-1', role: 'staff' } } as any,
        {} as Response
      );

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', createdAt: expect.any(Object) })
      );
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual({
        code: 200,
        message: 'Activity logs fetched successfully',
        data: { logs: [{ code: 200, message: 'Ok' }] },
      });
    });
  });

  describe('getUsersActivityLogsByDate', () => {
    it('throws when unauthorized', async () => {
      await expect(getUsersActivityLogsByDate({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when date is missing', async () => {
      const req = { auth: { id: 'user-1', role: 'admin' }, body: {} } as any;

      await expect(getUsersActivityLogsByDate(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'date is required',
      });
    });

    it('throws when date is invalid', async () => {
      const req = { auth: { id: 'user-1', role: 'admin' }, body: { date: 'invalid' } } as any;

      await expect(getUsersActivityLogsByDate(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'date must be a valid date',
      });
    });

    it('returns logs for provided date', async () => {
      (getMongoCollection as any).mockResolvedValue({
        find: mockFind,
      });
      mockToArray.mockResolvedValue([{ message: 'Activity' }]);

      const result = await getUsersActivityLogsByDate(
        { auth: { id: 'user-1', role: 'admin' }, body: { date: '2026-05-05' } } as any,
        {} as Response
      );

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ createdAt: expect.any(Object) })
      );
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual({
        code: 200,
        message: 'Activity logs fetched successfully',
        data: { logs: [{ message: 'Activity' }] },
      });
    });
  });
});
