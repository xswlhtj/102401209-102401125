(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.core = lostFound.core || {};

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function getToday(now) {
    const value = now instanceof Date ? now : new Date();
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function isCalendarDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.getUTCFullYear() === Number(match[1]) &&
      date.getUTCMonth() === Number(match[2]) - 1 &&
      date.getUTCDate() === Number(match[3]);
  }

  function validateName(value) {
    const name = clean(value);
    if (!name) return { valid: false, value: name, message: "请输入物品名称" };
    if (name.length > 30) return { valid: false, value: name, message: "物品名称不能超过30个字" };
    return { valid: true, value: name };
  }

  function validateEventDate(value, now) {
    const eventDate = clean(value);
    if (!eventDate) return { valid: false, value: eventDate, message: "请选择日期" };
    if (!isCalendarDate(eventDate)) return { valid: false, value: eventDate, message: "请选择有效日期" };
    if (eventDate > getToday(now)) return { valid: false, value: eventDate, message: "日期不能晚于今天" };
    return { valid: true, value: eventDate };
  }

  function validateContact(value, selectedType) {
    const contact = clean(value);
    const contactType = clean(selectedType);
    if (!contact) return { valid: false, value: contact, message: "请输入联系方式" };
    if (contactType) {
      if (!["QQ", "微信", "手机号"].includes(contactType)) {
        return { valid: false, value: contact, message: "请选择联系方式类型" };
      }
      if (contactType === "QQ" && !/^\d{5,12}$/.test(contact)) {
        return { valid: false, value: contact, message: "请输入正确的QQ号" };
      }
      if (contactType === "手机号" && !/^1[3-9]\d{9}$/.test(contact)) {
        return { valid: false, value: contact, message: "请输入正确的手机号" };
      }
      if (contactType === "微信" && !/^[A-Za-z][A-Za-z0-9_-]{5,19}$/.test(contact)) {
        return { valid: false, value: contact, message: "请输入正确的微信号" };
      }
      return { valid: true, value: contact, contactType: contactType };
    }
    if (/^\d+$/.test(contact)) {
      if (contact.length === 11) {
        if (!/^1[3-9]\d{9}$/.test(contact)) return { valid: false, value: contact, message: "请输入正确的手机号" };
        return { valid: true, value: contact, contactType: "手机号" };
      }
      if (/^\d{5,12}$/.test(contact)) return { valid: true, value: contact, contactType: "QQ" };
      return { valid: false, value: contact, message: "请输入正确的QQ号或手机号" };
    }
    if (/^[A-Za-z][A-Za-z0-9_-]{5,19}$/.test(contact)) {
      return { valid: true, value: contact, contactType: "微信" };
    }
    return { valid: false, value: contact, message: "请输入正确的微信号" };
  }

  function validatePublishForm(values, now) {
    const source = values && typeof values === "object" ? values : {};
    const name = validateName(source.name);
    const eventDate = validateEventDate(source.eventDate, now);
    const contactType = clean(source.contactType);
    const contact = validateContact(source.contactValue, contactType);
    const category = clean(source.category);
    const location = clean(source.location);
    const description = clean(source.description);
    const errors = {};

    if (!name.valid) errors.name = name.message;
    if (!category) errors.category = "请选择物品类别";
    if (!eventDate.valid) errors.eventDate = eventDate.message;
    if (!location) errors.location = "请输入地点";
    else if (location.length > 50) errors.location = "地点不能超过50个字";
    if (description.length > 200) errors.description = "物品描述不能超过200个字";
    if (!["QQ", "微信", "手机号"].includes(contactType)) errors.contactType = "请选择联系方式";
    if (!contact.valid) errors.contactValue = contact.message;

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
      data: {
        type: source.type === "found" ? "found" : "lost",
        name: name.value,
        category: category,
        eventDate: eventDate.value,
        location: location,
        description: description,
        image: clean(source.image),
        contactType: contactType,
        contactValue: contact.value
      }
    };
  }

  lostFound.core.validators = {
    getToday: getToday,
    validateName: validateName,
    validateEventDate: validateEventDate,
    validateContact: validateContact,
    validatePublishForm: validatePublishForm
  };
})(globalThis);
