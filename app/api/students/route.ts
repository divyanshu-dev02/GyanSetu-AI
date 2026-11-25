import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllStudents, saveStudentProfile, deleteStudentProfile } from "@/lib/store";
import type { StudentProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createStudentSchema = z.object({
  name: z.string().min(2),
  grade: z.string().min(1),
  preferredLanguage: z.enum(["en", "hi", "kn"]).default("en"),
  currentLevel: z.enum(["simple", "standard", "advanced"]).default("standard"),
  masteredTopics: z.array(z.string()).default([]),
  weakTopics: z.array(z.string()).default([]),
});

export async function GET() {
  const students = await getAllStudents();
  return NextResponse.json({ ok: true, students });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createStudentSchema.parse(json);
    const id = `stu-${parsed.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
    
    const newStudent: StudentProfile = {
      id,
      name: parsed.name,
      grade: parsed.grade,
      preferredLanguage: parsed.preferredLanguage,
      currentLevel: parsed.currentLevel,
      masteredTopics: parsed.masteredTopics,
      weakTopics: parsed.weakTopics,
      recentScores: [],
      streak: 1,
    };

    await saveStudentProfile(newStudent);
    return NextResponse.json({ ok: true, student: newStudent }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Invalid payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing student id" }, { status: 400 });
  }

  await deleteStudentProfile(id);
  return NextResponse.json({ ok: true, deletedId: id });
}
