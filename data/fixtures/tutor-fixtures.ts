import type { Language, TutorFinalPayload } from "@/lib/types";

type TopicKey = "newton" | "quadratic" | "photosynthesis";

export function detectFixtureTopic(message: string): TopicKey {
  const lower = message.toLowerCase();
  if (lower.includes("quadratic") || lower.includes("x^2") || lower.includes("द्विघात") || lower.includes("ವರ್ಗ")) {
    return "quadratic";
  }
  if (lower.includes("photo") || lower.includes("plant") || lower.includes("प्रकाश") || lower.includes("ದ್ಯುತಿ")) {
    return "photosynthesis";
  }
  return "newton";
}

export function getTutorFixture(
  topicKey: TopicKey,
  language: Language,
  isRetryEasier = false
): TutorFinalPayload {
  const data = FIXTURES[topicKey][language] ?? FIXTURES[topicKey].en;
  if (isRetryEasier) {
    return {
      topic: data.topic,
      language,
      difficulty: "simple",
      prerequisiteGap: data.prerequisiteGap,
      analogy: data.retryAnalogy,
      explanation: data.retryExplanation,
      quiz: data.easierQuiz,
      demoMode: true,
    };
  }
  return {
    topic: data.topic,
    language,
    difficulty: "standard",
    prerequisiteGap: data.prerequisiteGap,
    explanation: data.explanation,
    analogy: data.analogy,
    quiz: data.quiz,
    demoMode: true,
  };
}

interface FixtureEntry {
  topic: string;
  prerequisiteGap: string;
  explanation: string;
  analogy: string;
  retryExplanation: string;
  retryAnalogy: string;
  quiz: TutorFinalPayload["quiz"];
  easierQuiz: TutorFinalPayload["quiz"];
}

const FIXTURES: Record<TopicKey, Record<Language, FixtureEntry>> = {
  newton: {
    en: {
      topic: "Newton's Third Law",
      prerequisiteGap: "Balanced vs Unbalanced Forces (action & reaction act on different objects)",
      explanation:
        "Newton's Third Law states that for every action force, there is an equal and opposite reaction force. Crucially, these two forces act on TWO different objects, so they never cancel each other out.",
      analogy:
        "Think of stepping off a small boat onto a dock: your foot pushes the boat backward (action), and the boat pushes you forward onto the dock (reaction).",
      retryExplanation:
        "Let's simplify! Imagine two ice skaters pushing each other's hands. Skater A pushes Skater B right; Skater B's hands push Skater A left. Each skater feels ONE force, so both move!",
      retryAnalogy:
        "Two friends on skateboards pushing each other — both roll backward in opposite directions.",
      quiz: [
        {
          id: "q1",
          question: "When you push against a wall with 50 N of force, why doesn't the wall's 50 N reaction force cancel your push?",
          options: [
            { id: "A", text: "Because the wall is heavier than you", isCorrect: false, misconception: "Confuses mass with force cancellation" },
            { id: "B", text: "Because the two forces act on different objects (you and the wall)", isCorrect: true },
            { id: "C", text: "Because reaction force is slightly smaller than action force", isCorrect: false, misconception: "Thinks reaction force is weaker" },
            { id: "D", text: "Because friction absorbs the reaction force", isCorrect: false, misconception: "Attributes force balance to friction" },
          ],
          explanation: "Action acts on the wall; reaction acts on you. Forces only cancel when they act on the same object.",
        },
        {
          id: "q2",
          question: "A rocket launches upward in space where there is no air. What pushes the rocket forward?",
          options: [
            { id: "A", text: "The exhaust gases pushing back against the rocket", isCorrect: true },
            { id: "B", text: "The rocket pushing against surrounding air", isCorrect: false, misconception: "Thinks rockets need air to push against" },
            { id: "C", text: "Gravity pulling the rocket upward", isCorrect: false, misconception: "Confuses gravity direction" },
            { id: "D", text: "Magnetic field of the Earth", isCorrect: false, misconception: "Attributes propulsion to magnetism" },
          ],
          explanation: "The rocket pushes exhaust gas backward, and the gas pushes the rocket forward.",
        },
        {
          id: "q3",
          question: "A bug hits the windshield of a fast-moving bus. Which experiences the greater force?",
          options: [
            { id: "A", text: "The bug, because it gets squished", isCorrect: false, misconception: "Confuses acceleration/damage with force magnitude" },
            { id: "B", text: "The bus, because it has much more mass", isCorrect: false, misconception: "Thinks larger mass exerts larger force" },
            { id: "C", text: "Both experience the exact same magnitude of force", isCorrect: true },
            { id: "D", text: "Neither experiences any force", isCorrect: false, misconception: "Ignores collision forces" },
          ],
          explanation: "By Newton's Third Law, the force on the bug equals the force on the bus; the bug's tiny mass just gives it a huge acceleration.",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "In Newton's Third Law, action and reaction forces are:",
          options: [
            { id: "A", text: "Equal in size and opposite in direction", isCorrect: true },
            { id: "B", text: "Equal in size and same in direction", isCorrect: false, misconception: "Forgets opposite direction" },
            { id: "C", text: "Acting on the exact same object", isCorrect: false, misconception: "Thinks they act on one object" },
            { id: "D", text: "Always unequal", isCorrect: false, misconception: "Thinks action is larger" },
          ],
          explanation: "Action and reaction are always equal in magnitude and opposite in direction.",
        },
        {
          id: "eq2",
          question: "When you swim, your hands push water backward. Which way does the water push you?",
          options: [
            { id: "A", text: "Backward", isCorrect: false, misconception: "Confuses action and reaction directions" },
            { id: "B", text: "Forward", isCorrect: true },
            { id: "C", text: "Downward", isCorrect: false, misconception: "Confuses buoyancy with propulsion" },
            { id: "D", text: "It does not push you", isCorrect: false, misconception: "Ignores reaction force" },
          ],
          explanation: "You push water back; water pushes you forward!",
        },
        {
          id: "eq3",
          question: "If Earth pulls an apple down with 1 N, how hard does the apple pull Earth up?",
          options: [
            { id: "A", text: "0 N", isCorrect: false, misconception: "Thinks small objects exert no gravity" },
            { id: "B", text: "0.01 N", isCorrect: false, misconception: "Scales force by mass" },
            { id: "C", text: "1 N", isCorrect: true },
            { id: "D", text: "100 N", isCorrect: false, misconception: "Overestimates reaction" },
          ],
          explanation: "The apple pulls Earth with the exact same 1 N force!",
        },
      ],
    },
    hi: {
      topic: "न्यूटन का तीसरा नियम (Newton's Third Law)",
      prerequisiteGap: "संतुलित बनाम असंतुलित बल (क्रिया और प्रतिक्रिया अलग-अलग वस्तुओं पर लगते हैं)",
      explanation:
        "न्यूटन के तीसरे नियम के अनुसार, प्रत्येक क्रिया के बराबर और विपरीत प्रतिक्रिया होती है। सबसे ज़रूरी बात: ये दोनों बल दो अलग-अलग वस्तुओं पर लगते हैं, इसलिए वे एक-दूसरे को रद्द नहीं करते।",
      analogy:
        "नाव से किनारे पर कूदने की कल्पना करें: आपका पैर नाव को पीछे धकेलता है (क्रिया), और नाव आपको आगे किनारे की ओर धकेलती है (प्रतिक्रिया)।",
      retryExplanation:
        "आइए इसे और आसान बनाएं! मान लीजिए दो दोस्त स्केटबोर्ड पर खड़े होकर एक-दूसरे को धक्का देते हैं। दोनों विपरीत दिशा में पीछे लुढ़कते हैं क्योंकि हर एक पर अलग बल लगा।",
      retryAnalogy: "स्केटबोर्ड पर दो दोस्त एक-दूसरे को धक्का देते हुए विपरीत दिशा में जाते हैं।",
      quiz: [
        {
          id: "q1",
          question: "जब आप दीवार को 50 N से धक्का देते हैं, तो दीवार की प्रतिक्रिया आपका बल रद्द क्यों नहीं करती?",
          options: [
            { id: "A", text: "क्योंकि दीवार आपसे भारी है", isCorrect: false, misconception: "द्रव्यमान को बल रद्द होने से जोड़ता है" },
            { id: "B", text: "क्योंकि दोनों बल अलग-अलग वस्तुओं (आप और दीवार) पर लगते हैं", isCorrect: true },
            { id: "C", text: "क्योंकि प्रतिक्रिया बल थोड़ा कम होता है", isCorrect: false, misconception: "प्रतिक्रिया को कमजोर मानता है" },
            { id: "D", text: "क्योंकि घर्षण बल को सोख लेता है", isCorrect: false, misconception: "घर्षण से भ्रमित" },
          ],
          explanation: "क्रिया दीवार पर और प्रतिक्रिया आप पर लगती है।",
        },
        {
          id: "q2",
          question: "अंतरिक्ष में हवा नहीं है, फिर भी रॉकेट ऊपर कैसे उड़ता है?",
          options: [
            { id: "A", text: "बाहर निकलती गैसें रॉकेट को आगे धकेलती हैं", isCorrect: true },
            { id: "B", text: "रॉकेट हवा को पीछे धकेलता है", isCorrect: false, misconception: "सोचता है हवा ज़रूरी है" },
            { id: "C", text: "गुरुत्वाकर्षण ऊपर खींचता है", isCorrect: false, misconception: "गुरुत्वाकर्षण की दिशा में भ्रम" },
            { id: "D", text: "चुंबकीय बल से", isCorrect: false, misconception: "चुंबकत्व से जोड़ता है" },
          ],
          explanation: "रॉकेट गैस को पीछे धकेलता है और गैस रॉकेट को आगे धकेलती है।",
        },
        {
          id: "q3",
          question: "एक कीड़ा तेज़ बस की विंडशील्ड से टकराता है। किस पर ज़्यादा बल लगता है?",
          options: [
            { id: "A", text: "कीड़े पर, क्योंकि वह कुचल जाता है", isCorrect: false, misconception: "नुकसान को ज़्यादा बल समझता है" },
            { id: "B", text: "बस पर, क्योंकि वह भारी है", isCorrect: false, misconception: "ज़्यादा द्रव्यमान = ज़्यादा बल मानता है" },
            { id: "C", text: "दोनों पर बिल्कुल बराबर बल लगता है", isCorrect: true },
            { id: "D", text: "किसी पर नहीं", isCorrect: false, misconception: "टक्कर के बल को नकारता है" },
          ],
          explanation: "दोनों पर बराबर बल लगता है; कीड़े का द्रव्यमान कम होने से उसका त्वरण बहुत अधिक होता है।",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "न्यूटन के तीसरे नियम में क्रिया और प्रतिक्रिया बल होते हैं:",
          options: [
            { id: "A", text: "बराबर और विपरीत दिशा में", isCorrect: true },
            { id: "B", text: "बराबर और एक ही दिशा में", isCorrect: false, misconception: "विपरीत दिशा भूल गया" },
            { id: "C", text: "एक ही वस्तु पर", isCorrect: false, misconception: "एक वस्तु मानता है" },
            { id: "D", text: "हमेशा असमान", isCorrect: false, misconception: "असमान मानता है" },
          ],
          explanation: "क्रिया और प्रतिक्रिया हमेशा बराबर और विपरीत होते हैं।",
        },
        {
          id: "eq2",
          question: "तैरते समय आप पानी को पीछे धकेलते हैं। पानी आपको किस दिशा में धकेलता है?",
          options: [
            { id: "A", text: "पीछे", isCorrect: false, misconception: "दिशा में भ्रम" },
            { id: "B", text: "आगे", isCorrect: true },
            { id: "C", text: "नीचे", isCorrect: false, misconception: "नीचे मानता है" },
            { id: "D", text: "कोई बल नहीं", isCorrect: false, misconception: "प्रतिक्रिया नकारता है" },
          ],
          explanation: "पानी आपको आगे की ओर धकेलता है।",
        },
        {
          id: "eq3",
          question: "यदि पृथ्वी सेब को 1 N से नीचे खींचती है, तो सेब पृथ्वी को कितने बल से ऊपर खींचता है?",
          options: [
            { id: "A", text: "0 N", isCorrect: false, misconception: "छोटी वस्तु का बल शून्य मानता है" },
            { id: "B", text: "0.01 N", isCorrect: false, misconception: "द्रव्यमान से अनुपात" },
            { id: "C", text: "1 N", isCorrect: true },
            { id: "D", text: "100 N", isCorrect: false, misconception: "अधिक मानता है" },
          ],
          explanation: "सेब भी पृथ्वी को ठीक 1 N बल से खींचता है।",
        },
      ],
    },
    kn: {
      topic: "ನ್ಯೂಟನ್‌ನ ಮೂರನೇ ನಿಯಮ (Newton's Third Law)",
      prerequisiteGap: "ಸಮತೋಲಿತ ಮತ್ತು ಅಸಮತೋಲಿತ ಬಲಗಳು (ಕ್ರಿಯೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಬೇರೆ ಬೇರೆ ವಸ್ತುಗಳ ಮೇಲೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ)",
      explanation:
        "ನ್ಯೂಟನ್‌ನ ಮೂರನೇ ನಿಯಮದ ಪ್ರಕಾರ, ಪ್ರತಿಯೊಂದು ಕ್ರಿಯೆಗೂ ಸಮಾನವಾದ ಮತ್ತು ವಿರುದ್ಧ ದಿಕ್ಕಿನ ಪ್ರತಿಕ್ರಿಯೆ ಇರುತ್ತದೆ. ಇವು ಎರಡು ಬೇರೆ ಬೇರೆ ವಸ್ತುಗಳ ಮೇಲೆ ಕಾರ್ಯನಿರ್ವಹಿಸುವುದರಿಂದ ಒಂದನ್ನೊಂದು ರದ್ದುಗೊಳಿಸುವುದಿಲ್ಲ.",
      analogy:
        "ದೋಣಿಯಿಂದ ದಡಕ್ಕೆ ಹಾರುವುದನ್ನು ಕಲ್ಪಿಸಿಕೊಳ್ಳಿ: ನಿಮ್ಮ ಕಾಲು ದೋಣಿಯನ್ನು ಹಿಂದಕ್ಕೆ ತಳ್ಳುತ್ತದೆ (ಕ್ರಿಯೆ), ಮತ್ತು ದೋಣಿ ನಿಮ್ಮನ್ನು ಮುಂದಕ್ಕೆ ದಡದ ಕಡೆಗೆ ತಳ್ಳುತ್ತದೆ (ಪ್ರತಿಕ್ರಿಯೆ).",
      retryExplanation:
        "ಇದನ್ನು ಇನ್ನಷ್ಟು ಸರಳವಾಗಿ ನೋಡೋಣ! ಇಬ್ಬರು ಸ್ನೇಹಿತರು ಸ್ಕೇಟ್‌ಬೋರ್ಡ್ ಮೇಲೆ ನಿಂತು ಒಬ್ಬರನ್ನೊಬ್ಬರು ತಳ್ಳಿದರೆ, ಇಬ್ಬರೂ ವಿರುದ್ಧ ದಿಕ್ಕಿನಲ್ಲಿ ಹಿಂದಕ್ಕೆ ಚಲಿಸುತ್ತಾರೆ.",
      retryAnalogy: "ಸ್ಕೇಟ್‌ಬೋರ್ಡ್ ಮೇಲೆ ಇಬ್ಬರು ಸ್ನೇಹಿತರು ಒಬ್ಬರನ್ನೊಬ್ಬರು ತಳ್ಳುವುದು.",
      quiz: [
        {
          id: "q1",
          question: "ನೀವು ಗೋಡೆಯನ್ನು 50 N ಬಲದಿಂದ ತಳ್ಳಿದಾಗ, ಗೋಡೆಯ ಪ್ರತಿಕ್ರಿಯೆ ಬಲವು ನಿಮ್ಮ ತಳ್ಳುವಿಕೆಯನ್ನು ಏಕೆ ರದ್ದುಗೊಳಿಸುವುದಿಲ್ಲ?",
          options: [
            { id: "A", text: "ಗೋಡೆ ನಿಮಗಿಂತ ಭಾರವಾಗಿರುವುದರಿಂದ", isCorrect: false, misconception: "ದ್ರವ್ಯರಾಶಿಯನ್ನು ಬಲ ರದ್ದತಿಯೊಂದಿಗೆ ಗೊಂದಲಗೊಳಿಸುತ್ತದೆ" },
            { id: "B", text: "ಎರಡೂ ಬಲಗಳು ಬೇರೆ ಬೇರೆ ವಸ್ತುಗಳ ಮೇಲೆ (ನೀವು ಮತ್ತು ಗೋಡೆ) ಕಾರ್ಯನಿರ್ವಹಿಸುವುದರಿಂದ", isCorrect: true },
            { id: "C", text: "ಪ್ರತಿಕ್ರಿಯೆ ಬಲ ಸ್ವಲ್ಪ ಕಡಿಮೆ ಇರುತ್ತದೆ", isCorrect: false, misconception: "ಪ್ರತಿಕ್ರಿಯೆ ಬಲ ಕಡಿಮೆ ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
            { id: "D", text: "ಘರ್ಷಣೆ ಬಲವನ್ನು ಹೀರಿಕೊಳ್ಳುತ್ತದೆ", isCorrect: false, misconception: "ಘರ್ಷಣೆಯೊಂದಿಗೆ ಗೊಂದಲ" },
          ],
          explanation: "ಕ್ರಿಯೆ ಗೋಡೆಯ ಮೇಲೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ನಿಮ್ಮ ಮೇಲೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.",
        },
        {
          id: "q2",
          question: "ಗಾಳಿಯಿಲ್ಲದ ಬಾಹ್ಯಾಕಾಶದಲ್ಲಿ ರಾಕೆಟ್ ಹೇಗೆ ಮೇಲಕ್ಕೆ ಹಾರುತ್ತದೆ?",
          options: [
            { id: "A", text: "ಹೊರಬರುವ ಅನಿಲಗಳು ರಾಕೆಟ್ ಅನ್ನು ಮುಂದಕ್ಕೆ ತಳ್ಳುತ್ತವೆ", isCorrect: true },
            { id: "B", text: "ರಾಕೆಟ್ ಗಾಳಿಯನ್ನು ಹಿಂದಕ್ಕೆ ತಳ್ಳುತ್ತದೆ", isCorrect: false, misconception: "ಗಾಳಿ ಬೇಕು ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
            { id: "C", text: "ಗುರುತ್ವಾಕರ್ಷಣೆ ಮೇಲಕ್ಕೆ ಎಳೆಯುತ್ತದೆ", isCorrect: false, misconception: "ಗುರುತ್ವಾಕರ್ಷಣೆಯ ದಿಕ್ಕಿನ ಗೊಂದಲ" },
            { id: "D", text: "ಕಾಂತೀಯ ಬಲದಿಂದ", isCorrect: false, misconception: "ಕಾಂತೀಯತೆಯೊಂದಿಗೆ ಗೊಂದಲ" },
          ],
          explanation: "ರಾಕೆಟ್ ಅನಿಲವನ್ನು ಹಿಂದಕ್ಕೆ ತಳ್ಳುತ್ತದೆ, ಅನಿಲ ರಾಕೆಟ್ ಅನ್ನು ಮುಂದಕ್ಕೆ ತಳ್ಳುತ್ತದೆ.",
        },
        {
          id: "q3",
          question: "ಒಂದು ಕೀಟ ವೇಗವಾಗಿ ಚಲಿಸುವ ಬಸ್‌ನ ಗಾಜಿಗೆ ಡಿಕ್ಕಿ ಹೊಡೆಯುತ್ತದೆ. ಯಾವುದರ ಮೇಲೆ ಹೆಚ್ಚು ಬಲ ಬೀಳುತ್ತದೆ?",
          options: [
            { id: "A", text: "ಕೀಟದ ಮೇಲೆ, ಏಕೆಂದರೆ ಅದು ನಜ್ಜುಗುಜ್ಜಾಗುತ್ತದೆ", isCorrect: false, misconception: "ಹಾನಿಯನ್ನು ಹೆಚ್ಚು ಬಲ ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
            { id: "B", text: "ಬಸ್ ಮೇಲೆ, ಏಕೆಂದರೆ ಅದು ದೊಡ್ಡದು", isCorrect: false, misconception: "ದೊಡ್ಡ ದ್ರವ್ಯರಾಶಿ = ಹೆಚ್ಚು ಬಲ" },
            { id: "C", text: "ಎರಡರ ಮೇಲೂ ಸಮಾನ ಬಲ ಬೀಳುತ್ತದೆ", isCorrect: true },
            { id: "D", text: "ಯಾವುದರ ಮೇಲೂ ಇಲ್ಲ", isCorrect: false, misconception: "ಡಿಕ್ಕಿ ಬಲವನ್ನು ನಿರ್ಲಕ್ಷಿಸುತ್ತದೆ" },
          ],
          explanation: "ಎರಡರ ಮೇಲೂ ಸಮಾನ ಬಲ ಬೀಳುತ್ತದೆ.",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "ನ್ಯೂಟನ್‌ನ ಮೂರನೇ ನಿಯಮದಲ್ಲಿ ಕ್ರಿಯೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಬಲಗಳು:",
          options: [
            { id: "A", text: "ಸಮಾನ ಮತ್ತು ವಿರುದ್ಧ ದಿಕ್ಕಿನಲ್ಲಿರುತ್ತವೆ", isCorrect: true },
            { id: "B", text: "ಸಮಾನ ಮತ್ತು ಒಂದೇ ದಿಕ್ಕಿನಲ್ಲಿರುತ್ತವೆ", isCorrect: false, misconception: "ವಿರುದ್ಧ ದಿಕ್ಕನ್ನು ಮರೆಯುತ್ತದೆ" },
            { id: "C", text: "ಒಂದೇ ವಸ್ತುವಿನ ಮೇಲೆ ಇರುತ್ತವೆ", isCorrect: false, misconception: "ಒಂದೇ ವಸ್ತು ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
            { id: "D", text: "ಯಾವಾಗಲೂ ಅಸಮಾನ", isCorrect: false, misconception: "ಅಸಮಾನ ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
          ],
          explanation: "ಕ್ರಿಯೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಯಾವಾಗಲೂ ಸಮಾನ ಮತ್ತು ವಿರುದ್ಧವಾಗಿರುತ್ತವೆ.",
        },
        {
          id: "eq2",
          question: "ಈಜುವಾಗ ನೀವು ನೀರನ್ನು ಹಿಂದಕ್ಕೆ ತಳ್ಳುತ್ತೀರಿ. ನೀರು ನಿಮ್ಮನ್ನು ಯಾವ ದಿಕ್ಕಿಗೆ ತಳ್ಳುತ್ತದೆ?",
          options: [
            { id: "A", text: "ಹಿಂದಕ್ಕೆ", isCorrect: false, misconception: "ದಿಕ್ಕಿನ ಗೊಂದಲ" },
            { id: "B", text: "ಮುಂದಕ್ಕೆ", isCorrect: true },
            { id: "C", text: "ಕೆಳಕ್ಕೆ", isCorrect: false, misconception: "ಕೆಳಕ್ಕೆ ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
            { id: "D", text: "ತಳ್ಳುವುದಿಲ್ಲ", isCorrect: false, misconception: "ಪ್ರತಿಕ್ರಿಯೆ ನಿರಾಕರಿಸುತ್ತದೆ" },
          ],
          explanation: "ನೀರು ನಿಮ್ಮನ್ನು ಮುಂದಕ್ಕೆ ತಳ್ಳುತ್ತದೆ!",
        },
        {
          id: "eq3",
          question: "ಭೂಮಿಯು ಸೇಬನ್ನು 1 N ಬಲದಿಂದ ಕೆಳಕ್ಕೆ ಎಳೆದರೆ, ಸೇಬು ಭೂಮಿಯನ್ನು ಎಷ್ಟು ಬಲದಿಂದ ಮೇಲಕ್ಕೆ ಎಳೆಯುತ್ತದೆ?",
          options: [
            { id: "A", text: "0 N", isCorrect: false, misconception: "ಸಣ್ಣ ವಸ್ತುವಿಗೆ ಬಲವಿಲ್ಲ ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
            { id: "B", text: "0.01 N", isCorrect: false, misconception: "ದ್ರವ್ಯರಾಶಿಗೆ ಅನುಗುಣವಾಗಿ" },
            { id: "C", text: "1 N", isCorrect: true },
            { id: "D", text: "100 N", isCorrect: false, misconception: "ಹೆಚ್ಚು ಎಂದು ಭಾವಿಸುತ್ತದೆ" },
          ],
          explanation: "ಸೇಬು ಕೂಡ ಭೂಮಿಯನ್ನು 1 N ಬಲದಿಂದ ಎಳೆಯುತ್ತದೆ!",
        },
      ],
    },
  },
  quadratic: {
    en: {
      topic: "Quadratic Equations",
      prerequisiteGap: "Factoring Algebraic Expressions & ± square roots",
      explanation:
        "A quadratic equation ax² + bx + c = 0 describes a parabola. Its solutions (roots) are the x-values where the curve crosses the x-axis, found by factoring or using x = (-b ± √(b² - 4ac)) / 2a.",
      analogy:
        "Think of throwing a ball into the air: its height over time forms an arch (parabola), and the two roots are the exact moments it passes a target height—once going up, once coming down.",
      retryExplanation:
        "Let's break it down simply: for x² = 9, both (+3)² = 9 and (-3)² = 9. That's why we ALWAYS write ± when taking a square root!",
      retryAnalogy: "A elevator going 3 floors up (+3) or 3 floors down (-3) from ground zero.",
      quiz: [
        {
          id: "q1",
          question: "What are the solutions to x² - 5x + 6 = 0?",
          options: [
            { id: "A", text: "x = 2 and x = 3", isCorrect: true },
            { id: "B", text: "x = -2 and x = -3", isCorrect: false, misconception: "Sign error when setting factors to zero" },
            { id: "C", text: "x = 1 and x = 6", isCorrect: false, misconception: "Multiplies to 6 but ignores sum = 5" },
            { id: "D", text: "x = 5 only", isCorrect: false, misconception: "Drops one root" },
          ],
          explanation: "(x - 2)(x - 3) = 0 gives x = 2 or x = 3.",
        },
        {
          id: "q2",
          question: "In the quadratic formula, what does the discriminant (b² - 4ac) tell us if it is 0?",
          options: [
            { id: "A", text: "There is exactly one repeated real root", isCorrect: true },
            { id: "B", text: "There are no real roots", isCorrect: false, misconception: "Confuses Δ = 0 with Δ < 0" },
            { id: "C", text: "There are two distinct roots", isCorrect: false, misconception: "Confuses Δ = 0 with Δ > 0" },
            { id: "D", text: "The equation is linear", isCorrect: false, misconception: "Confuses discriminant with coefficient a" },
          ],
          explanation: "When b² - 4ac = 0, ±√0 = 0, leaving one repeated root.",
        },
        {
          id: "q3",
          question: "Solve x² = 16.",
          options: [
            { id: "A", text: "x = 4 only", isCorrect: false, misconception: "Forgets the negative root (±)" },
            { id: "B", text: "x = 4 and x = -4", isCorrect: true },
            { id: "C", text: "x = 8", isCorrect: false, misconception: "Divides by 2 instead of taking square root" },
            { id: "D", text: "x = 256", isCorrect: false, misconception: "Squares instead of taking square root" },
          ],
          explanation: "Both 4² and (-4)² equal 16.",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "If x² = 9, what are the possible values of x?",
          options: [
            { id: "A", text: "3 and -3", isCorrect: true },
            { id: "B", text: "3 only", isCorrect: false, misconception: "Forgets negative root" },
            { id: "C", text: "4.5", isCorrect: false, misconception: "Divides by 2" },
            { id: "D", text: "81", isCorrect: false, misconception: "Squares instead of root" },
          ],
          explanation: "3 × 3 = 9 and (-3) × (-3) = 9.",
        },
        {
          id: "eq2",
          question: "Which of these is a quadratic equation?",
          options: [
            { id: "A", text: "x² + 2x + 1 = 0", isCorrect: true },
            { id: "B", text: "2x + 1 = 0", isCorrect: false, misconception: "Confuses linear with quadratic" },
            { id: "C", text: "x³ + 1 = 0", isCorrect: false, misconception: "Confuses cubic with quadratic" },
            { id: "D", text: "5 = 5", isCorrect: false, misconception: "Identity, not quadratic" },
          ],
          explanation: "A quadratic equation has highest power x².",
        },
        {
          id: "eq3",
          question: "If (x - 1)(x - 4) = 0, then x equals:",
          options: [
            { id: "A", text: "1 or 4", isCorrect: true },
            { id: "B", text: "-1 or -4", isCorrect: false, misconception: "Sign flip error" },
            { id: "C", text: "5", isCorrect: false, misconception: "Adds roots" },
            { id: "D", text: "0", isCorrect: false, misconception: "Assumes x = 0" },
          ],
          explanation: "Setting each factor to zero gives x = 1 or x = 4.",
        },
      ],
    },
    hi: {
      topic: "द्विघात समीकरण (Quadratic Equations)",
      prerequisiteGap: "गुणनखंड और ± वर्गमूल",
      explanation:
        "द्विघात समीकरण ax² + bx + c = 0 का ग्राफ एक परवलय (parabola) होता है। इसके दो मूल (roots) गुणनखंड या द्विघात सूत्र से निकाले जाते हैं।",
      analogy: "हवा में फेंकी गई गेंद की तरह: गेंद ऊपर जाते समय और नीचे आते समय एक ही ऊंचाई से दो बार गुजरती है।",
      retryExplanation: "आसान शब्दों में: x² = 9 का मतलब है (+3)² = 9 और (-3)² = 9, इसलिए हमेशा ± लिखें!",
      retryAnalogy: "ज़मीन से 3 मंजिल ऊपर (+3) या 3 मंजिल नीचे (-3) जाना।",
      quiz: [
        {
          id: "q1",
          question: "x² - 5x + 6 = 0 के हल क्या हैं?",
          options: [
            { id: "A", text: "x = 2 और x = 3", isCorrect: true },
            { id: "B", text: "x = -2 और x = -3", isCorrect: false, misconception: "चिह्न की गलती" },
            { id: "C", text: "x = 1 और x = 6", isCorrect: false, misconception: "योग 5 को अनदेखा किया" },
            { id: "D", text: "केवल x = 5", isCorrect: false, misconception: "एक मूल छोड़ा" },
          ],
          explanation: "(x - 2)(x - 3) = 0 से x = 2, 3 मिलता है।",
        },
        {
          id: "q2",
          question: "यदि b² - 4ac = 0 हो, तो कितने वास्तविक मूल होंगे?",
          options: [
            { id: "A", text: "एक समान वास्तविक मूल", isCorrect: true },
            { id: "B", text: "कोई वास्तविक मूल नहीं", isCorrect: false, misconception: "Δ=0 और Δ<0 में भ्रम" },
            { id: "C", text: "दो अलग मूल", isCorrect: false, misconception: "Δ=0 और Δ>0 में भ्रम" },
            { id: "D", text: "रैखिक समीकरण", isCorrect: false, misconception: "गुणांक से भ्रम" },
          ],
          explanation: "b² - 4ac = 0 होने पर एक ही दोहराया गया मूल मिलता है।",
        },
        {
          id: "q3",
          question: "x² = 16 को हल करें।",
          options: [
            { id: "A", text: "केवल x = 4", isCorrect: false, misconception: "ऋणात्मक मूल भूल गया" },
            { id: "B", text: "x = 4 और x = -4", isCorrect: true },
            { id: "C", text: "x = 8", isCorrect: false, misconception: "2 से भाग दिया" },
            { id: "D", text: "x = 256", isCorrect: false, misconception: "वर्ग कर दिया" },
          ],
          explanation: "4² और (-4)² दोनों 16 होते हैं।",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "यदि x² = 9, तो x के मान क्या हैं?",
          options: [
            { id: "A", text: "3 और -3", isCorrect: true },
            { id: "B", text: "केवल 3", isCorrect: false, misconception: "ऋणात्मक मान भूल गया" },
            { id: "C", text: "4.5", isCorrect: false, misconception: "2 से भाग" },
            { id: "D", text: "81", isCorrect: false, misconception: "वर्ग किया" },
          ],
          explanation: "3 और -3 दोनों का वर्ग 9 है।",
        },
        {
          id: "eq2",
          question: "इनमें से कौन द्विघात समीकरण है?",
          options: [
            { id: "A", text: "x² + 2x + 1 = 0", isCorrect: true },
            { id: "B", text: "2x + 1 = 0", isCorrect: false, misconception: "रैखिक समीकरण" },
            { id: "C", text: "x³ + 1 = 0", isCorrect: false, misconception: "त्रिघात समीकरण" },
            { id: "D", text: "5 = 5", isCorrect: false, misconception: "द्विघात नहीं" },
          ],
          explanation: "जिसमें x की अधिकतम घात 2 हो।",
        },
        {
          id: "eq3",
          question: "यदि (x - 1)(x - 4) = 0, तो x = ?",
          options: [
            { id: "A", text: "1 या 4", isCorrect: true },
            { id: "B", text: "-1 या -4", isCorrect: false, misconception: "चिह्न की गलती" },
            { id: "C", text: "5", isCorrect: false, misconception: "जोड़ दिया" },
            { id: "D", text: "0", isCorrect: false, misconception: "शून्य मान लिया" },
          ],
          explanation: "x = 1 या x = 4।",
        },
      ],
    },
    kn: {
      topic: "ವರ್ಗ ಸಮೀಕರಣಗಳು (Quadratic Equations)",
      prerequisiteGap: "ಅಪವರ್ತನ ಮತ್ತು ± ವರ್ಗಮೂಲ",
      explanation:
        "ವರ್ಗ ಸಮೀಕರಣ ax² + bx + c = 0 ಪರವಲಯವನ್ನು (parabola) ಸೂಚಿಸುತ್ತದೆ. ಇದರ ಮೂಲಗಳನ್ನು ಅಪವರ್ತನ ಅಥವಾ ವರ್ಗ ಸೂತ್ರದಿಂದ ಕಂಡುಹಿಡಿಯಬಹುದು.",
      analogy: "ಗಾಳಿಯಲ್ಲಿ ಎಸೆದ ಚೆಂಡು ಮೇಲೆ ಹೋಗುವಾಗ ಮತ್ತು ಕೆಳಗೆ ಬರುವಾಗ ಒಂದೇ ಎತ್ತರವನ್ನು ಎರಡು ಬಾರಿ ದಾಟುತ್ತದೆ.",
      retryExplanation: "ಸರಳವಾಗಿ: x² = 9 ಎಂದರೆ (+3)² = 9 ಮತ್ತು (-3)² = 9. ಆದ್ದರಿಂದ ಯಾವಾಗಲೂ ± ಬರೆಯಿರಿ!",
      retryAnalogy: "ನೆಲದಿಂದ 3 ಮಹಡಿ ಮೇಲೆ (+3) ಅಥವಾ 3 ಮಹಡಿ ಕೆಳಗೆ (-3) ಹೋಗುವುದು.",
      quiz: [
        {
          id: "q1",
          question: "x² - 5x + 6 = 0 ಇದರ ಮೂಲಗಳು ಯಾವುವು?",
          options: [
            { id: "A", text: "x = 2 ಮತ್ತು x = 3", isCorrect: true },
            { id: "B", text: "x = -2 ಮತ್ತು x = -3", isCorrect: false, misconception: "ಚಿಹ್ನೆ ತಪ್ಪು" },
            { id: "C", text: "x = 1 ಮತ್ತು x = 6", isCorrect: false, misconception: "ಮೊತ್ತ 5 ಮರೆತಿದೆ" },
            { id: "D", text: "x = 5 ಮಾತ್ರ", isCorrect: false, misconception: "ಒಂದು ಮೂಲ ಬಿಟ್ಟಿದೆ" },
          ],
          explanation: "(x - 2)(x - 3) = 0 ನಿಂದ x = 2, 3 ಬರುತ್ತದೆ.",
        },
        {
          id: "q2",
          question: "b² - 4ac = 0 ಆದರೆ ಎಷ್ಟು ಮೂಲಗಳಿರುತ್ತವೆ?",
          options: [
            { id: "A", text: "ಒಂದೇ ಸಮಾನ ನೈಜ ಮೂಲ", isCorrect: true },
            { id: "B", text: "ನೈಜ ಮೂಲಗಳಿಲ್ಲ", isCorrect: false, misconception: "Δ=0 ಮತ್ತು Δ<0 ಗೊಂದಲ" },
            { id: "C", text: "ಎರಡು ವಿಭಿನ್ನ ಮೂಲಗಳು", isCorrect: false, misconception: "Δ=0 ಮತ್ತು Δ>0 ಗೊಂದಲ" },
            { id: "D", text: "ರೇಖೀಯ ಸಮೀಕರಣ", isCorrect: false, misconception: "ಗುಣಾಂಕ ಗೊಂದಲ" },
          ],
          explanation: "b² - 4ac = 0 ಆದಾಗ ಒಂದೇ ಸಮಾನ ಮೂಲ ಇರುತ್ತದೆ.",
        },
        {
          id: "q3",
          question: "x² = 16 ಬಿಡಿಸಿ.",
          options: [
            { id: "A", text: "x = 4 ಮಾತ್ರ", isCorrect: false, misconception: "ಋಣಾತ್ಮಕ ಮೂಲ ಮರೆತಿದೆ" },
            { id: "B", text: "x = 4 ಮತ್ತು x = -4", isCorrect: true },
            { id: "C", text: "x = 8", isCorrect: false, misconception: "2 ರಿಂದ ಭಾಗಿಸಿದೆ" },
            { id: "D", text: "x = 256", isCorrect: false, misconception: "ವರ್ಗ ಮಾಡಿದೆ" },
          ],
          explanation: "4² ಮತ್ತು (-4)² ಎರಡೂ 16 ಆಗುತ್ತವೆ.",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "x² = 9 ಆದರೆ x ನ ಬೆಲೆಗಳು:",
          options: [
            { id: "A", text: "3 ಮತ್ತು -3", isCorrect: true },
            { id: "B", text: "3 ಮಾತ್ರ", isCorrect: false, misconception: "ಋಣಾತ್ಮಕ ಬೆಲೆ ಮರೆತಿದೆ" },
            { id: "C", text: "4.5", isCorrect: false, misconception: "2 ರಿಂದ ಭಾಗಿಸಿದೆ" },
            { id: "D", text: "81", isCorrect: false, misconception: "ವರ್ಗ ಮಾಡಿದೆ" },
          ],
          explanation: "3 ಮತ್ತು -3 ಎರಡರ ವರ್ಗವೂ 9.",
        },
        {
          id: "eq2",
          question: "ಇವುಗಳಲ್ಲಿ ವರ್ಗ ಸಮೀಕರಣ ಯಾವುದು?",
          options: [
            { id: "A", text: "x² + 2x + 1 = 0", isCorrect: true },
            { id: "B", text: "2x + 1 = 0", isCorrect: false, misconception: "ರೇಖೀಯ ಸಮೀಕರಣ" },
            { id: "C", text: "x³ + 1 = 0", isCorrect: false, misconception: "ಘನ ಸಮೀಕರಣ" },
            { id: "D", text: "5 = 5", isCorrect: false, misconception: "ವರ್ಗ ಸಮೀಕರಣವಲ್ಲ" },
          ],
          explanation: "x ನ ಗರಿಷ್ಠ ಘಾತ 2 ಇರಬೇಕು.",
        },
        {
          id: "eq3",
          question: "(x - 1)(x - 4) = 0 ಆದರೆ x = ?",
          options: [
            { id: "A", text: "1 ಅಥವಾ 4", isCorrect: true },
            { id: "B", text: "-1 ಅಥವಾ -4", isCorrect: false, misconception: "ಚಿಹ್ನೆ ತಪ್ಪು" },
            { id: "C", text: "5", isCorrect: false, misconception: "ಕೂಡಿಸಿದೆ" },
            { id: "D", text: "0", isCorrect: false, misconception: "ಶೂನ್ಯ ಎಂದು ಭಾವಿಸಿದೆ" },
          ],
          explanation: "x = 1 ಅಥವಾ x = 4.",
        },
      ],
    },
  },
  photosynthesis: {
    en: {
      topic: "Photosynthesis",
      prerequisiteGap: "Plant Cell Structure (Chloroplasts) & Gas Exchange",
      explanation:
        "Photosynthesis is how green plants convert sunlight, water (H₂O), and carbon dioxide (CO₂) into glucose (food) and oxygen (O₂) inside chloroplasts using chlorophyll.",
      analogy:
        "A leaf is like a solar-powered kitchen: sunlight is the electricity, water and CO₂ are the ingredients, and glucose is the cooked meal!",
      retryExplanation:
        "Simple version: Plants drink water from roots, breathe in CO₂ from air, catch sunlight on green leaves, and make sugar + oxygen.",
      retryAnalogy: "A solar-panel bakery that bakes sugar using sunlight, water, and air.",
      quiz: [
        {
          id: "q1",
          question: "Which gas do plants take in during photosynthesis?",
          options: [
            { id: "A", text: "Carbon dioxide (CO₂)", isCorrect: true },
            { id: "B", text: "Oxygen (O₂)", isCorrect: false, misconception: "Confuses photosynthesis with respiration" },
            { id: "C", text: "Nitrogen (N₂)", isCorrect: false, misconception: "Thinks atmospheric abundance means uptake" },
            { id: "D", text: "Hydrogen (H₂)", isCorrect: false, misconception: "Confuses water splitting with gas intake" },
          ],
          explanation: "Plants absorb CO₂ through stomata and release O₂.",
        },
        {
          id: "q2",
          question: "Where in the plant cell does photosynthesis happen?",
          options: [
            { id: "A", text: "Chloroplast", isCorrect: true },
            { id: "B", text: "Mitochondria", isCorrect: false, misconception: "Confuses photosynthesis with cellular respiration" },
            { id: "C", text: "Nucleus", isCorrect: false, misconception: "Thinks nucleus does all cell work" },
            { id: "D", text: "Vacuole", isCorrect: false, misconception: "Confuses storage with synthesis" },
          ],
          explanation: "Chloroplasts contain chlorophyll, which captures sunlight.",
        },
        {
          id: "q3",
          question: "What are the two main products of photosynthesis?",
          options: [
            { id: "A", text: "Glucose and Oxygen", isCorrect: true },
            { id: "B", text: "Water and Carbon dioxide", isCorrect: false, misconception: "Reverses reactants and products" },
            { id: "C", text: "Starch and Nitrogen", isCorrect: false, misconception: "Confuses mineral nutrition" },
            { id: "D", text: "ATP and CO₂", isCorrect: false, misconception: "Confuses respiration products" },
          ],
          explanation: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ (glucose) + 6O₂.",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "What gives leaves their green color and traps sunlight?",
          options: [
            { id: "A", text: "Chlorophyll", isCorrect: true },
            { id: "B", text: "Hemoglobin", isCorrect: false, misconception: "Confuses plant and animal pigments" },
            { id: "C", text: "Water", isCorrect: false, misconception: "Thinks water is green" },
            { id: "D", text: "Nitrogen", isCorrect: false, misconception: "Confuses fertilizer with pigment" },
          ],
          explanation: "Chlorophyll is the green pigment that absorbs light.",
        },
        {
          id: "eq2",
          question: "Which gas do plants release during photosynthesis that humans breathe?",
          options: [
            { id: "A", text: "Oxygen", isCorrect: true },
            { id: "B", text: "Carbon dioxide", isCorrect: false, misconception: "Reverses input/output gases" },
            { id: "C", text: "Argon", isCorrect: false, misconception: "Guesses inert gas" },
            { id: "D", text: "Methane", isCorrect: false, misconception: "Guesses other gas" },
          ],
          explanation: "Plants release oxygen as a byproduct of photosynthesis.",
        },
        {
          id: "eq3",
          question: "Where do plants get water for photosynthesis?",
          options: [
            { id: "A", text: "From the soil through roots", isCorrect: true },
            { id: "B", text: "From sunlight", isCorrect: false, misconception: "Confuses energy with matter" },
            { id: "C", text: "From flowers", isCorrect: false, misconception: "Confuses plant organs" },
            { id: "D", text: "From oxygen", isCorrect: false, misconception: "Confuses molecules" },
          ],
          explanation: "Roots absorb water from the soil and carry it up to leaves.",
        },
      ],
    },
    hi: {
      topic: "प्रकाश संश्लेषण (Photosynthesis)",
      prerequisiteGap: "पादप कोशिका (हरितलवक) और गैसों का आदान-प्रदान",
      explanation:
        "प्रकाश संश्लेषण वह प्रक्रिया है जिससे हरे पौधे सूर्य के प्रकाश, पानी और कार्बन डाइऑक्साइड (CO₂) का उपयोग करके ग्लूकोज (भोजन) और ऑक्सीजन (O₂) बनाते हैं।",
      analogy: "पत्ती एक सौर ऊर्जा से चलने वाली रसोई है: धूप बिजली है, पानी और CO₂ सामग्री हैं, और ग्लूकोज पका हुआ भोजन है!",
      retryExplanation: "सरल भाषा में: पौधे जड़ों से पानी लेते हैं, हवा से CO₂ लेते हैं, और धूप की मदद से चीनी और ऑक्सीजन बनाते हैं।",
      retryAnalogy: "सूरज की रोशनी से चलने वाली बेकरी जो पानी और हवा से चीनी बनाती है।",
      quiz: [
        {
          id: "q1",
          question: "प्रकाश संश्लेषण में पौधे कौन सी गैस लेते हैं?",
          options: [
            { id: "A", text: "कार्बन डाइऑक्साइड (CO₂)", isCorrect: true },
            { id: "B", text: "ऑक्सीजन (O₂)", isCorrect: false, misconception: "श्वसन और प्रकाश संश्लेषण में भ्रम" },
            { id: "C", text: "नाइट्रोजन", isCorrect: false, misconception: "वायुमंडल की अधिकता से भ्रम" },
            { id: "D", text: "हाइड्रोजन", isCorrect: false, misconception: "जल विभाजन से भ्रम" },
          ],
          explanation: "पौधे CO₂ लेते हैं और O₂ छोड़ते हैं।",
        },
        {
          id: "q2",
          question: "पादप कोशिका में प्रकाश संश्लेषण कहाँ होता है?",
          options: [
            { id: "A", text: "हरितलवक (Chloroplast)", isCorrect: true },
            { id: "B", text: "माइटोकॉन्ड्रिया", isCorrect: false, misconception: "श्वसन से भ्रम" },
            { id: "C", text: "केंद्रक", isCorrect: false, misconception: "केंद्रक का कार्य मानता है" },
            { id: "D", text: "रिक्तिका", isCorrect: false, misconception: "भंडारण से भ्रम" },
          ],
          explanation: "हरितलवक में क्लोरोफिल होता है।",
        },
        {
          id: "q3",
          question: "प्रकाश संश्लेषण के दो मुख्य उत्पाद क्या हैं?",
          options: [
            { id: "A", text: "ग्लूकोज और ऑक्सीजन", isCorrect: true },
            { id: "B", text: "पानी और CO₂", isCorrect: false, misconception: "अभिकारक और उत्पाद उलट दिए" },
            { id: "C", text: "स्टार्च और नाइट्रोजन", isCorrect: false, misconception: "खनिज पोषण से भ्रम" },
            { id: "D", text: "ATP और CO₂", isCorrect: false, misconception: "श्वसन उत्पाद" },
          ],
          explanation: "पौधे ग्लूकोज और ऑक्सीजन बनाते हैं।",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "पत्तियों को हरा रंग कौन देता है?",
          options: [
            { id: "A", text: "क्लोरोफिल", isCorrect: true },
            { id: "B", text: "हीमोग्लोबिन", isCorrect: false, misconception: "रक्त वर्णक से भ्रम" },
            { id: "C", text: "पानी", isCorrect: false, misconception: "पानी हरा मानता है" },
            { id: "D", text: "नाइट्रोजन", isCorrect: false, misconception: "खाद से भ्रम" },
          ],
          explanation: "क्लोरोफिल हरा वर्णक है।",
        },
        {
          id: "eq2",
          question: "पौधे प्रकाश संश्लेषण में कौन सी गैस छोड़ते हैं?",
          options: [
            { id: "A", text: "ऑक्सीजन", isCorrect: true },
            { id: "B", text: "CO₂", isCorrect: false, misconception: "गैस उलट दी" },
            { id: "C", text: "आर्गन", isCorrect: false, misconception: "अनुमान" },
            { id: "D", text: "मीथेन", isCorrect: false, misconception: "अनुमान" },
          ],
          explanation: "पौधे ऑक्सीजन छोड़ते हैं।",
        },
        {
          id: "eq3",
          question: "पौधों को पानी कहाँ से मिलता है?",
          options: [
            { id: "A", text: "जड़ों से मिट्टी के द्वारा", isCorrect: true },
            { id: "B", text: "धूप से", isCorrect: false, misconception: "ऊर्जा और पदार्थ में भ्रम" },
            { id: "C", text: "फूलों से", isCorrect: false, misconception: "अंगों में भ्रम" },
            { id: "D", text: "ऑक्सीजन से", isCorrect: false, misconception: "अणुओं में भ्रम" },
          ],
          explanation: "जड़ें मिट्टी से पानी सोखती हैं।",
        },
      ],
    },
    kn: {
      topic: "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ (Photosynthesis)",
      prerequisiteGap: "ಸಸ್ಯ ಕೋಶ ರಚನೆ (ಕ್ಲೋರೋಪ್ಲಾಸ್ಟ್) ಮತ್ತು ಅನಿಲ ವಿನಿಮಯ",
      explanation:
        "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಎಂದರೆ ಹಸಿರು ಸಸ್ಯಗಳು ಸೂರ್ಯನ ಬೆಳಕು, ನೀರು ಮತ್ತು ಇಂಗಾಲದ ಡೈಆಕ್ಸೈಡ್ (CO₂) ಬಳಸಿ ಗ್ಲೂಕೋಸ್ (ಆಹಾರ) ಮತ್ತು ಆಮ್ಲಜನಕ (O₂) ತಯಾರಿಸುವ ಪ್ರಕ್ರಿಯೆ.",
      analogy: "ಎಲೆ ಒಂದು ಸೌರಶಕ್ತಿ ಅಡುಗೆಮನೆ: ಸೂರ್ಯನ ಬೆಳಕು ವಿದ್ಯುತ್, ನೀರು ಮತ್ತು CO₂ ಪದಾರ್ಥಗಳು, ಮತ್ತು ಗ್ಲೂಕೋಸ್ ತಯಾರಾದ ಆಹಾರ!",
      retryExplanation: "ಸರಳವಾಗಿ: ಸಸ್ಯಗಳು ಬೇರುಗಳಿಂದ ನೀರು, ಗಾಳಿಯಿಂದ CO₂ ತೆಗೆದುಕೊಂಡು ಬೆಳಕಿನಲ್ಲಿ ಸಕ್ಕರೆ ಮತ್ತು ಆಮ್ಲಜನಕ ತಯಾರಿಸುತ್ತವೆ.",
      retryAnalogy: "ಸೂರ್ಯನ ಬೆಳಕಿನಿಂದ ನಡೆಯುವ ಬೇಕರಿ.",
      quiz: [
        {
          id: "q1",
          question: "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯಲ್ಲಿ ಸಸ್ಯಗಳು ಯಾವ ಅನಿಲವನ್ನು ಒಳಗೆ ತೆಗೆದುಕೊಳ್ಳುತ್ತವೆ?",
          options: [
            { id: "A", text: "ಇಂಗಾಲದ ಡೈಆಕ್ಸೈಡ್ (CO₂)", isCorrect: true },
            { id: "B", text: "ಆಮ್ಲಜನಕ (O₂)", isCorrect: false, misconception: "ಉಸಿರಾಟದೊಂದಿಗೆ ಗೊಂದಲ" },
            { id: "C", text: "ಸಾರಜನಕ", isCorrect: false, misconception: "ವಾತಾವರಣ ಗೊಂದಲ" },
            { id: "D", text: "ಜಲಜನಕ", isCorrect: false, misconception: "ನೀರಿನ ವಿಭಜನೆ ಗೊಂದಲ" },
          ],
          explanation: "ಸಸ್ಯಗಳು CO₂ ತೆಗೆದುಕೊಂಡು O₂ ಬಿಡುಗಡೆ ಮಾಡುತ್ತವೆ.",
        },
        {
          id: "q2",
          question: "ಸಸ್ಯ ಕೋಶದಲ್ಲಿ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಎಲ್ಲಿ ನಡೆಯುತ್ತದೆ?",
          options: [
            { id: "A", text: "ಕ್ಲೋರೋಪ್ಲಾಸ್ಟ್", isCorrect: true },
            { id: "B", text: "ಮೈಟೋಕಾಂಡ್ರಿಯಾ", isCorrect: false, misconception: "ಉಸಿರಾಟದೊಂದಿಗೆ ಗೊಂದಲ" },
            { id: "C", text: "ನ್ಯೂಕ್ಲಿಯಸ್", isCorrect: false, misconception: "ಕೋಶ ಕೇಂದ್ರ ಗೊಂದಲ" },
            { id: "D", text: "ರಸದಾನಿ", isCorrect: false, misconception: "ಸಂಗ್ರಹಣೆ ಗೊಂದಲ" },
          ],
          explanation: "ಕ್ಲೋರೋಪ್ಲಾಸ್ಟ್‌ನಲ್ಲಿ ಕ್ಲೋರೋಫಿಲ್ ಇರುತ್ತದೆ.",
        },
        {
          id: "q3",
          question: "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯ ಎರಡು ಮುಖ್ಯ ಉತ್ಪನ್ನಗಳು ಯಾವುವು?",
          options: [
            { id: "A", text: "ಗ್ಲೂಕೋಸ್ ಮತ್ತು ಆಮ್ಲಜನಕ", isCorrect: true },
            { id: "B", text: "ನೀರು ಮತ್ತು CO₂", isCorrect: false, misconception: "ಪ್ರತಿಕ್ರಿಯಕಗಳನ್ನು ಉಲ್ಟಾ ಮಾಡಿದೆ" },
            { id: "C", text: "ಪಿಷ್ಟ ಮತ್ತು ಸಾರಜನಕ", isCorrect: false, misconception: "ಖನಿಜ ಗೊಂದಲ" },
            { id: "D", text: "ATP ಮತ್ತು CO₂", isCorrect: false, misconception: "ಉಸಿರಾಟ ಉತ್ಪನ್ನ" },
          ],
          explanation: "ಸಸ್ಯಗಳು ಗ್ಲೂಕೋಸ್ ಮತ್ತು ಆಮ್ಲಜನಕ ತಯಾರಿಸುತ್ತವೆ.",
        },
      ],
      easierQuiz: [
        {
          id: "eq1",
          question: "ಎಲೆಗಳಿಗೆ ಹಸಿರು ಬಣ್ಣ ನೀಡುವುದು ಯಾವುದು?",
          options: [
            { id: "A", text: "ಕ್ಲೋರೋಫಿಲ್", isCorrect: true },
            { id: "B", text: "ಹಿಮೋಗ್ಲೋಬಿನ್", isCorrect: false, misconception: "ರಕ್ತ ವರ್ಣದ್ರವ್ಯ ಗೊಂದಲ" },
            { id: "C", text: "ನೀರು", isCorrect: false, misconception: "ನೀರು ಹಸಿರು ಎಂದು ಭಾವಿಸಿದೆ" },
            { id: "D", text: "ಸಾರಜನಕ", isCorrect: false, misconception: "ಗೊಬ್ಬರ ಗೊಂದಲ" },
          ],
          explanation: "ಕ್ಲೋರೋಫಿಲ್ ಹಸಿರು ವರ್ಣದ್ರವ್ಯವಾಗಿದೆ.",
        },
        {
          id: "eq2",
          question: "ಸಸ್ಯಗಳು ಯಾವ ಅನಿಲವನ್ನು ಬಿಡುಗಡೆ ಮಾಡುತ್ತವೆ?",
          options: [
            { id: "A", text: "ಆಮ್ಲಜನಕ", isCorrect: true },
            { id: "B", text: "CO₂", isCorrect: false, misconception: "ಅನಿಲ ಉಲ್ಟಾ ಮಾಡಿದೆ" },
            { id: "C", text: "ಆರ್ಗಾನ್", isCorrect: false, misconception: "ಊಹೆ" },
            { id: "D", text: "ಮೀಥೇನ್", isCorrect: false, misconception: "ಊಹೆ" },
          ],
          explanation: "ಸಸ್ಯಗಳು ಆಮ್ಲಜನಕವನ್ನು ಬಿಡುಗಡೆ ಮಾಡುತ್ತವೆ.",
        },
        {
          id: "eq3",
          question: "ಸಸ್ಯಗಳಿಗೆ ನೀರು ಎಲ್ಲಿಂದ ಸಿಗುತ್ತದೆ?",
          options: [
            { id: "A", text: "ಬೇರುಗಳ ಮೂಲಕ ಮಣ್ಣಿನಿಂದ", isCorrect: true },
            { id: "B", text: "ಸೂರ್ಯನ ಬೆಳಕಿನಿಂದ", isCorrect: false, misconception: "ಶಕ್ತಿ ಮತ್ತು ವಸ್ತು ಗೊಂದಲ" },
            { id: "C", text: "ಹೂವುಗಳಿಂದ", isCorrect: false, misconception: "ಭಾಗಗಳ ಗೊಂದಲ" },
            { id: "D", text: "ಆಮ್ಲಜನಕದಿಂದ", isCorrect: false, misconception: "ಅಣು ಗೊಂದಲ" },
          ],
          explanation: "ಬೇರುಗಳು ಮಣ್ಣಿನಿಂದ ನೀರನ್ನು ಹೀರಿಕೊಳ್ಳುತ್ತವೆ.",
        },
      ],
    },
  },
};
