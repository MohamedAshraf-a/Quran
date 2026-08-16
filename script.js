/* =========================================================
   AlphaQuran
   Quran Audio Player
   CodeAlpha - Task 04

   FEATURES
   ---------------------------------------------------------
   ✓ Load complete Surah once
   ✓ Display ONLY current Ayah
   ✓ Ayah-by-Ayah playback
   ✓ Next / Previous Ayah
   ✓ Play / Pause
   ✓ Progress
   ✓ Volume / Mute
   ✓ Surah selector
   ✓ Reciter selector
   ✓ Autoplay
   ✓ No page reload
   ✓ Arabic numbers
   ✓ Current Ayah updates automatically
   ✓ Download complete Surah
   ✓ No random Ayahs
   ✓ No text edition error
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE = "https://api.alquran.cloud/v1";


/* =========================================================
   AUDIO CDN
========================================================= */

/*
   Ayah audio:

   https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3

   1 = global Ayah number


   Full Surah audio:

   https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3

   1 = Surah number
*/

const AUDIO_BASE =
    "https://cdn.islamic.network/quran/audio/128";

const SURAH_AUDIO_BASE =
    "https://cdn.islamic.network/quran/audio-surah/128";


/* =========================================================
   RECITERS
========================================================= */

const RECITERS = [

    {
        id: "ar.alafasy",
        name: "مشاري راشد العفاسي",
        englishName: "Mishary Rashid Alafasy"
    },

    {
        id: "ar.abdulbasitmurattal",
        name: "عبد الباسط عبد الصمد",
        englishName: "Abdul Basit Murattal"
    },

    {
        id: "ar.minshawi",
        name: "محمد صديق المنشاوي",
        englishName: "Muhammad Siddiq Al-Minshawi"
    },

    {
        id: "ar.husary",
        name: "محمود خليل الحصري",
        englishName: "Mahmoud Khalil Al-Husary"
    },

    {
        id: "ar.mahermuaiqly",
        name: "ماهر المعيقلي",
        englishName: "Maher Al-Muaiqly"
    },

    {
        id: "ar.saoodshuraym",
        name: "سعود الشريم",
        englishName: "Saud Al-Shuraim"
    }

];


/* =========================================================
   STATE
========================================================= */

let surahs = [];

let currentSurah = null;

let currentAyahs = [];

let currentAyahIndex = 0;

let currentReciter = "ar.alafasy";

let isPlaying = false;

let autoplay = true;

let isMuted = false;

let previousVolume = 0.8;

let isLoadingSurah = false;

let currentAudioURL = "";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loading-screen");

const app =
    document.getElementById("app");

const audio =
    document.getElementById("audio-player");

const playBtn =
    document.getElementById("play-btn");

const playIcon =
    document.getElementById("play-icon");

const prevBtn =
    document.getElementById("prev-btn");

const nextBtn =
    document.getElementById("next-btn");

const progressSlider =
    document.getElementById("progress-slider");

const volumeSlider =
    document.getElementById("vol-slider");

const muteBtn =
    document.getElementById("mute-btn");

const volIcon =
    document.getElementById("vol-icon");

const timeCurrent =
    document.getElementById("time-current");

const timeDuration =
    document.getElementById("time-duration");

const surahSelect =
    document.getElementById("surah-select");

const reciterSelect =
    document.getElementById("reciter-select");

const autoplayToggle =
    document.getElementById("autoplay-toggle");

const autoplayStatus =
    document.getElementById("autoplay-status");

const surahArabic =
    document.getElementById("surah-arabic");

const surahEnglish =
    document.getElementById("surah-english");

const reciterName =
    document.getElementById("reciter-name");

const ayahNumber =
    document.getElementById("ayah-number");

const currentAyahText =
    document.getElementById("current-ayah-text");

/*
   Optional download button.

   If your HTML contains:

   <button id="download-surah-btn">
       تحميل السورة
   </button>

   the JavaScript will automatically activate it.
*/

const downloadSurahBtn =
    document.getElementById("download-surah-btn");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initApp
);


async function initApp() {

    try {

        setupDefaultPlayer();

        setupAudioEvents();

        setupEvents();

        populateReciters();

        updateAutoplayUI();

        await loadSurahList();

        /*
           Default Surah:
           Al-Fatihah
        */

        await loadSurah(
            1,
            false
        );

        showApp();

    } catch (error) {

        console.error(
            "AlphaQuran initialization error:",
            error
        );

        showError(
            "حدث خطأ أثناء تحميل القرآن. تأكد من اتصال الإنترنت ثم حاول مرة أخرى."
        );

        showApp();
    }

}


/* =========================================================
   DEFAULT PLAYER
========================================================= */

function setupDefaultPlayer() {

    if (!audio) {
        return;
    }

    audio.volume = 0.8;

    audio.preload = "metadata";

    if (volumeSlider) {

        volumeSlider.value = 80;
    }

    updateVolumeIcon();

    updatePlayButton(false);
}


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    if (loadingScreen) {

        loadingScreen.style.opacity = "0";

        loadingScreen.style.visibility =
            "hidden";
    }

    if (app) {

        app.style.display = "block";
    }

}


/* =========================================================
   API FETCH
========================================================= */

async function fetchJSON(url) {

    const response =
        await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });


    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
        );
    }


    const json =
        await response.json();


    if (
        !json ||
        json.code !== 200 ||
        !json.data
    ) {

        throw new Error(
            "Invalid API response"
        );
    }


    return json.data;
}


/* =========================================================
   LOAD SURAH LIST
========================================================= */

async function loadSurahList() {

    const data =
        await fetchJSON(
            `${API_BASE}/surah`
        );


    surahs =
        Array.isArray(data)
            ? data
            : [];


    if (!surahs.length) {

        throw new Error(
            "No Surahs found"
        );
    }


    populateSurahSelect();
}


/* =========================================================
   POPULATE SURAH SELECT
========================================================= */

function populateSurahSelect() {

    if (!surahSelect) {
        return;
    }


    surahSelect.innerHTML = "";


    surahs.forEach(
        surah => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                surah.number;


            option.textContent =
                `${surah.number}. ${cleanSurahName(surah.name)} — ${surah.englishName}`;


            surahSelect.appendChild(
                option
            );
        }
    );

}


/* =========================================================
   POPULATE RECITERS
========================================================= */

function populateReciters() {

    if (!reciterSelect) {
        return;
    }


    reciterSelect.innerHTML = "";


    RECITERS.forEach(
        reciter => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                reciter.id;


            option.textContent =
                reciter.name;


            option.selected =
                reciter.id === currentReciter;


            reciterSelect.appendChild(
                option
            );
        }
    );


    updateReciterName();
}


/* =========================================================
   LOAD SURAH
========================================================= */

async function loadSurah(
    surahNumber,
    shouldPlay = false
) {

    /*
       Prevent duplicate requests
    */

    if (isLoadingSurah) {
        return;
    }


    isLoadingSurah = true;


    try {

        stopAudio();


        showCurrentAyahLoading();


        /*
           IMPORTANT:

           We only request the Quran text.

           We DO NOT request:

           /surah/1/ar.alafasy

           as a text edition.

           This prevents:
           "Text edition not found"
        */

        const data =
            await fetchJSON(
                `${API_BASE}/surah/${surahNumber}`
            );


        if (
            !data ||
            !Array.isArray(data.ayahs) ||
            !data.ayahs.length
        ) {

            throw new Error(
                "Surah contains no Ayahs"
            );
        }


        /*
           Store complete Surah
        */

        currentSurah =
            data;


        currentAyahs =
            data.ayahs;


        /*
           Start from first Ayah
        */

        currentAyahIndex = 0;


        /*
           Update interface
        */

        updateSurahInfo();

        updateSurahSelect();

        updateCurrentAyah();


        /*
           Prepare first audio
        */

        prepareAyah();


        /*
           Optional autoplay
        */

        if (shouldPlay) {

            await playCurrentAyah();
        }


    } catch (error) {

        console.error(
            "loadSurah error:",
            error
        );


        showError(
            "تعذر تحميل السورة. حاول مرة أخرى."
        );


    } finally {

        isLoadingSurah = false;
    }

}


/* =========================================================
   UPDATE SURAH INFORMATION
========================================================= */

function updateSurahInfo() {

    if (!currentSurah) {
        return;
    }


    if (surahArabic) {

        surahArabic.textContent =
            cleanSurahName(
                currentSurah.name
            );
    }


    if (surahEnglish) {

        surahEnglish.textContent =
            currentSurah.englishName;
    }


    updateReciterName();
}


/* =========================================================
   CLEAN SURAH NAME
========================================================= */

function cleanSurahName(name) {

    if (!name) {
        return "";
    }


    return name
        .replace(
            /^سُورَةُ\s*/u,
            ""
        )
        .replace(
            /^سورة\s*/u,
            ""
        )
        .trim();
}


/* =========================================================
   UPDATE SURAH SELECT
========================================================= */

function updateSurahSelect() {

    if (
        !surahSelect ||
        !currentSurah
    ) {
        return;
    }


    surahSelect.value =
        String(
            currentSurah.number
        );
}


/* =========================================================
   UPDATE RECITER NAME
========================================================= */

function updateReciterName() {

    const reciter =
        RECITERS.find(
            item =>
                item.id ===
                currentReciter
        );


    if (
        reciter &&
        reciterName
    ) {

        reciterName.textContent =
            reciter.name;
    }

}


/* =========================================================
   UPDATE CURRENT AYAH
========================================================= */

function updateCurrentAyah() {

    if (!currentAyahs.length) {
        return;
    }


    const ayah =
        currentAyahs[
            currentAyahIndex
        ];


    if (!ayah) {
        return;
    }


    /*
       Current Ayah number
    */

    if (ayahNumber) {

        ayahNumber.textContent =
            toArabicNumber(
                ayah.numberInSurah
            );
    }


    /*
       Current Ayah text ONLY

       No list.
       No full Surah rendering.
    */

    if (currentAyahText) {

        currentAyahText.textContent =
            ayah.text;
    }


    /*
       Optional elements
    */

    const currentAyahDisplay =
        document.getElementById(
            "current-ayah-display"
        );


    const currentAyahNumber =
        document.getElementById(
            "current-ayah-number"
        );


    if (currentAyahDisplay) {

        currentAyahDisplay.textContent =
            ayah.text;
    }


    if (currentAyahNumber) {

        currentAyahNumber.textContent =
            toArabicNumber(
                ayah.numberInSurah
            );
    }

}


/* =========================================================
   LOADING CURRENT AYAH
========================================================= */

function showCurrentAyahLoading() {

    if (ayahNumber) {

        ayahNumber.textContent =
            "…";
    }


    if (currentAyahText) {

        currentAyahText.textContent =
            "جاري تحميل السورة...";
    }


    const currentAyahDisplay =
        document.getElementById(
            "current-ayah-display"
        );


    if (currentAyahDisplay) {

        currentAyahDisplay.textContent =
            "جاري تحميل السورة...";
    }

}


/* =========================================================
   BUILD AYAH AUDIO URL
========================================================= */

function getAyahAudioURL(ayah) {

    if (!ayah) {
        return "";
    }


    /*
       Global Quran Ayah number
    */

    const globalAyahNumber =
        ayah.number;


    return `${AUDIO_BASE}/${currentReciter}/${globalAyahNumber}.mp3`;
}


/* =========================================================
   PREPARE CURRENT AYAH
========================================================= */

function prepareAyah() {

    if (!currentAyahs.length) {
        return;
    }


    const ayah =
        currentAyahs[
            currentAyahIndex
        ];


    if (!ayah) {
        return;
    }


    const audioURL =
        getAyahAudioURL(
            ayah
        );


    if (!audioURL) {
        return;
    }


    /*
       Don't reload the same audio unnecessarily.
    */

    if (
        currentAudioURL !==
        audioURL
    ) {

        currentAudioURL =
            audioURL;


        audio.src =
            audioURL;


        audio.load();
    }


    updateCurrentAyah();

    resetProgress();

    updatePlayButton(false);
}


/* =========================================================
   PLAY CURRENT AYAH
========================================================= */

async function playCurrentAyah() {

    if (!currentAyahs.length) {
        return;
    }


    const ayah =
        currentAyahs[
            currentAyahIndex
        ];


    if (!ayah) {
        return;
    }


    /*
       Make sure correct audio is loaded.
    */

    const expectedURL =
        getAyahAudioURL(
            ayah
        );


    if (
        currentAudioURL !==
        expectedURL
    ) {

        prepareAyah();
    }


    try {

        await audio.play();

        isPlaying = true;

        updatePlayButton(true);

    } catch (error) {

        console.error(
            "Audio play error:",
            error
        );


        isPlaying = false;

        updatePlayButton(false);


        showError(
            "اضغط زر التشغيل لبدء التلاوة."
        );
    }

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

async function togglePlay() {

    if (!currentAyahs.length) {
        return;
    }


    if (audio.paused) {

        await playCurrentAyah();

    } else {

        audio.pause();

        isPlaying = false;

        updatePlayButton(false);
    }

}


/* =========================================================
   UPDATE PLAY BUTTON
========================================================= */

function updatePlayButton(
    playing
) {

    if (!playIcon) {
        return;
    }


    if (playing) {

        playIcon.textContent =
            "❚❚";


        if (playBtn) {

            playBtn.setAttribute(
                "aria-label",
                "Pause"
            );
        }


    } else {

        playIcon.textContent =
            "▶";


        if (playBtn) {

            playBtn.setAttribute(
                "aria-label",
                "Play"
            );
        }
    }

}


/* =========================================================
   NEXT AYAH
========================================================= */

async function nextAyah(
    shouldPlay = true
) {

    if (!currentAyahs.length) {
        return;
    }


    /*
       If last Ayah
    */

    if (
        currentAyahIndex >=
        currentAyahs.length - 1
    ) {

        stopAudio();

        currentAyahIndex =
            currentAyahs.length - 1;

        updateCurrentAyah();

        return;
    }


    /*
       Move to next Ayah
    */

    currentAyahIndex++;


    /*
       Update text immediately
    */

    updateCurrentAyah();


    /*
       Load new audio
    */

    prepareAyah();


    /*
       Play
    */

    if (shouldPlay) {

        await playCurrentAyah();
    }

}


/* =========================================================
   PREVIOUS AYAH
========================================================= */

async function previousAyah() {

    if (!currentAyahs.length) {
        return;
    }


    /*
       If current Ayah has played
       more than 3 seconds,
       restart it.
    */

    if (
        audio.currentTime > 3
    ) {

        audio.currentTime = 0;

        if (audio.paused) {

            await playCurrentAyah();
        }

        return;
    }


    /*
       Move backward
    */

    if (
        currentAyahIndex > 0
    ) {

        currentAyahIndex--;
    }


    updateCurrentAyah();

    prepareAyah();

    await playCurrentAyah();
}


/* =========================================================
   HANDLE SURAH CHANGE
========================================================= */

async function handleSurahChange() {

    if (!surahSelect) {
        return;
    }


    const number =
        Number(
            surahSelect.value
        );


    if (
        !number ||
        number < 1 ||
        number > 114
    ) {
        return;
    }


    /*
       Load selected Surah.

       This does NOT reload page.
    */

    await loadSurah(
        number,
        true
    );
}


/* =========================================================
   HANDLE RECITER CHANGE
========================================================= */

async function handleReciterChange() {

    if (!reciterSelect) {
        return;
    }


    const wasPlaying =
        !audio.paused;


    currentReciter =
        reciterSelect.value;


    updateReciterName();


    /*
       Force new audio URL
    */

    currentAudioURL =
        "";


    prepareAyah();


    /*
       Continue playback automatically
    */

    if (wasPlaying) {

        await playCurrentAyah();
    }

}


/* =========================================================
   AUTOPLAY
========================================================= */

function toggleAutoplay() {

    autoplay =
        !autoplay;


    updateAutoplayUI();
}


/* =========================================================
   UPDATE AUTOPLAY UI
========================================================= */

function updateAutoplayUI() {

    if (autoplayStatus) {

        autoplayStatus.textContent =
            autoplay
                ? "ON"
                : "OFF";
    }


    if (autoplayToggle) {

        autoplayToggle.classList.toggle(
            "active",
            autoplay
        );
    }

}


/* =========================================================
   AUDIO ENDED
========================================================= */

async function handleAudioEnded() {

    isPlaying = false;

    updatePlayButton(false);


    /*
       Autoplay OFF

       Stay on current Ayah.
    */

    if (!autoplay) {
        return;
    }


    /*
       More Ayahs
    */

    if (
        currentAyahIndex <
        currentAyahs.length - 1
    ) {

        currentAyahIndex++;


        /*
           IMPORTANT:

           Update displayed Ayah
           BEFORE audio starts.
        */

        updateCurrentAyah();


        prepareAyah();


        await playCurrentAyah();


        return;
    }


    /*
       Surah finished
    */

    currentAyahIndex =
        currentAyahs.length - 1;


    updateCurrentAyah();


    stopAudio();
}


/* =========================================================
   STOP AUDIO
========================================================= */

function stopAudio() {

    if (!audio) {
        return;
    }


    audio.pause();


    try {

        audio.currentTime = 0;

    } catch (error) {

        console.warn(
            "Could not reset audio:",
            error
        );
    }


    isPlaying = false;


    updatePlayButton(false);

    resetProgress();
}


/* =========================================================
   PROGRESS UPDATE
========================================================= */

function updateProgress() {

    if (
        !audio ||
        !Number.isFinite(
            audio.duration
        ) ||
        audio.duration <= 0
    ) {
        return;
    }


    const percentage =
        (
            audio.currentTime /
            audio.duration
        ) * 100;


    if (progressSlider) {

        progressSlider.value =
            percentage;
    }


    if (timeCurrent) {

        timeCurrent.textContent =
            formatTime(
                audio.currentTime
            );
    }


    if (timeDuration) {

        timeDuration.textContent =
            formatTime(
                audio.duration
            );
    }

}


/* =========================================================
   RESET PROGRESS
========================================================= */

function resetProgress() {

    if (progressSlider) {

        progressSlider.value =
            0;
    }


    if (timeCurrent) {

        timeCurrent.textContent =
            "00:00";
    }


    if (timeDuration) {

        timeDuration.textContent =
            "00:00";
    }

}


/* =========================================================
   SEEK
========================================================= */

function seekAudio() {

    if (
        !audio ||
        !Number.isFinite(
            audio.duration
        ) ||
        audio.duration <= 0 ||
        !progressSlider
    ) {
        return;
    }


    const value =
        Number(
            progressSlider.value
        );


    audio.currentTime =
        (
            value / 100
        ) *
        audio.duration;
}


/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {

        return "00:00";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remainingSeconds =
        Math.floor(
            seconds % 60
        );


    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


/* =========================================================
   VOLUME
========================================================= */

function handleVolumeChange() {

    if (!volumeSlider) {
        return;
    }


    const value =
        Number(
            volumeSlider.value
        );


    audio.volume =
        Math.max(
            0,
            Math.min(
                1,
                value / 100
            )
        );


    if (audio.volume > 0) {

        previousVolume =
            audio.volume;

        isMuted = false;

    } else {

        isMuted = true;
    }


    updateVolumeIcon();
}


/* =========================================================
   MUTE
========================================================= */

function toggleMute() {

    if (isMuted) {

        audio.volume =
            previousVolume ||
            0.8;


        if (volumeSlider) {

            volumeSlider.value =
                Math.round(
                    audio.volume * 100
                );
        }


        isMuted = false;

    } else {

        previousVolume =
            audio.volume ||
            0.8;


        audio.volume = 0;


        if (volumeSlider) {

            volumeSlider.value =
                0;
        }


        isMuted = true;
    }


    updateVolumeIcon();
}


/* =========================================================
   VOLUME ICON
========================================================= */

function updateVolumeIcon() {

    if (!volIcon) {
        return;
    }


    if (
        isMuted ||
        audio.volume === 0
    ) {

        volIcon.textContent =
            "🔇";

    } else if (
        audio.volume < 0.5
    ) {

        volIcon.textContent =
            "🔉";

    } else {

        volIcon.textContent =
            "🔊";
    }

}


/* =========================================================
   DOWNLOAD COMPLETE SURAH
========================================================= */

function getFullSurahAudioURL() {

    if (!currentSurah) {
        return "";
    }


    return `${SURAH_AUDIO_BASE}/${currentReciter}/${currentSurah.number}.mp3`;
}


function downloadSurah() {

    if (!currentSurah) {

        showError(
            "اختر سورة أولًا."
        );

        return;
    }


    const url =
        getFullSurahAudioURL();


    if (!url) {
        return;
    }


    /*
       Open the full Surah audio.

       The browser can stream/download it
       depending on browser/server headers.
    */

    const link =
        document.createElement("a");


    link.href =
        url;


    link.target =
        "_blank";


    link.rel =
        "noopener noreferrer";


    link.download =
        `${currentSurah.number}-${cleanSurahName(currentSurah.name)}.mp3`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();
}


/* =========================================================
   AUDIO EVENTS
========================================================= */

function setupAudioEvents() {

    if (!audio) {
        return;
    }


    /*
       PLAY
    */

    audio.addEventListener(
        "play",
        () => {

            isPlaying = true;

            updatePlayButton(true);
        }
    );


    /*
       PAUSE
    */

    audio.addEventListener(
        "pause",
        () => {

            isPlaying = false;

            updatePlayButton(false);
        }
    );


    /*
       TIME UPDATE
    */

    audio.addEventListener(
        "timeupdate",
        updateProgress
    );


    /*
       METADATA
    */

    audio.addEventListener(
        "loadedmetadata",
        () => {

            if (timeDuration) {

                timeDuration.textContent =
                    formatTime(
                        audio.duration
                    );
            }
        }
    );


    /*
       AUDIO ENDED
    */

    audio.addEventListener(
        "ended",
        handleAudioEnded
    );


    /*
       AUDIO ERROR
    */

    audio.addEventListener(
        "error",
        () => {

            console.error(
                "Audio source error:",
                audio.error
            );


            isPlaying = false;


            updatePlayButton(false);


            showError(
                "تعذر تشغيل صوت الآية. جرّب قارئًا آخر."
            );
        }
    );

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /*
       PLAY / PAUSE
    */

    if (playBtn) {

        playBtn.addEventListener(
            "click",
            togglePlay
        );
    }


    /*
       NEXT
    */

    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            () => nextAyah(true)
        );
    }


    /*
       PREVIOUS
    */

    if (prevBtn) {

        prevBtn.addEventListener(
            "click",
            previousAyah
        );
    }


    /*
       PROGRESS
    */

    if (progressSlider) {

        progressSlider.addEventListener(
            "input",
            seekAudio
        );
    }


    /*
       VOLUME
    */

    if (volumeSlider) {

        volumeSlider.addEventListener(
            "input",
            handleVolumeChange
        );
    }


    /*
       MUTE
    */

    if (muteBtn) {

        muteBtn.addEventListener(
            "click",
            toggleMute
        );
    }


    /*
       SURAH SELECT
    */

    if (surahSelect) {

        surahSelect.addEventListener(
            "change",
            handleSurahChange
        );
    }


    /*
       RECITER SELECT
    */

    if (reciterSelect) {

        reciterSelect.addEventListener(
            "change",
            handleReciterChange
        );
    }


    /*
       AUTOPLAY
    */

    if (autoplayToggle) {

        autoplayToggle.addEventListener(
            "click",
            toggleAutoplay
        );
    }


    /*
       DOWNLOAD SURAH

       Optional.
       Only activates if button exists.
    */

    if (downloadSurahBtn) {

        downloadSurahBtn.addEventListener(
            "click",
            downloadSurah
        );
    }


    /*
       KEYBOARD
    */

    document.addEventListener(
        "keydown",
        handleKeyboard
    );

}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function handleKeyboard(event) {

    const tag =
        event.target.tagName;


    /*
       Don't interfere with inputs
    */

    if (
        tag === "INPUT" ||
        tag === "SELECT" ||
        tag === "TEXTAREA"
    ) {

        return;
    }


    /*
       Space
    */

    if (
        event.code === "Space"
    ) {

        event.preventDefault();

        togglePlay();

        return;
    }


    /*
       Arrow Right

       Next Ayah
    */

    if (
        event.code === "ArrowRight"
    ) {

        event.preventDefault();

        nextAyah(true);

        return;
    }


    /*
       Arrow Left

       Previous Ayah
    */

    if (
        event.code === "ArrowLeft"
    ) {

        event.preventDefault();

        previousAyah();

        return;
    }

}


/* =========================================================
   ARABIC NUMBERS
========================================================= */

function toArabicNumber(number) {

    const arabicNumbers = [
        "٠",
        "١",
        "٢",
        "٣",
        "٤",
        "٥",
        "٦",
        "٧",
        "٨",
        "٩"
    ];


    return String(number)
        .split("")
        .map(
            digit =>
                arabicNumbers[
                    Number(digit)
                ] ?? digit
        )
        .join("");
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function showError(message) {

    /*
       Remove previous error
    */

    const oldError =
        document.getElementById(
            "alpha-error"
        );


    if (oldError) {

        oldError.remove();
    }


    /*
       Create error
    */

    const error =
        document.createElement(
            "div"
        );


    error.id =
        "alpha-error";


    error.textContent =
        message;


    /*
       Style directly
       so it works even without
       additional CSS.
    */

    error.style.position =
        "fixed";


    error.style.top =
        "20px";


    error.style.left =
        "50%";


    error.style.transform =
        "translateX(-50%)";


    error.style.zIndex =
        "99999";


    error.style.background =
        "#171717";


    error.style.color =
        "#d4af37";


    error.style.padding =
        "12px 22px";


    error.style.border =
        "1px solid #d4af37";


    error.style.borderRadius =
        "10px";


    error.style.fontFamily =
        "Cairo, sans-serif";


    error.style.fontSize =
        "14px";


    error.style.direction =
        "rtl";


    error.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.25)";


    /*
       Insert
    */

    document.body.prepend(
        error
    );


    /*
       Remove after 6 seconds
    */

    setTimeout(
        () => {

            error.style.opacity =
                "0";


            error.style.transition =
                "opacity .3s ease";


            setTimeout(
                () => {

                    if (error) {
                        error.remove();
                    }

                },
                300
            );

        },
        6000
    );

}


/* =========================================================
   START UI
========================================================= */

updateAutoplayUI();