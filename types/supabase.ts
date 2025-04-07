export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string
          city: string
          created_at: string | null
          district: string | null
          id: string
          is_default: boolean | null
          phone: string
          postal_code: string | null
          province: string
          recipient_name: string
          street: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          district?: string | null
          id?: string
          is_default?: boolean | null
          phone: string
          postal_code?: string | null
          province: string
          recipient_name: string
          street: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          district?: string | null
          id?: string
          is_default?: boolean | null
          phone?: string
          postal_code?: string | null
          province?: string
          recipient_name?: string
          street?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          selected: boolean | null
          updated_at: string | null
        }
        Insert: {
          cart_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          selected?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cart_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          selected?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string | null
          id: string
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_rules: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          id: string
          priority: number | null
          rule_type: string
          rule_value: Json
          updated_at: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          priority?: number | null
          rule_type: string
          rule_value: Json
          updated_at?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          priority?: number | null
          rule_type?: string
          rule_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_rules_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          color: string | null
          coupon_rule: Json | null
          created_at: string | null
          description: string | null
          discount_type: string
          end_date: string
          icon: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_purchase: number | null
          name: string
          start_date: string
          type: string
          updated_at: string | null
          usage_limit: number | null
          value: number
        }
        Insert: {
          code: string
          color?: string | null
          coupon_rule?: Json | null
          created_at?: string | null
          description?: string | null
          discount_type: string
          end_date: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name: string
          start_date: string
          type: string
          updated_at?: string | null
          usage_limit?: number | null
          value: number
        }
        Update: {
          code?: string
          color?: string | null
          coupon_rule?: Json | null
          created_at?: string | null
          description?: string | null
          discount_type?: string
          end_date?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          order_id: string | null
          original_price: number | null
          price: number
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          order_id?: string | null
          original_price?: number | null
          price: number
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          subtotal: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          order_id?: string | null
          original_price?: number | null
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          created_at: string | null
          delivered_at: string | null
          discount_amount: number | null
          final_amount: number
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_fee: number | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          final_amount: number
          id?: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_fee?: number | null
          status: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          final_amount?: number
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_fee?: number | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          images: Json | null
          is_anonymous: boolean | null
          order_id: string | null
          product_id: string | null
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          is_anonymous?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          is_anonymous?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          is_featured: boolean | null
          name: string
          originalprice: number | null
          price: number
          rating: number | null
          reviewcount: number | null
          slug: string
          specs: Json | null
          status: string | null
          stock: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          name: string
          originalprice?: number | null
          price: number
          rating?: number | null
          reviewcount?: number | null
          slug: string
          specs?: Json | null
          status?: string | null
          stock: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          name?: string
          originalprice?: number | null
          price?: number
          rating?: number | null
          reviewcount?: number | null
          slug?: string
          specs?: Json | null
          status?: string | null
          stock?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_coupons: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          expired_at: string | null
          id: string
          is_used: boolean | null
          status: string | null
          used_at: string | null
          used_order_id: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          expired_at?: string | null
          id?: string
          is_used?: boolean | null
          status?: string | null
          used_at?: string | null
          used_order_id?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          expired_at?: string | null
          id?: string
          is_used?: boolean | null
          status?: string | null
          used_at?: string | null
          used_order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_used_order_id_fkey"
            columns: ["used_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_provider: string | null
          avatar: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          id: string
          last_login: string | null
          name: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          id: string
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          id?: string
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user_api: {
        Args: {
          p_id: string
          p_email: string
          p_name: string
          p_phone: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
