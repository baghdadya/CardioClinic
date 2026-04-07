-- Seed data: Legacy patient instruction templates (bilingual EN/AR)
-- Run after the patient_instructions table has been created via Alembic migration.

INSERT INTO patient_instructions (id, title_en, title_ar, content_en, content_ar, category, is_active, sort_order) VALUES

-- 1. Basic Health Rules
(gen_random_uuid(),
 'Basic Health Rules',
 'القواعد الأساسية للحياة الصحية',
 '<h3>Basic Health Rules</h3>
<ul>
  <li><strong>Diet:</strong> Eat a balanced diet low in saturated fat, cholesterol, and salt. Increase intake of fruits, vegetables, and whole grains.</li>
  <li><strong>Exercise:</strong> Engage in regular physical activity (at least 30 minutes of moderate exercise most days of the week).</li>
  <li><strong>Weight Management:</strong> Maintain a healthy body weight. Aim for a Body Mass Index (BMI) between 18.5 and 24.9.</li>
  <li><strong>Smoking:</strong> Stop smoking completely. Avoid exposure to secondhand smoke.</li>
  <li><strong>Alcohol:</strong> Limit alcohol consumption to moderate levels.</li>
  <li><strong>Stress:</strong> Manage stress through relaxation techniques, adequate sleep, and social support.</li>
  <li><strong>Medications:</strong> Take all prescribed medications regularly and as directed by your doctor.</li>
  <li><strong>Follow-up:</strong> Attend all scheduled follow-up appointments with your cardiologist.</li>
</ul>',
 '<div dir="rtl" lang="ar">
<h3>القواعد الأساسية للحياة الصحية</h3>
<ul>
  <li><strong>الغذاء:</strong> تناول غذاء متوازن قليل الدهون المشبعة والكولسترول والملح. أكثر من تناول الفواكه والخضروات والحبوب الكاملة.</li>
  <li><strong>الرياضة:</strong> مارس الرياضة البدنية بانتظام (30 دقيقة على الأقل من الرياضة المعتدلة معظم أيام الأسبوع).</li>
  <li><strong>الوزن:</strong> حافظ على وزن صحي مناسب. اجعل مؤشر كتلة الجسم بين 18.5 و 24.9.</li>
  <li><strong>التدخين:</strong> توقف عن التدخين تماماً. تجنب التعرض للتدخين السلبي.</li>
  <li><strong>الكحول:</strong> تجنب المشروبات الكحولية.</li>
  <li><strong>التوتر:</strong> تحكم في التوتر والضغط النفسي عن طريق الاسترخاء والنوم الكافي والدعم الاجتماعي.</li>
  <li><strong>الأدوية:</strong> تناول جميع الأدوية الموصوفة بانتظام وحسب توجيهات الطبيب.</li>
  <li><strong>المتابعة:</strong> التزم بجميع مواعيد المتابعة المحددة مع طبيب القلب.</li>
</ul>
</div>',
 'General', true, 1),

-- 2. Exercise Guidelines for Cardiac Patients
(gen_random_uuid(),
 'Exercise Guidelines for Cardiac Patients',
 'القواعد الأساسية لممارسة الرياضة البدنية',
 '<h3>Exercise Guidelines for Cardiac Patients</h3>
<p>Regular exercise is essential for cardiac rehabilitation and long-term heart health.</p>
<h4>General Rules:</h4>
<ul>
  <li>Start slowly and gradually increase the duration and intensity of exercise.</li>
  <li>Warm up for 5-10 minutes before exercise and cool down for 5-10 minutes after.</li>
  <li>Walking is the best and safest form of exercise for cardiac patients.</li>
  <li>Aim to walk 30-45 minutes, 5 times per week.</li>
  <li>Maintain a pace where you can still talk comfortably while exercising.</li>
</ul>
<h4>Warning Signs - Stop Exercise If You Experience:</h4>
<ul>
  <li>Chest pain or pressure</li>
  <li>Severe shortness of breath</li>
  <li>Dizziness or lightheadedness</li>
  <li>Irregular heartbeat or palpitations</li>
  <li>Excessive fatigue</li>
  <li>Nausea or cold sweats</li>
</ul>
<h4>Avoid:</h4>
<ul>
  <li>Exercising in extreme heat or cold</li>
  <li>Heavy lifting or isometric exercises (unless approved by your doctor)</li>
  <li>Exercising immediately after meals (wait at least 1-2 hours)</li>
  <li>Competitive sports without medical clearance</li>
</ul>',
 '<div dir="rtl" lang="ar">
<h3>القواعد الأساسية لممارسة الرياضة البدنية</h3>
<p>الرياضة المنتظمة ضرورية لتأهيل القلب والحفاظ على صحة القلب على المدى الطويل.</p>
<h4>قواعد عامة:</h4>
<ul>
  <li>ابدأ ببطء وزد تدريجياً مدة وشدة التمارين.</li>
  <li>قم بالإحماء لمدة 5-10 دقائق قبل التمرين والتبريد لمدة 5-10 دقائق بعده.</li>
  <li>المشي هو أفضل وأسلم أنواع الرياضة لمرضى القلب.</li>
  <li>اهدف للمشي 30-45 دقيقة، 5 مرات في الأسبوع.</li>
  <li>حافظ على سرعة تمكنك من التحدث بشكل مريح أثناء التمرين.</li>
</ul>
<h4>علامات تحذيرية - توقف عن التمرين إذا شعرت بـ:</h4>
<ul>
  <li>ألم أو ضغط في الصدر</li>
  <li>ضيق شديد في التنفس</li>
  <li>دوخة أو دوار</li>
  <li>عدم انتظام ضربات القلب أو خفقان</li>
  <li>إرهاق شديد</li>
  <li>غثيان أو عرق بارد</li>
</ul>
<h4>تجنب:</h4>
<ul>
  <li>التمرين في الحرارة الشديدة أو البرد القارس</li>
  <li>رفع الأثقال أو التمارين المتساوية القياس (إلا بموافقة الطبيب)</li>
  <li>التمرين بعد الأكل مباشرة (انتظر ساعة إلى ساعتين على الأقل)</li>
  <li>الرياضات التنافسية بدون إذن طبي</li>
</ul>
</div>',
 'Exercise', true, 2),

-- 3. Low-Fat Diet Plan
(gen_random_uuid(),
 'Low-Fat Diet Plan',
 'نظام غذائي قليل الدهن قليل الملح',
 '<h3>Low-Fat, Low-Salt Diet Plan</h3>
<h4>Foods to Choose:</h4>
<ul>
  <li>Fresh fruits and vegetables</li>
  <li>Whole grains (brown rice, whole wheat bread, oats)</li>
  <li>Lean meats (skinless chicken, fish)</li>
  <li>Low-fat or fat-free dairy products</li>
  <li>Legumes (beans, lentils, chickpeas)</li>
  <li>Olive oil in moderation</li>
</ul>
<h4>Foods to Avoid:</h4>
<ul>
  <li>Fried foods and fast food</li>
  <li>Butter, ghee, and cream</li>
  <li>Red meat and processed meats (sausage, hot dogs)</li>
  <li>Full-fat dairy products</li>
  <li>Canned and processed foods (high in salt)</li>
  <li>Pickles and salty snacks</li>
  <li>Pastries, cakes, and biscuits</li>
  <li>Coconut oil and palm oil</li>
</ul>
<h4>Cooking Tips:</h4>
<ul>
  <li>Grill, bake, steam, or boil instead of frying</li>
  <li>Use herbs and spices instead of salt for flavoring</li>
  <li>Remove visible fat from meat and skin from poultry before cooking</li>
  <li>Use non-stick cookware to reduce the need for cooking oil</li>
</ul>',
 '<div dir="rtl" lang="ar">
<h3>نظام غذائي قليل الدهن قليل الملح</h3>
<h4>الأطعمة المسموح بها:</h4>
<ul>
  <li>الفواكه والخضروات الطازجة</li>
  <li>الحبوب الكاملة (الأرز البني، خبز القمح الكامل، الشوفان)</li>
  <li>اللحوم الخالية من الدهن (الدجاج بدون جلد، الأسماك)</li>
  <li>منتجات الألبان قليلة أو خالية الدسم</li>
  <li>البقوليات (الفاصوليا، العدس، الحمص)</li>
  <li>زيت الزيتون بكميات معتدلة</li>
</ul>
<h4>الأطعمة الممنوعة:</h4>
<ul>
  <li>الأطعمة المقلية والوجبات السريعة</li>
  <li>الزبدة والسمن والقشدة</li>
  <li>اللحوم الحمراء واللحوم المصنعة (السجق، الهوت دوج)</li>
  <li>منتجات الألبان كاملة الدسم</li>
  <li>الأطعمة المعلبة والمصنعة (عالية الملح)</li>
  <li>المخللات والوجبات الخفيفة المالحة</li>
  <li>المعجنات والكعك والبسكويت</li>
  <li>زيت جوز الهند وزيت النخيل</li>
</ul>
<h4>نصائح للطبخ:</h4>
<ul>
  <li>اشوِ أو اخبز أو اطهِ على البخار أو اسلق بدلاً من القلي</li>
  <li>استخدم الأعشاب والتوابل بدلاً من الملح للتتبيل</li>
  <li>أزل الدهون الظاهرة من اللحم والجلد من الدواجن قبل الطهي</li>
  <li>استخدم أواني طهي غير لاصقة لتقليل الحاجة لزيت الطهي</li>
</ul>
</div>',
 'Diet', true, 3),

-- 4. Warfarin Medication Guidelines
(gen_random_uuid(),
 'Warfarin Medication Guidelines',
 'أدوية السيولة',
 '<h3>Warfarin (Blood Thinner) Guidelines</h3>
<p>Warfarin is prescribed to prevent blood clots. It is very important to follow these guidelines carefully.</p>
<h4>Important Rules:</h4>
<ul>
  <li>Take Warfarin at the <strong>same time every day</strong>, preferably in the evening.</li>
  <li>Never skip a dose. If you miss a dose, take it as soon as you remember on the same day. Do NOT double the dose.</li>
  <li>Attend all scheduled blood tests (INR/PT) to monitor your blood clotting time.</li>
  <li>Carry a medical alert card or bracelet indicating you are on Warfarin.</li>
</ul>
<h4>Diet Considerations:</h4>
<ul>
  <li>Maintain a <strong>consistent</strong> intake of Vitamin K-rich foods (green leafy vegetables). Do not suddenly increase or decrease them.</li>
  <li>Avoid cranberry juice and grapefruit juice in large quantities.</li>
  <li>Avoid alcohol or limit to very small amounts.</li>
</ul>
<h4>Drug Interactions - Inform Your Doctor Before Taking:</h4>
<ul>
  <li>Aspirin or any pain killers (NSAIDs)</li>
  <li>Antibiotics</li>
  <li>Herbal supplements (especially ginkgo, garlic, ginger)</li>
  <li>Any new medication</li>
</ul>
<h4>Warning Signs - Seek Medical Attention Immediately:</h4>
<ul>
  <li>Unusual bleeding or bruising</li>
  <li>Blood in urine (pink or red color) or stool (black or tarry)</li>
  <li>Prolonged bleeding from cuts</li>
  <li>Severe headache or dizziness</li>
  <li>Vomiting blood or coffee-ground-like material</li>
  <li>Bleeding gums</li>
</ul>',
 '<div dir="rtl" lang="ar">
<h3>أدوية السيولة (الوارفارين)</h3>
<p>يوصف الوارفارين لمنع تكون الجلطات الدموية. من المهم جداً اتباع هذه الإرشادات بدقة.</p>
<h4>قواعد مهمة:</h4>
<ul>
  <li>تناول الوارفارين في <strong>نفس الوقت يومياً</strong>، ويفضل في المساء.</li>
  <li>لا تفوت أي جرعة. إذا نسيت جرعة، تناولها فور تذكرها في نفس اليوم. لا تضاعف الجرعة أبداً.</li>
  <li>التزم بجميع مواعيد تحاليل الدم (INR/PT) لمراقبة سيولة الدم.</li>
  <li>احمل بطاقة تنبيه طبي أو سوار يوضح أنك تتناول الوارفارين.</li>
</ul>
<h4>اعتبارات غذائية:</h4>
<ul>
  <li>حافظ على تناول <strong>ثابت</strong> من الأطعمة الغنية بفيتامين ك (الخضروات الورقية الخضراء). لا تزد أو تقلل منها فجأة.</li>
  <li>تجنب عصير التوت البري وعصير الجريب فروت بكميات كبيرة.</li>
  <li>تجنب الكحول أو اقتصر على كميات قليلة جداً.</li>
</ul>
<h4>التفاعلات الدوائية - أخبر طبيبك قبل تناول:</h4>
<ul>
  <li>الأسبرين أو أي مسكنات ألم (مضادات الالتهاب)</li>
  <li>المضادات الحيوية</li>
  <li>المكملات العشبية (خاصة الجنكو والثوم والزنجبيل)</li>
  <li>أي دواء جديد</li>
</ul>
<h4>علامات تحذيرية - اطلب الرعاية الطبية فوراً:</h4>
<ul>
  <li>نزيف أو كدمات غير عادية</li>
  <li>دم في البول (لون وردي أو أحمر) أو البراز (أسود أو قطراني)</li>
  <li>نزيف مطول من الجروح</li>
  <li>صداع شديد أو دوخة</li>
  <li>قيء دموي أو مادة تشبه بقايا القهوة</li>
  <li>نزيف اللثة</li>
</ul>
</div>',
 'Medication', true, 4),

-- 5. Cholesterol Diet Guide
(gen_random_uuid(),
 'Cholesterol Diet Guide',
 'جدول إرشادي للأطعمة في حالة ارتفاع كولسترول الدم',
 '<h3>Cholesterol Diet Guide</h3>
<p>This guide helps you choose foods that lower cholesterol and avoid those that raise it.</p>
<table>
  <tr><th>Food Group</th><th>Recommended</th><th>Avoid</th></tr>
  <tr><td>Dairy</td><td>Skim milk, low-fat yogurt, low-fat cheese</td><td>Whole milk, cream, full-fat cheese, butter</td></tr>
  <tr><td>Meat</td><td>Skinless chicken, fish (especially oily fish like salmon, tuna)</td><td>Red meat, organ meats (liver, kidney), processed meats</td></tr>
  <tr><td>Eggs</td><td>Egg whites (unlimited), whole eggs (2-3 per week)</td><td>More than 3 whole eggs per week</td></tr>
  <tr><td>Fats &amp; Oils</td><td>Olive oil, sunflower oil, corn oil</td><td>Butter, ghee, coconut oil, palm oil, lard</td></tr>
  <tr><td>Bread &amp; Cereals</td><td>Whole wheat bread, oats, brown rice</td><td>Croissants, pastries, white bread</td></tr>
  <tr><td>Fruits &amp; Vegetables</td><td>All fresh fruits and vegetables</td><td>Fried vegetables, coconut</td></tr>
  <tr><td>Nuts</td><td>Almonds, walnuts (in moderation)</td><td>Cashews, macadamia (high in saturated fat)</td></tr>
  <tr><td>Beverages</td><td>Water, green tea, fresh juices</td><td>Full-cream milkshakes, sweetened drinks</td></tr>
</table>
<h4>Tips:</h4>
<ul>
  <li>Eat more soluble fiber (oats, beans, lentils, fruits) to help lower LDL cholesterol.</li>
  <li>Include omega-3 fatty acids (fish, flaxseed, walnuts) to raise HDL cholesterol.</li>
  <li>Exercise regularly to improve your cholesterol profile.</li>
</ul>',
 '<div dir="rtl" lang="ar">
<h3>جدول إرشادي للأطعمة في حالة ارتفاع كولسترول الدم</h3>
<p>يساعدك هذا الدليل في اختيار الأطعمة التي تخفض الكولسترول وتجنب تلك التي ترفعه.</p>
<table>
  <tr><th>مجموعة الطعام</th><th>مسموح</th><th>ممنوع</th></tr>
  <tr><td>الألبان</td><td>حليب خالي الدسم، زبادي قليل الدسم، جبن قليل الدسم</td><td>حليب كامل الدسم، قشدة، جبن كامل الدسم، زبدة</td></tr>
  <tr><td>اللحوم</td><td>دجاج بدون جلد، أسماك (خاصة الأسماك الدهنية مثل السلمون والتونة)</td><td>لحوم حمراء، أحشاء (كبد، كلى)، لحوم مصنعة</td></tr>
  <tr><td>البيض</td><td>بياض البيض (بدون حدود)، بيض كامل (2-3 في الأسبوع)</td><td>أكثر من 3 بيضات كاملة في الأسبوع</td></tr>
  <tr><td>الدهون والزيوت</td><td>زيت زيتون، زيت عباد الشمس، زيت ذرة</td><td>زبدة، سمن، زيت جوز الهند، زيت نخيل، شحم</td></tr>
  <tr><td>الخبز والحبوب</td><td>خبز قمح كامل، شوفان، أرز بني</td><td>كرواسون، معجنات، خبز أبيض</td></tr>
  <tr><td>الفواكه والخضروات</td><td>جميع الفواكه والخضروات الطازجة</td><td>خضروات مقلية، جوز الهند</td></tr>
  <tr><td>المكسرات</td><td>لوز، جوز (بكميات معتدلة)</td><td>كاجو، مكاديميا (عالية الدهون المشبعة)</td></tr>
  <tr><td>المشروبات</td><td>ماء، شاي أخضر، عصائر طازجة</td><td>ميلك شيك كامل الدسم، مشروبات محلاة</td></tr>
</table>
<h4>نصائح:</h4>
<ul>
  <li>أكثر من الألياف القابلة للذوبان (الشوفان، الفاصوليا، العدس، الفواكه) للمساعدة في خفض الكولسترول الضار.</li>
  <li>أضف أحماض أوميغا-3 الدهنية (الأسماك، بذور الكتان، الجوز) لرفع الكولسترول النافع.</li>
  <li>مارس الرياضة بانتظام لتحسين مستوى الكولسترول.</li>
</ul>
</div>',
 'Diet', true, 5),

-- 6. Low-Salt Diet
(gen_random_uuid(),
 'Low-Salt Diet',
 'غذاء قليل الملح',
 '<h3>Low-Salt (Sodium-Restricted) Diet</h3>
<p>Excess salt intake raises blood pressure and causes fluid retention. Aim for less than 2,000 mg of sodium per day.</p>
<h4>Tips to Reduce Salt Intake:</h4>
<ul>
  <li>Do not add salt to food at the table.</li>
  <li>Use herbs, spices, lemon juice, and vinegar for flavoring instead of salt.</li>
  <li>Avoid processed and canned foods (they contain high amounts of hidden salt).</li>
  <li>Read food labels and choose products labeled "low sodium" or "no added salt".</li>
  <li>Avoid pickles, olives, salted nuts, and chips.</li>
  <li>Limit use of soy sauce, ketchup, and other condiments.</li>
  <li>When eating out, ask for food to be prepared without added salt.</li>
</ul>
<h4>High-Sodium Foods to Avoid:</h4>
<ul>
  <li>Table salt and sea salt</li>
  <li>Pickles and preserved vegetables</li>
  <li>Processed cheese and canned foods</li>
  <li>Smoked and cured meats (pastrami, salami, bacon)</li>
  <li>Instant noodles and packaged soups</li>
  <li>Fast food and restaurant meals</li>
  <li>Salted butter and margarine</li>
</ul>',
 '<div dir="rtl" lang="ar">
<h3>غذاء قليل الملح</h3>
<p>الإفراط في تناول الملح يرفع ضغط الدم ويسبب احتباس السوائل. اهدف لأقل من 2000 ملجم من الصوديوم يومياً.</p>
<h4>نصائح لتقليل الملح:</h4>
<ul>
  <li>لا تضف الملح إلى الطعام على المائدة.</li>
  <li>استخدم الأعشاب والتوابل وعصير الليمون والخل للتتبيل بدلاً من الملح.</li>
  <li>تجنب الأطعمة المصنعة والمعلبة (تحتوي على كميات كبيرة من الملح المخفي).</li>
  <li>اقرأ ملصقات الأطعمة واختر المنتجات المكتوب عليها "قليل الصوديوم" أو "بدون ملح مضاف".</li>
  <li>تجنب المخللات والزيتون والمكسرات المملحة والشيبسي.</li>
  <li>قلل من استخدام صلصة الصويا والكاتشب والتوابل الجاهزة.</li>
  <li>عند تناول الطعام خارج المنزل، اطلب تحضير الطعام بدون ملح مضاف.</li>
</ul>
<h4>أطعمة عالية الصوديوم يجب تجنبها:</h4>
<ul>
  <li>ملح الطعام وملح البحر</li>
  <li>المخللات والخضروات المحفوظة</li>
  <li>الجبن المصنع والأطعمة المعلبة</li>
  <li>اللحوم المدخنة والمملحة (البسطرمة، السلامي، البيكون)</li>
  <li>النودلز الجاهزة والشوربات المعلبة</li>
  <li>الوجبات السريعة ووجبات المطاعم</li>
  <li>الزبدة والمارجرين المملحة</li>
</ul>
</div>',
 'Diet', true, 6),

-- 7. Prophylaxis Against Infective Endocarditis
(gen_random_uuid(),
 'Prophylaxis Against Infective Endocarditis',
 'الوقاية من التهاب الصمامات',
 '<h3>Prophylaxis Against Infective Endocarditis</h3>
<p>Patients with certain heart valve conditions need antibiotics before dental or surgical procedures to prevent infective endocarditis.</p>
<h4>When Prophylaxis Is Needed:</h4>
<ul>
  <li>Dental procedures involving bleeding (extraction, scaling, gum surgery)</li>
  <li>Respiratory tract procedures</li>
  <li>Procedures on infected skin or musculoskeletal tissue</li>
</ul>
<h4>Recommended Antibiotic Regimen:</h4>
<table>
  <tr><th>Medication</th><th>Timing</th><th>Adults</th><th>Children</th></tr>
  <tr><td><strong>Amoxycillin / Ampicillin</strong></td><td>Before procedure</td><td>2 gm orally (1 hour before) or IV (30 min before)</td><td>50 mg/kg</td></tr>
  <tr><td><strong>Amoxycillin / Ampicillin</strong></td><td>After procedure (6 hours later)</td><td>1 gm orally</td><td>25 mg/kg</td></tr>
  <tr><td><strong>Gentamycin</strong> (if high-risk)</td><td>Before procedure</td><td>80 mg IM</td><td>1.5 mg/kg IM</td></tr>
</table>
<h4>For Patients Allergic to Penicillin:</h4>
<ul>
  <li><strong>Clindamycin:</strong> Adults: 600 mg orally (1 hour before), Children: 20 mg/kg</li>
  <li><strong>Or Azithromycin:</strong> Adults: 500 mg orally (1 hour before), Children: 15 mg/kg</li>
</ul>
<h4>Important Notes:</h4>
<ul>
  <li>Always inform your dentist and any doctor about your heart valve condition.</li>
  <li>Carry a medical card indicating your need for endocarditis prophylaxis.</li>
  <li>Maintain excellent oral hygiene to reduce the risk of dental infections.</li>
</ul>',
 '<div dir="rtl" lang="ar">
<h3>الوقاية من التهاب الصمامات</h3>
<p>يحتاج المرضى الذين يعانون من بعض أمراض صمامات القلب إلى مضادات حيوية قبل إجراءات الأسنان أو العمليات الجراحية للوقاية من التهاب الشغاف المعدي.</p>
<h4>متى تكون الوقاية مطلوبة:</h4>
<ul>
  <li>إجراءات الأسنان التي تشمل نزيف (خلع، تنظيف، جراحة لثة)</li>
  <li>إجراءات الجهاز التنفسي</li>
  <li>إجراءات على الجلد المصاب أو الأنسجة العضلية الهيكلية</li>
</ul>
<h4>نظام المضادات الحيوية الموصى به:</h4>
<table>
  <tr><th>الدواء</th><th>التوقيت</th><th>البالغون</th><th>الأطفال</th></tr>
  <tr><td><strong>أموكسيسيلين / أمبيسيلين</strong></td><td>قبل الإجراء</td><td>2 جم بالفم (ساعة قبل) أو وريدي (30 دقيقة قبل)</td><td>50 ملجم/كجم</td></tr>
  <tr><td><strong>أموكسيسيلين / أمبيسيلين</strong></td><td>بعد الإجراء (6 ساعات)</td><td>1 جم بالفم</td><td>25 ملجم/كجم</td></tr>
  <tr><td><strong>جنتامايسين</strong> (في حالات الخطورة العالية)</td><td>قبل الإجراء</td><td>80 ملجم عضلي</td><td>1.5 ملجم/كجم عضلي</td></tr>
</table>
<h4>للمرضى الذين لديهم حساسية من البنسلين:</h4>
<ul>
  <li><strong>كليندامايسين:</strong> البالغون: 600 ملجم بالفم (ساعة قبل)، الأطفال: 20 ملجم/كجم</li>
  <li><strong>أو أزيثرومايسين:</strong> البالغون: 500 ملجم بالفم (ساعة قبل)، الأطفال: 15 ملجم/كجم</li>
</ul>
<h4>ملاحظات مهمة:</h4>
<ul>
  <li>أخبر دائماً طبيب الأسنان وأي طبيب عن حالة صمامات قلبك.</li>
  <li>احمل بطاقة طبية توضح حاجتك للوقاية من التهاب الشغاف.</li>
  <li>حافظ على نظافة الفم الممتازة لتقليل خطر التهابات الأسنان.</li>
</ul>
</div>',
 'Procedure', true, 7);
