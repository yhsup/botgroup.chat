import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Chat from './pages/chat';
import { AIManager } from './components/AIManager';
import BasicLayout from './layouts/BasicLayout';
import AuthGuard from './components/AuthGuard';

/**
 * 路由配置说明：
 * 1. /login: 登录页面。
 * 2. /: 根路径，受 AuthGuard 保护，使用 BasicLayout 布局。
 * 3. /chat: 默认聊天界面。
 * 4. /chat/:groupId: 动态群聊页面，根据 URL 中的 ID 加载 D1 数据库中的群组成员。
 * 5. /manager: AI 模型与角色配置管理后台。
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <BasicLayout />
      </AuthGuard>
    ),
    children: [
      {
        // 当用户访问域名根目录时，自动重定向到 chat
        path: '',
        element: <Navigate to="/chat" replace />,
      },
      {
        // 默认聊天页（可以是最近联系人或引导页）
        path: 'chat',
        element: <Chat />,
      },
      {
        // 动态群聊路由：
        // 这里的 :groupId 对应侧边栏点击后跳转的 ID（如 group_1712345678）
        path: 'chat/:groupId',
        element: <Chat />,
      },
      {
        // 自定义 AI 角色管理页面
        path: 'manager',
        element: (
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            <div className="container mx-auto py-10 px-4">
              <AIManager />
            </div>
          </div>
        ),
      },
    ],
  },
  {
    // 捕获所有未定义的路径并重定向回主页
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
