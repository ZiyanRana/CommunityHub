import app from './src/app.js';
import { PORT, NODE_ENV } from './src/config/env.js';
import connectDB from './src/database/mongodb.js';

app.listen(PORT, async () => {
    console.log(`Server is running in ${NODE_ENV} mode port http://localhost:${PORT}`);
    await connectDB();
});