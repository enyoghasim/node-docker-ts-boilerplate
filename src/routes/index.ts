import { Router } from 'express';

const router = (): Router => {
  const appRouter = Router();

  appRouter.get('/', (req, res) => {
    res.send('API is running...').end();
  });

  return appRouter;
};

export default router;
