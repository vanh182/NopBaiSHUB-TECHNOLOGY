import express from 'express';
import { uploadFile, handleUploadFile, handleQuery, handleMulterError } from './controllers/controller';

const app = express();
const PORT = 3001;

// Route upload file
app.post('/api/upload', uploadFile, handleUploadFile, handleMulterError);

// Route truy vấn dữ liệu
app.get('/api/query', handleQuery);

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
