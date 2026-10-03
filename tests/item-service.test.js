import { describe, it, expect } from "vitest";

import "../assets/js/services/item-service.js";


function createFakeStore(items) {
  return {
    load() {
      return {
        ok: true,
        data: items
      };
    },

    save(newItems) {
      return {
        ok: true,
        data: newItems
      };
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

    const store = createFakeStore(items);

    const service =
      globalThis.LostFound.services.createItemService(
        store
      );

    const result = service.list({});

    expect(result.ok).toBe(true);
    expect(result.data.length).toBe(2);
  });


  it("记录应该按照 createdAt 从新到旧排序", () => {
    const items = [
      {
        id: "old",
        name: "旧记录",
        createdAt: "2026-09-20T10:00:00+08:00"
      },
      {
        id: "new",
        name: "新记录",
        createdAt: "2026-09-25T10:00:00+08:00"
      },
      {
        id: "middle",
        name: "中间记录",
        createdAt: "2026-09-22T10:00:00+08:00"
      }
    ];

    const store = createFakeStore(items);

    const service =
      globalThis.LostFound.services.createItemService(
        store
      );

    const result = service.list({});

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

    const store = createFakeStore(items);

    const service =
      globalThis.LostFound.services.createItemService(
        store
      );

    service.list({});

    expect(
      items.map(function (item) {
        return item.id;
      })
    ).toEqual(originalOrder);
  });


  it("filters 不是对象时应该返回错误", () => {
    const store = createFakeStore([]);

    const service =
      globalThis.LostFound.services.createItemService(
        store
      );

    const result = service.list("错误参数");

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(
      "INVALID_FILTERS"
    );
  });

});