/**
 * INFOTRIS SEARCH — Knowledge-discovery engine
 * - Extensible index (INFOTRIS_INDEX), no hard-coded page logic
 * - Relevance scoring (title > keywords > skills > description > fuzzy)
 * - Grouped by type, highlight, keyboard nav, debounced, resilient
 * - Keeps public search independent from Firebase/auth
 */
(function() {
  'use strict';

  // Wait for DOM + index
  document.addEventListener('DOMContentLoaded', function() {
    var input = document.getElementById('course-search');
    var resultsBox = document.querySelector('.search-results');
    var searchButton = document.querySelector('.search-bar-button');
    var container = document.querySelector('.search-container');
    if (!input || !resultsBox) {
      console.info('Search UI not present on this page — skipping.');
      return;
    }

    // Ensure container is positioned for dropdown
    if (container && getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    // Create live region for screen readers if not present
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

    // Accessibility attributes
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', 'search-results-list');
    input.setAttribute('aria-label', 'Search courses, careers, skills and trails');
    resultsBox.id = 'search-results-list';
    resultsBox.setAttribute('role', 'listbox');
    resultsBox.setAttribute('aria-label', 'Search suggestions');

    // State
    var selectedIndex = -1;
    var currentResults = []; // flat list of rendered items for keyboard nav
    var debounceTimer = null;
    var lastQuery = '';

    // --- Helpers ---

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function normalizeQuery(q) {
      return q
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')                // collapse spaces
        .replace(/[^\w\s\-]/g, ' ')          // remove punctuation, keep words/hyphen
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
          if (b.charAt(i-1) === a.charAt(j-1)) matrix[i][j] = matrix[i-1][j-1];
          else matrix[i][j] = Math.min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1);
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
      // Escape regex for each word, sort longest first to avoid nested highlights
      words.sort(function(a,b){ return b.length - a.length; });
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
      var allText = [title, desc, keywords, tags, skills, aliases, category].join(' ');

      var score = 0;

      // 1. Exact title match
      if (title === query) return 100;

      // 2. Strong title phrase match
      if (title.indexOf(query) !== -1) score += 80;
      // Alias exact
      if (aliases.split(' ').indexOf(query) !== -1 || aliases.indexOf(query) !== -1) score += 75;

      // 3. Title contains all words (any order)
      var titleContainsAll = words.every(function(w){ return title.indexOf(w) !== -1; });
      if (titleContainsAll && words.length > 1) score += 60;
      else if (titleContainsAll) score += 50;

      // 4. Keyword/tag/skill/category match
      var keywordMatch = words.some(function(w){ return keywords.indexOf(w) !== -1; });
      var tagMatch = words.some(function(w){ return tags.indexOf(w) !== -1; });
      var skillMatch = words.some(function(w){ return skills.indexOf(w) !== -1; });
      var aliasWordMatch = words.some(function(w){ return aliases.indexOf(w) !== -1; });
      var categoryMatch = words.some(function(w){ return category.indexOf(w) !== -1; });
      if (keywordMatch) score += 40;
      if (tagMatch) score += 35;
      if (skillMatch) score += 30;
      if (aliasWordMatch) score += 45;
      if (categoryMatch) score += 20;

      // 5. Description/content match
      if (desc.indexOf(query) !== -1) score += 20;
      else if (words.some(function(w){ return desc.indexOf(w) !== -1; })) score += 10;

      // 6. Partial word prefix
      words.forEach(function(w){
        if (titleWords.some(function(tw){ return tw.indexOf(w) === 0 && w.length >= 3; })) score += 15;
        if (keywords.split(' ').some(function(kw){ return kw.indexOf(w) === 0 && w.length >= 3; })) score += 10;
      });

      // 7. Fuzzy (typo tolerance) — small bonus, not aggressive
      words.forEach(function(w){
        if (w.length < 4) return;
        var titleFuzzy = titleWords.some(function(tw){ return isFuzzyMatch(w, tw); });
        var keywordFuzzy = keywords.split(' ').some(function(kw){ return isFuzzyMatch(w, kw); });
        if (titleFuzzy) score += 8;
        else if (keywordFuzzy) score += 5;
      });

      // Penalize if only "learning" matches but query is longer — avoid promoting generic "learning" for "machine learning"
      // If query has multiple words and only generic word matches, reduce score
      if (words.length > 1) {
        var genericWords = ['learning', 'course', 'skill'];
        var onlyGeneric = words.every(function(w){ return genericWords.indexOf(w) !== -1 || allText.indexOf(w) === -1; });
        // Actually, if query is "machine learning" and item is "Python" with description containing "learning", it would have low score anyway.
        // No extra penalty needed — scoring already prioritizes title.
      }

      return score;
    }

    function search(query) {
      if (typeof INFOTRIS_INDEX === 'undefined' || !Array.isArray(INFOTRIS_INDEX)) {
        console.error('INFOTRIS_INDEX not loaded');
        throw new Error('Search index unavailable');
      }
      var normalized = normalizeQuery(query);
      if (!normalized) return [];
      var scored = INFOTRIS_INDEX.map(function(item){
        return { item: item, score: scoreItem(item, normalized) };
      }).filter(function(x){ return x.score > 0; });
      scored.sort(function(a,b){ return b.score - a.score; });
      // Limit to top 20 overall, but keep per-category distribution
      return scored.slice(0, 20).map(function(x){ return x.item; });
    }

    function groupByType(results) {
      var groups = {};
      results.forEach(function(item){
        var type = item.type || 'other';
        if (!groups[type]) groups[type] = [];
        groups[type].push(item);
      });
      // Order: course, career, skill, trail, topic, other
      var order = ['course', 'career', 'skill', 'trail', 'topic', 'other'];
      var ordered = {};
      order.forEach(function(t){ if (groups[t]) ordered[t] = groups[t]; });
      // Add any remaining types not in order
      Object.keys(groups).forEach(function(t){ if (!ordered[t]) ordered[t] = groups[t]; });
      return ordered;
    }

    // --- Render ---

    function renderResults(results, query) {
      resultsBox.innerHTML = '';
      currentResults = [];
      selectedIndex = -1;
      input.setAttribute('aria-expanded', results.length > 0 ? 'true' : 'false');

      if (!query) {
        // Empty query — guidance
        resultsBox.innerHTML = ''
          + '<div class="search-state search-state--empty">'
          +   '<p class="search-state__title">Discover knowledge</p>'
          +   '<p class="search-state__desc">Try <strong>Python</strong>, <strong>HTML</strong>, <strong>Machine Learning</strong>, or <strong>DSA</strong></p>'
          +   '<div class="search-state__chips">'
          +     '<a href="courses/python/" class="search-state__chip">Python</a>'
          +     '<a href="courses/html/" class="search-state__chip">HTML</a>'
          +     '<a href="courses/dsa/" class="search-state__chip">DSA</a>'
          +     '<a href="careers/python-developer/" class="search-state__chip">Careers</a>'
          +   '</div>'
          + '</div>';
        resultsBox.style.display = 'block';
        liveRegion.textContent = 'Type to search courses, careers, skills and trails';
        return;
      }

      if (results.length === 0) {
        var safeQuery = escapeHtml(query);
        resultsBox.innerHTML = ''
          + '<div class="search-state search-state--noresults">'
          +   '<p class="search-state__title">No results for “' + safeQuery + '”</p>'
          +   '<p class="search-state__desc">Try a broader search, check spelling, or explore:</p>'
          +   '<div class="search-state__chips">'
          +     '<a href="courses" class="search-state__chip">Browse Skills</a>'
          +     '<a href="careers" class="search-state__chip">Career Paths</a>'
          +     '<a href="trisgraph" class="search-state__chip">TrisGraph</a>'
          +   '</div>'
          +   '<ul class="search-state__tips"><li>Try “ML” for Machine Learning</li><li>Try “JS” for JavaScript</li></ul>'
          + '</div>';
        resultsBox.style.display = 'block';
        liveRegion.textContent = 'No results for ' + query;
        return;
      }

      var groups = groupByType(results);
      var total = results.length;
      var header = document.createElement('div');
      header.className = 'search-results__header';
      header.innerHTML = '<span>' + total + ' result' + (total!==1?'s':'') + ' for “' + escapeHtml(query) + '”</span><button type="button" class="search-results__clear" aria-label="Clear search">Clear</button>';
      header.querySelector('.search-results__clear').addEventListener('click', function(){ input.value=''; input.focus(); clearResults(); });
      resultsBox.appendChild(header);

      var typeLabels = { course:'Courses', career:'Careers', skill:'Skills', trail:'Trails', topic:'Topics', other:'Other' };

      Object.keys(groups).forEach(function(type){
        var items = groups[type];
        if (!items || items.length === 0) return;
        var section = document.createElement('div');
        section.className = 'search-group';
        section.setAttribute('role', 'group');
        section.setAttribute('aria-label', typeLabels[type] || type);

        var heading = document.createElement('div');
        heading.className = 'search-group__heading';
        heading.textContent = typeLabels[type] || type.charAt(0).toUpperCase()+type.slice(1);
        section.appendChild(heading);

        items.forEach(function(item){
          var el = document.createElement('div');
          el.className = 'search-item';
          el.setAttribute('role', 'option');
          el.setAttribute('id', 'search-result-' + currentResults.length);
          el.setAttribute('tabindex', '-1');
          el.setAttribute('data-url', item.url);

          var tags = (item.tags || item.skills || []).slice(0,3).join(' · ');
          var highlightedTitle = highlight(item.title, query);
          var highlightedDesc = highlight(item.description || '', query);

          el.innerHTML = ''
            + '<div class="search-item__main">'
            +   '<div class="search-item__title">' + highlightedTitle + '</div>'
            +   '<div class="search-item__desc">' + highlightedDesc + '</div>'
            +   (tags ? '<div class="search-item__tags">' + escapeHtml(tags) + '</div>' : '')
            + '</div>'
            + '<span class="search-badge search-badge--' + escapeHtml(type) + '">' + escapeHtml(type) + '</span>';

          el.addEventListener('click', function(){ window.location.href = item.url; });
          el.addEventListener('mouseenter', function(){ setSelected(currentResults.length); });
          section.appendChild(el);
          currentResults.push(el);
        });

        resultsBox.appendChild(section);
      });

      // Related discovery (if any result has related)
      var relatedIds = [];
      results.forEach(function(r){ if (Array.isArray(r.related)) relatedIds = relatedIds.concat(r.related); });
      relatedIds = relatedIds.filter(function(id, idx, arr){ return arr.indexOf(id)===idx; }).slice(0,5);
      if (relatedIds.length > 0 && typeof INFOTRIS_INDEX !== 'undefined') {
        var relatedItems = relatedIds.map(function(id){ return INFOTRIS_INDEX.find(function(x){ return x.id===id; }); }).filter(Boolean);
        if (relatedItems.length > 0) {
          var relatedSection = document.createElement('div');
          relatedSection.className = 'search-related';
          relatedSection.innerHTML = '<div class="search-related__heading">Related to your search</div><div class="search-related__chips"></div>';
          var chipsContainer = relatedSection.querySelector('.search-related__chips');
          relatedItems.forEach(function(rel){
            var chip = document.createElement('a');
            chip.className = 'search-related__chip';
            chip.href = rel.url;
            chip.textContent = rel.title;
            chipsContainer.appendChild(chip);
          });
          resultsBox.appendChild(relatedSection);
        }
      }

      resultsBox.style.display = 'block';
      liveRegion.textContent = total + ' results for ' + query;
    }

    function clearResults() {
      resultsBox.innerHTML = '';
      resultsBox.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      selectedIndex = -1;
      currentResults = [];
      liveRegion.textContent = '';
    }

    function setSelected(index) {
      currentResults.forEach(function(el, i){
        if (i === index) {
          el.classList.add('is-selected');
          el.setAttribute('aria-selected', 'true');
          input.setAttribute('aria-activedescendant', el.id);
          // Ensure visible
          el.scrollIntoView({ block: 'nearest' });
        } else {
          el.classList.remove('is-selected');
          el.setAttribute('aria-selected', 'false');
        }
      });
      selectedIndex = index;
    }

    function handleInput() {
      var query = input.value;
      lastQuery = query;
      // For local index, no loading delay, but handle error
      try {
        if (query.trim() === '') {
          renderResults([], '');
          return;
        }
        var results = search(query);
        renderResults(results, query);
      } catch (e) {
        console.error('Search error:', e);
        resultsBox.innerHTML = '<div class="search-state search-state--error"><p class="search-state__title">Search unavailable</p><p class="search-state__desc">Please try again. <button type="button" class="search-state__retry">Retry</button></p></div>';
        resultsBox.style.display = 'block';
        var retry = resultsBox.querySelector('.search-state__retry');
        if (retry) retry.addEventListener('click', handleInput);
        liveRegion.textContent = 'Search error';
      }
    }

    // Debounced input
    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleInput, 150);
    });

    // Search button
    if (searchButton) {
      searchButton.addEventListener('click', function(){
        handleInput();
        input.focus();
      });
    }

    // Keyboard navigation
    input.addEventListener('keydown', function(e) {
      if (currentResults.length === 0 && e.key !== 'Escape') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = selectedIndex + 1;
        if (next >= currentResults.length) next = 0;
        setSelected(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = selectedIndex - 1;
        if (prev < 0) prev = currentResults.length -1;
        setSelected(prev);
      } else if (e.key === 'Enter') {
        if (selectedIndex >=0 && currentResults[selectedIndex]) {
          e.preventDefault();
          var url = currentResults[selectedIndex].getAttribute('data-url');
          if (url) window.location.href = url;
        } else {
          // If no selection but there are results, go to first
          if (currentResults.length > 0) {
            var firstUrl = currentResults[0].getAttribute('data-url');
            if (firstUrl) window.location.href = firstUrl;
          }
        }
      } else if (e.key === 'Escape') {
        clearResults();
        input.blur();
      }
    });

    // Focus shows guidance if empty
    input.addEventListener('focus', function(){
      if (input.value.trim() === '') {
        renderResults([], '');
      } else if (resultsBox.style.display !== 'none') {
        resultsBox.style.display = 'block';
        input.setAttribute('aria-expanded', 'true');
      }
    });

    // Click outside closes
    document.addEventListener('click', function(e){
      if (!container.contains(e.target) && !resultsBox.contains(e.target)) {
        clearResults();
      }
    });

    // Ctrl/Cmd+K shortcut (check no conflict)
    document.addEventListener('keydown', function(e){
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        // Avoid if already in input/textarea
        var active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
          // If already focused on search, don't prevent
          if (active === input) return;
        }
        e.preventDefault();
        input.focus();
        input.select();
      }
    });

    // Initial state: don't show results until focus/typing
    resultsBox.style.display = 'none';
  });
})();
