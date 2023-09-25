import * as FinalForm from "final-form";
import {
	isEmpty,
	maxLength,
	minLength,
	REGEXP_ALPHABET,
	REGEXP_ALPHANUMERIC,
	REGEXP_EMAIL,
	REGEXP_KANA,
	REGEXP_KATAKANA,
	REGEXP_PHONENUMBER,
	REGEXP_PHONENUMBER_WITH_HYPHEN,
	REGEXP_ZENKAKU,
	REGEXP_ZIPCODE,
} from "./validations";

export default class FieldControls {
	static async getFieldData(url: string): Promise<FieldDataResponse> {
		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},
			}).catch((e) => {
				throw new Error(e);
			});

			return await response.json();
		} catch (e) {
			// @ts-ignore
			if (process.env.NODE_ENV !== "production") {
				console.error(e);
			}
			return {
				message: "ng",
			};
		}
	}

	static getCheckBoxRawValues(values, data) {
		return data.filter((_, index) => values[index]);
	}

	static formatHiddenItems(formFieldData, targets) {
		// find multiple types
		return targets.map((target) => {
			const item = formFieldData.find(({ name }) => name === target);
			if (item && item.type === "checkbox") {
				return item.options.data.map((_, index) => `${target}[${index}]`);
			}

			if (item && item.type === "radio") {
				return item.options.data.map(() => `${target}`);
			}

			return target;
		});
	}

	static setUnsubscribing(hiddenItemNames: string[]) {
		return [...new Set(hiddenItemNames)].reduce((previousValue, currentValue, currentIndex) => {
			previousValue[currentValue] = true;
			return previousValue;
		}, {});
	}

	static getCustomErrorMessage(errorMessages) {
		return function (name, validation) {
			if (/:/.test(validation)) {
				return (
					errorMessages[`${name}.${validation}`] ||
					errorMessages[`${name}.${validation.substring(0, validation.indexOf(":"))}`] ||
					errorMessages.base[validation] ||
					errorMessages.base[validation.substring(0, validation.indexOf(":"))] ||
					errorMessages.base["*"]
				);
			} else {
				return (
					errorMessages[`${name}.${validation}`] ||
					errorMessages.base[validation] ||
					errorMessages.base["*"]
				);
			}
		};
	}

	static setHiddenItemNames(dependedItems: DependedItem[], initialValues): string[] {
		return dependedItems
			.map((dependedItem) => {
				const initialValue = initialValues[dependedItem.controller];

				if (initialValue) {
					if (!!dependedItem.show && dependedItem.show.indexOf(initialValue) === -1) {
						return dependedItem.targets;
					}

					if (!!dependedItem.hide && dependedItem.hide.indexOf(initialValue) !== -1) {
						return dependedItem.targets;
					}
				} else {
					if (!!dependedItem.show) {
						return dependedItem.targets;
					}

					if (!!dependedItem.hide) {
						return [];
					}
				}
			})
			.filter(Boolean)
			.flat();
	}

	static handleErrorMessage(inputElement, errorElement, show, error) {
		if (errorElement) {
			if (show) {
				inputElement.setAttribute("aria-invalid", "true");
				errorElement.innerHTML = error;
				errorElement.style.display = "block";
			} else {
				inputElement.removeAttribute("aria-invalid");
				errorElement.innerHTML = "";
				errorElement.style.display = "none";
			}
		}
	}

	static getOrderedValues(fieldItems: FieldItem[], values: Record<string, string | string[]>) {
		return fieldItems
			.filter((item) => !!values[item.name])
			.map((item) => {
				return {
					label: item.label,
					value: FieldControls.getValue(values[item.name], item),
				};
			});
	}

	static getValue(value, fieldItems: FieldItem) {
		const data = fieldItems?.options?.data;
		if (data) {
			if (fieldItems.type === "checkbox") {
				return FieldControls.getCheckBoxRawValues(value, data)
					.map((d) => d.value)
					.join(", ");
			}

			return data
				.filter((d) => d.value === value)
				.map((d) => d.value)
				.join(", ");
		} else {
			return value;
		}
	}

	static getRawName(name) {
		return name.replace(/\[.*?]/g, "");
	}

	private setEndPoint(target: string) {
		return `${this.config.ENDPOINT}/${target}`;
	}

	private validation(values: Record<string, string>, fieldData: FieldData) {
		const { validations: validationsData, errorMessages } = fieldData;
		const errors = {};
		Object.keys(validationsData).forEach((name) => {
			// TODO: For checkbox
			if (
				this.unsubscribing[FieldControls.getRawName(name)] ||
				!this.fieldItemsCollection.has(name)
			) {
				return;
			}

			const item = this.fieldItemsCollection.get(name);
			const validations = validationsData[name];
			const value = values[name];
			const getErrorMessage = FieldControls.getCustomErrorMessage(errorMessages);

			// require
			if (validations.indexOf("required") !== -1) {
				const errorMassage = getErrorMessage(name, "required");
				if (item.type === "checkbox") {
					if (!value || (Array.isArray(value) && !value.some((v) => v))) {
						errors[name] = [errorMassage];
					}
				} else if (!value || (value && isEmpty(String(value).trim()))) {
					errors[name] = [errorMassage];
				}
			}

			// pattern
			this.patternValidations.forEach((pattern) => {
				if (!value || validations.indexOf(pattern[0]) === -1) {
					return;
				}

				if (!pattern[1].test(value)) {
					const errorMassage = getErrorMessage(name, pattern[0]);
					errors[name] = [errorMassage];
				}
			});

			// length
			// - min
			const min = validations.find((v) => /^min/.test(v));
			if (value && min) {
				const length = min.substring(min.indexOf(":") + 1);
				const errorMassage = getErrorMessage(name, min);
				if (!minLength(value, length as unknown as number)) {
					errors[name] = [errorMassage];
				}
			}

			// - max
			const max = validations.find((v) => /^max/.test(v));
			if (value && max) {
				const length = max.substring(max.indexOf(":") + 1);
				const errorMassage = getErrorMessage(name, max);
				if (!maxLength(value, length as unknown as number)) {
					errors[name] = [errorMassage];
				}
			}

			// same
			const same = validations.find((v) => /^same/.test(v));
			if (value && same) {
				const comparisonFrom = same.substring(same.indexOf(":") + 1);
				const errorMassage = getErrorMessage(name, same);
				if (value !== values[comparisonFrom]) {
					errors[name] = [errorMassage];
				}
			}
		});
		return errors;
	}

	private getFieldItemsData(
		fields: NodeListOf<HTMLElement>,
		fieldData: FieldData
	): FieldItemsCollection[] {
		return [...fields].map((field) => {
			const name = field.dataset.field;
			const label = field.querySelector(`[${this.config.FIELD_LABEL}]`).textContent;
			const control: InputElement = field.querySelector(`[${this.config.FIELD_CONTROL}]`);
			const tagName = control.tagName.toLowerCase();
			const type = tagName !== "input" ? tagName : control.type;
			const options = {};
			const validations = !!fieldData.validations[name] ? fieldData.validations[name] : [];

			if (["radio", "checkbox"].indexOf(type) !== -1) {
				options["data"] = [...field.querySelectorAll(`[${this.config.FIELD_CONTROL}]`)].map(
					(control: InputElement) => {
						return {
							label: control.value,
							value: control.value,
						};
					}
				);
			}

			if (type === "select") {
				options["data"] = [...control.querySelectorAll("option")].map((option) => ({
					label: option.textContent,
					value: option.value,
				}));
			}

			return {
				name,
				validations,
				label,
				type,
				options,
			};
		});
	}

	private registerField(input: InputElement) {
		const { name, type } = input;
		const rawName = FieldControls.getRawName(name);
		const parent: HTMLElement = input.closest(`[${this.config.FIELD}]`);

		// for initial build
		const hiddenItemNamesIndex = this.hiddenItemNamesForInit.indexOf(rawName);

		if (this.unsubscribing[rawName] || hiddenItemNamesIndex !== -1) {
			this.unsubscribing[rawName] = true;
			parent.style.display = "none";
			this.hiddenItemNamesForInit.splice(hiddenItemNamesIndex, 1);
			return;
		}

		// show item
		parent.style.display = "";

		const registerEventListeners = (input: InputElement, fieldState: FinalForm.FieldState<any>) => {
			const { blur, change, focus } = fieldState;
			const registered = input.getAttribute(this.config.FIELD_REGISTRATION);
			if (!registered) {
				// first time, register event listeners
				input.addEventListener("blur", () => blur());
				input.addEventListener("change", (e) => {
					const target = <HTMLInputElement>e.target;

					// @ts-ignore
					change(type === "checkbox" ? target.checked : target.value);
				});
				input.addEventListener("focus", () => focus());
				input.setAttribute(this.config.FIELD_REGISTRATION, "registered");
			}
		};

		const updateStateValue = (input: InputElement, fieldState: FinalForm.FieldState<any>) => {
			const { value } = fieldState;
			if (input.type === "checkbox") {
				(<HTMLInputElement>input).checked = !!value;
			} else if (input.type === "radio") {
				(<HTMLInputElement>input).checked = value === input.value;
			} else {
				input.value = value === undefined ? "" : value;
			}
		};

		const subscription = {
			value: true,
			error: true,
			touched: true,
		};

		const unsubscribe = this.formApi.registerField(
			name,
			(fieldState) => {
				const { error, touched } = fieldState;

				updateStateValue(input, fieldState);
				registerEventListeners(input, fieldState);

				// show/hide errors
				FieldControls.handleErrorMessage(
					this.$root.querySelector(
						`[${this.config.FIELD}="${rawName}"] [${this.config.FIELD_CONTROL}]`
					),
					this.$root.querySelector(`[${this.config.FIELD_ERROR}="${rawName}"]`) as HTMLElement,
					touched && error,
					!!error && error
				);
			},
			subscription
		);

		this.unsubscribes[name] = () => {
			this.formApi.change(name, null);
			parent.style.display = "none";
			input.removeAttribute(this.config.FIELD_REGISTRATION);
			unsubscribe();
		};
	}

	private toggleSubscription(formState: FinalForm.FormState<unknown>) {
		const names = Object.keys(formState.values);
		const { dependedItems } = this.fieldData;

		// // for checkbox or some else
		const multiRegisteredFields = (value, dependedItem: DependedItem, controllerName: string) => {
			const dependedShows = dependedItems
				.filter(({ show }) => !!show)
				.map(({ show }) => show)
				.flat();

			const dependedHides = dependedItems
				.filter(({ hide }) => !!hide)
				.map(({ hide }) => hide)
				.flat();

			const fieldItem = this.$root.querySelector(`[${this.config.FIELD}="${controllerName}"]`);
			const data = [...fieldItem.querySelectorAll(`[${this.config.FIELD_CONTROL}]`)].map(
				(control: HTMLInputElement) => {
					return {
						label: "",
						value: control.value,
					};
				}
			);
			const checkBoxRawValuesMapped = FieldControls.getCheckBoxRawValues(value, data).map(
				(d) => d.value
			);

			let isSubscribeItem = null;

			if (dependedShows.length) {
				isSubscribeItem = checkBoxRawValuesMapped.some((e) => dependedShows.indexOf(e) !== -1);
			} else if (dependedHides.length) {
				isSubscribeItem = !checkBoxRawValuesMapped.some((e) => dependedHides.indexOf(e) !== -1);
			}

			if (isSubscribeItem) {
				this.controls
					.filter(({ name }) => {
						return dependedItem.targets.indexOf(FieldControls.getRawName(name)) !== -1;
					})
					.forEach((control) => {
						this.unsubscribing[FieldControls.getRawName(control.name)] = false;
						this.registerField(control);
					});
			} else {
				dependedItem.targets.forEach((name) => {
					const target = this.fieldItemsCollection.get(name);
					this.unsubscribing[FieldControls.getRawName(name)] = true;
					if (target.type === "checkbox") {
						target.options.data.forEach((_, index) => {
							this.unsubscribes[`${name}[${index}]`] && this.unsubscribes[`${name}[${index}]`]();
						});
						return;
					}
					this.unsubscribes[name] && this.unsubscribes[name]();
				});
			}
		};

		const singleRegisteredFields = (value) => {
			function isSubscribe(dependedItem, value) {
				if (!!dependedItem.show) {
					return dependedItem.show.indexOf(value) !== -1;
				}
				if (!!dependedItem.hide) {
					return dependedItem.hide.indexOf(value) === -1;
				}

				return false;
			}

			dependedItems.forEach((dependedItem) => {
				if (!!dependedItem.show && !!dependedItem.hide) {
					throw "Duplicate shown and hide";
				}

				const isSubscribeItem = isSubscribe(dependedItem, value);

				if (isSubscribeItem) {
					// subscribe
					const subscribeItems = this.controls.filter(
						({ name }) => dependedItem.targets.indexOf(name) !== -1
					);
					subscribeItems.forEach((item) => {
						this.unsubscribing[FieldControls.getRawName(item.name)] = false;
						this.registerField(item);
					});
				} else {
					// unsubscribe
					Object.keys(this.unsubscribes)
						.filter((name) => dependedItem.targets.indexOf(name) !== -1)
						.forEach((name) => {
							this.unsubscribing[FieldControls.getRawName(name)] = true;
							this.unsubscribes[name] && this.unsubscribes[name]();
						});
				}
			});
		};

		dependedItems
			.filter(({ controller }) => names.indexOf(controller) !== -1)
			.forEach((dependedItem) => {
				const controllerName = dependedItem.controller;
				const value = formState.values[controllerName];
				if (Array.isArray(value)) {
					multiRegisteredFields(value, dependedItem, controllerName);
				} else {
					singleRegisteredFields(value);
				}
			});
	}

	private async send(values: Record<string, any>) {
		this.formatValues(values);

		const body = JSON.stringify({
			token: this.token,
			user_email: this._fieldValuesCollection.get(this.config.AUTO_REPLY_TARGET).value,
			values: Array.from(this._fieldValuesCollection)
				.map((item) => item[1])
				.filter((item) => !!item.value),
		});

		return fetch(this.setEndPoint("send"), {
			method: "POST",
			headers: {
				"Content-Type": "Content-Type: application/json",
			},
			body,
		});
	}

	private config: FieldControlsConfig = {
		ENDPOINT: "/wp-json/mytheme/contact",
		FIELD: "data-field",
		FIELD_CONTROL: "data-field-control",
		FIELD_REGISTRATION: "data-field-registration",
		FIELD_ERROR: "data-field-error",
		FIELD_LABEL: "data-field-label",
		AUTO_REPLY_TARGET: "email",
	};

	private $root!: HTMLElement;
	private controls = [];
	private hiddenItemNamesForInit = [];
	private unsubscribing = {};
	private unsubscribes = {};
	private fieldItemsCollection = new Map<string, FieldItemsCollection>();
	private _fieldValuesCollection = new Map<
		string,
		{
			label: string;
			value: string;
		}
	>();
	private fieldData: FieldData = {
		dependedItems: [],
		initialValues: {},
		errorMessages: { base: {} },
		validations: {},
	};
	private patternValidations: PatternValidation = [
		["email", REGEXP_EMAIL],
		["phone", REGEXP_PHONENUMBER],
		["phone:hyphen", REGEXP_PHONENUMBER_WITH_HYPHEN],
		["alphabet", REGEXP_ALPHABET],
		["alphanumeric", REGEXP_ALPHANUMERIC],
		["zenkaku", REGEXP_ZENKAKU],
		["katakana", REGEXP_KATAKANA],
		["hiragana", REGEXP_KANA],
		["zipcode", REGEXP_ZIPCODE],
	];
	private token = "";

	constructor({
		customValidations = [],
		config,
	}: {
		customValidations?: PatternValidation;
		config?: FieldControlsConfig;
	}) {
		Object.assign(this.config, config);
		Object.freeze(this.config);

		this.patternValidations.push(...customValidations);
	}

	public formApi: FinalForm.FormApi = null;

	public get fieldValuesCollection(): Map<string, { label: string; value: string }> {
		return this._fieldValuesCollection;
	}

	public formatValues(values: Record<string, any>) {
		this.fieldItemsCollection.forEach((item, key) => {
			let value = values[key];
			if (item.type === "checkbox") {
				value = item.options.data
					.filter((_, index) => values[key][index])
					.map(({ value }) => value)
					.join(", ");
			}

			if (!item.validations.some((validation) => validation.indexOf("same") !== -1)) {
				this.fieldValuesCollection.set(key, {
					label: item.label,
					value,
				});
			}
		});
	}

	public async build(
		$root: HTMLElement,
		{
			customInitialValues,
			onError,
			onValidate,
		}: {
			customInitialValues?: (initialValues: Record<string, any>) => Record<string, any>;
			onError: (e) => void;
			onValidate: (values: Record<string, any>) => void;
		}
	) {
		try {
			const res = await FieldControls.getFieldData(this.setEndPoint("field_data"));
			if (!res.fieldData) {
				throw new Error(res.message);
			}

			Object.assign(this.fieldData, res.fieldData);

			this.token = res.token;
			this.$root = $root;

			this.getFieldItemsData(
				this.$root.querySelectorAll(`[${this.config.FIELD}]`),
				this.fieldData
			).forEach((item) => {
				this.fieldItemsCollection.set(item.name, item);
			});

			// hide field items if set depended items
			const hiddenItemNames = FieldControls.setHiddenItemNames(
				this.fieldData.dependedItems,
				this.fieldData.initialValues
			);
			this.hiddenItemNamesForInit.push(...hiddenItemNames);
			Object.assign(this.unsubscribing, FieldControls.setUnsubscribing(hiddenItemNames));

			this.formApi = FinalForm.createForm({
				initialValues: ((initialValues) => {
					if (customInitialValues) {
						return customInitialValues(initialValues);
					}
					return initialValues;
				})(this.fieldData.initialValues),
				validateOnBlur: true,
				onSubmit: (values) => this.send(values),
				validate: (values: Record<string, string>) => {
					const errors = this.validation(values, this.fieldData);
					onValidate(errors);
					return errors;
				},
			});

			this.controls.push(...this.$root.querySelectorAll(`[${this.config.FIELD_CONTROL}]`));
			this.controls.forEach((input) => {
				this.registerField(input);
			});

			this.formApi.subscribe(
				(formState) => {
					this.toggleSubscription(formState);
				},
				{
					// FormSubscription: the list of values you want to be updated about
					dirty: true,
					valid: true,
					values: true,
					submitSucceeded: true,
				}
			);
		} catch (e) {
			onError(e);
		}
	}
}
