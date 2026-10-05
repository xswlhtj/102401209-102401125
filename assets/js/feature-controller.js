(function (root) {
  "use strict";

  const lostFound =
    root.LostFound = root.LostFound || {};

  const CURRENT_USER_ID = "demo-user-001";
  const PROFILE_KEY = "lost-found-profile-v1";

  const DEFAULT_PROFILE = {
    name: "张三",
    qq: "123456789",
    phone: "13812345678",
    wechat: "zhangsan_fzu",
    campus: "旗山校区 · 生活三区"
  };


  // =========================
  // 状态变量
  // =========================

  let myFeedback = "";
  let loadVersion = 0;


  // =========================
  // 创建业务服务
  // =========================

  function createService() {
    const store =
      lostFound.data.createStore(
        root.localStorage
      );

    const initialized =
      store.initialize(
        lostFound.data.demoItems
      );

    if (!initialized.ok) {
      return initialized;
    }

    return {
      ok: true,
      data:
        lostFound.services.createItemService(
          store
        )
    };
  }


  // =========================
  // 构造搜索页 Hash
  // =========================

  function buildSearchHash(filters) {
    const params =
      new URLSearchParams();

    params.set(
      "searched",
      "1"
    );

    const keyword =
      typeof filters.keyword === "string"
        ? filters.keyword.trim()
        : "";

    const type =
      filters.type === "lost" ||
      filters.type === "found"
        ? filters.type
        : "all";

    const category =
      typeof filters.category === "string" &&
      filters.category
        ? filters.category
        : "all";

    if (keyword) {
      params.set(
        "q",
        keyword
      );
    }

    if (type !== "all") {
      params.set(
        "type",
        type
      );
    }

    if (category !== "all") {
      params.set(
        "category",
        category
      );
    }

    return (
      "#/search?" +
      params.toString()
    );
  }


  // =========================
  // 构造“我的发布” Hash
  // =========================

  function buildMyHash(type) {
    const normalizedType =
      type === "lost" ||
      type === "found"
        ? type
        : "all";

    if (normalizedType === "all") {
      return "#/my/published";
    }

    return (
      "#/my/published?type=" +
      normalizedType
    );
  }


  // =========================
  // 验证详情页返回地址
  // =========================

  function safeSource(value) {
    const valid =
      typeof value === "string" &&
      (
        /^#\/home$/.test(value) ||
        /^#\/search(?:\?|$)/.test(value) ||
        /^#\/my\/published(?:\?|$)/.test(value)
      );

    return valid
      ? value
      : "#/home";
  }


  // =========================
  // 个人资料
  // =========================

  function normalizeProfile(value) {
    const source =
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
        ? value
        : {};

    const profile = {};

    Object.keys(
      DEFAULT_PROFILE
    ).forEach(function (key) {
      profile[key] =
        typeof source[key] === "string"
          ? source[key]
          : DEFAULT_PROFILE[key];
    });

    return profile;
  }


  function loadProfile() {
    try {
      const saved =
        root.localStorage.getItem(
          PROFILE_KEY
        );

      return saved
        ? normalizeProfile(
            JSON.parse(saved)
          )
        : normalizeProfile(
            DEFAULT_PROFILE
          );

    } catch (error) {
      return normalizeProfile(
        DEFAULT_PROFILE
      );
    }
  }


  function saveProfile(profile) {
    const normalized =
      normalizeProfile(profile);

    try {
      root.localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(normalized)
      );

      return {
        ok: true,
        data: normalized
      };

    } catch (error) {
      return {
        ok: false,
        error: {
          code:
            "PROFILE_WRITE_FAILED",
          message:
            "资料保存失败，请稍后重试"
        }
      };
    }
  }


  // =========================
  // 重新执行当前路由
  // =========================

  function reroute() {
    if (
      lostFound.router &&
      typeof lostFound.router.route ===
        "function"
    ) {
      lostFound.router.route();
    }
  }


  // =========================
  // 页面跳转
  // =========================

  function navigate(hash) {
    if (
      root.location.hash === hash
    ) {
      reroute();
    } else {
      root.location.hash = hash;
    }
  }


  // =========================
  // 模拟加载过程
  // =========================

  function afterLoading(callback) {
    const version =
      ++loadVersion;

    const scheduleFrame =
      typeof root.requestAnimationFrame ===
      "function"
        ? root.requestAnimationFrame.bind(
            root
          )
        : function (next) {
            root.setTimeout(
              next,
              0
            );
          };

    scheduleFrame(function () {
      root.setTimeout(
        function () {
          if (
            version === loadVersion
          ) {
            callback();
          }
        },
        0
      );
    });
  }


  // =========================
  // 搜索条件
  // =========================

  function getSearchFilters(parts) {
    return {
      keyword:
        parts.params.get("q") || "",

      type:
        parts.params.get("type") ||
        "all",

      category:
        parts.params.get(
          "category"
        ) || "all"
    };
  }


  // =========================
  // 搜索页操作
  // =========================

  function getSearchOptions(
    currentHash
  ) {
    return {
      getStatusText:
        lostFound.core
          .getStatusText,

      onSearch:
        function (
          nextFilters
        ) {
          navigate(
            buildSearchHash(
              nextFilters
            )
          );
        },

      onRetry:
        reroute,

      getDetailHref:
        function (id) {
          return (
            "#/detail/" +
            encodeURIComponent(id) +
            "?from=" +
            encodeURIComponent(
              currentHash
            )
          );
        }
    };
  }


  // =========================
  // 渲染搜索页面
  // =========================

  function renderSearch(
    parts,
    container
  ) {
    const serviceResult =
      createService();

    const searched =
      parts.params.get(
        "searched"
      ) === "1" ||
      parts.params.has("q") ||
      parts.params.has("type") ||
      parts.params.has(
        "category"
      );

    const filters =
      getSearchFilters(parts);

    let pageState;


    if (!serviceResult.ok) {

      pageState = {
        searched: true,
        filters: filters,
        error:
          serviceResult.error
            .message
      };

    } else if (searched) {

      const searchResult =
        serviceResult.data.list(
          filters
        );

      pageState =
        searchResult.ok
          ? {
              searched: true,
              filters: filters,
              items:
                searchResult.data
            }
          : {
              searched: true,
              filters: filters,
              error:
                searchResult.error
                  .message
            };

    } else {

      const listResult =
        serviceResult.data.list(
          {}
        );

      pageState =
        listResult.ok
          ? {
              searched: false,
              filters: filters,

              suggestions:
                listResult.data.map(
                  function (item) {
                    return item.name;
                  }
                )
            }
          : {
              searched: true,
              filters: filters,
              error:
                listResult.error
                  .message
            };
    }


    const currentHash =
      root.location.hash ||
      "#/search";

    lostFound.pages.search.render(
      container,
      pageState,
      getSearchOptions(
        currentHash
      )
    );
  }


  // =========================
  // 渲染详情页面
  // =========================

  function renderDetail(
    parts,
    container
  ) {
    const match =
      /^#\/detail\/([^/]+)$/
        .exec(parts.path);

    if (!match) {
      return;
    }


    const backHref =
      safeSource(
        parts.params.get("from")
      );

    let id;


    try {

      id =
        decodeURIComponent(
          match[1]
        );

    } catch (error) {

      lostFound.pages.detail
        .renderNotFound(
          container,
          {
            backHref:
              backHref
          }
        );

      return;
    }


    const serviceResult =
      createService();


    if (!serviceResult.ok) {

      lostFound.pages.detail
        .renderNotFound(
          container,
          {
            backHref:
              backHref,

            title:
              "详情加载失败",

            message:
              serviceResult.error
                .message
          }
        );

      return;
    }


    const itemResult =
      serviceResult.data
        .getById(id);


    if (!itemResult.ok) {

      lostFound.pages.detail
        .renderNotFound(
          container,
          {
            backHref:
              backHref
          }
        );

      return;
    }


    lostFound.pages.detail.render(
      container,
      itemResult.data,
      {
        backHref:
          backHref,

        getStatusText:
          lostFound.core
            .getStatusText,

        copyText:
          function (text) {

            if (
              !root.navigator ||
              !root.navigator
                .clipboard ||
              typeof root.navigator
                .clipboard
                .writeText !==
                "function"
            ) {
              return Promise.reject(
                new Error(
                  "CLIPBOARD_UNAVAILABLE"
                )
              );
            }

            return root.navigator
              .clipboard
              .writeText(text);
          }
      }
    );
  }


  // =========================
  // 渲染“我的发布”
  // =========================

  function renderMyPublished(
    parts,
    container
  ) {
    const type =
      parts.params.get("type") ||
      "all";

    const serviceResult =
      createService();

    let state;


    if (!serviceResult.ok) {

      state = {
        type: type,
        items: [],
        error:
          serviceResult.error
            .message
      };

    } else {

      const listResult =
        serviceResult.data
          .getByOwner(
            CURRENT_USER_ID
          );


      state =
        listResult.ok
          ? {
              type: type,

              items:
                type === "lost" ||
                type === "found"
                  ? listResult.data.filter(
                      function (item) {
                        return (
                          item.type ===
                          type
                        );
                      }
                    )
                  : listResult.data,

              feedback:
                myFeedback
            }
          : {
              type: type,
              items: [],
              error:
                listResult.error
                  .message
            };
    }


    myFeedback = "";


    lostFound.pages.my
      .renderPublished(
        container,
        state,
        {
          getStatusText:
            lostFound.core
              .getStatusText,

          getDetailHref:
            function (id) {

              const source =
                root.location.hash ||
                "#/my/published";

              return (
                "#/detail/" +
                encodeURIComponent(id) +
                "?from=" +
                encodeURIComponent(
                  source
                )
              );
            },

          onFilter:
            function (
              nextType
            ) {
              navigate(
                buildMyHash(
                  nextType
                )
              );
            },

          onRetry:
            reroute,

          onCloseItem:
            function (id) {

              if (
                !serviceResult.ok
              ) {
                return serviceResult;
              }

              return serviceResult
                .data
                .closeItem(
                  id,
                  CURRENT_USER_ID
                );
            },

          onCloseSuccess:
            function (item) {

              lostFound.pages.my
                .renderStatusSuccess(
                  container,
                  item,
                  {
                    getStatusText:
                      lostFound.core
                        .getStatusText,

                    onReturn:
                      function (
                        message
                      ) {
                        myFeedback =
                          message;

                        reroute();
                      }
                  }
                );
            }
        }
      );
  }


  // =========================
  // Feature 路由处理器
  //
  // router.js 会调用这里。
  //
  // 处理成功返回 true，
  // 不属于本模块则返回 false。
  // =========================

  function handle(
    parts,
    container
  ) {

    // ----------
    // 搜索
    // ----------

    if (
      parts.path ===
      "#/search"
    ) {

      const searched =
        parts.params.get(
          "searched"
        ) === "1" ||
        parts.params.has("q") ||
        parts.params.has(
          "type"
        ) ||
        parts.params.has(
          "category"
        );


      lostFound.pages.search
        .render(
          container,
          {
            loading: true,

            searched:
              searched,

            filters:
              getSearchFilters(
                parts
              )
          },

          getSearchOptions(
            root.location.hash ||
            "#/search"
          )
        );


      afterLoading(
        function () {
          renderSearch(
            parts,
            container
          );
        }
      );

      return true;
    }


    // ----------
    // 详情
    // ----------

    if (
      /^#\/detail\/[^/]+$/
        .test(parts.path)
    ) {

      lostFound.pages.detail
        .renderLoading(
          container,
          {
            backHref:
              safeSource(
                parts.params.get(
                  "from"
                )
              )
          }
        );


      afterLoading(
        function () {
          renderDetail(
            parts,
            container
          );
        }
      );

      return true;
    }


    // ----------
    // 我的资料
    // ----------

    if (
      parts.path ===
      "#/my"
    ) {

      loadVersion += 1;

      lostFound.pages.my
        .renderProfile(
          container,

          loadProfile(),

          {
            onSave:
              saveProfile
          }
        );

      return true;
    }


    // ----------
    // 我的发布
    // ----------

    if (
      parts.path ===
      "#/my/published"
    ) {

      const type =
        parts.params.get(
          "type"
        ) || "all";


      lostFound.pages.my
        .renderPublished(
          container,

          {
            loading: true,
            type: type,
            items: []
          },

          {
            getStatusText:
              lostFound.core
                .getStatusText,

            onFilter:
              function (
                nextType
              ) {
                navigate(
                  buildMyHash(
                    nextType
                  )
                );
              },

            onRetry:
              reroute
          }
        );


      afterLoading(
        function () {
          renderMyPublished(
            parts,
            container
          );
        }
      );

      return true;
    }


    // 如果进入其他模块，
    // 取消尚未完成的加载任务。
    loadVersion += 1;

    return false;
  }


  // =========================
  // 暴露给 router.js
  // =========================

  lostFound.controllers =
    lostFound.controllers || {};

  lostFound.controllers.feature = {
    handle: handle
  };

})(globalThis);