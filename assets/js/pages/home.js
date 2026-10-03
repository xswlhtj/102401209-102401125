(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.pages = lostFound.pages || {};

  // 由 A 的 app.js / 路由查询 list({}) 后调用；保留服务返回的顺序。
  function render(container, items, options) {
    if (!Array.isArray(items)) throw new TypeError("首页需要接收 list 返回的记录数组");
    if (!options || typeof options.getStatusText !== "function") {
      throw new TypeError("首页渲染需要传入 A 的 getStatusText(type, status) 函数");
    }

    const document = container.ownerDocument;
    const template = document.getElementById("home-template");
    if (!template) throw new Error("首页需要 index.html 中的 home-template 模板");
    const page = template.content.cloneNode(true);
    const list = page.querySelector(".home-list");
    list.setAttribute("aria-label", "共 " + items.length + " 条失物招领信息");
    items.forEach(function (item) {
      const row = document.createElement("li");
      row.append(lostFound.ui.createItemCard(item, options));
      list.append(row);
    });
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "home-feed__empty";
      empty.textContent = "暂无失物招领信息";
      page.querySelector(".home-scroll").append(empty);
    }
    container.replaceChildren(page);
  }

  lostFound.pages.home = { render: render };
})(globalThis);
