// ----------------- Google Sheets helper -----------------
const SHEET_ID = "1IYuG9OxiSse-RxWQQh6C7UylOgfdFVH0bz-oPeRSAZ8";
// Bookmark Sheet ID
const BOOKMARK_SHEET_ID = "18yV3Cox2ozo9Zvs3gvhgEm3sKbs101a9W4PSW7k6p9Q";

// Helper to show a simple prompt modal
function showBookmarkPrompt(title, fields, callback) {
   const modal = document.createElement('div');
   modal.className = 'modal';
   modal.innerHTML = `<div class="modal-content"><h3>${title}</h3>${fields.map(f => `<label>${f.label}<input type="${f.type}" id="${f.id}" /></label>`).join('')}<button id="bookmarkModalOk">OK</button><button id="bookmarkModalCancel">Cancel</button></div>`;
   document.body.appendChild(modal);
   document.getElementById('bookmarkModalOk').onclick = () => {
      const values = {};
      fields.forEach(f => { values[f.id] = document.getElementById(f.id).value; });
      document.body.removeChild(modal);
      callback(values);
   };
   document.getElementById('bookmarkModalCancel').onclick = () => document.body.removeChild(modal);
}

// Add bookmark to Google Sheet
// To make addBookmarkToSheet work, create a Google Form linked to your Bookmarks sheet with fields Surah and Ayat.
// Then, replace FORM_ID, ENTRY_SURAH, ENTRY_AYAT below with your form's values.
async function addBookmarkToSheet(surah, ayah) {
   // Example values (replace with your own):
   // FORM_ID: The long ID in your form's URL (after /d/e/ and before /viewform)
   // ENTRY_SURAH: The entry ID for Surah field (find in form HTML as name="entry.xxxxx")
   // ENTRY_AYAT: The entry ID for Ayat field
   const FORM_ID = "REPLACE_WITH_YOUR_FORM_ID";
   const ENTRY_SURAH = "REPLACE_WITH_SURAH_ENTRY_ID";
   const ENTRY_AYAT = "REPLACE_WITH_AYAT_ENTRY_ID";
   if (FORM_ID.startsWith('REPLACE')) {
      alert('Please set up your Google Form and update FORM_ID, ENTRY_SURAH, ENTRY_AYAT in main.js');
      return;
   }
   const formUrl = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
   const formData = new FormData();
   formData.append(ENTRY_SURAH, surah);
   formData.append(ENTRY_AYAT, ayah);
   try {
      await fetch(formUrl, { method: 'POST', mode: 'no-cors', body: formData });
      alert('Bookmark added! Surah: ' + surah + ', Ayah: ' + ayah);
   } catch (e) {
      alert('Failed to add bookmark. Please check your form setup.');
   }
}

// Fetch bookmarks from Google Sheet
async function fetchBookmarksFromSheet() {
   // Use fetchSheet to read Bookmarks table from real Google Sheet
   // Temporarily override SHEET_ID for this call
   const originalSheetId = SHEET_ID;
   const sheetId = BOOKMARK_SHEET_ID;
   // Use fetchSheet logic, but with Bookmarks sheet and correct ID
   const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=Bookmarks`;
   const res = await fetch(url);
   const text = await res.text();
   let match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);\s*$/);
   if (!match) {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         match = [, text.slice(firstBrace, lastBrace + 1)];
      }
   }
   if (!match) {
      alert('Failed to fetch bookmarks.');
      return [];
   }
   let jsonStr = match[1];
   const fb = jsonStr.indexOf('{');
   const lb = jsonStr.lastIndexOf('}');
   if (fb !== -1 && lb !== -1) {
      jsonStr = jsonStr.slice(fb, lb + 1);
   }
   let parsed;
   try {
      parsed = JSON.parse(jsonStr);
   } catch (e) {
      alert('Failed to parse bookmarks.');
      return [];
   }
   if (!parsed.table || !parsed.table.cols) return [];
   const headers = parsed.table.cols.map(c => (c.label || c.id || '').trim());
   const rows = parsed.table.rows || [];
   return rows.map(r => {
      const obj = {};
      headers.forEach((h, i) => {
         const cell = r.c[i];
         obj[h] = cell && cell.v !== null && cell.v !== undefined ? cell.v : '';
      });
      return { 
         SurahNumber: obj["SurahNumber"], 
         AyatNumber: obj["AyatNumber"]
      };
   }).filter(bookmark => bookmark.SurahNumber && bookmark.AyatNumber); // Only include bookmarks with valid surah and ayat
}

// Render bookmarks as a simple flat list
function renderBookmarks(bookmarks) {
   const preview = document.getElementById('bookmarkPreview');
   preview.innerHTML = '';
   
   if (!bookmarks || bookmarks.length === 0) {
      preview.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">No bookmarks found</p>';
      return;
   }
   
   const list = document.createElement('div');
   list.style.display = 'flex';
   list.style.flexDirection = 'column';
   list.style.gap = '8px';
   
   // Render each bookmark as a simple clickable item
   bookmarks.forEach((bookmark, i) => {
      if (bookmark.SurahNumber && bookmark.AyatNumber && i === 0) {
         const item = document.createElement('div');
         item.className = 'bookmark-item';
         
         const link = document.createElement('a');
         link.className = 'bookmark-list-link';
         link.href = '#';
         link.style.display = 'block';
         link.style.padding = '8px 12px';
         link.style.textDecoration = 'none';
         link.style.color = 'var(--accent, #007bff)';
         link.style.backgroundColor = 'var(--card-bg)';
         link.style.border = '1px solid var(--border)';
         link.style.borderRadius = '4px';
         link.style.cursor = 'pointer';
         link.style.transition = 'background-color 0.2s';
         
         link.textContent = `${bookmark.SurahNumber}:${bookmark.AyatNumber}`;
         
         link.onclick = (e) => {
            e.preventDefault();
            gotoSurahAyah(bookmark.SurahNumber, bookmark.AyatNumber);
         };
         
         // Add hover effect
         link.onmouseenter = () => {
            link.style.backgroundColor = 'var(--accent-light)';
         };
         link.onmouseleave = () => {
            link.style.backgroundColor = 'var(--card-bg)';
         };
         
         item.appendChild(link);
         list.appendChild(item);
      }
   });
   
   preview.appendChild(list);
}

function gotoSurahAyah(surah, ayah) {
   // Use your existing navigation logic
   document.getElementById('gotoSurah').value = surah;
   document.getElementById('gotoAyat').value = ayah;
   document.getElementById('gotoBtn').click();
}

// Event listeners for bookmark buttons
window.addEventListener('DOMContentLoaded', () => {
   document.getElementById('addBookmarkBtn')?.addEventListener('click', () => {
      const key = prompt('Developer only feature\nEnter key:');
      if (key !== '7861') return alert('Invalid key');
      showBookmarkPrompt('Add Bookmark', [
         { label: 'Surah (1-114):', type: 'number', id: 'bookmarkSurah' },
         { label: 'Ayah (1-286):', type: 'number', id: 'bookmarkAyah' }
      ], async (vals) => {
         const surah = parseInt(vals.bookmarkSurah);
         const ayah = parseInt(vals.bookmarkAyah);
         if (isNaN(surah) || surah < 1 || surah > 114) return alert('Surah must be 1-114');
         if (isNaN(ayah) || ayah < 1 || ayah > 286) return alert('Ayah must be 1-286');
         await addBookmarkToSheet(surah, ayah);
      });
   });
   document.getElementById('fetchBookmarksBtn')?.addEventListener('click', async () => {
      const key = prompt('Developer only feature\nEnter key:');
      if (key !== '7861') return alert('Invalid key');
      const bookmarks = await fetchBookmarksFromSheet();
      renderBookmarks(bookmarks);
   });
});


function parseCSVtoObjects(csv) {
   const lines = csv.trim().split("\n");
   const headers = lines.shift().split(",").map(h => h.trim());
   return lines.map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => obj[h] = (values[i] || "").trim());
      return obj;
   });
}

async function fetchSheet(sheetName) {
   const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;
   const res = await fetch(url);
   const text = await res.text();
   // Use greedy match to avoid premature stop when ');' appears inside string data
   let match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);\s*$/);
   if (!match) {
      // Fallback: try to slice from first { to last }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         match = [, text.slice(firstBrace, lastBrace + 1)];
      }
   }
   if (!match) {
      console.error('Unexpected response format for sheet:', sheetName, text.slice(0, 200));
      return [];
   }

   let typeLookupData = []
   let jsonStr = match[1];
   // Extra safety: trim and ensure it starts/ends with braces
   const fb = jsonStr.indexOf('{');
   const lb = jsonStr.lastIndexOf('}');
   if (fb !== -1 && lb !== -1) {
      jsonStr = jsonStr.slice(fb, lb + 1);
   }
   let parsed;
   try {
      parsed = JSON.parse(jsonStr);
   } catch (e) {
      console.error('Failed to parse sheet JSON for', sheetName, e, 'snippet:', jsonStr.slice(0, 300));
      return [];
   }
   if (!parsed.table || !parsed.table.cols) return [];
   const headers = parsed.table.cols.map(c => (c.label || c.id || '').trim());
   const rows = parsed.table.rows || [];
   return rows.map(r => {
      const obj = {};
      headers.forEach((h, i) => {
         const cell = r.c[i];
         obj[h] = cell && cell.v !== null && cell.v !== undefined ? cell.v : '';
      });
      return obj;
   });
}

// ----------------- Data Access -----------------
async function getSurahs() {
   // Use static Surah list since we're now using the API for Arabic text
   // This can be made dynamic by calling the API for each surah if needed
   const staticSurahs = [
      { SurahNumber: 1, SurahNameArabic: "الفاتحة", SurahNameTransliteration: "Al-Fatiha", SurahNameEnglish: "The Opening", NoOfAyats: 7 },
      { SurahNumber: 2, SurahNameArabic: "البقرة", SurahNameTransliteration: "Al-Baqara", SurahNameEnglish: "The Cow", NoOfAyats: 286 },
      { SurahNumber: 3, SurahNameArabic: "آل عمران", SurahNameTransliteration: "Aal-E-Imran", SurahNameEnglish: "The Family of Imran", NoOfAyats: 200 },
      { SurahNumber: 4, SurahNameArabic: "النساء", SurahNameTransliteration: "An-Nisa", SurahNameEnglish: "The Women", NoOfAyats: 176 },
      { SurahNumber: 5, SurahNameArabic: "المائدة", SurahNameTransliteration: "Al-Ma'ida", SurahNameEnglish: "The Table", NoOfAyats: 120 },
      { SurahNumber: 6, SurahNameArabic: "الأنعام", SurahNameTransliteration: "Al-An'am", SurahNameEnglish: "The Cattle", NoOfAyats: 165 },
      { SurahNumber: 7, SurahNameArabic: "الأعراف", SurahNameTransliteration: "Al-A'raf", SurahNameEnglish: "The Heights", NoOfAyats: 206 },
      // Add more surahs as needed - keeping it short for now, but you can expand this list
      { SurahNumber: 112, SurahNameArabic: "الإخلاص", SurahNameTransliteration: "Al-Ikhlaas", SurahNameEnglish: "Sincerity", NoOfAyats: 4 },
      { SurahNumber: 113, SurahNameArabic: "الفلق", SurahNameTransliteration: "Al-Falaq", SurahNameEnglish: "The Dawn", NoOfAyats: 5 },
      { SurahNumber: 114, SurahNameArabic: "الناس", SurahNameTransliteration: "An-Nas", SurahNameEnglish: "Mankind", NoOfAyats: 6 }
   ];

   // For a complete list, you might want to keep the Google Sheets approach for surah metadata
   // or create a complete static list of all 114 surahs
   try {
      const arr = await fetchSheet("Surahs");
      return arr.map(r => ({
         SurahNumber: r["SurahNumber"] || r["surahnumber"] || r["Surah Number"] || r["index"] || "",
         NoOfAyats: r["NoOfAyats"] || r["No Of Ayats"] || "",
         SurahNameArabic: r["SurahNameArabic"] || r["Surah Name Arabic"] || r["name"] || "",
         SurahNameTransliteration: r["SurahNameTransliteration"] || r["Surah Name Transliteration"] || "",
         SurahNameEnglish: r["SurahNameEnglish"] || r["Surah Name English"] || "",
         SurahChronologicalNumber: r["SurahChronologicalNumber"] || r["Surah Chronological Number"] || "",
         SurahRevealedLocation: r["SurahRevealedLocation"] || r["Surah Revealed Location"] || ""
      }));
   } catch (error) {
      console.error('Error fetching surah list, using static fallback:', error);
      return staticSurahs;
   }
}

async function getQuranBySurah(surahNumber) {
   if (!surahNumber) return [];

   try {
      const response = await fetch(`https://quranapi.pages.dev/api/${surahNumber}.json`);
      if (!response.ok) {
         throw new Error(`Failed to fetch surah ${surahNumber}: ${response.status}`);
      }

      const data = await response.json();
      const arabicTexts = data.arabic1 || []; // Always use arabic1

      // Convert to the expected format
      const result = arabicTexts.map((text, index) => ({
         index: surahNumber,
         name: data.surahNameArabic || data.surahName || "",
         index2: index + 1, // ayah number (1-based)
         text: text,
         bismillah: index === 0 && +surahNumber !== 1 && +surahNumber !== 9 ? "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ" : ""
      }));

      return result;
   } catch (error) {
      console.error('Error fetching Quran data from API:', error);
      // Fallback to empty array or could fallback to old method
      return [];
   }
}

async function getTranslationsBySurah(surahNumber) {
   const arr = await fetchSheet("Translation");
   if (!surahNumber) return arr;
   const surahTran = arr
      .filter(r => parseInt(r.B) === parseInt(surahNumber)) // B = SurahNumber
      .map(r => ({
         AyatTranslationID: r.A || "",      // A = ID
         SurahNumber: r.B || "",            // B = SurahNumber
         AyatNumber: r.C || "",             // C = AyatNumber
         Translator: r.D || "",              // D = Translator
         AyatTranslationText: r.E || "",    // E = Text
      }));

   return surahTran;
}

async function getAnnotationsBySurah(surahNumber) {
   const arr = await fetchSheet("Annotation");
   const rows = surahNumber
      ? arr.filter(r => parseInt(r["SurahNumber"]) === parseInt(surahNumber))
      : arr;
   return rows.map(r => ({
      AyatTranslationID: r["AyatTranslationID"] || "",
      AnnotationID: r["AnnotationID"] || "",
      SurahNumber: r["SurahNumber"] || "",
      AyatNumber: r["AyatNumber"] || "",
      AnnotationType: r["AnnotationType"] || "",
      StartIndex: r["StartIndex"] || 0,
      EndIndex: r["EndIndex"] || r["StartIndex"] || 0,
      NoteType: r["NoteType"] || "",
      NoteTextHTML: r["NoteTextHTML"] || "",
      ParallelText: r["ParallelText"] || "",
      ShortNoteText: r["ShortNoteText"] || "",
      Colour: r["Colour"] || "",
      TagName: r["TagName"] || "",
   }));
}

async function getTypeLookup() {
   const arr = await fetchSheet("TypeLookup");
   if (!arr || arr.length < 2) return [];

   // Use first row as header mapping
   const headerRow = arr[0];
   const headers = Object.values(headerRow);

   // Map each subsequent row to real names
   typeLookupData = arr.slice(1).map(r => {
      const obj = {};
      Object.keys(r).forEach((key, idx) => {
         const realName = headers[idx] || key;
         obj[realName] = r[key];
      });
      return obj;
   });
   return typeLookupData;
}

async function searchTranslations(q) {
   if (!q) return [];
   q = q.toLowerCase();

   const [translations, annotations] = await Promise.all([
      fetchSheet("Translation"),
      fetchSheet("Annotation")
   ]);

   const results = [];
   const processedAyahs = new Set();

   // Search in translations - using correct column mapping
   // A = AyatTranslationID, B = SurahNumber, C = AyatNumber, D = Translator, E = AyatTranslationText
   translations.forEach(r => {
      const text = (r.E || "").toLowerCase(); // Column E is the translation text
      if (text.includes(q)) {
         const key = `${r.B}-${r.C}`; // B = SurahNumber, C = AyatNumber
         if (!processedAyahs.has(key)) {
            results.push({
               SurahNumber: r.B,
               AyatNumber: r.C,
               AyatTranslationText: r.E,
               Translator: r.D || "",
               matchType: "Translation"
            });
            processedAyahs.add(key);
         }
      }
   });

   // Search in annotations (ParallelText only - not ShortNoteText for basic search)
   annotations.forEach(ann => {
      const parallelText = (ann["ParallelText"] || "").toLowerCase();

      if (parallelText.includes(q)) {
         const key = `${ann["SurahNumber"]}-${ann["AyatNumber"]}`;
         if (!processedAyahs.has(key)) {
            // Find corresponding translation
            const translation = translations.find(t =>
               t.B == ann["SurahNumber"] &&
               t.C == ann["AyatNumber"]
            );

            results.push({
               SurahNumber: ann["SurahNumber"],
               AyatNumber: ann["AyatNumber"],
               AyatTranslationText: translation ? translation.E : "",
               Translator: translation ? (translation.D || "") : "",
               matchType: "Parallel Text"
            });
            processedAyahs.add(key);
         }
      }
   });

   // Sort results by Surah and Ayat number
   return results.sort((a, b) => {
      const surahDiff = parseInt(a.SurahNumber) - parseInt(b.SurahNumber);
      if (surahDiff !== 0) return surahDiff;
      return parseInt(a.AyatNumber) - parseInt(b.AyatNumber);
   });
}

async function searchTranslationsAndAnnotations(q) {
   if (!q) return [];
   q = q.toLowerCase();

   const [translations, annotations] = await Promise.all([
      fetchSheet("Translation"),
      fetchSheet("Annotation")
   ]);

   const results = [];
   const processedAyahs = new Set();

   // Search in translations - using correct column mapping
   // A = AyatTranslationID, B = SurahNumber, C = AyatNumber, D = Translator, E = AyatTranslationText
   translations.forEach(r => {
      const text = (r.E || "").toLowerCase(); // Column E is the translation text
      if (text.includes(q)) {
         const key = `${r.B}-${r.C}`; // B = SurahNumber, C = AyatNumber
         if (!processedAyahs.has(key)) {
            results.push({
               SurahNumber: r.B,
               AyatNumber: r.C,
               AyatTranslationText: r.E,
               Translator: r.D || "",
               matchType: "Translation"
            });
            processedAyahs.add(key);
         }
      }
   });

   // Search in all annotation fields: Parallel Text + Notes + Short Notes
   annotations.forEach(ann => {
      const parallelText = (ann["ParallelText"] || "").toLowerCase();
      const shortText = (ann["ShortNoteText"] || "").toLowerCase();
      const noteTextHTML = (ann["NoteTextHTML"] || "").toLowerCase();

      if (parallelText.includes(q) || shortText.includes(q) || noteTextHTML.includes(q)) {
         const key = `${ann["SurahNumber"]}-${ann["AyatNumber"]}`;
         if (!processedAyahs.has(key)) {
            // Find corresponding translation
            const translation = translations.find(t =>
               t.B == ann["SurahNumber"] &&
               t.C == ann["AyatNumber"]
            );

            let matchType = "Notes";
            if (parallelText.includes(q)) matchType = "Parallel Text";
            else if (shortText.includes(q)) matchType = "Short Notes";
            else if (noteTextHTML.includes(q)) matchType = "Notes";

            results.push({
               SurahNumber: ann["SurahNumber"],
               AyatNumber: ann["AyatNumber"],
               AyatTranslationText: translation ? translation.E : "",
               Translator: translation ? (translation.D || "") : "",
               matchType: matchType
            });
            processedAyahs.add(key);
         }
      }
   });

   // Sort results by Surah and Ayat number
   return results.sort((a, b) => {
      const surahDiff = parseInt(a.SurahNumber) - parseInt(b.SurahNumber);
      if (surahDiff !== 0) return surahDiff;
      return parseInt(a.AyatNumber) - parseInt(b.AyatNumber);
   });
}

async function getUniqueTags() {
   const arr = await fetchSheet("Annotation");
   const set = {};
   arr.forEach(r => { const t = r["TagName"]; if (t) set[t] = true; });
   return Object.keys(set);
}

async function getAyatsByTag(tag) {
   const resultsSection = document.getElementById('total-results-found');
   if (resultsSection) {
      resultsSection.style.display = 'none';
      resultsSection.innerHTML = '';
   }
   if (!tag) return [];
   const arr = await fetchSheet("Annotation");
   return arr.filter(r => r["TagName"] === tag).map(r => ({
      SurahNumber: r["SurahNumber"],
      AyatNumber: r["AyatNumber"],
      AyatTranslationID: r["AyatTranslationID"]
   }));
}

// ----------------- Local storage replacements (Bookmarks / Feedback) -----------------
function lsGet(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch (e) { return def; } }
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getBookmarks() { return lsGet('bookmarks'); }
function addBookmark(obj) {
   const list = getBookmarks();
   list.push(obj);
   lsSet('bookmarks', list);
}
function saveFeedback(data) {
   const list = lsGet('feedback', []);
   list.push({ ...data, ts: Date.now() });
   lsSet('feedback', list);
   return true;
}

// ----------------- UI Logic -----------------
let completeSurahList = null;
let arabicSize = 28;
let transSize = 16;
let showTranslator = true;
let isNavOpen = false;
let isSettingsOpen = false;
let arabicFontStyle = 'uthmani'; // 'uthmani' or 'indo-pak'

const readerRows = document.getElementById("readerRows");

// Navigation panel toggle
document.getElementById("menuToggle")?.addEventListener("click", () => {
   const leftPanel = document.getElementById("leftPanel");
   const reader = document.querySelector(".reader");

   isNavOpen = !isNavOpen;
   if (isNavOpen) {
      leftPanel?.classList.add("show");
      reader?.classList.add("nav-open");
   } else {
      leftPanel?.classList.remove("show");
      reader?.classList.remove("nav-open");
   }
});

// Settings panel toggle
document.getElementById("settingsToggle")?.addEventListener("click", () => {
   const settingsPanel = document.getElementById("settingsPanel");
   const reader = document.querySelector(".reader");

   isSettingsOpen = !isSettingsOpen;
   if (isSettingsOpen) {
      settingsPanel?.classList.add("show");
      reader?.classList.add("settings-open");
   } else {
      settingsPanel?.classList.remove("show");
      reader?.classList.remove("settings-open");
   }
});

// Collapsible navigation sections
document.addEventListener("click", (e) => {
   if (e.target.classList.contains("collapsible")) {
      e.target.classList.toggle("collapsed");

      // Handle data-target for settings sections
      const target = e.target.getAttribute('data-target');
      if (target) {
         const targetElement = document.getElementById(target);
         if (targetElement) {
            targetElement.style.display = targetElement.style.display === 'none' ? 'block' : 'none';
         }
      }
   }
});

// Click outside panels to close them
document.addEventListener("click", (e) => {
   const leftPanel = document.getElementById("leftPanel");
   const settingsPanel = document.getElementById("settingsPanel");
   const menuToggle = document.getElementById("menuToggle");
   const settingsToggle = document.getElementById("settingsToggle");
   const reader = document.querySelector(".reader");

   // Close left navigation panel if clicking outside
   if (isNavOpen && leftPanel) {
      const isClickInsideNav = leftPanel.contains(e.target);
      const isClickOnToggle = menuToggle && menuToggle.contains(e.target);

      if (!isClickInsideNav && !isClickOnToggle) {
         isNavOpen = false;
         leftPanel.classList.remove("show");
         reader?.classList.remove("nav-open");
      }
   }

   // Close settings panel if clicking outside
   if (isSettingsOpen && settingsPanel) {
      const isClickInsideSettings = settingsPanel.contains(e.target);
      const isClickOnToggle = settingsToggle && settingsToggle.contains(e.target);

      if (!isClickInsideSettings && !isClickOnToggle) {
         isSettingsOpen = false;
         settingsPanel.classList.remove("show");
         reader?.classList.remove("settings-open");
      }
   }
});

// Font size controls

// Column layout toggle: Arabic right, English left
document.getElementById("toggleColumnLayout")?.addEventListener("change", function () {
   const reader = document.querySelector('.reader');
   if (this.checked) {
      reader?.classList.add('column-arabic-right');
      localStorage.setItem('columnArabicRight', 'true');
   } else {
      reader?.classList.remove('column-arabic-right');
      localStorage.setItem('columnArabicRight', 'false');
   }
});

// On load, apply saved column layout
window.addEventListener('DOMContentLoaded', () => {
   const reader = document.querySelector('.reader');
   const colPref = localStorage.getItem('columnArabicRight');
   const toggle = document.getElementById('toggleColumnLayout');
   if (colPref === 'true') {
      reader?.classList.add('column-arabic-right');
      if (toggle) toggle.checked = true;
   } else {
      reader?.classList.remove('column-arabic-right');
      if (toggle) toggle.checked = false;
   }
});

document.getElementById("arabicPlus")?.addEventListener("click", () => {
   if (arabicSize < 48) {
      arabicSize += 1;
      document.querySelectorAll('.arabic-cell').forEach(el => el.style.fontSize = arabicSize + "px");
      const valEl = document.getElementById('arabicSizeValue');
      if (valEl) valEl.textContent = arabicSize;
   }
});
document.getElementById("arabicMinus")?.addEventListener("click", () => {
   if (arabicSize > 16) {
      arabicSize -= 1;
      document.querySelectorAll('.arabic-cell').forEach(el => el.style.fontSize = arabicSize + "px");
      const valEl = document.getElementById('arabicSizeValue');
      if (valEl) valEl.textContent = arabicSize;
   }
});
document.getElementById("transPlus")?.addEventListener("click", () => {
   if (transSize < 28) {
      transSize += 1;
      document.querySelectorAll('.trans-cell').forEach(el => el.style.fontSize = transSize + "px");
      const valEl = document.getElementById('transSizeValue');
      if (valEl) valEl.textContent = transSize;
   }
});
document.getElementById("transMinus")?.addEventListener("click", () => {
   if (transSize > 12) {
      transSize -= 1;
      document.querySelectorAll('.trans-cell').forEach(el => el.style.fontSize = transSize + "px");
      const valEl = document.getElementById('transSizeValue');
      if (valEl) valEl.textContent = transSize;
   }
});

// Function to recalculate shortnote margins after font size change
function recalculateShortnoteMargins() {
   // Find all ruby elements and recalculate their margins (legacy ruby implementation)
   document.querySelectorAll('.short-note-ruby').forEach(ruby => {
      const rtElement = ruby.querySelector('rt');
      const rbElement = ruby.querySelector('rb');
      
      if (rtElement && rbElement) {
         // Find the parent span containing this ruby
         const charSpan = ruby.closest('span');
         const nextSpan = charSpan?.nextElementSibling;
         
         if (nextSpan && nextSpan.tagName === 'SPAN') {
            // Recalculate margin using the same logic as in applyAnnotationsToText
            const fontSizeRatio = shortnoteSize / 14;
            const baseCharWidth = shortnoteSize * (0.45 + (fontSizeRatio * 0.05));
            const textLength = rtElement.textContent.length;
            const rubyWidth = textLength * baseCharWidth;
            
            let compensationFactor;
            if (shortnoteSize < 10) {
               // Very small fonts need minimal compensation to prevent overlap
               compensationFactor = 0.2 + (fontSizeRatio * 0.3); // Range: 0.2-0.5 for sizes 8-10px
            } else if (shortnoteSize < 14) {
               // Small fonts need gradual compensation
               compensationFactor = 0.5 + ((fontSizeRatio - 0.714) * 0.6); // Range: 0.5-0.8 for sizes 10-14px
            } else if (shortnoteSize > 14) {
               // Larger fonts: more negative margin (away from 0)
               compensationFactor = 0.8 + ((fontSizeRatio - 1) * 0.2); // Gradual increase from 0.8
            } else {
               compensationFactor = 0.8; // Baseline at 14px
            }
            
            const calculatedMargin = -(rubyWidth * compensationFactor);
            
            if (calculatedMargin <= -1) {
               nextSpan.style.marginLeft = calculatedMargin + 'px';
            } else {
               nextSpan.style.marginLeft = ''; // Reset margin if not needed
            }
         }
      }
   });
}

// Shortnote font size controls
let shortnoteSize = parseInt(localStorage.getItem('shortnoteSize') || '10');
document.getElementById("shortnotePlus")?.addEventListener("click", () => {
   if (shortnoteSize < 28) {
      shortnoteSize += 1;
      localStorage.setItem('shortnoteSize', shortnoteSize);
      document.querySelectorAll('.short-note-superscript').forEach(el => el.style.fontSize = shortnoteSize + "px");
      const valEl = document.getElementById('shortnoteSizeValue');
      if (valEl) valEl.textContent = shortnoteSize;
      
      // Recalculate margins for the new font size
      recalculateShortnoteMargins();
   }
});
document.getElementById("shortnoteMinus")?.addEventListener("click", () => {
   if (shortnoteSize > 8) {
      shortnoteSize -= 1;
      localStorage.setItem('shortnoteSize', shortnoteSize);
      document.querySelectorAll('.short-note-superscript').forEach(el => el.style.fontSize = shortnoteSize + "px");
      const valEl = document.getElementById('shortnoteSizeValue');
      if (valEl) valEl.textContent = shortnoteSize;
      
      // Recalculate margins for the new font size
      recalculateShortnoteMargins();
   }
});

function showLoader() { const l = document.getElementById('loader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('loader'); if (l) l.style.display = 'none'; }

function toggleShowTrans(show) {
   // Toggle Surah:Ayat meta visibility
   document.querySelectorAll(".trans-meta-translator").forEach(el => {
      el.style.display = show ? "" : "none";
   });
}

function toggleShowSurahAyat(show) {
   document.querySelectorAll('.trans-cell .cell-meta').forEach(el => {
      el.style.display = show ? 'inline' : 'none';
   });
}

// Handle both checkboxes for translator visibility
// Handle Surah:Ayat meta visibility
document.getElementById("hideSurahAyat")?.addEventListener("change", function () {
   const showMeta = this.checked;
   toggleShowSurahAyat(showMeta);
});
document.getElementById("showTranslator")?.addEventListener("change", function () {
   showTranslator = this.checked;
   const settingsCheckbox = document.getElementById("showTranslatorSettings");
   if (settingsCheckbox) settingsCheckbox.checked = this.checked;
   toggleShowTrans(showTranslator);
});

document.getElementById("showTranslatorSettings")?.addEventListener("change", function () {
   showTranslator = this.checked;
   const mainCheckbox = document.getElementById("showTranslator");
   if (mainCheckbox) mainCheckbox.checked = this.checked;
   toggleShowTrans(showTranslator);
});

// Arabic font style selection
document.getElementById("arabicFontStyle")?.addEventListener("change", function () {
   arabicFontStyle = this.value;
   updateArabicFontStyle();
   // Save font preference
   localStorage.setItem('arabicFontStyle', arabicFontStyle);
});

// Notes display mode selection
document.getElementById("notesDisplayMode")?.addEventListener("change", function () {
   // Save notes display preference
   localStorage.setItem('notesDisplayMode', this.value);
   // Apply display mode changes immediately
   updateNoteDisplayMode();
});

// Function to update note display mode live
function updateNoteDisplayMode() {
   const notesDisplayMode = localStorage.getItem('notesDisplayMode') || 'superscript';
   const noteIconSize = localStorage.getItem('noteIconSize') || '60';
   const noteIconSpacing = localStorage.getItem('noteIconSpacing') || '-3';
   const noteIconVerticalSpacing = localStorage.getItem('noteIconVerticalSpacing') || '0';

   if (notesDisplayMode === 'superscript') {
      // Convert inline notes to superscript
      const inlineNotes = document.querySelectorAll('.note-icon');
      inlineNotes.forEach(noteIcon => {
         const noteText = noteIcon.getAttribute('data-notetext');
         const parentChar = noteIcon.parentElement;

         // Remove the inline note
         noteIcon.remove();

         // Create superscript note
         const noteSpan = document.createElement("span");
         noteSpan.className = "note-superscript";
         noteSpan.textContent = noteIcon.textContent; // Keep the same icon
         noteSpan.style.position = "absolute";
         noteSpan.style.top = "-1.2em";
         noteSpan.style.left = "0";
         noteSpan.style.width = "max-content";
         noteSpan.style.pointerEvents = "auto";
         noteSpan.style.background = "transparent";
         noteSpan.style.fontSize = noteIconSize + "%";
         noteSpan.style.zIndex = "2";
         noteSpan.style.cursor = "pointer";
         noteSpan.style.marginLeft = noteIconSpacing + "px";
         noteSpan.style.marginRight = noteIconSpacing + "px";
         noteSpan.style.marginTop = noteIconVerticalSpacing + "px";
         noteSpan.style.marginBottom = noteIconVerticalSpacing + "px";
         noteSpan.setAttribute("data-notetext", noteText);

         parentChar.style.position = "relative";
         parentChar.appendChild(noteSpan);
      });
   } else {
      // Convert superscript notes to inline
      const superscriptNotes = document.querySelectorAll('.note-superscript');
      superscriptNotes.forEach(noteSpan => {
         const noteText = noteSpan.getAttribute('data-notetext');
         const parentChar = noteSpan.parentElement;

         // Remove the superscript note
         noteSpan.remove();

         // Create inline note
         const noteIcon = document.createElement("span");
         noteIcon.className = "note-icon";
         noteIcon.textContent = noteSpan.textContent; // Keep the same icon
         noteIcon.setAttribute("data-notetext", noteText);
         noteIcon.style.fontSize = noteIconSize + "%";
         noteIcon.style.top = "-1.2em";
         noteIcon.style.marginLeft = noteIconSpacing + "px";
         noteIcon.style.marginRight = noteIconSpacing + "px";
         noteIcon.style.marginTop = noteIconVerticalSpacing + "px";
         noteIcon.style.marginBottom = noteIconVerticalSpacing + "px";

         parentChar.appendChild(noteIcon);
      });
   }
}

// Note icon size control
document.getElementById("noteIconSize")?.addEventListener("input", function () {
   // Update display value
   document.getElementById("noteIconSizeValue").textContent = this.value + "%";
   // Save preference
   localStorage.setItem('noteIconSize', this.value);
   // Apply changes immediately to existing note icons
   updateNoteIconsLive();
});

// Note icon spacing control
document.getElementById("noteIconSpacing")?.addEventListener("input", function () {
   // Update display value
   document.getElementById("noteIconSpacingValue").textContent = this.value + "px";
   // Save preference
   localStorage.setItem('noteIconSpacing', this.value);
   // Apply changes immediately to existing note icons
   updateNoteIconsLive();
});

// Note icon vertical spacing control
document.getElementById("noteIconVerticalSpacing")?.addEventListener("input", function () {
   // Update display value
   document.getElementById("noteIconVerticalSpacingValue").textContent = this.value + "px";
   // Save preference
   localStorage.setItem('noteIconVerticalSpacing', this.value);
   // Apply changes immediately to existing note icons
   updateNoteIconsLive();
});

// Function to update note icons live without page reload
function updateNoteIconsLive() {
   const noteIconSize = localStorage.getItem('noteIconSize') || '60';
   const noteIconSpacing = localStorage.getItem('noteIconSpacing') || '-3';
   const noteIconVerticalSpacing = localStorage.getItem('noteIconVerticalSpacing') || '0';

   // Update all note icons (inline mode)
   const noteIcons = document.querySelectorAll('.note-icon');
   noteIcons.forEach(icon => {
      icon.style.fontSize = noteIconSize + "%";
      icon.style.marginLeft = noteIconSpacing + "px";
      icon.style.marginRight = noteIconSpacing + "px";
      icon.style.marginTop = noteIconVerticalSpacing + "px";
      icon.style.marginBottom = noteIconVerticalSpacing + "px";
   });

   // Update all note superscripts (superscript mode)
   const noteSuperscripts = document.querySelectorAll('.note-superscript');
   noteSuperscripts.forEach(note => {
      note.style.fontSize = noteIconSize + "%";
      note.style.marginLeft = noteIconSpacing + "px";
      note.style.marginRight = noteIconSpacing + "px";
      note.style.marginTop = noteIconVerticalSpacing + "px";
      note.style.marginBottom = noteIconVerticalSpacing + "px";
   });
}

function updateArabicFontStyle() {
   // Remove existing font classes from body
   document.body.classList.remove('font-uthmani', 'font-indo-pak');

   // Add the appropriate font class to body
   const fontClass = arabicFontStyle === 'indo-pak' ? 'font-indo-pak' : 'font-uthmani';
   document.body.classList.add(fontClass);
}

function initSettings() {
   // Load saved font style preference
   const savedFontStyle = localStorage.getItem('arabicFontStyle');
   if (savedFontStyle && (savedFontStyle === 'uthmani' || savedFontStyle === 'indo-pak')) {
      arabicFontStyle = savedFontStyle;
      const fontSelect = document.getElementById("arabicFontStyle");
      if (fontSelect) {
         fontSelect.value = arabicFontStyle;
      }
   }

   // Apply the font style
   updateArabicFontStyle();

   // Load saved notes display mode preference
   const savedNotesDisplayMode = localStorage.getItem('notesDisplayMode') || 'superscript';
   const notesDisplaySelect = document.getElementById("notesDisplayMode");
   if (notesDisplaySelect) {
      notesDisplaySelect.value = savedNotesDisplayMode;
   }

   // Load saved note icon size preference
   const savedNoteIconSize = localStorage.getItem('noteIconSize') || '60';
   const noteIconSizeSlider = document.getElementById("noteIconSize");
   const noteIconSizeValue = document.getElementById("noteIconSizeValue");
   if (noteIconSizeSlider && noteIconSizeValue) {
      noteIconSizeSlider.value = savedNoteIconSize;
      noteIconSizeValue.textContent = savedNoteIconSize + "%";
   }

   // Load saved note icon spacing preference
   const savedNoteIconSpacing = localStorage.getItem('noteIconSpacing') || '-3';
   const noteIconSpacingSlider = document.getElementById("noteIconSpacing");
   const noteIconSpacingValue = document.getElementById("noteIconSpacingValue");
   if (noteIconSpacingSlider && noteIconSpacingValue) {
      noteIconSpacingSlider.value = savedNoteIconSpacing;
      noteIconSpacingValue.textContent = savedNoteIconSpacing + "px";
   }

   // Load saved note icon vertical spacing preference
   const savedNoteIconVerticalSpacing = localStorage.getItem('noteIconVerticalSpacing') || '0';
   const noteIconVerticalSpacingSlider = document.getElementById("noteIconVerticalSpacing");
   const noteIconVerticalSpacingValue = document.getElementById("noteIconVerticalSpacingValue");
   if (noteIconVerticalSpacingSlider && noteIconVerticalSpacingValue) {
      noteIconVerticalSpacingSlider.value = savedNoteIconVerticalSpacing;
      noteIconVerticalSpacingValue.textContent = savedNoteIconVerticalSpacing + "px";
   }
}

// Populate surah dropdown
function populateSurahDropdown(surahs) {
   const dropdown = document.getElementById("surahDropdown");
   if (!dropdown) return;

   dropdown.innerHTML = '<option value="">Select Surah (Chapter)</option>';
   surahs.forEach(s => {
      const option = document.createElement("option");
      option.value = s.SurahNumber;
      // Match format used in hamburger menu (renderSurahs function)
      option.textContent = `${s.SurahNumber} ${s.SurahNameTransliteration} (${s.SurahNameArabic}) ${s.SurahNameEnglish || ''}`;
      dropdown.appendChild(option);
   });

   dropdown.onchange = function () {
      const surahNum = this.value;
      if (surahNum) {
         loadSurah(surahNum, 1);
      }
   };
}

// Dual Word Settings Management
function isMobileDevice() {
   return window.innerWidth <= 768;
}

function getMobileDefaults() {
   return {
      direction: 'column',
      alignment: 'center',
      margin: 0,
      padding: 0,
      gap: 0,
      topFontSize: 1,
      bottomFontSize: 0.7,
      lineHeight: 1,
      letterSpacing: 0,
      topOffset: 5,
      bottomOffset: -4
   };
}

function getDesktopDefaults() {
   return {
      direction: 'column',
      alignment: 'center',
      margin: 0,
      padding: 0,
      gap: 0,
      topFontSize: 1,
      bottomFontSize: 0.7,
      lineHeight: 0,
      letterSpacing: 0,
      topOffset: 5,
      bottomOffset: 10
   };
}

function getDefaultDualWordSettings() {
   const isMobile = isMobileDevice();
   return isMobile ? getMobileDefaults() : getDesktopDefaults();
}

function settingsMatchDefaults(current, defaults) {
   const keys = Object.keys(defaults);
   const matches = keys.every(key => {
      const match = current[key] === defaults[key];
      return match;
   });
   return matches;
}

let dualWordSettings = getDefaultDualWordSettings();
let userHasCustomizedSettings = false;

function initDualWordControls() {
   const controls = [
      // 'dualWordDirection', 'dualWordAlignment', 'dualWordMargin', 'dualWordPadding',
      // 'dualWordGap', 'topWordFontSize', 'bottomWordFontSize', 'dualWordLineHeight',
      // 'dualWordLetterSpacing', 'topWordOffset', 'bottomWordOffset'
      'topWordFontSize', 'bottomWordFontSize', 'topWordOffset', 'bottomWordOffset'
   ];

   controls.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
         element.addEventListener('input', () => {
            userHasCustomizedSettings = true;
            applyDualWordSettings();
         });
         element.addEventListener('change', () => {
            userHasCustomizedSettings = true;
            applyDualWordSettings();
         });
      }
   });

   // Reset button
   document.getElementById('resetDualWordSettings')?.addEventListener('click', resetDualWordSettings);

   // Handle window resize to update defaults when switching between mobile/desktop
   let resizeTimer;
   let currentScreenType = isMobileDevice() ? 'mobile' : 'desktop';

   window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
         const newScreenType = isMobileDevice() ? 'mobile' : 'desktop';


         // Update if screen type changed and user hasn't customized settings
         if (newScreenType !== currentScreenType && !userHasCustomizedSettings) {
            currentScreenType = newScreenType;

            // Get new defaults and update
            const newDefaults = getDefaultDualWordSettings();
            dualWordSettings = newDefaults;

            // Update form controls
            Object.keys(newDefaults).forEach(key => {
               const elementMap = {
                  // direction: 'dualWordDirection',
                  // alignment: 'dualWordAlignment',
                  // margin: 'dualWordMargin',
                  // padding: 'dualWordPadding',
                  // gap: 'dualWordGap',
                  topFontSize: 'topWordFontSize',
                  bottomFontSize: 'bottomWordFontSize',
                  // lineHeight: 'dualWordLineHeight',
                  // letterSpacing: 'dualWordLetterSpacing',
                  topOffset: 'topWordOffset',
                  bottomOffset: 'bottomWordOffset'
               };

               const elementId = elementMap[key];
               if (elementId) {
                  const element = document.getElementById(elementId);
                  if (element) {
                     element.value = newDefaults[key];
                  }
               }
            });

            applyDualWordSettings();
         }
      }, 250);
   });

   // Load saved settings or apply defaults
   loadDualWordSettings();
   applyDualWordSettings();
}

function applyDualWordSettings() {
   const defaults = getDefaultDualWordSettings();

   // const direction = document.getElementById('dualWordDirection')?.value || defaults.direction;
   // const alignment = document.getElementById('dualWordAlignment')?.value || defaults.alignment;
   // const margin = parseFloat(document.getElementById('dualWordMargin')?.value) || defaults.margin;
   // const padding = parseInt(document.getElementById('dualWordPadding')?.value) || defaults.padding;
   // const gap = parseFloat(document.getElementById('dualWordGap')?.value) || defaults.gap;
   const topFontSize = parseFloat(document.getElementById('topWordFontSize')?.value) || defaults.topFontSize;
   const bottomFontSize = parseFloat(document.getElementById('bottomWordFontSize')?.value) || defaults.bottomFontSize;
   // const lineHeight = parseFloat(document.getElementById('dualWordLineHeight')?.value) || defaults.lineHeight;
   // const letterSpacing = parseFloat(document.getElementById('dualWordLetterSpacing')?.value) || defaults.letterSpacing;
   const topOffset = parseInt(document.getElementById('topWordOffset')?.value) || defaults.topOffset;
   const bottomOffset = parseInt(document.getElementById('bottomWordOffset')?.value) || defaults.bottomOffset;
   
   // Use default values for commented out settings
   const direction = defaults.direction;
   const alignment = defaults.alignment;
   const margin = defaults.margin;
   const padding = defaults.padding;
   const gap = defaults.gap;
   const lineHeight = defaults.lineHeight;
   const letterSpacing = defaults.letterSpacing;

   // Update settings object
   dualWordSettings = {
      direction, alignment, margin, padding, gap, topFontSize, bottomFontSize,
      lineHeight, letterSpacing, topOffset, bottomOffset
   };

   // Apply to existing dual words
   document.querySelectorAll('.dual-word').forEach(el => {
      el.style.flexDirection = direction;
      el.style.alignItems = alignment;
      el.style.margin = `0 ${margin}em`;
      el.style.padding = `${padding}px`;
      el.style.gap = `${gap}em`;
   });

   document.querySelectorAll('.top-word').forEach(el => {
      el.style.fontSize = `${topFontSize}em`;
      el.style.lineHeight = lineHeight;
      el.style.letterSpacing = `${letterSpacing}em`;
      el.style.transform = `translateY(${topOffset}px)`;
   });

   document.querySelectorAll('.bottom-word').forEach(el => {
      el.style.fontSize = `${bottomFontSize}em`;
      el.style.lineHeight = lineHeight;
      el.style.letterSpacing = `${letterSpacing}em`;
      el.style.transform = `translateY(${bottomOffset}px)`;
   });

   // Save settings
   saveDualWordSettings();
}

function resetDualWordSettings() {
   const defaults = getDefaultDualWordSettings();

   // Update form controls
   // document.getElementById('dualWordDirection').value = defaults.direction;
   // document.getElementById('dualWordAlignment').value = defaults.alignment;
   // document.getElementById('dualWordMargin').value = defaults.margin;
   // document.getElementById('dualWordPadding').value = defaults.padding;
   // document.getElementById('dualWordGap').value = defaults.gap;
   document.getElementById('topWordFontSize').value = defaults.topFontSize;
   document.getElementById('bottomWordFontSize').value = defaults.bottomFontSize;
   // document.getElementById('dualWordLineHeight').value = defaults.lineHeight;
   // document.getElementById('dualWordLetterSpacing').value = defaults.letterSpacing;
   document.getElementById('topWordOffset').value = defaults.topOffset;
   document.getElementById('bottomWordOffset').value = defaults.bottomOffset;

   userHasCustomizedSettings = false;
   applyDualWordSettings();
}

function saveDualWordSettings() {
   localStorage.setItem('dualWordSettings', JSON.stringify(dualWordSettings));
}

// Temporary function for testing - can be called from console
function clearDualWordSettings() {
   localStorage.removeItem('dualWordSettings');
   userHasCustomizedSettings = false;
   dualWordSettings = getDefaultDualWordSettings();
   loadDualWordSettings();
   applyDualWordSettings();
}

// Make it globally available for testing
window.clearDualWordSettings = clearDualWordSettings;

function loadDualWordSettings() {
   try {
      const saved = localStorage.getItem('dualWordSettings');
      const defaults = getDefaultDualWordSettings();

      if (saved) {
         const settings = JSON.parse(saved);
         dualWordSettings = settings;

         // Check if saved settings match either mobile or desktop defaults
         const matchesMobile = settingsMatchDefaults(settings, getMobileDefaults());
         const matchesDesktop = settingsMatchDefaults(settings, getDesktopDefaults());
         const matchesAnyDefaults = matchesMobile || matchesDesktop;

         userHasCustomizedSettings = !matchesAnyDefaults;

      } else {
         dualWordSettings = defaults;
         userHasCustomizedSettings = false;
      }

      // Update form controls with loaded or default values
      // document.getElementById('dualWordDirection').value = dualWordSettings.direction;
      // document.getElementById('dualWordAlignment').value = dualWordSettings.alignment;
      // document.getElementById('dualWordMargin').value = dualWordSettings.margin;
      // document.getElementById('dualWordPadding').value = dualWordSettings.padding;
      // document.getElementById('dualWordGap').value = dualWordSettings.gap;
      document.getElementById('topWordFontSize').value = dualWordSettings.topFontSize;
      document.getElementById('bottomWordFontSize').value = dualWordSettings.bottomFontSize;
      // document.getElementById('dualWordLineHeight').value = dualWordSettings.lineHeight;
      // document.getElementById('dualWordLetterSpacing').value = dualWordSettings.letterSpacing;
      document.getElementById('topWordOffset').value = dualWordSettings.topOffset;
      document.getElementById('bottomWordOffset').value = dualWordSettings.bottomOffset;

   } catch (e) {
      // Fallback to defaults
      const defaults = getDefaultDualWordSettings();
      dualWordSettings = defaults;
      userHasCustomizedSettings = false;

      // Update form controls with defaults
      // document.getElementById('dualWordDirection').value = defaults.direction;
      // document.getElementById('dualWordAlignment').value = defaults.alignment;
      // document.getElementById('dualWordMargin').value = defaults.margin;
      // document.getElementById('dualWordPadding').value = defaults.padding;
      // document.getElementById('dualWordGap').value = defaults.gap;
      document.getElementById('topWordFontSize').value = defaults.topFontSize;
      document.getElementById('bottomWordFontSize').value = defaults.bottomFontSize;
      // document.getElementById('dualWordLineHeight').value = defaults.lineHeight;
      // document.getElementById('dualWordLetterSpacing').value = defaults.letterSpacing;
      document.getElementById('topWordOffset').value = defaults.topOffset;
      document.getElementById('bottomWordOffset').value = defaults.bottomOffset;
   }
}

// Initial load
init();
async function init() {
   showLoader();
   try {
      const [surahs, tags] = await Promise.all([getSurahs(), getUniqueTags()]);
      completeSurahList = surahs;
      populateSurahDropdown(surahs);
      renderSurahs(surahs);
      renderTags(tags);
      loadBookmarksPreview();
      initDualWordControls();
      initSettings();
      // Handle URL params ?surah=2&ayat=5
      const params = new URLSearchParams(location.search);
      const s = parseInt(params.get('surah')) || 1;
      const a = parseInt(params.get('ayat')) || 1;
      loadSurah(s, a);
   } catch (e) {
      console.error(e);
      alert("Failed to load initial data");
   } finally {
      hideLoader();
   }
}

// Event bindings - Updated for new dropdown
document.getElementById('gotoBtn')?.addEventListener('click', () => {
   const s = parseInt(document.getElementById('gotoSurah').value);
   const ayatValue = document.getElementById('gotoAyat').value;
   const a = ayatValue && ayatValue.trim() !== '' ? parseInt(ayatValue) : 1; // Default to Ayat 1 if empty
   
   if (isNaN(s) || s < 1 || s > 114) {
      alert('Surah should be between 1 and 114');
      return;
   }
   if (isNaN(a) || a < 1 || a > 286) {
      alert('Ayat should be between 1 and 286');
      return;
   }
   showLoader();
   loadSurah(s, a);
});

// Add Enter key support for Surah and Ayat input fields
['gotoSurah', 'gotoAyat'].forEach(id => {
   document.getElementById(id)?.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
         document.getElementById('gotoBtn')?.click();
      }
   });
});

document.getElementById('searchBtn')?.addEventListener('click', async () => {
   const q = document.getElementById('searchText').value?.trim();
   if (!q) {
      alert('Please enter a search term');
      return;
   }

   const isFullSearch = document.getElementById('fullSearch')?.checked || false;

   showLoader();
   try {
      const res = isFullSearch ? await searchTranslationsAndAnnotations(q) : await searchTranslations(q);
      if (res && res.length) {
         // Clear previous results and hide surah name
         readerRows.innerHTML = '';
         const surahNameEl = document.getElementById('surah-name-current');
         const resultsSection = document.getElementById('total-results-found');
         if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.innerHTML = '';
         }
         if (surahNameEl) surahNameEl.style.display = 'none';

         // Show search summary first
         const summaryEl = document.createElement('div');
         summaryEl.className = 'search-summary';
         summaryEl.style.cssText = 'background: var(--accent-light); padding: 12px; margin: 8px 0; border-radius: 8px; color: var(--accent); font-weight: 500;';
         let summaryText = '';
         if (isFullSearch) {
            summaryText = `Found ${res.length} Ayats matching "${q}" in Translation and Notes`;
         } else {
            summaryText = `Found ${res.length} Ayats matching "${q}" in Translation`;
         }
         console.log(summaryText)
         summaryEl.innerHTML = summaryText;
         resultsSection.appendChild(summaryEl);
         renderSearchResults(res);
      } else {
         alert(`No results found for "${q}"`);
      }
   } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
   } finally {
      hideLoader();
   }
});

// Add Enter key support for search input
document.getElementById('searchText')?.addEventListener('keypress', (e) => {
   if (e.key === 'Enter') {
      document.getElementById('searchBtn')?.click();
   }
});

document.getElementById('openBookmarks')?.addEventListener('click', () => {
   openBookmarksWindow(getBookmarks());
});

// Renderers
function renderSurahs(list) {
   const el = document.getElementById('surahList');
   if (!el) return;
   el.innerHTML = '';
   list.forEach(s => {
      const d = document.createElement('div');
      d.className = 'surah-item';
      d.textContent = `${s.SurahNumber} ${s.SurahNameTransliteration} (${s.SurahNameArabic}) ${s.SurahNameEnglish || ''}`;
      d.addEventListener('click', () => {
         showLoader();
         loadSurah(s.SurahNumber, 1);
      });
      el.appendChild(d);
   });
}

function showSurahName(surah) {
   const sInfo = completeSurahList?.find(s => parseInt(s.SurahNumber) === parseInt(surah));
   if (sInfo) {
      const resultsSection = document.getElementById('total-results-found');
      if (resultsSection) {
         resultsSection.style.display = 'none';
         resultsSection.innerHTML = '';
      }
      const el = document.getElementById("surah-name-current");
      if (el) {
         el.innerHTML = `${sInfo.SurahNumber}. ${sInfo.SurahNameTransliteration} (${sInfo.SurahNameArabic})<br>${sInfo.SurahNameEnglish || ''}`;
         el.style.display = 'block';
      }
   }
}

function renderTags(tags) {
   showLoader()
   const el = document.getElementById('tagList');
   if (!el) return;
   el.innerHTML = '';
   tags.forEach(t => {
      const b = document.createElement('button');
      b.className = 'tag';
      b.textContent = t;
      b.addEventListener('click', async () => {
         const list = await getAyatsByTag(t);
         if (!list || !list.length) {
            alert('No ayats found for tag');
            hideLoader();
            return;
         }
         // Group by Surah, sort Surahs and Ayats ascending
         const grouped = {};
         list.forEach(item => {
            const sNum = parseInt(item.SurahNumber);
            if (!grouped[sNum]) grouped[sNum] = [];
            grouped[sNum].push(item);
         });
         const surahNums = Object.keys(grouped).map(Number).sort((a, b) => a - b);
         // Clear previous results and render collapsible list, hide surah name
         readerRows.innerHTML = '';
         const surahNameEl = document.getElementById('surah-name-current');
         if (surahNameEl) surahNameEl.style.display = 'none';
         surahNums.forEach(surahNum => {
            const surahInfo = completeSurahList?.find(s => parseInt(s.SurahNumber) === surahNum);
            const surahName = surahInfo ? `${surahInfo.SurahNumber}. ${surahInfo.SurahNameTransliteration} (${surahInfo.SurahNameEnglish || surahInfo.SurahNameArabic})` : `Surah ${surahNum}`;
            const header = document.createElement('div');
            header.className = 'surah-header collapsible collapsed';
            header.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border); padding: 12px 16px; margin: 8px 0; border-radius: 8px; cursor: pointer; font-weight: 600; color: var(--accent); display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;';
            header.innerHTML = `<span>${surahName}<small style="color: var(--text-secondary); font-weight: normal; margin-left: 8px;">${grouped[surahNum].length} Ayats</small></span><span style='transition: transform 0.2s ease; transform: rotate(-90deg);'>▼</span>`;
            const content = document.createElement('div');
            content.className = 'surah-content';
            content.style.cssText = 'display: none; margin-bottom: 16px;';
            header.addEventListener('click', async () => {
               const isCollapsed = header.classList.contains('collapsed');
               if (isCollapsed) {
                  header.classList.remove('collapsed');
                  content.style.display = 'block';
                  header.querySelector('span:last-child').style.transform = 'rotate(0deg)';
                  if (content.children.length === 0) {
                     // Sort ayats ascending
                     const ayats = grouped[surahNum].sort((a, b) => parseInt(a.AyatNumber) - parseInt(b.AyatNumber));
                     // Fetch Arabic and translation for this Surah
                     const arabicData = await getQuranBySurah(surahNum);
                     const arabicMap = {};
                     (arabicData || []).forEach(a => { arabicMap[parseInt(a.index2)] = a; });
                     const translations = await getTranslationsBySurah(surahNum);
                     const transMap = {};
                     (translations || []).forEach(t => { transMap[parseInt(t.AyatNumber)] = t; });
                     for (const r of ayats) {
                        const ayahNum = parseInt(r.AyatNumber);
                        const arabic = arabicMap[ayahNum];
                        const tr = transMap[ayahNum];
                        // Helper function to convert numbers to Arabic-Indic numerals
                        function toArabicNumerals(num) {
                           const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                           return String(num).split('').map(d => arabicDigits[parseInt(d, 10)] ?? d).join('');
                        }

                        // Prepare annotation data for this ayah
                        const anns = await getAnnotationsBySurah(surahNum);
                        const annsForAyah = anns.filter(ann => parseInt(ann.AyatNumber) === ayahNum);

                        const row = document.createElement('div');
                        row.className = 'ayah-row card-simple';
                        row.dataset.ayat = ayahNum;
                        row.style.margin = '8px 0';

                        // Arabic cell
                        const arabicCell = document.createElement('div');
                        arabicCell.className = 'arabic-cell';
                        arabicCell.innerHTML =
                           '<div class="cell-meta"></div>' +
                           '<div class="arabic-text">' +
                           (arabic ? escapeHtml(arabic.text) : '<i style="color:#9ca3af">[Arabic not loaded]</i>') +
                           '<span class="ayat-number-ar" style="margin-right: 12px;">' +
                           '<span class="marker-calligraphy ayat-number-ar">۝</span>' +
                           toArabicNumerals(ayahNum) +
                           '</span>' +
                           '</div>';

                        // Translation cell
                        const transCell = document.createElement('div');
                        transCell.className = 'trans-cell';
                        const metaText = (tr ? (tr.SurahNumber + ':' + tr.AyatNumber) : (surahNum + ':' + ayahNum));
                        let transHtml = tr ? (tr.AyatTranslationText || '') : '';
                        transHtml = await applyAnnotationsToText(transHtml, annsForAyah);
                        const showMeta = document.getElementById('hideSurahAyat')?.checked !== false;
                        transCell.innerHTML =
                           '<div class="trans-text">' +
                           (showMeta ? '<span class="cell-meta">' + metaText + '</span> ' : '') +
                           (transHtml || '<i style="color:#9ca3af">[No translation found]</i>') +
                           (tr && tr.Translator ? ' <span class="trans-meta-translator">(' + tr.Translator + ')</span>' : '') +
                           '</div>';

                        // Add navigation controls similar to search results
                        const navControls = document.createElement('div');
                        navControls.className = 'search-nav-controls';
                        navControls.style.cssText = 'margin-top: 8px; display: flex; gap: 8px; align-items: center;';
                        
                        const gotoBtn = document.createElement('button');
                        gotoBtn.className = 'goto-btn';
                        gotoBtn.innerHTML = '→ Go to ' + surahNum + ':' + ayahNum;
                        gotoBtn.style.cssText = 'background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;';
                        gotoBtn.onclick = (e) => {
                           e.stopPropagation();
                           loadSurah(surahNum, ayahNum);
                        };
                        
                        const newWindowBtn = document.createElement('button');
                        newWindowBtn.className = 'new-window-btn';
                        newWindowBtn.innerHTML = '↗ New Window';
                        newWindowBtn.style.cssText = 'background: var(--card-bg); color: var(--text); border: 1px solid var(--border); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;';
                        newWindowBtn.onclick = (e) => {
                           e.stopPropagation();
                           const url = new URL(window.location);
                           url.searchParams.set('surah', surahNum);
                           url.searchParams.set('ayat', ayahNum);
                           window.open(url.toString(), '_blank');
                        };
                        
                        navControls.appendChild(gotoBtn);
                        navControls.appendChild(newWindowBtn);
                        transCell.appendChild(navControls);

                        row.appendChild(arabicCell);
                        row.appendChild(transCell);
                        content.appendChild(row);
                     }
                  }
               } else {
                  header.classList.add('collapsed');
                  content.style.display = 'none';
                  header.querySelector('span:last-child').style.transform = 'rotate(-90deg)';
               }
            });
            readerRows.appendChild(header);
            readerRows.appendChild(content);
            hideLoader();
         });
      });
      el.appendChild(b);
   });
}

function openBookmarksWindow(obj) {
   const w = window.open('', '_blank', 'width=600,height=600,scrollbars=1');
   w.document.title = 'Bookmarks';
   w.document.body.innerHTML = '<pre>' + JSON.stringify(obj, null, 2) + '</pre>';
}

function isInsideTag(s, idx) {
   const lt = s.lastIndexOf('<', idx);
   const gt = s.lastIndexOf('>', idx);
   return lt > gt; // last '<' is after last '>'
}

// move index out of any tag; dir = +1 (forward) or -1 (backward)
function moveOutsideTag(s, idx, dir) {
   let i = Math.max(0, Math.min(idx, s.length));
   while (i >= 0 && i < s.length && isInsideTag(s, i)) {
      if (dir >= 0) {
         const next = s.indexOf('>', i);
         if (next === -1) return s.length;
         i = next + 1;
      } else {
         const prev = s.lastIndexOf('<', i);
         if (prev === -1) return 0;
         i = prev; // land on '<'
         // step back once more so we're before the '<'
         i = Math.max(0, i - 1);
      }
   }
   return i;
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }



const escapeHtml = (str) => {
   return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
};



const getIconForAnnotationType = async (type) => {
   // Ensure typeLookupData is loaded
   if (!typeLookupData || typeLookupData.length === 0) {
      await getTypeLookup();
   }
   const obj = typeLookupData.filter(t => t.NoteType === type)[0];
   return obj ? (obj.Icon || "📝") : "📝";
}

// Get the title for a NoteType from typelookup
const getTitleForAnnotationType = async (type) => {
   // Ensure typeLookupData is loaded
   if (!typeLookupData || typeLookupData.length === 0) {
      await getTypeLookup();
   }
   const obj = typeLookupData.filter(t => t.NoteType === type)[0];
   console.log({ obj })
   return obj ? (obj.NoteType || type || "Note") : (type || "Note");
}

// Improved annotation renderer
async function applyAnnotationsToText(text, annotations) {
   const container = document.createElement("div");
   container.innerHTML = "";
   const skipIndices = new Set();

   // Separate arrays for annotation types
   const notes = [];
   const fontStyles = [];
   const highlightStyles = [];
   const underlineStyles = [];
   const dualWords = [];

   // Fill arrays from annotations input
   for (const a of annotations) {
      switch (a.AnnotationType) {
         case "Notes":
            // Position notes at EndIndex
            notes.push({
               position: a.EndIndex,
               text: a.NoteTextHTML,
               size: parseInt(localStorage.getItem('noteIconSize') || 60),
               type: a.AnnotationType,
               offset: 1.2,
               icon: await getIconForAnnotationType(a.NoteType),
               noteTitle: await getTitleForAnnotationType(a.NoteType)
            });


            // For range notes (different Start and End Index), add underline from Start to End
            if (a.StartIndex && a.EndIndex && parseInt(a.StartIndex) !== parseInt(a.EndIndex)) {
               underlineStyles.push({
                  start: a.StartIndex,
                  end: a.EndIndex,
                  color: "#007acc", // Default note underline color
               });
            }
            break;
         case "ShortNote":
            // Position short notes at EndIndex
            notes.push({
               position: a.EndIndex,
               text: a.ShortNoteText,
               size: 70,
               type: a.AnnotationType,
               offset: 1.2,
               icon: ""
            });

            // For range short notes, add underline from Start to End
            if (a.StartIndex && a.EndIndex && parseInt(a.StartIndex) !== parseInt(a.EndIndex)) {
               underlineStyles.push({
                  start: a.StartIndex,
                  end: a.EndIndex,
                  color: "#007acc", // Default note underline color
               });
            }
            break;
         case "Font colour":
            fontStyles.push({
               start: a.StartIndex,
               end: a.EndIndex,
               color: a.Colour,
            });
            break;
         case "Highlight":
            highlightStyles.push({
               start: a.StartIndex,
               end: a.EndIndex,
               color: a.Colour,
            });
            break;
         case "Underline":
            underlineStyles.push({
               start: a.StartIndex,
               end: a.EndIndex,
               color: a.Colour,
            });
            break;
         case "Parallel": // Dual-word
            dualWords.push({
               start: a.StartIndex,
               end: a.EndIndex,
               bottomWord: a.ParallelText,
               topSize: a.TopSize ? parseInt(a.TopSize, 10) : 100,
               bottomSize: a.BottomSize ? parseInt(a.BottomSize, 10) : 80,
               spacing: a.Spacing ? parseInt(a.Spacing, 10) : 5,
            });
            break;
      }
   }

   // Build character-by-character annotated DOM
   for (let i = 0; i < text.length; i++) {
      if (skipIndices.has(i)) continue;

      // 🔹 Dual word injection (from your working snippet)
      const dual = dualWords.find(dw => i === dw.start);
      if (dual) {
         const topWord = text.slice(dual.start, dual.end + 1);
         const dualSpan = document.createElement("span");
         dualSpan.className = "dual-word";

         // Apply current dual word settings
         dualSpan.style.flexDirection = dualWordSettings.direction;
         dualSpan.style.alignItems = dualWordSettings.alignment;
         dualSpan.style.margin = `0 ${dualWordSettings.margin}em`;
         dualSpan.style.padding = `${dualWordSettings.padding}px`;
         dualSpan.style.gap = `${dualWordSettings.gap}em`;

         const topSpan = document.createElement("span");
         topSpan.className = "top-word";
         topSpan.style.fontSize = `${dualWordSettings.topFontSize}em`;
         topSpan.style.lineHeight = dualWordSettings.lineHeight;
         topSpan.style.letterSpacing = `${dualWordSettings.letterSpacing}em`;
         topSpan.style.transform = `translateY(${dualWordSettings.topOffset}px)`;

         for (let k = 0; k < topWord.length; k++) {
            const charSpan = document.createElement("span");
            charSpan.className = "styled-char";
            charSpan.textContent = topWord[k];
            charSpan.dataset.index = dual.start + k;
            topSpan.appendChild(charSpan);
            skipIndices.add(dual.start + k);
         }

         const bottomSpan = document.createElement("span");
         bottomSpan.className = "bottom-word";
         bottomSpan.style.fontSize = `${dualWordSettings.bottomFontSize}em`;
         bottomSpan.style.lineHeight = dualWordSettings.lineHeight;
         bottomSpan.style.letterSpacing = `${dualWordSettings.letterSpacing}em`;
         bottomSpan.style.transform = `translateY(${dualWordSettings.bottomOffset}px)`;
         bottomSpan.textContent = dual.bottomWord;

         dualSpan.appendChild(topSpan);
         dualSpan.appendChild(bottomSpan);
         container.appendChild(dualSpan);
         continue;
      }

      // 🔹 Normal characters
      const span = document.createElement("span");
      span.className = "styled-char";
      span.textContent = text[i];
      span.dataset.index = i;
      container.appendChild(span);
   }

   // 🔹 Apply font colors
   fontStyles.forEach(style => {
      for (let i = style.start; i <= style.end; i++) {
         const span = container.querySelector(`[data-index='${i}']`);
         if (span) span.style.color = `#${style.color}`;
      }
   });

   // 🔹 Apply highlights
   highlightStyles.forEach(style => {
      for (let i = style.start; i <= style.end; i++) {
         const span = container.querySelector(`[data-index='${i}']`);
         if (span) span.style.backgroundColor = `#${style.color}`;
      }
   });

   // 🔹 Apply underline
   underlineStyles.forEach(style => {
      for (let i = style.start; i <= style.end; i++) {
         const span = container.querySelector(`[data-index='${i}']`);
         if (span) {
            span.style.textDecoration = "underline";
            span.style.textDecorationColor = `#${style.color}`;
         }
      }
   });

   // 🔹 Apply notes
   const notesDisplayMode = localStorage.getItem('notesDisplayMode') || 'superscript';

   notes.forEach(note => {
      const charSpan = container.querySelector(`[data-index='${note.position}']`);
      if (charSpan) {
         if (note.type === "ShortNote" || notesDisplayMode === "superscript") {
            if (note.type === "ShortNote") {
               // For ShortNote: Use absolute positioning like note icons
               const noteIconSpacing = parseFloat(localStorage.getItem('noteIconSpacing') || -3);
               const noteIconVerticalSpacing = parseFloat(localStorage.getItem('noteIconVerticalSpacing') || 0);
               const noteSpan = document.createElement("span");
               noteSpan.className = "short-note-superscript";
               noteSpan.textContent = note.text;
               noteSpan.style.position = "absolute";
               noteSpan.style.top = "-1.2em";
               noteSpan.style.left = "0";
               noteSpan.style.width = "max-content";
               noteSpan.style.pointerEvents = "auto";
               noteSpan.style.background = "transparent";
               noteSpan.style.fontSize = shortnoteSize + "px";
               noteSpan.style.color = "black";
               noteSpan.style.fontStyle = "normal";
               noteSpan.style.zIndex = "2";
               noteSpan.style.cursor = "pointer";
               noteSpan.style.marginLeft = noteIconSpacing + "px";
               noteSpan.style.marginRight = noteIconSpacing + "px";
               noteSpan.style.marginTop = noteIconVerticalSpacing + "px";
               noteSpan.style.marginBottom = noteIconVerticalSpacing + "px";
               noteSpan.setAttribute("data-notetext", note.text);
               noteSpan.setAttribute("data-notetype", note.noteTitle || "ShortNote");

               charSpan.style.position = "relative";
               charSpan.appendChild(noteSpan);
            } else {
               // For regular notes in superscript mode: keep original behavior
               const noteIconSpacing = parseFloat(localStorage.getItem('noteIconSpacing') || -3);
               const noteIconVerticalSpacing = parseFloat(localStorage.getItem('noteIconVerticalSpacing') || 0);
               const noteSpan = document.createElement("span");
               noteSpan.className = "note-superscript";
               noteSpan.textContent = note.icon;
               noteSpan.style.position = "absolute";
               noteSpan.style.top = "-1.2em";
               noteSpan.style.left = "0";
               noteSpan.style.width = "max-content";
               noteSpan.style.pointerEvents = "auto";
               noteSpan.style.background = "transparent";
               noteSpan.style.fontSize = note.size + "%";
               noteSpan.style.zIndex = "2";
               noteSpan.style.cursor = "pointer";
               noteSpan.style.marginLeft = noteIconSpacing + "px";
               noteSpan.style.marginRight = noteIconSpacing + "px";
               noteSpan.style.marginTop = noteIconVerticalSpacing + "px";
               noteSpan.style.marginBottom = noteIconVerticalSpacing + "px";
               noteSpan.setAttribute("data-notetext", note.text);
               noteSpan.setAttribute("data-notetype", note.noteTitle || "Note");

               charSpan.style.position = "relative";
               charSpan.appendChild(noteSpan);
            }
         } else {
            // Inline mode - original behavior for Notes
            const noteIconSpacing = parseFloat(localStorage.getItem('noteIconSpacing') || -3);
            const noteIconVerticalSpacing = parseFloat(localStorage.getItem('noteIconVerticalSpacing') || 0);
            const noteSpan = document.createElement("span");
            noteSpan.className = "note-icon";
            noteSpan.textContent = note.icon;
            noteSpan.setAttribute("data-notetext", note.text);
            noteSpan.setAttribute("data-notetype", note.noteTitle || "Note");
            noteSpan.style.fontSize = note.size + "%";
            noteSpan.style.top = `-${note.offset}em`;
            noteSpan.style.marginLeft = noteIconSpacing + "px";
            noteSpan.style.marginRight = noteIconSpacing + "px";
            noteSpan.style.marginTop = noteIconVerticalSpacing + "px";
            noteSpan.style.marginBottom = noteIconVerticalSpacing + "px";
            charSpan.appendChild(noteSpan);
         }
      }
   });

   return container.innerHTML;
}



// Dialog logic for notes - Updated to use the modal from HTML and support HTML content
async function openNoteDialog(title, content) {
   const modal = document.getElementById('noteModal');
   const modalTitle = document.getElementById('noteModalTitle');
   const modalBody = document.getElementById('noteModalBody');
   const modalClose = document.getElementById('noteModalClose');

   if (!modal || !modalTitle || !modalBody || !modalClose) return;

   modalTitle.textContent = title || 'Note';
   modalBody.innerHTML = content; // Allow HTML content
   
   // Reset modal size and position for new content
   const modalContentEl = document.getElementById('noteModalContent');
   if (modalContentEl) {
      // Reset to default size and position
      modalContentEl.style.width = '';
      modalContentEl.style.height = '';
      modalContentEl.style.left = '';
      modalContentEl.style.top = '';
      modalContentEl.style.transform = 'translate(-50%, -50%)';
      modalContentEl.style.position = 'absolute';
      // Re-enable default resize
      modalContentEl.style.resize = 'both';
   }
   
   modal.style.display = 'block';

   // Add handlers for surah/ayat and annotation links
   await addSurahAyatLinkHandlers(modalBody);

   // Close modal when clicking the X (desktop and mobile)
   const closeModal = () => modal.style.display = 'none';
   
   // Desktop click
   modalClose.onclick = closeModal;
   
   // Mobile touch events
   modalClose.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
   });
   
   modalClose.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
   });

   // Simple state tracking
   let isDragging = false;
   let isResizing = false;
   let startX, startY, startLeft, startTop;
   const modalContent = document.getElementById('noteModalContent');

   // Close modal when clicking outside (but not during interaction)
   modal.onclick = (e) => {
      if (e.target === modal && !isDragging && !isResizing) {
         modal.style.display = 'none';
      }
   };

   // Make modal draggable (desktop and mobile)
   const modalHeader = document.getElementById('noteModalHeader');
   if (modalHeader && modalContent) {
      
      // Mouse events for desktop
      modalHeader.addEventListener('mousedown', function (e) {
         isDragging = true;
         startX = e.clientX;
         startY = e.clientY;
         const rect = modalContent.getBoundingClientRect();
         startLeft = rect.left;
         startTop = rect.top;
         document.body.style.userSelect = 'none';
         e.preventDefault();
      });

      // Touch events for mobile
      modalHeader.addEventListener('touchstart', function (e) {
         isDragging = true;
         const touch = e.touches[0];
         startX = touch.clientX;
         startY = touch.clientY;
         const rect = modalContent.getBoundingClientRect();
         startLeft = rect.left;
         startTop = rect.top;
         document.body.style.userSelect = 'none';
         e.preventDefault();
      }, { passive: false });
   }

   // Mouse move for desktop
   document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      const newLeft = startLeft + e.clientX - startX;
      const newTop = startTop + e.clientY - startY;
      modalContent.style.left = newLeft + 'px';
      modalContent.style.top = newTop + 'px';
      modalContent.style.transform = 'none';
   });

   // Touch move for mobile
   document.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      const touch = e.touches[0];
      const newLeft = startLeft + touch.clientX - startX;
      const newTop = startTop + touch.clientY - startY;
      modalContent.style.left = newLeft + 'px';
      modalContent.style.top = newTop + 'px';
      modalContent.style.transform = 'none';
      e.preventDefault();
   }, { passive: false });

   // End dragging
   function stopDragging() {
      isDragging = false;
      document.body.style.userSelect = '';
   }

   document.addEventListener('mouseup', stopDragging);
   document.addEventListener('touchend', stopDragging);

   // Custom resize functionality for the blue area
   if (modalContent) {
      let isCustomResizing = false;
      let resizeStartX, resizeStartY, startWidth, startHeight;
      
      // Handle custom resize from anywhere in the blue area
      modalContent.addEventListener('mousedown', function(e) {
         const rect = modalContent.getBoundingClientRect();
         const resizeAreaSize = window.innerWidth <= 768 ? 50 : 30; // Match CSS sizes
         const isInResizeArea = e.clientX > rect.right - resizeAreaSize && e.clientY > rect.bottom - resizeAreaSize;
         
         if (isInResizeArea) {
            isResizing = true;
            isCustomResizing = true;
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            
            // Disable browser's default resize
            modalContent.style.resize = 'none';
            document.body.style.userSelect = 'none';
            e.stopPropagation();
            e.preventDefault();
         }
      });

      modalContent.addEventListener('touchstart', function(e) {
         const rect = modalContent.getBoundingClientRect();
         const touch = e.touches[0];
         const resizeAreaSize = window.innerWidth <= 768 ? 50 : 30;
         const isInResizeArea = touch.clientX > rect.right - resizeAreaSize && touch.clientY > rect.bottom - resizeAreaSize;
         
         if (isInResizeArea) {
            isResizing = true;
            isCustomResizing = true;
            resizeStartX = touch.clientX;
            resizeStartY = touch.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            
            modalContent.style.resize = 'none';
            document.body.style.userSelect = 'none';
            e.stopPropagation();
            e.preventDefault();
         }
      }, { passive: false });

      // Handle resize movement (mouse)
      document.addEventListener('mousemove', function(e) {
         if (!isCustomResizing) return;
         
         const newWidth = Math.max(280, startWidth + (e.clientX - resizeStartX));
         const newHeight = Math.max(120, startHeight + (e.clientY - resizeStartY));
         
         modalContent.style.width = newWidth + 'px';
         modalContent.style.height = newHeight + 'px';
         
         e.preventDefault();
      });

      // Handle resize movement (touch)
      document.addEventListener('touchmove', function(e) {
         if (!isCustomResizing) return;
         
         const touch = e.touches[0];
         const newWidth = Math.max(280, startWidth + (touch.clientX - resizeStartX));
         const newHeight = Math.max(120, startHeight + (touch.clientY - resizeStartY));
         
         modalContent.style.width = newWidth + 'px';
         modalContent.style.height = newHeight + 'px';
         
         e.preventDefault();
      }, { passive: false });

      // End custom resize
      function stopCustomResize() {
         if (isCustomResizing) {
            isCustomResizing = false;
            // Re-enable browser resize for fallback
            modalContent.style.resize = 'both';
            document.body.style.userSelect = '';
         }
         setTimeout(() => { isResizing = false; }, 100);
      }

      document.addEventListener('mouseup', stopCustomResize);
      document.addEventListener('touchend', stopCustomResize);
   }
}

// Helper function to load and display reference content
async function loadAndDisplayReference(element, surahNum, ayatNum, annotationId) {
   try {
      // Show loading state
      const originalText = element.textContent;
      element.textContent = 'Loading...';
      element.style.opacity = '0.6';

      let referenceContent = '';

      if (surahNum && ayatNum) {
         // Fetch surah and ayat translation
         const translations = await getTranslationsBySurah(surahNum);
         const translation = translations.find(t => parseInt(t.AyatNumber) === parseInt(ayatNum));

         if (translation) {
            referenceContent = `
               <div class="reference-content">
                  <h4>Surah ${surahNum}, Ayat ${ayatNum}</h4>
                  <p><strong>Translation:</strong> ${translation.AyatTranslationText}</p>
                  <p><strong>Translator:</strong> ${translation.Translator}</p>
               </div>
            `;
         } else {
            referenceContent = `<div class="reference-content"><p>Translation not found for Surah ${surahNum}, Ayat ${ayatNum}</p></div>`;
         }
      } else if (annotationId) {
         // Fetch annotation from all annotations (not just current surah)
         const annotations = await getAnnotationsBySurah(); // No surah parameter = get all annotations
         const annotation = annotations.find(a => a.AnnotationID == annotationId);
         if (annotation) {
            referenceContent = `
               <div class="reference-content">
                  <h4>Annotation #${annotationId}</h4>
                  <p><strong>Surah:</strong> ${annotation.SurahNumber}, <strong>Ayat:</strong> ${annotation.AyatNumber}</p>
                  <p><strong>Type:</strong> ${annotation.AnnotationType}</p>
                  <p><strong>Content:</strong> ${annotation.NoteTextHTML || annotation.ParallelText || 'No content'}</p>
               </div>
            `;
         } else {
            referenceContent = `<div class="reference-content"><p>Annotation #${annotationId} not found</p></div>`;
         }
      }

      // Check if content already exists to avoid duplicates
      const existingReference = element.nextElementSibling;
      if (existingReference && existingReference.classList.contains('reference-content-wrapper')) {
         return; // Content already loaded
      }

      // Insert the content after the link
      const referenceDiv = document.createElement('div');
      referenceDiv.innerHTML = referenceContent;
      referenceDiv.className = 'reference-content-wrapper';

      element.insertAdjacentElement('afterend', referenceDiv);

      // Restore original text
      element.textContent = originalText;
      element.style.opacity = '1';

   } catch (error) {
      console.error('Error loading reference:', error);
      element.textContent = element.textContent.replace('Loading...', 'Error loading');
      element.style.opacity = '1';
   }
}

// Add handlers for surah/ayat and annotation links in modal content
async function addSurahAyatLinkHandlers(container) {
   const links = container.querySelectorAll('a[data-surah], a[data-annotation-id]');

   for (const link of links) {
      const surahNum = link.getAttribute('data-surah');
      const ayatNum = link.getAttribute('data-ayat');
      const annotationId = link.getAttribute('data-annotation-id');
      const autoShow = link.getAttribute('data-auto-show') === 'true';

      // If auto-show is true, load content immediately
      if (autoShow) {
         await loadAndDisplayReference(link, surahNum, ayatNum, annotationId);
      } else {
         // Add click handler for manual loading
         link.addEventListener('click', async function (e) {
            e.preventDefault();
            await loadAndDisplayReference(this, surahNum, ayatNum, annotationId);
         });

         // Style the link to indicate it's clickable
         link.style.cursor = 'pointer';
         link.style.color = 'var(--accent)';
         link.style.textDecoration = 'underline';
      }
   }
}

// Attach click handler for note icons (delegated)
document.addEventListener('click', async function (ev) {
   const t = ev.target.closest('.note-icon, .note-superscript');
   if (t) {
      // Use noteTitle from data-notetitle, set by annotation renderer
      const noteTitle = t.getAttribute('data-notetype') || 'Note';
      const noteText = t.getAttribute('data-notetext') || '';
      await openNoteDialog(noteTitle, noteText);
      ev.stopPropagation();
   }
});


async function loadSurah(surah, focusAyat) {
   try {
      showLoader();
      showSurahName(surah);
      document._currentSurah = surah;
      document._focusAyat = focusAyat || 1;
      const [arabicData, translations, annotations, typeLookup] = await Promise.all([
         getQuranBySurah(surah),
         getTranslationsBySurah(surah),
         getAnnotationsBySurah(surah),
         getTypeLookup()
      ]);
      document._arabic = arabicData || [];
      document._translations = translations || [];
      document._annotations = annotations || [];
      document._typeLookup = typeLookup || [];
      await renderUnified();
   } catch (e) {
      console.error(e);
      alert("Failed to load surah");
   } finally {
      hideLoader();
   }
}

async function renderUnified() {
   const arabicList = document._arabic || [];
   const trList = document._translations || [];
   const annList = document._annotations || [];

   readerRows.innerHTML = '';

   const transMap = {};
   trList.forEach(t => { transMap[parseInt(t.AyatNumber)] = t; });

   const annMap = {};
   annList.forEach(a => {
      const n = parseInt(a.AyatNumber || 0);
      if (!annMap[n]) annMap[n] = [];
      annMap[n].push(a);
   });


   for (const r of arabicList) {
      if (r.bismillah !== "" && r.bismillah) {
         const bDiv = document.createElement('div');
         bDiv.className = 'card-simple bismillah';
         bDiv.style.textAlign = 'center';
         bDiv.style.margin = '8px 0';
         bDiv.innerHTML = r.bismillah;
         readerRows.appendChild(bDiv);
      }

      const ayahNum = parseInt(r.index2);
      const tr = transMap[ayahNum];
      const annsForAyah = annMap[ayahNum] || [];

      const row = document.createElement('div');
      row.className = 'ayah-row card-simple';
      row.dataset.ayat = ayahNum;

      const arabicCell = document.createElement('div');
      arabicCell.className = 'arabic-cell';
      arabicCell.innerHTML =
         '<div class="cell-meta"></div>' +
         '<div class="arabic-text">' +
         escapeHtml(r.text) +
         '<span class="ayat-number-ar" style="margin-right: 12px;">' + '<span class="marker-calligraphy ayat-number-ar">۝</span>' + toArabicNumerals(ayahNum) + '</span>' +
         '</div>'; // end of line marker

      // Helper function to convert numbers to Arabic-Indic numerals
      function toArabicNumerals(num) {
         const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
         return String(num).split('').map(d => arabicDigits[parseInt(d, 10)] ?? d).join('');
      }

      const transCell = document.createElement('div');
      transCell.className = 'trans-cell';
      const metaText = (tr ? (tr.SurahNumber + ':' + tr.AyatNumber) : (document._currentSurah + ':' + ayahNum));
      let transHtml = tr ? (tr.AyatTranslationText || '') : '';
      transHtml = await applyAnnotationsToText(transHtml, annsForAyah);
      const showMeta = document.getElementById('hideSurahAyat')?.checked !== false;
      transCell.innerHTML =
         '<div class="trans-text">' +
         (showMeta ? '<span class="cell-meta">' + metaText + '</span> ' : '') +
         (transHtml || '<i style="color:#9ca3af">[No translation found]</i>') +
         (tr && tr.Translator ? ' <span class="trans-meta-translator">(' + tr.Translator + ')</span>' : '') +
         '</div>';

      transCell.addEventListener('click', function (ev) {
         const t = ev.target.closest('.note-icon');
         if (t) {
            const raw = decodeURIComponent(t.getAttribute('data-notetext') || '');
            openNoteDialog('Note', raw);
         }
      });

      row.addEventListener('click', function (ev) {
         if (ev.target.closest('.note-icon')) return;
         // loadSurah(document._currentSurah, ayahNum);
      });

      row.appendChild(arabicCell);
      row.appendChild(transCell);
      readerRows.appendChild(row);
   }

   // Add Next Surah button at the end
   const currentSurahNum = parseInt(document._currentSurah);
   if (completeSurahList && currentSurahNum < 114) {
      const nextSurahNum = currentSurahNum + 1;
      const nextSurahInfo = completeSurahList.find(s => parseInt(s.SurahNumber) === nextSurahNum);
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn next-surah-btn';
      nextBtn.style.margin = '24px auto 16px auto';
      nextBtn.style.display = 'block';
      nextBtn.style.fontSize = '1.1em';
      nextBtn.textContent = `Next Surah (${nextSurahNum} ${nextSurahInfo ? nextSurahInfo.SurahNameTransliteration : ''}) →`;
      nextBtn.onclick = function () {
         loadSurah(nextSurahNum, 1);
      };
      readerRows.appendChild(nextBtn);
   }

   document.querySelectorAll('.arabic-cell').forEach(el => el.style.fontSize = arabicSize + "px");
   document.querySelectorAll('.trans-cell').forEach(el => el.style.fontSize = transSize + "px");
   toggleShowTrans(showTranslator);

   setTimeout(() => {
      const node = readerRows.querySelector('[data-ayat="' + (document._focusAyat || 1) + '"]');
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
   }, 60);
}

async function renderSearchResults(list) {
   readerRows.innerHTML = '';

   // Group results by Surah
   const bySurah = {};
   list.forEach(item => {
      const s = parseInt(item.SurahNumber);
      if (!bySurah[s]) bySurah[s] = [];
      bySurah[s].push(item);
   });

   // Sort Surahs in ascending order
   const surahIds = Object.keys(bySurah).map(Number).sort((a, b) => a - b);

   // Create hierarchical display
   for (const surahNum of surahIds) {
      const surahResults = bySurah[surahNum];
      const surahInfo = completeSurahList?.find(s => parseInt(s.SurahNumber) === surahNum);
      const surahName = surahInfo ?
         `${surahInfo.SurahNumber}. ${surahInfo.SurahNameTransliteration} (${surahInfo.SurahNameEnglish || surahInfo.SurahNameArabic})` :
         `Surah ${surahNum}`;

      // Create collapsible Surah header
      const surahHeader = document.createElement('div');
      surahHeader.className = 'surah-header collapsible collapsed';
      surahHeader.style.cssText = `
         background: var(--card-bg);
         border: 1px solid var(--border);
         padding: 12px 16px;
         margin: 8px 0;
         border-radius: 8px;
         cursor: pointer;
         font-weight: 600;
         color: var(--accent);
         display: flex;
         justify-content: space-between;
         align-items: center;
         transition: all 0.2s ease;
      `;

      const headerContent = document.createElement('div');
      headerContent.innerHTML = `
         <span>${surahName}</span>
         <small style="color: var(--text-secondary); font-weight: normal; margin-left: 8px;">${surahResults.length} Ayats</small>
      `;

      const chevron = document.createElement('span');
      chevron.innerHTML = '▼';
      chevron.style.cssText = 'transition: transform 0.2s ease; transform: rotate(-90deg);';

      surahHeader.appendChild(headerContent);
      surahHeader.appendChild(chevron);

      // Create collapsible content container
      const surahContent = document.createElement('div');
      surahContent.className = 'surah-content';
      surahContent.style.cssText = 'display: none; margin-bottom: 16px;';

      // Add click handler for collapsible
      surahHeader.addEventListener('click', () => {
         const isCollapsed = surahHeader.classList.contains('collapsed');
         if (isCollapsed) {
            surahHeader.classList.remove('collapsed');
            surahContent.style.display = 'block';
            chevron.style.transform = 'rotate(0deg)';
            // Load ayahs if not already loaded
            if (surahContent.children.length === 0) {
               loadSurahAyahs(surahNum, surahResults, surahContent);
            }
         } else {
            surahHeader.classList.add('collapsed');
            surahContent.style.display = 'none';
            chevron.style.transform = 'rotate(-90deg)';
         }
      });

      readerRows.appendChild(surahHeader);
      readerRows.appendChild(surahContent);
   }
}

// Helper function to load and display ayahs for a specific surah
async function loadSurahAyahs(surahNum, results, container) {
   console.log(results);
   try {
      const arabicData = await getQuranBySurah(surahNum);
      const arabicMap = {};
      (arabicData || []).forEach(a => { arabicMap[parseInt(a.index2)] = a; });

      // Fetch annotations for this surah
      const annotations = await getAnnotationsBySurah(surahNum);

      // Sort results by ayat number
      const sortedResults = results.sort((a, b) => parseInt(a.AyatNumber) - parseInt(b.AyatNumber));

      for (const r of sortedResults) {
         const ayahNum = parseInt(r.AyatNumber);
         const arabic = arabicMap[ayahNum];

         // Get annotations for this specific ayah
         const annsForAyah = annotations.filter(ann => parseInt(ann.AyatNumber) === ayahNum);

         const row = document.createElement('div');
         row.className = 'ayah-row card-simple';
         row.dataset.ayat = ayahNum;
         row.style.margin = '8px 0';

         const arabicCell = document.createElement('div');
         arabicCell.className = 'arabic-cell';
         arabicCell.innerHTML =
            '<div class="cell-meta"></div>' +
            '<div class="arabic-text">' +
            (arabic ? escapeHtml(arabic.text) : '<i style="color:#9ca3af">[Arabic not loaded]</i>') +
            '<span class="ayat-number-ar" style="margin-right: 12px;">' +
            '<span class="marker-calligraphy ayat-number-ar">۝</span>' +
            toArabicNumerals(ayahNum) +
            '</span>' +
            '</div>'; // end of line marker

         // Helper function to convert numbers to Arabic-Indic numerals
         function toArabicNumerals(num) {
            const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return String(num).split('').map(d => arabicDigits[parseInt(d, 10)] ?? d).join('');
         }

         const transCell = document.createElement('div');
         transCell.className = 'trans-cell';

         // Add match type indicator
         const matchTypeHTML = r.matchType ? `<span class="match-type" style="background: var(--accent-light); color: var(--accent); padding: 2px 6px; border-radius: 12px; font-size: 0.8em; margin-left: 8px;">${r.matchType}</span>` : '';

         // Apply annotations to translation text
         let translationWithAnnotations = r.AyatTranslationText || '';
         translationWithAnnotations = await applyAnnotationsToText(translationWithAnnotations, annsForAyah);

         transCell.innerHTML =
            '<div class="trans-text">' +
            '<span class="cell-meta">' + surahNum + ':' + ayahNum + matchTypeHTML + '</span> ' +
            (translationWithAnnotations || '<i style="color:#9ca3af">[No translation found]</i>') +
            (r.Translator ? ' <span class="trans-meta-translator">(' + r.Translator + ')</span>' : '') +
            '</div>';

         // Add navigation controls
         const navControls = document.createElement('div');
         navControls.className = 'search-nav-controls';
         navControls.style.cssText = 'margin-top: 8px; display: flex; gap: 8px; align-items: center;';
         
         const gotoBtn = document.createElement('button');
         gotoBtn.className = 'goto-btn';
         gotoBtn.innerHTML = '→ Go to ' + surahNum + ':' + ayahNum;
         gotoBtn.style.cssText = 'background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;';
         gotoBtn.onclick = (e) => {
            e.stopPropagation();
            loadSurah(surahNum, ayahNum);
         };
         
         const newWindowBtn = document.createElement('button');
         newWindowBtn.className = 'new-window-btn';
         newWindowBtn.innerHTML = '↗ New Window';
         newWindowBtn.style.cssText = 'background: var(--card-bg); color: var(--text); border: 1px solid var(--border); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;';
         newWindowBtn.onclick = (e) => {
            e.stopPropagation();
            const url = new URL(window.location);
            url.searchParams.set('surah', surahNum);
            url.searchParams.set('ayat', ayahNum);
            window.open(url.toString(), '_blank');
         };
         
         navControls.appendChild(gotoBtn);
         navControls.appendChild(newWindowBtn);
         transCell.appendChild(navControls);

         // const copyBtn = document.createElement('button');
         // copyBtn.className = 'copy-link-btn';
         // copyBtn.title = 'Copy link';
         // copyBtn.textContent = '🔗';
         // copyBtn.dataset.surah = surahNum;
         // copyBtn.dataset.ayat = ayahNum;
         // copyBtn.addEventListener('click', function (ev) {
         //    ev.stopPropagation();
         //    copyAyahLink(this.dataset.surah, this.dataset.ayat);
         // });
         // arabicCell.querySelector('.cell-meta').appendChild(copyBtn);

         row.appendChild(arabicCell);
         row.appendChild(transCell);

         // Removed automatic click navigation - now using explicit navigation controls
         
         container.appendChild(row);
      }

      // Apply font sizes
      container.querySelectorAll('.arabic-cell').forEach(el => el.style.fontSize = arabicSize + "px");
      container.querySelectorAll('.trans-cell').forEach(el => el.style.fontSize = transSize + "px");
      toggleShowTrans(showTranslator);

   } catch (error) {
      console.error('Error loading ayahs for surah', surahNum, error);
      container.innerHTML = '<p style="color: var(--text-secondary); padding: 16px;">Error loading ayahs for this surah.</p>';
   }
}

function copyAyahLink(surah, ayat) {
   const link = location.origin + location.pathname + '?surah=' + surah + '&ayat=' + ayat;
   if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(() => alert('Link copied')).catch(fallback);
   } else {
      fallback();
   }
   function fallback() {
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
         document.execCommand("copy");
         alert("Link copied");
      } catch (e) {
         alert("Press Ctrl+C (Cmd+C on Mac) to copy the link, then close this message.");
      }
      setTimeout(() => ta.remove(), 300);
   }
}

function loadBookmarksPreview() {
   const el = document.getElementById('bookmarkPreview');
   if (el) el.textContent = JSON.stringify(getBookmarks(), null, 2);
}

// Static small pages
window.openStatic = function (page) {
   const w = window.open('', '_blank', 'width=600,height=600,scrollbars=1');
   if (page === 'about') w.document.body.innerHTML = '<h3>About</h3><p>  www.AlQuran.study</p>';
   if (page === 'contact' || page === 'feedback') {
      w.document.body.innerHTML =
         `<h3>${page === 'contact' ? 'Contact' : 'Feedback'}</h3><form id="fb">` +
         '<input name="name" placeholder="Name" style="width:100%;padding:8px;margin:6px 0"/>' +
         '<input name="email" placeholder="Email" style="width:100%;padding:8px;margin:6px 0"/>' +
         '<textarea name="message" placeholder="Message" style="width:100%;height:150px;padding:8px;margin:6px 0"></textarea>' +
         '<button type="submit">Send</button>' +
         '</form>';
      const f = w.document.getElementById('fb');
      f.addEventListener('submit', ev => {
         ev.preventDefault();
         const data = { name: f.name.value, email: f.email.value, message: f.message.value };
         saveFeedback(data);
         alert('Thanks for feedback (stored locally).');
         w.close();
      });
   }
};

// (Optional) Expose loadSurah globally
window.loadSurah = loadSurah;

// Ensure footer links are clickable on mobile (touch)
['aboutLink', 'contactLink', 'feedbackLink'].forEach(id => {
   const el = document.getElementById(id);
   if (el) {
      el.addEventListener('touchstart', function (e) {
         e.preventDefault();
         el.click();
      });
   }
});