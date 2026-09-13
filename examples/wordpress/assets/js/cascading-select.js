(function () {
  "use strict";

  function restRoot(root) {
    if (window.kenyaLocations && window.kenyaLocations.root) {
      return String(window.kenyaLocations.root).replace(/\/$/, "");
    }
    return (root.getAttribute("data-rest") || "").replace(/\/$/, "");
  }

  function fetchJson(root, path) {
    return fetch(restRoot(root) + path, {
      headers: { Accept: "application/json" },
    }).then(function (response) {
      return response.json();
    });
  }

  function itemValue(item) {
    return item.code || item.name || "";
  }

  function fill(select, items, selected) {
    if (!select) {
      return;
    }
    var placeholder = select.getAttribute("data-placeholder") || "Select";
    select.innerHTML = "";
    var empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder;
    select.appendChild(empty);
    (items || []).forEach(function (item) {
      var option = document.createElement("option");
      option.value = itemValue(item);
      option.textContent = item.name;
      if (selected && selected === option.value) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.disabled = !items || items.length === 0;
  }

  function consumeSelected(select) {
    if (!select) {
      return "";
    }
    var value = select.getAttribute("data-selected") || select.value || "";
    select.removeAttribute("data-selected");
    return value;
  }

  function countyFromLabel(label) {
    var name = String(label || "").trim();
    name = name.replace(/^.*[—–-]\s+/, "");
    name = name.replace(/\s+County$/i, "");
    return name.trim();
  }

  function countyKey(root) {
    var county = root.querySelector("[data-kenya-field=county]");
    if (county && county.value) {
      return county.value;
    }
    var selector = root.getAttribute("data-kenya-county-from");
    if (!selector) {
      return "";
    }
    var external = document.querySelector(selector);
    if (!external || !external.value) {
      return "";
    }
    if (external.options && external.selectedIndex >= 0) {
      var selected = external.options[external.selectedIndex];
      var fromLabel = countyFromLabel(selected ? selected.textContent : "");
      if (fromLabel) {
        return fromLabel;
      }
    }
    return countyFromLabel(external.value);
  }

  function isKenyaValue(value) {
    return value === "KE" || String(value).indexOf("KE:") === 0;
  }

  function syncCountry(root) {
    var selector = root.getAttribute("data-kenya-country-from");
    if (!selector) {
      return;
    }
    var country = document.querySelector(selector);
    if (!country) {
      return;
    }
    var value = String(country.value || "");
    var hide = value !== "" && !isKenyaValue(value);

    if (root.matches("table")) {
      root.querySelectorAll(".kenya-locations-store-setting").forEach(function (row) {
        row.hidden = hide;
      });
      return;
    }
    root.hidden = hide;
  }

  function loadAreas(root) {
    var locality = root.querySelector("[data-kenya-field=locality]");
    var area = root.querySelector("[data-kenya-field=area]");
    var key = locality ? locality.value : "";
    if (!key) {
      fill(area, [], "");
      return;
    }
    var selected = consumeSelected(area);
    var county = countyKey(root);
    var path = "/localities/" + encodeURIComponent(key) + "/areas";
    if (county) {
      path += "?county=" + encodeURIComponent(county);
    }
    fetchJson(root, path).then(function (items) {
      fill(area, items, selected);
    });
  }

  function loadLocalities(root) {
    var locality = root.querySelector("[data-kenya-field=locality]");
    var area = root.querySelector("[data-kenya-field=area]");
    var key = countyKey(root);
    fill(area, [], "");
    if (!key) {
      fill(locality, [], "");
      return;
    }
    var selected = consumeSelected(locality);
    fetchJson(
      root,
      "/counties/" + encodeURIComponent(key) + "/localities",
    ).then(function (items) {
      fill(locality, items, selected);
      if (locality && locality.value) {
        loadAreas(root);
      }
    });
  }

  function refresh(root) {
    syncCountry(root);
    if (countyKey(root)) {
      loadLocalities(root);
    }
  }

  function promoteStoreAddressTable() {
    var locality = document.getElementById("woocommerce_store_locality");
    if (!locality) {
      return;
    }
    var table = locality.closest("table");
    if (!table) {
      return;
    }
    table.setAttribute("data-kenya-locations", "1");
    table.setAttribute("data-kenya-county-from", "#woocommerce_default_country");
    table.setAttribute("data-kenya-country-from", "#woocommerce_default_country");
  }

  function boot() {
    promoteStoreAddressTable();
    document.querySelectorAll("[data-kenya-locations]").forEach(refresh);
  }

  document.addEventListener("change", function (event) {
    var target = event.target;
    if (!target || !target.closest) {
      return;
    }

    var root = target.closest("[data-kenya-locations]");
    if (root && target.matches("[data-kenya-field=county]")) {
      loadLocalities(root);
      return;
    }
    if (root && target.matches("[data-kenya-field=locality]")) {
      loadAreas(root);
      return;
    }

    document
      .querySelectorAll("[data-kenya-locations][data-kenya-county-from]")
      .forEach(function (el) {
        var selector = el.getAttribute("data-kenya-county-from");
        if (selector && target.matches(selector)) {
          loadLocalities(el);
        }
      });

    document
      .querySelectorAll("[data-kenya-locations][data-kenya-country-from]")
      .forEach(function (el) {
        var selector = el.getAttribute("data-kenya-country-from");
        if (selector && target.matches(selector)) {
          syncCountry(el);
        }
      });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.body.addEventListener("updated_checkout", boot);
  document.body.addEventListener("country_to_state_changed", boot);
})();
