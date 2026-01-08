'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileUser {
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface UserPointsSummary {
  availablePoints: number;
  totalPoints: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [points, setPoints] = useState<UserPointsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserInfo();
    fetchPoints();
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
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/points/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPoints(data.data);
      }
    } catch (error) {
      console.error('获取积分失败', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/check-in', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message || '签到成功');
        fetchPoints();
      } else {
        const data = await response.json();
        alert(data.error?.message || '签到失败');
      }
    } catch (error) {
      console.error('签到失败', error);
      alert('签到失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sub">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="w-full max-w-md mx-auto min-h-screen bg-bg">
        <header className="px-6 pt-10 pb-2 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <h2 className="text-lg font-bold text-dark">个人中心</h2>
          <Link href="/profile/settings" className="text-sub">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </header>

        <main className="px-6 py-4 space-y-6">
          {/* 用户信息 */}
          <div className="bg-white rounded-lg p-4 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand text-2xl font-bold">
                {user?.nickname?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-dark">{user?.nickname || '未设置昵称'}</h3>
                <p className="text-xs text-sub">{user?.email || user?.phone || '未绑定'}</p>
              </div>
            </div>
          </div>

          {/* 积分信息 */}
          <div className="bg-white rounded-lg p-4 shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-dark">我的积分</h3>
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-brand text-white text-sm font-bold rounded-lg"
              >
                签到
              </button>
            </div>
            <div className="text-2xl font-bold text-brand">
              {points?.availablePoints || 0}
            </div>
            <p className="text-xs text-sub mt-1">总积分: {points?.totalPoints || 0}</p>
          </div>

          {/* 功能菜单 */}
          <div className="space-y-2">
            <Link
              href="/courses/my/history"
              className="bg-white rounded-lg p-4 shadow-card flex items-center justify-between"
            >
              <span className="text-dark">观看历史</span>
              <svg className="w-5 h-5 text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/profile/favorites"
              className="bg-white rounded-lg p-4 shadow-card flex items-center justify-between"
            >
              <span className="text-dark">我的收藏</span>
              <svg className="w-5 h-5 text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/points/logs"
              className="bg-white rounded-lg p-4 shadow-card flex items-center justify-between"
            >
              <span className="text-dark">积分流水</span>
              <svg className="w-5 h-5 text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-white text-red-500 font-bold rounded-lg shadow-card"
          >
            退出登录
          </button>
        </main>
      </div>
    </div>
  );
}
