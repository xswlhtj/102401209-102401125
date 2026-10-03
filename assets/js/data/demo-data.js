(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.data = lostFound.data || {};

  const demoItems = [
    {
      id: "item-001",
      ownerId: "demo-user-002",
      type: "found",
      name: "校园卡",
      category: "证件卡片",
      eventDate: "2026-09-24",
      location: "图书馆三楼",
      description: "在图书馆三楼自习区捡到一张校园卡，请失主核对信息后联系。",
      image: "assets/images/figma/campus-card.png",
      contactType: "QQ",
      contactValue: "123456789",
      status: "active",
      createdAt: "2026-09-24T18:30:00+08:00",
      updatedAt: "2026-09-24T18:30:00+08:00"
    },

    {
      id: "item-002",
      ownerId: "demo-user-001",
      type: "lost",
      name: "黑色蓝牙耳机",
      category: "电子设备",
      eventDate: "2026-09-24",
      location: "西三教学楼",
      description: "黑色蓝牙耳机及充电盒，充电盒表面有轻微划痕。",
      image: "assets/images/figma/earbuds.png",
      contactType: "QQ",
      contactValue: "987654321",
      status: "active",
      createdAt: "2026-09-24T16:20:00+08:00",
      updatedAt: "2026-09-24T16:20:00+08:00"
    },

    {
      id: "item-003",
      ownerId: "demo-user-002",
      type: "found",
      name: "雨伞",
      category: "雨具",
      eventDate: "2026-09-23",
      location: "食堂门口",
      description: "食堂门口拾到一把蓝色长柄雨伞。",
      image: "assets/images/figma/umbrella.png",
      contactType: "微信",
      contactValue: "fzu_found_01",
      status: "closed",
      createdAt: "2026-09-23T12:10:00+08:00",
      updatedAt: "2026-09-24T10:00:00+08:00"
    },

    {
      id: "item-004",
      ownerId: "demo-user-001",
      type: "found",
      name: "学生证",
      category: "证件卡片",
      eventDate: "2026-09-22",
      location: "东区田径场",
      description: "田径场看台附近拾到学生证一张。",
      image: "assets/images/figma/campus-card.png",
      contactType: "手机号",
      contactValue: "13812345678",
      status: "active",
      createdAt: "2026-09-22T20:15:00+08:00",
      updatedAt: "2026-09-22T20:15:00+08:00"
    },

    {
      id: "item-005",
      ownerId: "demo-user-001",
      type: "lost",
      name: "蓝牙耳机充电盒",
      category: "电子设备",
      eventDate: "2026-09-21",
      location: "计算机机房",
      description: "丢失一个黑色蓝牙耳机充电盒，盒盖内侧有贴纸。",
      image: "assets/images/figma/earbuds.png",
      contactType: "QQ",
      contactValue: "987654321",
      status: "active",
      createdAt: "2026-09-21T19:40:00+08:00",
      updatedAt: "2026-09-21T19:40:00+08:00"
    },

    {
      id: "item-006",
      ownerId: "demo-user-002",
      type: "found",
      name: "蓝色折叠伞",
      category: "雨具",
      eventDate: "2026-09-20",
      location: "生活三区",
      description: "生活三区楼下拾到一把蓝色折叠伞。",
      image: "assets/images/figma/umbrella.png",
      contactType: "微信",
      contactValue: "fzu_found_02",
      status: "closed",
      createdAt: "2026-09-20T17:10:00+08:00",
      updatedAt: "2026-09-21T09:00:00+08:00"
    }
  ];

  lostFound.data.demoItems = demoItems;

})(globalThis);