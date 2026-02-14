import React, { useState, useRef, useEffect } from 'react';
import { Send, Share2, Settings2, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { request } from '@/utils/request';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { SharePoster } from '@/pages/chat/components/SharePoster';
import { MembersManagement } from '@/pages/chat/components/MembersManagement';
import Sidebar from './Sidebar'; // 注意：通常由父级管理，这里保留作为Props兼容
import { AdBanner, AdBannerMobile } from './AdSection';
import { useUserStore } from '@/store/userStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAvatarData } from '@/utils/avatar';

// KaTeX 样式定义
const KaTeXStyle = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .chat-message .katex-html { display: none; }
    .chat-message .katex { font: normal 1.1em KaTeX_Main, serif; line-height: 1.2; }
    .chat-message .katex-display { display: block; margin: 1em 0; text-align: center; }
    @import "katex/dist/katex.min.css";
  `}} />
);

interface ChatUIProps {
  groupId: string;
  groupName: string;
  memberIds: string[];
}

const ChatUI = ({ groupId, groupName, memberIds }: ChatUIProps) => {
  const userStore = useUserStore();
  const isMobile = useIsMobile();

  // 1. 状态管理
  const [groups, setGroups] = useState([]);
  const [groupAiCharacters, setGroupAiCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGroupDiscussionMode, setIsGroupDiscussionMode] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showAd, setShowAd] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [showPoster, setShowPoster] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // 响应式侧边栏状态
  useEffect(() => {
    if (isMobile !== undefined) setSidebarOpen(!isMobile);
  }, [isMobile]);

  // 2. 初始化群组与 AI 成员
  useEffect(() => {
    const initChat = async () => {
      setIsInitializing(true);
      setMessages([]); // 切换群组时清空消息
      
      try {
        // 获取所有可用 AI（包括 D1 自定义角色）
        const charRes = await fetch('/api/characters/all');
        const allCharacters = await charRes.json();
        
        // 过滤出属于当前群组的 AI
        const currentGroupAIs = allCharacters.filter((c: any) => 
          memberIds.includes(c.id)
        );

        setGroupAiCharacters(currentGroupAIs);
        
        // 构建当前房间的用户列表 (User + AIs)
        const currentUser = {
          id: 'user',
          name: userStore.userInfo?.nickname || '我',
          avatar: userStore.userInfo?.avatar_url || null
        };

        setUsers([currentUser, ...currentGroupAIs]);
        
        // 同时获取群聊列表供 Sidebar 使用
        const groupsRes = await fetch(`/api/groups/list?userId=${userStore.userInfo?.id || ''}`);
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          setGroups(groupsData);
        }

      } catch (error) {
        console.error("初始化聊天失败:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    if (groupId) initChat();
  }, [groupId, memberIds, userStore.userInfo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // 3. 发送消息核心逻辑
  const handleSendMessage = async () => {
    if (isLoading || !inputMessage.trim()) return;

    const currentInput = inputMessage;
    const userMessage = {
      id: Date.now(),
      sender: users[0],
      content: currentInput,
      isAI: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // 构建上下文
    let messageHistory = messages.map(msg => ({
      role: msg.isAI ? 'assistant' : 'user',
      content: `${msg.sender.name}: ${msg.content}`,
      name: msg.sender.name
    }));
    messageHistory.push({ role: 'user', content: `${users[0].name}: ${currentInput}`, name: users[0].name });

    // 确定哪些 AI 参与回答
    let targetAIs = groupAiCharacters.filter(ai => !mutedUsers.includes(ai.id));

    // 依次请求每一个 AI
    for (let i = 0; i < targetAIs.length; i++) {
      const ai = targetAIs[i];
      const aiMsgId = Date.now() + i + 100;

      // 在列表中占位
      const aiPlaceholder = {
        id: aiMsgId,
        sender: ai,
        content: "正在思考...",
        isAI: true
      };
      setMessages(prev => [...prev, aiPlaceholder]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            history: messageHistory,
            aiName: ai.name,
            personality: ai.personality,
            model: ai.model,
            custom_prompt: ai.custom_prompt || ""
          }),
        });

        if (!response.ok) throw new Error("API 请求失败");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    fullContent += data.content;
                    setMessages(prev => prev.map(m => 
                      m.id === aiMsgId ? { ...m, content: fullContent } : m
                    ));
                  }
                } catch (e) {}
              }
            }
          }
        }

        // 更新历史记录供下一个 AI 参考
        messageHistory.push({ role: 'assistant', content: `${ai.name}: ${fullContent}`, name: ai.name });

      } catch (err) {
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: "⚠️ 成员暂时无法回应" } : m
        ));
      }
      
      // AI 之间稍作停顿，更像群聊
      if (i < targetAIs.length - 1) await new Promise(r => setTimeout(r, 800));
    }

    setIsLoading(false);
  };

  const handleToggleMute = (userId: string) => {
    setMutedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <KaTeXStyle />
      <div className="flex h-full bg-white w-full relative overflow-hidden">
        {/* Sidebar 通常由 Layout 提供，这里根据你的项目结构渲染 */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b flex-none px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg">{groupName}</h1>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                {users.length} 成员
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 mr-2">
                {users.slice(0, 5).map((user) => (
                  <Avatar key={user.id} className="w-8 h-8 border-2 border-white ring-1 ring-gray-100">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback style={{ backgroundColor: getAvatarData(user.name).backgroundColor, color: 'white' }}>
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMembers(true)}>
                <Settings2 className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden bg-gray-50/50">
            <ScrollArea className="h-full px-4 py-6" ref={chatAreaRef}>
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="text-gray-400">群组已就绪，打个招呼吧！</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${message.isAI ? "" : "flex-row-reverse"}`}>
                    <Avatar className="w-9 h-9 flex-none shadow-sm">
                      <AvatarImage src={message.sender.avatar} />
                      <AvatarFallback style={{ backgroundColor: getAvatarData(message.sender.name).backgroundColor, color: 'white' }}>
                        {message.sender.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col max-w-[80%] ${message.isAI ? "" : "items-end"}`}>
                      <span className="text-xs text-gray-400 mb-1 px-1">{message.sender.name}</span>
                      <div className={`p-4 rounded-2xl shadow-sm chat-message ${
                        message.isAI ? "bg-white text-gray-800" : "bg-black text-white"
                      }`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                          className="prose prose-sm max-w-none break-words"
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowPoster(true)} disabled={messages.length === 0}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Input 
                placeholder={`在 ${groupName} 中发言...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 rounded-xl focus-visible:ring-black"
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()} className="rounded-xl bg-black hover:bg-gray-800">
                {isLoading ? <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MembersManagement 
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        users={users}
        mutedUsers={mutedUsers}
        handleToggleMute={handleToggleMute}
        isGroupDiscussionMode={isGroupDiscussionMode}
        onToggleGroupDiscussion={() => setIsGroupDiscussionMode(!isGroupDiscussionMode)}
        getAvatarData={getAvatarData}
      />

      <SharePoster 
        isOpen={showPoster}
        onClose={() => setShowPoster(false)}
        chatAreaRef={chatAreaRef}
      />
    </>
  );
};

export default ChatUI;
