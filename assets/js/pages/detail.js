(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.pages = lostFound.pages || {};

  function setNavigation() {
    root.document.querySelectorAll("[data-nav]").forEach(function (link) {
      link.removeAttribute("aria-current");
    });
  }

  function formatDate(value) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return parts ? Number(parts[2]) + "月" + Number(parts[3]) + "日" : value;
  }

  function safeBackHref(value) {
    return typeof value === "string" && (/^#\/home$/.test(value) || /^#\/search(?:\?|$)/.test(value))
      ? value
      : "#/home";
  }

  function render(container, item, options) {
    if (!item || typeof item !== "object") throw new TypeError("详情页面需要物品记录");
    if (!options || typeof options.getStatusText !== "function") {
      throw new TypeError("详情页面需要状态文字接口");
    }
    const document = container.ownerDocument;
    const template = document.getElementById("detail-template");
    if (!template) throw new Error("详情页面需要 index.html 中的 detail-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    setNavigation();

    const backHref = safeBackHref(options.backHref);
    const page = container.querySelector(".detail-page");
    const image = container.querySelector(".detail-image");
    const type = container.querySelector(".detail-type");
    const title = container.querySelector("#detail-title");
    const status = container.querySelector(".detail-status");
    const fallback = "assets/images/item-placeholder.svg";

    page.classList.add(item.type === "lost" ? "detail-page--lost" : "detail-page--found");
    if (item.status === "closed") page.classList.add("detail-page--closed");
    container.querySelector(".detail-back").href = backHref;
    image.alt = item.name;
    image.addEventListener("error", function () { image.src = fallback; }, { once: true });
    image.src = item.image || fallback;
    type.textContent = item.type === "lost" ? "寻物" : "招领";
    title.textContent = item.name;
    title.title = item.name;
    container.querySelector("[data-detail-time-label]").textContent = item.type === "lost" ? "丢失时间：" : "拾取时间：";
    container.querySelector("[data-detail-date]").textContent = formatDate(item.eventDate);
    container.querySelector("[data-detail-location-label]").textContent = item.type === "lost" ? "丢失地点：" : "拾取地点：";
    container.querySelector("[data-detail-location]").textContent = item.location;
    status.textContent = options.getStatusText(item.type, item.status);
    container.querySelector(".detail-description").textContent = item.description || "暂无物品描述";
    container.querySelector("[data-detail-contact]").textContent = item.contactType + "：" + item.contactValue;

    if (item.status === "closed") {
      container.querySelector(".detail-contact-action").hidden = true;
      container.querySelector(".detail-closed-note").hidden = false;
    }
  }

  function renderNotFound(container, options) {
    const document = container.ownerDocument;
    const template = document.getElementById("detail-template");
    if (!template) throw new Error("详情页面需要 index.html 中的 detail-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    setNavigation();
    const backHref = safeBackHref(options && options.backHref);
    container.querySelector(".detail-back").href = backHref;
    container.querySelector(".detail-content").hidden = true;
    container.querySelector(".detail-not-found").hidden = false;
    if (options && options.title) container.querySelector(".detail-not-found h2").textContent = options.title;
    if (options && options.message) container.querySelector(".detail-not-found p").textContent = options.message;
    container.querySelector(".detail-not-found__back").href = backHref;
  }

  lostFound.pages.detail = { render: render, renderNotFound: renderNotFound };
})(globalThis);
