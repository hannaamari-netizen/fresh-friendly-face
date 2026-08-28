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
