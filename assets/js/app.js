(function (root) {
  "use strict";

  const lostFound = root.LostFound;

  function showError(container, message) {
    const text = root.document.createElement("p");

    text.className = "app-error";
    text.textContent = message;

    container.replaceChildren(text);
  }


  function start() {
    const container =
      root.document.getElementById("app");

    if (!container) {
      return;
    }

    try {

      // 1. 创建本地存储服务
      const store =
        lostFound.data.createStore(
          root.localStorage
        );


      // 2. 第一次运行时写入演示数据
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


      // 3. 创建物品业务服务
      const itemService =
        lostFound.services.createItemService(
          store
        );


      // 4. 查询首页列表
      const listResult =
        itemService.list({});

      if (!listResult.ok) {
        showError(
          container,
          listResult.error.message
        );
        return;
      }


      // 5. 把真实数据交给首页渲染
      lostFound.pages.home.render(
        container,
        listResult.data,
        {
          getStatusText:
            lostFound.core.getStatusText
        }
      );

    } catch (error) {
      console.error(error);

      showError(
        container,
        "页面初始化失败，请刷新后重试"
      );
    }
  }


  start();

})(globalThis);