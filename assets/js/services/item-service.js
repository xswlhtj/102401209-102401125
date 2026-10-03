(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.services = lostFound.services || {};


  // 创建统一错误结果
  function createError(code, message) {
    return {
      ok: false,
      error: {
        code: code,
        message: message
      }
    };
  }


  // 把时间字符串转为时间戳，供排序使用
  function toTimestamp(value) {
    const time = Date.parse(value);

    return Number.isNaN(time) ? 0 : time;
  }


  // 创建物品业务服务
  function createItemService(store) {

    if (
      !store ||
      typeof store.load !== "function" ||
      typeof store.save !== "function"
    ) {
      throw new TypeError(
        "createItemService 需要接收可用的 store"
      );
    }


    // -------------------------
    // 查询物品列表
    // -------------------------
    function list(filters) {

      // F01阶段暂时只负责读取和排序。
      // filters 参数保留给之后的 F04 搜索与筛选功能。
      const query = filters || {};

      if (
        typeof query !== "object" ||
        Array.isArray(query)
      ) {
        return createError(
          "INVALID_FILTERS",
          "筛选条件格式错误"
        );
      }

      const result = store.load();

      // 数据层读取失败，直接把错误继续返回
      if (!result.ok) {
        return result;
      }

      // 复制一份数组再排序，避免影响原始数据
      const items = result.data.slice();

      // createdAt 越新的记录排在越前面
      items.sort(function (a, b) {
        return (
          toTimestamp(b.createdAt) -
          toTimestamp(a.createdAt)
        );
      });

      return {
        ok: true,
        data: items
      };
    }


    return {
      list: list
    };
  }


  // 暴露给其他脚本使用
  lostFound.services.createItemService =
    createItemService;

})(globalThis);