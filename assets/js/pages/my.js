(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.pages = lostFound.pages || {};

  function element(document, tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setNavigation() {
    root.document.querySelectorAll("[data-nav]").forEach(function (link) {
      if (link.dataset.nav === "my") link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function formatDate(value) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return parts ? Number(parts[2]) + "月" + Number(parts[3]) + "日" : value;
  }

  function normalizeType(value) {
    return value === "lost" || value === "found" ? value : "all";
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function createPublishedCard(document, item, options) {
    const card = element(document, "article", "my-item-card");
    card.classList.add(item.type === "lost" ? "my-item-card--lost" : "my-item-card--found");
    if (item.status === "closed") card.classList.add("my-item-card--closed");
    card.dataset.itemId = item.id;

    const top = element(document, "div", "my-item-card__top");
    const image = element(document, "img", "my-item-card__image");
    const fallback = "assets/images/item-placeholder.svg";
    image.alt = item.name;
    image.width = 108;
    image.height = 108;
    image.loading = "lazy";
    image.addEventListener("error", function () { image.src = fallback; }, { once: true });
    image.src = item.image || fallback;

    const body = element(document, "div", "my-item-card__body");
    const type = element(document, "span", "my-item-card__type", item.type === "lost" ? "寻物" : "招领");
    const title = element(document, "h3", "", item.name);
    title.title = item.name;
    const location = element(document, "p", "my-item-card__meta");
    const locationIcon = element(document, "img", "");
    locationIcon.src = "assets/images/figma/location.svg";
    locationIcon.alt = "";
    const locationText = element(document, "span", "", item.location);
    locationText.title = item.location;
    location.append(locationIcon, locationText);
    const date = element(document, "p", "my-item-card__meta");
    const dateIcon = element(document, "img", "");
    dateIcon.src = "assets/images/figma/clock.svg";
    dateIcon.alt = "";
    const time = element(document, "time", "", formatDate(item.eventDate));
    time.dateTime = item.eventDate;
    date.append(dateIcon, time);
    body.append(type, title, location, date);
    top.append(image, body);

    const footer = element(document, "div", "my-item-card__footer");
    const statusLabel = element(document, "span", "my-item-card__status-label", "状态：");
    const status = element(document, "span", "my-item-card__status", options.getStatusText(item.type, item.status));
    const actions = element(document, "div", "my-item-card__actions");
    const detail = element(document, "a", "my-item-card__detail", "查看详情");
    detail.href = options.getDetailHref(item.id);
    actions.append(detail);
    if (item.status === "active") {
      const change = element(document, "button", "my-item-card__change", "修改状态");
      change.type = "button";
      change.addEventListener("click", function () { options.onRequestClose(item); });
      actions.append(change);
    }
    footer.append(statusLabel, status, actions);
    card.append(top, footer);
    return card;
  }

  function bindStatusDialog(container, options) {
    const dialog = container.querySelector(".status-dialog");
    const intro = dialog.querySelector(".status-dialog__intro");
    const targetTitle = dialog.querySelector(".status-dialog__target strong");
    const targetDescription = dialog.querySelector(".status-dialog__target small");
    const error = dialog.querySelector(".status-dialog__error");
    const confirm = dialog.querySelector(".status-confirm");
    const cancel = dialog.querySelector(".status-cancel");
    let item = null;
    let saving = false;

    function resetButtons() {
      saving = false;
      confirm.disabled = false;
      cancel.disabled = false;
      confirm.textContent = "确认修改";
    }

    function show(nextItem) {
      item = nextItem;
      error.textContent = "";
      intro.textContent = "确认将“" + item.name + "”标记为最新状态吗？";
      targetTitle.textContent = item.type === "lost" ? "已找到" : "已归还";
      targetDescription.textContent = item.type === "lost" ? "物品已经找到，结束寻找" : "物品已经归还失主";
      resetButtons();
      openDialog(dialog);
    }

    cancel.addEventListener("click", function () {
      if (!saving) closeDialog(dialog);
    });
    dialog.addEventListener("cancel", function (event) {
      if (saving) event.preventDefault();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog && !saving) closeDialog(dialog);
    });
    confirm.addEventListener("click", function () {
      if (!item || saving) return;
      saving = true;
      confirm.disabled = true;
      cancel.disabled = true;
      confirm.textContent = "保存中…";
      error.textContent = "";
      Promise.resolve().then(function () {
        return options.onCloseItem(item.id);
      }).then(function (result) {
        if (!result || !result.ok) {
          const message = result && result.error && result.error.message ? result.error.message : "状态修改失败，请稍后重试";
          error.textContent = message;
          resetButtons();
          return;
        }
        closeDialog(dialog);
        options.onCloseSuccess(result.data);
      }).catch(function () {
        error.textContent = "状态修改失败，请稍后重试";
        resetButtons();
      });
    });
    return show;
  }

  function renderProfile(container) {
    const document = container.ownerDocument;
    const template = document.getElementById("profile-template");
    if (!template) throw new Error("个人资料页面需要 index.html 中的 profile-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    const avatar = container.querySelector(".profile-avatar");
    avatar.addEventListener("error", function () { avatar.src = "assets/images/item-placeholder.svg"; }, { once: true });
    setNavigation();
  }

  function renderPublished(container, state, options) {
    if (!state || !Array.isArray(state.items)) throw new TypeError("我的发布页面需要记录数组");
    if (!options || typeof options.getStatusText !== "function") {
      throw new TypeError("我的发布页面需要状态文字接口");
    }
    const document = container.ownerDocument;
    const template = document.getElementById("my-published-template");
    if (!template) throw new Error("我的发布页面需要 index.html 中的 my-published-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    setNavigation();

    const activeType = normalizeType(state.type);
    const list = container.querySelector(".my-published-list");
    const empty = container.querySelector(".my-published-state");
    const feedback = container.querySelector(".my-feedback");
    container.querySelectorAll("[data-my-type]").forEach(function (button) {
      const selected = button.dataset.myType === activeType;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
      const box = button.querySelector("img");
      if (box) box.src = selected ? "assets/images/figma/box-publish.svg" : "assets/images/figma/box-muted.svg";
      button.addEventListener("click", function () {
        if (!selected && typeof options.onFilter === "function") options.onFilter(button.dataset.myType);
      });
    });

    if (state.loading) {
      empty.hidden = false;
      empty.classList.add("is-loading");
      empty.setAttribute("role", "status");
      empty.setAttribute("aria-live", "polite");
      empty.append(
        element(document, "span", "feedback-spinner"),
        element(document, "h3", "", "正在加载我的发布"),
        element(document, "p", "", "请稍候…")
      );
      return;
    }
    if (state.feedback) {
      feedback.hidden = false;
      feedback.textContent = state.feedback;
    }
    if (state.error) {
      empty.hidden = false;
      empty.classList.add("is-error");
      const title = element(document, "h3", "", "加载失败");
      const message = element(document, "p", "", state.error);
      empty.append(title, message);
      if (typeof options.onRetry === "function") {
        const retry = element(document, "button", "my-published-state__action", "重新加载");
        retry.type = "button";
        retry.addEventListener("click", options.onRetry);
        empty.append(retry);
      }
      return;
    }
    if (state.items.length === 0) {
      empty.hidden = false;
      const title = element(document, "h3", "", "暂无发布记录");
      const message = element(document, "p", "", activeType === "all" ? "发布信息后会显示在这里" : "当前筛选下没有记录");
      const publish = element(document, "a", "my-published-state__action", "去发布");
      publish.href = activeType === "found" ? "#/publish/found" : "#/publish/lost";
      empty.append(title, message, publish);
      return;
    }
    if (typeof options.onCloseItem !== "function" || typeof options.getDetailHref !== "function") {
      throw new TypeError("我的发布记录需要详情和状态修改接口");
    }
    const showStatusDialog = bindStatusDialog(container, options);
    list.setAttribute("aria-label", "共 " + state.items.length + " 条我的发布");
    state.items.forEach(function (item) {
      const row = element(document, "li", "");
      row.append(createPublishedCard(document, item, {
        getStatusText: options.getStatusText,
        getDetailHref: options.getDetailHref,
        onRequestClose: showStatusDialog
      }));
      list.append(row);
    });
  }

  function renderStatusSuccess(container, item, options) {
    const document = container.ownerDocument;
    const template = document.getElementById("status-success-template");
    if (!template) throw new Error("状态成功页需要 index.html 中的 status-success-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    setNavigation();
    const message = item.type === "lost" ? "该信息已标记为“已找到”" : "该信息已标记为“已归还”";
    container.querySelector(".status-success-message").textContent = message;
    container.querySelector(".status-success-card h3").textContent = item.name;
    container.querySelector("[data-old-status]").textContent = options.getStatusText(item.type, "active");
    container.querySelector("[data-new-status]").textContent = options.getStatusText(item.type, "closed");
    container.querySelectorAll(".status-success-page .page-back, .status-success-return").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (typeof options.onReturn !== "function") return;
        event.preventDefault();
        options.onReturn(message);
      });
    });
  }

  lostFound.pages.my = {
    renderProfile: renderProfile,
    renderPublished: renderPublished,
    renderStatusSuccess: renderStatusSuccess
  };
})(globalThis);
