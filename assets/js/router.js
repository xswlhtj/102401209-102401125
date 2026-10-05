(function (root) {
  "use strict";

  const lostFound =
    root.LostFound = root.LostFound || {};

  let started = false;

  // 把 Hash 拆成路径和查询参数
  // 例如：
  // #/search?q=校园卡&type=lost
  //
  // path   = #/search
  // params = q=校园卡&type=lost
  function splitHash(hash) {
    const index = hash.indexOf("?");

    return {
      path:
        index === -1
          ? hash
          : hash.slice(0, index),

      params: new URLSearchParams(
        index === -1
          ? ""
          : hash.slice(index + 1)
      )
    };
  }

  // 路由核心
  function route() {
    const container =
      root.document.getElementById("app");

    if (!container) {
      return;
    }

    const hash =
      root.location.hash || "#/home";

    const parts = splitHash(hash);

    /*
     * 以后：
     *
     * feature-controller
     * 负责搜索、详情、我的
     *
     * publish-controller
     * 负责首页、发布、发布成功
     *
     * router.js
     * 负责决定把当前地址交给谁
     */

    if (
      lostFound.controllers &&
      lostFound.controllers.feature &&
      typeof lostFound.controllers.feature.handle ===
        "function"
    ) {
      const handled =
        lostFound.controllers.feature.handle(
          parts,
          container
        );

      if (handled) {
        return;
      }
    }

    if (
      lostFound.controllers &&
      lostFound.controllers.publish &&
      typeof lostFound.controllers.publish.handle ===
        "function"
    ) {
      const handled =
        lostFound.controllers.publish.handle(
          hash,
          container
        );

      if (handled) {
        return;
      }
    }

    // 如果地址不存在，回到首页
    if (hash !== "#/home") {
      root.location.hash = "#/home";
    }
  }

  // 启动整个路由系统
  function start() {
    if (started) {
      return;
    }

    started = true;

    root.addEventListener(
      "hashchange",
      route
    );

    if (!root.location.hash) {
      root.location.hash = "#/home";
    } else {
      route();
    }
  }

  lostFound.router = {
    start: start,
    route: route
  };

})(globalThis);