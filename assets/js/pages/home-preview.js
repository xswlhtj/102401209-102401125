(function (root) {
  "use strict";

  // A 接入 app.js 或已渲染页面后，由正式入口负责初始化，预览不覆盖真实内容。
  if (root.document.querySelector('script[src="assets/js/app.js"]')) return;
  const container = root.document.getElementById("app");
  if (container.querySelector(".home-page")) return;

  // B 的界面预览数据：仅让 index.html 可直接验收，不读写存储。
  const previewItems = [
    { id: "preview-001", type: "found", status: "active", name: "校园卡", location: "图书馆三楼", eventDate: "2026-09-24", image: "assets/images/figma/campus-card.png" },
    { id: "preview-002", type: "lost", status: "active", name: "黑色蓝牙耳机", location: "西三教学楼", eventDate: "2026-09-24", image: "assets/images/figma/earbuds.png" },
    { id: "preview-003", type: "found", status: "closed", name: "雨伞", location: "食堂门口", eventDate: "2026-09-23", image: "assets/images/figma/umbrella.png" },
    { id: "preview-004", type: "found", status: "active", name: "学生证", location: "东区田径场", eventDate: "2026-09-22", image: "assets/images/figma/campus-card.png" },
    { id: "preview-005", type: "lost", status: "active", name: "蓝牙耳机充电盒", location: "计算机机房", eventDate: "2026-09-21", image: "assets/images/figma/earbuds.png" },
    { id: "preview-006", type: "found", status: "closed", name: "蓝色折叠伞", location: "生活三区", eventDate: "2026-09-20", image: "assets/images/figma/umbrella.png" }
  ];

  function getPreviewStatusText(type, status) {
    if (status === "closed") return type === "lost" ? "已找到" : "已归还";
    return type === "lost" ? "寻找中" : "待认领";
  }

  root.LostFound.pages.home.render(container, previewItems, {
    getStatusText: getPreviewStatusText
  });
})(globalThis);
