import {
  describe,
  it,
  expect
} from "vitest";

import "../assets/js/services/item-service.js";


// =========================
// 创建假的 store
// =========================
function createFakeStore(
  items,
  options
) {
  const config =
    options || {};

  return {
    load() {

      if (config.failLoad) {
        return {
          ok: false,
          error: {
            code: "STORAGE_READ_FAILED",
            message: "读取存储失败"
          }
        };
      }

      return {
        ok: true,
        data: items.slice()
      };
    },

    save(newItems) {
      return {
        ok: true,
        data: newItems.slice()
      };
    }
  };
}


// =========================
// 测试数据
// =========================
const sampleItems = [
  {
    id: "item-001",
    ownerId: "demo-user-001",
    name: "校园卡",
    createdAt:
      "2026-10-01T10:00:00+08:00"
  },

  {
    id: "item-002",
    ownerId: "demo-user-002",
    name: "雨伞",
    createdAt:
      "2026-10-03T12:00:00+08:00"
  },

  {
    id: "item-003",
    ownerId: "demo-user-001",
    name: "黑色蓝牙耳机",
    createdAt:
      "2026-10-04T09:00:00+08:00"
  },

  {
    id: "item-004",
    ownerId: "demo-user-001",
    name: "水杯",
    createdAt:
      "2026-10-02T15:00:00+08:00"
  }
];


function createService(
  items,
  options
) {
  const store =
    createFakeStore(
      items,
      options
    );

  return globalThis
    .LostFound
    .services
    .createItemService(store);
}


describe(
  "F07 我的发布 getByOwner",
  function () {

    it(
      "只应该返回指定用户发布的记录，并按时间倒序",
      function () {

        const service =
          createService(sampleItems);

        const result =
          service.getByOwner(
            "demo-user-001"
          );

        expect(result.ok)
          .toBe(true);

        expect(
          result.data.map(
            function (item) {
              return item.id;
            }
          )
        ).toEqual([
          "item-003",
          "item-004",
          "item-001"
        ]);

        expect(
          result.data.every(
            function (item) {
              return (
                item.ownerId ===
                "demo-user-001"
              );
            }
          )
        ).toBe(true);
      }
    );


    it(
      "用户没有发布记录时应该返回空数组",
      function () {

        const service =
          createService(sampleItems);

        const result =
          service.getByOwner(
            "demo-user-999"
          );

        expect(result.ok)
          .toBe(true);

        expect(result.data)
          .toEqual([]);
      }
    );


    it(
      "空 ownerId 应该返回 INVALID_OWNER_ID",
      function () {

        const service =
          createService(sampleItems);

        const result =
          service.getByOwner("   ");

        expect(result.ok)
          .toBe(false);

        expect(
          result.error.code
        ).toBe(
          "INVALID_OWNER_ID"
        );
      }
    );


    it(
      "存储读取失败时应该返回原有错误",
      function () {

        const service =
          createService(
            sampleItems,
            {
              failLoad: true
            }
          );

        const result =
          service.getByOwner(
            "demo-user-001"
          );

        expect(result.ok)
          .toBe(false);

        expect(
          result.error.code
        ).toBe(
          "STORAGE_READ_FAILED"
        );
      }
    );

  }
);