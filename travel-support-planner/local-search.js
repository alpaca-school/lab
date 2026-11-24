"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const core = window.LabCore;
  if (!core) return;

  const destination = document.getElementById("local-search-destination");
  const status = document.getElementById("local-search-status");
  const buttons = Array.from(document.querySelectorAll("[data-local-search]"));
  const openers = [
    document.getElementById("search-btn"),
    document.getElementById("final-search-btn")
  ].filter(Boolean);

  const categories = {
    prosthetics: {
      label: "義肢装具・車椅子修理",
      query: "義肢装具製作所 車椅子 修理 福祉用具"
    },
    hospital: {
      label: "病院・救急",
      query: "救急対応 病院 車椅子"
    },
    taxi: {
      label: "福祉・介護タクシー",
      query: "福祉タクシー 介護タクシー 車いす対応"
    },
    toilet: {
      label: "車いす対応トイレ",
      query: "車椅子対応 トイレ バリアフリー"
    }
  };

  function normalizedDestination() {
    return destination.value.trim().replace(/\s+/g, " ");
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function openSearch(categoryKey) {
    const place = normalizedDestination();
    if (!place) {
      setStatus("行き先を入力してから検索してね。例：那覇市、札幌駅、東京ビッグサイト", true);
      destination.focus();
      return;
    }

    const category = categories[categoryKey];
    if (!category) return;

    const query = encodeURIComponent(place + " " + category.query);
    const url = "https://www.google.com/maps/search/?api=1&query=" + query;
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus(place + " 周辺の「" + category.label + "」候補を地図で開いたよ。利用条件は公式情報や電話で再確認してね。");
    core.beep("tap");
  }

  openers.forEach((button) => {
    button.addEventListener("click", () => {
      setStatus("行き先を入れて、必要な支援先を探そう。");
      core.showScreen("screen-local-search");
      requestAnimationFrame(() => destination.focus());
    });
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => openSearch(button.dataset.localSearch));
  });

  destination.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      openSearch("hospital");
    }
  });
});
