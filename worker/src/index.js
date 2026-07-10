const RESOURCES = {
  users: { table: "users", pk: "id", label: "管理员", publicColumns: ["id", "username", "role", "addtime"] },
  yonghu: { table: "yonghu", pk: "id", label: "用户", publicColumns: ["id", "addtime", "yonghuzhanghao", "yonghuxingming", "xingbie", "shouji", "touxiang"] },
  zhongshimeishi: { table: "zhongshimeishi", pk: "id", label: "中式美食" },
  waiguomeishi: { table: "waiguomeishi", pk: "id", label: "外国美食" },
  remencaipin: { table: "remencaipin", pk: "id", label: "热门菜品" },
  news: { table: "news", pk: "id", label: "资讯" },
  forum: { table: "forum", pk: "id", label: "论坛" },
  messages: { table: "messages", pk: "id", label: "留言" },
  storeup: { table: "storeup", pk: "id", label: "收藏" },
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request, env) });
      if (env.ASSETS && !url.pathname.startsWith("/api/") && url.pathname !== "/health") return env.ASSETS.fetch(request);

      if (url.pathname === "/health") {
        return json(request, env, result(true, "ok", { service: "ot-springbooth10zf-api", schema: schema(env), time: new Date().toISOString() }));
      }

      if (!url.pathname.startsWith("/api/")) return json(request, env, result(false, "API 路径不存在", null), 404);
      const body = await parseBody(request);
      const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
      if (parts[0] === "login") return json(request, env, await login(body, env));
      if (parts[0] === "summary") return json(request, env, await summary(env));

      const [resourceName, action = "list"] = parts;
      const resource = RESOURCES[resourceName];
      if (!resource) return json(request, env, result(false, "业务模块不存在", null), 404);
      return json(request, env, await handleResource(resourceName, resource, action, body, env));
    } catch (error) {
      return json(request, env, result(false, error.message || "服务异常", null), 500);
    }
  },
};

async function login(body, env) {
  const role = String(body.role || "admin").trim();
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();
  if (!username || !password) return result(false, "请输入账号和密码", null);

  if (role === "user") {
    const rows = await requestSupabase(env, "yonghu", { yonghuzhanghao: `eq.${username}`, mima: `eq.${password}`, limit: "1" });
    if (!rows.length) return result(false, "登录失败，请检查用户账号或密码", null);
    const user = sanitize("yonghu", rows[0]);
    return result(true, null, { ...user, username: user.yonghuzhanghao, displayName: user.yonghuxingming, role: "user", roleName: "普通用户" });
  }

  const rows = await requestSupabase(env, "users", { username: `eq.${username}`, password: `eq.${password}`, limit: "1" });
  if (!rows.length) return result(false, "登录失败，请检查管理员账号或密码", null);
  const user = sanitize("users", rows[0]);
  return result(true, null, { ...user, username: user.username, displayName: user.role || "管理员", role: "admin", roleName: "管理员" });
}

async function summary(env) {
  const [users, zhong, wai, hot, forum, messages, storeup, news] = await Promise.all([
    listRows(env, RESOURCES.yonghu),
    listRows(env, RESOURCES.zhongshimeishi),
    listRows(env, RESOURCES.waiguomeishi),
    listRows(env, RESOURCES.remencaipin),
    listRows(env, RESOURCES.forum),
    listRows(env, RESOURCES.messages),
    listRows(env, RESOURCES.storeup),
    listRows(env, RESOURCES.news),
  ]);
  return result(true, null, {
    users: users.length,
    zhongshimeishi: zhong.length,
    waiguomeishi: wai.length,
    remencaipin: hot.length,
    forum: forum.length,
    messages: messages.length,
    storeup: storeup.length,
    news: news.length,
    latestDishes: [...zhong.slice(-3), ...wai.slice(-2)].reverse(),
  });
}

async function handleResource(resourceName, resource, action, body, env) {
  if (action === "list") return result(true, null, sanitizeRows(resourceName, await listRows(env, resource)));
  if (action === "get") {
    const id = body[resource.pk] ?? body.id;
    const rows = await requestSupabase(env, resource.table, { [resource.pk]: `eq.${id}`, limit: "1" });
    return result(!!rows.length, rows.length ? null : `${resource.label}不存在`, sanitize(resourceName, rows[0] || null));
  }
  if (action === "add") {
    const payload = normalize(resourceName, resource, body, "add");
    const rows = await requestSupabase(env, resource.table, {}, { method: "POST", body: payload });
    return result(true, `添加${resource.label}成功`, sanitize(resourceName, rows[0] || null));
  }
  if (action === "update" || action === "edit") {
    const id = body[resource.pk] ?? body.id;
    if (id === undefined || id === null || id === "") return result(false, `${resource.label}编号不能为空`, null);
    const payload = normalize(resourceName, resource, body, "update");
    delete payload[resource.pk];
    const rows = await requestSupabase(env, resource.table, { [resource.pk]: `eq.${id}` }, { method: "PATCH", body: payload });
    return result(true, `修改${resource.label}成功`, sanitize(resourceName, rows[0] || null));
  }
  if (action === "delete" || action === "remove") {
    const id = body[resource.pk] ?? body.id;
    if (id === undefined || id === null || id === "") return result(false, `${resource.label}编号不能为空`, null);
    await requestSupabase(env, resource.table, { [resource.pk]: `eq.${id}` }, { method: "DELETE" });
    return result(true, `删除${resource.label}成功`, null);
  }
  return result(false, "动作不存在", null);
}

async function listRows(env, resource) {
  return requestSupabase(env, resource.table, { order: `${resource.pk}.asc` });
}

function normalize(resourceName, resource, body, mode) {
  const payload = { ...body };
  if (mode === "add") delete payload[resource.pk];
  payload.addtime ||= new Date().toISOString();
  if (resourceName === "yonghu") {
    payload.mima ||= "demo123";
    payload.xingbie ||= "男";
  }
  if (["zhongshimeishi", "waiguomeishi"].includes(resourceName)) {
    payload.sfsh ||= "是";
    payload.thumbsupnum = Number(payload.thumbsupnum || 0);
    payload.crazilynum = Number(payload.crazilynum || 0);
    payload.clicknum = Number(payload.clicknum || 0);
  }
  if (resourceName === "remencaipin") {
    payload.faburiqi ||= new Date().toISOString().slice(0, 10);
    payload.thumbsupnum = Number(payload.thumbsupnum || 0);
    payload.crazilynum = Number(payload.crazilynum || 0);
  }
  if (resourceName === "forum") {
    payload.userid = Number(payload.userid || 11);
    payload.username ||= "11";
    payload.parentid = Number(payload.parentid || 0);
    payload.isdone ||= "开放";
  }
  if (resourceName === "messages") {
    payload.userid = Number(payload.userid || 11);
    payload.username ||= "11";
  }
  if (resourceName === "storeup") {
    payload.userid = Number(payload.userid || 11);
    payload.type ||= "1";
  }
  return payload;
}

async function requestSupabase(env, table, query = {}, options = {}) {
  const base = cleanEnv(env.SUPABASE_URL);
  const key = cleanEnv(env.SUPABASE_SERVICE_ROLE_KEY);
  if (!base || !key) throw new Error("Worker 缺少 Supabase 环境变量");
  const url = `${base.replace(/\/$/, "")}/rest/v1/rpc/ot_springbooth10zf_rest`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      p_table_name: table,
      p_method: options.method || "GET",
      p_query: query,
      p_payload: options.body || {},
    }),
  });
  if (!response.ok) throw new Error(`Supabase 请求失败: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

function sanitizeRows(resourceName, rows) {
  return rows.map((row) => sanitize(resourceName, row));
}

function sanitize(resourceName, row) {
  if (!row) return row;
  const safe = { ...row };
  if (resourceName === "users") delete safe.password;
  if (resourceName === "yonghu") delete safe.mima;
  return safe;
}

function schema(env) {
  return cleanEnv(env.SUPABASE_SCHEMA) || "ot_springbooth10zf";
}

function cleanEnv(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

async function parseBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return {};
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function result(status, message, data) {
  return { status, message, data };
}

function json(request, env, payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request, env) },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.CORS_ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
