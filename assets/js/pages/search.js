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
      link.removeAttribute("aria-current");
    });
  }

  function normalizeFilters(filters) {
    const source = filters && typeof filters === "object" ? filters : {};
    return {
      keyword: typeof source.keyword === "string" ? source.keyword : "",
      type: source.type === "lost" || source.type === "found" ? source.type : "all",
      category: typeof source.category === "string" && source.category ? source.category : "all"
    };
  }

  function renderIntro(content, suggestions, onSearch) {
    const document = content.ownerDocument;
    const section = element(document, "section", "search-intro");
    section.append(element(document, "h2", "", "最近搜索"));
    const tags = element(document, "div", "recent-searches");
    const names = Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    (names.length ? names : ["校园卡", "黑色蓝牙耳机", "雨伞"]).forEach(function (name) {
      const button = element(document, "button", "", name);
      button.type = "button";
      button.addEventListener("click", function () {
        onSearch({ keyword: name, type: "all", category: "all" });
      });
      tags.append(button);
    });
    const suggestion = element(document, "aside", "search-suggestion");
    suggestion.append(
      element(document, "h3", "", "搜索建议"),
      element(document, "p", "", "可尝试输入物品名称、颜色、地点或类别。")
    );
    section.append(tags, suggestion);
    content.replaceChildren(section);
  }

  function renderFailure(content, message, onRetry) {
    const document = content.ownerDocument;
    const state = element(document, "section", "search-state search-state--error");
    state.append(
      element(document, "div", "search-state__mark", "!"),
      element(document, "h2", "", "搜索失败"),
      element(document, "p", "", message || "读取信息失败，请稍后重试")
    );
    const retry = element(document, "button", "search-state__primary", "重新加载");
    retry.type = "button";
    retry.addEventListener("click", onRetry);
    state.append(retry);
    content.replaceChildren(state);
  }

  function renderLoading(content) {
    const document = content.ownerDocument;
    const state = element(document, "section", "search-state search-state--loading");
    state.setAttribute("role", "status");
    state.setAttribute("aria-live", "polite");
    state.append(
      element(document, "span", "feedback-spinner"),
      element(document, "h2", "", "正在加载信息"),
      element(document, "p", "", "请稍候…")
    );
    content.replaceChildren(state);
  }

  function renderEmpty(content, input) {
    const document = content.ownerDocument;
    const state = element(document, "section", "search-state search-state--empty");
    state.append(
      element(document, "h2", "", "没有找到相关物品"),
      element(document, "p", "", "换个关键词，或发布寻物信息让更多同学帮忙")
    );
    const edit = element(document, "button", "search-state__primary", "修改关键词");
    edit.type = "button";
    edit.addEventListener("click", function () {
      input.focus();
      input.select();
    });
    const publish = element(document, "a", "search-state__secondary", "发布寻物");
    publish.href = "#/publish/lost";
    state.append(edit, publish);
    content.replaceChildren(state);
  }

  function renderResults(content, items, options) {
    const document = content.ownerDocument;
    const section = element(document, "section", "search-results-section");
    const heading = element(document, "h2", "", "搜索结果");
    const count = element(document, "span", "search-result-count", "共 " + items.length + " 条");
    const titleRow = element(document, "div", "search-results-heading");
    titleRow.append(heading, count);
    const list = element(document, "ul", "search-results");
    list.setAttribute("aria-label", "搜索到 " + items.length + " 条失物招领信息");
    items.forEach(function (item) {
      const row = document.createElement("li");
      row.append(lostFound.ui.createItemCard(item, {
        getStatusText: options.getStatusText,
        getDetailHref: options.getDetailHref
      }));
      list.append(row);
    });
    section.append(titleRow, list);
    content.replaceChildren(section);
  }

  function render(container, state, options) {
    if (!options || typeof options.onSearch !== "function" || typeof options.getStatusText !== "function") {
      throw new TypeError("搜索页面需要搜索回调和状态文字接口");
    }
    const document = container.ownerDocument;
    const template = document.getElementById("search-template");
    if (!template) throw new Error("搜索页面需要 index.html 中的 search-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    setNavigation();

    const pageState = state && typeof state === "object" ? state : {};
    const filters = normalizeFilters(pageState.filters);
    const form = container.querySelector(".search-form");
    const input = form.elements.keyword;
    const filterPanel = container.querySelector(".search-filters");
    const category = container.querySelector("#search-category");
    const content = container.querySelector(".search-content");
    let selectedType = filters.type;

    input.value = filters.keyword;
    filterPanel.hidden = !pageState.searched;
    category.value = filters.category;

    function currentFilters() {
      return { keyword: input.value, type: selectedType, category: category.value };
    }

    function updateTypeButtons() {
      filterPanel.querySelectorAll("[data-search-type]").forEach(function (button) {
        const selected = button.dataset.searchType === selectedType;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
        const icon = button.querySelector("img");
        if (icon) icon.src = selected ? "assets/images/figma/box-publish.svg" : "assets/images/figma/box-muted.svg";
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      options.onSearch(currentFilters());
    });
    filterPanel.querySelectorAll("[data-search-type]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectedType = button.dataset.searchType;
        updateTypeButtons();
        options.onSearch(currentFilters());
      });
    });
    category.addEventListener("change", function () { options.onSearch(currentFilters()); });
    filterPanel.querySelector(".search-clear").addEventListener("click", function () {
      input.value = "";
      selectedType = "all";
      category.value = "all";
      updateTypeButtons();
      options.onSearch(currentFilters());
    });
    updateTypeButtons();

    if (pageState.loading) {
      renderLoading(content);
      return;
    }
    if (!pageState.searched) {
      renderIntro(content, pageState.suggestions, options.onSearch);
      root.requestAnimationFrame(function () { input.focus(); });
      return;
    }
    if (pageState.error) {
      renderFailure(content, pageState.error, options.onRetry || function () { options.onSearch(currentFilters()); });
      return;
    }
    const items = Array.isArray(pageState.items) ? pageState.items : [];
    if (items.length === 0) renderEmpty(content, input);
    else renderResults(content, items, options);
  }

  lostFound.pages.search = { render: render };
})(globalThis);
