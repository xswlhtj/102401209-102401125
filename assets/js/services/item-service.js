(function (root) {
  "use strict";

  const lostFound =
    root.LostFound = root.LostFound || {};

  lostFound.services =
    lostFound.services || {};


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

    return Number.isNaN(time)
      ? 0
      : time;
  }


  // =========================
  // 清理普通字符串输入
  // =========================
  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }


  // =========================
  // 搜索文字标准化
  // =========================
  function normalizeSearchText(value) {
    return typeof value === "string"
      ? value
          .trim()
          .toLocaleLowerCase("zh-CN")
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
    // F01 / F04
    // 查询、搜索和筛选物品列表
    // =========================
    function list(filters) {

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


      // -------------------------
      // 整理筛选条件
      // -------------------------
      const keyword =
        normalizeSearchText(
          query.keyword
        );

      const type =
        query.type === "lost" ||
        query.type === "found"
          ? query.type
          : "all";

      const category =
        typeof query.category === "string" &&
        query.category.trim() &&
        query.category.trim() !== "all"
          ? query.category.trim()
          : "all";


      // -------------------------
      // 读取全部数据
      // -------------------------
      const result = store.load();

      if (!result.ok) {
        return result;
      }


      // -------------------------
      // 搜索和筛选
      // -------------------------
      const items =
        result.data.filter(function (item) {

          // 类型筛选
          const typeMatches =
            type === "all" ||
            item.type === type;


          // 类别筛选
          const categoryMatches =
            category === "all" ||
            item.category === category;


          // 搜索范围：
          // 名称、类别、地点、描述
          const searchText = [
            item.name,
            item.category,
            item.location,
            item.description
          ]
            .map(normalizeSearchText)
            .join(" ");


          // 空关键词表示不限制
          const keywordMatches =
            !keyword ||
            searchText.includes(keyword);


          return (
            typeMatches &&
            categoryMatches &&
            keywordMatches
          );
        });


      // -------------------------
      // 按发布时间从新到旧排序
      // -------------------------
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
    // F02 / F03
    // 新增一条失物招领记录
    // =========================
    function create(formData) {

      // -------------------------
      // 检查参数格式
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
      // 读取已有记录
      // -------------------------
      const loadResult =
        store.load();

      if (!loadResult.ok) {
        return loadResult;
      }


      const now =
        new Date().toISOString();


      // -------------------------
      // 创建新记录
      // -------------------------
      const item = {

        // 自动生成 ID
        id:
          "item-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2, 8),

        // 当前项目使用演示用户
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

        // 新发布记录统一为 active
        status:
          "active",

        createdAt:
          now,

        updatedAt:
          now
      };


      // -------------------------
      // 加入已有记录
      // -------------------------
      const nextItems =
        loadResult.data.slice();

      nextItems.push(item);


      // -------------------------
      // 保存
      // -------------------------
      const saveResult =
        store.save(nextItems);

      if (!saveResult.ok) {
        return saveResult;
      }


      // 只有真正保存成功才返回成功
      return {
        ok: true,
        data: item
      };
    }


    // =========================
    // F05
    // 根据 ID 查询单条记录
    // =========================
    function getById(id) {

      const itemId =
        cleanString(id);


      // -------------------------
      // ID 不能为空
      // -------------------------
      if (!itemId) {
        return createError(
          "INVALID_ID",
          "物品 ID 不能为空"
        );
      }


      // -------------------------
      // 读取全部记录
      // -------------------------
      const result =
        store.load();

      if (!result.ok) {
        return result;
      }


      // -------------------------
      // 根据 ID 查找
      // -------------------------
      const item =
        result.data.find(
          function (record) {
            return record.id === itemId;
          }
        );


      // -------------------------
      // 没有找到
      // -------------------------
      if (!item) {
        return createError(
          "ITEM_NOT_FOUND",
          "没有找到这条信息"
        );
      }


      // -------------------------
      // 查询成功
      // -------------------------
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
      create: create,
      getById: getById
    };
  }


  // =========================
  // 暴露给其他脚本
  // =========================
  lostFound.services.createItemService =
    createItemService;

})(globalThis);