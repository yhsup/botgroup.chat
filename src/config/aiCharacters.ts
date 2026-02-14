import React, { useState } from 'react';

// 定义表单数据结构
interface AIForm {
  name: string;
  model: string;
  apiKey: string;
  baseURL: string;
  prompt: string;
}

export const AIManager: React.FC = () => {
  // 初始化状态
  const [form, setForm] = useState<AIForm>({
    name: '',
    model: 'qwen-plus', // 默认推荐模型
    apiKey: '',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    prompt: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 通用输入处理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 保存到 D1 数据库
  const handleSave = async () => {
    // 基础校验
    if (!form.name || !form.apiKey || !form.model) {
      setStatusMsg({ type: 'error', text: '请填写名称、模型和 API Key' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const response = await fetch('/api/characters/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `custom_${Date.now()}`, // 生成基于时间戳的唯一 ID
          name: form.name,
          model: form.model,
          apiKey: form.apiKey,
          baseURL: form.baseURL,
          prompt: form.prompt,
          avatar: "/img/custom-bot.png" // 默认自定义头像
        })
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMsg({ type: 'success', text: '保存成功！该 AI 已加入你的私人库。' });
        // 重置表单关键字段
        setForm({
          name: '',
          model: 'qwen-plus',
          apiKey: '',
          baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          prompt: ''
        });
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || '网络连接失败' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2rem] border border-gray-100 shadow-xl space-y-8">
      {/* 头部标题 */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">配置自定义 AI</h2>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          输入的配置将加密同步至 Cloudflare D1 数据库。
          <br />内置机器人优先使用环境变量，自定义机器人通过此配置访问。
        </p>
      </div>

      <div className="space-y-6">
        {/* 第一行：名称与模型 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">机器人名称</label>
            <input 
              name="name"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
              placeholder="如：效率助手"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">模型名称 (Model ID)</label>
            <input 
              name="model"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 font-mono"
              placeholder="gpt-4o / qwen-plus"
              value={form.model}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">API KEY</label>
          <input 
            name="apiKey"
            type="password"
            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 font-mono"
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            value={form.apiKey}
            onChange={handleChange}
          />
        </div>

        {/* Base URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">接口代理地址 (BASE URL)</label>
          <input 
            name="baseURL"
            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 font-mono text-sm"
            placeholder="https://api.openai.com/v1"
            value={form.baseURL}
            onChange={handleChange}
          />
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">系统提示词 (SYSTEM PROMPT)</label>
          <textarea 
            name="prompt"
            className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 outline-none transition-all h-40 resize-none leading-relaxed"
            placeholder="定义你的 AI 的行为逻辑、身份和回复风格..."
            value={form.prompt}
            onChange={handleChange}
          />
        </div>

        {/* 状态提示 */}
        {statusMsg && (
          <div className={`p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
            statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* 提交按钮 */}
        <button 
          onClick={handleSave}
          disabled={isSubmitting}
          className={`group relative w-full py-4 rounded-2xl font-bold text-white transition-all overflow-hidden ${
            isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800 active:scale-[0.98]'
          }`}
        >
          <span className="relative z-10 flex items-center justify-center">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在同步云端...
              </>
            ) : '保存 AI 到私人库'}
          </span>
        </button>
      </div>
    </div>
  );
};
