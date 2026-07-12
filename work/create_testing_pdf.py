from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    Preformatted,
)


ROOT = Path(r"C:\Users\dave\Documents\Codex\2026-07-08\you-are-a-senior-full-stack")
OUT = ROOT / "outputs" / "TenaFit_Testing_Guide.pdf"


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#16745b"),
        spaceAfter=16,
    )
)
styles.add(
    ParagraphStyle(
        name="HeadingCustom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#17231f"),
        spaceBefore=12,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#26322e"),
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="CodeCustom",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#10231e"),
        backColor=colors.HexColor("#eef7f4"),
        borderPadding=6,
        leftIndent=0,
        rightIndent=0,
        spaceBefore=4,
        spaceAfter=8,
    )
)


def h(text):
    return Paragraph(text, styles["HeadingCustom"])


def p(text):
    return Paragraph(text, styles["BodyCustom"])


def code(text):
    return Preformatted(text, styles["CodeCustom"])


def bullets(items):
    return [Paragraph(f"- {item}", styles["BodyCustom"]) for item in items]


def build():
    story = []
    story.append(Paragraph("TenaFit Testing Guide", styles["TitleCustom"]))
    story.append(p("Detailed step-by-step guide for testing the PostgreSQL, Node.js/Express, EFCT food-data ingestion, and Expo mobile app implementation."))
    story.append(p("Important: the food seed is generated from the Ethiopian Food Composition Table 2025 PDF. Do not replace it with mock food data."))

    story.append(h("1. What You Need Installed"))
    story.extend(
        bullets(
            [
                "PostgreSQL 15 or newer, with a database user that can create extensions.",
                "Node.js and npm. The project was written for modern Node 18+.",
                "Python with pdfplumber available. In this Codex workspace, use the bundled Python path shown in commands below.",
                "Expo Go on your phone, or Android Studio/iOS simulator if testing locally.",
                "Twilio Verify credentials for real phone OTP testing.",
                "Google OAuth client ID for real Google sign-in testing.",
            ]
        )
    )

    story.append(h("2. Open the Project Folder"))
    story.append(code(r"""cd C:\Users\dave\Documents\Codex\2026-07-08\you-are-a-senior-full-stack"""))

    story.append(h("3. Create PostgreSQL Database"))
    story.append(p("Run these in a terminal where psql is available. Change the password if you want."))
    story.append(code(r"""psql -U postgres
CREATE DATABASE tenafit;
CREATE USER tenafit_app WITH PASSWORD 'tenafit_dev_password';
GRANT ALL PRIVILEGES ON DATABASE tenafit TO tenafit_app;
\q"""))
    story.append(p("If extension creation fails during migration, run the migration as a superuser or grant the needed extension permissions."))

    story.append(h("4. Configure Backend Environment"))
    story.append(code(r"""cd backend
copy .env.example .env"""))
    story.append(p("Open backend\\.env and set these values:"))
    env_table = Table(
        [
            ["Variable", "Example / Meaning"],
            ["DATABASE_URL", "postgres://tenafit_app:tenafit_dev_password@localhost:5432/tenafit"],
            ["TENAFIT_FIELD_ENCRYPTION_KEY", "Use a long random secret, 64+ characters recommended."],
            ["JWT_SECRET", "Use a separate long random secret."],
            ["TWILIO_*", "Required only for real phone OTP."],
            ["GOOGLE_CLIENT_ID", "Required only for real Google OAuth."],
            ["OPENAI_API_KEY", "Optional. Meal plan generation works without it; LLM notes use it."],
        ],
        colWidths=[2.0 * inch, 4.8 * inch],
    )
    env_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16745b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd8d2")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5faf8")]),
            ]
        )
    )
    story.append(env_table)

    story.append(h("5. Install Backend Dependencies"))
    story.append(code(r"""cd backend
npm install"""))

    story.append(h("6. Run Database Migration"))
    story.append(code(r"""cd backend
npm run migrate"""))
    story.append(p("Expected result: Applied 001_initial_schema.sql. Then confirm tables exist:"))
    story.append(code("psql \"postgres://tenafit_app:tenafit_dev_password@localhost:5432/tenafit\" -c \"\\dt\""))

    story.append(h("7. Test EFCT PDF Parsing"))
    story.append(p("The parser has already produced 570 food rows in this workspace. To regenerate from the provided PDF:"))
    story.append(code("cd C:\\Users\\dave\\Documents\\Codex\\2026-07-08\\you-are-a-senior-full-stack\npython backend\\src\\scripts\\parse_ethiopian_fct.py \"C:\\Users\\dave\\Downloads\\The_Ethiopian_Food_Composition_Table_2025_cd9308_260707_131817.pdf\""))
    story.append(p("Expected result: Parsed 570 foods and wrote backend\\data\\ethiopian-fct-food-data.json."))
    story.append(code("node -e \"const rows=require('./backend/data/ethiopian-fct-food-data.json'); console.log(rows.length, rows[0])\""))

    story.append(h("8. Seed Food Data"))
    story.append(code(r"""cd backend
npm run seed:food"""))
    story.append(p("Expected result: Seeded 570 EFCT foods. Confirm in PostgreSQL:"))
    story.append(code("psql \"postgres://tenafit_app:tenafit_dev_password@localhost:5432/tenafit\" -c \"select count(*) from food_data;\""))

    story.append(PageBreak())
    story.append(h("9. Start Backend API"))
    story.append(code(r"""cd backend
npm run dev"""))
    story.append(p("In another terminal, test health:"))
    story.append(code(r"""curl http://localhost:4000/health"""))
    story.append(p('Expected response: {"ok":true,"service":"tenafit-api"}'))

    story.append(h("10. Test Real Phone OTP Auth"))
    story.append(p("Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in backend\\.env."))
    story.append(code("curl -X POST http://localhost:4000/auth/phone/start ^\n  -H \"Content-Type: application/json\" ^\n  -d \"{\\\"phone\\\":\\\"+251900000000\\\"}\"\n\ncurl -X POST http://localhost:4000/auth/phone/verify ^\n  -H \"Content-Type: application/json\" ^\n  -d \"{\\\"phone\\\":\\\"+251900000000\\\",\\\"code\\\":\\\"123456\\\"}\""))
    story.append(p("Use the real SMS code in the second command. Save the returned token as TOKEN."))

    story.append(h("11. Local Backend Testing Without OTP"))
    story.append(p("If Twilio is not ready, create a local user directly in the database, then sign a JWT using your JWT_SECRET. This tests profile, check-in, and meal-plan APIs without mocking food."))
    story.append(code("psql \"postgres://tenafit_app:tenafit_dev_password@localhost:5432/tenafit\" -c \"select set_config('app.field_encryption_key','YOUR_ENCRYPTION_KEY_FROM_ENV',false); insert into users (phone_encrypted, phone_hash, auth_provider) values (app_private.encrypt_text('+251900000001'), app_private.sha256_lookup('+251900000001'), 'phone') on conflict (phone_hash) do update set auth_provider='phone' returning id, auth_provider;\""))
    story.append(p("Copy the returned user id. Then generate a token:"))
    story.append(code("cd backend\nnode -e \"const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:'PASTE_USER_ID_HERE',authProvider:'phone'}, process.env.JWT_SECRET || 'YOUR_JWT_SECRET_FROM_ENV', {expiresIn:'30d'}))\""))

    story.append(h("12. Test Profile Save"))
    story.append(code("curl -X PUT http://localhost:4000/profile ^\n  -H \"Content-Type: application/json\" ^\n  -H \"Authorization: Bearer TOKEN_HERE\" ^\n  -d \"{\\\"age\\\":29,\\\"sex\\\":\\\"female\\\",\\\"heightCm\\\":165,\\\"weightKg\\\":70,\\\"activityLevel\\\":\\\"moderate\\\",\\\"goalWeightKg\\\":63,\\\"medicalConditions\\\":[\\\"hypertension\\\"],\\\"allergies\\\":[\\\"nuts\\\"]}\""))
    story.append(p("Expected response includes targetCalories calculated with Mifflin-St Jeor. Sensitive values are stored encrypted in user_profiles."))

    story.append(h("13. Test Meal Plan Generation"))
    story.append(code(r"""curl -X POST http://localhost:4000/meal-plans/today ^
  -H "Authorization: Bearer TOKEN_HERE" ^
  -H "Content-Type: application/json" """))
    story.append(p("Expected response: breakfast, lunch, dinner, and snack selected from the seeded food_data table only. If allergies include nuts, nut rows should be filtered out."))

    story.append(h("14. Test Weekly Check-In"))
    story.append(code("curl -X POST http://localhost:4000/profile/weekly-check-in ^\n  -H \"Content-Type: application/json\" ^\n  -H \"Authorization: Bearer TOKEN_HERE\" ^\n  -d \"{\\\"currentWeightKg\\\":68.5,\\\"followedPlan\\\":true}\""))
    story.append(p("Expected response includes streakCount, recalculated targetCalories, and goalReached."))

    story.append(h("15. Test Mobile App"))
    story.append(code(r"""cd mobile
npm install
set EXPO_PUBLIC_API_URL=http://localhost:4000
npm run start"""))
    story.extend(
        bullets(
            [
                "Open Expo Go and scan the QR code, or run the web target.",
                "Complete onboarding: age, height, weight, activity, goal, health conditions, allergies.",
                "Dashboard should show numbers and progress bars, not graphs.",
                "Use Weekly check-in and confirm the progress bar and goal-reached subscription screen.",
                "Meal cards should appear only when connected to an EFCT-generated backend meal plan.",
            ]
        )
    )

    story.append(h("16. Final Test Checklist"))
    story.extend(
        bullets(
            [
                "Migration creates users, user_profiles, food_data, meal_plans, streaks, and subscriptions.",
                "food_data count is 570 after seeding from the EFCT PDF.",
                "Profile values are encrypted bytea fields in PostgreSQL.",
                "Health endpoint returns ok.",
                "OTP works with real Twilio credentials, or local JWT path works for backend tests.",
                "Meal plans use food_data rows only.",
                "Allergy and hypertension filters affect food retrieval.",
                "Weekly check-in updates streak and target calories.",
                "Expo screens render cleanly on mobile and use progress bars, not charts.",
            ]
        )
    )

    story.append(h("17. Troubleshooting"))
    story.extend(
        bullets(
            [
                "Missing app.field_encryption_key: make sure TENAFIT_FIELD_ENCRYPTION_KEY is set in backend\\.env before migration or encrypted writes.",
                "pgcrypto extension error: run migration as postgres superuser or grant extension permissions.",
                "Twilio 401/403: verify account SID, auth token, and Verify service SID.",
                "No meal plan: confirm food_data is seeded and select count(*) from food_data returns 570.",
                "Mobile cannot reach API: use your computer LAN IP instead of localhost when testing on a physical phone.",
            ]
        )
    )

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=LETTER,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title="TenaFit Testing Guide",
    )
    doc.build(story)


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    build()
    print(OUT)
