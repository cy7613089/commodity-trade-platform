"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdminProductStore, Product } from "@/lib/store/admin-product-store";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle, ChevronLeft, ChevronRight, Edit, Plus, Trash } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// 定义初始商品表单数据
const initialProductForm = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  originalPrice: 0,
  stock: 0,
  images: [] as string[],
  is_featured: false,
  status: 'active' as 'active' | 'inactive'
};

// 定义商品表单类型，确保与初始表单结构一致
interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  images: string[];
  is_featured: boolean;
  status: 'active' | 'inactive';
}

export default function AdminProductsPage() {
  const { 
    products, 
    loading, 
    error, 
    pagination, 
    fetchProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct 
  } = useAdminProductStore();
  
  const [mounted, setMounted] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [formData, setFormData] = useState<ProductForm>(initialProductForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    // 获取商品数据，使用当前页码
    fetchProducts({ page: currentPage });
  }, [fetchProducts, currentPage]);
  
  // 表单提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = '商品名称不能为空';
    }
    
    if (formData.price <= 0) {
      errors.price = '商品价格必须大于0';
    }
    
    if (formData.stock < 0) {
      errors.stock = '商品库存不能为负数';
    }
    
    setFormErrors(errors);
    
    // 如果有错误，不提交
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (editingProduct?.id) {
        // 更新商品
        await updateProduct(editingProduct.id, formData);
      } else {
        // 创建新商品
        await createProduct(formData);
        // 创建新商品后，将当前页码重置为1
        setCurrentPage(1);
      }
      
      // 关闭表单弹窗
      setFormOpen(false);
      // 重置表单数据
      setFormData(initialProductForm);
      setEditingProduct(null);
    } finally {
      setSubmitting(false);
    }
  };
  
  // 处理表单字段变更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    console.log(`handleInputChange - name: ${name}, value: ${value}, type: ${type}`);
    
    if (type === 'number') {
      // 特殊处理originalPrice字段，因为它可能为空
      if (name === 'originalPrice' && value === '') {
        console.log(`Setting ${name} to null for empty input`);
        setFormData({
          ...formData,
          [name]: 0  // 设置为0而不是undefined，避免类型错误
        });
      } else {
        // 正确处理数字类型，不使用 || 0 操作符，避免0值被误判
        const parsedValue = value === '' ? 0 : parseFloat(value);
        console.log(`Setting ${name} to number: ${parsedValue}`);
        
        setFormData({
          ...formData,
          [name]: isNaN(parsedValue) ? 0 : parsedValue
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // 验证表单数据确实更新了
    setTimeout(() => {
      console.log('formData after update:', formData);
    }, 0);
  };
  
  // 处理图片URL输入
  const handleImagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const imagesText = e.target.value;
    
    // 将输入的图片URL按行分割
    const imagesArray = imagesText.split('\n').filter(url => url.trim() !== '');
    
    setFormData({
      ...formData,
      images: imagesArray
    });
  };
  
  // 处理状态选择
  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value as 'active' | 'inactive'
    });
  };
  
  // 编辑商品
  const handleEdit = (product: Product) => {
    // 根据需要格式化图片数组
    const images = product.images || [];
    
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price,
      originalPrice: product.originalPrice || 0,
      stock: product.stock,
      images: images,
      is_featured: product.is_featured || false,
      status: product.status
    });
    setFormOpen(true);
  };
  
  // 添加新商品
  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData(initialProductForm);
    setFormOpen(true);
  };
  
  // 处理分页
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProducts({ page: newPage });
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  // 获取首张图片
  const getFirstImage = (images?: string[]): string | undefined => {
    if (!images || images.length === 0) return undefined;
    return images[0];
  };
  
  // 加载骨架屏
  const TableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>图片</TableHead>
          <TableHead>名称</TableHead>
          <TableHead>价格</TableHead>
          <TableHead>原价</TableHead>
          <TableHead>库存</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>评分</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array(5).fill(0).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-10 w-10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  
  if (!mounted) {
    return <div className="container mx-auto py-10">加载中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/products">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="ml-4 text-3xl font-bold">商品管理</h1>
        </div>
        
        <Button onClick={handleAddNew} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          添加商品
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>获取商品失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : products.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>暂无商品</AlertTitle>
              <AlertDescription>
                当前没有商品数据，您可以点击"添加商品"按钮创建新商品。
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>图片</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>原价</TableHead>
                    <TableHead>库存</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>评分</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {getFirstImage(product.images) ? (
                          <img 
                            src={getFirstImage(product.images)} 
                            alt={product.name} 
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs">无图片</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>
                        {product.name}
                      </TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>{product.originalPrice ? formatPrice(product.originalPrice) : '-'}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.status === 'active' ? 'default' : 'secondary'}
                        >
                          {product.status === 'active' ? '上架中' : '已下架'}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.rating || '-'}</TableCell>
                      <TableCell>{formatDate(product.created_at)}</TableCell>
                      <TableCell>{formatDate(product.updated_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  您确定要删除商品 &ldquo;{product.name}&rdquo; 吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  确认删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 分页器 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center mt-6 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm">
                    第 {currentPage} 页，共 {pagination.totalPages} 页
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* 商品表单弹窗 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? '编辑商品' : '添加新商品'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? '修改商品信息' : '填写新商品的基本信息'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">商品名称 <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="输入商品名称"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
              </div>
              
              {/* 价格 */}
              <div className="space-y-2">
                <Label htmlFor="price">商品价格 <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="输入商品价格"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={formErrors.price ? "border-red-500" : ""}
                />
                {formErrors.price && <p className="text-red-500 text-sm">{formErrors.price}</p>}
              </div>
              
              {/* 原价 */}
              <div className="space-y-2">
                <Label htmlFor="originalPrice">原价（可选）</Label>
                <Input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="输入商品原价"
                  value={formData.originalPrice || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* 库存 */}
              <div className="space-y-2">
                <Label htmlFor="stock">库存 <span className="text-red-500">*</span></Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="输入商品库存"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className={formErrors.stock ? "border-red-500" : ""}
                />
                {formErrors.stock && <p className="text-red-500 text-sm">{formErrors.stock}</p>}
              </div>
              
              {/* 商品状态 */}
              <div className="space-y-2">
                <Label htmlFor="status">商品状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">上架中</SelectItem>
                    <SelectItem value="inactive">已下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 是否推荐 */}
              <div className="space-y-2 flex items-center gap-2">
                <Label htmlFor="is_featured">是否推荐</Label>
                <input
                  id="is_featured"
                  name="is_featured"
                  type="checkbox"
                  checked={!!formData.is_featured}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
            </div>
            
            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">商品描述</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="输入商品描述"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            {/* 图片URLs */}
            <div className="space-y-2">
              <Label htmlFor="images">商品图片URL（每行一个）</Label>
              <Textarea
                id="images"
                name="images"
                placeholder="输入图片URL，每行一个"
                value={(formData.images || []).join('\n')}
                onChange={handleImagesChange}
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '提交中...' : (editingProduct ? '保存修改' : '创建商品')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 