(function (root) {
  "use strict";

  const lostFound = root.LostFound = root.LostFound || {};
  lostFound.pages = lostFound.pages || {};

  function setNavigation(active) {
    if (!root.document) return;
    root.document.querySelectorAll("[data-nav]").forEach(function (link) {
      if (link.dataset.nav === active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function setType(form, type) {
    form.dataset.type = type;
    form.querySelectorAll("[data-publish-type]").forEach(function (button) {
      const selected = button.dataset.publishType === type;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    const box = form.querySelector(".publish-tab--found img");
    box.src = type === "found" ? "assets/images/figma/box-publish.svg" : "assets/images/figma/box-muted.svg";
    form.querySelector("label[for='publish-date']").textContent = "时间";
    form.querySelector("#publish-date").setAttribute("aria-label", type === "lost" ? "丢失时间" : "拾取时间");
    form.querySelector("#publish-location").placeholder = type === "lost" ? "请输入丢失地点" : "请输入拾取地点";
  }

  function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach(function (node) { node.textContent = ""; });
    form.querySelectorAll(".publish-row").forEach(function (node) { node.classList.remove("has-error"); });
    form.querySelectorAll("[aria-invalid='true']").forEach(function (node) { node.removeAttribute("aria-invalid"); });
    form.querySelector(".publish-form-error").textContent = "";
  }

  function showFieldError(form, name, message) {
    const row = form.querySelector("[data-field-row='" + name + "']");
    if (!row) return;
    const control = row.querySelector("input, select, textarea");
    const error = row.querySelector(".field-error");
    row.classList.add("has-error");
    if (control) control.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  }

  function clearFieldError(form, name) {
    const row = form.querySelector("[data-field-row='" + name + "']");
    if (!row) return;
    const control = row.querySelector("input, select, textarea");
    const error = row.querySelector(".field-error");
    row.classList.remove("has-error");
    if (control) control.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  }

  function readValues(form, image) {
    return {
      type: form.dataset.type,
      name: form.elements.name.value,
      category: form.elements.category.value,
      eventDate: form.elements.eventDate.value,
      location: form.elements.location.value,
      description: form.elements.description.value,
      image: image,
      contactType: form.elements.contactType.value,
      contactValue: form.elements.contactValue.value
    };
  }

  function renderForm(container, initialType, options) {
    if (!options || typeof options.createItem !== "function") {
      throw new TypeError("发布页面需要传入 A 的 create(formData) 接口");
    }
    const document = container.ownerDocument;
    const template = document.getElementById("publish-template");
    if (!template) throw new Error("发布页面需要 index.html 中的 publish-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    const form = container.querySelector("#publish-form");
    const validators = lostFound.core.validators;
    const submit = form.querySelector(".publish-submit");
    const description = form.elements.description;
    const count = form.querySelector(".description-count");
    const fileInput = form.elements.imageFile;
    const upload = form.querySelector(".upload-control");
    const preview = form.querySelector(".upload-preview");
    const removeImage = form.querySelector(".upload-remove");
    const contactType = form.elements.contactType;
    const contactValue = form.elements.contactValue;
    let image = "";
    let imageLoading = false;
    let imageVersion = 0;
    let submitting = false;

    form.elements.eventDate.max = validators.getToday();
    setType(form, initialType === "found" ? "found" : "lost");
    setNavigation("publish");

    function updateContactHint() {
      const type = contactType.value;
      contactValue.placeholder = type === "QQ"
        ? "请输入QQ号"
        : type === "微信"
          ? "请输入微信号"
          : type === "手机号"
            ? "请输入手机号"
            : "请先选择联系方式";
      contactValue.inputMode = type === "QQ" || type === "手机号" ? "numeric" : "text";
    }

    function clearImagePreview() {
      image = "";
      imageLoading = false;
      upload.classList.remove("has-preview");
      preview.removeAttribute("src");
      removeImage.hidden = true;
    }

    form.querySelectorAll("[data-publish-type]").forEach(function (button) {
      button.addEventListener("click", function () {
        const type = button.dataset.publishType;
        setType(form, type);
        root.history.replaceState(null, "", "#/publish/" + type);
      });
    });

    form.addEventListener("input", function (event) {
      if (event.target.name && event.target.name !== "imageFile") clearFieldError(form, event.target.name);
    });
    form.addEventListener("change", function (event) {
      if (event.target.name && event.target.name !== "imageFile") clearFieldError(form, event.target.name);
    });

    description.addEventListener("input", function () {
      count.textContent = description.value.length + "/200";
    });

    contactType.addEventListener("change", function () {
      updateContactHint();
      clearFieldError(form, "contactValue");
    });
    updateContactHint();

    fileInput.addEventListener("click", function () {
      fileInput.value = "";
    });

    fileInput.addEventListener("change", function () {
      const file = fileInput.files[0];
      const version = ++imageVersion;
      clearFieldError(form, "image");
      clearImagePreview();
      if (!file) {
        return;
      }
      if (!file.type.startsWith("image/")) {
        showFieldError(form, "image", "请选择图片文件");
        fileInput.value = "";
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        showFieldError(form, "image", "图片不能超过1.5MB");
        fileInput.value = "";
        return;
      }
      imageLoading = true;
      const reader = new FileReader();
      reader.addEventListener("load", function () {
        if (version !== imageVersion) return;
        image = String(reader.result || "");
        preview.src = image;
        upload.classList.add("has-preview");
        removeImage.hidden = false;
        imageLoading = false;
      });
      reader.addEventListener("error", function () {
        if (version !== imageVersion) return;
        imageLoading = false;
        showFieldError(form, "image", "图片读取失败，请重新选择");
      });
      reader.readAsDataURL(file);
    });

    removeImage.addEventListener("click", function () {
      imageVersion += 1;
      fileInput.value = "";
      clearImagePreview();
      clearFieldError(form, "image");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (submitting) return;
      clearErrors(form);
      if (imageLoading) {
        showFieldError(form, "image", "图片正在读取，请稍候");
        fileInput.focus();
        return;
      }
      const validation = validators.validatePublishForm(readValues(form, image));
      if (!validation.valid) {
        Object.keys(validation.errors).forEach(function (name) {
          showFieldError(form, name, validation.errors[name]);
        });
        const first = form.querySelector("[aria-invalid='true']");
        if (first) first.focus();
        return;
      }
      submitting = true;
      submit.disabled = true;
      submit.textContent = "发布中…";
      const result = options.createItem(validation.data);
      if (!result || !result.ok) {
        const message = result && result.error && result.error.message ? result.error.message : "发布失败，请稍后重试";
        form.querySelector(".publish-form-error").textContent = message;
        submit.disabled = false;
        submit.textContent = "发布信息";
        submitting = false;
        return;
      }
      if (typeof options.onSuccess === "function") options.onSuccess(result.data);
    });
  }

  function formatDate(value) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return parts ? Number(parts[2]) + "月" + Number(parts[3]) + "日" : value;
  }

  function renderSuccess(container, item) {
    const document = container.ownerDocument;
    const template = document.getElementById("publish-success-template");
    if (!template) throw new Error("发布成功页需要 index.html 中的 publish-success-template 模板");
    container.replaceChildren(template.content.cloneNode(true));
    const card = container.querySelector(".success-card");
    const image = card.querySelector(".success-card__image");
    const fallback = "assets/images/item-placeholder.svg";
    card.classList.add(item.type === "lost" ? "success-card--lost" : "success-card--found");
    card.querySelector(".success-card__type").textContent = item.type === "lost" ? "⌕　寻物" : "▣　招领";
    card.querySelector("h3").textContent = item.name;
    card.querySelector("h3").title = item.name;
    card.querySelector("[data-success-location]").textContent = item.location;
    card.querySelector("[data-success-location]").title = item.location;
    const time = card.querySelector("time");
    time.textContent = formatDate(item.eventDate);
    time.dateTime = item.eventDate;
    image.alt = item.name;
    image.addEventListener("error", function () { image.src = fallback; }, { once: true });
    image.src = item.image || fallback;
    setNavigation("publish");
  }

  lostFound.pages.publish = {
    renderForm: renderForm,
    renderSuccess: renderSuccess,
    setNavigation: setNavigation
  };
})(globalThis);
