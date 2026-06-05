import app from './src/app.js';
import { PORT, NODE_ENV } from './src/config/env.js';
import connectDB from './src/database/mongodb.js';

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running in ${NODE_ENV} mode on port http://localhost:${PORT}`);
    });
}

startServer();