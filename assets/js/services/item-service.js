(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.services = lostFound.services || {};


  // =========================
  // 创建统一错误结果
  // =========================
  function createError(code, message) {
    return {
      ok: false,
      error: {
        code: code,
        message: message
      }
    };
  }


  // =========================
  // 时间字符串转时间戳
  // =========================
  function toTimestamp(value) {
    const time = Date.parse(value);

    return Number.isNaN(time) ? 0 : time;
  }


  // =========================
  // 清理字符串输入
  // =========================
  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }


  // =========================
  // 创建物品业务服务
  // =========================
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


    // =========================
    // 查询物品列表
    // =========================
    function list(filters) {

      // F01阶段负责读取和排序。
      // filters 保留给之后 F04 搜索和筛选功能使用。
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

      // 读取失败时直接返回 store 的错误
      if (!result.ok) {
        return result;
      }


      // 复制数组，避免 sort 修改原始数据
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


    // =========================
    // 新增一条失物招领记录
    // =========================
    function create(formData) {

      // -------------------------
      // 检查参数基本格式
      // -------------------------
      if (
        !formData ||
        typeof formData !== "object" ||
        Array.isArray(formData)
      ) {
        return createError(
          "INVALID_FORM_DATA",
          "发布信息格式错误"
        );
      }


      // -------------------------
      // 只允许 lost / found
      // -------------------------
      if (
        formData.type !== "lost" &&
        formData.type !== "found"
      ) {
        return createError(
          "INVALID_TYPE",
          "信息类型必须为 lost 或 found"
        );
      }


      // -------------------------
      // 清理用户输入
      // -------------------------
      const name =
        cleanString(formData.name);

      const category =
        cleanString(formData.category);

      const eventDate =
        cleanString(formData.eventDate);

      const location =
        cleanString(formData.location);

      const description =
        cleanString(formData.description);

      const image =
        cleanString(formData.image);

      const contactType =
        cleanString(formData.contactType);

      const contactValue =
        cleanString(formData.contactValue);


      // -------------------------
      // 基础必填检查
      // -------------------------
      if (
        !name ||
        !category ||
        !eventDate ||
        !location ||
        !contactType ||
        !contactValue
      ) {
        return createError(
          "MISSING_REQUIRED_FIELD",
          "发布信息缺少必填内容"
        );
      }


      // -------------------------
      // 读取原有记录
      // -------------------------
      const loadResult = store.load();

      if (!loadResult.ok) {
        return loadResult;
      }


      // 当前时间
      const now =
        new Date().toISOString();


      // -------------------------
      // 创建新记录
      // -------------------------
      const item = {

        // 自动生成ID
        id:
          "item-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2, 8),

        // 当前项目为单机演示，
        // 固定使用演示用户
        ownerId:
          "demo-user-001",

        type:
          formData.type,

        name:
          name,

        category:
          category,

        eventDate:
          eventDate,

        location:
          location,

        description:
          description,

        image:
          image,

        contactType:
          contactType,

        contactValue:
          contactValue,

        // 新发布的信息统一为 active
        status:
          "active",

        createdAt:
          now,

        updatedAt:
          now
      };


      // -------------------------
      // 加入原有记录
      // -------------------------
      const nextItems =
        loadResult.data.slice();

      nextItems.push(item);


      // -------------------------
      // 保存到 localStorage
      // -------------------------
      const saveResult =
        store.save(nextItems);

      if (!saveResult.ok) {
        return saveResult;
      }


      // 只有真正保存成功以后
      // 才返回发布成功
      return {
        ok: true,
        data: item
      };
    }


    // =========================
    // 对外提供的接口
    // =========================
    return {
      list: list,
      create: create
    };
  }


  // =========================
  // 暴露给其他脚本
  // =========================
  lostFound.services.createItemService =
    createItemService;

})(globalThis);