"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { searchProducts } from '@/lib/services/search';
import { SearchResult } from '@/types';

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(async () => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchProducts({
        query: debouncedQuery,
        limit: 5 // 只显示前5个结果
      });
      setSearchResults(response.results);
    } catch (error) {
      console.error('搜索出错:', error);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    handleSearch();
  }, [debouncedQuery, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="搜索商品"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="pl-8 pr-10"
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
          disabled={isSearching}
        >
          {isSearching ? '搜索中...' : '搜索'}
        </Button>
      </form>

      {/* 搜索建议下拉框 */}
      {showResults && searchResults.length > 0 && (
        <div 
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-auto rounded-md border bg-background shadow-md"
          onMouseDown={(e) => e.preventDefault()} // 防止失焦
        >
          {searchResults.map((result) => (
            <button
              key={result.id}
              className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
              onClick={() => {
                router.push(`/products/${result.id}`);
                setShowResults(false);
              }}
            >
              <img 
                src={result.imageUrl} 
                alt={result.name}
                className="w-10 h-10 object-cover rounded"
              />
              <div>
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-muted-foreground">
                  ¥{result.price.toLocaleString()}
                </div>
              </div>
            </button>
          ))}
          {query && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-accent text-primary"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                setShowResults(false);
              }}
            >
              查看全部结果
            </button>
          )}
        </div>
      )}
    </div>
  );
} 