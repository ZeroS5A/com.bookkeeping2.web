/**
 * 账单解析工具 - 独立文件
 * 用于解析微信支付导出的CSV/Excel账单文件
 *
 * 支持格式：
 * - CSV 格式 (.csv)
 * - Excel 格式 (.xlsx, .xls)
 *
 * 微信账单导出格式说明：
 * - 文件头部包含几行元信息
 * - 表头行包含：交易时间、收/支、金额、商品、交易对方、备注等字段
 * - 数据行按交易时间倒序排列
 */

import { CATEGORIES } from './constants.js';

/**
 * 加载 SheetJS 库 (用于解析 Excel)
 * @returns {Promise} XLSX 库对象
 */
export const loadXLSXLibrary = () => {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * 解析日期字符串
 * 微信账单日期格式："2024-01-15 10:30:00" 或 "2024/01/15 10:30:00"
 * Excel中可能是数字序列号（从1900-01-01开始的天数）
 * @param {string|number} dateStr - 日期字符串或Excel序列号
 * @returns {Date} 解析后的日期对象
 */
export const parseDateString = (dateStr) => {
  if (dateStr === null || dateStr === undefined || dateStr === '') {
    return new Date(); // 返回当前时间作为后备
  }

  // 处理XLSX直接返回的Date对象
  if (dateStr instanceof Date) {
    if (!isNaN(dateStr.getTime())) {
      return dateStr;
    }
    return new Date();
  }

  // 处理Excel数字序列号（从1900-01-01开始的天数）
  // Excel日期序列号：数字类型，可能是浮点数包含时间
  if (typeof dateStr === 'number') {
    // Excel的1899-12-30对应序列号0
    const excelEpoch = new Date(1899, 11, 30);
    // 序列号可能是浮点数，整数部分是天数，小数部分是当天的时间比例
    const days = Math.floor(dateStr);
    const fraction = dateStr - days;
    const milliseconds = Math.round(fraction * 24 * 60 * 60 * 1000);
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000 + milliseconds);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 处理字符串格式
  if (typeof dateStr !== 'string') {
    return new Date();
  }

  // 微信账单日期格式：YYYY-MM-DD HH:mm:ss 或 YYYY/MM/DD HH:mm:ss
  // 替换斜杠为横杠，统一格式
  const normalized = dateStr.replace(/\//g, '-');

  // 处理可能的时间格式问题
  // 尝试直接解析
  let date = new Date(normalized);

  // 如果解析失败或返回Invalid Date，尝试手动解析
  if (isNaN(date.getTime())) {
    // 手动解析格式：2024-01-15 10:30:00
    const match = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2}):?(\d{1,2})?/);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      date = new Date(
        parseInt(year),
        parseInt(month) - 1, // 月份从0开始
        parseInt(day),
        parseInt(hour) || 0,
        parseInt(minute) || 0,
        parseInt(second) || 0
      );
    }
  }

  // 如果仍然无效，返回当前时间
  if (isNaN(date.getTime())) {
    console.warn('日期解析失败:', dateStr);
    return new Date();
  }

  return date;
};

/**
 * 根据交易类型、商品名称、交易对方自动猜测分类ID
 * @param {string} type - 交易类型 'expense' | 'income'
 * @param {string} productName - 商品名称
 * @param {string} counterparty - 交易对方
 * @returns {string} 分类ID
 */
export const guessCategory = (type, productName, counterparty) => {
  const text = (productName + counterparty).toLowerCase();
  const catList = type === 'expense' ? CATEGORIES.expense : CATEGORIES.income;

  for (const cat of catList) {
    if (cat.keywords && cat.keywords.some(k => text.includes(k.toLowerCase()))) {
      return cat.id;
    }
  }
  return type === 'expense' ? 'other' : 'other_income';
};

/**
 * 根据文件类型解析账单数据
 * @param {File} file - 上传的文件对象
 * @returns {Promise<Array>} 解析后的账单记录数组
 */
export const parseBillFile = async (file) => {
  const isCSV = file.name.toLowerCase().endsWith('.csv');

  if (isCSV) {
    const text = await file.text();
    return parseWeChatCSV(text);
  } else {
    // Excel 格式
    const XLSX = await loadXLSXLibrary();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return parseWeChatArrayData(jsonData);
  }
};

/**
 * 解析微信CSV格式账单
 * 微信导出CSV格式特点：
 * - 前几行是账户信息元数据
 * - 表头行包含"交易时间"和"金额"字段
 * - 每行数据用逗号分隔，字段值可能用引号包裹
 *
 * @param {string} text - CSV文件文本内容
 * @returns {Array} 账单记录数组
 */
export const parseWeChatCSV = (text) => {
  const lines = text.split(/\r\n|\n/);

  // 找到包含"交易时间"和"金额"的表头行
  const headerIndex = lines.findIndex(line =>
    line.includes('交易时间') && line.includes('金额')
  );

  if (headerIndex === -1) return [];

  // 解析表头
  const headers = lines[headerIndex].split(',').map(h => h.trim());
  const result = [];

  /**
   * 辅助函数：解析CSV行，提取每个单元格的值
   * 处理引号包裹的字段值
   * @param {string} line - CSV行
   * @returns {Array} 单元格数组
   */
  const getCells = (line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.replace(/^"|"$/g, '').trim());
    return cells;
  };

  // 找到各列索引
  const idxTime = headers.findIndex(h => h.includes('交易时间'));
  const idxType = headers.findIndex(h => h.includes('收/支'));
  const idxAmount = headers.findIndex(h => h.includes('金额'));
  const idxProduct = headers.findIndex(h => h.includes('商品'));
  const idxCounterparty = headers.findIndex(h => h.includes('交易对方'));
  const idxNote = headers.findIndex(h => h.includes('备注'));

  // 逐行解析数据
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = getCells(line);
    if (cells.length < headers.length) continue;

    // 获取字段值
    const typeStr = cells[idxType]?.trim();
    // 只处理"收入"和"支出"类型的记录
    if (typeStr !== '收入' && typeStr !== '支出') continue;

    const amountStr = cells[idxAmount]?.replace('¥', '').trim();
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;

    const type = typeStr === '收入' ? 'income' : 'expense';
    const product = cells[idxProduct]?.trim() || '';
    const counterparty = cells[idxCounterparty]?.trim() || '';
    const note = cells[idxNote]?.trim() || '';
    const dateRaw = cells[idxTime]?.trim();

    // 使用专门的日期解析函数
    const date = parseDateString(dateRaw);
    const categoryId = guessCategory(type, product, counterparty);

    result.push({
      type,
      amount,
      categoryId,
      date: date.toISOString(),
      note: product || note || '导入记录',
      counterparty
    });
  }

  return result;
};

/**
 * 解析微信Excel格式账单
 * 当CSV文件被XLSX库读取后，转换为数组格式的数据
 *
 * @param {Array} rows - Excel转换后的数组（每行是一个数组）
 * @returns {Array} 账单记录数组
 */
export const parseWeChatArrayData = (rows) => {
  // 找到表头行
  const headerRowIndex = rows.findIndex(row =>
    row.some(cell => typeof cell === 'string' && cell.includes('交易时间'))
  );

  if (headerRowIndex === -1) return [];

  const headers = rows[headerRowIndex];
  const idxTime = headers.findIndex(h => h.includes('交易时间'));
  const idxType = headers.findIndex(h => h.includes('收/支'));
  const idxAmount = headers.findIndex(h => h.includes('金额'));
  const idxProduct = headers.findIndex(h => h.includes('商品'));
  const idxCounterparty = headers.findIndex(h => h.includes('交易对方'));

  const result = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const typeStr = row[idxType];
    if (typeStr !== '收入' && typeStr !== '支出') continue;

    // 处理金额（可能是字符串或数字）
    let amount = row[idxAmount];
    if (typeof amount === 'string') {
      amount = parseFloat(amount.replace('¥', ''));
    }
    if (isNaN(amount)) continue;

    const type = typeStr === '收入' ? 'income' : 'expense';
    const product = row[idxProduct] || '';
    const counterparty = row[idxCounterparty] || '';

    // 使用专门的日期解析函数
    let dateStr = row[idxTime];
    const date = parseDateString(dateStr);

    const categoryId = guessCategory(type, product, counterparty);

    result.push({
      type,
      amount,
      categoryId,
      date: date.toISOString(),
      note: product || '',
      counterparty
    });
  }

  return result;
};

export default {
  loadXLSXLibrary,
  parseDateString,
  guessCategory,
  parseBillFile,
  parseWeChatCSV,
  parseWeChatArrayData
};