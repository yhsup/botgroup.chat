/**
 * 后端接口：获取所有群聊列表
 * 路径：functions/api/groups/list.ts
 */

export async function onRequestGet({ env, request }) {
  try {
    // 1. 解析 URL 参数，尝试获取 userId 进行私有过滤
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // 2. 准备 SQL 语句
    // 如果传了 userId，则只查该用户的群；否则查全部（作为备份逻辑）
    let query = "SELECT * FROM chat_groups ORDER BY created_at DESC";
    let stmt;

    if (userId) {
      query = "SELECT * FROM chat_groups WHERE user_id = ? ORDER BY created_at DESC";
      stmt = env.DB.prepare(query).bind(userId);
    } else {
      stmt = env.DB.prepare(query);
    }

    // 3. 执行 D1 查询
    const { results } = await stmt.all();

    // 4. 返回响应
    return Response.json(results, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // 确保每次拿到的都是最新列表
      },
    });

  } catch (error: any) {
    console.error("D1 Fetch Groups Error:", error.message);
    return Response.json(
      { error: "无法从 D1 加载群聊列表" }, 
      { status: 500 }
    );
  }
}
