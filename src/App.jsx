import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  // 核心图标
  Wallet, Plus, PieChart, List, ArrowUpCircle, ArrowDownCircle,
  // 现有分类图标
  Utensils, Bus, ShoppingBag, Home, Gamepad2, Coffee, Heart,
  GraduationCap, Scissors, Smartphone, Plane, Cat, MoreHorizontal,
  // UI 交互图标
  ChevronLeft, ChevronRight, X, Trash2, Upload, FileText,
  Loader2, CheckCircle2, Clock, Tag, Store, Pencil, Save,
  TrendingUp, Settings, Server, LogOut, User, Lock, Database,
  AlertCircle, PlayCircle, Briefcase, Gift, Gamepad
} from 'lucide-react';

// 导入工具模块
import { CATEGORIES } from './tools/constants.js';
import {
  parseBillFile,
  loadXLSXLibrary,
  parseDateString,
  guessCategory
} from './tools/parser.js';

// --- 图标回退映射 (修复图标缺失导致的崩溃) ---
const Shirt = ShoppingBag;
const Car = Bus;
const Wine = Coffee;
const Dumbbell = Heart;
const BookOpen = List;
const Baby = Heart;
const FileSpreadsheet = FileText; // 修复: 补充缺失的 FileSpreadsheet 定义
const Loader = Loader2; // 兼容性映射
const CheckCircle = CheckCircle2; // 兼容性映射

const formatDateHeader = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;
  if (isToday) return `今天 · ${monthDay}`;
  return monthDay;
};

// --- 模拟后端逻辑 (用于演示模式) ---
const mockDB = {
  users: [{ id: 1, username: 'demo', password: '123' }],
  transactions: [
    { id: 101, userId: 1, type: 'expense', amount: 32.50, categoryId: 'food', date: new Date().toISOString(), note: '演示数据:午餐' },
    { id: 102, userId: 1, type: 'income', amount: 5000.00, categoryId: 'salary', date: new Date().toISOString(), note: '演示数据:工资' },
  ]
};

const mockApiCall = (endpoint, method, body) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`[MockServer] ${method} ${endpoint}`, body);
      try {
        if (endpoint === '/auth/login') {
          const u = mockDB.users.find(u => u.username === body.username && u.password === body.password);
          if (u) resolve({ message: '登录成功', user: { id: u.id, username: u.username } });
          else reject(new Error('用户名或密码错误 (演示账号: demo/123)'));
        } 
        else if (endpoint === '/auth/register') {
          if (mockDB.users.find(u => u.username === body.username)) reject(new Error('用户名已存在'));
          const newUser = { id: Date.now(), username: body.username, password: body.password };
          mockDB.users.push(newUser);
          resolve({ message: '注册成功', user: { id: newUser.id, username: newUser.username } });
        }
        else if (endpoint.startsWith('/transactions')) {
          if (method === 'GET') {
            const urlParams = new URLSearchParams(endpoint.split('?')[1]);
            const userId = parseInt(urlParams.get('userId'));
            resolve(mockDB.transactions.filter(t => t.userId === userId));
          }
          else if (method === 'POST') {
            const newTx = { ...body, id: Date.now() + Math.random() };
            mockDB.transactions.push(newTx);
            resolve(newTx);
          }
          else if (method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const idx = mockDB.transactions.findIndex(t => t.id === id);
            if (idx > -1) {
               mockDB.transactions[idx] = { ...mockDB.transactions[idx], ...body };
               resolve({ success: true });
            } else reject(new Error('记录不存在'));
          }
          else if (method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            mockDB.transactions = mockDB.transactions.filter(t => t.id !== id);
            resolve({ success: true });
          }
        }
      } catch (e) {
        reject(e);
      }
    }, 600); 
  });
};

// --- 图表组件 ---
const SimplePieChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, item) => acc + item.amount, 0);
  let accumulatedAngle = 0;

  const paths = data.map((item, index) => {
    const percentage = item.amount / total;
    const angle = percentage * 360;

    if (percentage >= 0.999) {
       return (
         <circle key={item.id} cx="50" cy="50" r="40" fill="currentColor" className={`${item.color.split(' ')[1]} pie-slice`} style={{ animationDelay: `${index * 80}ms` }} />
       );
    }

    const x1 = 50 + 40 * Math.cos((Math.PI / 180) * (accumulatedAngle - 90));
    const y1 = 50 + 40 * Math.sin((Math.PI / 180) * (accumulatedAngle - 90));

    const x2 = 50 + 40 * Math.cos((Math.PI / 180) * (accumulatedAngle + angle - 90));
    const y2 = 50 + 40 * Math.sin((Math.PI / 180) * (accumulatedAngle + angle - 90));

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = `
      M 50 50
      L ${x1} ${y1}
      A 40 40 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `;

    accumulatedAngle += angle;

    return (
      <path
        key={item.id}
        d={pathData}
        className={`${item.color.split(' ')[1]} pie-slice hover:opacity-80 transition-opacity cursor-pointer`}
        style={{ animationDelay: `${index * 80}ms`, transformOrigin: '50px 50px' }}
        fill="currentColor"
        stroke="white"
        strokeWidth="1"
      />
    );
  });

  return (
    <div className="relative w-48 h-48 mx-auto">
       <svg viewBox="0 0 100 100" className="w-full h-full">
         {paths}
         <circle cx="50" cy="50" r="25" fill="white" />
       </svg>
       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pie-center-text">
          <span className="text-[10px] text-gray-400">总支出</span>
          <span className="text-sm font-bold text-gray-800">¥{total.toFixed(0)}</span>
       </div>
    </div>
  );
};

const MonthlyTrendChart = ({ transactions }) => {
    const scrollRef = useRef(null);

    const monthlyData = useMemo(() => {
        const data = {};
        const now = new Date();
        // 生成最近12个月的数据
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            data[key] = { 
                label: `${d.getMonth() + 1}月`, 
                amount: 0, 
                key 
            };
        }
        transactions.forEach(t => {
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (data[key]) data[key].amount += Number(t.amount);
        });
        return Object.values(data);
    }, [transactions]);

    // 自动滚动到最右侧
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [monthlyData]);

    const itemWidth = 60; // 每个月份的宽度
    const width = Math.max(monthlyData.length * itemWidth, 300);
    const height = 160; 
    const padding = 30; // 上部留白给文字
    const bottomPadding = 20; // 底部留白给月份
    const maxVal = Math.max(...monthlyData.map(d => d.amount), 100);

    const points = monthlyData.map((d, i) => {
        const x = i * itemWidth + (itemWidth / 2);
        const chartHeight = height - bottomPadding - padding;
        const y = (height - bottomPadding) - (d.amount / maxVal) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div ref={scrollRef} className="w-full overflow-x-auto hide-scrollbar scroll-smooth">
            <svg width={width} height={height} className="overflow-visible">
                {/* 网格线 */}
                <line x1="0" y1={height - bottomPadding} x2={width} y2={height - bottomPadding} stroke="#f3f4f6" strokeWidth="1" />
                
                {/* 折线 */}
                <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* 数据点和文字 */}
                {monthlyData.map((d, i) => {
                    const x = i * itemWidth + (itemWidth / 2);
                    const chartHeight = height - bottomPadding - padding;
                    const y = (height - bottomPadding) - (d.amount / maxVal) * chartHeight;
                    return (
                        <g key={d.key}>
                            <circle cx={x} cy={y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                            {d.amount > 0 && (
                                <text 
                                    x={x} 
                                    y={y - 12} 
                                    fontSize="10" 
                                    fill="#3b82f6" 
                                    textAnchor="middle" 
                                    fontWeight="bold"
                                >
                                    {d.amount >= 1000 ? (d.amount/1000).toFixed(1) + 'k' : Math.round(d.amount)}
                                </text>
                            )}
                            <text x={x} y={height - 5} fontSize="11" fill="#9ca3af" textAnchor="middle">{d.label}</text>
                        </g>
                    )
                })}
            </svg>
        </div>
    );
};

// --- 导入状态弹窗 (处理中 / 成功 / 失败) ---
function ImportStatusModal({ status, result, error, onClose }) {
  if (!status) return null;

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-6">
        <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-8 text-center animate-zoom-in">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">处理中</h3>
          <p className="text-sm text-gray-400">正在导入账单数据，请稍后...</p>
        </div>
      </div>
    );
  }

  const isSuccess = status === 'success';
  const iconBg = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-6">
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6 text-center animate-zoom-in">
        <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{isSuccess ? '导入完成' : '导入失败'}</h3>
        <p className="text-sm text-gray-500 mb-6">
          {isSuccess
            ? (result.skipped > 0
                ? <>成功 <span className="font-bold text-green-600">{result.inserted}</span> 条，跳过重复 <span className="font-bold text-orange-500">{result.skipped}</span> 条</>
                : <>成功导入 <span className="font-bold text-green-600">{result.inserted}</span> / {result.total} 条</>)
            : error}
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
        >
          确定
        </button>
      </div>
    </div>
  );
}

// --- 通用确认弹窗 ---
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-6">
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6 text-center animate-zoom-in">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            取消
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 主应用组件 ---
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 导入状态弹窗
  const [importStatus, setImportStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  
  const [appMode, setAppMode] = useState('api'); 
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('api_url') || 'http://localhost:3000/api');

  const saveApiConfig = (url) => {
    const cleanUrl = url.replace(/\/$/, '');
    setApiUrl(cleanUrl);
    localStorage.setItem('api_url', cleanUrl);
  };

  const request = useCallback(async (endpoint, options = {}) => {
    if (appMode === 'mock') {
        const method = options.method || 'GET';
        const body = options.body ? JSON.parse(options.body) : null;
        return await mockApiCall(endpoint, method, body);
    } else {
        const res = await fetch(`${apiUrl}${endpoint}`, options);
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            throw new Error(errorBody.message || `请求失败 (${res.status})`);
        }
        return await res.json();
    }
  }, [appMode, apiUrl]);

  // 获取指定月份的用户账单
  const fetchTransactions = useCallback(async (userId, date = new Date()) => {
    setIsLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const data = await request(`/transactions?userId=${userId}&year=${year}&month=${month}`);

      // 更新账单状态：替换原有账单，而不是追加
      setTransactions(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (user && user.id) {
        fetchTransactions(user.id, new Date());
    }
  }, [user, fetchTransactions]);

  const handleAuth = async (type, username, password) => {
    setIsLoading(true);
    try {
      const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
      const data = await request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      setUser(data.user);
      localStorage.setItem('user_session', JSON.stringify(data.user)); 
      
      fetchTransactions(data.user.id);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (newTx) => {
    const tempId = Date.now();
    const txWithTempId = { ...newTx, id: tempId, userId: user.id };
    setTransactions([txWithTempId, ...transactions]);
    setIsAddModalOpen(false);

    try {
      const savedTx = await request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTx, userId: user.id })
      });
      setTransactions(prev => prev.map(t => t.id === tempId ? savedTx : t));
    } catch (err) {
      alert('保存失败: ' + err.message);
      setTransactions(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const handleBatchAddTransactions = async (newTxs) => {
    setIsImportModalOpen(false);
    if (newTxs.length === 0) return;

    setImportStatus('loading');
    setImportResult(null);
    setImportError('');

    try {
      const result = await request('/transactions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, transactions: newTxs })
      });

      setImportResult(result);
      setImportStatus('success');
      fetchTransactions(user.id);
    } catch (err) {
      setImportError(err.message);
      setImportStatus('error');
    }
  };

  const handleDelete = async (id) => {
    const originalData = [...transactions];
    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      await request(`/transactions/${id}`, { method: 'DELETE' });
    } catch (err) {
      alert(err.message);
      setTransactions(originalData);
    }
  };

  const handleUpdate = async (updatedTx) => {
    const originalData = [...transactions];
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));

    try {
      await request(`/transactions/${updatedTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx)
      });
    } catch (err) {
      alert(err.message);
      setTransactions(originalData);
    }
  };

  if (!user) {
    return (
      <LoginScreen 
        onAuth={handleAuth}
        apiUrl={apiUrl}
        onSaveApiConfig={saveApiConfig}
        isLoading={isLoading}
        onSwitchMode={(mode) => setAppMode(mode)}
        appMode={appMode}
      />
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 font-sans text-gray-800">
      <div className="w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col relative h-[100vh] sm:h-[90vh] sm:mt-[5vh] sm:rounded-[30px]">
        
        <header className="px-6 pt-8 pb-4 bg-white z-10 sticky top-0 flex justify-between items-center bg-white/80 backdrop-blur-md">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {activeTab === 'home' ? '我的账本' : '收支统计'}
            </h1>
            <div className="flex items-center gap-3">
              {appMode === 'mock' && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">演示模式</span>}
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors"
                title="导入账单"
              >
                <Upload size={16} />
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                <span className="text-xs font-bold text-blue-600">{user.username[0].toUpperCase()}</span>
              </button>
            </div>
        </header>

        {/* 两个页面始终挂载，通过 CSS 切换显示，保留各自的内部状态 */}
        <main className="flex-1 overflow-hidden relative">
          <div className={`h-full ${activeTab === 'home' ? '' : 'hidden'}`}>
            <HomeView transactions={transactions} onDelete={handleDelete} onUpdate={handleUpdate} fetchTransactions={fetchTransactions} user={user} />
          </div>
          <div data-stats-scroll className={`h-full overflow-y-auto hide-scrollbar pb-24 transition-opacity duration-200 ${activeTab === 'stats' ? '' : 'hidden'}`}>
             <StatsView transactions={transactions} onDelete={handleDelete} onUpdate={handleUpdate} fetchTransactions={fetchTransactions} user={user} request={request} />
          </div>
        </main>

        <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20 pb-8 sm:pb-4">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={List} label="明细" />
          <div className="-mt-8">
            <button onClick={() => setIsAddModalOpen(true)} className="w-16 h-16 bg-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white active:scale-95 transition-transform">
              <Plus size={32} />
            </button>
          </div>
          <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={PieChart} label="统计" />
        </div>

        {isAddModalOpen && <AddTransactionModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddTransaction} />}
        {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleBatchAddTransactions} />}
        {isSettingsOpen && (
            <SettingsModal
                user={user}
                onClose={() => setIsSettingsOpen(false)}
                onLogout={() => {
                    setUser(null);
                    setTransactions([]);
                    localStorage.removeItem('user_session');
                }}
            />
        )}
        <ImportStatusModal
            status={importStatus}
            result={importResult}
            error={importError}
            onClose={() => setImportStatus(null)}
        />
      </div>
    </div>
  );
}

// ... LoginScreen components ...
function LoginScreen({ onAuth, apiUrl, onSaveApiConfig, isLoading, onSwitchMode, appMode }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [errorMsg, setErrorMsg] = useState('');

  const isMixedContent = window.location.protocol === 'https:' && apiUrl.startsWith('http:');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if(!username || !password) return setErrorMsg("请输入用户名和密码");

    const result = await onAuth(mode, username, password);
    if (!result.success) {
        let msg = result.message;
        if (msg === 'Failed to fetch') {
            msg = '无法连接服务器。如果您的服务器是HTTP而此处是HTTPS，浏览器可能会拦截请求。建议尝试下方的"进入演示模式"。';
        }
        setErrorMsg(msg);
    }
  };

  const switchToMock = () => {
      onSwitchMode('mock');
      setUsername('demo');
      setPassword('123');
      setErrorMsg('');
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 font-sans text-gray-800">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col justify-center p-8 h-[100vh] sm:h-[90vh] sm:mt-[5vh] sm:rounded-[30px]">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">云端记账本</h1>
          <div className="flex justify-center gap-2 mt-2">
             <span className={`text-[10px] px-2 py-0.5 rounded-full border ${appMode === 'api' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 border-gray-100'}`}>
                {appMode === 'api' ? '• 真实后端模式' : '演示模式'}
             </span>
             {appMode === 'mock' && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">• 演示中</span>}
          </div>
        </div>

        {errorMsg && (
            <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                <span>{errorMsg}</span>
            </div>
        )}

        {appMode === 'api' && isMixedContent && !showConfig && (
            <div className="bg-yellow-50 text-yellow-700 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                <span>检测到混合内容风险：当前页面为 HTTPS，但接口为 HTTP。部分浏览器可能会拦截请求。</span>
            </div>
        )}

        {showConfig ? (
           <div className="bg-gray-50 p-6 rounded-2xl animate-fade-in">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Server size={18}/> 服务器配置</h3>
              <input 
                className="w-full p-3 rounded-xl border border-gray-200 mb-4 text-sm"
                value={tempApiUrl}
                onChange={e => setTempApiUrl(e.target.value)}
                placeholder="http://localhost:3000/api"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowConfig(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">取消</button>
                <button 
                    onClick={() => { 
                    if (!tempApiUrl.trim()) return alert("请输入有效的接口地址");
                    onSaveApiConfig(tempApiUrl); 
                    onSwitchMode('api'); 
                    setShowConfig(false); 
                    setErrorMsg('');
                    }} 
                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold"
                >
                    保存并使用
                </button>
              </div>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center px-4">
              <User size={18} className="text-gray-400 mr-3" />
              <input 
                className="bg-transparent outline-none w-full py-2"
                placeholder="用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center px-4">
              <Lock size={18} className="text-gray-400 mr-3" />
              <input 
                type="password"
                className="bg-transparent outline-none w-full py-2"
                placeholder="密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {appMode === 'api' ? (
                <button disabled={isLoading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center">
                {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? '连接服务器登录' : '注 册')}
                </button>
            ) : (
                <button disabled={isLoading} className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex justify-center">
                {isLoading ? <Loader2 className="animate-spin" /> : '进入演示模式 (无需服务器)'}
                </button>
            )}

            <div className="flex justify-between mt-6 text-sm text-gray-500 items-center">
              <button type="button" onClick={() => setShowConfig(true)} className="flex items-center gap-1 hover:text-gray-800">
                <Settings size={14}/> 配置服务器
              </button>
              
              {appMode === 'api' ? (
                  <button type="button" onClick={switchToMock} className="flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-lg">
                    <PlayCircle size={14}/> 进不去？试演示模式
                  </button>
              ) : (
                  <button type="button" onClick={() => { onSwitchMode('api'); setUsername(''); setPassword(''); setErrorMsg(''); }} className="text-blue-600 font-bold">
                    切换回真实后端
                  </button>
              )}
            </div>
            
            {appMode === 'api' && (
                <div className="text-center mt-4">
                    <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-blue-600 text-sm font-bold">
                        {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
                    </button>
                </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// --- 数字滚动动画组件 ---
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2 }) {
  const [display, setDisplay] = useState('0');
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    prevValue.current = end;
    const duration = 400;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      setDisplay(current.toFixed(decimals));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, decimals]);

  return <>{prefix}{display}{suffix}</>;
}

// --- Enhanced HomeView with Month Filter and Fixed Header ---
function HomeView({ transactions, onDelete, onUpdate, fetchTransactions, user }) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const [listAnimKey, setListAnimKey] = useState(0);

  // 依赖 currentDate，当月份变化时自动请求数据
  useEffect(() => {
    fetchTransactions(user.id, currentDate);
    setListAnimKey(k => k + 1); // 触发列表动画
  }, [currentDate, user.id, fetchTransactions]);

  const monthlyTransactions = transactions; // 已经是过滤好的

  const summary = useMemo(() => {
    return monthlyTransactions.reduce((acc, curr) => {
        const amt = Number(curr.amount);
        if (curr.type === 'income') { acc.income += amt; acc.total += amt; }
        else { acc.expense += amt; acc.total -= amt; }
        return acc;
    }, { income: 0, expense: 0, total: 0 });
  }, [monthlyTransactions]);

  const grouped = useMemo(() => {
    const groups = {};
    [...monthlyTransactions].sort((a,b) => new Date(b.date)-new Date(a.date)).forEach(t => {
       const key = new Date(t.date).toDateString();
       if(!groups[key]) groups[key] = { date: t.date, list: [], income:0, expense:0 };
       groups[key].list.push(t);
       if(t.type === 'income') groups[key].income += Number(t.amount);
       else groups[key].expense += Number(t.amount);
    });
    return Object.values(groups);
  }, [monthlyTransactions]);

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  // Swipe logic for card area
  const minSwipeDistance = 50;
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); }
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) changeMonth(1); 
    if (distance < -minSwipeDistance) changeMonth(-1);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 1. 固定的顶部区域 (资产卡片) */}
      <div className="px-5 pt-2 pb-4 shrink-0 z-10 bg-gray-100"> 
        <div 
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        >
            <div className="flex justify-between items-center mb-4 text-gray-400 text-xs">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:text-white"><ChevronLeft size={16}/></button>
                <span className="font-bold text-white">{currentDate.getFullYear()}年{currentDate.getMonth() + 1}月</span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:text-white"><ChevronRight size={16}/></button>
            </div>

            <div className="text-gray-400 text-sm mb-1">本月结余</div>
            <div className="text-3xl font-bold mb-6">¥ <AnimatedNumber value={summary.total}/></div>
            <div className="flex justify-between">
            <div><div className="text-red-300 text-xs flex items-center gap-1"><ArrowDownCircle size={12}/> 支出</div><div className="font-bold">¥<AnimatedNumber value={summary.expense}/></div></div>
            <div className="text-right"><div className="text-green-300 text-xs flex items-center justify-end gap-1">收入 <ArrowUpCircle size={12}/></div><div className="font-bold">¥<AnimatedNumber value={summary.income}/></div></div>
            </div>
        </div>
      </div>

      {/* 2. 可滚动的列表区域 */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 hide-scrollbar">
        {grouped.length === 0 ? <div className="text-center text-gray-400 py-10 text-sm">本月暂无数据</div> : (
            <div className="space-y-4" key={listAnimKey}>
            {grouped.map((g, i) => (
                <div key={i} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
                    <span>{formatDateHeader(g.date)}</span>
                    <span>支 {g.expense.toFixed(2)} · 收 {g.income.toFixed(2)}</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-50">
                    {g.list.map((t, idx) => (
                    <TransactionItem key={t.id} transaction={t} onClick={() => setSelectedTx(t)} isLast={idx === g.list.length - 1} />
                    ))}
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
      
      {selectedTx && <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} onDelete={onDelete} onUpdate={onUpdate} />}
    </div>
  );
}

function TransactionItem({ transaction, onClick, isLast }) {
  const cat = (transaction.type === 'expense' ? CATEGORIES.expense : CATEGORIES.income).find(c => c.id === transaction.categoryId) || { name: '其他', icon: MoreHorizontal, color: 'bg-gray-100' };
  const Icon = cat.icon;
  return (
    <>
      <div onClick={onClick} className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${cat.color}`}><Icon size={16}/></div>
          <div><div className="text-sm font-bold text-gray-700">{cat.name}</div><div className="text-xs text-gray-400">{transaction.note || transaction.counterparty || '-'}</div></div>
        </div>
        <div className={`font-bold ${transaction.type==='expense'?'text-gray-900':'text-green-600'}`}>{transaction.type==='expense'?'-':'+'}{Number(transaction.amount).toFixed(2)}</div>
      </div>
      {!isLast && <div className="h-[1px] bg-gray-50 mx-4"/>}
    </>
  );
}

// ... StatsView components (unchanged) ...
function StatsView({ transactions, onDelete, onUpdate, fetchTransactions, user, request }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null); // 'food', 'transport' etc.
  const [selectedTx, setSelectedTx] = useState(null);
  const [viewType, setViewType] = useState('expense'); // 新增：切换收入/支出
  const [trendData, setTrendData] = useState([]); // 新增：趋势数据状态

  // 获取趋势数据（根据 viewType 切换支出/收入）
  const fetchTrendData = useCallback(async () => {
      try {
          const data = await request(`/transactions/trend?userId=${user.id}&type=${viewType}`);
          setTrendData(data);
      } catch (err) {
          console.error("Fetch Trend Error:", err);
      }
  }, [user.id, request, viewType]);

  useEffect(() => {
      fetchTrendData();
  }, [fetchTrendData]);

  // 定义 MonthlyTrendChart 组件 (柱状图，从底部升起)
  const MonthlyTrendChart = ({ data }) => {
      const scrollRef = useRef(null);
      const chartColor = viewType === 'expense' ? '#3b82f6' : '#22c55e';
      const barColorLight = viewType === 'expense' ? '#93bbfd' : '#86efac';

      useEffect(() => {
          if (scrollRef.current) {
              scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
          }
      }, [data]);

      const chartData = useMemo(() => {
          const now = new Date();
          const result = [];
          for (let i = 5; i >= 0; i--) {
             const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
             const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
             const found = data.find(item => item.month === key);
             result.push({
                 label: `${d.getMonth() + 1}月`,
                 amount: found ? Number(found.total_amount) : 0,
                 key
             });
          }
          return result;
      }, [data]);

      const itemWidth = 50;
      const barWidth = 24;
      const width = Math.max(chartData.length * itemWidth, 300);
      const height = 160;
      const padding = 30;
      const bottomPadding = 24;
      const chartHeight = height - bottomPadding - padding;
      const maxVal = Math.max(...chartData.map(d => d.amount), 100);
      const baseline = height - bottomPadding;

      return (
          <div ref={scrollRef} className="w-full overflow-x-auto hide-scrollbar scroll-smooth">
              <svg width={width} height={height} className="overflow-visible">
                  <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="#f3f4f6" strokeWidth="1" />
                  {chartData.map((d, i) => {
                      const x = i * itemWidth + (itemWidth / 2);
                      const barH = maxVal > 0 ? (d.amount / maxVal) * chartHeight : 0;
                      return (
                          <g key={d.key}>
                              {/* 柱状条，从底部升起 */}
                              <rect
                                  x={x - barWidth / 2}
                                  y={baseline - barH}
                                  width={barWidth}
                                  height={barH}
                                  rx={4}
                                  fill={chartColor}
                                  opacity={d.amount > 0 ? 0.85 : 0.1}
                                  className="chart-bar-grow"
                                  style={{
                                      transformOrigin: `${x}px ${baseline}px`,
                                      animationDelay: `${i * 0.06}s`
                                  }}
                              />
                              {/* 数值标签 */}
                              {d.amount > 0 && (
                                  <text x={x} y={baseline - barH - 8} fontSize="10" fill={chartColor} textAnchor="middle" fontWeight="bold" className="chart-dot" style={{ animationDelay: `${0.3 + i * 0.06}s` }}>
                                      {d.amount >= 1000 ? (d.amount/1000).toFixed(1) + 'k' : Math.round(d.amount)}
                                  </text>
                              )}
                              <text x={x} y={height - 5} fontSize="11" fill="#9ca3af" textAnchor="middle">{d.label}</text>
                          </g>
                      )
                  })}
              </svg>
          </div>
      );
  };



  // 1. 过滤出当前月份的交易 (用于饼图和列表)
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.type === viewType); // 过滤类型
  }, [transactions, viewType]);

  const [stats, setStats] = useState([]); // 新增：分类统计状态
  const [statsTransactions, setStatsTransactions] = useState([]);

  // StatsView 切换月份时，独立获取该月交易数据
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    request(`/transactions?userId=${user.id}&year=${year}&month=${month}`)
      .then(data => setStatsTransactions(data))
      .catch(() => setStatsTransactions([]));
  }, [currentMonth, user.id, request]);

  // 获取分类统计数据
  const fetchCategoryStats = useCallback(async () => {
      try {
          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth() + 1;
          const data = await request(`/transactions/stats?userId=${user.id}&year=${year}&month=${month}&type=${viewType}`);

          // 转换数据格式以适配原有组件
          const total = data.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
          const formattedStats = data.map(item => {
              const cat = CATEGORIES[viewType].find(c => c.id === item.categoryId);
              return {
                  id: item.categoryId,
                  name: cat ? cat.name : '未知',
                  color: cat ? cat.color : 'bg-gray-100 text-gray-600',
                  amount: parseFloat(item.total_amount),
                  percent: total > 0 ? (parseFloat(item.total_amount) / total) * 100 : 0
              };
          }).sort((a, b) => b.amount - a.amount);

          setStats(formattedStats);
      } catch (err) {
          console.error("Fetch Stats Error:", err);
          setStats([]);
      }
  }, [user.id, currentMonth, viewType, request]);

  useEffect(() => {
      fetchCategoryStats();
  }, [fetchCategoryStats]);

  // 3. 过滤出选中分类的交易详情（使用 StatsView 独立获取的数据）
  const categoryDetails = useMemo(() => {
    if (!selectedCategory) return [];
    return statsTransactions
      .filter(t => t.type === viewType && t.categoryId === selectedCategory)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [statsTransactions, viewType, selectedCategory]);

  const changeMonth = (delta) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
    setSelectedCategory(null);
  };

  const hasData = stats.length > 0;

  // 类别详情页（全屏替换，从右滑入）
  if (selectedCategory) {
    return (
      <>
        <div className="flex flex-col h-full animate-slide-from-right bg-gray-100">
          {/* 固定顶部：返回按钮 + 标题 */}
          <div className="px-5 pt-2 pb-3 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {CATEGORIES[viewType].find(c => c.id === selectedCategory)?.name || '未知'}明细
              </h2>
            </div>
          </div>

          {/* 固定的金额卡片 */}
          <div className="px-5 pb-4 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-gray-500 text-xs mb-1">{currentMonth.getMonth()+1}月总{viewType === 'expense' ? '支出' : '收入'}</div>
              <div className="text-3xl font-bold text-gray-900">¥ {categoryDetails.reduce((s,t)=>s+Number(t.amount),0).toFixed(2)}</div>
            </div>
          </div>

          {/* 可滚动的条目列表 */}
          <div className="flex-1 overflow-y-auto px-5 pb-20 hide-scrollbar">
            {categoryDetails.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">暂无记录</div>
            ) : (
              <div className="space-y-3">
                {categoryDetails.map(t => (
                    <div key={t.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-50">
                      <TransactionItem
                        transaction={t}
                        onClick={() => setSelectedTx(t)}
                        isLast={true}
                      />
                    </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {selectedTx && (
          <TransactionDetailModal
            transaction={selectedTx}
            onClose={() => setSelectedTx(null)}
            onDelete={(id) => { onDelete(id); setSelectedTx(null); }}
            onUpdate={(tx) => { onUpdate(tx); setSelectedTx(tx); }}
          />
        )}
      </>
    );
  }

  // 主统计页面
  return (
    <div className="px-5 pt-4 space-y-6 h-full overflow-y-auto hide-scrollbar">

      {/* 收入/支出切换 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={()=>{setViewType('expense'); setSelectedCategory(null);}} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${viewType==='expense'?'bg-white shadow text-gray-900':'text-gray-500'}`}>支出</button>
          <button onClick={()=>{setViewType('income'); setSelectedCategory(null);}} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${viewType==='income'?'bg-white shadow text-gray-900':'text-gray-500'}`}>收入</button>
      </div>

      {/* 月度趋势图 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> 近6个月{viewType === 'expense' ? '支出' : '收入'}趋势</h3>
         <MonthlyTrendChart data={trendData} />
      </div>

      {/* 月份筛选器 */}
      <div className="flex items-center justify-center gap-4 bg-gray-50 p-2 rounded-xl">
          <button onClick={() => changeMonth(-1)} className="p-1 text-gray-500 hover:text-gray-900"><ChevronLeft size={20} /></button>
          <span className="font-bold text-gray-900 w-24 text-center">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </span>
          <button onClick={() => changeMonth(1)} className="p-1 text-gray-500 hover:text-gray-900"><ChevronRight size={20} /></button>
      </div>

      {/* 环形图 */}
      <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-6">本月分类占比</h2>
          {hasData ? (
            <SimplePieChart data={stats} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-full w-48 mx-auto">
              <span className="text-xs">本月暂无{viewType === 'expense' ? '支出' : '收入'}</span>
            </div>
          )}
      </div>

      {/* 可点击的分类列表 */}
      {hasData && (
         <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
           <div className="grid grid-cols-2 gap-4">
             {stats.map(stat => (
               <button
                 key={stat.id}
                 onClick={() => setSelectedCategory(stat.id)}
                 className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
               >
                 <div
                    className={`w-3 h-3 rounded-full ${stat.color.split(' ')[1]}`}
                    style={{ backgroundColor: 'currentColor' }}
                 ></div>
                 <div className="flex-1 flex justify-between items-baseline text-sm w-full">
                   <span className="text-gray-600 truncate">{stat.name}</span>
                   <div className="flex items-center gap-1">
                     <span className="font-bold text-gray-900">{stat.percent.toFixed(1)}%</span>
                     <ChevronRight size={12} className="text-gray-300" />
                   </div>
                 </div>
               </button>
             ))}
           </div>
         </div>
       )}
    </div>
  );
}

// ... SettingsModal, NavButton, TransactionDetailModal, AddTransactionModal, ImportModal (unchanged) ...
function SettingsModal({ user, onClose, onLogout }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-3/4 h-full shadow-2xl p-6 animate-slide-from-right flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">个人中心</h2>
                <button onClick={onClose}><X size={24} className="text-gray-400"/></button>
            </div>
            <div className="bg-blue-600 rounded-2xl p-6 text-white mb-8 shadow-lg shadow-blue-200">
                <div className="text-2xl font-bold mb-1">{user.username}</div>
                <div className="text-blue-100 text-sm opacity-80">ID: {user.id}</div>
            </div>
            <div className="mt-auto border-t pt-4">
                <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-red-500 py-3 bg-red-50 rounded-xl font-bold">
                    <LogOut size={18}/> 退出登录
                </button>
            </div>
        </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 transition-colors ${active ? 'text-gray-900 scale-105' : 'text-gray-400'}`}>
      <Icon size={24} strokeWidth={active?2.5:2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function TransactionDetailModal({ transaction, onClose, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTx, setEditedTx] = useState({...transaction});
  const [showConfirm, setShowConfirm] = useState(false); // 新增状态：控制确认弹窗

  const isExpense = editedTx.type === 'expense';
  const categoryList = isExpense ? CATEGORIES.expense : CATEGORIES.income;
  const category = categoryList.find(c => c.id === editedTx.categoryId) || { name: '其他', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' };
  const Icon = category.icon;
  const dateObj = new Date(editedTx.date);

  const handleSave = () => {
    onUpdate(editedTx);
    setIsEditing(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-6">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
          
          <div className="flex justify-between items-center p-4 border-b border-gray-50 shrink-0">
             <h3 className="text-sm font-bold text-gray-500 ml-2">{isEditing ? '编辑账单' : '账单详情'}</h3>
             <div className="flex gap-2">
               {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                    <Pencil size={18} />
                  </button>
               ) : (
                  <button onClick={handleSave} className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors">
                    <Save size={18} />
                  </button>
               )}
               <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                 <X size={18} className="text-gray-600" />
               </button>
             </div>
          </div>

          <div className="p-6 flex flex-col items-center flex-1 overflow-y-auto">
             {isEditing ? (
               <div className="w-full mb-6">
                 <label className="text-xs text-gray-400 block mb-2 text-center">选择分类</label>
                 <div className="grid grid-cols-5 gap-2">
                    {categoryList.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setEditedTx({...editedTx, categoryId: cat.id})}
                        className={`flex flex-col items-center p-1 rounded-lg ${editedTx.categoryId === cat.id ? 'bg-blue-50 ring-1 ring-blue-500' : ''}`}
                      >
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${cat.color}`}>
                           <cat.icon size={14} />
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 scale-90">{cat.name}</span>
                      </button>
                    ))}
                 </div>
               </div>
             ) : (
               <>
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${category.color} bg-opacity-20`}>
                    <Icon size={40} className={category.color.split(' ')[1]} />
                 </div>
                 <div className="text-sm text-gray-500 font-medium mb-1">{category.name}</div>
               </>
             )}

             {isEditing ? (
               <div className="flex items-baseline justify-center mb-8 border-b border-blue-500 pb-1">
                  <span className={`text-2xl font-bold mr-1 ${isExpense ? 'text-gray-900' : 'text-green-600'}`}>{isExpense ? '-' : '+'}</span>
                  <input 
                    type="number" 
                    value={editedTx.amount}
                    onChange={(e) => setEditedTx({...editedTx, amount: parseFloat(e.target.value)})}
                    className={`text-3xl font-bold text-center outline-none bg-transparent w-32 ${isExpense ? 'text-gray-900' : 'text-green-600'}`}
                  />
               </div>
             ) : (
               <div className={`text-3xl font-bold mb-8 ${isExpense ? 'text-gray-900' : 'text-green-600'}`}>
                  {isExpense ? '-' : '+'}{Number(editedTx.amount).toFixed(2)}
               </div>
             )}

             <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Tag size={16} />
                      <span>类型</span>
                   </div>
                   <span className="text-gray-700 font-medium">{isExpense ? '支出' : '收入'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={16} />
                      <span>时间</span>
                   </div>
                   {isEditing ? (
                      <input 
                        type="datetime-local" 
                        value={new Date(new Date(editedTx.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                        onChange={(e) => setEditedTx({...editedTx, date: new Date(e.target.value).toISOString()})}
                        className="text-right font-medium bg-gray-50 rounded px-2 py-1 outline-none focus:ring-1 ring-blue-500"
                      />
                   ) : (
                      <span className="text-gray-700 font-medium">
                         {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                   )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Store size={16} />
                      <span>交易对方</span>
                   </div>
                   {isEditing ? (
                      <input 
                        type="text" 
                        value={editedTx.counterparty || ''}
                        onChange={(e) => setEditedTx({...editedTx, counterparty: e.target.value})}
                        placeholder="商户/对方名称"
                        className="text-right font-medium bg-gray-50 rounded px-2 py-1 outline-none focus:ring-1 ring-blue-500 w-32"
                      />
                   ) : (
                      <span className="text-gray-700 font-medium text-right truncate max-w-[200px]">
                        {editedTx.counterparty || '-'}
                      </span>
                   )}
                </div>

                <div className="flex items-start justify-between text-sm">
                   <div className="flex items-center gap-2 text-gray-400">
                      <List size={16} />
                      <span>备注</span>
                   </div>
                   {isEditing ? (
                      <textarea 
                        value={editedTx.note || ''}
                        onChange={(e) => setEditedTx({...editedTx, note: e.target.value})}
                        placeholder="添加备注..."
                        rows={2}
                        className="text-right font-medium bg-gray-50 rounded px-2 py-1 outline-none focus:ring-1 ring-blue-500 w-48 resize-none text-sm"
                      />
                   ) : (
                      <span className="text-gray-700 font-medium text-right max-w-[200px] break-words">
                        {editedTx.note || '暂无备注'}
                      </span>
                   )}
                </div>
             </div>

             {!isEditing && (
               <div className="w-full mt-10 pt-6 border-t border-gray-100">
                  <button 
                     onClick={() => setShowConfirm(true)} // 点击删除显示确认弹窗
                     className="w-full flex items-center justify-center gap-2 text-red-500 py-3 rounded-xl hover:bg-red-50 transition-colors font-medium text-sm"
                  >
                     <Trash2 size={18} />
                     删除此记录
                  </button>
               </div>
             )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        title="确认删除" 
        message="删除后将无法恢复，确定要继续吗？" 
        onCancel={() => setShowConfirm(false)} 
        onConfirm={() => {
          onDelete(transaction.id);
          setShowConfirm(false); // 关闭确认弹窗
          onClose(); // 关闭详情页
        }} 
      />
    </>
  );
}

function AddTransactionModal({ onClose, onSave }) {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [categoryId, setCategoryId] = useState('food');
    
    // 新增：更多状态
    const [date, setDate] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    const [note, setNote] = useState('');
    const [counterparty, setCounterparty] = useState('');

    const categories = type === 'expense' ? CATEGORIES.expense : CATEGORIES.income;

    const handleSubmit = () => {
        if (!amount) return alert('请输入金额');
        onSave({
            amount: parseFloat(amount),
            type,
            categoryId,
            date: new Date(date).toISOString(),
            note,
            counterparty
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/20 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-t-3xl p-6 h-[90vh] flex flex-col shadow-2xl animate-slide-from-bottom">
                
                {/* Header & Type Switcher */}
                <div className="flex justify-between mb-6 shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:text-gray-800"><X/></button>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        <button onClick={()=>setType('expense')} className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${type==='expense'?'bg-white shadow text-gray-900':'text-gray-500'}`}>支出</button>
                        <button onClick={()=>setType('income')} className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${type==='income'?'bg-white shadow text-gray-900':'text-gray-500'}`}>收入</button>
                    </div>
                    <div className="w-8"/> 
                </div>

                {/* Amount Input */}
                <div className="mb-6 shrink-0">
                    <label className="text-xs text-gray-400 font-medium ml-1 block mb-1">金额</label>
                    <div className="flex items-baseline border-b-2 border-gray-100 focus-within:border-blue-500 transition-colors py-2">
                        <span className="text-2xl font-bold mr-2 text-gray-400">¥</span>
                        <input 
                            autoFocus 
                            type="number" 
                            placeholder="0.00" 
                            className="w-full text-4xl font-bold bg-transparent outline-none placeholder-gray-200" 
                            value={amount} 
                            onChange={e=>setAmount(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Category Grid (Scrollable) */}
                <div className="flex-1 overflow-y-auto hide-scrollbar mb-4">
                    <label className="text-xs text-gray-400 font-medium mb-3 block">选择分类</label>
                    <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={()=>setCategoryId(cat.id)} className="flex flex-col items-center gap-1 group">
                                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${categoryId===cat.id ? `${cat.color} ring-2 ring-offset-1 ring-blue-500` : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                                    <cat.icon size={20}/>
                                </div>
                                <span className={`text-[10px] font-medium ${categoryId===cat.id ? 'text-gray-800' : 'text-gray-400'}`}>{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Additional Details Form */}
                <div className="space-y-3 shrink-0 mb-4 bg-gray-50 p-4 rounded-2xl">
                     {/* Date */}
                    <div className="flex items-center gap-3 border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                        <Clock size={16} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 w-12">时间</span>
                        <input 
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent flex-1 text-sm font-medium outline-none text-right"
                        />
                    </div>

                    {/* Counterparty */}
                    <div className="flex items-center gap-3 border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                        <Store size={16} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 w-12">对方</span>
                        <input 
                            type="text"
                            placeholder="商户/交易对象"
                            value={counterparty}
                            onChange={(e) => setCounterparty(e.target.value)}
                            className="bg-transparent flex-1 text-sm font-medium outline-none text-right placeholder-gray-300"
                        />
                    </div>

                    {/* Note */}
                    <div className="flex items-center gap-3">
                        <List size={16} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 w-12">备注</span>
                        <input 
                            type="text"
                            placeholder="写点什么..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="bg-transparent flex-1 text-sm font-medium outline-none text-right placeholder-gray-300"
                        />
                    </div>
                </div>

                <button onClick={handleSubmit} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-transform shrink-0">
                    保存
                </button>
            </div>
        </div>
    )
}

// ... existing ImportModal ...
function ImportModal({ onClose, onImport }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const fileInputRef = useRef(null);

    const processFile = async (file) => {
      setLoading(true);
      setError(null);
      setPreviewData([]);

      try {
        // 使用独立工具模块解析文件
        const data = await parseBillFile(file);

        if (data.length === 0) {
          throw new Error('未找到有效账单数据，请检查文件格式');
        }

        setPreviewData(data);
      } catch (err) {
        console.error(err);
        setError(err.message || '文件解析失败');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">导入微信/Excel账单</h3>
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
             {previewData.length === 0 ? (
               <div className="flex flex-col items-center justify-center space-y-4 py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                 {loading ? (
                   <Loader2 className="animate-spin text-blue-500" size={32} />
                 ) : (
                   <>
                     <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                       <FileSpreadsheet size={24} />
                     </div>
                     <div className="text-center">
                       <p className="text-sm font-medium text-gray-700">点击上传文件</p>
                       <p className="text-xs text-gray-400 mt-1">支持 .csv 或 .xlsx 格式</p>
                       <p className="text-[10px] text-gray-400 mt-2">支持微信支付账单导出格式</p>
                     </div>
                     <input 
                       type="file" 
                       ref={fileInputRef}
                       accept=".csv,.xlsx,.xls" 
                       className="hidden" 
                       onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                     />
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50"
                     >
                       选择文件
                     </button>
                     {error && <p className="text-xs text-red-500 px-4 text-center">{error}</p>}
                   </>
                 )}
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                   <CheckCircle2 size={16} />
                   <span>成功解析 {previewData.length} 条记录</span>
                 </div>
                 <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                   {previewData.slice(0, 50).map((item, idx) => (
                     <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                       <div className="flex flex-col">
                          <span className="text-gray-700 font-medium truncate w-32">{item.note}</span>
                          <span className="text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                       </div>
                       <span className={item.type === 'expense' ? 'text-gray-900' : 'text-green-600'}>
                         {item.type === 'expense' ? '-' : '+'}{item.amount}
                       </span>
                     </div>
                   ))}
                   {previewData.length > 50 && <div className="text-center text-xs text-gray-400 py-2">...还有 {previewData.length - 50} 条</div>}
                 </div>
               </div>
             )}
          </div>
  
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
              disabled={previewData.length === 0}
              onClick={() => onImport(previewData)}
              className="w-full bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
            >
              确认导入同步
            </button>
          </div>
        </div>
      </div>
    );
  }