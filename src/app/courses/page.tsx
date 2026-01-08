'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/courses/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('获取分类失败', error);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'all' 
        ? '/api/courses?page=1&pageSize=20&status=PUBLISHED'
        : `/api/courses?page=1&pageSize=20&status=PUBLISHED&categoryId=${selectedCategory}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('获取课程列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="w-full max-w-md mx-auto min-h-screen bg-bg">
        <header className="px-6 pt-10 pb-2 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <h2 className="text-lg font-bold text-dark">课程中心</h2>
        </header>

        <main className="px-6 py-4">
          {/* 分类筛选 */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-brand text-white'
                  : 'bg-white text-dark'
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-brand text-white'
                    : 'bg-white text-dark'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* 课程列表 */}
          {loading ? (
            <div className="text-center py-10 text-sub">加载中...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-10 text-sub">暂无课程</div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-white p-3 rounded-lg flex gap-4 shadow-card active:scale-[0.99] transition-transform border border-gray-50 block"
                >
                  <div className="w-24 h-20 rounded-md bg-gray-200 shrink-0 overflow-hidden">
                    <img
                      src={course.cover || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <h4 className="font-bold text-sm text-dark leading-snug">{course.title}</h4>
                    <div className="flex justify-between items-center text-xs text-sub">
                      <span>{course.author?.nickname || '未知讲师'}</span>
                      <span className="text-brand bg-brand/5 px-2 py-0.5 rounded text-[10px]">
                        {course.isFree ? '免费' : `¥${course.price}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
