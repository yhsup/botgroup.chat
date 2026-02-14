import OpenAI from 'openai';
import { modelConfigs } from '../../src/config/aiCharacters';

export async function onRequestPost({ env, request }) {
  try {
    // 增加 characterId 接收
    const { message, custom_prompt, history, aiName, index, model = "qwen-plus", characterId } = await request.json();
    
    let apiKey: string | undefined;
    let baseURL: string | undefined;
    let finalSystemPrompt = custom_prompt || "";

    // --- 1. 鉴权与配置加载逻辑 ---
    
    // 如果是自定义 AI (ID 以 custom_ 开头) 或不在内置配置中的 ID
    if (characterId && (characterId.startsWith('custom_') || !characterId.startsWith('ai'))) {
      const dbCharacter = await env.DB.prepare(
        "SELECT * FROM ai_characters WHERE id = ?"
      ).bind(characterId).first();

      if (!dbCharacter) {
        throw new Error('未找到自定义机器人配置');
      }

      apiKey = dbCharacter.api_key;
      baseURL = dbCharacter.base_url;
      // 如果 D1 里存了 prompt，则覆盖或作为基础
      if (dbCharacter.prompt) finalSystemPrompt = dbCharacter.prompt;
    } else {
      // 否则走内置模型逻辑 (从环境变量获取)
      const modelConfig = modelConfigs.find(config => config.model === model);
      if (!modelConfig) {
        throw new Error('不支持的模型类型');
      }

      apiKey = env[modelConfig.apiKey];
      baseURL = modelConfig.baseURL;
    }

    if (!apiKey) {
      throw new Error(`API密钥未配置或获取失败`);
    }

    // --- 2. 初始化 OpenAI 客户端 ---
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL
    });

    // --- 3. 注入全局约束 (你的核心规则) ---
    const systemPrompt = `${finalSystemPrompt}
注意重要：
1、你在群里叫"${aiName}"，认准自己的身份；
2、你的输出内容不要加"${aiName}："这种多余前缀；
3、如果用户提出玩游戏，比如成语接龙等，严格按照游戏规则，不要说一大堆，要简短精炼;
4、保持群聊风格，字数严格控制在50字以内，越简短越好（新闻总结类除外）`;

    // --- 4. 构建消息历史 ---
    const baseMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), 
    ];
    
    const userMessage = { role: "user", content: message };
    if (index === 0) {
      baseMessages.push(userMessage);
    } else {
      baseMessages.splice(baseMessages.length - index, 0, userMessage);
    }

    // --- 5. 执行流式请求 ---
    const stream = await openai.chat.completions.create({
      model: model,
      messages: baseMessages,
      stream: true,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
          console.error('Stream Error:', error.message);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
