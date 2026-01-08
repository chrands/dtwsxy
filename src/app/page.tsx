'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  nickname: string;
  avatar?: string | null;
  userType: string;
  isMedicalVerified: boolean;
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [lives, setLives] = useState<any[]>([]);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo();
      fetchCourses();
      fetchLives();
    } else {
      fetchCourses(); // 未登录也可以查看课程列表
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?page=1&pageSize=6&status=PUBLISHED');
      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('获取课程列表失败', error);
    }
  };

  const fetchLives = async () => {
    try {
      const response = await fetch('/api/lives?page=1&pageSize=1&status=LIVE');
      if (response.ok) {
        const data = await response.json();
        setLives(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('获取直播列表失败', error);
    }
  };

  const checkAuth = (callback: () => void) => {
    if (isLoggedIn) {
      callback();
    } else {
      setShowLoginModal(true);
    }
  };

  const goToLogin = () => {
    setShowLoginModal(false);
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* 手机外壳样式 */}
      <div className="w-full max-w-md mx-auto min-h-screen sm:h-[850px] bg-bg relative shadow-2xl overflow-hidden flex flex-col sm:rounded-[24px] sm:border-[8px] sm:border-white">
        
        {/* 登录引导弹窗 */}
        {showLoginModal && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center px-8">
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
              onClick={() => setShowLoginModal(false)}
            />
            <div className="bg-white w-full max-w-[280px] rounded-xl p-5 relative z-10 shadow-xl">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center mb-3 mx-auto text-brand">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-center mb-1 text-dark">需要登录</h3>
              <p className="text-xs text-center text-sub mb-5 leading-relaxed">
                登录后即可观看完整手术教学视频及查看专家专栏。
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={goToLogin}
                  className="w-full py-2.5 bg-brand text-white text-sm font-bold rounded-lg shadow-sm active:bg-brand-dark transition-colors"
                >
                  立即登录/注册
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2.5 text-sub text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  暂不登录
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 主界面 */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-bg">
          {/* Header */}
          <header className="px-6 pt-10 pb-2 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-20">
            <div>
              <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                稻田蛙声学院
                {!isLoggedIn && (
                  <span className="text-[10px] bg-gray-100 text-sub px-2 py-0.5 rounded font-normal">
                    游客
                  </span>
                )}
              </h2>
            </div>
            <Link
              href={isLoggedIn ? '/profile' : '/login'}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sub cursor-pointer active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </header>

          {/* 首页内容 */}
          <div className="px-6 py-4 space-y-6">
            {/* Banner 区 */}
            {lives.length > 0 && (
              <div
                onClick={() => checkAuth(() => window.location.href = `/lives/${lives[0].id}`)}
                className="relative w-full aspect-[2/1] rounded-xl bg-dark overflow-hidden shadow-float active:scale-[0.99] transition-transform cursor-pointer"
              >
                <img
                  src={lives[0].cover || 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&w=800&q=80'}
                  alt={lives[0].title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded mb-2 inline-block">
                    LIVE 直播中
                  </span>
                  <h3 className="text-white font-bold">{lives[0].title}</h3>
                </div>
              </div>
            )}

            {/* 快捷入口 */}
            <div className="grid grid-cols-4 gap-4">
              <div
                onClick={() => checkAuth(() => window.location.href = '/profile?tab=checkin')}
                className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand shadow-sm border border-gray-50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-sub">签到</span>
              </div>
              <div
                onClick={() => checkAuth(() => window.location.href = '/courses/my/history')}
                className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-purple-500 shadow-sm border border-gray-50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-sub">回顾</span>
              </div>
              <div
                onClick={() => checkAuth(() => window.location.href = '/experts')}
                className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm border border-gray-50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-xs text-sub">专家</span>
              </div>
              <div
                onClick={() => checkAuth(() => window.location.href = '/resources')}
                className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-gray-50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xs text-sub">资料</span>
              </div>
            </div>

            {/* 精品课程列表 */}
            <div className="space-y-4">
              <h3 className="font-bold text-dark text-base">精品课程</h3>
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => checkAuth(() => window.location.href = `/courses/${course.id}`)}
                  className="bg-white p-3 rounded-lg flex gap-4 shadow-card active:scale-[0.99] transition-transform cursor-pointer border border-gray-50"
                >
                  <div className="w-24 h-20 rounded-md bg-gray-200 shrink-0 overflow-hidden relative">
                    <img
                      src={course.cover || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    {!isLoggedIn && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <h4 className="font-bold text-sm text-dark leading-snug">{course.title}</h4>
                    <div className="flex justify-between items-center text-xs text-sub">
                      <span>{course.author?.nickname || '未知讲师'}</span>
                      <span className="text-brand bg-brand/5 px-2 py-0.5 rounded text-[10px]">
                        去学习
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* 底部导航栏 */}
        <div className="absolute bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 h-[70px] flex justify-around items-center z-30 pb-1">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 w-16 transition-colors text-brand"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-[10px] font-medium">首页</span>
          </Link>
          <Link
            href="/courses"
            onClick={(e) => {
              if (!isLoggedIn) {
                e.preventDefault();
                setShowLoginModal(true);
              }
            }}
            className="flex flex-col items-center gap-1 w-16 transition-colors text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-medium">课程</span>
          </Link>
          <Link
            href={isLoggedIn ? '/profile' : '/login'}
            className="flex flex-col items-center gap-1 w-16 transition-colors text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium">我的</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
