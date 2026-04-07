"""
Legacy patient instruction seed data — migrated from instruc1–9.doc.

Use `get_seed_instructions()` to obtain a list of dicts suitable for
inserting into the `patient_instructions` table via the API or a seed script.

Each entry maps to the PatientInstruction DB model columns:
  title_en, title_ar, content_en, content_ar, category, sort_order
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class _SeedInstruction:
    sort_order: int
    category: str
    title_en: str
    title_ar: str
    content_en: str  # newline-separated paragraphs/bullets
    content_ar: str


# ---------------------------------------------------------------------------
# Legacy instruction catalogue (instruc1-9.doc)
# Each content field uses one bullet point per line.
# ---------------------------------------------------------------------------
_SEED: list[_SeedInstruction] = [
    # 1 — Basic health rules
    _SeedInstruction(
        sort_order=1,
        category="general",
        title_en="Basic Health Rules",
        title_ar="القواعد الأساسية للحياة الصحية",
        content_en=(
            "Maintain a healthy, balanced diet low in saturated fats, trans fats, and cholesterol.\n"
            "Eat plenty of fruits, vegetables, and whole grains.\n"
            "Limit salt intake to less than 5 g per day (about 1 teaspoon).\n"
            "Maintain a healthy body weight (BMI 18.5–24.9).\n"
            "Engage in at least 30 minutes of moderate physical activity most days of the week.\n"
            "Avoid smoking and exposure to secondhand smoke.\n"
            "Limit alcohol consumption.\n"
            "Manage stress through relaxation techniques, adequate sleep, and social support.\n"
            "Take all prescribed medications as directed and attend regular follow-up appointments."
        ),
        content_ar=(
            "حافظ على نظام غذائي صحي متوازن قليل الدهون المشبعة والمتحولة والكولسترول.\n"
            "تناول الكثير من الفواكه والخضروات والحبوب الكاملة.\n"
            "قلل تناول الملح إلى أقل من ٥ جرام يومياً (حوالي ملعقة صغيرة).\n"
            "حافظ على وزن صحي (مؤشر كتلة الجسم ١٨.٥ – ٢٤.٩).\n"
            "مارس ٣٠ دقيقة على الأقل من النشاط البدني المعتدل معظم أيام الأسبوع.\n"
            "تجنب التدخين والتعرض للتدخين السلبي.\n"
            "قلل من تناول الكحول.\n"
            "تعامل مع الضغوط النفسية من خلال تقنيات الاسترخاء والنوم الكافي والدعم الاجتماعي.\n"
            "تناول جميع الأدوية الموصوفة حسب التوجيهات واحرص على المتابعة الدورية مع الطبيب."
        ),
    ),

    # 2 — Exercise guidelines for cardiac patients
    _SeedInstruction(
        sort_order=2,
        category="exercise",
        title_en="Exercise Guidelines for Cardiac Patients",
        title_ar="القواعد الأساسية لممارسة الرياضة البدنية",
        content_en=(
            "Always warm up for 5–10 minutes before exercise and cool down afterwards.\n"
            "Start slowly and gradually increase duration and intensity.\n"
            "Walking is the safest and most recommended exercise — aim for 30 minutes, 5 days a week.\n"
            "Avoid exercising in extreme heat or cold.\n"
            "Stop exercising immediately if you feel chest pain, dizziness, severe shortness of breath, or an irregular heartbeat.\n"
            "Avoid heavy lifting or straining (isometric exercises) unless cleared by your doctor.\n"
            "Do not exercise within 1–2 hours after a large meal.\n"
            "Stay well hydrated during exercise.\n"
            "Carry your GTN (nitroglycerin) spray/tablets if prescribed.\n"
            "Report any new symptoms during exercise to your doctor promptly."
        ),
        content_ar=(
            "قم دائماً بالإحماء لمدة ٥–١٠ دقائق قبل التمرين والتبريد بعده.\n"
            "ابدأ ببطء وزد المدة والشدة تدريجياً.\n"
            "المشي هو أكثر التمارين أماناً وينصح به — استهدف ٣٠ دقيقة، ٥ أيام في الأسبوع.\n"
            "تجنب ممارسة الرياضة في درجات الحرارة المرتفعة أو المنخفضة جداً.\n"
            "توقف فوراً عن التمرين إذا شعرت بألم في الصدر أو دوخة أو ضيق شديد في التنفس أو عدم انتظام ضربات القلب.\n"
            "تجنب رفع الأثقال أو الإجهاد الشديد إلا بعد موافقة الطبيب.\n"
            "لا تمارس الرياضة خلال ١–٢ ساعة بعد وجبة كبيرة.\n"
            "حافظ على شرب الماء أثناء التمرين.\n"
            "احمل بخاخ أو أقراص النيتروجليسرين إذا كانت موصوفة لك.\n"
            "أبلغ طبيبك فوراً بأي أعراض جديدة أثناء التمرين."
        ),
    ),

    # 3 — Low-fat diet plan
    _SeedInstruction(
        sort_order=3,
        category="diet",
        title_en="Low-Fat Diet Plan",
        title_ar="نظام غذائي قليل الدهن",
        content_en=(
            "Choose lean meats (chicken without skin, fish) and limit red meat to twice a week.\n"
            "Use olive oil or sunflower oil instead of butter, ghee, or palm oil.\n"
            "Choose low-fat or fat-free dairy products.\n"
            "Eat grilled, baked, or steamed food instead of fried.\n"
            "Increase intake of legumes (lentils, beans) as a protein source.\n"
            "Avoid processed meats (sausages, luncheon meat, pastrami).\n"
            "Eat at least 5 portions of fruits and vegetables daily.\n"
            "Read food labels — avoid items with >5 g fat per 100 g.\n"
            "Limit egg yolks to 3 per week; egg whites are unrestricted.\n"
            "Avoid full-fat cheese; choose cottage cheese or low-fat white cheese."
        ),
        content_ar=(
            "اختر اللحوم الخالية من الدهون (الدجاج بدون جلد، الأسماك) وقلل اللحوم الحمراء لمرتين أسبوعياً.\n"
            "استخدم زيت الزيتون أو زيت عباد الشمس بدلاً من الزبدة أو السمن أو زيت النخيل.\n"
            "اختر منتجات الألبان قليلة أو خالية الدسم.\n"
            "تناول الطعام المشوي أو المخبوز أو المطهو على البخار بدلاً من المقلي.\n"
            "زد من تناول البقوليات (العدس، الفاصوليا) كمصدر للبروتين.\n"
            "تجنب اللحوم المصنعة (السجق، اللانشون، البسطرمة).\n"
            "تناول ٥ حصص على الأقل من الفواكه والخضروات يومياً.\n"
            "اقرأ ملصقات الطعام — تجنب المنتجات التي تحتوي على أكثر من ٥ جم دهون لكل ١٠٠ جم.\n"
            "قلل صفار البيض إلى ٣ في الأسبوع؛ بياض البيض غير محدود.\n"
            "تجنب الجبن كامل الدسم؛ اختر الجبن القريش أو الجبن الأبيض قليل الدسم."
        ),
    ),

    # 4 — Warfarin medication guidelines
    _SeedInstruction(
        sort_order=4,
        category="medication",
        title_en="Warfarin (Blood Thinner) Guidelines",
        title_ar="إرشادات أدوية السيولة (الوارفارين)",
        content_en=(
            "Take Warfarin at the same time every day, preferably in the evening.\n"
            "Never change the dose without consulting your doctor.\n"
            "Attend all scheduled INR blood tests (at least monthly or as directed).\n"
            "Maintain a consistent diet — avoid sudden large changes in vitamin K intake (green leafy vegetables).\n"
            "Avoid cranberry juice and grapefruit juice in large amounts.\n"
            "Inform any doctor, dentist, or pharmacist that you are on Warfarin before any procedure or new medication.\n"
            "Avoid aspirin, ibuprofen, and other NSAIDs unless prescribed by your cardiologist.\n"
            "Watch for signs of bleeding: unusual bruising, blood in urine or stool, prolonged bleeding from cuts, nosebleeds, blood in vomit.\n"
            "Seek emergency care if you experience severe headache, confusion, or vomiting blood.\n"
            "Carry a medical alert card or wear a medical bracelet indicating you take Warfarin."
        ),
        content_ar=(
            "تناول الوارفارين في نفس الوقت كل يوم، ويفضل في المساء.\n"
            "لا تغير الجرعة أبداً دون استشارة الطبيب.\n"
            "احرص على جميع تحاليل INR المجدولة (شهرياً على الأقل أو حسب توجيهات الطبيب).\n"
            "حافظ على نظام غذائي ثابت — تجنب التغييرات المفاجئة الكبيرة في تناول فيتامين ك (الخضروات الورقية الخضراء).\n"
            "تجنب عصير التوت البري وعصير الجريب فروت بكميات كبيرة.\n"
            "أخبر أي طبيب أو طبيب أسنان أو صيدلي بأنك تتناول الوارفارين قبل أي إجراء أو دواء جديد.\n"
            "تجنب الأسبرين والإيبوبروفين ومضادات الالتهاب غير الستيرويدية إلا إذا وصفها طبيب القلب.\n"
            "راقب علامات النزيف: كدمات غير طبيعية، دم في البول أو البراز، نزيف مطول من الجروح، نزيف الأنف، دم في القيء.\n"
            "اطلب الرعاية الطارئة إذا شعرت بصداع شديد أو ارتباك أو قيء دم.\n"
            "احمل بطاقة تنبيه طبي أو ارتدِ سوار تنبيه طبي يشير إلى تناولك للوارفارين."
        ),
    ),

    # 5 — Cholesterol diet guide
    _SeedInstruction(
        sort_order=5,
        category="diet",
        title_en="Cholesterol Diet Guide",
        title_ar="جدول إرشادي للأطعمة في حالة ارتفاع كولسترول الدم",
        content_en=(
            "Foods to AVOID (high cholesterol): organ meats (liver, kidney, brain), shrimp, full-fat dairy, egg yolks (>3/week), butter, ghee, coconut oil, fast food, pastries, cakes.\n"
            "Foods to LIMIT: red meat (lean cuts only, max 2x/week), low-fat cheese, dark chocolate.\n"
            "Foods ALLOWED freely: fruits, vegetables, whole grains, oats, barley, legumes, nuts (walnuts, almonds — handful/day), fish (especially fatty fish like salmon, mackerel — 2x/week), olive oil, fat-free yoghurt.\n"
            "Cooking tips: grill, bake, steam, or boil — never deep-fry. Remove visible fat from meat. Use non-stick pans to reduce oil.\n"
            "Lifestyle: combine diet with regular exercise (30 min/day), weight management, smoking cessation, and medication adherence."
        ),
        content_ar=(
            "أطعمة يجب تجنبها (عالية الكولسترول): الأحشاء (الكبد، الكلى، المخ)، الجمبري، منتجات الألبان كاملة الدسم، صفار البيض (أكثر من ٣/أسبوع)، الزبدة، السمن، زيت جوز الهند، الوجبات السريعة، المعجنات، الكعك.\n"
            "أطعمة يجب تقليلها: اللحوم الحمراء (قطع خالية الدهن فقط، مرتين أسبوعياً كحد أقصى)، الجبن قليل الدسم، الشوكولاتة الداكنة.\n"
            "أطعمة مسموح بها بحرية: الفواكه، الخضروات، الحبوب الكاملة، الشوفان، الشعير، البقوليات، المكسرات (الجوز، اللوز — حفنة يومياً)، الأسماك (خاصة الدهنية مثل السلمون والماكريل — مرتين أسبوعياً)، زيت الزيتون، الزبادي خالي الدسم.\n"
            "نصائح الطبخ: اشوِ أو اخبز أو اطهُ على البخار أو اسلق — لا تقلِ بالزيت الغزير أبداً. أزل الدهون الظاهرة من اللحم. استخدم أواني غير لاصقة لتقليل الزيت.\n"
            "نمط الحياة: اجمع بين النظام الغذائي والتمارين المنتظمة (٣٠ دقيقة يومياً)، والتحكم في الوزن، والإقلاع عن التدخين، والالتزام بالأدوية."
        ),
    ),

    # 6 — Low-salt diet
    _SeedInstruction(
        sort_order=6,
        category="diet",
        title_en="Low-Salt (Sodium) Diet",
        title_ar="غذاء قليل الملح",
        content_en=(
            "Daily salt intake should not exceed 5 g (about 1 teaspoon). For heart failure patients, aim for less than 3 g.\n"
            "Do NOT add salt at the table. Reduce salt during cooking gradually.\n"
            "Avoid: pickles, canned foods, processed meats, salted nuts, chips, soy sauce, bouillon cubes, instant noodles.\n"
            "Read nutrition labels — choose products with <120 mg sodium per serving.\n"
            "Use herbs, spices, lemon juice, garlic, and onion to flavour food instead of salt.\n"
            "Rinse canned vegetables and beans under water before cooking to reduce sodium.\n"
            "Choose fresh or frozen vegetables over canned ones.\n"
            "When eating out, ask for food to be prepared without added salt.\n"
            "Beware of hidden sodium in bread, breakfast cereals, and condiments.\n"
            "Potassium-rich foods (bananas, oranges, potatoes, spinach) can help counterbalance sodium — eat them regularly unless restricted by your doctor."
        ),
        content_ar=(
            "يجب ألا يتجاوز تناول الملح اليومي ٥ جم (حوالي ملعقة صغيرة). لمرضى فشل القلب، استهدف أقل من ٣ جم.\n"
            "لا تضف ملحاً على المائدة. قلل الملح أثناء الطبخ تدريجياً.\n"
            "تجنب: المخللات، الأطعمة المعلبة، اللحوم المصنعة، المكسرات المملحة، الشيبس، صلصة الصويا، مكعبات المرق، النودلز سريعة التحضير.\n"
            "اقرأ ملصقات التغذية — اختر المنتجات التي تحتوي على أقل من ١٢٠ مجم صوديوم لكل حصة.\n"
            "استخدم الأعشاب والتوابل وعصير الليمون والثوم والبصل لتنكيه الطعام بدلاً من الملح.\n"
            "اشطف الخضروات والبقوليات المعلبة تحت الماء قبل الطبخ لتقليل الصوديوم.\n"
            "اختر الخضروات الطازجة أو المجمدة بدلاً من المعلبة.\n"
            "عند تناول الطعام خارج المنزل، اطلب تحضير الطعام بدون ملح مضاف.\n"
            "احذر من الصوديوم المخفي في الخبز وحبوب الإفطار والتوابل الجاهزة.\n"
            "الأطعمة الغنية بالبوتاسيوم (الموز، البرتقال، البطاطس، السبانخ) تساعد في موازنة الصوديوم — تناولها بانتظام ما لم يمنعك الطبيب."
        ),
    ),

    # 7 — Prophylaxis against infective endocarditis
    _SeedInstruction(
        sort_order=7,
        category="medication",
        title_en="Prophylaxis Against Infective Endocarditis",
        title_ar="الوقاية من التهاب الصمامات البكتيري",
        content_en=(
            "You have a heart valve condition that requires antibiotic prophylaxis before certain dental or surgical procedures.\n"
            "Inform every doctor and dentist about your valve condition BEFORE any procedure.\n"
            "Standard prophylaxis (dental/oral/respiratory procedures):\n"
            "  - Amoxicillin 2 g orally, 1 hour before the procedure (children: 50 mg/kg).\n"
            "  - If allergic to penicillin: Clindamycin 600 mg orally, 1 hour before (children: 20 mg/kg).\n"
            "For gastrointestinal or genitourinary procedures (high-risk patients):\n"
            "  - Ampicillin 2 g IV/IM + Gentamicin 1.5 mg/kg IV/IM, 30 minutes before the procedure.\n"
            "  - Followed by Amoxicillin 1 g orally, 6 hours after the procedure.\n"
            "  - If penicillin-allergic: Vancomycin 1 g IV over 1 hour + Gentamicin 1.5 mg/kg IV, completed 30 min before procedure.\n"
            "Maintain excellent oral hygiene — brush twice daily and see your dentist regularly.\n"
            "Carry your endocarditis prophylaxis card at all times."
        ),
        content_ar=(
            "لديك حالة في صمامات القلب تستلزم تناول مضاد حيوي وقائي قبل بعض إجراءات الأسنان أو العمليات الجراحية.\n"
            "أخبر كل طبيب وطبيب أسنان عن حالة الصمام الخاصة بك قبل أي إجراء.\n"
            "الوقاية القياسية (إجراءات الأسنان / الفم / الجهاز التنفسي):\n"
            "  - أموكسيسيللين ٢ جم بالفم، ساعة واحدة قبل الإجراء (الأطفال: ٥٠ مجم/كجم).\n"
            "  - في حالة حساسية البنسلين: كليندامايسين ٦٠٠ مجم بالفم، ساعة واحدة قبل الإجراء (الأطفال: ٢٠ مجم/كجم).\n"
            "لإجراءات الجهاز الهضمي أو البولي التناسلي (المرضى عاليو الخطورة):\n"
            "  - أمبيسيللين ٢ جم وريدي/عضلي + جنتاميسين ١.٥ مجم/كجم وريدي/عضلي، ٣٠ دقيقة قبل الإجراء.\n"
            "  - يليها أموكسيسيللين ١ جم بالفم، ٦ ساعات بعد الإجراء.\n"
            "  - في حالة حساسية البنسلين: فانكوميسين ١ جم وريدي على مدار ساعة + جنتاميسين ١.٥ مجم/كجم وريدي، يكتمل ٣٠ دقيقة قبل الإجراء.\n"
            "حافظ على نظافة الفم الممتازة — اغسل أسنانك مرتين يومياً وزُر طبيب الأسنان بانتظام.\n"
            "احمل بطاقة الوقاية من التهاب الشغاف معك في جميع الأوقات."
        ),
    ),

    # 8 — Diabetes and heart disease
    _SeedInstruction(
        sort_order=8,
        category="general",
        title_en="Diabetes and Heart Disease Management",
        title_ar="إدارة مرض السكري وأمراض القلب",
        content_en=(
            "Diabetes significantly increases your risk of heart disease — tight blood sugar control is essential.\n"
            "Target HbA1c: less than 7% (or as advised by your doctor).\n"
            "Monitor blood sugar regularly as directed.\n"
            "Follow the low-fat, low-salt diet guidelines provided.\n"
            "Exercise regularly — at least 30 minutes of moderate activity most days.\n"
            "Take all diabetes and cardiac medications as prescribed.\n"
            "Check your feet daily for sores, blisters, or colour changes.\n"
            "Control blood pressure (target <130/80 mmHg) and cholesterol levels.\n"
            "Do NOT skip meals — maintain regular eating times.\n"
            "Carry a sugar source (glucose tablets, juice) in case of hypoglycaemia."
        ),
        content_ar=(
            "يزيد مرض السكري بشكل كبير من خطر الإصابة بأمراض القلب — التحكم الجيد في مستوى السكر ضروري.\n"
            "الهدف من HbA1c: أقل من ٧٪ (أو حسب توجيهات الطبيب).\n"
            "راقب مستوى السكر في الدم بانتظام حسب التوجيهات.\n"
            "اتبع إرشادات النظام الغذائي قليل الدهون وقليل الملح المقدمة لك.\n"
            "مارس الرياضة بانتظام — ٣٠ دقيقة على الأقل من النشاط المعتدل معظم الأيام.\n"
            "تناول جميع أدوية السكري والقلب حسب الوصفة الطبية.\n"
            "افحص قدميك يومياً بحثاً عن قروح أو بثور أو تغيرات في اللون.\n"
            "تحكم في ضغط الدم (المستهدف أقل من ١٣٠/٨٠ مم زئبق) ومستويات الكولسترول.\n"
            "لا تفوت وجبات — حافظ على أوقات أكل منتظمة.\n"
            "احمل مصدراً للسكر (أقراص جلوكوز، عصير) في حالة انخفاض السكر."
        ),
    ),

    # 9 — Post-cardiac catheterisation instructions
    _SeedInstruction(
        sort_order=9,
        category="procedure",
        title_en="Post-Cardiac Catheterisation Instructions",
        title_ar="تعليمات ما بعد القسطرة القلبية",
        content_en=(
            "Keep the puncture site clean and dry for 48 hours.\n"
            "Avoid heavy lifting (>5 kg) or strenuous activity for 5–7 days.\n"
            "If the groin was used: avoid bending the affected leg sharply or climbing stairs excessively for 48 hours.\n"
            "If the wrist was used: avoid heavy gripping or lifting with the affected hand for 48 hours.\n"
            "It is normal to have a small bruise at the puncture site. A small lump may persist for 1–2 weeks.\n"
            "Seek IMMEDIATE medical attention if you notice: increasing swelling or a growing lump at the site, bleeding that does not stop with firm pressure for 10 minutes, numbness, tingling, or colour change in the limb, fever >38°C, chest pain or shortness of breath.\n"
            "Drink plenty of fluids (at least 6–8 glasses of water) in the first 24 hours to help flush the contrast dye.\n"
            "Take all prescribed medications, including antiplatelet agents (aspirin, clopidogrel) without interruption.\n"
            "Attend your follow-up appointment as scheduled.\n"
            "You may shower after 48 hours but avoid soaking in a bath or swimming pool for 1 week."
        ),
        content_ar=(
            "حافظ على نظافة وجفاف موضع الثقب لمدة ٤٨ ساعة.\n"
            "تجنب رفع الأثقال (أكثر من ٥ كجم) أو النشاط الشاق لمدة ٥–٧ أيام.\n"
            "إذا كانت القسطرة من الفخذ: تجنب ثني الساق المصابة بشكل حاد أو صعود السلالم بكثرة لمدة ٤٨ ساعة.\n"
            "إذا كانت القسطرة من المعصم: تجنب القبض بقوة أو الرفع باليد المصابة لمدة ٤٨ ساعة.\n"
            "من الطبيعي وجود كدمة صغيرة في موضع الثقب. قد تستمر كتلة صغيرة لمدة ١–٢ أسبوع.\n"
            "اطلب رعاية طبية فورية إذا لاحظت: تورماً متزايداً أو كتلة متنامية في الموضع، نزيفاً لا يتوقف بالضغط المستمر لمدة ١٠ دقائق، تنميلاً أو وخزاً أو تغيراً في لون الطرف، حرارة أعلى من ٣٨ درجة مئوية، ألماً في الصدر أو ضيقاً في التنفس.\n"
            "اشرب الكثير من السوائل (٦–٨ أكواب ماء على الأقل) في أول ٢٤ ساعة لمساعدة الجسم على التخلص من الصبغة.\n"
            "تناول جميع الأدوية الموصوفة بما في ذلك مضادات الصفائح (الأسبرين، كلوبيدوجريل) بدون انقطاع.\n"
            "احرص على حضور موعد المتابعة المحدد.\n"
            "يمكنك الاستحمام بعد ٤٨ ساعة ولكن تجنب النقع في حوض الاستحمام أو حمام السباحة لمدة أسبوع."
        ),
    ),
]


def get_seed_instructions() -> list[dict]:
    """Return the 9 legacy instruction templates as dicts ready for DB insertion.

    Each dict has keys matching the PatientInstruction model columns:
        title_en, title_ar, content_en, content_ar, category, sort_order

    Usage in a seed script::

        from app.services.instructions import get_seed_instructions
        for data in get_seed_instructions():
            db.add(PatientInstruction(**data))
    """
    return [
        {
            "title_en": s.title_en,
            "title_ar": s.title_ar,
            "content_en": s.content_en,
            "content_ar": s.content_ar,
            "category": s.category,
            "sort_order": s.sort_order,
        }
        for s in _SEED
    ]
