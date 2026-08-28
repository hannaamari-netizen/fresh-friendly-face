# Haya Al-Salat — App Store Release Notes

Paste the "What's New in This Version" text into App Store Connect →
your app → **App Store** tab → the version you're submitting → **What's New in This Version**.

Keep it under 4000 characters. Apple shows the first ~170 characters on the
product page before "more", so lead with the most important line.

---

## Version 1.2 (Build 8) — iOS 15 minimum + compliance fix

### What's New (App Store Connect — English, primary)

```text
This update raises the minimum supported iOS version to 15.0 to comply with App Store Connect requirements and ensure continued distribution.

• Minimum iOS version updated to 15.0 (resolves ITMS-90068)
• Stability and compatibility improvements

May your Fajr be blessed. — Inoxin HA
```

### Short version

```text
Updated minimum iOS version to 15.0 for continued App Store distribution.
```

### Arabic

```text
تم رفع الحد الأدنى لإصدار iOS المدعوم إلى 15.0 لضمان الامتثال لمتطلبات App Store Connect واستمرار توزيع التطبيق.

• تحديث الحد الأدنى لإصدار iOS إلى 15.0 (لحل ITMS-90068)
• تحسينات الاستقرار والتوافق

نسأل الله أن يتقبل منكم. — Inoxin HA
```

### Swedish

```text
Denna uppdatering höjer den lägsta stödda iOS-versionen till 15.0 för att uppfylla App Store Connect-kraven och säkerställa fortsatt distribution.

• Minimi-iOS-version uppdaterad till 15.0 (löser ITMS-90068)
• Stabilitets- och kompatibilitetsförbättringar

Må din Fajr vara välsignad. — Inoxin HA
```

---

## Version 1.0.0 (Build 1) — Initial release

### What's New (App Store Connect — English, primary)

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

### Short version (fits above the "more" fold, ~160 chars)

```text
Welcome to Haya Al-Salat. Wake gently for Fajr with the recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj, accurate prayer times, and Adhan for every prayer.
```

### Promotional text (170 char limit, editable without a new build)

```text
A peaceful Fajr companion. Rise to the recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj, with accurate local prayer times and Adhan for every prayer.
```

### Keywords (100 char limit, comma-separated, no spaces after commas)

```text
fajr,prayer times,islam,quran,adhan,muslim,dawn,reminder,surah,recitation,mukhtar al hajj
```

---

## Localized "What's New" (optional, paste per locale)

### Arabic

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

### Swedish

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

## Template for future releases

Copy this block for the next version and edit the bullets.

```text
Version X.Y.Z

What's new:
• <headline change>
• <improvement>
• <fix>

Thank you for using Haya Al-Salat. — Inoxin HA
```

### Guidelines for future "What's New" entries

- Lead with the single most valuable change; users see ~170 chars before "more".
- Use short bullets, one improvement per line.
- Do NOT list internal refactors, dependency bumps, or build tweaks.
- Do NOT promise features that are not in the submitted build.
- Bump the **Build** number for every upload; bump the **Version** only when the release notes describe user-facing changes.
- Update `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`) to match the version you write here.
