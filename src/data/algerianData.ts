import { Wilaya, BookListing, User, EducationLevel } from '../types';

export const WILAYAS: Wilaya[] = [
  { code: 1, nameAr: "أدرار", nameFr: "Adrar", municipalities: ["أدرار", "تيميمون", "رقان", "أولف", "زاوية كنتة", "تمنطيط"] },
  { code: 2, nameAr: "الشلف", nameFr: "Chlef", municipalities: ["الشلف", "تنس", "بوقادير", "وادي الفضة", "أولاد فارس", "عين مران", "الشرفة"] },
  { code: 3, nameAr: "الأغواط", nameFr: "Laghouat", municipalities: ["الأغواط", "أفلو", "قصر الحيران", "عين ماضي", "سيدي مخلوف", "حاسي الرمل"] },
  { code: 4, nameAr: "أم البواقي", nameFr: "Oum El Bouaghi", municipalities: ["أم البواقي", "عين البيضاء", "عين مليلة", "مسكيانة", "سيقوس", "عين فكرون"] },
  { code: 5, nameAr: "باتنة", nameFr: "Batna", municipalities: ["باتنة", "بريكة", "عين التوتة", "مروانة", "أريس", "المعذر", "تازولت", "نقاؤوس"] },
  { code: 6, nameAr: "بجاية", nameFr: "Béjaïa", municipalities: ["بجاية", "أقبو", "أميزور", "سيدي عيش", "خراطة", "القصر", "تيزي نبشار", "سوق الاثنين"] },
  { code: 7, nameAr: "بسكرة", nameFr: "Biskra", municipalities: ["بسكرة", "طولقة", "سيدي عقبة", "أولاد جلال", "الزيبان", "فوغالة", "القنطرة"] },
  { code: 8, nameAr: "بشار", nameFr: "Béchar", municipalities: ["بشار", "القنادسة", "بني عباس", "تاغيت", "العبادلة", "تبلبالة"] },
  { code: 9, nameAr: "البليدة", nameFr: "Blida", municipalities: ["البليدة", "بوفاريك", "أولاد يعيش", "العفرون", "موزاية", "بوقرة", "الأربعاء", "وادي العلايق", "الشفة"] },
  { code: 10, nameAr: "البويرة", nameFr: "Bouira", municipalities: ["البويرة", "الأخضرية", "سور الغزلان", "عين بسام", "مشدالة", "بئر غبالو", "القادرية"] },
  { code: 11, nameAr: "تمنراست", nameFr: "Tamanrasset", municipalities: ["تمنراست", "عين صالح", "عين قزام", "أباليسا", "تازروك", "إدلس"] },
  { code: 12, nameAr: "تبسة", nameFr: "Tébessa", municipalities: ["تبسة", "بئر العاتر", "الشريعة", "الونزة", "العوينات", "مرسط", "الماء الأبيض"] },
  { code: 13, nameAr: "تلمسان", nameFr: "Tlemcen", municipalities: ["تلمسان", "مغنية", "منصورة", "شتوان", "الغزوات", "سبدو", "الرمشي", "ندرومة", "الحناية"] },
  { code: 14, nameAr: "تيارت", nameFr: "Tiaret", municipalities: ["تيارت", "السوقر", "فرندة", "قصر الشلالة", "مهدية", "الرحوية", "حمادية"] },
  { code: 15, nameAr: "تيزي وزو", nameFr: "Tizi Ouzou", municipalities: ["تيزي وزو", "عزازقة", "ذراع بن خدة", "بوغني", "الأربعاء ناث إيراثن", "واقنون", "تيقزيرت", "أزفون"] },
  { code: 16, nameAr: "الجزائر", nameFr: "Alger", municipalities: ["باب الزوار", "القبة", "حيدرة", "الجزائر الوسطى", "بئر مراد رايس", "الحراش", "الرويبة", "زرالدة", "الشراقة", "برج الكيفان", "بئر خادم", "عين النعجة", "الأبيار", "عين البنيان", "باب الوادي", "الدرارية", "الدويرة", "باش جراح"] },
  { code: 17, nameAr: "الجلفة", nameFr: "Djelfa", municipalities: ["الجلفة", "عين وسارة", "مسعد", "حاسي بحبح", "دار الشيوخ", "الشارف", "الإدريسية"] },
  { code: 18, nameAr: "جيجل", nameFr: "Jijel", municipalities: ["جيجل", "طاهير", "الميلية", "العوانة", "زيامة منصورية", "الشقفة", "العنصر"] },
  { code: 19, nameAr: "سطيف", nameFr: "Sétif", municipalities: ["سطيف", "العلمة", "عين ولمان", "عين أرنات", "بوقاعة", "عين الكبيرة", "جميلة", "صالح باي"] },
  { code: 20, nameAr: "سعيدة", nameFr: "Saïda", municipalities: ["سعيدة", "عين الحجر", "يوب", "الحساسنة", "أولاد خالد", "سيدي بوبكر"] },
  { code: 21, nameAr: "سكيكدة", nameFr: "Skikda", municipalities: ["سكيكدة", "عزابة", "القل", "الحروش", "تمالوس", "رمضان جمال", "بن عزوز"] },
  { code: 22, nameAr: "سيدي بلعباس", nameFr: "Sidi Bel Abbès", municipalities: ["سيدي بلعباس", "تلاغ", "سفيزف", "بن باديس", "سيدي لحسن", "تسالة", "عين البرد"] },
  { code: 23, nameAr: "عنابة", nameFr: "Annaba", municipalities: ["عنابة", "البوني", "سيدي عمار", "الحجار", "برحال", "عين الباردة", "سرايدي"] },
  { code: 24, nameAr: "قالمة", nameFr: "Guelma", municipalities: ["قالمة", "وادي الزناتي", "بوشقوف", "هيليوبوليس", "حمام دباغ", "بلخير"] },
  { code: 25, nameAr: "قسنطينة", nameFr: "Constantine", municipalities: ["قسنطينة", "الخروب", "علي منجلي", "حامة بوزيان", "ديدوش مراد", "زيغود يوسف", "ابن باديس"] },
  { code: 26, nameAr: "المدية", nameFr: "Médéa", municipalities: ["المدية", "البرواقية", "قصر البخاري", "بني سليمان", "تابلاط", "العمارية", "وزرة"] },
  { code: 27, nameAr: "مستغانم", nameFr: "Mostaganem", municipalities: ["مستغانم", "عين تدلس", "سيدي علي", "حاسي مماش", "خير الدين", "بوقيرات", "ماسرة"] },
  { code: 28, nameAr: "المسيلة", nameFr: "M'Sila", municipalities: ["المسيلة", "بوسعادة", "سيدي عيسى", "عين الحجل", "مقرة", "حمام الضلعة", "أولاد دراج"] },
  { code: 29, nameAr: "معسكر", nameFr: "Mascara", municipalities: ["معسكر", "سيق", "تيغنيف", "المحمدية", "غريس", "وادي الأبطال", "زهانة"] },
  { code: 30, nameAr: "ورقلة", nameFr: "Ouargla", municipalities: ["ورقلة", "تقرت", "حاسي مسعود", "الطيبات", "سيدي خويلد", "الرويسات", "النزلة"] },
  { code: 31, nameAr: "وهران", nameFr: "Oran", municipalities: ["وهران", "السانية", "بئر الجير", "عين الترك", "أرزيو", "قديل", "بطيوة", "الكرمة", "المرسى الكبير"] },
  { code: 32, nameAr: "البيض", nameFr: "El Bayadh", municipalities: ["البيض", "الأبيض سيدي الشيخ", "بوقطب", "بريزينة", "الرقاصة", "الكاف الأحمر"] },
  { code: 33, nameAr: "إليزي", nameFr: "Illizi", municipalities: ["إليزي", "جانت", "إن أميناس", "برج عمر إدريس", "دبداب"] },
  { code: 34, nameAr: "برج بوعريريج", nameFr: "Bordj Bou Arreridj", municipalities: ["برج بوعريريج", "رأس الوادي", "برج زمورة", "المنصورة", "مجانة", "الحمادية", "عين تاغروت"] },
  { code: 35, nameAr: "بومرداس", nameFr: "Boumerdès", municipalities: ["بومرداس", "برج منايل", "دلس", "يسر", "الثنية", "بودواو", "خميس الخشنة", "الناصرية", "زموري"] },
  { code: 36, nameAr: "الطارف", nameFr: "El Tarf", municipalities: ["الطارف", "القالة", "الذرعان", "بوثلجة", "بن مهيدي", "بوحجار", "الشط"] },
  { code: 37, nameAr: "تندوف", nameFr: "Tindouf", municipalities: ["تندوف", "أم العسل"] },
  { code: 38, nameAr: "تسمسيلت", nameFr: "Tissemsilt", municipalities: ["تسمسيلت", "ثنية الحد", "برج بونعامة", "خميستي", "لرجام", "الأزهرية"] },
  { code: 39, nameAr: "الوادي", nameFr: "El Oued", municipalities: ["الوادي", "قمار", "الدبيلة", "الرقيبة", "جامعة", "المقرن", "الرباح", "طالب العربي"] },
  { code: 40, nameAr: "خنشلة", nameFr: "Khenchela", municipalities: ["خنشلة", "ششار", "قايس", "بابار", "بوحمامة", "الحامة", "عين الطويلة"] },
  { code: 41, nameAr: "سوق أهراس", nameFr: "Souk Ahras", municipalities: ["سوق أهراس", "سدراتة", "مداوروش", "تاورة", "المشروحة", "بئر بوحوش", "أولاد دريس"] },
  { code: 42, nameAr: "تيبازة", nameFr: "Tipaza", municipalities: ["تيبازة", "شرشال", "القليعة", "حجوط", "بوسماعيل", "فوكة", "الداموس", "قوراية", "سيدي غيلاس"] },
  { code: 43, nameAr: "ميلة", nameFr: "Mila", municipalities: ["ميلة", "شلغوم العيد", "فرجيوة", "تاجنانت", "قرارم قوقة", "سيدي مروان", "عين التين"] },
  { code: 44, nameAr: "عين الدفلى", nameFr: "Aïn Defla", municipalities: ["عين الدفلى", "خميس مليانة", "مليانة", "العطاف", "العبادية", "جليدة", "بوراشد"] },
  { code: 45, nameAr: "النعامة", nameFr: "Naâma", municipalities: ["النعامة", "المشرية", "عين الصفراء", "مكمن بن عمار", "عسلة", "صفيصيفة"] },
  { code: 46, nameAr: "عين تموشنت", nameFr: "Aïn Témouchent", municipalities: ["عين تموشنت", "بني صاف", "حمام بوحجر", "العامرية", "عين الأربعاء", "المالح"] },
  { code: 47, nameAr: "غرداية", nameFr: "Ghardaïa", municipalities: ["غرداية", "بني يزقن", "القرارة", "بريان", "متليلي", "العطف", "ضاية بن ضحوة"] },
  { code: 48, nameAr: "غليزان", nameFr: "Relizane", municipalities: ["غليزان", "وادي ارهيو", "مازونة", "عمي موسى", "زمورة", "يلل", "المطمر"] },
  { code: 49, nameAr: "تيميمون", nameFr: "Timimoun", municipalities: ["تيميمون", "أوقروت", "شروين", "تينركوك", "قصر قدور"] },
  { code: 50, nameAr: "برج باجي مختار", nameFr: "Bordj Badji Mokhtar", municipalities: ["برج باجي مختار", "تيمياوين"] },
  { code: 51, nameAr: "أولاد جلال", nameFr: "Ouled Djellal", municipalities: ["أولاد جلال", "سيدي خالد", "البسباس", "رأس الميعاد"] },
  { code: 52, nameAr: "بني عباس", nameFr: "Béni Abbès", municipalities: ["بني عباس", "كرزاز", "الواتة", "إقلي", "طالمين"] },
  { code: 53, nameAr: "عين صالح", nameFr: "In Salah", municipalities: ["عين صالح", "فقارة الزاوية", "إينغر"] },
  { code: 54, nameAr: "عين قزام", nameFr: "In Guezzam", municipalities: ["عين قزام", "تين زواتين"] },
  { code: 55, nameAr: "تقرت", nameFr: "Touggourt", municipalities: ["تقرت", "الطيبات", "تماسين", "المقارين", "النزلة", "بلدة عمر"] },
  { code: 56, nameAr: "جانت", nameFr: "Djanet", municipalities: ["جانت", "برج الحواس"] },
  { code: 57, nameAr: "المغير", nameFr: "El M'Ghair", municipalities: ["المغير", "جامعة", "أم الطيور", "سيدي خليل"] },
  { code: 58, nameAr: "المنيعة", nameFr: "El Meniaa", municipalities: ["المنيعة", "حاسي القارة", "حاسي الفحل"] },
  { code: 59, nameAr: "أفلو", nameFr: "Aflou", municipalities: ["أفلو", "سيدي بوزيد", "الغيشة", "تاويالة", "وادي مرة", "سبقاق", "بريدة"] },
  { code: 60, nameAr: "بريكة", nameFr: "Barika", municipalities: ["بريكة", "أمدوكال", "بيطام", "سفيان", "الجزار", "أولاد عمار"] },
  { code: 61, nameAr: "قصر الشلالة", nameFr: "Ksar Chellala", municipalities: ["قصر الشلالة", "سرغين", "زمالة الأمير عبد القادر", "مدروسة", "الرشايقة"] },
  { code: 62, nameAr: "عين وسارة", nameFr: "Aïn Oussera", municipalities: ["عين وسارة", "حاسي بحبح", "بنهار", "القرنيني", "البيرين", "بويرة الأحداب"] },
  { code: 63, nameAr: "مسعد", nameFr: "Messaad", municipalities: ["مسعد", "فيض البطمة", "دلدول", "سليم", "قطارة", "عمورة", "أم العظام"] },
  { code: 64, nameAr: "بوسعادة", nameFr: "Boussaâda", municipalities: ["بوسعادة", "المعاضيد", "الهامل", "ولتام", "خبانة", "بن سرور", "سيدي عامر"] },
  { code: 65, nameAr: "الأبيض سيدي الشيخ", nameFr: "El Abiodh Sidi Cheikh", municipalities: ["الأبيض سيدي الشيخ", "بريزينة", "البنود", "عين العراك", "بوسمغون", "أربوات"] },
  { code: 66, nameAr: "القنطرة", nameFr: "El Kantara", municipalities: ["القنطرة", "عين زعطوط", "لوطاية", "جمورة", "البرنس"] },
  { code: 67, nameAr: "بئر العاتر", nameFr: "Bir El Ater", municipalities: ["بئر العاتر", "صفصاف الوسرى", "أم علي", "العقلة", "فركان", "سطح قنطيس"] },
  { code: 68, nameAr: "قصر البخاري", nameFr: "Ksar El Boukhari", municipalities: ["قصر البخاري", "بوغزول", "سانق", "عزيز", "المفاتحة", "الشهبونية", "أم الجليل"] },
  { code: 69, nameAr: "العريشة", nameFr: "El Aricha", municipalities: ["العريشة", "القور", "بوحلو", "سيدي الجيلالي", "البويهي"] }
];

export const EDUCATION_LEVELS: { id: EducationLevel; labelAr: string; labelFr: string; desc: string; iconName: string; color: string }[] = [
  { id: 'primary', labelAr: "الابتدائي", labelFr: "Primaire", desc: "من السنة الأولى إلى الخامسة ابتدائي (1AP - 5AP)", iconName: "Backpack", color: "from-amber-500 to-orange-500" },
  { id: 'middle', labelAr: "المتوسط (BEM)", labelFr: "Moyen (BEM)", desc: "من السنة الأولى إلى الرابعة متوسط (1AM - 4AM)", iconName: "GraduationCap", color: "from-blue-600 to-indigo-600" },
  { id: 'secondary', labelAr: "الثانوي (BAC)", labelFr: "Secondaire (BAC)", desc: "من السنة الأولى إلى الثالثة ثانوي لجميع الشعب (1AS - 3AS)", iconName: "Award", color: "from-brand-600 to-teal-700" },
  { id: 'university', labelAr: "الجامعي والمهني", labelFr: "Universitaire", desc: "كتب وتخصصات ليسانس، ماستر، طب، وشبه طبي", iconName: "Building2", color: "from-purple-600 to-violet-700" },
  { id: 'general', labelAr: "معاجم ولغات وقراءة", labelFr: "Général & Langues", desc: "روايات، قواميس، كتب اللغات والتنمية", iconName: "BookOpen", color: "from-rose-600 to-pink-600" }
];

export const GRADES_BY_LEVEL: Record<EducationLevel, { code: string; nameAr: string; nameFr: string }[]> = {
  primary: [
    { code: "prep", nameAr: "القسم التحضيري", nameFr: "Préparatoire" },
    { code: "1ap", nameAr: "السنة 1 ابتدائي", nameFr: "1ère AP" },
    { code: "2ap", nameAr: "السنة 2 ابتدائي", nameFr: "2ème AP" },
    { code: "3ap", nameAr: "السنة 3 ابتدائي", nameFr: "3ème AP" },
    { code: "4ap", nameAr: "السنة 4 ابتدائي", nameFr: "4ème AP" },
    { code: "5ap", nameAr: "السنة 5 ابتدائي", nameFr: "5ème AP" },
  ],
  middle: [
    { code: "1am", nameAr: "السنة 1 متوسط", nameFr: "1ère AM" },
    { code: "2am", nameAr: "السنة 2 متوسط", nameFr: "2ème AM" },
    { code: "3am", nameAr: "السنة 3 متوسط", nameFr: "3ème AM" },
    { code: "4am", nameAr: "السنة 4 متوسط (BEM)", nameFr: "4ème AM (BEM)" },
  ],
  secondary: [
    { code: "1as", nameAr: "السنة 1 ثانوي (جذع مشترك)", nameFr: "1ère AS" },
    { code: "2as", nameAr: "السنة 2 ثانوي", nameFr: "2ème AS" },
    { code: "3as", nameAr: "السنة 3 ثانوي (بكالوريا BAC)", nameFr: "3ème AS (BAC)" },
  ],
  university: [
    { code: "l1_l2", nameAr: "ليسانس (L1 / L2)", nameFr: "Licence (L1 / L2)" },
    { code: "l3_m1_m2", nameAr: "ليسانس 3 و ماستر", nameFr: "L3 & Master" },
    { code: "med", nameAr: "الطب والصيدلة والشبه طبي", nameFr: "Médecine & Santé" },
    { code: "tech", nameAr: "مدارس عليا وتكنولوجيا", nameFr: "Grandes Écoles & ST" },
  ],
  general: [
    { code: "lang", nameAr: "تعلم اللغات وقواميس", nameFr: "Langues & Dictionnaires" },
    { code: "lit", nameAr: "روايات وأدب", nameFr: "Romans & Littérature" },
    { code: "culture", nameAr: "ثقافة عامة وكتب أطفال", nameFr: "Culture & Jeunesse" }
  ]
};

export const STREAMS = [
  "شعبة علوم تجريبية",
  "شعبة تقني رياضي (هندسة ميكانيكية/كهربائية/مدنية/طرائق)",
  "شعبة رياضيات",
  "شعبة آداب وفلسفة",
  "شعبة لغات أجنبية (فرنسية/إنجليزية/إسبانية/ألمانية/إيطالية)",
  "شعبة تسيير واقتصاد",
  "جذع مشترك علوم وتكنولوجيا",
  "جذع مشترك آداب"
];

export const SUBJECTS_BY_LEVEL: Record<EducationLevel, string[]> = {
  primary: [
    "كتابي في القراءة واللغة العربية",
    "الرياضيات والتربية العلمية",
    "التربية الإسلامية والمدنية",
    "دفتر الأنشطة اللغوية والرياضيات",
    "اللغة الفرنسية",
    "اللغة الإنجليزية (الرابعة والخامسة)",
    "التاريخ والجغرافيا",
    "حزمة كتب المستوى كاملة"
  ],
  middle: [
    "الرياضيات",
    "العلوم الفيزيائية والتكنولوجيا",
    "علوم الطبيعة والحياة",
    "اللغة العربية وقواعدها",
    "اللغة الفرنسية",
    "اللغة الإنجليزية",
    "التاريخ والجغرافيا",
    "التربية الإسلامية والمدنية",
    "الإعلام الآلي والموسيقى",
    "سلسلة تمارين ومواضيع BEM محلولة"
  ],
  secondary: [
    "الرياضيات",
    "العلوم الفيزيائية",
    "علوم الطبيعة والحياة",
    "الفلسفة",
    "اللغة العربية وآدابها",
    "اللغة الفرنسية",
    "اللغة الإنجليزية",
    "التاريخ والجغرافيا",
    "العلوم الإسلامية",
    "التسيير المحاسبي والمالي والاقتصاد",
    "الهندسة الكهربائية",
    "الهندسة الميكانيكية",
    "الهندسة المدنية",
    "هندسة الطرائق",
    "حوليات ومواضيع بكالوريا سابقة"
  ],
  university: [
    "الرياضيات والتحليل والجبر (Analyse & Algèbre)",
    "الفيزياء والكيمياء الجامعية",
    "الإعلام الآلي والبرمجة (Informatique & Algo)",
    "الطب والتشريح (Anatomie & Physiologie)",
    "القانون والعلوم السياسية (Droit)",
    "العلوم الاقتصادية والتجارية",
    "اللغات والترجمة",
    "الهندسة المعمارية والعمران"
  ],
  general: [
    "قواميس ومعاجم (عربي - فرنسي - إنجليزي)",
    "كتب تعلم الفرنسية والإنجليزية من الصفر",
    "روايات الأدب الجزائري والعالمي",
    "قصص وكتب أطفال مصورة",
    "كتب التنمية وتطوير الذات"
  ]
};
