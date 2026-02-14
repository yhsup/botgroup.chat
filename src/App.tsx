import { RouterProvider } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { router } from './routes';
import { 
  SignedIn, 
  SignedOut, 
  SignIn, 
  UserButton,
  useUser 
} from "@clerk/clerk-react";
import { CreateGroupModal } from './components/CreateGroupModal';
import { useState } from 'react';

function App() {
  console.log("App rendering: Private access mode active");
  
  const { user } = useUser();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  /**
   * 核心逻辑：处理新群聊的创建并存入 D1
   */
  const handleFinalCreateGroup = async (name: string, selectedIds: string[]) => {
    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          memberIds: selectedIds, // AI ID 数组
          userId: user?.id       // 绑定当前 Clerk 用户
        })
      });

      if (response.ok) {
        toast.success(`群聊 "${name}" 创建成功！`);
        setIsCreateGroupOpen(false);
        // 刷新页面或通过状态管理更新左侧列表
        window.location.reload(); 
      } else {
        const err = await response.json();
        toast.error(`创建失败: ${err.error}`);
      }
    } catch (error) {
      toast.error("网络异常，无法连接到 D1 数据库");
    }
  };

  return (
    <>
      {/* --- 情况 A: 用户未登录 --- */}
      <SignedOut>
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
          <div className="shadow-2xl rounded-xl overflow-hidden">
            <SignIn 
              routing="hash" 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-black hover:bg-gray-800 text-sm normal-case',
                  footerActionLink: 'hidden',
                },
              }}
            />
          </div>
        </div>
      </SignedOut>

      {/* --- 情况 B: 用户已登录 --- */}
      <SignedIn>
        {/* 右上角工具栏：包含用户头像和“新建群聊”快捷按钮 */}
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-3">
          {/* 新增：快速创建群聊按钮 */}
          <button 
            onClick={() => setIsCreateGroupOpen(true)}
            className="flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition-all active:scale-95"
            title="创建新群聊"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-10 h-10 border-2 border-white shadow-md'
              }
            }}
          />
        </div>
        
        {/* 应用路由 */}
        <RouterProvider router={router} />

        {/* 全局群聊创建弹窗 */}
        <CreateGroupModal 
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreate={handleFinalCreateGroup}
        />
      </SignedIn>

      {/* --- 全局通知组件 (Sonner) --- */}
      <Toaster 
        position="top-center"
        richColors
        closeButton
        theme="light"
      />
    </>
  );
}

export default App;
