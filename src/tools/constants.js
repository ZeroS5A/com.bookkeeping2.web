/**
 * 应用常量定义
 * 包含分类配置、关键词映射等
 */

import {
  Utensils, Bus, ShoppingBag, Home, Gamepad2, Coffee, Heart,
  GraduationCap, Scissors, Smartphone, Plane, Cat, MoreHorizontal,
  Briefcase, Gift, ArrowUpCircle, List, FileText, Loader2, CheckCircle2
} from 'lucide-react';

/**
 * 应用常量定义
 * 包含分类配置、关键词映射等
 */

// 图标别名映射（兼容旧代码）
export const Shirt = ShoppingBag;
export const Car = Bus;
export const Wine = Coffee;
export const Dumbbell = Heart;
export const BookOpen = List;
export const Baby = Heart;
export const FileSpreadsheet = FileText;
export const Loader = Loader2;
export const CheckCircle = CheckCircle2;

// 支出分类配置
// id: 分类唯一标识
// name: 分类显示名称
// icon: Lucide图标组件
// color: Tailwind CSS 样式类
// keywords: 自动归类关键词（用于guessCategory智能分类）
export const CATEGORIES = {
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

export default CATEGORIES;