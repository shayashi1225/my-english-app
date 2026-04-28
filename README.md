# My English App

外資系IT企業で働く人のためのビジネス英語練習アプリ。AIとの音声会話を通じて、ITシーンで使えるビジネス英語のリスニング・スピーキング・文法を実践的に鍛えます。

## 機能

- **6つのビジネスシチュエーション** — スタンドアップ・コードレビュー・クライアントプレゼン・インシデント対応・スプリント計画・1on1
- **音声会話** — AIが英語で話しかけ（gTTS）、ユーザーはマイクで英語回答（Web Speech API）
- **リアルタイムフィードバック** — ターンごとに文法スコア・修正案・発音アドバイスを表示
- **セッションサマリー（日本語）** — 終了後に総括・良かった点・改善点・語彙解説をレポート
- **ダッシュボード** — スコア推移グラフ・ストリーク・シチュエーション別成績・過去セッションの詳細参照

## 必要環境

- [Podman](https://podman.io/)
- [Anthropic API キー](https://console.anthropic.com/settings/api-keys)
- Chrome（音声入力対応）

## セットアップ・起動

### 1. APIキーを設定する

```bash
cp secrets/.env.example secrets/.env
# secrets/.env を編集して ANTHROPIC_API_KEY を設定
```

### 2. ネットワークを作成する

```bash
podman network create english-net
```

### 3. 全コンテナをビルド・起動する

```bash
# DB
podman run -d \
  --name english-db \
  --network english-net \
  -e POSTGRES_DB=english_app \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=apppassword \
  -v "$(pwd)/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  -v english-db-data:/var/lib/postgresql/data \
  docker.io/library/postgres:16-alpine

# DB の起動を待つ
sleep 5

# バックエンド
podman build -f backend/Containerfile backend/ -t english-backend:latest
podman run -d \
  --name english-backend \
  --network english-net \
  -e ANTHROPIC_API_KEY="$(grep ANTHROPIC_API_KEY secrets/.env | cut -d= -f2)" \
  -e DATABASE_URL=postgresql://appuser:apppassword@english-db:5432/english_app \
  -p 8000:8000 \
  english-backend:latest

# フロントエンド
podman build -f frontend/Containerfile . -t english-frontend:latest
podman run -d \
  --name english-frontend \
  --network english-net \
  -p 3000:8080 \
  english-frontend:latest
```

ブラウザ（Chrome）で <http://localhost:3000> を開く

### 2回目以降の起動・停止

```bash
# 起動
podman start english-db english-backend english-frontend

# 停止
podman stop english-db english-backend english-frontend
```

---

### ローカル開発モード（Python / Node をホストで動かす場合）

**必要環境:** Python 3.9+、Node.js 18+

```bash
# DB のみコンテナで起動
podman run -d \
  --name english-db \
  -e POSTGRES_DB=english_app \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=apppassword \
  -p 5432:5432 \
  -v "$(pwd)/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  docker.io/library/postgres:16-alpine

# バックエンド
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
export $(cat ../secrets/.env | xargs)
DATABASE_URL=postgresql://appuser:apppassword@localhost:5432/english_app \
  .venv/bin/uvicorn main:app --reload

# フロントエンド（別ターミナル）
cd frontend
npm install && npm run dev
# http://localhost:5173
```

## 使い方

1. **Practice** タブでシチュエーションを選択
2. 「🔊 Start Session」を押してAIの音声を再生
3. 🎤 ボタンを押して英語で回答 → ⏹ ボタンで送信
4. AIがフィードバックとともに会話を継続（約6ターン）
5. セッション終了後、日本語で総括レポートを表示
6. **Dashboard** タブで成績推移を確認、過去のセッション行をクリックで詳細を参照

## アーキテクチャ

| レイヤー | 技術 |
| --- | --- |
| フロントエンド | React 18 + TypeScript + Vite + Tailwind CSS + Recharts |
| バックエンド | Python FastAPI + SQLAlchemy |
| データベース | PostgreSQL 16 |
| AI | Claude claude-sonnet-4-6 (Anthropic API) |
| 音声出力 | gTTS（Google Text-to-Speech）→ ブラウザ Audio API |
| 音声入力 | Web Speech API（Chrome） |
| コンテナ | Podman + Red Hat UBI（ubi9/python-311, ubi9/nodejs-20, ubi8/nginx-120） |

## ディレクトリ構成

```text
my-english-app/
├── backend/
│   ├── Containerfile
│   ├── main.py                  # FastAPI エントリポイント
│   ├── models.py                # DB モデル
│   ├── routers/                 # sessions / situations / dashboard / tts
│   └── services/
│       └── claude_service.py    # Claude API 統合・プロンプト定義
├── frontend/
│   ├── Containerfile
│   └── src/
│       ├── pages/               # Home / Conversation / Dashboard
│       ├── components/          # VoiceRecorder / FeedbackPanel / SessionSummary / SessionDetailModal
│       └── services/api.ts      # バックエンド API クライアント
├── db/
│   └── init.sql                 # テーブル定義
├── nginx/
│   └── nginx.conf               # UBI nginx 用 location ブロック設定
├── docker-compose.yml           # podman-compose / docker-compose 用
└── secrets/
    └── .env.example             # APIキー設定テンプレート（.env は gitignore）
```

## コスト目安

Anthropic API の利用料金は1セッション（約6ターン）あたり **$0.01〜0.03** 程度です。
