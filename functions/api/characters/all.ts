import { BUILT_IN_CHARACTERS } from '../../../src/config/aiCharacters';

export async function onRequestGet({ env }) {
  try {
    // 1. 从 D1 数据库查询所有自定义 AI
    const { results } = await env.DB.prepare(
      "SELECT id, name, model, avatar, prompt as custom_prompt FROM ai_characters"
    ).all();

    // 2. 格式化数据，确保前端渲染一致性
    const builtIn = BUILT_IN_CHARACTERS.map(c => ({ 
      ...c, 
      isCustom: false 
    }));

    const custom = results.map(c => ({ 
      ...c, 
      isCustom: true 
    }));

    // 3. 合并并返回
    return Response.json([...builtIn, ...custom], {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
