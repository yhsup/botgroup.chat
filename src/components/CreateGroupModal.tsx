import React, { useState, useEffect } from 'react';

interface AICharacter {
  id: string;
  name: string;
  model: string;
  avatar?: string;
  isCustom?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // 当点击创建时，将群名和选中的 AI ID 数组传回父组件
  onCreate: (name: string, selectedIds: string[]) => void;
}

export const CreateGroupModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [bots, setBots] = useState<AICharacter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 弹窗打开时加载 AI 列表
  useEffect(() => {
    if (isOpen) {
      fetchBots();
    }
  }, [isOpen]);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/characters/all');
      const data = await res.json();
      setBots(data);
    } catch (err) {
      console.error("加载 AI 列表失败", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) return alert("请输入群名");
    if (selectedIds.length === 0) return alert("请至少选择一个 AI");
    onCreate(groupName, selectedIds);
    setGroupName('');
    setSelectedIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-black text-gray-900">发起新群聊</h2>
          <p className="text-sm text-gray-400 mt-1">给你的 AI 智囊团起个名字并挑选成员</p>
        </div>

        {/* Form Area */}
        <div className="px-8 space-y-6 overflow-y-auto flex-1 pb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">群聊名称</label>
            <input 
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="如：灵感碰撞组"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
              选择成员 {loading && "(同步中...)"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {bots.map(bot => (
                <button
                  key={bot.id}
                  onClick={() => toggleBot(bot.id)}
                  className={`flex items-center p-3 rounded-2xl border-2 transition-all ${
                    selectedIds.includes(bot.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <img 
                    src={bot.avatar || '/img/default-ai.png'} 
                    className="w-8 h-8 rounded-full bg-gray-200"
                    alt="" 
                  />
                  <div className="ml-3 text-left overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 truncate">{bot.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{bot.isCustom ? '自定义' : '内置'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 pt-4 border-t border-gray-50">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
            >
              取消
            </button>
            <button 
              onClick={handleCreate}
              className="flex-[2] py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
            >
              立即创建
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
