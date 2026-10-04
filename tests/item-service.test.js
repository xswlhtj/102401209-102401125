import { describe, it, expect } from "vitest";

import "../assets/js/services/item-service.js";


function createFakeStore(initialItems, options) {
  let items = Array.isArray(initialItems)
    ? initialItems.slice()
    : [];

  const settings = options || {};

  return {
    load() {
      if (settings.failLoad) {
        return {
          ok: false,
          error: {
            code: "STORAGE_READ_FAILED",
            message: "读取失败"
          }
        };
      }

      return {
        ok: true,
        data: items.slice()
      };
    },

    save(newItems) {
      if (settings.failSave) {
        return {
          ok: false,
          error: {
            code: "STORAGE_WRITE_FAILED",
            message: "保存失败"
          }
        };
      }

      items = newItems.slice();

      return {
        ok: true,
        data: items.slice()
      };
    },

    getItems() {
      return items.slice();
    }
  };
}


describe("item service list", () => {

  it("能够读取全部记录", () => {
    const items = [
      {
        id: "item-001",
        name: "校园卡",
        createdAt: "2026-09-24T18:30:00+08:00"
      },
      {
        id: "item-002",
        name: "蓝牙耳机",
        createdAt: "2026-09-23T10:00:00+08:00"
      }
    ];

    const store =
      createFakeStore(items);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.list({});

    expect(result.ok).toBe(true);
    expect(result.data.length).toBe(2);
  });


  it("记录应该按照 createdAt 从新到旧排序", () => {
    const items = [
      {
        id: "old",
        createdAt: "2026-09-20T10:00:00+08:00"
      },
      {
        id: "new",
        createdAt: "2026-09-25T10:00:00+08:00"
      },
      {
        id: "middle",
        createdAt: "2026-09-22T10:00:00+08:00"
      }
    ];

    const store =
      createFakeStore(items);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.list({});

    expect(result.ok).toBe(true);

    expect(
      result.data.map(function (item) {
        return item.id;
      })
    ).toEqual([
      "new",
      "middle",
      "old"
    ]);
  });


  it("排序不应该修改 store 返回的原数组", () => {
    const items = [
      {
        id: "old",
        createdAt: "2026-09-20T10:00:00+08:00"
      },
      {
        id: "new",
        createdAt: "2026-09-25T10:00:00+08:00"
      }
    ];

    const originalOrder =
      items.map(function (item) {
        return item.id;
      });

    const store =
      createFakeStore(items);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    service.list({});

    expect(
      items.map(function (item) {
        return item.id;
      })
    ).toEqual(originalOrder);
  });


  it("filters 不是对象时应该返回错误", () => {
    const store =
      createFakeStore([]);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.list("错误参数");

    expect(result.ok).toBe(false);

    expect(result.error.code).toBe(
      "INVALID_FILTERS"
    );
  });

});


describe("item service create", () => {

  it("发布寻物时应创建 active 状态记录并保存", () => {
    const store =
      createFakeStore([]);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.create({
        type: "lost",
        name: "黑色蓝牙耳机",
        category: "电子设备",
        eventDate: "2026-10-03",
        location: "东三教学楼",
        description: "充电盒有轻微划痕",
        image: "",
        contactType: "QQ",
        contactValue: "123456789"
      });

    expect(result.ok).toBe(true);

    expect(result.data.type).toBe("lost");
    expect(result.data.status).toBe("active");
    expect(result.data.ownerId).toBe(
      "demo-user-001"
    );

    expect(result.data.id).toMatch(
      /^item-/
    );

    expect(
      store.getItems().length
    ).toBe(1);

    expect(
      store.getItems()[0].name
    ).toBe("黑色蓝牙耳机");
  });


  it("发布招领时应创建 active 状态记录并保存", () => {
    const store =
      createFakeStore([]);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.create({
        type: "found",
        name: "校园卡",
        category: "证件卡片",
        eventDate: "2026-10-03",
        location: "图书馆三楼",
        description: "在座位旁捡到",
        image: "",
        contactType: "手机号",
        contactValue: "13812345678"
      });

    expect(result.ok).toBe(true);

    expect(result.data.type).toBe(
      "found"
    );

    expect(result.data.status).toBe(
      "active"
    );

    expect(
      store.getItems().length
    ).toBe(1);
  });


  it("缺少必填字段时应该拒绝发布", () => {
    const store =
      createFakeStore([]);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.create({
        type: "lost",
        name: "",
        category: "电子设备",
        eventDate: "2026-10-03",
        location: "东三教学楼",
        description: "",
        image: "",
        contactType: "QQ",
        contactValue: "123456789"
      });

    expect(result.ok).toBe(false);

    expect(result.error.code).toBe(
      "MISSING_REQUIRED_FIELD"
    );

    expect(
      store.getItems().length
    ).toBe(0);
  });


  it("保存失败时不能误报发布成功", () => {
    const store =
      createFakeStore(
        [],
        {
          failSave: true
        }
      );

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.create({
        type: "lost",
        name: "黑色雨伞",
        category: "雨具",
        eventDate: "2026-10-03",
        location: "食堂门口",
        description: "",
        image: "",
        contactType: "QQ",
        contactValue: "123456789"
      });

    expect(result.ok).toBe(false);

    expect(result.error.code).toBe(
      "STORAGE_WRITE_FAILED"
    );

    expect(
      store.getItems().length
    ).toBe(0);
  });

});


describe("item service getById", () => {

  it("存在的 ID 应该返回对应记录", () => {
    const items = [
      {
        id: "item-001",
        name: "校园卡"
      },
      {
        id: "item-002",
        name: "黑色蓝牙耳机"
      }
    ];

    const store =
      createFakeStore(items);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.getById("item-002");

    expect(result.ok).toBe(true);
    expect(result.data.id).toBe("item-002");
    expect(result.data.name).toBe("黑色蓝牙耳机");
  });


  it("不存在的 ID 应该返回 ITEM_NOT_FOUND", () => {
    const store =
      createFakeStore([
        {
          id: "item-001",
          name: "校园卡"
        }
      ]);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.getById("item-999");

    expect(result.ok).toBe(false);

    expect(result.error.code).toBe(
      "ITEM_NOT_FOUND"
    );
  });


  it("空 ID 应该返回 INVALID_ID", () => {
    const store =
      createFakeStore([]);

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.getById("   ");

    expect(result.ok).toBe(false);

    expect(result.error.code).toBe(
      "INVALID_ID"
    );
  });


  it("读取存储失败时应该返回原有错误", () => {
    const store =
      createFakeStore(
        [],
        {
          failLoad: true
        }
      );

    const service =
      globalThis.LostFound.services
        .createItemService(store);

    const result =
      service.getById("item-001");

    expect(result.ok).toBe(false);

    expect(result.error.code).toBe(
      "STORAGE_READ_FAILED"
    );
  });

});