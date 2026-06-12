import { Router } from 'express';
import authRouter from './auth';
import usersRouter from './users';
import groupsRouter from './groups';
import transactionsRouter from './transactions';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/groups', groupsRouter);
router.use('/transactions', transactionsRouter);

export default router;
