(() => {
  "use strict";

  const CODE_PATTERN = /^[A-Z]{5}[0-9]{5}$/;
  const BUILT_IN_DEMO_GROUPS = {
    FEATY20268: {
      name: "AI 스케줄링 데모 팀",
      memberCount: 4,
      target: "./group.html",
    },
  };
  const CREATED_GROUPS_KEY = "featy-demo-created-groups";
  const JOINED_GROUPS_KEY = "featy-demo-joined-groups";

  const toast = document.querySelector("#toast");
  const joinDialog = document.querySelector("#join-group-dialog");
  const joinForm = document.querySelector("#join-group-form");
  const joinInput = document.querySelector("#join-code");
  const joinFeedback = document.querySelector("#join-code-feedback");
  const groupList = document.querySelector(".group-list");
  const groupCount = document.querySelector(".group-count");

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function normalizeJoinCode(value) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  }

  function secureIndex(size) {
    const values = new Uint32Array(1);
    const unbiasedLimit = Math.floor(0x100000000 / size) * size;
    do {
      window.crypto.getRandomValues(values);
    } while (values[0] >= unbiasedLimit);
    return values[0] % size;
  }

  function createDemoJoinCode() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    let code = "";
    for (let index = 0; index < 5; index += 1) code += alphabet[secureIndex(alphabet.length)];
    for (let index = 0; index < 5; index += 1) code += digits[secureIndex(digits.length)];
    return code;
  }

  function readStoredObject(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  }

  function storeObject(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function allDemoGroups() {
    return { ...BUILT_IN_DEMO_GROUPS, ...readStoredObject(CREATED_GROUPS_KEY) };
  }

  function appendGroupCard(code, group, statusText = "방금 참여") {
    if (!groupList || groupList.querySelector(`[data-join-code="${code}"]`)) return false;

    const card = document.createElement("button");
    const icon = document.createElement("span");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    const details = document.createElement("small");
    const arrow = document.createElement("span");

    card.className = "group-card";
    card.type = "button";
    card.dataset.joinCode = code;

    icon.className = "group-icon group-icon--indigo";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = group.name.slice(0, 1).toUpperCase();

    copy.className = "group-copy";
    name.textContent = group.name;
    details.textContent = `${group.memberCount + 1}명 · ${statusText}`;
    copy.append(name, details);

    arrow.className = "arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";

    card.append(icon, copy, arrow);
    card.addEventListener("click", () => { window.location.href = group.target; });
    groupList.append(card);
    if (groupCount) groupCount.textContent = String(Number(groupCount.textContent || 0) + 1);
    return true;
  }

  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  document.querySelectorAll("[data-open-dialog]").forEach((button) => {
    button.addEventListener("click", () => openDialog(document.getElementById(button.dataset.openDialog)));
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.closest("dialog")));
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  document.querySelectorAll("[data-show-toast]").forEach((button) => {
    button.addEventListener("click", () => showToast(button.dataset.showToast));
  });

  document.querySelectorAll(".group-card").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.href = "./group.html";
    });
  });

  joinInput?.addEventListener("input", () => {
    joinInput.value = normalizeJoinCode(joinInput.value);
    joinInput.removeAttribute("aria-invalid");
    if (joinFeedback) joinFeedback.textContent = "";
  });

  document.querySelector("#fill-demo-code")?.addEventListener("click", () => {
    if (!joinInput) return;
    joinInput.value = "FEATY20268";
    joinInput.focus();
    joinInput.dispatchEvent(new Event("input"));
  });

  joinForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = normalizeJoinCode(joinInput?.value ?? "");
    const group = allDemoGroups()[code];

    if (!CODE_PATTERN.test(code)) {
      joinInput?.setAttribute("aria-invalid", "true");
      if (joinFeedback) joinFeedback.textContent = "영문 5자 뒤에 숫자 5자를 입력해 주세요.";
      joinInput?.focus();
      return;
    }

    if (!group) {
      joinInput?.setAttribute("aria-invalid", "true");
      if (joinFeedback) joinFeedback.textContent = "유효하지 않거나 만료된 참여 코드입니다.";
      return;
    }

    if (groupList?.querySelector(`[data-join-code="${code}"]`)) {
      closeDialog(joinDialog);
      showToast("이미 참여 중인 그룹이에요.");
      return;
    }

    appendGroupCard(code, group);
    const joinedGroups = readStoredObject(JOINED_GROUPS_KEY);
    joinedGroups[code] = group;
    storeObject(JOINED_GROUPS_KEY, joinedGroups);

    closeDialog(joinDialog);
    joinForm.reset();
    showToast(`${group.name}에 참여했어요.`);
  });

  const createForm = document.querySelector("#create-group-form");
  const codeResult = document.querySelector("#invite-code-result");
  const createdCode = document.querySelector("#created-invite-code");

  createForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const groupName = document.querySelector("#create-group-name")?.value.trim();
    if (!groupName) return;
    let code = createDemoJoinCode();
    const createdGroups = readStoredObject(CREATED_GROUPS_KEY);
    while (allDemoGroups()[code]) code = createDemoJoinCode();
    const createdGroup = { name: groupName, memberCount: 0, target: "./group.html" };
    createdGroups[code] = createdGroup;
    storeObject(CREATED_GROUPS_KEY, createdGroups);
    const joinedGroups = readStoredObject(JOINED_GROUPS_KEY);
    joinedGroups[code] = createdGroup;
    storeObject(JOINED_GROUPS_KEY, joinedGroups);
    appendGroupCard(code, createdGroup, "방금 생성");
    if (createdCode) createdCode.textContent = code;
    if (codeResult) codeResult.hidden = false;
    showToast("그룹과 참여 코드를 만들었어요.");
  });

  document.querySelector("#copy-invite-code")?.addEventListener("click", async () => {
    const code = createdCode?.textContent;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showToast("참여 코드를 복사했어요.");
    } catch {
      showToast(`참여 코드: ${code}`);
    }
  });

  Object.entries(readStoredObject(JOINED_GROUPS_KEY)).forEach(([code, group]) => {
    appendGroupCard(code, group, "참여 중");
  });
})();
