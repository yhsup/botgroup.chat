import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";

function App() {
  console.log("App rendering with Clerk protection");

  return (
    <>
      {/* 1. 如果用户未登录：显示登录表单，并将其居中 */}
      <SignedOut>
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
          <SignIn 
            routing="hash" 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              },
            }}
          />
        </div>
      </SignedOut>

      {/* 2. 如果用户已登录：渲染受保护的路由和应用内容 */}
      <SignedIn>
        <RouterProvider router={router} />
      </SignedIn>

      {/* 3. 全局通知组件 */}
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
