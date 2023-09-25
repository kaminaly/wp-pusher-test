type FieldDataResponse = {
	message: string;
	token?: string;
	fieldData?: FieldData;
};

type FieldType =
	// text ---------
	| "text"
	| "email"
	| "tel"
	| "url"
	| "password"
	// datetime ---------
	| "date"
	| "datetime-local"
	| "month"
	| "time"
	| "week"
	// selection ---------
	| "checkbox"
	| "radio"
	| "select"
	// others ---------
	| "textarea"
	| "range";

type DependedItem = {
	controller: string;
	targets: string[];
	show?: string[];
	hide?: string[];
};

type FieldItem = {
	type: FieldType;
	name: string;
	label: string;
	validations?: string[];
	options?: {
		initial_value?: any;
		placeholder?: string;
		data?: { label: string; value: string; attrs?: Record<string, any> }[];
		attrs?: Record<string, any>;
	};
};

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type FieldData = {
	validations: Record<string, string[]>;
	dependedItems: DependedItem[];
	errorMessages: {
		base: Record<string, string>;
		[key: string]: string | Record<string, string>;
	};
	initialValues: Record<string, string>;
};
type FieldItemsCollection = {
	name: string;
	label: string;
	type: string;
	validations: string[];
	options: {
		data?: {
			label: string;
			value: string;
		}[];
	};
};

type FieldControlsConfig = {
	ENDPOINT: string;
	FIELD: string;
	FIELD_CONTROL: string;
	FIELD_REGISTRATION: string;
	FIELD_ERROR: string;
	FIELD_LABEL: string;
	AUTO_REPLY_TARGET: string;
};

type PatternValidation = [string, RegExp][];
