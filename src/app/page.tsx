/**
 * 首页
 * 业务逻辑预留在此实现
 */

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          稻田蛙声学院
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          医生内容平台 - 论坛、课程、付费功能
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">论坛</h2>
            <p className="text-gray-600">
              医生交流与讨论的专业平台
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">课程</h2>
            <p className="text-gray-600">
              专业医学知识与技能培训
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">付费功能</h2>
            <p className="text-gray-600">
              订阅、咨询等增值服务
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">开发提示</h3>
          <p className="text-gray-700">
            这是项目骨架的首页。所有业务逻辑应在 <code className="bg-white px-2 py-1 rounded">/src/modules</code> 目录中实现。
          </p>
        </div>
      </div>
    </main>
  );
}
