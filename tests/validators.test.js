import { describe, expect, it } from "vitest";

import "../assets/js/core/validators.js";

const validators = globalThis.LostFound.core.validators;
const today = new Date(2026, 9, 3, 12, 0, 0);

describe("发布表单校验", () => {
  it("T01 名称为空或全是空格时拒绝", () => {
    expect(validators.validateName("").valid).toBe(false);
    expect(validators.validateName("   ").valid).toBe(false);
  });

  it("T02 名称30字通过、31字失败", () => {
    expect(validators.validateName("物".repeat(30)).valid).toBe(true);
    expect(validators.validateName("物".repeat(31)).valid).toBe(false);
  });

  it("T03 日期为今天通过、明天失败", () => {
    expect(validators.validateEventDate("2026-10-03", today).valid).toBe(true);
    expect(validators.validateEventDate("2026-10-04", today).valid).toBe(false);
  });

  it("T04 正确和错误手机号分别通过和失败", () => {
    expect(validators.validateContact("13812345678")).toMatchObject({ valid: true, contactType: "手机号" });
    expect(validators.validateContact("12812345678").valid).toBe(false);
  });
});
