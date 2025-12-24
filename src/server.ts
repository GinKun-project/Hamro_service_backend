import app from './index.js';
import { connectDB, config } from './config/index.js';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

