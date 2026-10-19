import type { AspectName, PlanetKey } from "@/lib/api";
import type { Translations } from "./strings";

const PLANETS: Record<PlanetKey, string> = {
  sun: "Güneş",
  moon: "Ay",
  mercury: "Merkür",
  venus: "Venüs",
  mars: "Mars",
  jupiter: "Jüpiter",
  saturn: "Satürn",
};

// Possessive forms follow vowel harmony, so they're spelled out per planet
// rather than built with a generic suffix.
/** "Eşinizin Venüs'ü" — the partner's planet. */
const THEIR: Record<PlanetKey, string> = {
  sun: "Güneş'i",
  moon: "Ay'ı",
  mercury: "Merkür'ü",
  venus: "Venüs'ü",
  mars: "Mars'ı",
  jupiter: "Jüpiter'i",
  saturn: "Satürn'ü",
};

/** "Venüs'ünüz" — the user's planet. */
const YOUR: Record<PlanetKey, string> = {
  sun: "Güneş'iniz",
  moon: "Ay'ınız",
  mercury: "Merkür'ünüz",
  venus: "Venüs'ünüz",
  mars: "Mars'ınız",
  jupiter: "Jüpiter'iniz",
  saturn: "Satürn'ünüz",
};

const ASPECTS: Record<AspectName, string> = {
  conjunction: "kavuşum",
  sextile: "altmışlık",
  square: "kare",
  trine: "üçgen",
  opposition: "karşıt",
};

export const tr: Translations = {
  common: {
    cancel: "İptal",
    done: "Tamam",
    remove: "Sil",
    retry: "Tekrar dene",
    save: "Kaydet",
  },
  nav: {
    match: "Eşleşme",
    about: "Hakkında",
  },
  home: {
    eyebrow: "PROJE",
    title: "Synastry",
    tagline: "Teorik mükemmel eşinizin doğduğu anı bulun.",
  },
  form: {
    title: "Eşleşmenizi bulun",
    hint: "Size en uygun kişinin doğduğu anı bulmak için 40 yıllık gökyüzünü tarıyoruz.",
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
      pickDate: "Tarih seçin",
      pickTime: "Saat seçin",
      districtTrigger: "Bir ilçe seçin…",
      districtSearch: "İlçe veya il adıyla arayın…",
    },
    button: "✨  Eşimi bul",
    errors: {
      addRule: "En az bir kozmik hizalanma ekleyin.",
    },
  },
  errors: {
    network: "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edip tekrar deneyin.",
    sessionExpired: "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
    rateLimited: "Çok fazla istek gönderildi. Bir dakika bekleyip tekrar deneyin.",
    server: "Bizim tarafımızda bir sorun oluştu. Lütfen tekrar deneyin.",
    invalidBirth:
      "Bu doğum saati saat diliminizde yok — yaz saati uygulamasında saatler bu anı atlamış. Lütfen saati kontrol edin.",
    generic: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
  },
  districts: {
    title: "Doğum ilçesi",
    empty: "Sonuç yok.",
    loadFailed: "İlçe listesi yüklenemedi.",
  },
  advanced: {
    header: "EŞLEŞMEYİ İNCE AYARLA",
    summary: (orb, count) => `±${orb}° · ${count} hizalanma`,
    intro:
      "Kozmik hizalanmalar, birbirine anlamlı açılarla duran gezegen çiftleridir. Hangi hizalanmaların önemli olduğunu ve eşleşmenin ne kadar sıkı olacağını seçin.",
    reset: "Varsayılanlara dön",
    orb: {
      title: "Ne kadar sıkı?",
      hintLine1: "Her hedef derecenin etrafındaki esneme payı.",
      hintLine2:
        "Geniş = daha çok hizalanma sayılır ama gevşek; dar = yalnızca tama yakın hizalanmalar sayılır.",
    },
    rules: {
      title: "Kozmik hizalanmalar",
      hint: {
        their: "Eşinizin gezegeni",
        tail: "sizinkine bu açıyla durur. Eşleşmeler, tüm hizalanmalara ne kadar yaklaştıklarına göre sıralanır.",
      },
      ruleTitle: (n) => `Hizalanma ${n}`,
      add: "＋ Hizalanma ekle",
    },
    chips: {
      their: "Eşinizin",
      at: "açısı",
      toYour: "sizin",
    },
  },
  results: {
    hero: {
      label: "✨ Teorik mükemmel eşiniz şu tarihte doğdu",
      placePrefix: "📍",
      summary: (aMet, aTotal, hMet, hTotal) =>
        `${aMet}/${aTotal} hizalanma · ${hMet}/${hTotal} ev yerleşimi`,
      fit: (percent) => `Uyum puanı ${percent}/100`,
      hint: "Ayrıntılar için dokunun",
    },
    empty: {
      title: "Eşleşme bulunamadı",
      hint: "40 yıllık gökyüzünde bu hizalanmalara yaklaşan bir an yok. Daha geniş bir tolerans ya da farklı hizalanmalar deneyin.",
    },
    why: {
      title: "NEDEN BU EŞLEŞME",
      subtitle: "Eşinizin gezegenlerinin sizinkilerle nasıl hizalandığı.",
    },
    others: {
      title: (count) => `DİĞER GÜÇLÜ EŞLEŞMELER (${count})`,
      subtitle: "Gökyüzünün önerdiği diğer kişiler — her biri kendisine en uygun doğum yerinde.",
    },
    sky: {
      title: "DOĞDUĞUNUZ ANDAKİ GÖKYÜZÜ",
      subtitle: (localISO, tz) =>
        `Doğduğunuz anda her gezegenin nerede olduğu — ${localISO} (${tz}) olarak hesaplandı.`,
    },
    looking: {
      title: "NE ARIYORUZ",
      subtitle:
        "Seçtiğiniz her hizalanmayı oluşturacak partner gezegeni konumları.",
      separator: "  ya da  ",
    },
    footer: (days, pairs, ms) =>
      `40 yıllık gökyüzünden ${days} aday gün sıralandı, ardından ${pairs} doğum yeri kombinasyonu ${ms} ms'de kontrol edildi.`,
  },
  detail: {
    backLabel: "Sonuçlar",
    heroLabel: "Eşleşme detayı",
    notFound: "Bu eşleşme artık mevcut değil. Aramayı tekrar çalıştırın.",
    fit: {
      title: "UYUM PUANI",
      overall: "Genel",
      aspects: "Hizalanmalar",
      houses: "Ev yerleşimleri",
      explain:
        "Sağlanan her hizalanma veya yerleşim puanının yarısını kazanır; kalanı ne kadar tam olduğuna bağlıdır. Hizalanmalar puanın %60'ını, ev yerleşimleri %40'ını oluşturur.",
    },
    aspects: {
      title: "HİZALANMALAR",
      subtitle: "Seçtiğiniz hizalanmalar ve bu eşleşmenin her birine ne kadar yaklaştığı.",
    },
    houses: {
      title: "EV YERLEŞİMLERİ",
      subtitle: "Bu eşleşmede gerçekleşen klasik sinastri yerleşimleri.",
      none: "Bu eşleşmede ev yerleşimlerinin hiçbiri gerçekleşmiyor — sıralaması hizalanmalarına dayanıyor.",
    },
    matchChart: {
      title: "EŞİNİZİN GÖKYÜZÜ",
      subtitle: "Bu anda doğan birinin doğum haritası.",
    },
    yourChart: {
      title: "SİZİN GÖKYÜZÜNÜZ",
      subtitle: "Karşılaştırma için sizin doğum haritanız.",
    },
    location: {
      title: "DOĞUM",
      district: "İlçe",
      coordinates: "Koordinatlar",
      localTime: "Yerel doğum saati",
      timezone: "Saat dilimi",
    },
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
    },
    signup: {
      title: "Hesap oluşturun",
      tagline: "Doğum bilgilerinizi bir kez girin, sonrası tek dokunuş.",
      sectionAccount: "HESAP",
      sectionBirth: "DOĞUM BİLGİLERİ",
      birthHint:
        "Doğum tarihinizi ve saatinizi bildiğiniz gibi girin — saat dilimini ilçenizden biz buluruz.",
      submit: "Hesap oluştur",
      switchToLogin: "Zaten hesabınız var mı? Giriş yapın",
      errorMissingFields: "Lütfen tüm alanları doldurun.",
      errorPasswordTooShort: "Şifre en az 8 karakter olmalı.",
      errorEmailTaken: "Bu e-posta zaten kayıtlı. Giriş yapın.",
      errorPickBirth: "Doğum tarihinizi ve saatinizi seçin.",
      errorPickDistrict: "Bir doğum ilçesi seçin.",
      errorInvalid: "Lütfen e-posta adresinizi ve doğum bilgilerinizi kontrol edin.",
    },
    logout: "Çıkış yap",
    loggedInAs: "Giriş yapıldı:",
  },
  account: {
    title: "HESAP",
    editBirth: "Doğum bilgilerini düzenle",
    deleteTitle: "Hesabı sil",
    deleteWarning:
      "Bu işlem hesabınızı ve doğum bilgilerinizi kalıcı olarak siler. Geri alınamaz.",
    deletePasswordLabel: "Onaylamak için şifrenizi girin",
    deleteConfirm: "Hesabımı kalıcı olarak sil",
    wrongPassword: "Şifre hatalı.",
  },
  profile: {
    title: "Doğum bilgileri",
    subtitle: "Eşleşmeleriniz bu bilgilerden hesaplanır. Kaydettiğinizde haritanız yeniden hesaplanır.",
    saved: "Kaydedildi — haritanız güncellendi.",
  },
  about: {
    eyebrow: "HAKKINDA",
    title: "Project Synastry",
    tagline:
      "Astrolojik mükemmel eşinizin doğduğu anı — ve yeri — bulan teorik bir eşleştirme motoru.",
    pipeline: {
      title: "NASIL ÇALIŞIR",
      step1: {
        title: "Küresel Gökyüzü",
        body: "Son 40 yılda her gezegenin 15 dakikalık adımlarla konumunu tutan 1,4 milyon satırlık bir tablo — Swiss Ephemeris ile bir kez hesaplanır.",
      },
      step2: {
        title: "Altın Dereceler",
        body: "Doğum haritanızdan, bir partnerin gezegenlerinin sizinkilerle klasik sinastri açıları oluşturması için nerede olması gerektiğini hesaplarız; sonra bu 40 yıldaki her anı bu konumlara ne kadar yaklaştığına göre puanlarız. ±3° içi sayılır; tam açı en yüksek puanı alır.",
      },
      step3: {
        title: "Yerel İyileştirme",
        body: "En iyi 30 gün için Türkiye'nin 972 ilçesini tek tek gezer, her birinde partnerin Placidus evlerini hesaplar ve evleri haritanıza en iyi uyan doğum yerini seçeriz.",
      },
    },
    howToRead: {
      title: "SONUCUNUZU NASIL OKURSUNUZ",
      bullets: [
        "Üstteki kart en iyi eşleşmenizi gösterir: ne zaman ve nerede doğduğunu, kaç hizalanma ve ev yerleşiminin tuttuğunu.",
        "Eşleşmeler elenmez, sıralanır: tüm hizalanmaları gevşek sağlayan biri, yalnızca birini tam sağlayan birinin önüne geçebilir.",
        "Tüm ayrıntılar için herhangi bir eşleşmeye dokunun — her hizalanmanın tam açıdan ne kadar saptığını ve hangi ev yerleşimlerinin tuttuğunu görürsünüz.",
        '"Hesaplandı" satırı, doğum ilçenizden seçtiğimiz saat dilimini gösterir. Doğru göründüğünden emin olun.',
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
  planets: PLANETS,
  aspects: ASPECTS,
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
  // "Eşinizin Venüs'ü 7. evinizde" / "Güneş'iniz eşinizin 7. evinde"
  houseRule: ({ planetOf, planet, houseOf, house }) => {
    const subject = planetOf === "other" ? `Eşinizin ${THEIR[planet]}` : YOUR[planet];
    const where =
      houseOf === "self"
        ? `${house}. evinizde`
        : planetOf === "other"
          ? `kendi ${house}. evinde`
          : `eşinizin ${house}. evinde`;
    return `${subject} ${where}`;
  },
  // "Eşinizin Ay'ı ile Güneş'iniz arasında üçgen açı"
  aspectRule: ({ self, aspect, other }) => {
    const angle = aspect === "conjunction" ? ASPECTS.conjunction : `${ASPECTS[aspect]} açı`;
    return `Eşinizin ${THEIR[other]} ile ${YOUR[self]} arasında ${angle}`;
  },
  aspectDistance: (degrees, inOrb) => {
    const deg = degrees.toFixed(1).replace(".", ",");
    if (!inOrb) return `${deg}° uzakta — tolerans dışında`;
    return degrees < 0.05 ? "tam açı" : `tam açıdan ${deg}° sapma`;
  },
  localeTag: "tr-TR",
};
