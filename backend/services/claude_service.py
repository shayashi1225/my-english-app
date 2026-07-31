import os
import json
import re
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"


def _parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


GRAMMAR_ISSUE_CATEGORIES = [
    "articles",
    "subject_verb_agreement",
    "tense",
    "prepositions",
    "word_order",
    "singular_plural",
    "word_choice",
    "pronouns",
    "sentence_structure",
    "other",
]

GRAMMAR_CATEGORY_LABELS_JA = {
    "articles": "冠詞",
    "subject_verb_agreement": "主語と動詞の一致",
    "tense": "時制",
    "prepositions": "前置詞",
    "word_order": "語順",
    "singular_plural": "単数・複数",
    "word_choice": "語彙選択",
    "pronouns": "代名詞",
    "sentence_structure": "文構造",
    "other": "その他",
}


def _normalize_categories(categories) -> list:
    if not isinstance(categories, list):
        return []
    valid = set(GRAMMAR_ISSUE_CATEGORIES)
    return [c if c in valid else "other" for c in categories]


SITUATIONS = [
    {
        "id": "daily_standup",
        "title": "Daily Standup Meeting",
        "description": "Share your progress, plans, and blockers in a team standup",
        "icon": "🕐",
    },
    {
        "id": "code_review",
        "title": "Code Review Discussion",
        "description": "Discuss pull request feedback and technical decisions with your team",
        "icon": "💻",
    },
    {
        "id": "client_presentation",
        "title": "Client Presentation",
        "description": "Present a new feature or product update to a client",
        "icon": "📊",
    },
    {
        "id": "incident_response",
        "title": "Incident Response Call",
        "description": "Coordinate with your team during a production incident",
        "icon": "🚨",
    },
    {
        "id": "sprint_planning",
        "title": "Sprint Planning",
        "description": "Discuss sprint goals, estimate tasks, and assign work",
        "icon": "📋",
    },
    {
        "id": "one_on_one",
        "title": "1-on-1 with Manager",
        "description": "Discuss career growth, project status, and feedback with your manager",
        "icon": "👤",
    },
    {
        "id": "casual_chat",
        "title": "Casual Chat with a Colleague",
        "description": "Small talk about weekend plans, hobbies, and life outside work over coffee",
        "icon": "☕",
    },
]

SYSTEM_PROMPT = """You are an experienced English conversation coach helping Japanese IT professionals improve their business English.

Your role in this conversation:
1. Play the role of a native English speaker in a realistic IT business scenario
2. Ask natural follow-up questions to keep the conversation going
3. After the user responds, evaluate their English naturally embedded in your reply

When responding to the user's message, always return a JSON object with this structure:
{
  "ai_message": "Your next conversational message (stay in character, move the conversation forward)",
  "feedback": {
    "grammar_score": <float 0-10>,
    "grammar_issues": ["issue1", "issue2"],
    "grammar_issue_categories": ["category1", "category2"],
    "corrected_text": "The corrected version of what the user said (only if needed)",
    "pronunciation_tips": ["tip1", "tip2"],
    "positive_feedback": "Something the user did well"
  },
  "is_last_turn": <boolean, true only after 6-8 exchanges>
}

For "grammar_issue_categories": provide exactly one category code per entry in "grammar_issues", in the same order, so each issue has a matching category. Use ONLY these exact lowercase codes: __CATEGORIES__. If "grammar_issues" is empty, use an empty array [].

Keep the conversation natural and encouraging. Match the vocabulary and tone to the situation: business vocabulary for formal scenarios, and relaxed, informal small talk for casual scenarios like a coffee chat with a colleague.""".replace("__CATEGORIES__", ", ".join(GRAMMAR_ISSUE_CATEGORIES))


def get_situations():
    return SITUATIONS


def start_conversation(situation_id: str, learner_name: str = None) -> dict:
    situation = next((s for s in SITUATIONS if s["id"] == situation_id), None)
    if not situation:
        raise ValueError(f"Unknown situation: {situation_id}")

    name_context = f"\nThe learner's name is {learner_name}. Feel free to use their name naturally in the conversation." if learner_name else ""
    prompt = f"""Start a realistic {situation['title']} conversation.

Set the scene briefly in 1-2 sentences, then ask the user a natural opening question appropriate for this situation.{name_context}

Return JSON:
{{
  "ai_message": "Your opening message setting the scene and asking a question",
  "feedback": null,
  "is_last_turn": false
}}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system="You are playing a native English-speaking colleague in an IT company. Respond only with valid JSON.",
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json(response.content[0].text)


def continue_conversation(situation_id: str, conversation_history: list, user_message: str, learner_name: str = None) -> dict:
    situation = next((s for s in SITUATIONS if s["id"] == situation_id), None)
    if not situation:
        raise ValueError(f"Unknown situation: {situation_id}")

    turn_count = sum(1 for t in conversation_history if t["speaker"] == "user")
    is_near_end = turn_count >= 5

    messages = []
    for turn in conversation_history:
        role = "assistant" if turn["speaker"] == "ai" else "user"
        messages.append({"role": role, "content": turn["text"]})
    messages.append({"role": "user", "content": f"[User said]: {user_message}"})

    end_instruction = " This should be the final exchange - wrap up the conversation naturally." if is_near_end else ""
    name_context = f"\nThe learner's name is {learner_name}. Feel free to use their name naturally." if learner_name else ""

    system = f"""{SYSTEM_PROMPT}

Current situation: {situation['title']}{name_context}
Turn count: {turn_count + 1}/6{end_instruction}

Respond only with valid JSON matching the specified structure."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system,
        messages=messages,
    )

    result = _parse_json(response.content[0].text)
    if is_near_end:
        result["is_last_turn"] = True
    if result.get("feedback"):
        result["feedback"]["grammar_issue_categories"] = _normalize_categories(
            result["feedback"].get("grammar_issue_categories", [])
        )
    return result


def generate_session_summary(situation_id: str, conversation_history: list) -> dict:
    situation = next((s for s in SITUATIONS if s["id"] == situation_id), None)

    conversation_text = "\n".join(
        f"{'AI' if t['speaker'] == 'ai' else 'User'}: {t['text']}"
        for t in conversation_history
    )

    prompt = f"""以下の英会話セッション（シチュエーション: {situation['title']}）を分析し、日本語でレポートしてください。

会話内容:
{conversation_text}

以下のJSON形式で返してください（テキストフィールドはすべて日本語）:
{{
  "overall_summary": "セッション全体と学習者のパフォーマンスを2〜3文で総括（日本語）",
  "total_score": <0〜100の数値>,
  "grammar_score": <0〜100の数値>,
  "fluency_score": <0〜100の数値>,
  "strengths": ["良かった点1（日本語）", "良かった点2（日本語）"],
  "areas_for_improvement": ["改善点1（日本語）", "改善点2（日本語）"],
  "vocabulary": [
    {{
      "word_or_phrase": "表現またはフレーズ（英語）",
      "meaning_ja": "word_or_phraseと1対1で対応する、直訳に近い短い日本語訳（数語程度）",
      "explanation": "意味と使い方の説明（日本語、ニュアンスや使用場面の補足）",
      "example_sentence": "使用例（英語）"
    }}
  ]
}}

vocabularyには、会話中に登場した、またはこのシチュエーションで役立つITビジネス英語表現を4〜6個含めてください。
meaning_jaはexplanationとは別に、word_or_phraseを見ずにmeaning_jaだけ見てword_or_phraseを言い当てられるくらい、直接的で簡潔な訳にしてください。"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system="あなたは英語コーチです。有効なJSONのみで回答してください。",
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json(response.content[0].text)


def evaluate_speaking(word_or_phrase: str, explanation: str, example_sentence: str, spoken_text: str) -> dict:
    prompt = f"""あなたは英語コーチです。学習者は日本語の意味だけを見て、対応する英語表現を音声入力で答えました。

正解の表現: "{word_or_phrase}"
意味の説明: {explanation}
例文: {example_sentence or "(なし)"}

学習者が音声入力（Web Speech APIによる文字起こし）で答えた内容: "{spoken_text}"

この文字起こしを正解の表現と比較し、評価してください。文字起こしは発音の癖により誤認識されることがあるため、実際に発音されたであろう単語を推測しつつ判断してください（例えば全く違う単語として認識されている場合、発音が不明瞭だった可能性を考慮してください）。

以下のJSON形式で返してください（テキストフィールドはすべて日本語）:
{{
  "is_correct": <boolean, 意味的に正解の表現と一致するか（多少の言い換えは許容）>,
  "score": <0〜10の数値、語彙選択と推定される発音の明瞭さを総合したスコア>,
  "feedback": "学習者の回答に対する短い総評（日本語、1〜2文）",
  "pronunciation_tips": ["発音に関する具体的なアドバイス（日本語）"],
  "correct_answer": "{word_or_phrase}"
}}

pronunciation_tipsは、誤認識の可能性がある箇所や、この表現特有の発音の注意点を1〜3個含めてください。特に問題がなければ空配列で構いません。"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system="あなたは英語コーチです。有効なJSONのみで回答してください。",
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json(response.content[0].text)
