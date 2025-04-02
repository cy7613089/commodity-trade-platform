import { Category } from '@/types';

// 模拟商品分类数据
const mockCategories: Category[] = [
  {
    id: '1',
    name: '电子产品',
    slug: 'electronics',
    description: '最新的电子设备和小工具',
    children: [
      {
        id: '1-1',
        name: '智能手机',
        slug: 'smartphones',
        parentId: '1',
      },
      {
        id: '1-2',
        name: '笔记本电脑',
        slug: 'laptops',
        parentId: '1',
      },
      {
        id: '1-3',
        name: '配件',
        slug: 'accessories',
        parentId: '1',
        children: [
          {
            id: '1-3-1',
            name: '耳机',
            slug: 'headphones',
            parentId: '1-3',
          },
          {
            id: '1-3-2',
            name: '充电器',
            slug: 'chargers',
            parentId: '1-3',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '服装',
    slug: 'clothing',
    description: '各种风格的时尚服装',
    children: [
      {
        id: '2-1',
        name: '男装',
        slug: 'mens-clothing',
        parentId: '2',
      },
      {
        id: '2-2',
        name: '女装',
        slug: 'womens-clothing',
        parentId: '2',
      },
    ],
  },
  {
    id: '3',
    name: '家居用品',
    slug: 'home-goods',
    description: '让您的家更舒适的物品',
  },
  {
    id: '4',
    name: '书籍',
    slug: 'books',
    description: '各种类型的书籍',
  },
];

// 获取所有分类
export const getAllCategories = (): Category[] => {
  return mockCategories;
};

// 根据slug获取分类
export const getCategoryBySlug = (slug: string): Category | undefined => {
  const findCategory = (categories: Category[]): Category | undefined => {
    for (const category of categories) {
      if (category.slug === slug) {
        return category;
      }
      if (category.children) {
        const found = findCategory(category.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return findCategory(mockCategories);
}; 