import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ChatUI from './components/ChatUI';

interface GroupDetail {
  id: string;
  name: string;
  member_ids: string; // D1 中存储的是逗号分隔的字符串 "ai7,custom_123"
}

export default function Chat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. 当路由中的 groupId 变化时，从后端获取群组详情
  useEffect(() => {
    if (!groupId) {
      setGroupInfo(null);
      return;
    }

    const fetchGroupDetail = async () => {
      setLoading(true);
      try {
        // 我们假设你有一个获取单一群组信息的接口
        const response = await fetch(`/api/groups/details?id=${groupId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("该群组不存在或已被删除");
            navigate('/chat'); // 跳回主页
          }
          throw new Error('获取群组信息失败');
        }

        const data = await response.json();
        setGroupInfo(data);
      } catch (error) {
        console.error("Fetch group detail error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetail();
  }, [groupId, navigate]);

  // 2. 如果正在加载
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">正在进入智囊团...</p>
        </div>
      </div>
    );
  }

  // 3. 如果没有 groupId (即在 /chat 路径下)
  if (!groupId) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50/30">
        <div className="text-center space-y-4">
          <div className="text-6xl">👋</div>
          <h2 className="text-xl font-bold text-gray-800">欢迎来到 AI 智囊团</h2>
          <p className="text-gray-400 max-w-xs mx-auto">
            请从左侧选择一个群聊开始对话，或者点击右上角按钮创建一个新的智囊团。
          </p>
        </div>
      </div>
    );
  }

  // 4. 将获取到的群组信息传给 ChatUI
  return (
    <ChatUI 
      key={groupId} // 重要：groupId 变化时强制重新渲染 ChatUI 以清理上一场聊天的状态
      groupId={groupId}
      groupName={groupInfo?.name || "未知群组"}
      memberIds={groupInfo?.member_ids.split(',') || []}
    />
  );
}
