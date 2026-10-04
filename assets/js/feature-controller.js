(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};

  function createService() {
    const store = lostFound.data.createStore(root.localStorage);
    const initialized = store.initialize(lostFound.data.demoItems);
    if (!initialized.ok) return initialized;
    return { ok: true, data: lostFound.services.createItemService(store) };
  }

  function normalize(value) {
    return typeof value === "string" ? value.trim().toLocaleLowerCase("zh-CN") : "";
  }

  function matchesFilters(item, filters) {
    const keyword = normalize(filters.keyword);
    const typeMatches = filters.type === "all" || item.type === filters.type;
    const categoryMatches = filters.category === "all" || item.category === filters.category;
    const haystack = [item.name, item.category, item.location, item.description].map(normalize).join(" ");
    return typeMatches && categoryMatches && (!keyword || haystack.includes(keyword));
  }

  function queryItems(service, filters) {
    const result = service.list(filters);
    if (!result.ok) return result;
    // A 当前的 list(filters) 仍处于 F01 阶段并会忽略筛选条件。
    // 只有服务返回了不符合条件的记录时才启用兼容过滤；A 完成 F04 后结果原样使用。
    const needsCompatibilityFilter = result.data.some(function (item) {
      return !matchesFilters(item, filters);
    });
    return {
      ok: true,
      data: needsCompatibilityFilter
        ? result.data.filter(function (item) { return matchesFilters(item, filters); })
        : result.data
    };
  }

  function getItemById(service, id) {
    if (typeof service.getById === "function") return service.getById(id);
    const listResult = service.list({});
    if (!listResult.ok) return listResult;
    const item = listResult.data.find(function (record) { return record.id === id; });
    return item
      ? { ok: true, data: item }
      : { ok: false, error: { code: "ITEM_NOT_FOUND", message: "没有找到这条信息" } };
  }

  function splitHash(hash) {
    const index = hash.indexOf("?");
    return {
      path: index === -1 ? hash : hash.slice(0, index),
      params: new URLSearchParams(index === -1 ? "" : hash.slice(index + 1))
    };
  }

  function buildSearchHash(filters) {
    const params = new URLSearchParams();
    params.set("searched", "1");
    const keyword = typeof filters.keyword === "string" ? filters.keyword.trim() : "";
    const type = filters.type === "lost" || filters.type === "found" ? filters.type : "all";
    const category = typeof filters.category === "string" && filters.category ? filters.category : "all";
    if (keyword) params.set("q", keyword);
    if (type !== "all") params.set("type", type);
    if (category !== "all") params.set("category", category);
    return "#/search?" + params.toString();
  }

  function safeSource(value) {
    return typeof value === "string" && (/^#\/home$/.test(value) || /^#\/search(?:\?|$)/.test(value))
      ? value
      : "#/home";
  }

  function installFeatureRoutes() {
    if (!root.document || typeof root.addEventListener !== "function") return;
    if (lostFound.router && typeof lostFound.router.start === "function") return;
    const container = root.document.getElementById("app");
    if (!container || !lostFound.pages.search || !lostFound.pages.detail) return;

    function navigate(hash) {
      if (root.location.hash === hash) route();
      else root.location.hash = hash;
    }

    function renderSearch(parts) {
      const serviceResult = createService();
      const searched = parts.params.get("searched") === "1" || parts.params.has("q") || parts.params.has("type") || parts.params.has("category");
      const filters = {
        keyword: parts.params.get("q") || "",
        type: parts.params.get("type") || "all",
        category: parts.params.get("category") || "all"
      };
      let pageState;
      if (!serviceResult.ok) {
        pageState = { searched: true, filters: filters, error: serviceResult.error.message };
      } else if (searched) {
        const searchResult = queryItems(serviceResult.data, filters);
        pageState = searchResult.ok
          ? { searched: true, filters: filters, items: searchResult.data }
          : { searched: true, filters: filters, error: searchResult.error.message };
      } else {
        const listResult = serviceResult.data.list({});
        pageState = listResult.ok
          ? { searched: false, filters: filters, suggestions: listResult.data.map(function (item) { return item.name; }) }
          : { searched: true, filters: filters, error: listResult.error.message };
      }
      const currentHash = root.location.hash || "#/search";
      lostFound.pages.search.render(container, pageState, {
        getStatusText: lostFound.core.getStatusText,
        onSearch: function (nextFilters) { navigate(buildSearchHash(nextFilters)); },
        onRetry: route,
        getDetailHref: function (id) {
          return "#/detail/" + encodeURIComponent(id) + "?from=" + encodeURIComponent(currentHash);
        }
      });
    }

    function renderDetail(parts) {
      const match = /^#\/detail\/([^/]+)$/.exec(parts.path);
      if (!match) return;
      const backHref = safeSource(parts.params.get("from"));
      let id;
      try {
        id = decodeURIComponent(match[1]);
      } catch (error) {
        lostFound.pages.detail.renderNotFound(container, { backHref: backHref });
        return;
      }
      const serviceResult = createService();
      if (!serviceResult.ok) {
        lostFound.pages.detail.renderNotFound(container, {
          backHref: backHref,
          title: "详情加载失败",
          message: serviceResult.error.message
        });
        return;
      }
      const itemResult = getItemById(serviceResult.data, id);
      if (!itemResult.ok) {
        lostFound.pages.detail.renderNotFound(container, { backHref: backHref });
        return;
      }
      lostFound.pages.detail.render(container, itemResult.data, {
        backHref: backHref,
        getStatusText: lostFound.core.getStatusText
      });
    }

    function route() {
      const parts = splitHash(root.location.hash || "#/home");
      if (parts.path === "#/search") renderSearch(parts);
      else if (/^#\/detail\/[^/]+$/.test(parts.path)) renderDetail(parts);
    }

    root.addEventListener("hashchange", route);
    route();
  }

  if (root.document) root.document.addEventListener("DOMContentLoaded", installFeatureRoutes);
})(globalThis);
