const url = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const result = document.getElementById("result");
const sound = document.getElementById("sound");
const btn = document.getElementById("search-btn");
const historyList = document.getElementById("history-list");

function updateHistory(word) {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  history = history.filter((w) => w.toLowerCase() !== word.toLowerCase());
  history.unshift(word);
  if (history.length > 10) history.pop();
  localStorage.setItem("searchHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  historyList.innerHTML = history
    .map((w) => `<span class="history-item" onclick="searchWord('${w}')">${w}</span>`)
    .join("");
}

function searchWord(inpWord) {
  inpWord = inpWord.trim();
  if (!inpWord) {
    result.innerHTML = "<p>Please enter a word!</p>";
    return;
  }

  result.innerHTML = '<p class="loading">Loading...</p>';

  fetch(`${url}${inpWord}`)
    .then((response) => response.json())
    .then((data) => {
      const wordData = data[0];
      const meaningWithDefs =
        wordData.meanings.find((m) => m.definitions && m.definitions.length > 0) ||
        wordData.meanings[0];
      const definitionsList = meaningWithDefs.definitions
        .map((d, i) => `<li>${d.definition}</li>`)
        .join("");

      const allSynonyms = wordData.meanings.flatMap((m) =>
        (m.synonyms || []).concat(m.definitions.flatMap((d) => d.synonyms || []))
      );
      const allAntonyms = wordData.meanings.flatMap((m) =>
        (m.antonyms || []).concat(m.definitions.flatMap((d) => d.antonyms || []))
      );

      const synonyms =
        allSynonyms.length > 0
          ? [...new Set(allSynonyms)].slice(0, 5).join(", ")
          : "No synonyms available";

      const antonyms =
        allAntonyms.length > 0
          ? [...new Set(allAntonyms)].slice(0, 5).join(", ")
          : "No antonyms available";

      let audioSrc = "";
      if (wordData.phonetics && wordData.phonetics.length > 0) {
        const withAudio = wordData.phonetics.find((p) => p.audio);
        if (withAudio) audioSrc = withAudio.audio;
      }

      const phoneticText = wordData.phonetic || (wordData.phonetics[0]?.text || "");

      result.innerHTML = `
        <div class="fade-in">
          <div class="word">
            <h3>${inpWord}</h3>
            <button onclick="playSound()" aria-label="Play pronunciation">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>
          <div class="details">
            <p>${meaningWithDefs.partOfSpeech}</p>
            <p>/${phoneticText}/</p>
          </div>
          <ul class="definitions">${definitionsList}</ul>
          <p class="word-example">${
            meaningWithDefs.definitions[0].example || "No example available"
          }</p>
          <p class="word-synonyms"><strong>Synonyms:</strong> ${synonyms}</p>
          <p class="word-antonyms"><strong>Antonyms:</strong> ${antonyms}</p>
        </div>
      `;

      if (audioSrc) sound.setAttribute("src", audioSrc);
      else sound.removeAttribute("src");

      updateHistory(inpWord);
    })
    .catch(() => {
      result.innerHTML = `
        <p class="no-result">Sorry, no definitions found for "<b>${inpWord}</b>".</p>
        <p class="no-result">Try searching for a common English word (like "run" or "happy").</p>
      `;
    });
}

btn.addEventListener("click", () => {
  const inpWord = document.getElementById("inp-word").value;
  searchWord(inpWord);
});

document.getElementById("inp-word").addEventListener("keypress", (e) => {
  if (e.key === "Enter") btn.click();
});

function playSound() {
  if (sound.src) {
    sound.play();
  } else {
    alert("No pronunciation available for this word.");
  }
}

renderHistory();

