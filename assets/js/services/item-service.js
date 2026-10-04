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

      const query =
        filters || {};


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
      // 整理搜索条件
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
      // 读取数据
      // -------------------------
      const result =
        store.load();


      if (!result.ok) {
        return result;
      }


      // -------------------------
      // 搜索和筛选
      // -------------------------
      const items =
        result.data.filter(
          function (item) {

            const typeMatches =
              type === "all" ||
              item.type === type;


            const categoryMatches =
              category === "all" ||
              item.category === category;


            const searchText = [
              item.name,
              item.category,
              item.location,
              item.description
            ]
              .map(normalizeSearchText)
              .join(" ");


            const keywordMatches =
              !keyword ||
              searchText.includes(
                keyword
              );


            return (
              typeMatches &&
              categoryMatches &&
              keywordMatches
            );
          }
        );


      // -------------------------
      // 按发布时间从新到旧排序
      // -------------------------
      items.sort(
        function (a, b) {
          return (
            toTimestamp(
              b.createdAt
            ) -
            toTimestamp(
              a.createdAt
            )
          );
        }
      );


      return {
        ok: true,
        data: items
      };
    }


    // =========================
    // F02 / F03
    // 新增失物招领记录
    // =========================
    function create(formData) {

      // -------------------------
      // 参数格式检查
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
      // 类型检查
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
      // 清理输入
      // -------------------------
      const name =
        cleanString(
          formData.name
        );

      const category =
        cleanString(
          formData.category
        );

      const eventDate =
        cleanString(
          formData.eventDate
        );

      const location =
        cleanString(
          formData.location
        );

      const description =
        cleanString(
          formData.description
        );

      const image =
        cleanString(
          formData.image
        );

      const contactType =
        cleanString(
          formData.contactType
        );

      const contactValue =
        cleanString(
          formData.contactValue
        );


      // -------------------------
      // 必填检查
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


      nextItems.push(
        item
      );


      // -------------------------
      // 保存
      // -------------------------
      const saveResult =
        store.save(
          nextItems
        );


      if (!saveResult.ok) {
        return saveResult;
      }


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
      // 读取全部数据
      // -------------------------
      const result =
        store.load();


      if (!result.ok) {
        return result;
      }


      // -------------------------
      // 根据 ID 查找记录
      // -------------------------
      const item =
        result.data.find(
          function (record) {
            return (
              record.id === itemId
            );
          }
        );


      // -------------------------
      // 没找到记录
      // -------------------------
      if (!item) {
        return createError(
          "ITEM_NOT_FOUND",
          "没有找到这条信息"
        );
      }


      return {
        ok: true,
        data: item
      };
    }


    // =========================
    // F07
    // 根据发布者 ID 查询记录
    // =========================
    function getByOwner(ownerId) {

      const userId =
        cleanString(
          ownerId
        );


      // -------------------------
      // ownerId 不能为空
      // -------------------------
      if (!userId) {
        return createError(
          "INVALID_OWNER_ID",
          "发布者 ID 不能为空"
        );
      }


      // -------------------------
      // 读取全部数据
      // -------------------------
      const result =
        store.load();


      if (!result.ok) {
        return result;
      }


      // -------------------------
      // 筛选该用户发布的信息
      // -------------------------
      const items =
        result.data.filter(
          function (item) {
            return (
              item.ownerId === userId
            );
          }
        );


      // -------------------------
      // 按发布时间从新到旧排序
      // -------------------------
      items.sort(
        function (a, b) {
          return (
            toTimestamp(
              b.createdAt
            ) -
            toTimestamp(
              a.createdAt
            )
          );
        }
      );


      return {
        ok: true,
        data: items
      };
    }


    // =========================
    // F08
    // 将记录标记为已完成
    // =========================
    function closeItem(id, actorId) {

      const itemId =
        cleanString(id);

      const userId =
        cleanString(actorId);


      // -------------------------
      // 参数检查
      // -------------------------
      if (!itemId) {
        return createError(
          "INVALID_ID",
          "物品 ID 不能为空"
        );
      }


      if (!userId) {
        return createError(
          "INVALID_ACTOR_ID",
          "操作用户 ID 不能为空"
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
      // 查找记录位置
      // -------------------------
      const index =
        result.data.findIndex(
          function (item) {
            return (
              item.id === itemId
            );
          }
        );


      // -------------------------
      // 1. 记录必须存在
      // -------------------------
      if (index === -1) {
        return createError(
          "ITEM_NOT_FOUND",
          "没有找到这条信息"
        );
      }


      const oldItem =
        result.data[index];


      // -------------------------
      // 2. 必须是发布者本人
      // -------------------------
      if (
        oldItem.ownerId !== userId
      ) {
        return createError(
          "FORBIDDEN",
          "无权修改这条信息"
        );
      }


      // -------------------------
      // 3. 已经完成不能重复修改
      // -------------------------
      if (
        oldItem.status === "closed"
      ) {
        return createError(
          "ITEM_ALREADY_CLOSED",
          "该信息已经完成，无需重复修改"
        );
      }


      // -------------------------
      // 创建修改后的新记录
      // -------------------------
      const updatedItem = {
        ...oldItem,

        status:
          "closed",

        updatedAt:
          new Date().toISOString()
      };


      // -------------------------
      // 创建新的数据数组
      // -------------------------
      const nextItems =
        result.data.slice();


      nextItems[index] =
        updatedItem;


      // -------------------------
      // 保存修改结果
      // -------------------------
      const saveResult =
        store.save(
          nextItems
        );


      if (!saveResult.ok) {
        return saveResult;
      }


      // -------------------------
      // 保存成功
      // -------------------------
      return {
        ok: true,
        data: updatedItem
      };
    }


    // =========================
    // 对外提供接口
    // =========================
    return {
      list: list,
      create: create,
      getById: getById,
      getByOwner: getByOwner,
      closeItem: closeItem
    };
  }


  // =========================
  // 暴露给其他脚本使用
  // =========================
  lostFound.services.createItemService =
    createItemService;

})(globalThis);