/**
 * 后端接口：获取特定群聊详情
 * 路径：functions/api/groups/details.ts
 */

export async function onRequestGet({ env, request }) {
  try {
    // 1. 从 URL 查询参数中获取群组 ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: "缺少群组 ID 参数" }, { status: 400 });
    }

    // 2. 在 D1 数据库中查找该群组
    // 假设你的表名是 chat_groups，绑定名为 DB
    const group = await env.DB.prepare(
      "SELECT id, name, member_ids, user_id FROM chat_groups WHERE id = ?"
    )
    .bind(id)
    .first();

    // 3. 如果没找到，返回 404
    if (!group) {
      return Response.json({ error: "未找到该群组配置" }, { status: 404 });
    }

    // 4. 返回群组数据
    return Response.json(group, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // 详情页也不建议缓存，确保数据实时
      }
    });

  } catch (error: any) {
    console.error("D1 Fetch Group Detail Error:", error.message);
    return Response.json(
      { error: "数据库查询失败: " + error.message }, 
      { status: 500 }
    );
  }
}
