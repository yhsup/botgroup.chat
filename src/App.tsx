import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { 
  SignedIn, 
  SignedOut, 
  SignIn, 
  UserButton 
} from "@clerk/clerk-react";

/**
 * App 组件说明：
 * 1. 使用 <SignedOut> 拦截未登录状态，直接显示登录界面，保护私人内容。
 * 2. 使用 <SignedIn> 保护内部路由，只有验证通过的用户才能进入聊天室。
 * 3. 页面右上角集成了 <UserButton />，登录后你可以在这里点击 "Manage account" 
 * 进入 Security 选项手动绑定 Google Authenticator (2FA)。
 */
function App() {
  console.log("App rendering: Private access mode active");

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
                  footerActionLink: 'hidden', // 隐藏底部的“注册”建议（如果你已在后台关闭注册）
                },
              }}
            />
          </div>
        </div>
      </SignedOut>

      {/* --- 情况 B: 用户已登录 --- */}
      <SignedIn>
        {/* 悬浮的管理按钮，方便你随时进入设置绑定 2FA 或修改资料 */}
        <div className="fixed top-4 right-4 z-[9999]">
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-10 h-10 border-2 border-white shadow-md'
              }
            }}
          />
        </div>
        
        {/* 正常的应用路由逻辑 */}
        <RouterProvider router={router} />
      </SignedIn>

      {/* --- 全局通知组件 --- */}
      <Toaster 
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
        theme="light"
      />
    </>
  );
}

export default App;
