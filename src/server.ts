import { createServer } from 'http';
import app from './app';
import connectToDatabase from '../src/config/connect';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;


const startServer = async () => {
  try {
    await connectToDatabase();

    const corsOptions = {
      origin: '*',
      credentials: true,
      optionSuccessStatus: 200,
    };

    const httpServer = createServer(app);

    const server = httpServer.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.log('UNHANDLED REJECTION! ! 💥 Shutting down...');
      console.error(err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Gracefully handle SIGTERM signal
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });
  } catch (error) {
    console.log('Error starting server:', error);
    process.exit(1);
  }
};

startServer();