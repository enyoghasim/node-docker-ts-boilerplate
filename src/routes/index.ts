import { Router } from 'express';

const router = (): Router => {
  const appRouter = Router();

  appRouter.get('/', (req, res) => {
    res.send('Hello World');
  });

  return appRouter;
};

export default router;
