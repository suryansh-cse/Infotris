/**
 * INFOTRIS SEARCH — Knowledge-discovery engine
 * - Extensible index (INFOTRIS_INDEX), no hard-coded page logic
 * - Relevance scoring (title > keywords > skills > description > fuzzy)
 * - Grouped by type, highlight, keyboard nav, debounced, resilient
 * - Next-gen recommendations: trending + recent searches + footer hints
 * - Keeps public search independent from Firebase/auth
 * - Supports dropdown mode (#course-search) and page mode (#search-page-input)
 */
(function() {
  'use strict';

  // --- Site root resolver (localhost / custom domain / /Infotris/ project pages / file:) ---
  function siteRoot() {
    try {
      var path = window.location.pathname || '/';
      var marker = '/Infotris/';
      var i = path.indexOf(marker);
      if (i !== -1) return path.slice(0, i + marker.length);
    } catch (_) {}
    return '/';
  }

  function resolveUrl(url) {
    if (!url) return '#';
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    var clean = String(url).replace(/^\.?\//, '');
    if (window.location.protocol === 'file:') return clean;
    var root = siteRoot();
    // Avoid doubling when url already carries the base
    if (root !== '/' && ('/' + clean).indexOf(root) === 0) return '/' + clean;
    return (root === '/' ? '/' : root) + clean;
  }

  function initialsFor(title) {
    var words = String(title || '').replace(/[^A-Za-z0-9 &]/g, '').split(/[\s&]+/).filter(Boolean);
    if (words.length === 0) return 'Go';
    if (words.length === 1) return words[0].slice(0, 2);
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  // --- Recent searches (localStorage, private-mode safe) ---
  var RECENT_KEY = 'infotris:recent-searches';
  var RECENT_MAX = 5;

  function getRecent() {
    try {
      var raw = window.localStorage.getItem(RECENT_KEY);
      var arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr.filter(function(x){ return typeof x === 'string' && x.trim(); }).slice(0, RECENT_MAX) : [];
    } catch (_) {
      return [];
    }
  }

  function addRecent(query) {
    var q = String(query || '').trim();
    if (q.length < 2) return;
    try {
      var arr = getRecent().filter(function(x){ return x.toLowerCase() !== q.toLowerCase(); });
      arr.unshift(q);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, RECENT_MAX)));
    } catch (_) {}
  }

  function clearRecent() {
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch (_) {}
  }

  // Curated trending ids (resolved against INFOTRIS_INDEX at render time)
  var TRENDING_IDS = ['python', 'dsa', 'html', 'machine-learning', 'ai-engineer', 'javascript'];

  function getIndex() {
    if (typeof INFOTRIS_INDEX === 'undefined' || !Array.isArray(INFOTRIS_INDEX)) return null;
    return INFOTRIS_INDEX;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function normalizeQuery(q) {
    return String(q || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(q) {
    return normalizeQuery(q).split(' ').filter(Boolean);
  }

  // Simple Levenshtein for typo tolerance (words >4 chars, distance <=1 or 2)
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) matrix[i] = [i];
    for (var j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }

  function isFuzzyMatch(queryWord, targetWord) {
    if (queryWord.length < 4 || targetWord.length < 4) return false;
    var dist = levenshtein(queryWord, targetWord);
    if (targetWord.length <= 5) return dist <= 1;
    return dist <= 2;
  }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    var words = tokenize(query);
    var escaped = escapeHtml(text);
    words.sort(function(a, b) { return b.length - a.length; });
    words.forEach(function(word) {
      if (!word) return;
      var re = new RegExp('(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      escaped = escaped.replace(re, '<mark class="search-highlight">$1</mark>');
    });
    return escaped;
  }

  function getFieldText(item, field) {
    var val = item[field];
    if (Array.isArray(val)) return val.join(' ').toLowerCase();
    if (typeof val === 'string') return val.toLowerCase();
    return '';
  }

  // --- Scoring (separate from render, for backend compatibility) ---
  function scoreItem(item, rawQuery) {
    var query = normalizeQuery(rawQuery);
    if (!query) return 0;
    var words = tokenize(query);
    var title = (item.title || '').toLowerCase();
    var desc = (item.description || '').toLowerCase();
    var keywords = getFieldText(item, 'keywords');
    var tags = getFieldText(item, 'tags');
    var skills = getFieldText(item, 'skills');
    var aliases = getFieldText(item, 'aliases');
    var category = getFieldText(item, 'category');
    var titleWords = title.split(/\s+/);

    var score = 0;

    if (title === query) return 100;
    if (title.indexOf(query) !== -1) score += 80;
    if (aliases.split(' ').indexOf(query) !== -1 || aliases.indexOf(query) !== -1) score += 75;

    var titleContainsAll = words.every(function(w) { return title.indexOf(w) !== -1; });
    if (titleContainsAll && words.length > 1) score += 60;
    else if (titleContainsAll) score += 50;

    if (words.some(function(w) { return keywords.indexOf(w) !== -1; })) score += 40;
    if (words.some(function(w) { return tags.indexOf(w) !== -1; })) score += 35;
    if (words.some(function(w) { return skills.indexOf(w) !== -1; })) score += 30;
    if (words.some(function(w) { return aliases.indexOf(w) !== -1; })) score += 45;
    if (words.some(function(w) { return category.indexOf(w) !== -1; })) score += 20;

    if (desc.indexOf(query) !== -1) score += 20;
    else if (words.some(function(w) { return desc.indexOf(w) !== -1; })) score += 10;

    words.forEach(function(w) {
      if (titleWords.some(function(tw) { return tw.indexOf(w) === 0 && w.length >= 3; })) score += 15;
      if (keywords.split(' ').some(function(kw) { return kw.indexOf(w) === 0 && w.length >= 3; })) score += 10;
    });

    words.forEach(function(w) {
      if (w.length < 4) return;
      var titleFuzzy = titleWords.some(function(tw) { return isFuzzyMatch(w, tw); });
      var keywordFuzzy = keywords.split(' ').some(function(kw) { return isFuzzyMatch(w, kw); });
      if (titleFuzzy) score += 8;
      else if (keywordFuzzy) score += 5;
    });

    return score;
  }

  function search(query) {
    var index = getIndex();
    if (!index) throw new Error('Search index unavailable');
    var normalized = normalizeQuery(query);
    if (!normalized) return [];
    var scored = index.map(function(item) {
      return { item: item, score: scoreItem(item, normalized) };
    }).filter(function(x) { return x.score > 0; });
    scored.sort(function(a, b) { return b.score - a.score; });
    return scored.slice(0, 20).map(function(x) { return x.item; });
  }

  function groupByType(results) {
    var groups = {};
    results.forEach(function(item) {
      var type = item.type || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    var order = ['course', 'career', 'skill', 'trail', 'topic', 'other'];
    var ordered = {};
    order.forEach(function(t) { if (groups[t]) ordered[t] = groups[t]; });
    Object.keys(groups).forEach(function(t) { if (!ordered[t]) ordered[t] = groups[t]; });
    return ordered;
  }

  function goTo(item, query) {
    if (query) addRecent(query);
    window.location.href = resolveUrl(item.url);
  }

  function viewAllUrl(query) {
    return resolveUrl('search.html') + '?q=' + encodeURIComponent(query);
  }

  // ================= Dropdown mode =================
  function initDropdown(input, resultsBox) {
    var searchButton = input.closest('.search-container')
      ? input.closest('.search-container').querySelector('.search-bar-button')
      : document.querySelector('.search-bar-button');
    var container = input.closest('.search-container') || document;

    if (container !== document && window.getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    var liveRegion = document.getElementById('search-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'search-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-9999px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', 'search-results-list');
    input.setAttribute('aria-label', 'Search courses, careers, skills and trails');
    resultsBox.id = 'search-results-list';
    resultsBox.setAttribute('role', 'listbox');
    resultsBox.setAttribute('aria-label', 'Search suggestions');

    var selectedIndex = -1;
    var currentResults = [];
    var debounceTimer = null;

    // --- Portal: move the dropdown to <body> on open so hero
    // `overflow-x: clip` and transformed ancestors can never trap it.
    // Positioned fixed under the input; restored to place on close.
    var homeParent = resultsBox.parentNode;
    var homeNext = resultsBox.nextSibling;
    var portaled = false;

    function positionPortal() {
      if (!portaled || resultsBox.style.display === 'none') return;
      try {
        var r = input.getBoundingClientRect();
        var w = Math.min(r.width, window.innerWidth - 16);
        var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
        resultsBox.style.left = left + 'px';
        resultsBox.style.top = (r.bottom + 8) + 'px';
        resultsBox.style.width = w + 'px';
      } catch (_) {}
    }

    function portal() {
      if (portaled) return;
      portaled = true;
      try {
        document.body.appendChild(resultsBox);
      } catch (_) {}
      resultsBox.classList.add('search-results--portaled');
      positionPortal();
    }

    function unportal() {
      if (!portaled) return;
      portaled = false;
      resultsBox.classList.remove('search-results--portaled');
      resultsBox.style.left = '';
      resultsBox.style.top = '';
      resultsBox.style.width = '';
      try {
        if (homeNext && homeNext.parentNode === homeParent) homeParent.insertBefore(resultsBox, homeNext);
        else if (homeParent) homeParent.appendChild(resultsBox);
      } catch (_) {}
    }

    function footerHtml(query) {
      return ''
        + '<div class="search-footer">'
        +   '<span class="search-footer__hints"><kbd>&#8593;</kbd><kbd>&#8595;</kbd> navigate <kbd>Enter</kbd> open <kbd>Esc</kbd> close</span>'
        +   '<a class="search-footer__all" href="' + escapeHtml(viewAllUrl(query)) + '">View all results &rarr;</a>'
        + '</div>';
    }

    function chipsHtml(items, chipClass) {
      return items.map(function(it) {
        var label = typeof it === 'string' ? it : it.title;
        var q = typeof it === 'string' ? it : it.title;
        return '<button type="button" class="' + chipClass + '" data-q="' + escapeHtml(q) + '">' + escapeHtml(label) + '</button>';
      }).join('');
    }

    function renderEmpty() {
      var index = getIndex();
      var trending = [];
      if (index) {
        trending = TRENDING_IDS
          .map(function(id) { return index.find(function(x) { return x.id === id; }); })
          .filter(Boolean)
          .slice(0, 5);
      }
      var recent = getRecent();
      resultsBox.innerHTML = ''
        + '<div class="search-state search-state--empty">'
        +   '<p class="search-state__title">Discover knowledge</p>'
        +   '<p class="search-state__desc">Trending now — pick one or start typing.</p>'
        +   '<div class="search-state__chips">' + chipsHtml(trending.length ? trending : ['Python', 'DSA', 'HTML', 'Machine Learning'], 'search-state__chip') + '</div>'
        +   (recent.length
            ? '<div class="search-state__row"><span class="search-state__label">Recent</span>'
            + '<button type="button" class="search-state__mini" data-action="clear-recent">Clear</button></div>'
            + '<div class="search-state__chips">' + chipsHtml(recent, 'search-state__chip') + '</div>'
            : '')
        + '</div>'
        + footerHtml('');
      resultsBox.style.display = 'block';
      portal();
      input.setAttribute('aria-expanded', 'true');
      wireChips();
      liveRegion.textContent = 'Type to search courses, careers, skills and trails';
    }

    function wireChips() {
      resultsBox.querySelectorAll('[data-q]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          input.value = btn.getAttribute('data-q');
          handleInput();
          input.focus();
        });
      });
      var clearBtn = resultsBox.querySelector('[data-action="clear-recent"]');
      if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          clearRecent();
          renderEmpty();
        });
      }
    }

    function renderResults(results, query) {
      resultsBox.innerHTML = '';
      currentResults = [];
      selectedIndex = -1;
      input.removeAttribute('aria-activedescendant');

      if (!query) {
        renderEmpty();
        return;
      }

      input.setAttribute('aria-expanded', results.length > 0 ? 'true' : 'false');

      if (results.length === 0) {
        var safeQuery = escapeHtml(query);
        resultsBox.innerHTML = ''
          + '<div class="search-state search-state--noresults">'
          +   '<p class="search-state__title">No results for &ldquo;' + safeQuery + '&rdquo;</p>'
          +   '<p class="search-state__desc">Try a broader search, check spelling, or explore:</p>'
          +   '<div class="search-state__chips">'
          +     '<a href="' + escapeHtml(resolveUrl('courses')) + '" class="search-state__chip">Browse Skills</a>'
          +     '<a href="' + escapeHtml(resolveUrl('careers')) + '" class="search-state__chip">Career Paths</a>'
          +     '<a href="' + escapeHtml(resolveUrl('trisgraph')) + '" class="search-state__chip">TrisGraph</a>'
          +   '</div>'
          +   '<ul class="search-state__tips"><li>Try &ldquo;ML&rdquo; for Machine Learning</li><li>Try &ldquo;JS&rdquo; for JavaScript</li></ul>'
          + '</div>'
          + footerHtml(query);
        resultsBox.style.display = 'block';
        portal();
        liveRegion.textContent = 'No results for ' + query;
        return;
      }

      var groups = groupByType(results);
      var total = results.length;
      var header = document.createElement('div');
      header.className = 'search-results__header';
      header.innerHTML = '<span>' + total + ' result' + (total !== 1 ? 's' : '') + ' for &ldquo;' + escapeHtml(query) + '&rdquo;</span><button type="button" class="search-results__clear" aria-label="Clear search">Clear</button>';
      var headerClear = null;
      try {
        headerClear = header.querySelector('.search-results__clear');
      } catch (_) {}
      if (headerClear) {
        headerClear.addEventListener('click', function(e) {
          e.stopPropagation();
          input.value = '';
          input.focus();
          clearResults();
        });
      }
      resultsBox.appendChild(header);

      var typeLabels = { course: 'Courses', career: 'Careers', skill: 'Skills', trail: 'Trails', topic: 'Topics', other: 'Other' };

      Object.keys(groups).forEach(function(type) {
        var items = groups[type];
        if (!items || items.length === 0) return;
        var section = document.createElement('div');
        section.className = 'search-group';
        section.setAttribute('role', 'group');
        section.setAttribute('aria-label', typeLabels[type] || type);

        var heading = document.createElement('div');
        heading.className = 'search-group__heading';
        heading.textContent = typeLabels[type] || (type.charAt(0).toUpperCase() + type.slice(1));
        section.appendChild(heading);

        items.forEach(function(item) {
          var idx = currentResults.length;
          var el = document.createElement('div');
          el.className = 'search-item';
          el.setAttribute('role', 'option');
          el.setAttribute('id', 'search-result-' + idx);
          el.setAttribute('tabindex', '-1');

          var tags = (item.tags || item.skills || []).slice(0, 3).join(' \u00B7 ');
          var iconText = initialsFor(item.title);
          var iconMod = (type === 'course') ? '' : ' search-item__icon--' + type;

          el.innerHTML = ''
            + '<span class="search-item__icon' + iconMod + '" aria-hidden="true">' + escapeHtml(iconText) + '</span>'
            + '<div class="search-item__main">'
            +   '<div class="search-item__title">' + highlight(item.title, query) + '</div>'
            +   '<div class="search-item__desc">' + highlight(item.description || '', query) + '</div>'
            +   (tags ? '<div class="search-item__tags">' + escapeHtml(tags) + '</div>' : '')
            + '</div>'
            + '<span class="search-item__go" aria-hidden="true">&rarr;</span>';

          el.addEventListener('click', function() { goTo(item, query); });
          el.addEventListener('mouseenter', function() { setSelected(idx); });
          section.appendChild(el);
          currentResults.push({ el: el, item: item });
        });

        resultsBox.appendChild(section);
      });

      var relatedIds = [];
      results.forEach(function(r) { if (Array.isArray(r.related)) relatedIds = relatedIds.concat(r.related); });
      relatedIds = relatedIds.filter(function(id, i, arr) { return arr.indexOf(id) === i; }).slice(0, 5);
      var index = getIndex();
      if (relatedIds.length > 0 && index) {
        var relatedItems = relatedIds
          .map(function(id) { return index.find(function(x) { return x.id === id; }); })
          .filter(Boolean)
          .filter(function(rel) { return !results.some(function(r) { return r.id === rel.id; }); });
        if (relatedItems.length > 0) {
          var relatedSection = document.createElement('div');
          relatedSection.className = 'search-related';
          relatedSection.innerHTML = '<div class="search-related__heading">Related to your search</div><div class="search-related__chips"></div>';
          var chipsContainer = relatedSection.querySelector('.search-related__chips');
          relatedItems.forEach(function(rel) {
            var chip = document.createElement('a');
            chip.className = 'search-related__chip';
            chip.href = resolveUrl(rel.url);
            chip.textContent = rel.title;
            chipsContainer.appendChild(chip);
          });
          resultsBox.appendChild(relatedSection);
        }
      }

      var footer = document.createElement('div');
      footer.innerHTML = footerHtml(query);
      while (footer.firstChild) resultsBox.appendChild(footer.firstChild);

      resultsBox.style.display = 'block';
      portal();
      liveRegion.textContent = total + ' results for ' + query;
    }

    function clearResults() {
      resultsBox.innerHTML = '';
      resultsBox.style.display = 'none';
      unportal();
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      selectedIndex = -1;
      currentResults = [];
      liveRegion.textContent = '';
    }

    function setSelected(index) {
      currentResults.forEach(function(entry, i) {
        if (i === index) {
          entry.el.classList.add('is-selected');
          entry.el.setAttribute('aria-selected', 'true');
          input.setAttribute('aria-activedescendant', entry.el.id);
          try {
            entry.el.scrollIntoView({ block: 'nearest' });
          } catch (_) {}
        } else {
          entry.el.classList.remove('is-selected');
          entry.el.setAttribute('aria-selected', 'false');
        }
      });
      selectedIndex = index;
    }

    function firstUrl() {
      return currentResults.length > 0 ? resolveUrl(currentResults[0].item.url) : null;
    }

    function handleInput() {
      var query = input.value;
      try {
        if (query.trim() === '') {
          renderEmpty();
          return;
        }
        renderResults(search(query), query);
      } catch (e) {
        console.error('Search error:', e);
        resultsBox.innerHTML = '<div class="search-state search-state--error"><p class="search-state__title">Search unavailable</p><p class="search-state__desc">The search index could not be loaded. <button type="button" class="search-state__retry">Retry</button></p></div>' + footerHtml(query);
        resultsBox.style.display = 'block';
        portal();
        var retry = resultsBox.querySelector('.search-state__retry');
        if (retry) retry.addEventListener('click', handleInput);
        liveRegion.textContent = 'Search error';
      }
    }

    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleInput, 150);
    });

    if (searchButton) {
      searchButton.addEventListener('click', function() {
        var q = input.value.trim();
        if (!q) {
          input.focus();
          renderEmpty();
          return;
        }
        handleInput();
        // If results already rendered, follow the top one; otherwise full page
        window.setTimeout(function() {
          var url = firstUrl();
          if (url) {
            addRecent(q);
            window.location.href = url;
          } else {
            window.location.href = viewAllUrl(q);
          }
        }, 200);
      });
    }

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        clearResults();
        input.blur();
        return;
      }
      if (currentResults.length === 0) {
        if (e.key === 'Enter' && input.value.trim()) {
          window.location.href = viewAllUrl(input.value.trim());
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = selectedIndex + 1;
        if (next >= currentResults.length) next = 0;
        setSelected(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = selectedIndex - 1;
        if (prev < 0) prev = currentResults.length - 1;
        setSelected(prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && currentResults[selectedIndex]) {
          goTo(currentResults[selectedIndex].item, input.value);
        } else if (currentResults.length > 0) {
          goTo(currentResults[0].item, input.value);
        }
      }
    });

    input.addEventListener('focus', function() {
      if (input.value.trim() === '') {
        renderEmpty();
      } else if (resultsBox.style.display === 'none' || !resultsBox.innerHTML) {
        handleInput();
      } else {
        resultsBox.style.display = 'block';
        portal();
        input.setAttribute('aria-expanded', 'true');
      }
    });

    document.addEventListener('click', function(e) {
      try {
        if (portaled) {
          if (!resultsBox.contains(e.target) && e.target !== input) clearResults();
        } else if (container === document) {
          if (!resultsBox.contains(e.target) && e.target !== input) clearResults();
        } else if (!container.contains(e.target)) {
          clearResults();
        }
      } catch (_) {}
    });

    // Keep a portaled dropdown glued under the input
    document.addEventListener('scroll', positionPortal, { capture: true, passive: true });
    window.addEventListener('resize', positionPortal);
    window.addEventListener('orientationchange', positionPortal);

    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        var active = document.activeElement;
        if (active === input) return;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
        e.preventDefault();
        input.focus();
        input.select();
      }
    });

    resultsBox.style.display = 'none';
  }

  // ================= Page mode (search.html) =================
  function initPage() {
    var pageInput = document.getElementById('search-page-input');
    var pageList = document.getElementById('search-page-list');
    var pageMeta = document.getElementById('search-page-meta');
    var pageGo = document.getElementById('search-page-go');
    if (!pageInput || !pageList) return false;

    function params() {
      try {
        return new URLSearchParams(window.location.search).get('q') || '';
      } catch (_) {
        return '';
      }
    }

    function renderPage(query) {
      var index = getIndex();
      if (!index) {
        pageList.innerHTML = '<div class="search-state search-state--error"><p class="search-state__title">Search unavailable</p><p class="search-state__desc">The search index could not be loaded.</p></div>';
        return;
      }
      var q = (query || '').trim();
      if (!q) {
        var trending = TRENDING_IDS
          .map(function(id) { return index.find(function(x) { return x.id === id; }); })
          .filter(Boolean);
        pageMeta.textContent = 'Trending searches';
        pageList.innerHTML = trending.map(function(item) {
          return cardHtml(item, '');
        }).join('');
        wireCards();
        return;
      }
      var results;
      try {
        results = search(q);
      } catch (e) {
        pageList.innerHTML = '<div class="search-state search-state--error"><p class="search-state__title">Search unavailable</p></div>';
        return;
      }
      pageMeta.textContent = results.length
        ? results.length + ' result' + (results.length !== 1 ? 's' : '') + ' for \u201C' + q + '\u201D'
        : 'No results for \u201C' + q + '\u201D — try Python, DSA, HTML or Careers.';
      pageList.innerHTML = results.map(function(item) { return cardHtml(item, q); }).join('')
        || '<div class="search-state"><div class="search-state__chips">'
        + '<a class="search-state__chip" href="' + escapeHtml(resolveUrl('courses')) + '">Browse Skills</a>'
        + '<a class="search-state__chip" href="' + escapeHtml(resolveUrl('careers')) + '">Career Paths</a>'
        + '<a class="search-state__chip" href="' + escapeHtml(resolveUrl('trisgraph')) + '">TrisGraph</a>'
        + '</div></div>';
      wireCards(q);
    }

    function cardHtml(item, query) {
      var type = item.type || 'other';
      var outline = type === 'course' ? '' : ' search-page__icon--outline';
      return ''
        + '<a class="search-page__card" href="' + escapeHtml(resolveUrl(item.url)) + '" data-q="' + escapeHtml(query || '') + '">'
        +   '<span class="search-page__icon' + outline + '" aria-hidden="true">' + escapeHtml(initialsFor(item.title)) + '</span>'
        +   '<span class="search-page__body">'
        +     '<span class="search-page__name">' + highlight(item.title, query) + '</span>'
        +     '<span class="search-page__sub" style="display:block">' + highlight(item.description || '', query) + '</span>'
        +   '</span>'
        +   '<span class="search-page__tag">' + escapeHtml(type) + '</span>'
        + '</a>';
    }

    function wireCards(query) {
      pageList.querySelectorAll('.search-page__card').forEach(function(a) {
        a.addEventListener('click', function() {
          if (query || a.getAttribute('data-q')) addRecent(query || a.getAttribute('data-q'));
        });
      });
    }

    var timer = null;
    pageInput.addEventListener('input', function() {
      clearTimeout(timer);
      timer = setTimeout(function() {
        try {
          var url = new URL(window.location.href);
          url.searchParams.set('q', pageInput.value);
          window.history.replaceState(null, '', url.toString());
        } catch (_) {}
        renderPage(pageInput.value);
      }, 150);
    });

    pageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = pageList.querySelector('.search-page__card');
        if (first) {
          addRecent(pageInput.value);
          window.location.href = first.href;
        }
      }
    });

    if (pageGo) {
      pageGo.addEventListener('click', function() {
        var first = pageList.querySelector('.search-page__card');
        if (first) {
          addRecent(pageInput.value);
          window.location.href = first.href;
        }
      });
    }

    var initial = params();
    if (initial) pageInput.value = initial;
    renderPage(pageInput.value);
    return true;
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (initPage()) return; // search.html owns the page; dropdown not needed there
    var input = document.getElementById('course-search');
    var resultsBox = document.querySelector('.search-results');
    if (!input || !resultsBox) {
      console.info('Search UI not present on this page — skipping.');
      return;
    }
    initDropdown(input, resultsBox);
  });
})();
