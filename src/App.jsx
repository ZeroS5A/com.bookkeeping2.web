import React, { useState, useMemo, useEffect, useRef } from 'react';
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

// --- 配置与常量 ---
const CATEGORIES = {
  expense: [
    { id: 'food', name: '餐饮', icon: Utensils, color: 'bg-orange-100 text-orange-600', keywords: ['餐饮', '美食', '饭', '饿了么', '美团', '麦当劳', '肯德基', '星巴克', '瑞幸'] },
    { id: 'snacks', name: '零食', icon: Coffee, color: 'bg-yellow-100 text-yellow-600', keywords: ['零食', '奶茶', '饮料', '水果', '下午茶'] },
    { id: 'shopping', name: '购物', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600', keywords: ['超市', '便利店', '京东', '淘宝', '拼多多', '唯品会', '百货', '优衣库', '各种百货'] },
    { id: 'clothing', name: '服饰', icon: Shirt, color: 'bg-indigo-100 text-indigo-600', keywords: ['衣服', '裤子', '鞋', '帽', '包', '服装', '优衣库', 'Zara', 'H&M'] },
    { id: 'transport', name: '交通', icon: Bus, color: 'bg-blue-100 text-blue-600', keywords: ['交通', '地铁', '滴滴', '打车', '铁路', '车费', '机票', '火车', '公交'] },
    { id: 'car', name: '汽车', icon: Car, color: 'bg-slate-100 text-slate-600', keywords: ['加油', '停车', '保养', '车险', '洗车', '过路费', '中石化', '中石油'] },
    { id: 'housing', name: '居住', icon: Home, color: 'bg-emerald-100 text-emerald-600', keywords: ['电费', '水费', '物业', '房租', '宽带', '燃气', '暖气'] },
    { id: 'social', name: '社交', icon: Wine, color: 'bg-purple-100 text-purple-600', keywords: ['请客', '红包', '礼物', '聚餐', '人情'] },
    { id: 'entertainment', name: '娱乐', icon: Gamepad2, color: 'bg-violet-100 text-violet-600', keywords: ['电影', '游戏', '会员', 'KTV', '网吧', '充值', '演出', '门票'] },
    { id: 'fitness', name: '运动', icon: Dumbbell, color: 'bg-lime-100 text-lime-600', keywords: ['健身', '运动', '体育', '球', '瑜伽', '游泳'] },
    { id: 'medical', name: '医疗', icon: Heart, color: 'bg-red-100 text-red-600', keywords: ['医院', '药', '体检', '挂号', '门诊', '看病'] },
    { id: 'education', name: '教育', icon: GraduationCap, color: 'bg-sky-100 text-sky-600', keywords: ['学费', '培训', '考试', '报名'] },
    { id: 'book', name: '阅读', icon: BookOpen, color: 'bg-amber-100 text-amber-600', keywords: ['书', '当当', '知识付费', '课程'] },
    { id: 'baby', name: '亲子', icon: Baby, color: 'bg-rose-100 text-rose-600', keywords: ['尿布', '奶粉', '玩具', '童装', '幼儿园'] },
    { id: 'beauty', name: '美容', icon: Scissors, color: 'bg-fuchsia-100 text-fuchsia-600', keywords: ['理发', '美容', '化妆品', '护肤', '美甲', '洗剪吹'] },
    { id: 'digital', name: '数码', icon: Smartphone, color: 'bg-zinc-100 text-zinc-600', keywords: ['手机', '电脑', '数码', '电子', '配件', '苹果', '华为', '小米'] },
    { id: 'travel', name: '旅行', icon: Plane, color: 'bg-teal-100 text-teal-600', keywords: ['酒店', '民宿', '旅游', '度假', '携程', '飞猪'] },
    { id: 'pet', name: '宠物', icon: Cat, color: 'bg-orange-50 text-orange-500', keywords: ['猫', '狗', '宠', '粮', '宠物医院'] },
    { id: 'other', name: '其他', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600', keywords: [] },
  ],
  income: [
    { id: 'salary', name: '工资', icon: Briefcase, color: 'bg-green-100 text-green-600', keywords: ['工资', '薪资', '薪金'] },
    { id: 'bonus', name: '奖金', icon: Gift, color: 'bg-red-100 text-red-600', keywords: ['奖金', '红包'] },
    { id: 'investment', name: '理财', icon: ArrowUpCircle, color: 'bg-blue-100 text-blue-600', keywords: ['理财', '基金', '股票', '利息'] },
    { id: 'other_income', name: '其他', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600', keywords: [] },
  ]
};

// --- 工具函数：Excel/CSV 解析相关 ---

const guessCategory = (type, productName, counterparty) => {
  const text = (productName + counterparty).toLowerCase();
  const catList = type === 'expense' ? CATEGORIES.expense : CATEGORIES.income;
  
  for (const cat of catList) {
    if (cat.keywords && cat.keywords.some(k => text.includes(k.toLowerCase()))) {
      return cat.id;
    }
  }
  return type === 'expense' ? 'other' : 'other_income';
};

const loadXLSXLibrary = () => {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

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
         <circle key={item.id} cx="50" cy="50" r="40" fill="currentColor" className={item.color.split(' ')[1]} />
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
        className={`${item.color.split(' ')[1]} hover:opacity-80 transition-opacity cursor-pointer`}
        fill="currentColor"
        stroke="white" 
        strokeWidth="1"
      />
    );
  });

  return (
    <div className="relative w-48 h-48 mx-auto">
       <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-0">
         {paths}
         <circle cx="50" cy="50" r="25" fill="white" />
       </svg>
       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
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
            if (t.type === 'expense') {
                const date = new Date(t.date);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (data[key]) data[key].amount += Number(t.amount);
            }
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

// --- 通用确认弹窗 ---
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-6">
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
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
  
  const [appMode, setAppMode] = useState('api'); 
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('api_url') || 'http://localhost:3000/api');

  const saveApiConfig = (url) => {
    const cleanUrl = url.replace(/\/$/, '');
    setApiUrl(cleanUrl);
    localStorage.setItem('api_url', cleanUrl);
  };

  const request = async (endpoint, options = {}) => {
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
  };

  const fetchTransactions = async (userId) => {
    setIsLoading(true);
    try {
      const data = await request(`/transactions?userId=${userId}`);
      setTransactions(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
        fetchTransactions(user.id);
    }
  }, []);

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

    const tempTxs = newTxs.map((t, i) => ({ ...t, id: Date.now() + i, userId: user.id }));
    setTransactions(prev => [...tempTxs, ...prev]);

    let successCount = 0;
    for (const tx of newTxs) {
        try {
            await request('/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...tx, userId: user.id })
            });
            successCount++;
        } catch (e) {
            console.error('Import failed item', e);
        }
    }
    alert(`导入完成：成功 ${successCount} / ${newTxs.length} 条`);
    fetchTransactions(user.id);
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

        {/* 使用 overflow-hidden + 内部 flex-col 结构来实现“部分固定、部分滚动” */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'home' ? (
            <HomeView transactions={transactions} onDelete={handleDelete} onUpdate={handleUpdate} />
          ) : (
            // 统计页面也可以用类似的滚动策略，目前保持整体滚动
            <div className="h-full overflow-y-auto hide-scrollbar pb-24">
               <StatsView transactions={transactions} onDelete={handleDelete} onUpdate={handleUpdate} />
            </div>
          )}
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
            msg = '无法连接服务器。如果您的服务器是HTTP而此处是HTTPS，浏览器可能会拦截请求。建议尝试下方的“进入演示模式”。';
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
            <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 flex items-start gap-2 animate-in fade-in">
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
           <div className="bg-gray-50 p-6 rounded-2xl animate-in fade-in">
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
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
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

// --- Enhanced HomeView with Month Filter and Fixed Header ---
function HomeView({ transactions, onDelete, onUpdate }) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentDate.getFullYear() && 
             d.getMonth() === currentDate.getMonth();
    });
  }, [transactions, currentDate]);

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
            <div className="text-3xl font-bold mb-6">¥ {summary.total.toFixed(2)}</div>
            <div className="flex justify-between">
            <div><div className="text-red-300 text-xs flex items-center gap-1"><ArrowDownCircle size={12}/> 支出</div><div className="font-bold">¥{summary.expense.toFixed(2)}</div></div>
            <div className="text-right"><div className="text-green-300 text-xs flex items-center justify-end gap-1">收入 <ArrowUpCircle size={12}/></div><div className="font-bold">¥{summary.income.toFixed(2)}</div></div>
            </div>
        </div>
      </div>

      {/* 2. 可滚动的列表区域 */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 hide-scrollbar">
        {grouped.length === 0 ? <div className="text-center text-gray-400 py-10 text-sm">本月暂无数据</div> : (
            <div className="space-y-4">
            {grouped.map((g, i) => (
                <div key={i}>
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
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${cat.color}`}><Icon size={16}/></div>
          <div><div className="text-sm font-bold text-gray-700">{cat.name}</div><div className="text-xs text-gray-400">{transaction.note || transaction.counterparty || '-'}</div></div>
        </div>
        <div className={`font-bold ${transaction.type==='expense'?'text-gray-900':'text-green-600'}`}>{transaction.type==='expense'?'-':'+'}{Number(transaction.amount).toFixed(2)}</div>
      </div>
      {!isLast && <div className="h-[1px] bg-gray-50 mx-4"/>}
    </>
  );
}

// ... StatsView components (unchanged) ...
function StatsView({ transactions, onDelete, onUpdate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null); // 'food', 'transport' etc.
  const [selectedTx, setSelectedTx] = useState(null);

  // 1. 过滤出当前月份的交易 (用于饼图和列表)
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentMonth.getFullYear() && 
             d.getMonth() === currentMonth.getMonth() &&
             t.type === 'expense'; // 只统计支出
    });
  }, [transactions, currentMonth]);

  // 2. 计算分类统计数据
  const stats = useMemo(() => {
    const total = monthlyTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const byCategory = monthlyTransactions.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

    return Object.entries(byCategory)
      .map(([id, amount]) => {
        const cat = CATEGORIES.expense.find(c => c.id === id);
        return {
          id,
          name: cat ? cat.name : '未知',
          color: cat ? cat.color : 'bg-gray-100 text-gray-600', // Fallback color
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions]);

  // 3. 过滤出选中分类的交易详情
  const categoryDetails = useMemo(() => {
    if (!selectedCategory) return [];
    return monthlyTransactions
      .filter(t => t.categoryId === selectedCategory)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [monthlyTransactions, selectedCategory]);

  const changeMonth = (delta) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
    setSelectedCategory(null);
  };

  const hasData = stats.length > 0;
  
  // 如果选中了分类，显示二级详情页
  if (selectedCategory) {
     const cat = CATEGORIES.expense.find(c => c.id === selectedCategory) || { name: '未知' };
     // Fix: Convert t.amount to Number
     const totalAmount = categoryDetails.reduce((sum, t) => sum + Number(t.amount), 0); 

     return (
       <div className="px-5 pt-2 animate-in slide-in-from-right duration-200">
         <div className="flex items-center gap-2 mb-6">
           <button 
             onClick={() => setSelectedCategory(null)}
             className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
           >
             <ChevronLeft size={20} className="text-gray-600" />
           </button>
           <h2 className="text-lg font-bold text-gray-900">{cat.name}明细</h2>
         </div>

         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
            <div className="text-gray-500 text-xs mb-1">{currentMonth.getMonth()+1}月总支出</div>
            <div className="text-3xl font-bold text-gray-900">¥ {totalAmount.toFixed(2)}</div>
         </div>

         <div className="space-y-3 pb-20">
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

         {selectedTx && (
            <TransactionDetailModal 
              transaction={selectedTx} 
              onClose={() => setSelectedTx(null)}
              onDelete={(id) => { onDelete(id); setSelectedTx(null); }}
              onUpdate={(tx) => { onUpdate(tx); setSelectedTx(tx); }}
            />
          )}
       </div>
     );
  }

  return (
    <div className="px-5 pt-4 space-y-6">
      
      {/* 月度趋势图 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> 近6个月趋势</h3>
         <MonthlyTrendChart transactions={transactions} />
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
              <span className="text-xs">本月暂无支出</span>
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
    <div className="absolute inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-3/4 h-full shadow-2xl p-6 animate-in slide-in-from-right flex flex-col">
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
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-6">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.color}`}>
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
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl p-6 h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                
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
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${categoryId===cat.id ? `${cat.color} ring-2 ring-offset-1 ring-blue-500` : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
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
        let data = [];
        const isCSV = file.name.toLowerCase().endsWith('.csv');
        
        if (isCSV) {
          const text = await file.text();
          data = parseWeChatCSV(text);
        } else {
          // Assume Excel/XLSX
          const XLSX = await loadXLSXLibrary();
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays
          data = parseWeChatArrayData(jsonData);
        }
  
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
  
    // 解析 CSV 文本
    const parseWeChatCSV = (text) => {
      const lines = text.split(/\r\n|\n/);
      // 微信账单前面通常有几行头部信息，找到包含 "交易时间" 的那一行作为表头
      const headerIndex = lines.findIndex(line => line.includes('交易时间') && line.includes('金额'));
      
      if (headerIndex === -1) return [];
  
      const headers = lines[headerIndex].split(',').map(h => h.trim());
      const result = [];
  
      // 辅助：获取CSV单元格，处理引号
      const getCells = (line) => {
         return line.split(',').map(cell => cell.replace(/^"|"$/g, '')); 
      };
  
      const idxTime = headers.findIndex(h => h.includes('交易时间'));
      const idxType = headers.findIndex(h => h.includes('收/支'));
      const idxAmount = headers.findIndex(h => h.includes('金额'));
      const idxProduct = headers.findIndex(h => h.includes('商品'));
      const idxCounterparty = headers.findIndex(h => h.includes('交易对方'));
      const idxNote = headers.findIndex(h => h.includes('备注')); 
  
      for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cells = getCells(line);
          if (cells.length < headers.length) continue;
  
          const typeStr = cells[idxType]?.trim(); 
          if (typeStr !== '收入' && typeStr !== '支出') continue;
  
          const amountStr = cells[idxAmount]?.replace('¥', '').trim();
          const amount = parseFloat(amountStr);
          if (isNaN(amount)) continue;
  
          const type = typeStr === '收入' ? 'income' : 'expense';
          const product = cells[idxProduct]?.trim() || '';
          const counterparty = cells[idxCounterparty]?.trim() || '';
          const note = cells[idxNote]?.trim() || '';
          const dateRaw = cells[idxTime]?.trim();
          
          const categoryId = guessCategory(type, product, counterparty);
  
          result.push({
              type,
              amount,
              categoryId,
              date: new Date(dateRaw).toISOString() || new Date().toISOString(),
              note: product || note || '导入记录', 
              counterparty: counterparty 
          });
      }
      return result;
    };
  
    // 解析 Array 数据 (来自 XLSX)
    const parseWeChatArrayData = (rows) => {
        const headerRowIndex = rows.findIndex(row => row.some(cell => typeof cell === 'string' && cell.includes('交易时间')));
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
  
            let amount = row[idxAmount];
            if (typeof amount === 'string') amount = parseFloat(amount.replace('¥', ''));
            
            const type = typeStr === '收入' ? 'income' : 'expense';
            const product = row[idxProduct] || '';
            const counterparty = row[idxCounterparty] || '';
            
            let dateStr = row[idxTime];
            if (typeof dateStr !== 'string') dateStr = new Date().toISOString();
  
            const categoryId = guessCategory(type, product, counterparty);
  
            result.push({
              type,
              amount,
              categoryId,
              date: new Date(dateStr).toISOString(), 
              note: product || '', 
              counterparty: counterparty 
            });
        }
        return result;
    };
  
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
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