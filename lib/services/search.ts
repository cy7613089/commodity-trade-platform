import { SearchParams, SearchResponse, SearchResult } from '@/types';

// 模拟搜索数据
const mockProducts: SearchResult[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: '最新的苹果手机，搭载 A17 Pro 芯片',
    price: 7999,
    imageUrl: '/images/products/iphone-15-pro.jpg',
    category: {
      id: '1-1',
      name: '智能手机',
      slug: 'smartphones'
    }
  },
  {
    id: '2',
    name: 'MacBook Pro 14"',
    description: '搭载 M2 Pro 芯片的专业笔记本',
    price: 14999,
    imageUrl: '/images/products/macbook-pro.jpg',
    category: {
      id: '1-2',
      name: '笔记本电脑',
      slug: 'laptops'
    }
  },
  // 添加更多模拟数据...
];

export async function searchProducts(params: SearchParams): Promise<SearchResponse> {
  // 在实际应用中，这里会调用后端API
  // 现在我们使用模拟数据进行前端搜索

  const {
    query,
    category,
    minPrice,
    maxPrice,
    sortBy = 'newest',
    page = 1,
    limit = 10
  } = params;

  // 过滤逻辑
  let results = [...mockProducts];

  // 关键词搜索
  if (query) {
    const searchQuery = query.toLowerCase();
    results = results.filter(product => 
      product.name.toLowerCase().includes(searchQuery) ||
      product.description.toLowerCase().includes(searchQuery)
    );
  }

  // 分类过滤
  if (category) {
    results = results.filter(product => 
      product.category.slug === category
    );
  }

  // 价格范围过滤
  if (minPrice !== undefined) {
    results = results.filter(product => product.price >= minPrice);
  }
  if (maxPrice !== undefined) {
    results = results.filter(product => product.price <= maxPrice);
  }

  // 排序
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      // 在实际应用中，这里会按创建时间排序
      break;
  }

  // 分页
  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  results = results.slice(start, end);

  return {
    results,
    total,
    page,
    limit,
    totalPages
  };
} 