(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  const CURRENT_USER_ID = "demo-user-001";
  const PROFILE_KEY = "lost-found-profile-v1";
  const DEFAULT_PROFILE = {
    name: "张三",
    qq: "123456789",
    phone: "13812345678",
    wechat: "zhangsan_fzu",
    campus: "旗山校区 · 生活三区"
  };

  function createService() {
    const store = lostFound.data.createStore(root.localStorage);
    const initialized = store.initialize(lostFound.data.demoItems);
    if (!initialized.ok) return initialized;
    return { ok: true, data: lostFound.services.createItemService(store) };
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

  function buildMyHash(type) {
    const normalizedType = type === "lost" || type === "found" ? type : "all";
    return normalizedType === "all" ? "#/my/published" : "#/my/published?type=" + normalizedType;
  }

  function safeSource(value) {
    return typeof value === "string" && (/^#\/home$/.test(value) || /^#\/search(?:\?|$)/.test(value) || /^#\/my\/published(?:\?|$)/.test(value))
      ? value
      : "#/home";
  }

  function normalizeProfile(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const profile = {};
    Object.keys(DEFAULT_PROFILE).forEach(function (key) {
      profile[key] = typeof source[key] === "string" ? source[key] : DEFAULT_PROFILE[key];
    });
    return profile;
  }

  function loadProfile() {
    try {
      const saved = root.localStorage.getItem(PROFILE_KEY);
      return saved ? normalizeProfile(JSON.parse(saved)) : normalizeProfile(DEFAULT_PROFILE);
    } catch (error) {
      return normalizeProfile(DEFAULT_PROFILE);
    }
  }

  function saveProfile(profile) {
    const normalized = normalizeProfile(profile);
    try {
      root.localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
      return { ok: true, data: normalized };
    } catch (error) {
      return { ok: false, error: { code: "PROFILE_WRITE_FAILED", message: "资料保存失败，请稍后重试" } };
    }
  }

  function installFeatureRoutes() {
    if (!root.document || typeof root.addEventListener !== "function") return;
    if (lostFound.router && typeof lostFound.router.start === "function") return;
    const container = root.document.getElementById("app");
    if (!container || !lostFound.pages.search || !lostFound.pages.detail || !lostFound.pages.my) return;
    let myFeedback = "";
    let loadVersion = 0;

    function navigate(hash) {
      if (root.location.hash === hash) route();
      else root.location.hash = hash;
    }

    function afterLoading(callback) {
      const version = ++loadVersion;
      const scheduleFrame = typeof root.requestAnimationFrame === "function"
        ? root.requestAnimationFrame.bind(root)
        : function (next) { root.setTimeout(next, 0); };
      scheduleFrame(function () {
        root.setTimeout(function () {
          if (version === loadVersion) callback();
        }, 0);
      });
    }

    function getSearchFilters(parts) {
      return {
        keyword: parts.params.get("q") || "",
        type: parts.params.get("type") || "all",
        category: parts.params.get("category") || "all"
      };
    }

    function getSearchOptions(currentHash) {
      return {
        getStatusText: lostFound.core.getStatusText,
        onSearch: function (nextFilters) { navigate(buildSearchHash(nextFilters)); },
        onRetry: route,
        getDetailHref: function (id) {
          return "#/detail/" + encodeURIComponent(id) + "?from=" + encodeURIComponent(currentHash);
        }
      };
    }

    function renderSearch(parts) {
      const serviceResult = createService();
      const searched = parts.params.get("searched") === "1" || parts.params.has("q") || parts.params.has("type") || parts.params.has("category");
      const filters = getSearchFilters(parts);
      let pageState;
      if (!serviceResult.ok) {
        pageState = { searched: true, filters: filters, error: serviceResult.error.message };
      } else if (searched) {
        const searchResult = serviceResult.data.list(filters);
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
      lostFound.pages.search.render(container, pageState, getSearchOptions(currentHash));
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
      const itemResult = serviceResult.data.getById(id);
      if (!itemResult.ok) {
        lostFound.pages.detail.renderNotFound(container, { backHref: backHref });
        return;
      }
      lostFound.pages.detail.render(container, itemResult.data, {
        backHref: backHref,
        getStatusText: lostFound.core.getStatusText,
        copyText: function (text) {
          if (!root.navigator || !root.navigator.clipboard || typeof root.navigator.clipboard.writeText !== "function") {
            return Promise.reject(new Error("CLIPBOARD_UNAVAILABLE"));
          }
          return root.navigator.clipboard.writeText(text);
        }
      });
    }

    function renderMyPublished(parts) {
      const type = parts.params.get("type") || "all";
      const serviceResult = createService();
      let state;
      if (!serviceResult.ok) {
        state = { type: type, items: [], error: serviceResult.error.message };
      } else {
        const listResult = serviceResult.data.getByOwner(CURRENT_USER_ID);
        state = listResult.ok
          ? {
            type: type,
            items: type === "lost" || type === "found"
              ? listResult.data.filter(function (item) { return item.type === type; })
              : listResult.data,
            feedback: myFeedback
          }
          : { type: type, items: [], error: listResult.error.message };
      }
      myFeedback = "";
      lostFound.pages.my.renderPublished(container, state, {
        getStatusText: lostFound.core.getStatusText,
        getDetailHref: function (id) {
          const source = root.location.hash || "#/my/published";
          return "#/detail/" + encodeURIComponent(id) + "?from=" + encodeURIComponent(source);
        },
        onFilter: function (nextType) { navigate(buildMyHash(nextType)); },
        onRetry: route,
        onCloseItem: function (id) {
          if (!serviceResult.ok) return serviceResult;
          return serviceResult.data.closeItem(id, CURRENT_USER_ID);
        },
        onCloseSuccess: function (item) {
          lostFound.pages.my.renderStatusSuccess(container, item, {
            getStatusText: lostFound.core.getStatusText,
            onReturn: function (message) {
              myFeedback = message;
              route();
            }
          });
        }
      });
    }

    function route() {
      const parts = splitHash(root.location.hash || "#/home");
      if (parts.path === "#/search") {
        const searched = parts.params.get("searched") === "1" || parts.params.has("q") || parts.params.has("type") || parts.params.has("category");
        lostFound.pages.search.render(container, {
          loading: true,
          searched: searched,
          filters: getSearchFilters(parts)
        }, getSearchOptions(root.location.hash || "#/search"));
        afterLoading(function () { renderSearch(parts); });
      } else if (/^#\/detail\/[^/]+$/.test(parts.path)) {
        lostFound.pages.detail.renderLoading(container, { backHref: safeSource(parts.params.get("from")) });
        afterLoading(function () { renderDetail(parts); });
      } else if (parts.path === "#/my") {
        loadVersion += 1;
        lostFound.pages.my.renderProfile(container, loadProfile(), { onSave: saveProfile });
      } else if (parts.path === "#/my/published") {
        const type = parts.params.get("type") || "all";
        lostFound.pages.my.renderPublished(container, { loading: true, type: type, items: [] }, {
          getStatusText: lostFound.core.getStatusText,
          onFilter: function (nextType) { navigate(buildMyHash(nextType)); },
          onRetry: route
        });
        afterLoading(function () { renderMyPublished(parts); });
      } else {
        loadVersion += 1;
      }
    }

    root.addEventListener("hashchange", route);
    route();
  }

  if (root.document) root.document.addEventListener("DOMContentLoaded", installFeatureRoutes);
})(globalThis);
