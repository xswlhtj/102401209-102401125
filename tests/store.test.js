import { describe, it, expect, beforeEach } from "vitest";

import "../assets/js/data/demo-data.js";
import "../assets/js/data/store.js";


function createMemoryStorage() {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },

    setItem(key, value) {
      data.set(key, String(value));
    },

    clear() {
      data.clear();
    }
  };
}


describe("store", () => {
  let storage;
  let store;

  beforeEach(() => {
    storage = createMemoryStorage();

    store = globalThis.LostFound.data.createStore(
      storage
    );
  });


  it("第一次初始化时应写入演示数据", () => {
    const result = store.initialize(
      globalThis.LostFound.data.demoItems
    );

    expect(result.ok).toBe(true);

    expect(result.data.length).toBe(
      globalThis.LostFound.data.demoItems.length
    );
  });


  it("保存后应该能够重新读取数据", () => {
    const items = [
      {
        id: "test-001",
        name: "测试校园卡"
      }
    ];

    const saveResult = store.save(items);

    expect(saveResult.ok).toBe(true);

    const loadResult = store.load();

    expect(loadResult.ok).toBe(true);
    expect(loadResult.data).toEqual(items);
  });


  it("重复初始化时不应该覆盖已有数据", () => {
    const existingItems = [
      {
        id: "user-001",
        name: "用户自己发布的水杯"
      }
    ];

    store.save(existingItems);

    const result = store.initialize(
      globalThis.LostFound.data.demoItems
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(existingItems);
  });
});