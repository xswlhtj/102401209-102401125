(function (root) {
  "use strict";

  const lostFound =
    root.LostFound = root.LostFound || {};


  // =========================
  // 显示应用初始化错误
  // =========================

  function showError(
    container,
    message
  ) {
    const text =
      root.document.createElement("p");

    text.className = "app-error";
    text.textContent = message;

    container.replaceChildren(text);
  }


  // =========================
  // 应用启动
  // =========================

  function start() {
    const container =
      root.document.getElementById("app");


    // 页面中不存在 #app 时不继续执行
    if (!container) {
      return;
    }


    try {

      // -------------------------
      // 1. 检查数据模块
      // -------------------------

      if (
        !lostFound.data ||
        typeof lostFound.data.createStore !==
          "function"
      ) {
        showError(
          container,
          "数据模块加载失败"
        );

        return;
      }


      // -------------------------
      // 2. 创建本地存储服务
      // -------------------------

      const store =
        lostFound.data.createStore(
          root.localStorage
        );


      // -------------------------
      // 3. 初始化演示数据
      //
      // 只有第一次运行时会真正写入，
      // 后续不会反复覆盖已有数据。
      // -------------------------

      const initResult =
        store.initialize(
          lostFound.data.demoItems
        );


      if (!initResult.ok) {
        showError(
          container,
          initResult.error.message
        );

        return;
      }


      // -------------------------
      // 4. 检查统一路由
      // -------------------------

      if (
        !lostFound.router ||
        typeof lostFound.router.start !==
          "function"
      ) {
        showError(
          container,
          "路由模块加载失败"
        );

        return;
      }


      // -------------------------
      // 5. 启动统一路由
      // -------------------------

      lostFound.router.start();


    } catch (error) {

      console.error(error);

      showError(
        container,
        "页面初始化失败，请刷新后重试"
      );
    }
  }


  // =========================
  // 等待 DOM 准备完成
  // =========================

  if (
    root.document.readyState ===
    "loading"
  ) {

    root.document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();
  }

})(globalThis);