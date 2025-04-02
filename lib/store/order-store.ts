import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { safeAdd, safeMultiply } from '@/lib/utils/format';

// 订单状态枚举
export enum OrderStatus {
  PENDING_PAYMENT = '待付款',
  PENDING_SHIPMENT = '待发货',
  SHIPPED = '已发货',
  COMPLETED = '已完成',
  CANCELLED = '已取消',
}

// 订单商品接口
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  specifications?: Record<string, string>; // 商品规格，如颜色、尺寸等
}

// 收货地址接口
export interface ShippingAddress {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDefault?: boolean;
}

// 支付方式枚举
export enum PaymentMethod {
  WECHAT = '微信支付',
  ALIPAY = '支付宝',
  CREDIT_CARD = '信用卡',
  CASH_ON_DELIVERY = '货到付款',
}

// 订单接口
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  finalAmount?: number; // 最终支付金额（含优惠、运费等）
  discount?: number; // 优惠金额
  shippingFee?: number; // 运费
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  trackingNumber?: string; // 物流单号
  shippingMethod?: string; // 物流公司
  remark?: string; // 订单备注
}

// 状态接口
interface OrderState {
  orders: Order[];
  mockInitialized: boolean;
  initMockOrders: () => void;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  cancelOrder: (id: string) => void;
  confirmReceived: (id: string) => void;
}

// 生成随机的订单数据
const generateMockOrders = (): Order[] => {
  const mockOrders: Order[] = [];
  const paymentMethods = ['支付宝', '微信支付', '银联支付'];
  const shippingMethods = ['顺丰速运', '中通快递', '圆通速递', '京东物流'];
  
  // 模拟30个随机订单
  for (let i = 0; i < 30; i++) {
    // 生成随机的订单商品项
    const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5个商品
    const items: OrderItem[] = [];
    
    for (let j = 0; j < itemCount; j++) {
      const productId = uuidv4();
      const price = parseFloat((Math.random() * 1000 + 50).toFixed(2));
      const originalPrice = Math.random() > 0.5 ? parseFloat((price * 1.2).toFixed(2)) : undefined;
      const quantity = Math.floor(Math.random() * 3) + 1;
      
      const specifications: Record<string, string> = {};
      
      // 随机生成商品规格
      if (Math.random() > 0.3) {
        const colors = ['红色', '蓝色', '黑色', '白色', '灰色'];
        specifications['颜色'] = colors[Math.floor(Math.random() * colors.length)];
      }
      
      if (Math.random() > 0.5) {
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        specifications['尺寸'] = sizes[Math.floor(Math.random() * sizes.length)];
      }
      
      items.push({
        id: uuidv4(),
        productId,
        name: `商品${Math.floor(Math.random() * 1000) + 1}`,
        price,
        originalPrice,
        image: '/next.svg', // 使用默认图片
        quantity,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      });
    }
    
    // 计算总金额
    let totalAmount = 0;
    items.forEach(item => {
      totalAmount = safeAdd(totalAmount, safeMultiply(item.price, item.quantity));
    });
    
    // 生成随机地址
    const provinces = ['北京市', '上海市', '广东省', '江苏省', '浙江省'];
    const cities = ['北京市', '上海市', '广州市', '深圳市', '南京市', '杭州市'];
    const districts = ['朝阳区', '海淀区', '浦东新区', '天河区', '福田区', '玄武区', '西湖区'];
    
    const shippingAddress: ShippingAddress = {
      id: uuidv4(),
      name: `用户${Math.floor(Math.random() * 100) + 1}`,
      phone: `1${Math.floor(Math.random() * 9) + 3}${Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`,
      province: provinces[Math.floor(Math.random() * provinces.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      district: districts[Math.floor(Math.random() * districts.length)],
      address: `某某路${Math.floor(Math.random() * 100) + 1}号某某小区${Math.floor(Math.random() * 20) + 1}栋${Math.floor(Math.random() * 5) + 1}单元${Math.floor(Math.random() * 30) + 101}室`,
      isDefault: Math.random() > 0.8,
    };
    
    // 生成随机订单状态和相关日期
    const now = new Date();
    const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // 过去30天内的随机时间
    
    // 随机选择订单状态
    const randomStatusIndex = Math.floor(Math.random() * Object.keys(OrderStatus).length);
    const status = Object.values(OrderStatus)[randomStatusIndex];
    
    // 根据订单状态生成相应的日期
    let paidAt: string | undefined;
    let shippedAt: string | undefined;
    let completedAt: string | undefined;
    let cancelledAt: string | undefined;
    let trackingNumber: string | undefined;
    let shippingMethod: string | undefined;
    
    if (status !== OrderStatus.PENDING_PAYMENT) {
      paidAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString();
    }
    
    if (status === OrderStatus.SHIPPED || status === OrderStatus.COMPLETED) {
      shippedAt = new Date(new Date(paidAt!).getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString();
      trackingNumber = `SF${Math.floor(Math.random() * 1000000000)}`;
      shippingMethod = shippingMethods[Math.floor(Math.random() * shippingMethods.length)];
    }
    
    if (status === OrderStatus.COMPLETED) {
      completedAt = new Date(new Date(shippedAt!).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    if (status === OrderStatus.CANCELLED) {
      cancelledAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // 生成运费和优惠
    const shippingFee = Math.random() > 0.3 ? parseFloat((Math.random() * 20).toFixed(2)) : 0;
    const discount = Math.random() > 0.5 ? parseFloat((Math.random() * totalAmount * 0.2).toFixed(2)) : 0;
    const finalAmount = parseFloat((totalAmount + shippingFee - discount).toFixed(2));
    
    // 创建订单
    mockOrders.push({
      id: uuidv4(),
      orderNumber: `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`,
      userId: 'user_123', // 假设的用户ID
      status,
      items,
      totalAmount,
      finalAmount,
      discount,
      shippingFee,
      shippingAddress,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      createdAt: createdAt.toISOString(),
      paidAt,
      shippedAt,
      completedAt,
      cancelledAt,
      trackingNumber,
      shippingMethod,
      remark: Math.random() > 0.7 ? '请尽快发货，谢谢！' : undefined,
    });
  }
  
  // 按创建时间倒序排列
  return mockOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// 创建store
export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  mockInitialized: false,
  
  // 初始化模拟订单数据
  initMockOrders: () => {
    if (!get().mockInitialized) {
      set({ orders: generateMockOrders(), mockInitialized: true });
    }
  },
  
  // 根据ID获取订单
  getOrderById: (id: string) => {
    return get().orders.find(order => order.id === id);
  },
  
  // 根据状态获取订单
  getOrdersByStatus: (status: OrderStatus) => {
    return get().orders.filter(order => order.status === status);
  },
  
  // 取消订单
  cancelOrder: (id: string) => {
    set(state => ({
      orders: state.orders.map(order => 
        order.id === id 
          ? { 
              ...order, 
              status: OrderStatus.CANCELLED, 
              cancelledAt: new Date().toISOString() 
            } 
          : order
      )
    }));
  },
  
  // 确认收货
  confirmReceived: (id: string) => {
    set(state => ({
      orders: state.orders.map(order => 
        order.id === id && order.status === OrderStatus.SHIPPED
          ? { 
              ...order, 
              status: OrderStatus.COMPLETED, 
              completedAt: new Date().toISOString() 
            } 
          : order
      )
    }));
  },
})); 