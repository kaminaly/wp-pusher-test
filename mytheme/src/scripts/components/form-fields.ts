import FieldControls from "../libs/form/FieldControls";

export default () => {
	const fieldControls = new FieldControls({});

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
					return {
						...initialValues,
						select: "Select1",
						checkbox: [true, false, false],
						radio: "radio1",
						name: "john doe",
						email: "foo@example.com",
						email_re: "foo@example.com",
						tel: "09012341234",
						message:
							"彼品質ニュース彼。戦略的屋根裏残るダイヤモンド細かいコミュニティニュース。\nパーセント意図隠す拡張デッド。",
					};
				},
				onError: (e) => {
					console.log(e);
					this.updateFieldMode("error");
				},
				onValidate: (errors) => {
					this.invalid = Object.keys(errors).length !== 0;
				},
			});
		},
	};
};
