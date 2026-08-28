// Dua collections shown before and after the prayer.
// Each dua carries Arabic, transliteration, and English + Swedish meaning.

export type Dua = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  english: string;
  swedish: string;
  note?: string;
};

export const DUAS_BEFORE: Dua[] = [
  {
    id: "wudu-after",
    title: "After completing wudu",
    arabic:
      "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration:
      "Ash-hadu an lā ilāha illā-llāhu waḥdahu lā sharīka lah, wa ash-hadu anna Muḥammadan ʿabduhu wa rasūluh.",
    english:
      "I bear witness that there is no god but Allah alone, without partner, and I bear witness that Muhammad is His servant and His messenger.",
    swedish:
      "Jag vittnar att det inte finns någon gud utom Allah, den Ende, utan medhjälpare, och jag vittnar att Muhammad är Hans tjänare och Hans sändebud.",
  },
  {
    id: "entering-masjid",
    title: "Entering the place of prayer",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allāhumma iftaḥ lī abwāba raḥmatik.",
    english: "O Allah, open for me the gates of Your mercy.",
    swedish: "O Allah, öppna Din nåds portar för mig.",
  },
  {
    id: "after-adhan",
    title: "After the Adhan",
    arabic:
      "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
    transliteration:
      "Allāhumma rabba hādhihi-d-daʿwati-t-tāmmah wa-ṣ-ṣalāti-l-qāʾimah, āti Muḥammadan al-wasīlata wa-l-faḍīlah, wab-ʿathhu maqāman maḥmūdan alladhī waʿadtah.",
    english:
      "O Allah, Lord of this perfect call and the prayer to be offered, grant Muhammad the intercession and the favour, and raise him to the praised station You have promised him.",
    swedish:
      "O Allah, Herre över detta fullkomliga kall och den bön som stundar, ge Muhammad förbönen och förtjänsten, och upphöj honom till den lovprisade plats Du har utlovat honom.",
  },
  {
    id: "before-standing",
    title: "Seeking readiness of heart",
    arabic:
      "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    transliteration: "Allāhumma aʿinnī ʿalā dhikrika wa shukrika wa ḥusni ʿibādatik.",
    english: "O Allah, help me to remember You, to thank You, and to worship You in the best way.",
    swedish: "O Allah, hjälp mig att minnas Dig, att tacka Dig och att dyrka Dig på bästa sätt.",
  },
];

export const DUAS_AFTER: Dua[] = [
  {
    id: "astaghfirullah",
    title: "Right after the prayer",
    arabic:
      "أَسْتَغْفِرُ اللَّهَ (ثَلَاثًا) اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    transliteration:
      "Astaghfirullāh (×3). Allāhumma anta-s-salām wa minka-s-salām, tabārakta yā dhā-l-jalāli wa-l-ikrām.",
    english:
      "I seek Allah's forgiveness (three times). O Allah, You are Peace and from You comes peace. Blessed are You, Owner of majesty and honour.",
    swedish:
      "Jag söker Allahs förlåtelse (tre gånger). O Allah, Du är Friden och från Dig kommer friden. Välsignad är Du, majestätets och ärans Herre.",
  },
  {
    id: "tasbih",
    title: "Tasbih after prayer",
    arabic: "سُبْحَانَ اللَّهِ (٣٣) الْحَمْدُ لِلَّهِ (٣٣) اللَّهُ أَكْبَرُ (٣٣) لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration:
      "Subḥānallāh (×33), Alḥamdulillāh (×33), Allāhu akbar (×33), lā ilāha illā-llāhu waḥdahu lā sharīka lah, lahu-l-mulku wa lahu-l-ḥamdu wa huwa ʿalā kulli shayʾin qadīr.",
    english:
      "Glory be to Allah (33), praise be to Allah (33), Allah is the Greatest (33). There is no god but Allah alone, without partner; His is the dominion and His the praise, and He is able to do all things.",
    swedish:
      "Ära vare Allah (33), lov och pris till Allah (33), Allah är störst (33). Det finns ingen gud utom Allah, den Ende, utan medhjälpare; Hans är herradömet och Hans är lovet, och Han har makt över allting.",
    note: "Counted 33 times each, then the final phrase once.",
  },
  {
    id: "ayat-al-kursi",
    title: "Recite Ayat al-Kursi",
    arabic:
      "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    transliteration: "Allāhu lā ilāha illā huwa-l-ḥayyu-l-qayyūm, lā taʾkhudhuhu sinatun wa lā nawm…",
    english:
      "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep… (Al-Baqarah 2:255)",
    swedish:
      "Allah – det finns ingen gud utom Han, den Levande, den Evige Uppehållaren. Slummer överraskar Honom inte och inte heller sömn… (Al-Baqarah 2:255)",
    note: "Read the full verse — open it in the Quran section, Surah 2, verse 255.",
  },
  {
    id: "protection-from-hellfire",
    title: "Asking for the best outcome",
    arabic:
      "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ",
    transliteration: "Allāhumma innī asʾaluka-l-jannah wa aʿūdhu bika mina-n-nār.",
    english: "O Allah, I ask You for Paradise and I seek refuge in You from the Fire.",
    swedish: "O Allah, jag ber Dig om paradiset och jag söker skydd hos Dig från elden.",
  },
  {
    id: "leaving-masjid",
    title: "Leaving the place of prayer",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allāhumma innī asʾaluka min faḍlik.",
    english: "O Allah, I ask You for Your bounty.",
    swedish: "O Allah, jag ber Dig om Din nåd och gåva.",
  },
];

export const ATHKAR_MORNING: Dua[] = [
  {
    id: "sabah-opening",
    title: "On waking into the morning",
    arabic:
      "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration:
      "Aṣbaḥnā wa aṣbaḥa-l-mulku lillāh, wa-l-ḥamdu lillāh, lā ilāha illā-llāhu waḥdahu lā sharīka lah.",
    english:
      "We have entered the morning and with it the dominion belongs to Allah. All praise is for Allah. There is no god but Allah alone, without partner.",
    swedish:
      "Vi har gått in i morgonen och med den tillhör herradömet Allah. Allt lov tillhör Allah. Det finns ingen gud utom Allah, den Ende, utan medhjälpare.",
  },
  {
    id: "sayyid-istighfar",
    title: "Sayyid al-Istighfar",
    arabic:
      "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي",
    transliteration:
      "Allāhumma anta rabbī lā ilāha illā anta, khalaqtanī wa anā ʿabduk, wa anā ʿalā ʿahdika wa waʿdika mā istaṭaʿt, aʿūdhu bika min sharri mā ṣanaʿt, abūʾu laka bi-niʿmatika ʿalayya wa abūʾu bi-dhanbī faghfir lī.",
    english:
      "O Allah, You are my Lord; there is no god but You. You created me and I am Your servant. I keep Your covenant as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I admit my sin, so forgive me.",
    swedish:
      "O Allah, Du är min Herre; det finns ingen gud utom Du. Du skapade mig och jag är Din tjänare. Jag håller Ditt förbund så långt jag förmår. Jag söker skydd hos Dig från det onda jag gjort. Jag erkänner Din välsignelse över mig och jag bekänner min synd, så förlåt mig.",
    note: "Said once in the morning and once in the evening.",
  },
  {
    id: "sabah-afiyah",
    title: "Asking for wellbeing",
    arabic:
      "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ",
    transliteration:
      "Allāhumma ʿāfinī fī badanī, Allāhumma ʿāfinī fī samʿī, Allāhumma ʿāfinī fī baṣarī, lā ilāha illā anta.",
    english:
      "O Allah, grant my body health, grant my hearing health, grant my sight health. There is no god but You.",
    swedish:
      "O Allah, ge min kropp hälsa, ge min hörsel hälsa, ge min syn hälsa. Det finns ingen gud utom Du.",
    note: "Repeated three times.",
  },
  {
    id: "sabah-bismillah",
    title: "Protection for the day",
    arabic:
      "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration:
      "Bismillāhi-lladhī lā yaḍurru maʿa ismihi shayʾun fī-l-arḍi wa lā fī-s-samāʾ, wa huwa-s-samīʿu-l-ʿalīm.",
    english:
      "In the name of Allah, with whose name nothing on earth or in heaven can cause harm. He is the All-Hearing, the All-Knowing.",
    swedish:
      "I Allahs namn, med vars namn ingenting på jorden eller i himlen kan skada. Han är den Allhörande, den Allvetande.",
    note: "Repeated three times.",
  },
  {
    id: "sabah-tasbih",
    title: "Morning tasbih",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "Subḥānallāhi wa biḥamdih.",
    english: "Glory be to Allah and praise be to Him.",
    swedish: "Ära vare Allah och lov och pris till Honom.",
    note: "Repeated one hundred times.",
  },
];

export const ATHKAR_EVENING: Dua[] = [
  {
    id: "masa-opening",
    title: "As the evening comes",
    arabic:
      "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration:
      "Amsaynā wa amsa-l-mulku lillāh, wa-l-ḥamdu lillāh, lā ilāha illā-llāhu waḥdahu lā sharīka lah.",
    english:
      "We have entered the evening and with it the dominion belongs to Allah. All praise is for Allah. There is no god but Allah alone, without partner.",
    swedish:
      "Vi har gått in i kvällen och med den tillhör herradömet Allah. Allt lov tillhör Allah. Det finns ingen gud utom Allah, den Ende, utan medhjälpare.",
  },
  {
    id: "masa-shelter",
    title: "Seeking refuge in the evening",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "Aʿūdhu bi-kalimātillāhi-t-tāmmāti min sharri mā khalaq.",
    english: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    swedish: "Jag söker skydd i Allahs fullkomliga ord från det onda i det Han har skapat.",
    note: "Repeated three times.",
  },
  {
    id: "masa-tawakkul",
    title: "Placing trust before night",
    arabic:
      "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Ḥasbiya-llāhu lā ilāha illā huwa, ʿalayhi tawakkalt, wa huwa rabbu-l-ʿarshi-l-ʿaẓīm.",
    english:
      "Allah is sufficient for me; there is no god but Him. In Him I place my trust, and He is the Lord of the Mighty Throne.",
    swedish:
      "Allah är nog för mig; det finns ingen gud utom Han. På Honom förlitar jag mig, och Han är den Mäktiga Tronens Herre.",
    note: "Repeated seven times.",
  },
  {
    id: "masa-mualliqat",
    title: "Before sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika-llāhumma amūtu wa aḥyā.",
    english: "In Your name, O Allah, I die and I live.",
    swedish: "I Ditt namn, o Allah, dör jag och lever jag.",
  },
  {
    id: "masa-ikhlas",
    title: "The three protecting surahs",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    transliteration: "Al-Ikhlāṣ, Al-Falaq, An-Nās.",
    english:
      "Recite Surah Al-Ikhlas, Al-Falaq and An-Nas three times each, morning and evening, for protection.",
    swedish:
      "Läs surorna Al-Ikhlas, Al-Falaq och An-Nas tre gånger var, morgon och kväll, som skydd.",
    note: "Open them in the Quran section: surahs 112, 113 and 114.",
  },
];
