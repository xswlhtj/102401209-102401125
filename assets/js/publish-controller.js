(function (root) {
  "use strict";

  const lostFound =
    root.LostFound = root.LostFound || {};


  // =========================
  // 显示路由错误
  // =========================

  function showRouteError(
    container,
    message
  ) {
    const text =
      container.ownerDocument
        .createElement("p");

    text.className = "app-error";
    text.textContent = message;

    container.replaceChildren(text);
  }


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
        lostFound.services
          .createItemService(store)
    };
  }


  // =========================
  // 渲染首页
  // =========================

  function renderHome(container) {
    const serviceResult =
      createService();

    if (!serviceResult.ok) {
      showRouteError(
        container,
        serviceResult.error.message
      );

      return;
    }


    const listResult =
      serviceResult.data.list({});

    if (!listResult.ok) {
      showRouteError(
        container,
        listResult.error.message
      );

      return;
    }


    lostFound.pages.home.render(
      container,
      listResult.data,
      {
        getStatusText:
          lostFound.core
            .getStatusText
      }
    );


    // 更新导航栏状态
    if (
      lostFound.pages.publish &&
      typeof lostFound.pages.publish
        .setNavigation === "function"
    ) {
      lostFound.pages.publish
        .setNavigation("home");
    }
  }


  // =========================
  // 渲染发布表单
  // =========================

  function renderPublishForm(
    container,
    type
  ) {
    const publish =
      lostFound.pages.publish;

    const serviceResult =
      createService();


    if (!serviceResult.ok) {
      showRouteError(
        container,
        serviceResult.error.message
      );

      return;
    }


    publish.renderForm(
      container,
      type,
      {
        createItem:
          function (data) {
            return serviceResult.data
              .create(data);
          },

        onSuccess:
          function (item) {
            root.location.hash =
              "#/publish/success/" +
              encodeURIComponent(
                item.id
              );
          }
      }
    );
  }


  // =========================
  // 渲染发布成功页面
  // =========================

  function renderPublishSuccess(
    container,
    encodedId
  ) {
    const publish =
      lostFound.pages.publish;

    const serviceResult =
      createService();


    if (!serviceResult.ok) {
      showRouteError(
        container,
        serviceResult.error.message
      );

      return;
    }


    const listResult =
      serviceResult.data.list({});


    if (!listResult.ok) {
      showRouteError(
        container,
        listResult.error.message
      );

      return;
    }


    let id;

    try {
      id =
        decodeURIComponent(
          encodedId
        );
    } catch (error) {
      showRouteError(
        container,
        "发布信息地址无效，请返回首页查看"
      );

      return;
    }


    const item =
      listResult.data.find(
        function (record) {
          return record.id === id;
        }
      );


    if (!item) {
      showRouteError(
        container,
        "找不到刚发布的信息，请返回首页查看"
      );

      return;
    }


    publish.renderSuccess(
      container,
      item
    );
  }


  // =========================
  // Publish 路由处理器
  //
  // router.js 会调用这里。
  //
  // 属于本模块：
  //   返回 true
  //
  // 不属于本模块：
  //   返回 false
  // =========================

  function handle(
    hash,
    container
  ) {
    const publish =
      lostFound.pages.publish;


    // 如果发布页面模块还没有加载，
    // 则当前模块无法处理路由。
    if (!publish) {
      return false;
    }


    // -------------------------
    // 首页
    // -------------------------

    if (hash === "#/home") {
      renderHome(container);

      return true;
    }


    // -------------------------
    // 发布寻物 / 发布招领
    //
    // #/publish/lost
    // #/publish/found
    // -------------------------

    const formMatch =
      /^#\/publish\/(lost|found)$/
        .exec(hash);


    if (formMatch) {
      renderPublishForm(
        container,
        formMatch[1]
      );

      return true;
    }


    // -------------------------
    // 发布成功
    //
    // #/publish/success/item-001
    // -------------------------

    const successMatch =
      /^#\/publish\/success\/([^/]+)$/
        .exec(hash);


    if (successMatch) {
      renderPublishSuccess(
        container,
        successMatch[1]
      );

      return true;
    }


    // 当前地址不属于发布模块
    return false;
  }


  // =========================
  // 暴露给 router.js
  // =========================

  lostFound.controllers =
    lostFound.controllers || {};

  lostFound.controllers.publish = {
    handle: handle
  };

})(globalThis);