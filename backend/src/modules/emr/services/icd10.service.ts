import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../../cache/cache.service';

export interface Icd10Code {
  code: string;
  name: string;
  nameRu: string;
}

// Common ICD-10 codes used in outpatient clinics
const ICD10_DATABASE: Icd10Code[] = [
  { code: 'J06.9', name: 'Acute upper respiratory infection', nameRu: 'Острая инфекция верхних дыхательных путей' },
  { code: 'J00', name: 'Acute nasopharyngitis', nameRu: 'Острый назофарингит (насморк)' },
  { code: 'J01.0', name: 'Acute maxillary sinusitis', nameRu: 'Острый верхнечелюстной синусит' },
  { code: 'J02.9', name: 'Acute pharyngitis', nameRu: 'Острый фарингит' },
  { code: 'J03.9', name: 'Acute tonsillitis', nameRu: 'Острый тонзиллит' },
  { code: 'J04.0', name: 'Acute laryngitis', nameRu: 'Острый ларингит' },
  { code: 'J18.9', name: 'Pneumonia, unspecified', nameRu: 'Пневмония неуточнённая' },
  { code: 'J20.9', name: 'Acute bronchitis', nameRu: 'Острый бронхит' },
  { code: 'J45.9', name: 'Asthma', nameRu: 'Бронхиальная астма' },
  { code: 'I10', name: 'Essential hypertension', nameRu: 'Эссенциальная гипертензия' },
  { code: 'I11.9', name: 'Hypertensive heart disease', nameRu: 'Гипертензивная болезнь сердца' },
  { code: 'I20.0', name: 'Unstable angina', nameRu: 'Нестабильная стенокардия' },
  { code: 'I25.1', name: 'Atherosclerotic heart disease', nameRu: 'Атеросклеротическая болезнь сердца' },
  { code: 'I48', name: 'Atrial fibrillation and flutter', nameRu: 'Фибрилляция и трепетание предсердий' },
  { code: 'I50.9', name: 'Heart failure', nameRu: 'Сердечная недостаточность' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus', nameRu: 'Сахарный диабет 2 типа' },
  { code: 'E10.9', name: 'Type 1 diabetes mellitus', nameRu: 'Сахарный диабет 1 типа' },
  { code: 'E03.9', name: 'Hypothyroidism', nameRu: 'Гипотиреоз' },
  { code: 'E05.9', name: 'Thyrotoxicosis', nameRu: 'Тиреотоксикоз' },
  { code: 'E78.0', name: 'Pure hypercholesterolemia', nameRu: 'Чистая гиперхолестеринемия' },
  { code: 'K29.7', name: 'Gastritis', nameRu: 'Гастрит' },
  { code: 'K21.0', name: 'GERD with esophagitis', nameRu: 'ГЭРБ с эзофагитом' },
  { code: 'K25.9', name: 'Gastric ulcer', nameRu: 'Язва желудка' },
  { code: 'K26.9', name: 'Duodenal ulcer', nameRu: 'Язва двенадцатиперстной кишки' },
  { code: 'K35.8', name: 'Acute appendicitis', nameRu: 'Острый аппендицит' },
  { code: 'K40.9', name: 'Inguinal hernia', nameRu: 'Паховая грыжа' },
  { code: 'K80.2', name: 'Cholelithiasis', nameRu: 'Желчнокаменная болезнь' },
  { code: 'K81.0', name: 'Acute cholecystitis', nameRu: 'Острый холецистит' },
  { code: 'N10', name: 'Acute pyelonephritis', nameRu: 'Острый пиелонефрит' },
  { code: 'N30.0', name: 'Acute cystitis', nameRu: 'Острый цистит' },
  { code: 'N20.0', name: 'Calculus of kidney', nameRu: 'Камни почки' },
  { code: 'N39.0', name: 'Urinary tract infection', nameRu: 'Инфекция мочевыводящих путей' },
  { code: 'M54.5', name: 'Low back pain', nameRu: 'Боль в нижней части спины' },
  { code: 'M54.2', name: 'Cervicalgia', nameRu: 'Цервикалгия' },
  { code: 'M17.9', name: 'Gonarthrosis', nameRu: 'Гонартроз' },
  { code: 'M16.9', name: 'Coxarthrosis', nameRu: 'Коксартроз' },
  { code: 'M79.3', name: 'Panniculitis', nameRu: 'Панникулит' },
  { code: 'G43.9', name: 'Migraine', nameRu: 'Мигрень' },
  { code: 'G44.2', name: 'Tension-type headache', nameRu: 'Головная боль напряжённого типа' },
  { code: 'G47.0', name: 'Insomnia', nameRu: 'Бессонница' },
  { code: 'F41.1', name: 'Generalized anxiety disorder', nameRu: 'Генерализованное тревожное расстройство' },
  { code: 'F32.0', name: 'Mild depressive episode', nameRu: 'Депрессивный эпизод лёгкой степени' },
  { code: 'L20.9', name: 'Atopic dermatitis', nameRu: 'Атопический дерматит' },
  { code: 'L40.0', name: 'Psoriasis vulgaris', nameRu: 'Вульгарный псориаз' },
  { code: 'L50.0', name: 'Allergic urticaria', nameRu: 'Аллергическая крапивница' },
  { code: 'B35.0', name: 'Tinea barbae and capitis', nameRu: 'Микоз волосистой части головы' },
  { code: 'H10.1', name: 'Acute atopic conjunctivitis', nameRu: 'Острый атопический конъюнктивит' },
  { code: 'H65.0', name: 'Acute serous otitis media', nameRu: 'Острый серозный средний отит' },
  { code: 'H66.0', name: 'Acute suppurative otitis media', nameRu: 'Острый гнойный средний отит' },
  { code: 'D50.9', name: 'Iron deficiency anemia', nameRu: 'Железодефицитная анемия' },
  { code: 'R50.9', name: 'Fever', nameRu: 'Лихорадка' },
  { code: 'R10.4', name: 'Abdominal pain', nameRu: 'Боль в животе' },
  { code: 'R51', name: 'Headache', nameRu: 'Головная боль' },
  { code: 'R05', name: 'Cough', nameRu: 'Кашель' },
  { code: 'Z00.0', name: 'General examination', nameRu: 'Общий осмотр' },
  { code: 'Z01.0', name: 'Examination of eyes', nameRu: 'Обследование глаз' },
  { code: 'Z01.1', name: 'Examination of ears', nameRu: 'Обследование ушей' },
  { code: 'Z34.0', name: 'Early pregnancy supervision', nameRu: 'Наблюдение за ранней беременностью' },
  { code: 'O80', name: 'Single spontaneous delivery', nameRu: 'Одноплодные самопроизвольные роды' },
];

@Injectable()
export class Icd10Service {
  constructor(private readonly cacheService: RedisCacheService) {}

  async search(query: string, limit: number = 20): Promise<Icd10Code[]> {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();

    return this.cacheService.getOrSet(
      `icd10:search:${q}:${limit}`,
      async () =>
        ICD10_DATABASE.filter(
          (item) =>
            item.code.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.nameRu.toLowerCase().includes(q),
        ).slice(0, limit),
      300,
    );
  }

  findByCode(code: string): Icd10Code | undefined {
    return ICD10_DATABASE.find((item) => item.code === code);
  }
}
