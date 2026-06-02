import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import postRouter from './routes/post.routes.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/api/v1/posts', postRouter);

export default app;