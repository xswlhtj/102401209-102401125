(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.ui = lostFound.ui || {};

  // B 只渲染记录。状态中文由 A 的统一映射函数通过 getStatusText 注入。
  function createItemCard(item, options) {
    if (!options || typeof options.getStatusText !== "function") {
      throw new TypeError("卡片渲染需要传入 A 的 getStatusText(type, status) 函数");
    }

    function element(tag, className, text) {
      const node = root.document.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    const card = element("article", "item-card");
    card.classList.add(item.type === "lost" ? "item-card--lost" : "item-card--found");
    if (item.status === "closed") card.classList.add("item-card--closed");
    card.dataset.itemId = item.id;

    const link = element("a", "item-card__link");
    const detailHref = typeof options.getDetailHref === "function"
      ? options.getDetailHref(item.id)
      : "#/detail/" + encodeURIComponent(item.id);
    link.setAttribute("href", detailHref);
    link.setAttribute("aria-label", "查看“" + item.name + "”详情");
    const image = element("img", "item-card__image");
    const fallbackImage = "assets/images/item-placeholder.svg";
    image.alt = item.name;
    image.width = 96;
    image.height = 96;
    image.loading = "lazy";
    image.addEventListener("error", function () {
      // once 避免占位图也无法加载时循环触发。
      image.src = fallbackImage;
    }, { once: true });
    image.src = item.image || fallbackImage;

    const body = element("div", "item-card__body");
    const badges = element("div", "item-card__badges");
    badges.append(
      element("span", "item-card__type", item.type === "lost" ? "寻物" : "招领"),
      element("span", "item-card__status", options.getStatusText(item.type, item.status))
    );
    function icon(filename) {
      const image = element("img", "");
      image.src = "assets/images/figma/" + filename;
      image.alt = "";
      return image;
    }

    const title = element("h3", "item-card__title", item.name);
    title.title = item.name;
    const location = element("p", "item-card__meta item-card__location");
    const locationText = element("span", "item-card__meta-text", item.location);
    locationText.title = item.location;
    location.setAttribute("aria-label", "地点：" + item.location);
    location.append(icon("location.svg"), locationText);
    const date = element("p", "item-card__meta item-card__date");
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.eventDate);
    const dateText = parts ? Number(parts[2]) + "月" + Number(parts[3]) + "日" : item.eventDate;
    const time = element("time", "item-card__meta-text", dateText);
    time.dateTime = item.eventDate;
    time.title = item.eventDate;
    date.setAttribute("aria-label", "日期：" + item.eventDate);
    date.append(icon("clock.svg"), time);
    const footer = element("div", "item-card__footer");
    footer.append(date, element("span", "item-card__more", "查看详情"));
    body.append(badges, title, location, footer);
    link.append(image, body);
    card.append(link);

    if (typeof options.onOpenDetail === "function") {
      link.addEventListener("click", function (event) {
        // 保留链接的新标签打开等浏览器行为；普通点击交给 A 的路由。
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        options.onOpenDetail(item.id, { from: "#/home" });
      });
    }
    return card;
  }

  lostFound.ui.createItemCard = createItemCard;
})(globalThis);
