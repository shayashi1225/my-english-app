# My English App

外資系IT企業向けビジネス英語練習アプリ

## セットアップ

### 1. API キーの設定

```bash
cp secrets/.env.example secrets/.env
# secrets/.env を編集して ANTHROPIC_API_KEY を設定
```

### 2. 起動

```bash
podman-compose up --build
```

ブラウザで http://localhost:3000 を開く

### 開発モード（ローカル）

**バックエンド:**
```bash
cd backend
pip install -r requirements.txt
# secrets/.env に API キーを設定済みであること
DATABASE_URL=postgresql://appuser:apppassword@localhost:5432/english_app uvicorn main:app --reload
```

**フロントエンド:**
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

**DB のみ起動:**
```bash
podman-compose up db
```

## 使い方

1. **Practice** タブからシチュエーションを選択
2. AIが英語で状況を設定し、質問する（音声自動再生）
3. マイクボタンを押して英語で回答
4. AIがフィードバック（文法・発音）を提供しながら会話を続ける
5. 6〜8ターン後にセッションが終了し、語彙・総評を表示
6. **Dashboard** タブでスコアの推移を確認

## アーキテクチャ

- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Python FastAPI + SQLAlchemy
- Database: PostgreSQL
- AI: Claude (claude-sonnet-4-6)
- Container: Podman + Red Hat UBI base
- 音声入力: Web Speech API (Chrome)
- 音声出力: SpeechSynthesis API
