const PAGES_API_BASE = "https://ot-springbooth10zf.pages.dev";
const API_BASE = location.hostname.endsWith("pages.dev") ? location.origin : PAGES_API_BASE;

const modules = [
  {
    key: "yonghu",
    name: "用户管理",
    summary: "维护平台注册用户、联系方式和个人信息。",
    pk: "id",
    columns: [["id", "编号"], ["yonghuzhanghao", "用户账号"], ["yonghuxingming", "用户姓名"], ["xingbie", "性别"], ["shouji", "手机"]],
    fields: [["yonghuzhanghao", "用户账号", "text"], ["mima", "密码", "text"], ["yonghuxingming", "用户姓名", "text"], ["xingbie", "性别", "select", ["男", "女"]], ["shouji", "手机", "text"]],
  },
  {
    key: "zhongshimeishi",
    name: "中式美食",
    summary: "维护中式菜品名称、菜系、类型、材料、做法和审核状态。",
    pk: "id",
    columns: [["id", "编号"], ["caipinmingcheng", "菜品名称"], ["caixi", "菜系"], ["leixing", "类型"], ["pingfen", "评分"], ["sfsh", "审核"]],
    fields: [["caipinmingcheng", "菜品名称", "text"], ["caixi", "菜系", "text"], ["leixing", "类型", "select", ["热菜", "凉菜", "汤羹", "主食"]], ["cailiao", "材料", "textarea"], ["pengrenfangfa", "烹饪方法", "textarea"], ["pingfen", "评分", "text"], ["sfsh", "是否审核", "select", ["是", "否"]], ["shhf", "审核回复", "text"]],
  },
  {
    key: "waiguomeishi",
    name: "外国美食",
    summary: "维护外国菜品分类、材料、做法、来源和审核状态。",
    pk: "id",
    columns: [["id", "编号"], ["caipinmingcheng", "菜品名称"], ["caixi", "菜系"], ["leixing", "类型"], ["pingfen", "评分"], ["sfsh", "审核"]],
    fields: [["caipinmingcheng", "菜品名称", "text"], ["caixi", "菜系", "text"], ["leixing", "类型", "select", ["热菜", "凉菜", "汤羹", "甜点"]], ["cailiao", "材料", "textarea"], ["pengrenfangfa", "烹饪方法", "textarea"], ["meishideyoulai", "美食由来", "textarea"], ["pingfen", "评分", "text"], ["sfsh", "是否审核", "select", ["是", "否"]], ["shhf", "审核回复", "text"]],
  },
  {
    key: "remencaipin",
    name: "热门菜品",
    summary: "维护热门菜品标题、详情、日期、点赞和点踩数据。",
    pk: "id",
    columns: [["id", "编号"], ["biaoti", "标题"], ["faburiqi", "发布日期"], ["thumbsupnum", "赞"], ["crazilynum", "踩"]],
    fields: [["biaoti", "标题", "text"], ["neirongxiangqing", "内容详情", "textarea"], ["faburiqi", "发布日期", "date"], ["thumbsupnum", "点赞数", "number"], ["crazilynum", "点踩数", "number"]],
  },
  {
    key: "news",
    name: "资讯管理",
    summary: "维护美食平台资讯标题、简介和正文。",
    pk: "id",
    columns: [["id", "编号"], ["title", "标题"], ["introduction", "简介"]],
    fields: [["title", "标题", "text"], ["introduction", "简介", "textarea"], ["content", "正文", "textarea"]],
  },
  {
    key: "forum",
    name: "论坛管理",
    summary: "维护用户交流帖子、发帖人和开放状态。",
    pk: "id",
    columns: [["id", "编号"], ["title", "标题"], ["username", "用户"], ["isdone", "状态"]],
    fields: [["title", "标题", "text"], ["content", "内容", "textarea"], ["username", "用户", "text"], ["isdone", "状态", "select", ["开放", "关闭"]]],
  },
  {
    key: "messages",
    name: "留言管理",
    summary: "维护用户留言、回复内容和留言人。",
    pk: "id",
    columns: [["id", "编号"], ["username", "用户"], ["content", "留言内容"], ["reply", "回复"]],
    fields: [["username", "用户", "text"], ["content", "留言内容", "textarea"], ["reply", "回复", "textarea"]],
  },
  {
    key: "storeup",
    name: "收藏管理",
    summary: "维护用户收藏的菜品、资讯和论坛内容。",
    pk: "id",
    columns: [["id", "编号"], ["userid", "用户ID"], ["name", "收藏名称"], ["type", "类型"], ["tablename", "来源表"]],
    fields: [["userid", "用户ID", "number"], ["name", "收藏名称", "text"], ["type", "类型", "select", ["1", "2"]], ["tablename", "来源表", "text"]],
  },
];

const state = {
  user: JSON.parse(localStorage.getItem("food_user") || "null"),
  current: "dashboard",
  data: {},
  editing: null,
};

const $ = (selector) => document.querySelector(selector);
const publicView = $("#publicView");
const appView = $("#appView");
const moduleNav = $("#moduleNav");
const dashboard = $("#dashboard");
const modulePanel = $("#modulePanel");
const searchInput = $("#searchInput");
const tableHead = $("#tableHead");
const tableBody = $("#tableBody");
const dialog = $("#editDialog");
const formFields = $("#formFields");
const editForm = $("#editForm");

init();

async function init() {
  renderNav();
  bindEvents();
  await handleAutoLogin();
  if (state.user) await showApp();
}

function bindEvents() {
  $("#role").addEventListener("change", () => {
    if ($("#role").value === "admin") {
      $("#username").value = "abo";
      $("#password").value = "abo";
    } else {
      $("#username").value = "用户账号1";
      $("#password").value = "123456";
    }
  });

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#loginMessage").textContent = "";
    try {
      const response = await api("login", { role: $("#role").value, username: $("#username").value.trim(), password: $("#password").value.trim() });
      if (!response.status) {
        $("#loginMessage").textContent = response.message || "登录失败";
        return;
      }
      state.user = response.data;
      localStorage.setItem("food_user", JSON.stringify(state.user));
      await showApp();
    } catch (error) {
      $("#loginMessage").textContent = error.message;
    }
  });

  document.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      const [role, username, password] = button.dataset.login.split("/");
      $("#role").value = role;
      $("#username").value = username;
      $("#password").value = password;
    });
  });

  $("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem("food_user");
    state.user = null;
    appView.hidden = true;
    publicView.hidden = false;
  });
  $("#refreshButton").addEventListener("click", () => loadCurrent());
  $("#addButton").addEventListener("click", () => openEditor());
  $("#closeDialogButton").addEventListener("click", () => dialog.close());
  $("#cancelEditButton").addEventListener("click", () => dialog.close());
  searchInput.addEventListener("input", () => renderTable());
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveEditor();
  });
}

async function handleAutoLogin() {
  const auto = new URLSearchParams(location.search).get("auto");
  if (!auto || state.user) return;
  const preset = auto === "user" ? { role: "user", username: "用户账号1", password: "123456" } : { role: "admin", username: "abo", password: "abo" };
  $("#role").value = preset.role;
  $("#username").value = preset.username;
  $("#password").value = preset.password;
  const response = await api("login", preset);
  if (response.status) {
    state.user = response.data;
    localStorage.setItem("food_user", JSON.stringify(state.user));
  }
}

function renderNav() {
  moduleNav.innerHTML = "";
  moduleNav.appendChild(navButton("dashboard", "仪表盘", "总览"));
  modules.forEach((item) => moduleNav.appendChild(navButton(item.key, item.name, item.pk)));
}

function navButton(key, label, meta) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.module = key;
  button.innerHTML = `<span>${label}</span><small>${meta}</small>`;
  button.addEventListener("click", () => switchModule(key));
  return button;
}

async function showApp() {
  publicView.hidden = true;
  appView.hidden = false;
  $("#roleText").textContent = `${state.user.displayName || state.user.username} · ${state.user.roleName}`;
  await switchModule("dashboard");
}

async function switchModule(key) {
  state.current = key;
  searchInput.value = "";
  document.querySelectorAll("#moduleNav button").forEach((button) => button.classList.toggle("active", button.dataset.module === key));
  await loadCurrent();
}

async function loadCurrent() {
  if (state.current === "dashboard") {
    $("#pageTitle").textContent = "仪表盘";
    modulePanel.hidden = true;
    dashboard.hidden = false;
    await loadDashboard();
    return;
  }
  const mod = getModule(state.current);
  $("#pageTitle").textContent = mod.name;
  $("#moduleTitle").textContent = mod.name;
  $("#moduleSummary").textContent = mod.summary;
  dashboard.hidden = true;
  modulePanel.hidden = false;
  await loadModule(mod.key);
}

async function loadDashboard() {
  dashboard.innerHTML = `<section class="activity-panel">正在加载数据...</section>`;
  const response = await api("summary");
  const data = response.data;
  dashboard.innerHTML = `
    <div class="stats-grid">
      ${stat("用户", data.users)}
      ${stat("中式美食", data.zhongshimeishi)}
      ${stat("外国美食", data.waiguomeishi)}
      ${stat("热门菜品", data.remencaipin)}
      ${stat("论坛帖子", data.forum)}
    </div>
    <div class="dashboard-grid">
      <section class="activity-panel">
        <h3>最新菜品</h3>
        ${(data.latestDishes || []).map((item) => `
          <article class="activity-item">
            <strong>${escapeHtml(item.caipinmingcheng)} · ${escapeHtml(item.caixi)}</strong>
            <p>${escapeHtml(item.leixing)} / 评分 ${escapeHtml(item.pingfen || "0")} / ${escapeHtml(item.sfsh || "待审")}</p>
          </article>`).join("") || `<p>暂无菜品数据</p>`}
      </section>
      <section class="chart-panel">
        <h3>互动热度</h3>
        <div class="bars">
          ${bar("论坛", data.forum)}
          ${bar("留言", data.messages)}
          ${bar("收藏", data.storeup)}
          ${bar("资讯", data.news)}
        </div>
      </section>
    </div>`;
}

function stat(label, value) {
  return `<section class="stat-card"><span>${label}</span><strong>${value}</strong></section>`;
}

function bar(label, value) {
  const width = Math.min(100, Math.max(8, Number(value || 0) * 14));
  return `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>${value}</strong></div>`;
}

async function loadModule(key) {
  const mod = getModule(key);
  tableBody.innerHTML = `<tr><td colspan="${mod.columns.length + 1}">正在加载数据...</td></tr>`;
  const response = await api(`${key}/list`);
  state.data[key] = response.data || [];
  renderTable();
}

function renderTable() {
  const mod = getModule(state.current);
  const rows = (state.data[mod.key] || []).filter((row) => JSON.stringify(row).toLowerCase().includes(searchInput.value.trim().toLowerCase()));
  tableHead.innerHTML = `<tr>${mod.columns.map(([, label]) => `<th>${label}</th>`).join("")}<th>操作</th></tr>`;
  tableBody.innerHTML = rows.map((row) => `
    <tr>
      ${mod.columns.map(([key]) => `<td>${formatCell(key, row[key])}</td>`).join("")}
      <td><div class="row-actions"><button type="button" data-action="edit" data-id="${row[mod.pk]}">编辑</button><button type="button" data-action="delete" data-id="${row[mod.pk]}">删除</button></div></td>
    </tr>`).join("") || `<tr><td colspan="${mod.columns.length + 1}">暂无数据</td></tr>`;

  tableBody.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => openEditor(rows.find((item) => String(item[mod.pk]) === button.dataset.id)));
  });
  tableBody.querySelectorAll("[data-action='delete']").forEach((button) => button.addEventListener("click", () => deleteRow(button.dataset.id)));
}

function formatCell(key, value) {
  if (key === "mima" || key === "password") return "******";
  if (value === undefined || value === null || value === "") return "-";
  const text = escapeHtml(String(value).replace(/<[^>]*>/g, ""));
  if (["sfsh", "isdone", "type"].includes(key)) {
    const warn = ["否", "关闭", "2"].includes(String(value));
    return `<span class="badge ${warn ? "warn" : ""}">${text}</span>`;
  }
  if (text.length > 34) return `<span class="truncate" title="${text}">${text}</span>`;
  return text;
}

function openEditor(row = null) {
  const mod = getModule(state.current);
  state.editing = row;
  $("#dialogTitle").textContent = row ? `编辑${mod.name}` : `新增${mod.name}`;
  formFields.innerHTML = "";
  if (row) formFields.appendChild(hiddenInput(mod.pk, row[mod.pk]));
  mod.fields.forEach(([key, label, type, options]) => {
    const wrapper = document.createElement("label");
    if (type === "textarea") wrapper.classList.add("wide");
    wrapper.textContent = label;
    let control;
    const value = row ? row[key] ?? "" : defaultValue(key, type);
    if (type === "textarea") {
      control = document.createElement("textarea");
      control.value = String(value).replace(/<[^>]*>/g, "");
    } else if (type === "select") {
      control = document.createElement("select");
      options.forEach((option) => {
        const item = document.createElement("option");
        item.value = option;
        item.textContent = option;
        item.selected = option === value;
        control.appendChild(item);
      });
    } else {
      control = document.createElement("input");
      control.type = type;
      control.value = value;
    }
    control.name = key;
    wrapper.appendChild(control);
    formFields.appendChild(wrapper);
  });
  dialog.showModal();
}

function hiddenInput(name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  return input;
}

async function saveEditor() {
  const mod = getModule(state.current);
  const payload = Object.fromEntries(new FormData(editForm).entries());
  mod.fields.forEach(([key, , type]) => {
    if (type === "number" && payload[key] !== "") payload[key] = Number(payload[key]);
  });
  if (payload[mod.pk]) payload[mod.pk] = Number(payload[mod.pk]);
  const response = await api(`${mod.key}/${state.editing ? "update" : "add"}`, payload);
  if (!response.status) return toast(response.message || "保存失败");
  dialog.close();
  toast(response.message || "保存成功");
  await loadModule(mod.key);
}

async function deleteRow(id) {
  const mod = getModule(state.current);
  if (!window.confirm(`确认删除这条${mod.name}记录吗？`)) return;
  const response = await api(`${mod.key}/delete`, { [mod.pk]: Number(id) });
  toast(response.message || (response.status ? "删除成功" : "删除失败"));
  await loadModule(mod.key);
}

async function api(path, payload = {}) {
  const response = await fetch(`${API_BASE}/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `请求失败 ${response.status}`);
  return data;
}

function getModule(key) {
  return modules.find((item) => item.key === key);
}

function defaultValue(key, type) {
  if (type === "date") return new Date().toISOString().slice(0, 10);
  if (key === "mima") return "demo123";
  if (key === "username") return state.user?.username || "11";
  if (key === "userid") return state.user?.id || 11;
  if (key === "sfsh") return "是";
  if (key === "isdone") return "开放";
  if (key === "thumbsupnum" || key === "crazilynum") return 0;
  return "";
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    el.hidden = true;
  }, 3000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
