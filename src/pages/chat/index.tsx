import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ChatUI from './components/ChatUI';
import { request } from '@/utils/request';

interface GroupDetail {
  id: string;
  name: string;
  member_ids: string; // 数据库存储格式为 "ai1,ai2,custom_3"
}

export default function Chat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 如果没有 groupId，说明在 /chat 根路径，不进行查询
    if (!groupId) {
      setGroupInfo(null);
      return;
    }

    const fetchGroupDetail = async () => {
      setLoading(true);
      try {
        // 请求我们之前创建的 details.ts 接口
        const response = await request(`/api/groups/details?id=${groupId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("该群组不存在");
            navigate('/chat');
          }
          throw new Error('获取详情失败');
        }

        const groupData = await response.json();
        setGroupInfo(groupData);
      } catch (error) {
        console.error("Fetch group detail error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetail();
  }, [groupId, navigate]);

  // 1. 加载状态：防止页面闪烁或渲染空内容
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">正在连接智囊团...</p>
        </div>
      </div>
    );
  }

  // 2. 空白状态：当 URL 仅为 /chat 时，显示欢迎提示
  if (!groupId) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50/30">
        <div className="text-center space-y-4 px-6">
          <div className="text-6xl animate-bounce">🤖</div>
          <h2 className="text-xl font-bold text-gray-800">欢迎来到 AI 智囊团</h2>
          <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
            请从左侧侧边栏选择一个群聊开始对话，或者点击“新建”创建一个专属的 AI 研讨组。
          </p>
        </div>
      </div>
    );
  }

  // 3. 正常状态：将 D1 数据库的数据传给 ChatUI
  // 注意这里的 key={groupId}，这是确保切换群组时组件彻底刷新的关键
  return (
    <ChatUI 
      key={groupId}
      groupId={groupId}
      groupName={groupInfo?.name || "加载中..."}
      memberIds={groupInfo?.member_ids ? groupInfo.member_ids.split(',') : []}
    />
  );
}
