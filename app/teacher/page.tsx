import dynamic from "next/dynamic";

const TeacherPage = dynamic(
  () => import("@/components/teacher-page").then((m) => m.TeacherPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    ),
  }
);

export const metadata = {
  title: "Teacher Co-Pilot — GyanSetu AI",
  description: "See where your class is stuck and generate a targeted lesson plan.",
};

export default function TeacherRoute() {
  return <TeacherPage />;
}
