import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquareIcon, PlusCircleIcon, MenuIcon, PanelLeftCloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import GitHubButton from 'react-github-btn';
import '@fontsource/audiowide';
import { UserSection } from './UserSection';

// 定义群组接口
interface Group {
  id: string;
  name: string;
}

// 根据群组ID生成固定的随机颜色
const getRandomColor = (id: string | number) => {
  const colors = ['blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'red', 'orange', 'teal'];
  const seed = id.toString();
  const hashCode = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return colors[Math.abs(hashCode) % colors.length];
};

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  selectedGroupIndex?: number;
  onSelectGroup?: (index: number) => void;
  groups: Group[];
  // 新增：点击“创建新群聊”时的回调，通常由 App.tsx 传入以打开 Modal
  onCreateNewGroup?: () => void;
}

const Sidebar = ({ 
  isOpen, 
  toggleSidebar, 
  selectedGroupIndex = 0, 
  onSelectGroup, 
  groups,
  onCreateNewGroup 
}: SidebarProps) => {
  
  return (
    <>
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          "fixed md:relative z-20 h-full",
          isOpen ? "w-56 translate-x-0" : "w-0 md:w-16 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full border-r bg-background flex flex-col shadow-sm">
          {/* 头部控制栏 */}
          <div className="flex items-center justify-between px-3 py-4 border-b border-border/40">
            <span className={cn(
              "font-bold text-sm text-foreground/70 uppercase tracking-widest transition-all duration-200 whitespace-nowrap overflow-hidden",
              isOpen ? "opacity-100 max-w-full pl-2" : "opacity-0 max-w-0"
            )}>
              聊天群组
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className={cn(
                "text-muted-foreground hover:text-primary h-8 w-8",
                !isOpen && "mx-auto"
              )}
            >
              {isOpen ? <PanelLeftCloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
            <nav className="space-y-1">
              {/* 渲染来自 D1 数据库的群组列表 */}
              {groups.map((group, index) => {
                const color = getRandomColor(group.id);
                return (
                  <a 
                    key={group.id}
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectGroup?.(index);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all group",
                      !isOpen && "justify-center",
                      selectedGroupIndex === index 
                        ? "bg-primary/10 text-primary shadow-sm" 
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquareIcon 
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors",
                        selectedGroupIndex === index 
                          ? `text-${color}-500` 
                          : `text-gray-400 group-hover:text-${color}-500`
                      )} 
                    />
                    <span className={cn(
                      "transition-all duration-200 truncate",
                      isOpen ? "opacity-100 w-full" : "opacity-0 w-0 hidden md:hidden"
                    )}>
                      {group.name}
                    </span>
                  </a>
                );
              })}
              
              {/* 核心修改：真正的创建按钮 */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onCreateNewGroup?.(); // 触发打开 App.tsx 里的 Modal
                }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-xl px-3 py-3 text-sm font-medium transition-all hover:bg-amber-50 group mt-4 border border-dashed border-gray-200 hover:border-amber-200",
                  !isOpen && "justify-center"
                )}
              >
                <PlusCircleIcon className="h-5 w-5 flex-shrink-0 text-amber-500 group-hover:text-amber-600" />
                <span className={cn(
                  "transition-all duration-200 whitespace-nowrap overflow-hidden text-amber-600 font-bold",
                  isOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 hidden"
                )}>
                  发起新对话群
                </span>
              </button>
            </nav>
          </div>
          
          {/* 用户信息模块 (Clerk 集成) */}
          <UserSection isOpen={isOpen} />

          {/* 底部 Logo 和 GitHub 链接 */}
          <div className="px-4 py-6 border-t border-border/40 space-y-4 bg-gray-50/50">
            <div className="flex items-center">
              <span 
                style={{ fontFamily: 'Audiowide, system-ui', color: '#ff6600' }} 
                className={cn(
                  "transition-all duration-200 whitespace-nowrap overflow-hidden",
                  isOpen ? "text-xl" : "text-[8px] opacity-0"
                )}
              >
                botgroup.chat
              </span>
            </div>
            
            {isOpen && (
              <div className="h-8 overflow-hidden">
                <GitHubButton 
                  href="https://github.com/maojindao55/botgroup.chat"
                  data-color-scheme="no-preference: light; light: light; dark: light;"
                  data-size="large"
                  data-show-count="true"
                  aria-label="Star on GitHub"
                >
                  Star
                </GitHubButton>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
