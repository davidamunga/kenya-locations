/*
 * kenya-locations chained selects for Django.
 *
 * A <select data-kl-parent="county" data-kl-url=".../counties/__parent__/constituencies/">
 * reloads its options from the JSON view whenever the parent field changes.
 * Works with form prefixes, formsets and admin inlines.
 */
(function () {
  "use strict";

  var PLACEHOLDER = "__parent__";

  function parentOf(select) {
    var name = select.name;
    var cut = name.lastIndexOf("-");
    var prefix = cut === -1 ? "" : name.slice(0, cut + 1);
    var scope = select.form || document;
    return scope.querySelector('[name="' + prefix + select.dataset.klParent + '"]');
  }

  function blankOption(select) {
    var first = select.options[0];
    return first && first.value === "" ? first.cloneNode(true) : null;
  }

  function replaceOptions(select, records) {
    var previous = select.value;
    var blank = blankOption(select);
    select.innerHTML = "";
    if (blank) select.appendChild(blank);
    records.forEach(function (record) {
      var option = document.createElement("option");
      option.value = record.code;
      option.textContent = record.name;
      select.appendChild(option);
    });
    select.value = records.some(function (r) { return r.code === previous; }) ? previous : "";
    if (select.value !== previous) {
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function load(select, parentValue) {
    if (!parentValue) {
      replaceOptions(select, []);
      return;
    }
    var url = select.dataset.klUrl.replace(PLACEHOLDER, encodeURIComponent(parentValue));
    select.disabled = true;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(function (response) {
        return response.ok ? response.json() : { results: [] };
      })
      .then(function (data) {
        var records = data.results.slice().sort(function (a, b) {
          return a.name.localeCompare(b.name);
        });
        replaceOptions(select, records);
      })
      .catch(function () {})
      .then(function () {
        select.disabled = false;
      });
  }

  function bind(select) {
    if (select.dataset.klBound) return;
    var parent = parentOf(select);
    if (!parent) return;
    select.dataset.klBound = "1";
    parent.addEventListener("change", function () {
      load(select, parent.value);
    });
    if (parent.value) load(select, parent.value);
  }

  function init(root) {
    (root || document).querySelectorAll("select[data-kl-parent][data-kl-url]").forEach(bind);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { init(document); });
  } else {
    init(document);
  }
  document.addEventListener("formset:added", function (event) {
    init(event.target);
  });
})();
