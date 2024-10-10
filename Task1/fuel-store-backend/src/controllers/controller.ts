import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import moment from 'moment';
import { extractDataFromExcel, filterTransactionsByTime, validateExcelFileStructure } from '../utils/utils'; // Import hàm validateExcelFileStructure
import fs from 'fs';

// Cấu hình thư mục lưu trữ file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploaded_files/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

// Kiểm tra file chỉ cho phép định dạng .xlsx
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (path.extname(file.originalname) !== '.xlsx') {
    return cb(new Error('Only .xlsx files are allowed.'));
  }
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Hàm upload file
export const uploadFile = upload.single('file');

// Hàm xử lý lỗi Multer
export const handleMulterError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).send('Multer Error: ' + err.message);
  } else if (err) {
    res.status(400).send('Error: ' + err.message);
  } else {
    next();
  }
};

// Xử lý upload file
export const handleUploadFile = (req: Request, res: Response): void => {
  if (!req.file || !req.file.path) {
    res.status(400).send('File upload failed. Please upload a .xlsx file.');
    return;
  }

  try {
    // Kiểm tra cấu trúc file Excel (các cột "Giờ" và "Thành tiền" có tồn tại không)
    const isFileStructureValid = validateExcelFileStructure(req.file.path);
    if (!isFileStructureValid) {
      res.status(400).send('Invalid file structure. The file must contain "Giờ" and "Thành tiền (VNĐ)" columns.');
      return;
    }
  } catch (error) {
    res.status(400).send('Error reading file. The file might be corrupted or in an invalid format.');
    return;
  }

  res.status(200).send('File uploaded successfully: ' + req.file.path);
};

// Xử lý truy vấn dữ liệu
export const handleQuery = (req: Request, res: Response): void => {
  const { start_time, end_time } = req.query;

  // Kiểm tra các tham số truy vấn
  if (!start_time || !end_time) {
    res.status(400).send('Missing start_time or end_time query parameter.');
    return;
  }

  // Kiểm tra định dạng thời gian "HH:mm:ss" bằng moment
  if (!moment(start_time as string, 'HH:mm:ss', true).isValid() || !moment(end_time as string, 'HH:mm:ss', true).isValid()) {
    res.status(400).send('Invalid time format. Please use HH:mm:ss format.');
    return;
  }

  // Kiểm tra logic start_time < end_time
  if (moment(start_time as string, 'HH:mm:ss').isSameOrAfter(moment(end_time as string, 'HH:mm:ss'))) {
    res.status(400).send('start_time must be less than end_time.');
    return;
  }

  try {
    // Lấy file gần nhất từ thư mục uploaded_files
    const latestFile = getLatestUploadedFile();
    if (!latestFile) {
      res.status(404).send('No uploaded file found.');
      return;
    }

    // Đọc dữ liệu từ file Excel
    const transactions = extractDataFromExcel(latestFile);

    // Lọc dữ liệu theo khoảng thời gian
    const filteredTransactions = filterTransactionsByTime(transactions, start_time as string, end_time as string);

    // Tính tổng Thành tiền
    const totalAmount = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);

    res.status(200).send({ totalAmount });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send('Error processing request: ' + error.message);
    } else {
      res.status(500).send('An unknown error occurred.');
    }
  }
};

// Hàm lấy file gần nhất trong thư mục uploaded_files
const getLatestUploadedFile = (): string | null => {
  const directoryPath = path.join(__dirname, '../../uploaded_files');
  const files = fs.readdirSync(directoryPath);

  if (files.length === 0) return null;

  const latestFile = files
    .map((file) => ({ file, mtime: fs.statSync(path.join(directoryPath, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].file;

  return path.join(directoryPath, latestFile);
};
