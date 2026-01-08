'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserType = 'MEDICAL_STAFF' | 'NON_MEDICAL';
type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('register');
  const [userType, setUserType] = useState<UserType>('MEDICAL_STAFF');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    hospital: '',
    department: '',
    title: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        // 注册
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
            password: formData.password,
            userType,
            ...(userType === 'MEDICAL_STAFF' && {
              hospital: formData.hospital,
              department: formData.department,
              title: formData.title,
            }),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '注册失败');
        }

        // 保存 token
        localStorage.setItem('token', data.data.token);
        router.push('/');
      } else {
        // 登录
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: formData.phone || formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '登录失败');
        }

        // 保存 token
        localStorage.setItem('token', data.data.token);
        router.push('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto relative">
      <div className="absolute inset-0 bg-pattern pointer-events-none opacity-5"></div>
      
      <div className="p-8 pt-12 relative z-10">
        <Link href="/" className="absolute top-6 left-6 p-2 -ml-2 text-gray-400 hover:text-dark">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>

        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-bold text-dark mb-1">欢迎加入</h1>
          <h1 className="text-2xl font-bold text-brand mb-2">稻田蛙声学院</h1>
          <p className="text-xs text-sub">Medical Continuing Education Platform</p>
        </div>

        {/* 登录/注册切换 */}
        <div className="bg-gray-50 p-1 rounded-lg flex mb-6 border border-gray-100">
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm rounded-md transition-all ${
              mode === 'register'
                ? 'bg-white text-brand shadow-sm font-bold'
                : 'text-sub'
            }`}
          >
            注册
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm rounded-md transition-all ${
              mode === 'login'
                ? 'bg-white text-brand shadow-sm font-bold'
                : 'text-sub'
            }`}
          >
            登录
          </button>
        </div>

        {/* 身份切换（仅注册时显示） */}
        {mode === 'register' && (
          <div className="bg-gray-50 p-1 rounded-lg flex mb-6 border border-gray-100">
            <button
              onClick={() => setUserType('MEDICAL_STAFF')}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${
                userType === 'MEDICAL_STAFF'
                  ? 'bg-white text-brand shadow-sm font-bold'
                  : 'text-sub'
              }`}
            >
              医护人员
            </button>
            <button
              onClick={() => setUserType('NON_MEDICAL')}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${
                userType === 'NON_MEDICAL'
                  ? 'bg-white text-brand shadow-sm font-bold'
                  : 'text-sub'
              }`}
            >
              非医务人员
            </button>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-dark mb-1.5 ml-1">
              {mode === 'register' ? '姓名' : '账号'}
            </label>
            <input
              type="text"
              value={mode === 'register' ? formData.name : (formData.phone || formData.email)}
              onChange={(e) => {
                if (mode === 'register') {
                  setFormData({ ...formData, name: e.target.value });
                } else {
                  // 登录时判断是手机号还是邮箱
                  if (/^1[3-9]\d{9}$/.test(e.target.value)) {
                    setFormData({ ...formData, phone: e.target.value, email: '' });
                  } else {
                    setFormData({ ...formData, email: e.target.value, phone: '' });
                  }
                }
              }}
              placeholder={mode === 'register' ? '请输入真实姓名' : '手机号/邮箱'}
              className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm"
              required
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-dark mb-1.5 ml-1">手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="用于接收验证码"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm"
                  required
                />
              </div>

              {userType === 'MEDICAL_STAFF' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-dark mb-1.5 ml-1">所属医院</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.hospital}
                        onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                        placeholder="搜索医院名称"
                        className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 focus:border-brand outline-none text-sm"
                        required
                      />
                      <svg className="absolute right-3 top-3 text-gray-300 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-dark mb-1.5 ml-1">科室</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="如：普外科"
                        className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 focus:border-brand outline-none text-sm"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-dark mb-1.5 ml-1">职称</label>
                      <select
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 focus:border-brand outline-none text-sm text-dark appearance-none"
                        required
                      >
                        <option value="">请选择</option>
                        <option>住院医师</option>
                        <option>主治医师</option>
                        <option>副主任医师</option>
                        <option>主任医师</option>
                        <option>护师/护士</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-dark mb-1.5 ml-1">
              {mode === 'register' ? '设置密码' : '密码'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={mode === 'register' ? '6-20位字符' : '请输入密码'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-3.5 bg-brand text-white font-bold rounded-lg shadow-lg shadow-brand/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? '处理中...' : mode === 'register' ? '立即注册并登录' : '登录'}</span>
            {!loading && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>

          {mode === 'register' && (
            <p className="text-center text-xs text-sub mt-4">
              点击注册即代表同意{' '}
              <a href="#" className="text-brand underline">用户协议</a> 与{' '}
              <a href="#" className="text-brand underline">隐私政策</a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
