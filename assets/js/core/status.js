(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.core = lostFound.core || {};

  function getStatusText(type, status) {
    if (type === "lost") {
      return status === "closed" ? "已找到" : "寻找中";
    }

    if (type === "found") {
      return status === "closed" ? "已归还" : "待认领";
    }

    return "未知状态";
  }

  lostFound.core.getStatusText = getStatusText;

})(globalThis);