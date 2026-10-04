import {
  describe,
  it,
  expect
} from "vitest";

import "../assets/js/core/status.js";
import "../assets/js/services/item-service.js";


// =========================
// 创建假的 store
// =========================
function createFakeStore(
  initialItems,
  options
) {
  const config =
    options || {};

  let items =
    initialItems.map(function (item) {
      return { ...item };
    });

  let saveCount = 0;


  return {

    load() {
      return {
        ok: true,
        data: items.map(function (item) {
          return { ...item };
        })
      };
    },


    save(nextItems) {

      saveCount += 1;

      if (config.failSave) {
        return {
          ok: false,
          error: {
            code: "STORAGE_WRITE_FAILED",
            message: "保存失败"
          }
        };
      }

      items =
        nextItems.map(function (item) {
          return { ...item };
        });

      return {
        ok: true,
        data: items
      };
    },


    getData() {
      return items;
    },


    getSaveCount() {
      return saveCount;
    }

  };
}


// =========================
// 创建 service
// =========================
function createService(
  items,
  options
) {
  const store =
    createFakeStore(
      items,
      options
    );

  const service =
    globalThis
      .LostFound
      .services
      .createItemService(store);

  return {
    service: service,
    store: store
  };
}


// =========================
// F08 修改状态
// =========================
describe(
  "F08 修改状态 closeItem",
  function () {


    // -------------------------
    // T11
    // 寻物：寻找中 -> 已找到
    // -------------------------
    it(
      "发布者关闭寻物记录后应该显示已找到",
      function () {

        const setup =
          createService([
            {
              id: "item-lost",
              ownerId:
                "demo-user-001",
              type: "lost",
              name: "黑色蓝牙耳机",
              status: "active",
              createdAt:
                "2026-10-01T10:00:00+08:00",
              updatedAt:
                "2026-10-01T10:00:00+08:00"
            }
          ]);


        const result =
          setup.service.closeItem(
            "item-lost",
            "demo-user-001"
          );


        expect(result.ok)
          .toBe(true);

        expect(result.data.status)
          .toBe("closed");

        expect(
          globalThis
            .LostFound
            .core
            .getStatusText(
              result.data.type,
              result.data.status
            )
        ).toBe("已找到");


        expect(
          setup.store.getData()[0].status
        ).toBe("closed");

        expect(
          setup.store.getSaveCount()
        ).toBe(1);
      }
    );


    // -------------------------
    // T12
    // 招领：待认领 -> 已归还
    // -------------------------
    it(
      "发布者关闭招领记录后应该显示已归还",
      function () {

        const setup =
          createService([
            {
              id: "item-found",
              ownerId:
                "demo-user-001",
              type: "found",
              name: "校园卡",
              status: "active",
              createdAt:
                "2026-10-01T10:00:00+08:00",
              updatedAt:
                "2026-10-01T10:00:00+08:00"
            }
          ]);


        const result =
          setup.service.closeItem(
            "item-found",
            "demo-user-001"
          );


        expect(result.ok)
          .toBe(true);

        expect(result.data.status)
          .toBe("closed");

        expect(
          globalThis
            .LostFound
            .core
            .getStatusText(
              result.data.type,
              result.data.status
            )
        ).toBe("已归还");


        expect(
          setup.store.getData()[0].status
        ).toBe("closed");
      }
    );


    // -------------------------
    // T13
    // 非发布者不能修改
    // -------------------------
    it(
      "非发布者修改状态应该返回 FORBIDDEN 且数据不变",
      function () {

        const setup =
          createService([
            {
              id: "item-001",
              ownerId:
                "demo-user-001",
              type: "lost",
              status: "active"
            }
          ]);


        const result =
          setup.service.closeItem(
            "item-001",
            "demo-user-999"
          );


        expect(result.ok)
          .toBe(false);

        expect(result.error.code)
          .toBe("FORBIDDEN");

        expect(
          setup.store.getData()[0].status
        ).toBe("active");

        expect(
          setup.store.getSaveCount()
        ).toBe(0);
      }
    );


    // -------------------------
    // T14-1
    // 记录不存在
    // -------------------------
    it(
      "不存在的记录应该返回 ITEM_NOT_FOUND 且不保存",
      function () {

        const setup =
          createService([
            {
              id: "item-001",
              ownerId:
                "demo-user-001",
              type: "lost",
              status: "active"
            }
          ]);


        const result =
          setup.service.closeItem(
            "item-999",
            "demo-user-001"
          );


        expect(result.ok)
          .toBe(false);

        expect(result.error.code)
          .toBe("ITEM_NOT_FOUND");

        expect(
          setup.store.getSaveCount()
        ).toBe(0);

        expect(
          setup.store.getData()[0].status
        ).toBe("active");
      }
    );


    // -------------------------
    // T14-2
    // 已完成记录不能重复修改
    // -------------------------
    it(
      "已经 closed 的记录再次修改应该被拒绝",
      function () {

        const setup =
          createService([
            {
              id: "item-001",
              ownerId:
                "demo-user-001",
              type: "lost",
              status: "closed"
            }
          ]);


        const result =
          setup.service.closeItem(
            "item-001",
            "demo-user-001"
          );


        expect(result.ok)
          .toBe(false);

        expect(result.error.code)
          .toBe(
            "ITEM_ALREADY_CLOSED"
          );

        expect(
          setup.store.getSaveCount()
        ).toBe(0);

        expect(
          setup.store.getData()[0].status
        ).toBe("closed");
      }
    );


    // -------------------------
    // 保存失败
    // -------------------------
    it(
      "保存失败时应该返回错误并保持原数据不变",
      function () {

        const setup =
          createService(
            [
              {
                id: "item-001",
                ownerId:
                  "demo-user-001",
                type: "lost",
                status: "active",
                updatedAt:
                  "2026-10-01T10:00:00+08:00"
              }
            ],
            {
              failSave: true
            }
          );


        const result =
          setup.service.closeItem(
            "item-001",
            "demo-user-001"
          );


        expect(result.ok)
          .toBe(false);

        expect(result.error.code)
          .toBe(
            "STORAGE_WRITE_FAILED"
          );


        // 保存失败后旧状态仍必须保留
        expect(
          setup.store.getData()[0].status
        ).toBe("active");

        expect(
          setup.store.getData()[0].updatedAt
        ).toBe(
          "2026-10-01T10:00:00+08:00"
        );
      }
    );

  }
);