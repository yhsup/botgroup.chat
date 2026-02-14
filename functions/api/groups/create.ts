/**
 * 后端接口：创建群聊并存入 D1 数据库
 * 路径：functions/api/groups/create.ts
 */

export async function onRequestPost({ env, request }) {
  try {
    // 1. 解析前端传来的数据
    const { name, memberIds, userId } = await request.json();

    // 2. 基础验证
    if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return Response.json(
        { error: "群聊名称和成员列表不能为空" }, 
        { status: 400 }
      );
    }

    // 3. 生成唯一 ID (用于路由跳转)
    const groupId = `group_${Date.now()}`;
    
    // 4. 将成员 ID 数组转换为逗号分隔的字符串存储在 D1 中
    // 例如：["ai7", "custom_123"] -> "ai7,custom_123"
    const memberIdsStr = memberIds.join(',');

    // 5. 执行 D1 插入操作
    // 确保你的 D1 绑定名称为 DB
    await env.DB.prepare(`
      INSERT INTO chat_groups (id, name, member_ids, user_id)
      VALUES (?, ?, ?, ?)
    `)
    .bind(groupId, name, memberIdsStr, userId || 'anonymous')
    .run();

    // 6. 返回成功响应
    return Response.json({ 
      success: true, 
      groupId, 
      message: "群聊已成功创建并同步至云端" 
    });

  } catch (error: any) {
    console.error("D1 Create Group Error:", error.message);
    return Response.json(
      { error: "数据库写入失败: " + error.message }, 
      { status: 500 }
    );
  }
}
