# Haya Al-Salat — App Store Connect Copy/Paste Sheet

Exact text to paste into App Store Connect for **version 1.0.0 (Build 1)**.

- Bundle ID: `app.hayaalsalat.companion`
- App Store Connect App ID: `3b2ab217-8afd-4c24-b752-4dbd82d31ba7`
- Team ID: `D47J65KQXJ`

Sources: `mobile/RELEASE_NOTES.md`, `mobile/APP_PRIVACY_MAPPING.md`.

---

## 1. What's New in This Version

**Where:** App Store tab → 1.0.0 Prepare for Submission → *What's New in This Version*
(For a first release this field may be labeled *Description* only — if so, skip to §2 and use the Description text there.)

### English (primary)

```text
Welcome to Haya Al-Salat — your peaceful Fajr companion.

• Accurate local prayer times based on your location
• Adhan for every prayer with adjustable volume
• Auto-recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj before Fajr
• Customize how many minutes before Fajr the recitation begins (5–30)
• Snooze the recitation and resume automatically
• Custom reminder message for Fajr notifications
• Offline audio support so recitation plays with a weak connection
• Media controls on the lock screen and notification shade
• Reduced-motion option for gentler transitions
• Share the app with family and friends in English, Swedish, or Arabic

May your Fajr be blessed. — Inoxin HA
```

### Arabic (locale: Arabic)

```text
مرحبًا بك في "حيّ على الصلاة" — رفيقك الهادئ لصلاة الفجر.

• أوقات الصلاة المحلية بدقة حسب موقعك
• الأذان لكل صلاة مع تحكم في مستوى الصوت
• تلاوة تلقائية لسورة المؤمنون بصوت الشيخ مختار الحاج قبل الفجر
• اختر عدد الدقائق قبل الفجر لبدء التلاوة (من 5 إلى 30)
• تأجيل التلاوة واستئنافها تلقائيًا
• تخصيص نص تذكير الفجر
• تشغيل التلاوة دون اتصال بالإنترنت
• التحكم في التشغيل من شاشة القفل ومركز الإشعارات
• خيار تقليل الحركة لانتقالات أكثر هدوءًا
• شارك التطبيق مع العائلة والأصدقاء

نسأل الله أن يتقبل منكم. — Inoxin HA
```

### Swedish (locale: Swedish)

```text
Välkommen till Haya Al-Salat — din lugna följeslagare för Fajr.

• Exakta lokala bönetider baserat på din plats
• Adhan för varje bön med justerbar volym
• Automatisk recitation av Surat Al-Mu'minun av Mukhtar Al-Hajj före Fajr
• Välj hur många minuter före Fajr recitationen ska börja (5–30)
• Snooza recitationen och återuppta automatiskt
• Anpassa påminnelsetexten för Fajr
• Offline-ljud så recitationen fungerar även med svag anslutning
• Mediakontroller på låsskärmen och i notiscentret
• Alternativ för minskad rörelse
• Dela appen med familj och vänner

Må din Fajr vara välsignad. — Inoxin HA
```

---

## 2. Promotional text (170 characters max)

```text
A peaceful Fajr companion. Rise to the recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj, with accurate local prayer times and Adhan for every prayer.
```

## 3. Keywords (100 characters max)

```text
fajr,prayer times,islam,quran,adhan,muslim,dawn,reminder,surah,recitation
```

## 4. Subtitle (30 characters max)

```text
Peaceful Fajr companion
```

## 5. Support & marketing URLs

```text
Support URL:        https://fresh-friendly-face.lovable.app/about
Marketing URL:      https://fresh-friendly-face.lovable.app
Privacy Policy URL: https://fresh-friendly-face.lovable.app/privacy
```

---

## 6. App Privacy — exact answers

**Where:** App Store Connect → your app → **App Privacy** → *Get Started* / *Edit*

### Q: Do you or your third-party partners collect data from this app?

→ **Yes, we collect data from this app**

### Data types to select

Select exactly these five, and nothing else:

| # | Category | Data type |
|---|---|---|
| 1 | Location | **Coarse Location** |
| 2 | Identifiers | **User ID** |
| 3 | Identifiers | **Device ID** |
| 4 | Usage Data | **Product Interaction** |
| 5 | User Content | **Other User Content** |

### Per-data-type answers

#### Coarse Location
- Used for: **App Functionality**
- Linked to the user's identity: **No**
- Used for tracking: **No**
- Free text (if asked): `Approximate latitude/longitude used to calculate local prayer times.`

#### User ID
- Used for: **App Functionality**
- Linked to the user's identity: **Yes**
- Used for tracking: **No**
- Free text: `Account identifier used to sync prayer and reminder preferences across devices when signed in.`

#### Device ID
- Used for: **App Functionality**
- Linked to the user's identity: **No**
- Used for tracking: **No**
- Free text: `Push notification token used to deliver Fajr reminders and prayer-time notifications.`

#### Product Interaction
- Used for: **App Functionality**
- Linked to the user's identity: **No**
- Used for tracking: **No**
- Free text: `Settings changes and playback interactions used to restore the user's preferred experience.`

#### Other User Content
- Used for: **App Functionality**
- Linked to the user's identity: **No**
- Used for tracking: **No**
- Free text: `User-authored reminder message and playback preferences (snooze, fade-in, volume).`

### Q: Does this app use data for tracking purposes?

→ **No**

### Resulting Privacy Nutrition Label (verify it renders like this)

```text
Data Used to Track You: None
Data Linked to You: User ID
Data Not Linked to You: Coarse Location, Device ID, Product Interaction, Other User Content
```

### Required Reason APIs

No additional declarations beyond the `PrivacyInfo.xcprivacy` manifests shipped by Capacitor and its plugins. Do not remove those files from the Pods project.

---

## 7. Export compliance

**Where:** the build's *Export Compliance* prompt after upload.

- Does your app use encryption? → **Yes**
- Does it qualify for an exemption? → **Yes** (uses only standard HTTPS/TLS provided by the OS)

---

## 8. Age rating & content

- Age rating: **4+**
- No objectionable content, no user-generated content sharing, no gambling, no unrestricted web access.

---

## 9. App Review notes

```text
Haya Al-Salat is a prayer-time and Fajr recitation companion. No account is required
to use the app; sign-in is optional and only syncs personal preferences.

Location permission is used solely to compute local prayer times via the Aladhan API.
If permission is denied, the app falls back to a default city and remains fully usable.

Notification permission is optional and only used for Fajr and prayer-time reminders.

Privacy Policy: https://fresh-friendly-face.lovable.app/privacy
Terms of Service: https://fresh-friendly-face.lovable.app/terms
Privacy contact: privacy@hayaalsalat.app
```

---

## 10. Final check before Submit for Review

- [ ] "What's New" pasted for every locale you list (English at minimum).
- [ ] Promotional text and keywords within their character limits.
- [ ] All five App Privacy data types selected, tracking answered **No**.
- [ ] Privacy Policy URL loads: `https://fresh-friendly-face.lovable.app/privacy`
- [ ] Screenshots uploaded from `/mnt/documents/app-store/`.
- [ ] Export compliance answered on the build.
- [ ] `privacy@hayaalsalat.app` is monitored.
