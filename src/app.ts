import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import AppRouter from "../src/routes/app.route";
import globalErrorHandler from './controllers/error.controller';

dotenv.config();


const app: Application = express();

// Middleware
app.use(express.json());

// Use CORS middleware
  /* cors is used to allow cross origin requests */
app.use(cors({
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  origin: '*',
  credentials: true,
}));

// Use the  routes
app.use("/api/v1", AppRouter);


app.use(globalErrorHandler)

app.get("/", (req: Request, res: Response) => {
  res.status(200).send({
      success: true,
      data: `Server Live${process.env.NODE_ENV === "production" ? "" : ` - ${process.env.NODE_ENV}`}`,
  });
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});


// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
});

export default app;