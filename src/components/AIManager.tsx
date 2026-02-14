import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save, UserPlus } from 'lucide-react';

export const AIManager = () => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取所有 AI 角色
  const fetchCharacters = async () => {
    try {
      const res = await fetch('/api/characters/all');
      const data = await res.json();
      setCharacters(data);
    } catch (err) {
      toast.error("获取角色列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharacters(); }, []);

  const handleAddCharacter = () => {
    const newChar = {
      id: `custom_${Date.now()}`,
      name: "新 AI 助手",
      model: "@cf/meta/llama-3-8b-instruct",
      personality: "helpful",
      custom_prompt: "你是一个专业的助手。"
    };
    setCharacters([...characters, newChar]);
  };

  const handleDelete = async (id: string) => {
    // 实际项目中这里应调用 API 删除 D1 数据
    setCharacters(characters.filter(c => c.id !== id));
    toast.success("已移除角色（预览）");
  };

  if (loading) return <div className="p-8 text-center">加载配置中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI 角色管理</h2>
          <p className="text-gray-500 text-sm">配置群组中可用的 AI 智囊成员</p>
        </div>
        <Button onClick={handleAddCharacter} className="gap-2">
          <Plus className="w-4 h-4" /> 添加自定义 AI
        </Button>
      </div>

      <div className="grid gap-4">
        {characters.map((char) => (
          <div key={char.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 space-y-2 w-full">
              <div className="flex gap-2">
                <Input 
                  value={char.name} 
                  onChange={(e) => {/* 处理修改逻辑 */}}
                  className="font-bold w-full md:w-1/3"
                />
                <span className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center">{char.model}</span>
              </div>
              <Input 
                value={char.custom_prompt} 
                className="text-sm text-gray-600"
                placeholder="自定义系统提示词 (System Prompt)"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <Button variant="outline" size="icon"><Save className="w-4 h-4" /></Button>
              <Button variant="destructive" size="icon" onClick={() => handleDelete(char.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
