import type { ClassTopicStat, Language, TeacherFinalPayload } from "@/lib/types";

export function getTeacherFixture(
  language: Language,
  classStats: ClassTopicStat[]
): TeacherFinalPayload {
  const weakest = [...classStats].sort((a, b) => a.masteryPercent - b.masteryPercent)[0] ?? {
    topic: "Newton's Third Law",
    masteryPercent: 42,
    strugglingCount: 18,
    totalStudents: 32,
    topMisconception: "Thinks action and reaction forces cancel out on the same object",
  };

  const titles: Record<Language, string> = {
    en: `15-Min Smart Revision: ${weakest.topic}`,
    hi: `15-मिनट स्मार्ट रिवीजन: ${weakest.topic}`,
    kn: `15-ನಿಮಿಷ ಸ್ಮಾರ್ಟ್ ಪುನರಾವರ್ತನೆ: ${weakest.topic}`,
  };

  const stepsByLang: Record<Language, TeacherFinalPayload["revisionPlan"]["steps"]> = {
    en: [
      { phase: "1. Misconception Bust (4 min)", minutes: 4, activity: `Address directly: "${weakest.topMisconception}" using a two-student skateboard push demo.` },
      { phase: "2. Guided Peer Practice (6 min)", minutes: 6, activity: "Pair mentors with learners to draw force-pair arrows on TWO separate free-body diagrams." },
      { phase: "3. Exit Ticket Check (5 min)", minutes: 5, activity: "Run a 3-question rapid diagnostic to verify mastery rises above 75%." },
    ],
    hi: [
      { phase: "1. भ्रम निवारण (4 मिनट)", minutes: 4, activity: `सीधे समझाएं: "${weakest.topMisconception}" — दो छात्रों के साथ धक्का-प्रतिक्रिया डेमो।` },
      { phase: "2. सहपाठी अभ्यास (6 मिनट)", minutes: 6, activity: "मेंटर और छात्रों की जोड़ी बनाकर दो अलग-अलग वस्तुओं पर बल तीर बनवाएं।" },
      { phase: "3. त्वरित जांच (5 मिनट)", minutes: 5, activity: "3 प्रश्नों का त्वरित क्विज़ लें।" },
    ],
    kn: [
      { phase: "1. ತಪ್ಪು ಕಲ್ಪನೆ ನಿವಾರಣೆ (4 ನಿಮಿಷ)", minutes: 4, activity: `ನೇರವಾಗಿ ವಿವರಿಸಿ: "${weakest.topMisconception}" — ಇಬ್ಬರು ವಿದ್ಯಾರ್ಥಿಗಳೊಂದಿಗೆ ಪ್ರಾಯೋಗಿಕ ಪ್ರದರ್ಶನ.` },
      { phase: "2. ಸಹಪಾಠಿ ಅಭ್ಯಾಸ (6 ನಿಮಿಷ)", minutes: 6, activity: "ಮೆಂಟರ್ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿಗಳ ಜೋಡಿಯಲ್ಲಿ ಎರಡು ಬೇರೆ ವಸ್ತುಗಳ ಮೇಲೆ ಬಲದ ಬಾಣಗಳನ್ನು ಬರೆಯಿಸಿ." },
      { phase: "3. ತ್ವರಿತ ಪರೀಕ್ಷೆ (5 ನಿಮಿಷ)", minutes: 5, activity: "3 ಪ್ರಶ್ನೆಗಳ ತ್ವರಿತ ರಸಪ್ರಶ್ನೆ ನಡೆಸಿ." },
    ],
  };

  return {
    language,
    classStats,
    revisionPlan: {
      title: titles[language] ?? titles.en,
      durationMinutes: 15,
      focusTopic: weakest.topic,
      steps: stepsByLang[language] ?? stepsByLang.en,
    },
    peerGroups: [
      {
        groupName: "Group Alpha",
        topic: weakest.topic,
        mentor: "Karthik (Mastered)",
        learners: ["Aarav", "Diya"],
        activity: "Two-object force diagram challenge",
      },
      {
        groupName: "Group Beta",
        topic: "Quadratic Equations",
        mentor: "Ananya (Mastered)",
        learners: ["Rohan", "Meera"],
        activity: "± Root & factoring relay",
      },
    ],
    demoMode: true,
  };
}
