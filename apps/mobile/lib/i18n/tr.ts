import type { Translations } from "./strings";

export const tr: Translations = {
  common: {
    cancel: "İptal",
    done: "Tamam",
    remove: "Sil",
  },
  nav: {
    match: "Eşleşme",
    about: "Hakkında",
  },
  home: {
    eyebrow: "PROJE",
    title: "Synastry",
    tagline: "Teorik mükemmel eşinizin hangi anda doğduğunu bulun.",
  },
  form: {
    title: "Bize kendinizden bahsedin",
    hint: "Doğum tarih ve saatinizi günlük konuşmadaki gibi girin — saat dilimini seçtiğiniz ilçeden biz çözeriz.",
    fields: {
      birthDateWeb: "Doğum tarihi (YYYY-AA-GG)",
      birthDateNative: "Doğum tarihi",
      birthTimeWeb: "Doğum saati (SS:DD, yerel)",
      birthTimeNative: "Doğum saati (yerel)",
      district: "Doğum ilçesi",
    },
    placeholders: {
      birthDate: "1994-10-12",
      birthTime: "17:15",
      districtTrigger: "Bir ilçe seçin…",
      districtSearch: "İlçe veya il ile arayın…",
    },
    button: "✨  Eşimi bul",
    errors: {
      pickDistrict: "Bir doğum ilçesi seçin.",
      addRule: "En az bir kozmik hizalanma ekleyin.",
      dateFormat: "Doğum tarihi YYYY-AA-GG biçiminde olmalı.",
      timeFormat: "Doğum saati SS:DD biçiminde olmalı.",
      latRange: "Enlem -90 ile 90 arasında olmalı.",
      lngRange: "Boylam -180 ile 180 arasında olmalı.",
      apiPrefix: "Sunucu hatası",
      apiUnknown: "Sunucuya ulaşılamadı.",
    },
  },
  districts: {
    title: "Doğum ilçesi",
    empty: "Eşleşme yok.",
    loadFailed: "İlçeler yüklenemedi.",
  },
  advanced: {
    header: "EŞLEŞMEYİ İNCE AYARLA",
    summary: (orb, count) => `±${orb}° · ${count} hizalanma`,
    intro:
      "Kozmik hizalanmalar, anlamlı açılarla duran gezegen çiftleridir. Hangi hizalanmaların önemli olduğunu ve eşleşmenin ne kadar sıkı olacağını seçin.",
    orb: {
      title: "Ne kadar sıkı?",
      hintLine1: "Her hedef derecenin etrafındaki esneme payı.",
      hintLine2:
        "Geniş = daha çok eşleşme ama gevşek; dar = daha az ama daha sıkı.",
    },
    rules: {
      title: "Kozmik hizalanmalar",
      hint: {
        their: "onların gezegeni",
        your: "sizin gezegeniniz",
        tail: " ile bu açıda durur. Tüm hizalanmalar aynı anda sağlanmalıdır.",
      },
      ruleTitle: (n) => `Hizalanma ${n}`,
      add: "＋ Hizalanma ekle",
    },
    chips: {
      their: "Onların",
      at: "açısı",
      toYour: "sizin",
    },
  },
  results: {
    hero: {
      labelPhase3: "✨ Teorik mükemmel eşiniz şu anda doğdu",
      placePrefix: "İlçe:",
      metaPhase3: (matched, total, pairs, ms) =>
        `${total} kozmik hizalanmadan ${matched}'i sağlandı  ·  ${pairs} olasılık ${ms} ms'de tarandı`,
      labelPhase2: "En yakın eşleşme (şehir sabitlenmedi)",
      metaPhase2: (matched, total, orb) =>
        `${total} hizalanmadan ${matched}'i eşleşti · ±${orb}° tolerans`,
    },
    empty: {
      title: "Eşleşme bulunamadı",
      hint: "Tolerans aralığını genişletmeyi, kuralları gevşetmeyi veya daha geniş bir tarih aralığını veriye eklemeyi deneyin.",
    },
    why: {
      title: "NEDEN BU EŞLEŞME",
      subtitle:
        "Eşinizin gezegenleri, sizin astrolojik haritanıza yansıtıldığında bu anlamlı yerlere düşüyor.",
    },
    places: {
      title: (count) => `DİĞER GÜÇLÜ YERLER (${count})`,
      subtitle: "Bu ilçeler de aynı anda haritanızla iyi eşleşiyor.",
      score: (n) => `puan ${n}`,
    },
    sky: {
      title: "DOĞDUĞUNUZ GÖKYÜZÜ",
      subtitle: (localISO, tz) =>
        `Doğduğunuz an her gezegenin nerede olduğunu gösterir — çözüm: ${localISO} (${tz}).`,
    },
    looking: {
      title: "NE ARIYORUZ",
      subtitle:
        "Bunlar, seçtiğiniz kurallara göre haritanızla kozmik hizalanma yaratacak partner-gezegen konumlarıdır.",
      separator: "  ya da  ",
    },
    moments: {
      title: (count) => `DİĞER ANLAR (${count})`,
      subtitle: "Seçtiğiniz hizalanmaları sağlayan diğer doğum anları.",
      score: (n) => `puan ${n}`,
    },
  },
  detail: {
    backLabel: "Sonuçlar",
    heroLabel: "Eşleşme detayı",
    matchChart: {
      title: "EŞİNİZİN GÖKYÜZÜ",
      subtitle: "Bu an doğan birinin natal haritası.",
    },
    yourChart: {
      title: "SİZİN GÖKYÜZÜNÜZ",
      subtitle: "Karşılaştırma için sizin natal haritanız.",
    },
    rulesMatched: {
      title: "SAĞLANAN KURALLAR",
      subtitle: "Eşinizin haritasında sağlanan sinastri kuralları.",
    },
    location: {
      title: "KONUM",
      district: "İlçe",
      coordinates: "Koordinatlar",
    },
    score: {
      title: "PUAN",
      value: (n) => `${n} / toplam`,
    },
    phase2Note: "Bu bir Faz 2 eşleşmesidir — henüz ilçeye sabitlenmemiş, yalnızca zamana dayalı.",
  },
  auth: {
    login: {
      title: "Tekrar hoş geldiniz",
      tagline: "Eşleşmeye devam etmek için giriş yapın.",
      emailLabel: "E-posta",
      emailPlaceholder: "siz@ornek.com",
      passwordLabel: "Şifre",
      passwordPlaceholder: "••••••••",
      submit: "Giriş yap",
      switchToSignup: "Hesabınız yok mu? Kayıt olun",
      errorMissingFields: "E-posta ve şifre gereklidir.",
      errorInvalid: "E-posta veya şifre hatalı.",
      errorGeneric: "Giriş yapılamadı. Sunucuya ulaşılamıyor.",
    },
    signup: {
      title: "Hesap oluştur",
      tagline:
        "Doğum bilgilerinizi bir kez girersiniz, sonra eşleşmek tek tıkla.",
      sectionAccount: "HESAP",
      sectionBirth: "DOĞUM BİLGİLERİ",
      birthHint:
        "Doğum tarih ve saatinizi günlük konuşmadaki gibi girin — saat dilimini ilçeden çözeriz.",
      submit: "Hesap oluştur",
      switchToLogin: "Zaten hesabınız var mı? Giriş yapın",
      errorMissingFields: "Lütfen tüm alanları doldurun.",
      errorPasswordTooShort: "Şifre en az 8 karakter olmalı.",
      errorEmailTaken: "Bu e-posta zaten kayıtlı. Giriş yapın.",
      errorPickDistrict: "Bir doğum ilçesi seçin.",
      errorGeneric: "Hesap oluşturulamadı. Sunucuya ulaşılamıyor.",
    },
    logout: "Çıkış yap",
    loggedInAs: "Giriş yapıldı:",
  },
  about: {
    eyebrow: "HAKKINDA",
    title: "Project Synastry",
    tagline:
      "Astrolojik mükemmel eşinizin doğduğu anı — ve yeri — bulan teorik bir eşleştirme motoru.",
    pipeline: {
      title: "İŞ AKIŞI",
      step1: {
        title: "Küresel Gökyüzü",
        body: "Son 40 yılın 15 dakikalık adımlarla her gezegen konumunu içeren 1,4 milyon satırlık bir Postgres tablosu — Swiss Ephemeris ile bir kez hesaplanır.",
      },
      step2: {
        title: "Altın Dereceler",
        body: "Doğum haritanızdan, klasik sinastri açılarını (üçgen, altmışlık, kavuşum) ±5° tolerans içinde sağlayacak partner-gezegen boylamlarını hesaplarız.",
      },
      step3: {
        title: "Yerel İyileştirme",
        body: "En iyi aday anlar için Türkiye'nin 972 ilçesini gezeriz ve partnerin gezegenlerinin sizin ev sisteminizdeki en uyumlu yerini bulmak için Placidus ev cüsplerini hesaplarız.",
      },
    },
    howToRead: {
      title: "SONUCUNUZU NASIL OKURSUNUZ",
      bullets: [
        "Üstteki kart, en iyi eşleşmenizin tarihi ve ilçesini gösterir.",
        '"Çözüm" satırı, sunucunun ilçenizden seçtiği IANA saat dilimini gösterir. Doğru göründüğünden emin olun.',
        '"Neden bu eşleşme" listesi, eşinizin sağladığı sinastri kurallarını listeler.',
        "Diğer yerler ve diğer anlar, ikinci en iyi eşleşmeleri gösterir.",
      ],
    },
    sources: {
      title: "KAYNAKLAR",
      sweph: "Swiss Ephemeris (sweph)",
      districts: "Türkiye ilçe veri seti",
      tzlookup: "tz-lookup",
    },
    language: {
      title: "DİL",
      subtitle: "Uygulama dilini değiştirin.",
      tr: "Türkçe",
      en: "English",
    },
  },
  planets: {
    sun: "Güneş",
    moon: "Ay",
    mercury: "Merkür",
    venus: "Venüs",
    mars: "Mars",
    jupiter: "Jüpiter",
    saturn: "Satürn",
  },
  aspects: {
    conjunction: "kavuşum",
    sextile: "altmışlık",
    square: "kare",
    trine: "üçgen",
    opposition: "karşıt",
  },
  zodiac: [
    "Koç",
    "Boğa",
    "İkizler",
    "Yengeç",
    "Aslan",
    "Başak",
    "Terazi",
    "Akrep",
    "Yay",
    "Oğlak",
    "Kova",
    "Balık",
  ],
  // "sizin venüsünüz onların 7. evinde" / "onların güneşi sizin 1. evinizde"
  houseRule: ({ planet, house, planetOwner, houseOwner }) =>
    `${planetOwner} ${planet}'i ${houseOwner} ${house}. evinde`,
  localeTag: "tr-TR",
};
