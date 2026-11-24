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


### 長文モーダルの必須構造

物語・説明など本文量が増えるモーダルは、カード全体をスクロールさせず、**見出し / 本文スクロール / 下部ナビ**の3層に分けます。下部ナビはSafe Area内に予約し、SafariのブラウザUI表示中でも「次へ／閉じる」が常にVisual Viewport内に残ることを `LabCore.isFullyVisible()` と実機QAで確認します。子ども向け本文は `LabCore.renderRubyText()` を使い、対象年齢に応じたルビを付けます。


## 11. 浮動ナビゲーションの衝突回避

ホーム等の低頻度ナビを「左下固定」だけで設計しません。画面固有の主ボタン、カード、案内、HUDと競合する場合は、Floating UIの collision / shift の考え方を参考に、外部依存を増やさない軽量API `LabCore.placeFloatingControl()` で候補位置を実測します。

基本候補は `bottom-left → top-left → bottom-right → top-right`。各候補で `isFullyVisible()` と `elementsOverlap()` を確認し、Visual Viewport内かつblockerと重ならない最初の位置を採用します。ゲーム固有の重要操作を浮動ホームより優先します。


## 12. 操作領域と自動QA（2026-11-25）

「沖縄で星集め」万座毛の代表ステージで検証した共通原則。

- 操作ボタンは縮小・zoom適用後の実測で44×44 CSS px以上を確保する。狭い画面では余白・装飾・配置・画面分割を先に調整する。
- 操作中のボタン本体に無限の拡大縮小・位置移動を適用しない。演出は非操作要素へ分離する。
- `qa/audit-layout.mjs` は Playwright 用の任意導入ヘルパー。対象画面が安定した後に明示的なセレクタを渡す。可視領域、44px、中心のヒットテスト、対象同士の矩形交差を検査し画像を保存する。
- 390×560、390×650、390×760、1280×800 を初期回帰条件とする。画面ごとの必須要素の存在・表示を別途assertし、空の対象集合で合格させない。スクロール画面では対象を適切な位置へスクロールして確認する。
- Playwright 1.56.1 / Chromium / ubuntu-24.04 は今回の再現環境。新規採用・更新時は依存の安全性も確認する。強制クリックで不具合を隠さない。
- DOM監視は必要最小限とし、画面遷移・resize等を起点に検査する。監視自身の変更による再発火、重複リスナー、遷移後のタイマー残留を防ぐ。
- 練習と本編の状態・保存を区別する。検証版は本番と別URL・別保存キー・依存ファイルの固定コピーとし、検証表示・一覧非掲載・noindexを設定する。noindexはアクセス制御ではない。
- 自動QAは実機QAの代替ではない。3D対象の実タッチ、音、読み上げ、Safari UI、PWAを人間が確認する。

根拠：[自動QA #7（8/8）](https://github.com/alpaca-school/lab/actions/runs/45426899652)。検証専用版で利用者から全項目正常との報告あり。端末型番・OS・スクリーンショットは未取得。新作での再検証は必須。


## 13. 開発ゲート（第39章対応・検証候補）

現時点の本ブランチは候補版。mainへの昇格には自己QA・独立レビューが必要。

- G0：正本、ソース、期待値、境界条件、変更しない範囲、復旧方法を確認する。
- G1：構文・設定を検査する。
- G2：`node --test starter-kit/qa/*.unit.mjs` で共通関数の正例・負例を検査する。
- G3/G4：Playwrightで実DOMのルビ、操作領域検査自身とテンプレート回帰を確認する。
- G5/G6：独立レビュー・Security Gate・実機と公開判断は別途実施する。

`baseLabel(element)` はQA専用の親文字取得関数。標準rubyのrt/rpと既存ゲームの.furigana-rtに対応し、元DOMを変更しない。別形式は事前にfixtureで検証する。 `inspectLayout(page, selectors)` は検査結果を返し、必須セレクタの対象ゼロを不合格にする。非表示・無効の操作を期待する場合は別テストに分ける。

ゲーム別データ・保存・状態遷移は作品固有の単体検査を作る。新作のソース分離は必要な範囲で行い、既存HTMLやゲームを機械的に移動しない。共通部品の昇格はCI成功だけでは確定しない。
