export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          originalPrice: number | null
          stock: number
          category_id: string | null
          images: Json | null
          specs: Json | null
          rating: number | null
          reviewCount: number | null
          is_featured: boolean | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price: number
          originalPrice?: number | null
          stock: number
          category_id?: string | null
          images?: Json | null
          specs?: Json | null
          rating?: number | null
          reviewCount?: number | null
          is_featured?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number
          originalPrice?: number | null
          stock?: number
          category_id?: string | null
          images?: Json | null
          specs?: Json | null
          rating?: number | null
          reviewCount?: number | null
          is_featured?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          image: string | null
          count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          image?: string | null
          count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          image?: string | null
          count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          avatar: string | null
          role: string
          email_verified: boolean
          auth_provider: string
          created_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          avatar?: string | null
          role?: string
          email_verified?: boolean
          auth_provider?: string
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          avatar?: string | null
          role?: string
          email_verified?: boolean
          auth_provider?: string
          created_at?: string
          last_login?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          recipient_name: string
          phone: string
          province: string
          city: string
          district: string | null
          street: string
          address: string
          postal_code: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipient_name: string
          phone: string
          province: string
          city: string
          district?: string | null
          street: string
          address: string
          postal_code?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipient_name?: string
          phone?: string
          province?: string
          city?: string
          district?: string | null
          street?: string
          address?: string
          postal_code?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // 其他表的类型定义可以按需添加
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 