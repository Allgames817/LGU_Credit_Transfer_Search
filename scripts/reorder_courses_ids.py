import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES_JS = ROOT / "backend" / "src" / "data" / "courses.js"


FACULTY_ORDER = ["SDS", "SSE", "SME"]
FACULTY_RANK = {name: i for i, name in enumerate(FACULTY_ORDER)}


def norm_str(v) -> str:
    if v is None:
        return ""
    s = str(v).strip()
    s = re.sub(r"\s+", " ", s)
    return s


def sort_key(course: dict):
    faculty = norm_str(course.get("faculty", ""))
    rank = FACULTY_RANK.get(faculty, 999)

    uni = norm_str(course.get("partnerUniversity", ""))
    uni_key = uni.casefold()

    # deterministic tie-breakers within same school
    pcode = norm_str(course.get("partnerCourseCode", "")).casefold()
    ccode = norm_str(course.get("cuhkszCourseCode", "")).casefold()
    pname = norm_str(course.get("partnerCourseName", "")).casefold()
    cname = norm_str(course.get("cuhkszCourseName", "")).casefold()
    return (rank, uni_key, pcode, ccode, pname, cname)


def load_courses_via_node() -> list[dict]:
    cmd = [
        "node",
        "-e",
        "const c=require('./backend/src/data/courses'); console.log(JSON.stringify(c));",
    ]
    out = subprocess.check_output(cmd, cwd=str(ROOT), text=True)
    return json.loads(out)


def js_str(s: str) -> str:
    return json.dumps(str(s), ensure_ascii=False)


def fmt_course(c: dict) -> str:
    def num(v):
        try:
            f = float(v)
            return int(f) if f.is_integer() else f
        except Exception:
            return 0

    fields = [
        f"id: {int(c['id'])}",
        f"partnerUniversity: {js_str(c.get('partnerUniversity', ''))}",
        f"partnerCourseCode: {js_str(c.get('partnerCourseCode', ''))}",
        f"partnerCourseName: {js_str(c.get('partnerCourseName', ''))}",
        f"partnerCredits: {num(c.get('partnerCredits', 0))}",
        f"cuhkszCourseCode: {js_str(c.get('cuhkszCourseCode', ''))}",
        f"cuhkszCourseName: {js_str(c.get('cuhkszCourseName', ''))}",
        f"cuhkszCredits: {num(c.get('cuhkszCredits', 0))}",
        f"faculty: {js_str(c.get('faculty', ''))}",
        f"status: {js_str(c.get('status', 'pending'))}",
    ]
    return "  { " + ", ".join(fields) + " }"


def main() -> None:
    courses = load_courses_via_node()
    courses_sorted = sorted(courses, key=sort_key)

    # renumber sequentially
    for i, c in enumerate(courses_sorted, start=1):
        c["id"] = i

    content = (
        "const courses = [\n"
        + ",\n".join(fmt_course(c) for c in courses_sorted)
        + "\n];\n\nmodule.exports = courses;\n"
    )
    COURSES_JS.write_text(content, encoding="utf-8")

    print("total", len(courses_sorted))
    print("first_last_id", courses_sorted[0]["id"], courses_sorted[-1]["id"])


if __name__ == "__main__":
    main()

