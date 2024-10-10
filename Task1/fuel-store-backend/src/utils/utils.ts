import xlsx from 'xlsx';
import moment from 'moment';

interface Transaction {
  time: string;
  amount: number;
}

// Hàm trích xuất dữ liệu từ file Excel
export const extractDataFromExcel = (filePath: string): Transaction[] => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Chuyển đổi dữ liệu từ sheet sang JSON với kiểu dữ liệu là mảng hai chiều
    const data: (string | number)[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

    // Kiểm tra xem file có chứa các cột cần thiết không
    if (data.length < 2) {
      return []; // File quá ít dòng, trả về mảng rỗng
    }

    // Tìm dòng tiêu đề (dòng đầu tiên chứa cột "Giờ" và "Thành tiền (VNĐ)")
    let headerRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        if (row.includes('Giờ') && row.includes('Thành tiền (VNĐ)')) {
          headerRowIndex = i;
          break; // Tìm thấy dòng tiêu đề
        }
      }
    }

    if (headerRowIndex === -1) {
      return []; // Không tìm thấy tiêu đề hợp lệ
    }

    // Lấy dòng tiêu đề
    const headers = data[headerRowIndex];

    // Tìm vị trí cột "Giờ" và "Thành tiền (VNĐ)"
    const timeColumnIndex = headers.findIndex(header => header === 'Giờ');
    const amountColumnIndex = headers.findIndex(header => header === 'Thành tiền (VNĐ)');

    // Kiểm tra xem cả hai cột có tồn tại không
    if (timeColumnIndex === -1 || amountColumnIndex === -1) {
      return []; // Nếu không có cột nào thì trả về mảng rỗng
    }

    // Trích xuất dữ liệu từ dòng sau dòng tiêu đề
    const transactions: Transaction[] = data.slice(headerRowIndex + 1) // Bỏ qua các dòng trước dòng tiêu đề
      .map((row) => {
        if (Array.isArray(row) && row.length > Math.max(timeColumnIndex, amountColumnIndex)) { // Kiểm tra đủ cột
          const time = row[timeColumnIndex] as string; // Lấy giá trị từ cột "Giờ"
          const amount = parseFloat(row[amountColumnIndex] as string); // Lấy giá trị từ cột "Thành tiền"
          if (!isNaN(amount)) {
            return { time, amount };
          }
        }
        return null;
      })
      .filter((txn): txn is Transaction => txn !== null); // Lọc bỏ các hàng không hợp lệ

    return transactions;
  } catch (error) {
    throw new Error('Error reading the Excel file. The file might be corrupted or in an invalid format.');
  }
};

// Hàm kiểm tra cấu trúc file Excel 
export const validateExcelFileStructure = (filePath: string): boolean => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Chuyển đổi dữ liệu từ sheet sang JSON với kiểu dữ liệu là mảng hai chiều
    const data: (string | number)[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

    // Kiểm tra xem file có chứa các cột cần thiết không
    if (data.length < 2) { // Kiểm tra số lượng dòng
      return false; // File quá ít dòng
    }

    // Tìm dòng tiêu đề (dòng đầu tiên chứa cột "Giờ" và "Thành tiền (VNĐ)")
    let headerRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        if (row.includes('Giờ') && row.includes('Thành tiền (VNĐ)')) {
          headerRowIndex = i;
          break; // Tìm thấy dòng tiêu đề
        }
      }
    }

    if (headerRowIndex === -1) {
      return false; // Không tìm thấy tiêu đề hợp lệ
    }

    // Lấy dòng tiêu đề
    const headers = data[headerRowIndex];

    // Kiểm tra xem cột "Giờ" và "Thành tiền (VNĐ)" có tồn tại trong tiêu đề hay không
    const hasTimeColumn = headers.includes('Giờ');
    const hasAmountColumn = headers.includes('Thành tiền (VNĐ)');

    return hasTimeColumn && hasAmountColumn; // Trả về true nếu cả hai cột đều tồn tại
  } catch (error: any) {
    throw new Error('Invalid Excel file format or structure: ' + (error as Error).message);
  }
};

// Hàm lọc giao dịch theo khoảng thời gian "HH:mm:ss"
export const filterTransactionsByTime = (transactions: Transaction[], startTime: string, endTime: string): Transaction[] => {
  const start = moment(startTime, 'HH:mm:ss');
  const end = moment(endTime, 'HH:mm:ss');

  return transactions.filter((txn) => {
    const txnTime = moment(txn.time, 'HH:mm:ss');
    return txnTime.isBetween(start, end, null, '[]'); // Bao gồm startTime và endTime
  });
};
