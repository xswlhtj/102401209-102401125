(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};

  function showRouteError(container, message) {
    const text = container.ownerDocument.createElement("p");
    text.className = "app-error";
    text.textContent = message;
    container.replaceChildren(text);
  }

  function createService() {
    const store = lostFound.data.createStore(root.localStorage);
    const initialized = store.initialize(lostFound.data.demoItems);
    if (!initialized.ok) return initialized;
    return { ok: true, data: lostFound.services.createItemService(store) };
  }

  function installPublishRoutes() {
    if (!root.document || typeof root.addEventListener !== "function") return;
    if (lostFound.router && typeof lostFound.router.start === "function") return;
    const container = root.document.getElementById("app");
    const publish = lostFound.pages.publish;
    if (!container || !publish) return;

    function renderHome() {
      const serviceResult = createService();
      if (!serviceResult.ok) return showRouteError(container, serviceResult.error.message);
      const listResult = serviceResult.data.list({});
      if (!listResult.ok) return showRouteError(container, listResult.error.message);
      lostFound.pages.home.render(container, listResult.data, { getStatusText: lostFound.core.getStatusText });
      publish.setNavigation("home");
    }

    function route() {
      const hash = root.location.hash || "#/home";
      const formMatch = /^#\/publish\/(lost|found)$/.exec(hash);
      const successMatch = /^#\/publish\/success\/([^/]+)$/.exec(hash);
      if (formMatch) {
        const serviceResult = createService();
        if (!serviceResult.ok) return showRouteError(container, serviceResult.error.message);
        publish.renderForm(container, formMatch[1], {
          createItem: function (data) { return serviceResult.data.create(data); },
          onSuccess: function (item) {
            root.location.hash = "#/publish/success/" + encodeURIComponent(item.id);
          }
        });
        return;
      }
      if (successMatch) {
        const serviceResult = createService();
        if (!serviceResult.ok) return showRouteError(container, serviceResult.error.message);
        const listResult = serviceResult.data.list({});
        const id = decodeURIComponent(successMatch[1]);
        const item = listResult.ok ? listResult.data.find(function (record) { return record.id === id; }) : null;
        if (!item) return showRouteError(container, "找不到刚发布的信息，请返回首页查看");
        publish.renderSuccess(container, item);
        return;
      }
      if (hash === "#/home") renderHome();
    }

    root.addEventListener("hashchange", route);
    route();
  }

  if (root.document) root.document.addEventListener("DOMContentLoaded", installPublishRoutes);
})(globalThis);
