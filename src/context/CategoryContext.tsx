import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { CategoryItem } from '../types';
import {
  subscribeCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  INITIAL_CATEGORIES,
} from '../services/categoryService';

interface CategoryContextType {
  categories: CategoryItem[];
  activeCategories: CategoryItem[];
  loading: boolean;
  addCategory: (cat: Omit<CategoryItem, 'id'>) => Promise<CategoryItem>;
  editCategory: (id: string, updates: Partial<CategoryItem>, oldCategoryName?: string) => Promise<void>;
  removeCategory: (id: string, categoryName: string, fallbackCategory?: string) => Promise<void>;
  getCategoryByName: (name: string) => CategoryItem | undefined;
}

const CategoryContext = createContext<CategoryContextType>({
  categories: INITIAL_CATEGORIES,
  activeCategories: INITIAL_CATEGORIES,
  loading: true,
  addCategory: async () => INITIAL_CATEGORIES[0],
  editCategory: async () => {},
  removeCategory: async () => {},
  getCategoryByName: () => undefined,
});

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const cached = localStorage.getItem('studio_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CATEGORIES;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = subscribeCategories((list) => {
      setCategories(list);
      setLoading(false);
      try {
        localStorage.setItem('studio_categories', JSON.stringify(list));
      } catch (e) {}
    });

    return () => unsub();
  }, []);

  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.status !== 'inactive');
  }, [categories]);

  const addCategoryHandler = async (cat: Omit<CategoryItem, 'id'>): Promise<CategoryItem> => {
    const created = await createCategory(cat);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const editCategoryHandler = async (
    id: string,
    updates: Partial<CategoryItem>,
    oldCategoryName?: string
  ): Promise<void> => {
    await updateCategory(id, updates, oldCategoryName);
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
  };

  const removeCategoryHandler = async (
    id: string,
    categoryName: string,
    fallbackCategory = 'General'
  ): Promise<void> => {
    await deleteCategory(id, categoryName, fallbackCategory);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const getCategoryByName = (name: string): CategoryItem | undefined => {
    if (!name) return undefined;
    const lower = name.trim().toLowerCase();
    return categories.find(
      (c) => c.name.toLowerCase() === lower || c.slug.toLowerCase() === lower
    );
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        activeCategories,
        loading,
        addCategory: addCategoryHandler,
        editCategory: editCategoryHandler,
        removeCategory: removeCategoryHandler,
        getCategoryByName,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);
