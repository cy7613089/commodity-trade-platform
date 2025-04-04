-- 创建users表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'customer',
  email_verified BOOLEAN DEFAULT false,
  auth_provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 创建addresses表
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  street TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建RLS策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 用户表RLS策略
CREATE POLICY "用户可以查看和编辑自己的资料" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "管理员可以查看所有用户" ON public.users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 地址表RLS策略
CREATE POLICY "用户可以管理自己的地址" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "管理员可以查看所有地址" ON public.addresses
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 创建触发器函数，在用户注册时自动创建用户记录 (简化版)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入基本信息，暂时不处理 name 和 phone
  INSERT INTO public.users (id, email, email_verified, auth_provider, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL,
    NEW.provider,
    NEW.created_at
  );
  -- 尝试从元数据更新 name 和 phone (如果存在)
  UPDATE public.users
  SET 
    name = NEW.raw_user_meta_data->>'name',
    phone = NEW.raw_user_meta_data->>'phone'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 