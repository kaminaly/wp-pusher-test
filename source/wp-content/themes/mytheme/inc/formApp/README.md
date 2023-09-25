# お問い合わせフォームセットアップ

起動中のコンテナに対してメールの送受信ようのコンテナを接続させます。

以下のコマンドで初期化をしてください。
現在起動中の Docker コンテナの ID をベースに新しく docker-compose ファイルを作成します。

```bash
bash env/setup_mailhog.sh
```

## 起動

http://localhost:8025 にアクセスするとメールクライアントが確認できます

```bash
npm run mailhog:start
```

## 停止

```bash
npm run mailhog:stop
```

## リセット

もしなんか接続がうまくいかなくなったり、起動がうまくいかなくなったら以下のコマンドを叩いてみてください。

```bash
npm run mailhog:clear
```

## 設定関係

`source/wp-conten/thmemes/mytheme/inc/formApp/config`

## env.json

メールサーバのための設定ファイル。

## meta.json

自動返送のために設定ファイル
`DEBUG` フラグが true の場合はお問い合わせで送信した自分のメール宛にユーザ控えと管理者向けの 2 つが送られるようになります。  
**公開時はこのフラグに気をつけてください**

## field.json

フォームのバリデーションやエラーメッセージの設定ファイル

### `validations`

バリデーションをかけたいフィールドを配列で指定してください。  
配列の順に優先してバリデーションを行います。

```json
{
	"validations": {
		"name": ["required"]
	}
}
```

#### ビルトインバリデーション

- required
- email
- phone
  - ハイフンなし
- phone:hyphen
  - ハイフンあり
- min:NUM
  - 最小文字数
  - `min:8` の様に指定
- max:NUM
  - 最大文字数
  - `max:8` の様に指定
- same:NAME
  - NAME と同じ値か検証
  - `same:email` の様にしてい
- alphabet
  - 半角英
- alphanumeric
  - 半角英数
- zenkaku
  - 全角英数
- katakana
  - 全角カタカナ
- hiragana
  - 全角ひらがな
- zipcode
  - 郵便番号

### `dependedItems`

依存関係のフィールドを設定してください

```json
{
	"dependedItems": [
		{
			"controller": "inquiry",
			"targets": ["tel", "message"],
			"hide": ["Select1"],
			"show": ["Select1"]
		}
	]
}
```

- `controller`
  - 入力を受け付ける input の name 属性を指定してください
- `targets`
  - `controller` の値に応じて変化させたい対象の name 属性を配列で指定してください
- `hide/show`
  - `hide` と `show` は混在できません
  - `controller` で入力される値を配列で指定してください
  - `hide` は値が一致した場合に非表示にします
  - `show` は値が一致した場合に表示させます（初期状態では非表示）

### `errorMessages`

```json
{
	"errorMessages": {
		"base": {
			"*": "形式が違います",
			"required": "必須項目です",
			"same": "一致しません",
			"min": "文字数が足りません",
			"max": "文字数が多すぎます"
		},
		"re_email.required": "メールアドレスをもう一度入力してください",
		"re_email.same:email": "メールアドレスと確認用メールアドレスが一致しません"
	}
}
```

- `base` にはデフォルトのエラーメッセージを指定してください
  - `validations`、 `customPatterns` で指定したバリデーションの name で指定してください
  - `*` は 指定した key にマッチしない場合に利用されます
  - `NAME.VALIDATION_NAME` の形式で特定のフィールドの特定のバリデーションに対してメッセージを上書きすることもできます

### `initialValues`

初期状態で入力しておきたい値を指定できます。

```json
{
	"initialValues": {
		"select": "Select1",
		"checkbox": [true, false, false],
		"radio": "radio1",
		"name": "john doe",
		"email": "foo@example.com",
		"email_re": "foo@example.com",
		"tel": "09012341234",
		"message": "彼品質ニュース彼。戦略的屋根裏残るダイヤモンド細かいコミュニティニュース。\nパーセント意図隠す拡張デッド。"
	}
}
```

- checkbox のみ要素分の真偽値の配列で指定する必要があります

## HTML Layout

### form layout

以下の様な階層構造でマークアップしてください

- x-data="formFields"
  - x-show="fieldMode==='input'"
  - x-show="fieldMode==='confirm'"
  - x-show="fieldMode==='complete'"
  - x-show="fieldMode==='error'"

```html
<div x-data="formFields">
	<div x-show="fieldMode==='input'">
		<form>
			...

			<label for="agreement">
				<input type="checkbox" id="agreement" @change="agreement = $event.target.checked" />
				Agree?
			</label>

			<button type="button" class="disabled:opacity-50" @click="onSubmit" :disabled="!agreement">
				Submit
			</button>
		</form>
	</div>
	<div x-show="fieldMode==='confirm'">
		<template x-for="item in formattedValues">
			<div>
				<p x-text="item.label"></p>
				<p x-text="item.value" class="whitespace-pre-line"></p>
			</div>
		</template>

		<div class="grid grid-cols-2 gap-8">
			<button type="button" class="bg-black px-14 pt-4 text-white" @click="fieldMode = 'input'">
				Back
			</button>
			<button type="button" class="bg-black px-14 pt-4 text-white" @click="onSubmit">Send</button>
		</div>
	</div>
	<div x-show="fieldMode==='complete'">...</div>
	<div x-show="fieldMode==='error'">...</div>
</div>
```

#### 確認画面が必要な場合は `fieldMode==='input'` の button の@click 属性を `onConfirm` に変更すると有効になります

```html
<button type="button" class="disabled:opacity-50" @click="onConfirm" :disabled="!agreement">
	Submit
</button>
```

#### button の有効化

- :disabled="invalid"
  - 全ての値のバリデーションが通れば
- :disabled="!agreement"
  - 同意を求めるチェックボックスが true になれば
- :disabled="!agreement || invalid
  - 全ての値のバリデーションが通り、同意を求めるチェックボックスが true になれば

### fiesld layout

以下の様な階層構造でマークアップしてください

- data-field="NAME"
  - data-field-label
  - data-field-control
  - data-field-error="NAME"

```html
<!-- text input -->
<div data-field="email">
	<label class="block" for="email" data-field-label>Email</label>
	<input type="email" name="email" id="email" data-field-control />
	<div class="hidden" data-field-error="email"></div>
</div>

<!-- select -->
<div data-field="select">
	<label class="block" for="select" data-field-label>Select</label>
	<select name="select" id="select" data-field-control>
		<option value="">Choose it</option>
		<option value="Select1">"Select1"</option>
		<option value="Select2">"Select2"</option>
		<option value="Select3">"Select3"</option>
	</select>
	<div class="hidden" data-field-error="select"></div>
</div>

<!-- checkbox button -->
<fieldset data-field="checkbox">
	<legend data-field-label>Checkbox</legend>
	<ul>
		<li>
			<input
				type="checkbox"
				name="checkbox[0]"
				value="checkbox1"
				id="checkbox1"
				data-field-control
			/>
			<label for="checkbox1"> Checkbox1 </label>
		</li>
		<li>
			<input
				type="checkbox"
				name="checkbox[1]"
				value="checkbox2"
				id="checkbox2"
				data-field-control
			/>
			<label for="checkbox2"> Checkbox2 </label>
		</li>
		<li>
			<input
				type="checkbox"
				name="checkbox[2]"
				value="checkbox3"
				id="checkbox3"
				data-field-control
			/>
			<label for="checkbox3"> Checkbox3 </label>
		</li>
	</ul>
	<div class="hidden" data-field-error="checkbox"></div>
</fieldset>

<!-- radio button -->
<fieldset data-field="radio">
	<legend data-field-label>Radio</legend>
	<ul>
		<li>
			<input type="radio" name="radio" value="radio1" id="radio1" data-field-control />
			<label for="radio1"> Radio1 </label>
		</li>
		<li>
			<input type="radio" name="radio" value="radio2" id="radio2" data-field-control />
			<label for="radio2"> Radio2 </label>
		</li>
		<li>
			<input type="radio" name="radio" value="radio3" id="radio3" data-field-control />
			<label for="radio3"> Radio3 </label>
		</li>
	</ul>
	<div class="hidden" data-field-error="radio"></div>
</fieldset>
```

## FieldControls

### Constructor

```
FieldControls({
  customValidations?: PatternValidation;
  config?: FieldControlsConfig;
})
```

#### customValidations

カスタムバリデーションを追加できます。

- 配列の 0 番目：対象の name 属性
- 配列の 1 番目：正規表現

```ts
const fieldControls = new FieldControls({
	customValidations: [["mail", REGEXP_EMAIL]],
});
```

#### config

HTML のマークアップに必要な data 属性やエンドポイントなどの設定を上書きできます

```
ENDPOINT: "/wp-json/mytheme/contact"
FIELD: "data-field"
FIELD_CONTROL: "data-field-control"
FIELD_REGISTRATION: "data-field-registration"
FIELD_ERROR: "data-field-error"
FIELD_LABEL: "data-field-label"
AUTO_REPLY_TARGET: "email"
```

### Methods

#### `build`

フォームを初期化します。

```
build(
  $root: HTMLElement,
  {
    customInitialValues?: (initialValues: Record<string, any>) => Record<string, any>;
    onError: () => void;
    onValidate: (values: Record<string, any>) => void;
  }
)
```

##### `customInitialValues`

field.json で指定した initialValues を引数で受け取って上書きができます

```
customInitialValues(initialValues) {
  initialValues["message"] = "hoge";

  return initialValues;
}
```

#### `formatValues`

`{ label, value }` の形式に変換して配列で返却します。

### Example

```ts
import FieldControls from "../libs/form/FieldControls";
import { REGEXP_EMAIL } from "../libs/form/validations";

export default () => {
	const fieldControls = new FieldControls({
		customValidations: [["mail", REGEXP_EMAIL]],
	});

	return {
		// 'input' | 'confirm' | 'complete' | 'error'
		fieldMode: "input",
		formattedValues: [],
		invalid: false,
		disabled: true,
		agreement: false,

		processing: false,

		async updateFieldMode(fieldMode: "input" | "confirm" | "complete" | "error") {
			this.fieldMode = fieldMode;
		},

		async onConfirm() {
			const { invalid, values, errors } = fieldControls.formApi.getState();
			this.invalid = invalid;

			if (invalid) {
				// console.log(errors)
			} else {
				fieldControls.formatValues(values);
				this.formattedValues = Array.from(fieldControls.fieldValuesCollection)
					.map((item) => item[1])
					.filter((item) => !!item.value);

				this.updateFieldMode("confirm");
			}
		},

		async onSubmit() {
			this.processing = true;
			try {
				const res = await fieldControls.formApi.submit();

				const { invalid } = fieldControls.formApi.getState();
				this.invalid = invalid;

				if (!res || !res.ok) {
					this.processing = false;
					return;
				}

				const json = await res.json();

				console.log(json);

				if (json.message === "ok") {
					this.updateFieldMode("complete");
				} else {
					this.updateFieldMode("error");
				}
			} catch (e) {
				this.updateFieldMode("error");
			}
		},

		async init() {
			await fieldControls.build(this.$root, {
				customInitialValues(initialValues) {
					initialValues["message"] = "hoge";

					return initialValues;
				},
				onError: () => {
					this.updateFieldMode("error");
				},
				onValidate: (errors) => {
					this.invalid = Object.keys(errors).length !== 0;
				},
			});
		},
	};
};
```
