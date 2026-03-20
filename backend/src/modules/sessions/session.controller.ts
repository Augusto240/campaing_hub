import { Response, NextFunction } from 'express';
import { SessionService } from './session.service';
import { asyncHandler } from '../../utils/error-handler';
import { success } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { validate } from '../../utils/validation';
import {
  campaignIdParamsSchema,
  createSessionSchema,
  sessionIdParamsSchema,
  updateSessionSchema,
} from './session.validation';

const sessionService = new SessionService();

export const createSession = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId, date, summary, xpAwarded } = validate(createSessionSchema, req.body);

    const session = await sessionService.createSession(
      req.user!.id,
      campaignId,
      date,
      summary,
      xpAwarded ?? 0
    );

    res.status(201).json(success(session, 'Session created successfully'));
  }
);

export const getSessions = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { campaignId } = validate(campaignIdParamsSchema, req.params);

    const sessions = await sessionService.getSessionsByCampaign(campaignId);

    res.json(success(sessions, 'Sessions retrieved successfully'));
  }
);

export const getSessionById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { sessionId } = validate(sessionIdParamsSchema, req.params);

    const session = await sessionService.getSessionById(sessionId);

    res.json(success(session, 'Session retrieved successfully'));
  }
);

export const updateSession = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { sessionId } = validate(sessionIdParamsSchema, req.params);
    const { date, summary, xpAwarded } = validate(updateSessionSchema, req.body);

    const session = await sessionService.updateSession(sessionId, {
      date,
      summary,
      xpAwarded,
    });

    res.json(success(session, 'Session updated successfully'));
  }
);

export const deleteSession = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { sessionId } = validate(sessionIdParamsSchema, req.params);

    await sessionService.deleteSession(sessionId);

    res.json(success(null, 'Session deleted successfully'));
  }
);

export const generateSessionReport = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { sessionId } = validate(sessionIdParamsSchema, req.params);

    const pdfBuffer = await sessionService.generateReport(sessionId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}-report.pdf"`);
    res.send(pdfBuffer);
  }
);
