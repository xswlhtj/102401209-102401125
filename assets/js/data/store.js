(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.data = lostFound.data || {};

  // localStorage 中保存失物招领数据所使用的键名
  const STORAGE_KEY = "lost-found-items-v1";


  // 创建统一的错误返回结果
  function createError(code, message) {
    return {
      ok: false,
      error: {
        code: code,
        message: message
      }
    };
  }


  // 复制数据，避免外部代码直接修改内部数组
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }


  // 创建存储服务
  function createStore(storage) {

    if (
      !storage ||
      typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function"
    ) {
      throw new TypeError("createStore 需要接收可用的存储对象");
    }


    // -------------------------
    // 读取数据
    // -------------------------
    function load() {
      try {
        const text = storage.getItem(STORAGE_KEY);

        // 当前还没有保存任何数据
        if (text === null) {
          return {
            ok: true,
            data: []
          };
        }

        const items = JSON.parse(text);

        // 防止 localStorage 中的数据格式被破坏
        if (!Array.isArray(items)) {
          return createError(
            "INVALID_DATA",
            "本地数据格式错误"
          );
        }

        return {
          ok: true,
          data: clone(items)
        };

      } catch (error) {
        return createError(
          "STORAGE_READ_FAILED",
          "读取本地数据失败"
        );
      }
    }


    // -------------------------
    // 保存数据
    // -------------------------
    function save(items) {

      if (!Array.isArray(items)) {
        return createError(
          "INVALID_DATA",
          "只能保存记录数组"
        );
      }

      try {
        const text = JSON.stringify(items);

        storage.setItem(
          STORAGE_KEY,
          text
        );

        return {
          ok: true,
          data: clone(items)
        };

      } catch (error) {
        return createError(
          "STORAGE_WRITE_FAILED",
          "保存本地数据失败"
        );
      }
    }


    // -------------------------
    // 第一次启动时初始化数据
    // -------------------------
    function initialize(seedItems) {

      if (!Array.isArray(seedItems)) {
        return createError(
          "INVALID_SEED_DATA",
          "初始化数据格式错误"
        );
      }

      try {
        const existing =
          storage.getItem(STORAGE_KEY);

        // 已经有数据，不重新覆盖
        if (existing !== null) {
          return load();
        }

        // 第一次打开网页，把 demo 数据存进去
        return save(clone(seedItems));

      } catch (error) {
        return createError(
          "STORAGE_READ_FAILED",
          "初始化本地数据失败"
        );
      }
    }


    return {
      load: load,
      save: save,
      initialize: initialize
    };
  }


  // 暴露给项目中的其他脚本使用
  lostFound.data.STORAGE_KEY = STORAGE_KEY;
  lostFound.data.createStore = createStore;

})(globalThis);