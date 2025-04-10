-- 修改 coupon_application_order 表结构
-- 首先添加新列
ALTER TABLE IF EXISTS "public"."coupon_application_order" 
ADD COLUMN IF NOT EXISTS "order_config" jsonb;

-- 创建迁移函数，将旧的数据格式转换为新的
CREATE OR REPLACE FUNCTION migrate_coupon_application_order() RETURNS void AS $$
DECLARE
  old_record RECORD;
BEGIN
  -- 获取所有现有记录
  FOR old_record IN SELECT * FROM "public"."coupon_application_order" WHERE coupon_ids IS NOT NULL LOOP
    -- 创建一个空数组
    UPDATE "public"."coupon_application_order"
    SET order_config = '[]'::jsonb
    WHERE id = old_record.id;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 执行迁移函数
SELECT migrate_coupon_application_order();

-- 删除迁移函数
DROP FUNCTION migrate_coupon_application_order();

-- 完成迁移后不急于删除旧列，以防万一需要回滚
-- 可以在确认新结构正常工作后再删除
-- ALTER TABLE IF EXISTS "public"."coupon_application_order" 
-- DROP COLUMN IF EXISTS "coupon_ids"; 