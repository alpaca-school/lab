# アルパカすく〜るラボ Starter Kit

新しい教材ゲームを、毎回ゼロから作らないための共通土台です。

このStarter Kitは、特定科目のゲームロジックを共通化するものではありません。  
「ハワイから550頭の豚」「ガスバーナー名人」「ビスケット水族館」等の実機QAで繰り返し問題になった、**スマホUI・日本語組版・画面遷移・結果画面・音・公開QA**だけを共通化します。

## 1. 含まれるもの

- `index.html` — 最小の「タイトル → 体験 → 長文結果 → 最終ページ」
- `lab-core.css` — Safe Area / 可視領域 / 読書カード / ナビ / reduced motion
- `lab-core.js` — Visual Viewport / 画面遷移 / ruby / 音 / PWA登録
- `QA_CHECKLIST.md` — 公開前の共通QA
- `manifest.webmanifest` / `sw.js` / `icon.svg` — 任意PWAの最小構成

## 2. 新作の始め方

1. `starter-kit/` を新しい `game-id/` へコピーする
2. `index.html` のタイトル・テーマ・学習目標を置き換える
3. まず代表1ステージだけ作る
4. 次の3画面をスマホで先に合格させる
   - 体験・操作画面
   - 長文結果画面
   - 最終3〜4ボタン画面
5. 合格した設計を残りのステージへ展開する
6. `QA_CHECKLIST.md` を複製してチェックする
7. 公開後は品質9軸＋開発効率6指標を必要に応じて記録する

## 3. 共通API

### `LabCore.init()`

Visual Viewportを監視し、実際に見えている高さをCSS変数 `--app-height` へ反映します。

ピンチズーム中は高さ同期を行いません。

### `LabCore.showScreen("screen-id")`

疑似ページを切り替え、長文スクロール位置を先頭へ戻します。

### `LabCore.renderRubyText(element, text, { budoux: true })`

次の記法を安全にDOMへ変換します。

```text
沖縄《おきなわ》
```

`innerHTML` を使わず、Text Nodeと `ruby / rt` を作ります。

長文では `budoux: true` を指定します。

### `LabCore.beep("success")`

Web Audioによる最小効果音です。外部音源が不要な場面のフォールバックとして使えます。

### `LabCore.toggleMute(button)`

音ON/OFFを切り替えます。

## 4. 日本語長文

Starter KitはBudouX 0.8.4を固定バージョンで読み込みます。

```html
<script defer src="https://unpkg.com/budoux@0.8.4/bundle/budoux-ja.min.js"></script>
```

原則：

```css
text-wrap: wrap;
word-break: keep-all;
overflow-wrap: anywhere;
line-break: strict;
```

`text-wrap: pretty` は長文では使いません。

BudouXが読み込めなくても本文自体は表示されます。  
オフライン必須の教材でローカル同梱する場合は、ライセンス・依存関係・更新方法を確認して別途実装してください。

## 5. ナビゲーション

### 1〜2ボタン

「戻る／次へ」等は、画面下に**予約領域**を持たせ、本文に押し出されない構造にしています。

### 3〜4ボタン

最終ページでは通常フローの2×2配置にします。

本文・出典カードとの間に余白を確保し、stickyへ固定しません。

## 6. PWA

PWAは任意です。

同梱の `sw.js` はキャッシュを持たない最小構成です。  
「古い教材がキャッシュに残る」問題を避けるため、Starter Kit段階ではオフラインキャッシュを自動導入しません。

PWAが不要なゲームでは、

- manifestリンク
- service worker登録
- manifest / sw / icon

を削除して構いません。

## 7. セキュリティ

Starter Kitにはバックエンド・認証・個人情報保存機能を含めません。

新作でフォーム・API・ログイン・子どもの情報等を追加する場合は、Obsidian正本の

- アルパカすく〜る `CLAUDE.md`
- `SECURITY.md`

を再確認してください。

APIキー・Token・秘密情報をフロントエンドへ書かないでください。

## 8. 変更してよいもの

新作へコピーした後は、ゲーム固有の

- 色
- タイトル
- 体験エリア
- 学習ロジック
- アニメーション
- 効果音
- 本文
- 出典

を自由に変更できます。

一方、Safe Area / Visual Viewport / 長文組版 / ナビゲーションの基本構造を変える場合は、iPhone実機QAをやり直してください。

## 9. 完成の定義

コードが動くだけでは完成ではありません。

**見える・読める・押せる・最後まで進める・戻れる。**

さらに、

**高品質 × 少ない手戻り × 次回へ再利用可能**

までをラボ制作の目標とします。


## 10. 物語・UIゾーン・衝突検査

シリーズ物やキャラクター物では、初回だけの説明にせず、タイトル画面等から同じ物語を再読できる入口を用意してください。

Starter Kitは作品固有の物語本文を持ちません。共通の器として次を用意します。

- \`.lab-story-dialog\` / \`.lab-story-card\` — 再読モーダル
- \`.lab-zone-status\` — 上部の進捗・設定
- \`.lab-zone-guidance\` — 下部中央の一時案内
- \`.lab-zone-home\` — 左下等の低頻度ホーム導線
- \`LabCore.elementsOverlap(a,b,padding)\` — 2要素の実座標衝突判定
- \`LabCore.watchCollisions(pairs,onCollision)\` — resize / orientationchange / DOM変更後の任意衝突監視

衝突監視は実機QAの代替ではありません。「被っていないはず」を減らす補助として使います。

物語性のある新作では、前作の正本設定・今回決めた続編設定・創作エピソードを混同せず、原文未確認の台詞を公式設定として補完しないでください。
