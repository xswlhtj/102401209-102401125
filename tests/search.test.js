import { describe, it, expect } from "vitest";

import "../assets/js/services/item-service.js";


function createFakeStore(items) {
  return {
    load() {
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


const sampleItems = [
  {
    id: "item-001",
    type: "found",
    name: "校园卡",
    category: "证件卡片",
    location: "图书馆三楼",
    description: "在自习区捡到一张校园卡",
    createdAt: "2026-10-01T10:00:00+08:00"
  },

  {
    id: "item-002",
    type: "lost",
    name: "黑色蓝牙耳机",
    category: "电子设备",
    location: "西三教学楼",
    description: "黑色耳机充电盒有划痕",
    createdAt: "2026-10-03T18:00:00+08:00"
  },

  {
    id: "item-003",
    type: "found",
    name: "蓝色折叠伞",
    category: "雨具",
    location: "生活三区",
    description: "楼下捡到一把蓝色雨伞",
    createdAt: "2026-10-02T12:00:00+08:00"
  },

  {
    id: "item-004",
    type: "lost",
    name: "耳机充电盒",
    category: "电子设备",
    location: "计算机机房",
    description: "丢失一个蓝牙耳机充电盒",
    createdAt: "2026-09-30T16:00:00+08:00"
  }
];


function createService() {
  const store = createFakeStore(sampleItems);

  return globalThis.LostFound.services
    .createItemService(store);
}


describe("F04 搜索与筛选", () => {

  it("空筛选条件应该返回全部记录并按时间倒序", () => {
    const service = createService();

    const result = service.list({
      keyword: "",
      type: "all",
      category: "all"
    });

    expect(result.ok).toBe(true);
    expect(result.data.length).toBe(4);

    expect(
      result.data.map(function (item) {
        return item.id;
      })
    ).toEqual([
      "item-002",
      "item-003",
      "item-001",
      "item-004"
    ]);
  });


  it("关键词应该能够匹配物品名称", () => {
    const service = createService();

    const result = service.list({
      keyword: "耳机",
      type: "all",
      category: "all"
    });

    expect(result.ok).toBe(true);

    expect(
      result.data.map(function (item) {
        return item.id;
      })
    ).toEqual([
      "item-002",
      "item-004"
    ]);
  });


  it("关键词应该能够匹配地点或描述", () => {
    const service = createService();

    const locationResult = service.list({
      keyword: "图书馆",
      type: "all",
      category: "all"
    });

    expect(
      locationResult.data.map(function (item) {
        return item.id;
      })
    ).toEqual([
      "item-001"
    ]);


    const descriptionResult = service.list({
      keyword: "划痕",
      type: "all",
      category: "all"
    });

    expect(
      descriptionResult.data.map(function (item) {
        return item.id;
      })
    ).toEqual([
      "item-002"
    ]);
  });


  it("type=lost 应该只返回寻物信息", () => {
    const service = createService();

    const result = service.list({
      keyword: "",
      type: "lost",
      category: "all"
    });

    expect(result.ok).toBe(true);

    expect(
      result.data.every(function (item) {
        return item.type === "lost";
      })
    ).toBe(true);

    expect(result.data.length).toBe(2);
  });


  it("类别筛选应该只返回对应类别", () => {
    const service = createService();

    const result = service.list({
      keyword: "",
      type: "all",
      category: "电子设备"
    });

    expect(result.ok).toBe(true);

    expect(
      result.data.every(function (item) {
        return item.category === "电子设备";
      })
    ).toBe(true);

    expect(result.data.length).toBe(2);
  });


  it("关键词、类型和类别应该能够组合筛选", () => {
    const service = createService();

    const result = service.list({
      keyword: "耳机",
      type: "lost",
      category: "电子设备"
    });

    expect(result.ok).toBe(true);

    expect(
      result.data.map(function (item) {
        return item.id;
      })
    ).toEqual([
      "item-002",
      "item-004"
    ]);
  });


  it("没有任何匹配记录时应该返回空数组", () => {
    const service = createService();

    const result = service.list({
      keyword: "不存在的物品",
      type: "all",
      category: "all"
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

});
